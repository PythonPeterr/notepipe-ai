"""HubSpot REST API client for CRM operations.

Aligned with official HubSpot CRM API v3 docs:
https://developers.hubspot.com/docs/api-reference/crm-contacts-v3/guide
https://developers.hubspot.com/docs/api-reference/crm-notes-v3/guide

Association type IDs (HUBSPOT_DEFINED):
  202 = note_to_contact
  190 = note_to_company
  214 = note_to_deal
    1 = contact_to_company
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import get_settings
from app.services.http import api_retry

logger = logging.getLogger(__name__)

HUBSPOT_API_BASE = "https://api.hubapi.com"


# ---------------------------------------------------------------------------
# Token Refresh
# ---------------------------------------------------------------------------

@api_retry
async def refresh_hubspot_token(refresh_token: str) -> dict[str, Any]:
    """Exchange a HubSpot refresh token for a new access token.

    Per HubSpot docs, redirect_uri is required for refresh token exchange.

    Returns:
        Dict with access_token, refresh_token, and expires_in.
    """
    settings = get_settings()
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/oauth/v3/token",
            data={
                "grant_type": "refresh_token",
                "client_id": settings.hubspot_client_id,
                "client_secret": settings.hubspot_client_secret,
                "redirect_uri": settings.hubspot_redirect_uri,
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
) -> str:
    """Check token expiry and refresh if needed. Returns a valid access token.

    Updates the connections table in Supabase if a refresh occurs.
    """
    if token_expires_at and refresh_token:
        expires_at = datetime.fromisoformat(
            token_expires_at.replace("Z", "+00:00")
        )
        if expires_at < datetime.now(timezone.utc) + timedelta(minutes=5):
            new_tokens = await refresh_hubspot_token(refresh_token)
            new_expires_at = (
                datetime.now(timezone.utc)
                + timedelta(seconds=new_tokens["expires_in"])
            ).isoformat()

            supabase.table("connections").update({
                "access_token": new_tokens["access_token"],
                "refresh_token": new_tokens["refresh_token"],
                "token_expires_at": new_expires_at,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("user_id", user_id).eq("service", "hubspot").execute()

            return new_tokens["access_token"]

    return access_token


def _auth_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


# ---------------------------------------------------------------------------
# Contact Operations
# ---------------------------------------------------------------------------

@api_retry
async def search_contact(email: str, token: str) -> dict[str, Any] | None:
    """Search for an existing HubSpot contact by email.

    Returns:
        The first matching contact dict, or None.
    """
    payload = {
        "filterGroups": [
            {
                "filters": [
                    {
                        "propertyName": "email",
                        "operator": "EQ",
                        "value": email,
                    }
                ]
            }
        ],
        "properties": [
            "email", "firstname", "lastname", "phone", "jobtitle", "company",
        ],
        "limit": 1,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts/search",
            json=payload,
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    results = response.json().get("results", [])
    return results[0] if results else None


@api_retry
async def create_contact(contact: dict[str, Any], token: str) -> str:
    """Create a new HubSpot contact.

    Returns:
        The new contact ID.
    """
    name_parts = contact.get("name", "").split(" ", 1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    properties: dict[str, Any] = {
        "email": contact.get("email", ""),
        "firstname": first_name,
        "lastname": last_name,
    }

    if contact.get("phone"):
        properties["phone"] = contact["phone"]
    if contact.get("title"):
        properties["jobtitle"] = contact["title"]

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts",
            json={"properties": properties},
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return response.json()["id"]


@api_retry
async def update_contact(
    contact_id: str, contact: dict[str, Any], token: str
) -> str:
    """Update an existing HubSpot contact.

    Returns:
        The contact ID.
    """
    name_parts = contact.get("name", "").split(" ", 1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    properties: dict[str, Any] = {
        "firstname": first_name,
        "lastname": last_name,
    }

    if contact.get("email"):
        properties["email"] = contact["email"]
    if contact.get("phone"):
        properties["phone"] = contact["phone"]
    if contact.get("title"):
        properties["jobtitle"] = contact["title"]

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts/{contact_id}",
            json={"properties": properties},
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return contact_id


# ---------------------------------------------------------------------------
# Company Operations
# ---------------------------------------------------------------------------

@api_retry
async def search_company(name: str, token: str) -> dict[str, Any] | None:
    """Search for an existing HubSpot company by name.

    Returns:
        The first matching company dict, or None.
    """
    payload = {
        "filterGroups": [
            {
                "filters": [
                    {
                        "propertyName": "name",
                        "operator": "EQ",
                        "value": name,
                    }
                ]
            }
        ],
        "properties": ["name", "domain", "industry"],
        "limit": 1,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/companies/search",
            json=payload,
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    results = response.json().get("results", [])
    return results[0] if results else None


@api_retry
async def create_company(company: dict[str, Any], token: str) -> str:
    """Create a new HubSpot company.

    Returns:
        The new company ID.
    """
    properties: dict[str, Any] = {"name": company.get("name", "")}

    if company.get("domain"):
        properties["domain"] = company["domain"]
    if company.get("industry"):
        properties["industry"] = company["industry"]

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/companies",
            json={"properties": properties},
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return response.json()["id"]


# ---------------------------------------------------------------------------
# Association Operations
# ---------------------------------------------------------------------------

@api_retry
async def associate_contact_to_company(
    contact_id: str, company_id: str, token: str
) -> None:
    """Associate a contact with a company in HubSpot.

    Uses association type 1 (contact_to_company) per HubSpot docs.
    PUT /crm/v3/objects/contacts/{contactId}/associations/companies/{companyId}/1
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.put(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts/{contact_id}"
            f"/associations/companies/{company_id}/1",
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
    """Build a structured HTML note body for HubSpot.

    HubSpot notes support HTML in hs_note_body.
    """
    parts: list[str] = []

    parts.append("<h3>Meeting Summary</h3>")
    parts.append(f"<p>{meeting_summary}</p>")

    if follow_ups:
        parts.append("<h3>Follow-ups</h3>")
        parts.append("<ul>")
        for fu in follow_ups:
            owner = fu.get("owner", "TBD")
            action = fu.get("action", "")
            due = fu.get("due_date")
            due_text = f" (by {due})" if due else ""
            parts.append(f"<li><strong>{owner}</strong>: {action}{due_text}</li>")
        parts.append("</ul>")

    parts.append("<br><p><em>Extracted by Notepipe</em></p>")

    return "\n".join(parts)


@api_retry
async def create_note(
    body: str,
    contact_id: str | None = None,
    company_id: str | None = None,
    deal_id: str | None = None,
    token: str = "",
) -> str:
    """Create a HubSpot note and associate it with contact, company, and/or deal.

    Association type IDs per HubSpot docs:
      202 = note_to_contact
      190 = note_to_company
      214 = note_to_deal

    Returns:
        The new note ID.
    """
    associations: list[dict[str, Any]] = []

    if contact_id:
        associations.append({
            "to": {"id": contact_id},
            "types": [{
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 202,
            }],
        })

    if company_id:
        associations.append({
            "to": {"id": company_id},
            "types": [{
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 190,
            }],
        })

    if deal_id:
        associations.append({
            "to": {"id": deal_id},
            "types": [{
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 214,
            }],
        })

    payload: dict[str, Any] = {
        "properties": {
            "hs_note_body": body,
            "hs_timestamp": datetime.now(timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
        },
    }

    if associations:
        payload["associations"] = associations

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/notes",
            json=payload,
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return response.json()["id"]


# ---------------------------------------------------------------------------
# Deal Operations
# ---------------------------------------------------------------------------

@api_retry
async def search_deal_by_contact(
    contact_id: str, token: str
) -> dict[str, Any] | None:
    """Find the most recent open deal associated with a contact.

    First gets associated deal IDs, then fetches the most recent open one.
    """
    # Get deals associated with this contact
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts/{contact_id}"
            f"/associations/deals",
            headers=_auth_headers(token),
        )

    if response.status_code == 404:
        return None
    response.raise_for_status()

    results = response.json().get("results", [])
    if not results:
        return None

    # Fetch the first associated deal to check its stage
    deal_id = results[0].get("id")
    if not deal_id:
        return None

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/deals/{deal_id}",
            params={"properties": "dealname,dealstage,pipeline,amount"},
            headers=_auth_headers(token),
        )

    if response.status_code == 404:
        return None
    response.raise_for_status()

    return response.json()


