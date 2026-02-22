"""Zoho CRM REST API v8 client for CRM operations.

API reference: https://www.zoho.com/crm/developer/docs/api/v8/
Auth header: Authorization: Zoho-oauthtoken {token}
Modules: Contacts (Last_Name required), Accounts (Account_Name required),
         Deals (Deal_Name + Stage required), Notes (Note_Content required).
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import get_settings
from app.services.http import api_retry

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Token Refresh
# ---------------------------------------------------------------------------

@api_retry
async def refresh_zoho_token(
    refresh_token: str, accounts_server: str = "https://accounts.zoho.com"
) -> dict[str, Any]:
    """Exchange a Zoho refresh token for a new access token.

    Zoho refresh tokens never rotate — the same refresh_token is reused.

    Args:
        refresh_token: The stored refresh token.
        accounts_server: The user's Zoho accounts server (region-specific).

    Returns:
        Dict with access_token, expires_in, api_domain, token_type.
    """
    settings = get_settings()
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{accounts_server}/oauth/v2/token",
            data={
                "grant_type": "refresh_token",
                "client_id": settings.zoho_client_id,
                "client_secret": settings.zoho_client_secret,
                "refresh_token": refresh_token,
            },
        )
        response.raise_for_status()

    return response.json()


async def ensure_valid_token(
    access_token: str,
    refresh_token: str | None,
    token_expires_at: str | None,
    user_id: str,
    supabase: Any,
    metadata: dict[str, Any] | None = None,
) -> str:
    """Check token expiry and refresh if needed. Returns a valid access token.

    Zoho access tokens expire after 1 hour. Refresh tokens never expire
    and are not rotated — only the access_token is updated.
    """
    if token_expires_at and refresh_token:
        expires_at = datetime.fromisoformat(
            token_expires_at.replace("Z", "+00:00")
        )
        if expires_at < datetime.now(timezone.utc) + timedelta(minutes=5):
            accounts_server = (metadata or {}).get(
                "accounts_server", "https://accounts.zoho.com"
            )
            new_tokens = await refresh_zoho_token(refresh_token, accounts_server)
            new_expires_at = (
                datetime.now(timezone.utc)
                + timedelta(seconds=new_tokens["expires_in"])
            ).isoformat()

            # Zoho does NOT rotate refresh tokens — only update access_token
            supabase.table("connections").update({
                "access_token": new_tokens["access_token"],
                "token_expires_at": new_expires_at,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("user_id", user_id).eq("service", "zoho").execute()

            return new_tokens["access_token"]

    return access_token


def _auth_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Zoho-oauthtoken {token}",
        "Content-Type": "application/json",
    }


def _api_base(metadata: dict[str, Any] | None = None) -> str:
    """Return the Zoho CRM API base URL from connection metadata."""
    api_domain = (metadata or {}).get("api_domain", "https://www.zohoapis.com")
    return f"{api_domain}/crm/v8"


# ---------------------------------------------------------------------------
# Contact Operations
# ---------------------------------------------------------------------------

@api_retry
async def search_contact(
    email: str, token: str, metadata: dict[str, Any] | None = None
) -> dict[str, Any] | None:
    """Search for an existing Zoho contact by email.

    Returns:
        The first matching contact dict, or None.
    """
    base = _api_base(metadata)
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{base}/Contacts/search",
            params={"email": email},
            headers=_auth_headers(token),
        )

    if response.status_code == 204:
        return None
    response.raise_for_status()

    data = response.json().get("data", [])
    return data[0] if data else None


@api_retry
async def upsert_contact(
    contact: dict[str, Any], token: str, metadata: dict[str, Any] | None = None
) -> str:
    """Upsert a Zoho contact (dedup by Email).

    Returns:
        The contact record ID.
    """
    base = _api_base(metadata)
    name_parts = contact.get("name", "").split(" ", 1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else first_name

    record: dict[str, Any] = {
        "Last_Name": last_name,
        "First_Name": first_name,
        "Email": contact.get("email", ""),
    }

    if contact.get("phone"):
        record["Phone"] = contact["phone"]
    if contact.get("title"):
        record["Title"] = contact["title"]

    payload = {
        "data": [record],
        "duplicate_check_fields": ["Email"],
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/Contacts/upsert",
            json=payload,
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    result = response.json()["data"][0]
    return result["details"]["id"]


# ---------------------------------------------------------------------------
# Account (Company) Operations
# ---------------------------------------------------------------------------

@api_retry
async def upsert_account(
    company: dict[str, Any], token: str, metadata: dict[str, Any] | None = None
) -> str:
    """Upsert a Zoho account (dedup by Account_Name).

    Returns:
        The account record ID.
    """
    base = _api_base(metadata)
    record: dict[str, Any] = {
        "Account_Name": company.get("name", ""),
    }

    if company.get("domain"):
        record["Website"] = company["domain"]
    if company.get("industry"):
        record["Industry"] = company["industry"]

    payload = {
        "data": [record],
        "duplicate_check_fields": ["Account_Name"],
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/Accounts/upsert",
            json=payload,
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    result = response.json()["data"][0]
    return result["details"]["id"]


# ---------------------------------------------------------------------------
# Association Operations
# ---------------------------------------------------------------------------

async def link_contact_to_account(
    contact_id: str,
    account_id: str,
    token: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Link a Zoho contact to an account by updating the contact's Account_Name field."""
    base = _api_base(metadata)

    record = {
        "Account_Name": {"id": account_id},
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.put(
            f"{base}/Contacts/{contact_id}",
            json={"data": [record]},
            headers=_auth_headers(token),
        )
        response.raise_for_status()


# ---------------------------------------------------------------------------
# Note Operations
# ---------------------------------------------------------------------------

def format_note_body(
    meeting_summary: str,
    follow_ups: list[dict[str, Any]] | None = None,
) -> str:
    """Build a plain-text note body for Zoho."""
    parts: list[str] = []

    parts.append("Meeting Summary")
    parts.append("=" * 40)
    parts.append(meeting_summary)

    if follow_ups:
        parts.append("")
        parts.append("Follow-ups")
        parts.append("-" * 40)
        for fu in follow_ups:
            owner = fu.get("owner", "TBD")
            action = fu.get("action", "")
            due = fu.get("due_date")
            due_text = f" (by {due})" if due else ""
            parts.append(f"- {owner}: {action}{due_text}")

    parts.append("")
    parts.append("— Extracted by Notepipe")

    return "\n".join(parts)


@api_retry
async def create_note(
    body: str,
    parent_module: str,
    parent_id: str,
    token: str,
    metadata: dict[str, Any] | None = None,
    title: str | None = None,
) -> str:
    """Create a Zoho note attached to a record.

    Args:
        body: The note content.
        parent_module: Module API name (e.g. "Contacts", "Deals").
        parent_id: The record ID to attach the note to.
        token: Valid Zoho access token.
        metadata: Connection metadata (for api_domain).
        title: Optional note title.

    Returns:
        The new note ID.
    """
    base = _api_base(metadata)
    record: dict[str, Any] = {
        "Note_Content": body,
    }

    if title:
        record["Note_Title"] = title

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/{parent_module}/{parent_id}/Notes",
            json={"data": [record]},
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    result = response.json()["data"][0]
    return result["details"]["id"]


# ---------------------------------------------------------------------------
# Deal Operations
# ---------------------------------------------------------------------------

@api_retry
async def upsert_deal(
    deal_name: str,
    stage: str,
    token: str,
    metadata: dict[str, Any] | None = None,
    account_name: str | None = None,
    contact_id: str | None = None,
) -> str:
    """Upsert a Zoho deal (dedup by Deal_Name).

    Returns:
        The deal record ID.
    """
    base = _api_base(metadata)
    record: dict[str, Any] = {
        "Deal_Name": deal_name,
        "Stage": stage,
    }

    if account_name:
        record["Account_Name"] = account_name
    if contact_id:
        record["Contact_Name"] = {"id": contact_id}

    payload = {
        "data": [record],
        "duplicate_check_fields": ["Deal_Name"],
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/Deals/upsert",
            json=payload,
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    result = response.json()["data"][0]
    return result["details"]["id"]


# ---------------------------------------------------------------------------
# Event (Meeting) Operations
# ---------------------------------------------------------------------------

async def create_event(
    title: str,
    description: str,
    token: str,
    metadata: dict[str, Any] | None = None,
    contact_id: str | None = None,
) -> str:
    """Create a Zoho event (meeting log).

    Returns:
        The event record ID.
    """
    base = _api_base(metadata)

    record: dict[str, Any] = {
        "Event_Title": title,
        "Description": description,
    }

    if contact_id:
        record["$se_module"] = "Contacts"
        record["Who_Id"] = {"id": contact_id}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/Events",
            json={"data": [record]},
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    result = response.json()["data"][0]
    return result["details"]["id"]


# ---------------------------------------------------------------------------
# High-level Write Orchestrator
# ---------------------------------------------------------------------------

async def write(
    data: dict[str, Any],
    token: str,
    metadata: dict[str, Any] | None,
    actions: dict[str, Any],
) -> dict[str, Any]:
    """Write extracted data to Zoho CRM according to enabled CRM actions.

    Follows the same pattern as hubspot.write() and pipedrive.write():
    upsert contact, upsert account, link them, create note, handle deals.

    Args:
        data: The LLM-extracted data dict.
        token: Valid Zoho access token.
        metadata: Connection metadata (api_domain, accounts_server).
        actions: CRM actions configuration.

    Returns:
        Dict of created/found resource IDs and any errors.
    """
    results: dict[str, Any] = {}
    errors: list[str] = []

    contact_data = data.get("contact", {})
    company_data = data.get("company", {})
    meeting_summary = data.get("meeting_summary", "")
    follow_ups = data.get("follow_ups", [])
    deal_stage = data.get("deal_stage")

    # --- Contact ---
    if actions.get("create_contact", True) and contact_data.get("email"):
        try:
            results["contact_id"] = await upsert_contact(
                contact_data, token, metadata
            )
        except Exception as exc:
            errors.append(f"Contact error: {exc}")

    # --- Account (Company) ---
    if actions.get("create_company", True) and company_data.get("name"):
        try:
            results["company_id"] = await upsert_account(
                company_data, token, metadata
            )
        except Exception as exc:
            errors.append(f"Account error: {exc}")

    # --- Link Contact to Account ---
    if actions.get("link_contact_to_company", False) and results.get("contact_id") and results.get("company_id"):
        try:
            await link_contact_to_account(
                results["contact_id"], results["company_id"], token, metadata
            )
        except Exception as exc:
            errors.append(f"Contact-Account link error: {exc}")

    # --- Deal ---
    if (actions.get("create_deal", False) or actions.get("update_deal_stage", False)) and deal_stage:
        try:
            deal_name = meeting_summary[:100] if meeting_summary else "New Deal"
            # Zoho upsert_deal handles both create and update via dedup
            # Only run if either action is enabled
            results["deal_id"] = await upsert_deal(
                deal_name=deal_name,
                stage=deal_stage,
                token=token,
                metadata=metadata,
                account_name=company_data.get("name"),
                contact_id=results.get("contact_id"),
            )
        except Exception as exc:
            errors.append(f"Deal error: {exc}")

    # --- Note ---
    if actions.get("attach_note", True) and meeting_summary:
        try:
            note_body = format_note_body(meeting_summary, follow_ups)

            # Attach to contact if available, else to deal or account
            parent_module = "Contacts"
            parent_id = results.get("contact_id")
            if not parent_id:
                if results.get("deal_id"):
                    parent_module = "Deals"
                    parent_id = results["deal_id"]
                elif results.get("company_id"):
                    parent_module = "Accounts"
                    parent_id = results["company_id"]

            if parent_id:
                results["note_id"] = await create_note(
                    body=note_body,
                    parent_module=parent_module,
                    parent_id=parent_id,
                    token=token,
                    metadata=metadata,
                    title="Meeting Notes — Notepipe",
                )
            else:
                errors.append("Note skipped: no parent record to attach to")
        except Exception as exc:
            errors.append(f"Note error: {exc}")

    # --- Meeting Event ---
    if actions.get("log_meeting", False) and meeting_summary:
        try:
            results["meeting_id"] = await create_event(
                title="Meeting Log — Notepipe",
                description=format_note_body(meeting_summary, follow_ups),
                token=token,
                metadata=metadata,
                contact_id=results.get("contact_id"),
            )
        except Exception as exc:
            errors.append(f"Event error: {exc}")

    if errors:
        results["errors"] = errors

    return results
