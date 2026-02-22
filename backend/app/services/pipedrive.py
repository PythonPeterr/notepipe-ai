"""Pipedrive REST API client for CRM operations.

Contacts are "Persons", companies are "Organizations", and notes attach to persons.
API base: https://{company_domain}.pipedrive.com/api/v1/
Auth: Bearer token.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import get_settings
from app.services.http import api_retry


# ---------------------------------------------------------------------------
# Token Refresh
# ---------------------------------------------------------------------------

@api_retry
async def refresh_pipedrive_token(refresh_token: str) -> dict[str, Any]:
    """Exchange a Pipedrive refresh token for a new access token.

    Returns:
        Dict with access_token, refresh_token, and expires_in.
    """
    settings = get_settings()
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://oauth.pipedrive.com/oauth/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            auth=(settings.pipedrive_client_id, settings.pipedrive_client_secret),
        )
        response.raise_for_status()

    return response.json()


async def ensure_valid_token(
    access_token: str,
    refresh_token: str | None,
    token_expires_at: str | None,
    user_id: str,
    supabase: Any,
) -> str:
    """Check token expiry and refresh if needed. Returns a valid access token.

    Updates the connections table in Supabase if a refresh occurs.
    """
    if token_expires_at and refresh_token:
        expires_at = datetime.fromisoformat(token_expires_at.replace("Z", "+00:00"))
        if expires_at < datetime.now(timezone.utc) + timedelta(minutes=5):
            new_tokens = await refresh_pipedrive_token(refresh_token)
            new_expires_at = (
                datetime.now(timezone.utc) + timedelta(seconds=new_tokens["expires_in"])
            ).isoformat()

            supabase.table("connections").update({
                "access_token": new_tokens["access_token"],
                "refresh_token": new_tokens["refresh_token"],
                "token_expires_at": new_expires_at,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("user_id", user_id).eq("service", "pipedrive").execute()

            return new_tokens["access_token"]

    return access_token


def _base_url(company_domain: str) -> str:
    """Build the Pipedrive API base URL from the company domain."""
    return f"https://{company_domain}.pipedrive.com/api/v1"


# ---------------------------------------------------------------------------
# Person (Contact) Operations
# ---------------------------------------------------------------------------

@api_retry
async def search_person(email: str, token: str, company_domain: str) -> dict[str, Any] | None:
    """Search for an existing Pipedrive person by email.

    Returns:
        The first matching person dict, or None.
    """
    headers = {"Authorization": f"Bearer {token}"}
    base = _base_url(company_domain)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{base}/persons/search",
            params={"term": email, "fields": "email", "limit": 1},
            headers=headers,
        )
        response.raise_for_status()

    data = response.json()
    items = data.get("data", {}).get("items", [])
    return items[0].get("item") if items else None


@api_retry
async def create_person(contact: dict[str, Any], token: str, company_domain: str) -> str:
    """Create a new Pipedrive person.

    Returns:
        The new person ID as a string.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = _base_url(company_domain)

    payload: dict[str, Any] = {
        "name": contact.get("name", ""),
        "email": [{"value": contact.get("email", ""), "primary": True}],
    }

    if contact.get("phone"):
        payload["phone"] = [{"value": contact["phone"], "primary": True}]

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/persons",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

    return str(response.json()["data"]["id"])


@api_retry
async def update_person(
    person_id: str,
    contact: dict[str, Any],
    token: str,
    company_domain: str,
) -> str:
    """Update an existing Pipedrive person.

    Returns:
        The person ID.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = _base_url(company_domain)

    payload: dict[str, Any] = {"name": contact.get("name", "")}

    if contact.get("email"):
        payload["email"] = [{"value": contact["email"], "primary": True}]
    if contact.get("phone"):
        payload["phone"] = [{"value": contact["phone"], "primary": True}]

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.put(
            f"{base}/persons/{person_id}",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

    return person_id


# ---------------------------------------------------------------------------
# Organization (Company) Operations
# ---------------------------------------------------------------------------

@api_retry
async def search_organization(
    name: str,
    token: str,
    company_domain: str,
) -> dict[str, Any] | None:
    """Search for an existing Pipedrive organization by name.

    Returns:
        The first matching organization dict, or None.
    """
    headers = {"Authorization": f"Bearer {token}"}
    base = _base_url(company_domain)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{base}/organizations/search",
            params={"term": name, "limit": 1},
            headers=headers,
        )
        response.raise_for_status()

    data = response.json()
    items = data.get("data", {}).get("items", [])
    return items[0].get("item") if items else None


@api_retry
async def create_organization(
    company: dict[str, Any],
    token: str,
    company_domain: str,
) -> str:
    """Create a new Pipedrive organization.

    Returns:
        The new organization ID as a string.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = _base_url(company_domain)

    payload: dict[str, Any] = {"name": company.get("name", "")}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/organizations",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

    return str(response.json()["data"]["id"])


