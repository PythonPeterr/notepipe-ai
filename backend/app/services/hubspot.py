"""HubSpot REST API client for CRM operations.

Implements upsert pattern: search before create for contacts and companies.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import get_settings

HUBSPOT_API_BASE = "https://api.hubapi.com"


# ---------------------------------------------------------------------------
# Token Refresh
# ---------------------------------------------------------------------------

async def refresh_hubspot_token(refresh_token: str) -> dict[str, Any]:
    """Exchange a HubSpot refresh token for a new access token.

    Returns:
        Dict with access_token, refresh_token, and expires_in.
    """
    settings = get_settings()
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/oauth/v1/token",
            data={
                "grant_type": "refresh_token",
                "client_id": settings.hubspot_client_id,
                "client_secret": settings.hubspot_client_secret,
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
        expires_at = datetime.fromisoformat(token_expires_at.replace("Z", "+00:00"))
        if expires_at < datetime.now(timezone.utc) + timedelta(minutes=5):
            new_tokens = await refresh_hubspot_token(refresh_token)
            new_expires_at = (
                datetime.now(timezone.utc) + timedelta(seconds=new_tokens["expires_in"])
            ).isoformat()

            supabase.table("connections").update({
                "access_token": new_tokens["access_token"],
                "refresh_token": new_tokens["refresh_token"],
                "token_expires_at": new_expires_at,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("user_id", user_id).eq("service", "hubspot").execute()

            return new_tokens["access_token"]

    return access_token


# ---------------------------------------------------------------------------
# Contact Operations
# ---------------------------------------------------------------------------

async def search_contact(email: str, token: str) -> dict[str, Any] | None:
    """Search for an existing HubSpot contact by email.

    Returns:
        The first matching contact dict, or None.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
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
        "properties": ["email", "firstname", "lastname", "phone", "jobtitle", "company"],
        "limit": 1,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts/search",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

    data = response.json()
    results = data.get("results", [])
    return results[0] if results else None


async def create_contact(contact: dict[str, Any], token: str) -> str:
    """Create a new HubSpot contact.

    Returns:
        The new contact ID.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

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
            headers=headers,
        )
        response.raise_for_status()

    return response.json()["id"]


async def update_contact(contact_id: str, contact: dict[str, Any], token: str) -> str:
    """Update an existing HubSpot contact.

    Returns:
        The contact ID.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

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
            headers=headers,
        )
        response.raise_for_status()

    return contact_id


# ---------------------------------------------------------------------------
# Company Operations
# ---------------------------------------------------------------------------

async def search_company(name: str, token: str) -> dict[str, Any] | None:
    """Search for an existing HubSpot company by name.

    Returns:
        The first matching company dict, or None.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
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
            headers=headers,
        )
        response.raise_for_status()

    data = response.json()
    results = data.get("results", [])
    return results[0] if results else None


async def create_company(company: dict[str, Any], token: str) -> str:
    """Create a new HubSpot company.

    Returns:
        The new company ID.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    properties: dict[str, Any] = {"name": company.get("name", "")}

    if company.get("domain"):
        properties["domain"] = company["domain"]
    if company.get("industry"):
        properties["industry"] = company["industry"]

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/companies",
            json={"properties": properties},
            headers=headers,
        )
        response.raise_for_status()

    return response.json()["id"]


# ---------------------------------------------------------------------------
# Note Operations
# ---------------------------------------------------------------------------

async def create_note(body: str, contact_id: str, token: str) -> str:
    """Create a HubSpot note (engagement) and associate it with a contact.

    Returns:
        The new note ID.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    payload = {
        "properties": {
            "hs_note_body": body,
            "hs_timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "associations": [
            {
                "to": {"id": contact_id},
                "types": [
                    {
                        "associationCategory": "HUBSPOT_DEFINED",
                        "associationTypeId": 202,  # note_to_contact
                    }
                ],
            }
        ],
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{HUBSPOT_API_BASE}/crm/v3/objects/notes",
            json=payload,
            headers=headers,
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

    # --- Contact ---
    if actions.get("create_contact", True) and contact_data.get("email"):
        try:
            existing = await search_contact(contact_data["email"], token)
            if existing:
                contact_id = existing["id"]
                await update_contact(contact_id, contact_data, token)
                results["contact_id"] = contact_id
            else:
                results["contact_id"] = await create_contact(contact_data, token)
        except Exception as exc:
            errors.append(f"Contact error: {exc}")

    # --- Company ---
    if actions.get("create_company", True) and company_data.get("name"):
        try:
            existing = await search_company(company_data["name"], token)
            if existing:
                results["company_id"] = existing["id"]
            else:
                results["company_id"] = await create_company(company_data, token)
        except Exception as exc:
            errors.append(f"Company error: {exc}")

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

            results["note_id"] = await create_note(note_body, results["contact_id"], token)
        except Exception as exc:
            errors.append(f"Note error: {exc}")

    if errors:
        results["errors"] = errors

    return results