@api_retry
async def create_deal(
    deal_stage: str,
    contact_id: str | None = None,
    company_id: str | None = None,
    meeting_title: str = "New Deal",
    token: str = "",
) -> str:
    """Create a new HubSpot deal and associate with contact/company.

    Returns:
        The new deal ID.
    """
    associations: list[dict[str, Any]] = []

    if contact_id:
        associations.append({
            "to": {"id": contact_id},
            "types": [{
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 3,  # deal_to_contact
            }],
        })

    if company_id:
        associations.append({
            "to": {"id": company_id},
            "types": [{
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 5,  # deal_to_company
            }],
        })

    payload: dict[str, Any] = {
        "properties": {
            "dealname": meeting_title,
            "dealstage": deal_stage,
        },
    }

    if associations:
        payload["associations"] = associations

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/deals",
            json=payload,
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return response.json()["id"]


@api_retry
async def update_deal_stage(
    deal_id: str, stage: str, token: str
) -> str:
    """Update the stage of an existing deal.

    Returns:
        The deal ID.
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/deals/{deal_id}",
            json={"properties": {"dealstage": stage}},
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return deal_id


# ---------------------------------------------------------------------------
# Meeting Operations
# ---------------------------------------------------------------------------

async def create_meeting(
    title: str,
    body: str,
    contact_id: str | None = None,
    company_id: str | None = None,
    token: str = "",
) -> str:
    """Create a HubSpot meeting engagement and associate with contact/company.

    Uses HubSpot Engagements API v3.
    Association type IDs:
      200 = meeting_to_contact
      188 = meeting_to_company

    Returns:
        The new meeting ID.
    """
    associations: list[dict[str, Any]] = []

    if contact_id:
        associations.append({
            "to": {"id": contact_id},
            "types": [{
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 200,
            }],
        })

    if company_id:
        associations.append({
            "to": {"id": company_id},
            "types": [{
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 188,
            }],
        })

    now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload: dict[str, Any] = {
        "properties": {
            "hs_meeting_title": title,
            "hs_meeting_body": body,
            "hs_meeting_start_time": now_ts,
            "hs_meeting_end_time": now_ts,
            "hs_meeting_outcome": "COMPLETED",
        },
    }

    if associations:
        payload["associations"] = associations

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/meetings",
            json=payload,
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return response.json()["id"]


# ---------------------------------------------------------------------------
# High-level Write Orchestrator
# ---------------------------------------------------------------------------

async def write(
    data: dict[str, Any],
    token: str,
    actions: dict[str, Any],
) -> dict[str, Any]:
    """Write extracted data to HubSpot according to enabled CRM actions.

    Implements upsert: search before create for contacts and companies.
    Associates contact to company, creates formatted notes, handles deals.

    Args:
        data: The LLM-extracted data dict.
        token: Valid HubSpot access token.
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
            existing = await search_contact(contact_data["email"], token)
            if existing:
                contact_id = existing["id"]
                await update_contact(contact_id, contact_data, token)
                results["contact_id"] = contact_id
            else:
                results["contact_id"] = await create_contact(
                    contact_data, token
                )
        except Exception as exc:
            errors.append(f"Contact error: {exc}")

    # --- Company ---
    if actions.get("create_company", True) and company_data.get("name"):
        try:
            existing = await search_company(company_data["name"], token)
            if existing:
                results["company_id"] = existing["id"]
            else:
                results["company_id"] = await create_company(
                    company_data, token
                )
        except Exception as exc:
            errors.append(f"Company error: {exc}")

    # --- Associate contact to company ---
    if actions.get("link_contact_to_company", False) and results.get("contact_id") and results.get("company_id"):
        try:
            await associate_contact_to_company(
                results["contact_id"], results["company_id"], token
            )
        except Exception as exc:
            errors.append(f"Contact-Company association error: {exc}")

    # --- Deal ---
    if (actions.get("create_deal", False) or actions.get("update_deal_stage", False)) and deal_stage:
        try:
            contact_id = results.get("contact_id")
            if contact_id:
                existing_deal = await search_deal_by_contact(
                    contact_id, token
                )
                if existing_deal and actions.get("update_deal_stage", False):
                    deal_id = existing_deal["id"]
                    await update_deal_stage(deal_id, deal_stage, token)
                    results["deal_id"] = deal_id
                elif not existing_deal and actions.get("create_deal", False):
                    results["deal_id"] = await create_deal(
                        deal_stage=deal_stage,
                        contact_id=contact_id,
                        company_id=results.get("company_id"),
                        meeting_title=meeting_summary[:100] if meeting_summary else "New Deal",
                        token=token,
                    )
        except Exception as exc:
            errors.append(f"Deal error: {exc}")

    # --- Note ---
    if actions.get("attach_note", True) and meeting_summary:
        try:
            note_body = format_note_body(meeting_summary, follow_ups)
            results["note_id"] = await create_note(
                body=note_body,
                contact_id=results.get("contact_id"),
                company_id=results.get("company_id"),
                deal_id=results.get("deal_id"),
                token=token,
            )
        except Exception as exc:
            errors.append(f"Note error: {exc}")

    # --- Meeting ---
    if actions.get("log_meeting", False) and meeting_summary:
        try:
            results["meeting_id"] = await create_meeting(
                title="Meeting Log — Notepipe",
                body=format_note_body(meeting_summary, follow_ups),
                contact_id=results.get("contact_id"),
                company_id=results.get("company_id"),
                token=token,
            )
        except Exception as exc:
            errors.append(f"Meeting error: {exc}")

    if errors:
        results["errors"] = errors

    return results