# ---------------------------------------------------------------------------
# Association Operations
# ---------------------------------------------------------------------------

async def link_person_to_organization(
    person_id: str,
    org_id: str,
    token: str,
    company_domain: str,
) -> None:
    """Link a person to an organization in Pipedrive.

    Updates the person's org_id field.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = _base_url(company_domain)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.put(
            f"{base}/persons/{person_id}",
            json={"org_id": int(org_id)},
            headers=headers,
        )
        response.raise_for_status()


# ---------------------------------------------------------------------------
# Note Operations
# ---------------------------------------------------------------------------

@api_retry
async def create_note(
    body: str,
    person_id: str,
    token: str,
    company_domain: str,
) -> str:
    """Create a Pipedrive note attached to a person.

    Returns:
        The new note ID as a string.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = _base_url(company_domain)

    payload = {
        "content": body,
        "person_id": int(person_id),
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/notes",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

    return str(response.json()["data"]["id"])


# ---------------------------------------------------------------------------
# Deal Operations
# ---------------------------------------------------------------------------

async def search_deal(
    term: str, token: str, company_domain: str
) -> dict[str, Any] | None:
    """Search for an existing Pipedrive deal by term.

    Returns:
        The first matching deal dict, or None.
    """
    headers = {"Authorization": f"Bearer {token}"}
    base = _base_url(company_domain)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{base}/deals/search",
            params={"term": term, "limit": 1},
            headers=headers,
        )
        response.raise_for_status()

    data = response.json()
    items = data.get("data", {}).get("items", [])
    return items[0].get("item") if items else None


async def create_deal(
    title: str,
    stage_name: str,
    token: str,
    company_domain: str,
    person_id: str | None = None,
    org_id: str | None = None,
) -> str:
    """Create a new Pipedrive deal.

    Returns:
        The new deal ID as a string.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = _base_url(company_domain)

    payload: dict[str, Any] = {
        "title": title,
        "status": "open",
    }

    if person_id:
        payload["person_id"] = int(person_id)
    if org_id:
        payload["org_id"] = int(org_id)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/deals",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

    return str(response.json()["data"]["id"])


async def update_deal_stage_name(
    deal_id: str, stage_name: str, token: str, company_domain: str
) -> str:
    """Update a Pipedrive deal's title to reflect stage (Pipedrive stages are pipeline-dependent).

    Returns:
        The deal ID.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = _base_url(company_domain)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.put(
            f"{base}/deals/{deal_id}",
            json={"status": "open"},
            headers=headers,
        )
        response.raise_for_status()

    return deal_id


# ---------------------------------------------------------------------------
# Activity (Meeting) Operations
# ---------------------------------------------------------------------------

async def create_activity(
    subject: str,
    note: str,
    token: str,
    company_domain: str,
    person_id: str | None = None,
    org_id: str | None = None,
) -> str:
    """Create a Pipedrive activity of type 'meeting'.

    Returns:
        The new activity ID as a string.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = _base_url(company_domain)

    payload: dict[str, Any] = {
        "type": "meeting",
        "subject": subject,
        "note": note,
        "done": True,
    }

    if person_id:
        payload["person_id"] = int(person_id)
    if org_id:
        payload["org_id"] = int(org_id)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{base}/activities",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

    return str(response.json()["data"]["id"])


# ---------------------------------------------------------------------------
# High-level Write Orchestrator
# ---------------------------------------------------------------------------

async def write(
    data: dict[str, Any],
    token: str,
    metadata: dict[str, Any],
    actions: dict[str, Any],
) -> dict[str, Any]:
    """Write extracted data to Pipedrive according to enabled CRM actions.

    Implements upsert: search before create for persons and organizations.

    Args:
        data: The LLM-extracted data dict.
        token: Valid Pipedrive access token.
        metadata: Connection metadata containing company_domain.
        actions: CRM actions configuration.

    Returns:
        Dict of created/found resource IDs and any errors.
    """
    company_domain = metadata.get("company_domain", "")
    if not company_domain:
        return {"errors": ["Pipedrive company_domain is not configured"]}

    results: dict[str, Any] = {}
    errors: list[str] = []

    contact_data = data.get("contact", {})
    company_data = data.get("company", {})
    meeting_summary = data.get("meeting_summary", "")

    # --- Person (Contact) ---
    if actions.get("create_contact", True) and contact_data.get("email"):
        try:
            existing = await search_person(contact_data["email"], token, company_domain)
            if existing:
                person_id = str(existing["id"])
                await update_person(person_id, contact_data, token, company_domain)
                results["contact_id"] = person_id
            else:
                results["contact_id"] = await create_person(
                    contact_data, token, company_domain
                )
        except Exception as exc:
            errors.append(f"Person error: {exc}")

    # --- Organization (Company) ---
    if actions.get("create_company", True) and company_data.get("name"):
        try:
            existing = await search_organization(
                company_data["name"], token, company_domain
            )
            if existing:
                results["company_id"] = str(existing["id"])
            else:
                results["company_id"] = await create_organization(
                    company_data, token, company_domain
                )
        except Exception as exc:
            errors.append(f"Organization error: {exc}")

    # --- Link Person to Organization ---
    if actions.get("link_contact_to_company", False) and results.get("contact_id") and results.get("company_id"):
        try:
            await link_person_to_organization(
                results["contact_id"], results["company_id"], token, company_domain
            )
        except Exception as exc:
            errors.append(f"Person-Organization link error: {exc}")

    # --- Note ---
    if actions.get("attach_note", True) and results.get("contact_id") and meeting_summary:
        try:
            follow_ups = data.get("follow_ups", [])
            note_body = meeting_summary
            if follow_ups:
                follow_up_lines = "\n".join(
                    f"- [{fu.get('owner', 'TBD')}] {fu.get('action', '')}"
                    + (f" (due: {fu['due_date']})" if fu.get("due_date") else "")
                    for fu in follow_ups
                )
                note_body += f"\n\nFollow-ups:\n{follow_up_lines}"

            results["note_id"] = await create_note(
                note_body, results["contact_id"], token, company_domain
            )
        except Exception as exc:
            errors.append(f"Note error: {exc}")

    # --- Deal ---
    if (actions.get("create_deal", False) or actions.get("update_deal_stage", False)) and data.get("deal_stage"):
        try:
            deal_name = meeting_summary[:100] if meeting_summary else "New Deal"
            existing_deal = await search_deal(deal_name, token, company_domain)
            if existing_deal and actions.get("update_deal_stage", False):
                deal_id = str(existing_deal["id"])
                await update_deal_stage_name(deal_id, data["deal_stage"], token, company_domain)
                results["deal_id"] = deal_id
            elif not existing_deal and actions.get("create_deal", False):
                results["deal_id"] = await create_deal(
                    title=deal_name,
                    stage_name=data["deal_stage"],
                    token=token,
                    company_domain=company_domain,
                    person_id=results.get("contact_id"),
                    org_id=results.get("company_id"),
                )
        except Exception as exc:
            errors.append(f"Deal error: {exc}")

    # --- Meeting Activity ---
    if actions.get("log_meeting", False) and meeting_summary:
        try:
            follow_ups = data.get("follow_ups", [])
            note_body = meeting_summary
            if follow_ups:
                follow_up_lines = "\n".join(
                    f"- [{fu.get('owner', 'TBD')}] {fu.get('action', '')}"
                    + (f" (due: {fu['due_date']})" if fu.get("due_date") else "")
                    for fu in follow_ups
                )
                note_body += f"\n\nFollow-ups:\n{follow_up_lines}"

            results["meeting_id"] = await create_activity(
                subject="Meeting Log — Notepipe",
                note=note_body,
                token=token,
                company_domain=company_domain,
                person_id=results.get("contact_id"),
                org_id=results.get("company_id"),
            )
        except Exception as exc:
            errors.append(f"Activity error: {exc}")

    if errors:
        results["errors"] = errors

    return results
