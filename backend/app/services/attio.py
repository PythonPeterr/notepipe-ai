"""Attio REST API client for CRM operations.

Attio API v2 docs: https://developers.attio.com/reference

Key differences from HubSpot/Pipedrive:
- Tokens don't expire — no refresh flow needed.
- Built-in upsert via PUT with matching_attribute query param.
- Notes support Markdown (not HTML).
- All attribute values are arrays, even single-value fields.
"""

import logging
from typing import Any

import httpx

from app.services.http import api_retry

logger = logging.getLogger(__name__)

ATTIO_API_BASE = "https://api.attio.com/v2"


# ---------------------------------------------------------------------------
# Token Handling
# ---------------------------------------------------------------------------

async def ensure_valid_token(
    access_token: str,
    refresh_token: str | None,
    token_expires_at: str | None,
    user_id: str,
    supabase: Any,
) -> str:
    """Return the access token as-is. Attio tokens don't expire."""
    return access_token


def _auth_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


# ---------------------------------------------------------------------------
# Person (Contact) Operations
# ---------------------------------------------------------------------------

@api_retry
async def assert_person(contact: dict[str, Any], token: str) -> str:
    """Upsert a person in Attio, matching on email address.

    Returns:
        The Attio person record ID.
    """
    name_parts = contact.get("name", "").split(" ", 1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    values: dict[str, Any] = {
        "email_addresses": [{"email_address": contact.get("email", "")}],
        "name": [{"first_name": first_name, "last_name": last_name}],
    }

    if contact.get("phone"):
        values["phone_numbers"] = [
            {"original_phone_number": contact["phone"]}
        ]
    if contact.get("title"):
        values["job_title"] = [{"value": contact["title"]}]

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.put(
            f"{ATTIO_API_BASE}/objects/people/records",
            params={"matching_attribute": "email_addresses"},
            json={"data": {"values": values}},
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return response.json()["data"]["id"]["record_id"]


# ---------------------------------------------------------------------------
# Company Operations
# ---------------------------------------------------------------------------

@api_retry
async def assert_company(company: dict[str, Any], token: str) -> str:
    """Upsert a company in Attio, matching on domain.

    Falls back to matching on name if no domain is provided.

    Returns:
        The Attio company record ID.
    """
    values: dict[str, Any] = {
        "name": [{"value": company.get("name", "")}],
    }

    matching_attribute = "name"

    if company.get("domain"):
        values["domains"] = [{"domain": company["domain"]}]
        matching_attribute = "domains"

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.put(
            f"{ATTIO_API_BASE}/objects/companies/records",
            params={"matching_attribute": matching_attribute},
            json={"data": {"values": values}},
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return response.json()["data"]["id"]["record_id"]


# ---------------------------------------------------------------------------
# Association Operations
# ---------------------------------------------------------------------------

async def link_person_to_company(
    person_id: str, company_id: str, token: str
) -> None:
    """Link a person to a company in Attio by updating the person's company attribute.

    Uses the person record update endpoint to set the company relationship.
    """
    values: dict[str, Any] = {
        "company": [{"target_record_id": company_id}],
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            f"{ATTIO_API_BASE}/objects/people/records/{person_id}",
            json={"data": {"values": values}},
            headers=_auth_headers(token),
        )
        response.raise_for_status()


# ---------------------------------------------------------------------------
# Note Operations
# ---------------------------------------------------------------------------

def format_note_content(
    meeting_summary: str,
    follow_ups: list[dict[str, Any]] | None = None,
) -> str:
    """Build a Markdown note body for Attio."""
    parts: list[str] = []

    parts.append("## Meeting Summary")
    parts.append(meeting_summary)

    if follow_ups:
        parts.append("")
        parts.append("## Follow-ups")
        for fu in follow_ups:
            owner = fu.get("owner", "TBD")
            action = fu.get("action", "")
            due = fu.get("due_date")
            due_text = f" (by {due})" if due else ""
            parts.append(f"- **{owner}**: {action}{due_text}")

    parts.append("")
    parts.append("*Extracted by Notepipe*")

    return "\n".join(parts)


@api_retry
async def create_note(
    title: str,
    content: str,
    parent_object: str,
    parent_record_id: str,
    token: str,
) -> str:
    """Create a note in Attio attached to a person or company.

    Returns:
        The Attio note ID.
    """
    payload = {
        "data": {
            "parent_object": parent_object,
            "parent_record_id": parent_record_id,
            "title": title,
            "format": "markdown",
            "content": content,
        }
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{ATTIO_API_BASE}/notes",
            json=payload,
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return response.json()["data"]["id"]["note_id"]


# ---------------------------------------------------------------------------
# Deal Operations
# ---------------------------------------------------------------------------

@api_retry
async def create_deal(
    name: str,
    contact_id: str | None = None,
    company_id: str | None = None,
    token: str = "",
) -> str:
    """Create a deal record in Attio.

    Returns:
        The Attio deal record ID.
    """
    values: dict[str, Any] = {
        "name": [{"value": name}],
    }

    if contact_id:
        values["associated_people"] = [{"target_record_id": contact_id}]
    if company_id:
        values["associated_companies"] = [{"target_record_id": company_id}]

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{ATTIO_API_BASE}/objects/deals/records",
            json={"data": {"values": values}},
            headers=_auth_headers(token),
        )
        response.raise_for_status()

    return response.json()["data"]["id"]["record_id"]


# ---------------------------------------------------------------------------
# High-level Write Orchestrator
# ---------------------------------------------------------------------------

async def write(
    data: dict[str, Any],
    token: str,
    actions: dict[str, Any],
) -> dict[str, Any]:
    """Write extracted data to Attio according to enabled CRM actions.

    Uses Attio's built-in upsert (PUT with matching_attribute) for contacts
    and companies — no separate search step needed.

    Args:
        data: The LLM-extracted data dict.
        token: Valid Attio access token.
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

    # --- Contact (Person) ---
    if actions.get("create_contact", True) and contact_data.get("email"):
        try:
            results["contact_id"] = await assert_person(contact_data, token)
        except Exception as exc:
            errors.append(f"Person error: {exc}")

    # --- Company ---
    if actions.get("create_company", True) and company_data.get("name"):
        try:
            results["company_id"] = await assert_company(company_data, token)
        except Exception as exc:
            errors.append(f"Company error: {exc}")

    # --- Link Person to Company ---
    if actions.get("link_contact_to_company", False) and results.get("contact_id") and results.get("company_id"):
        try:
            await link_person_to_company(
                results["contact_id"], results["company_id"], token
            )
        except Exception as exc:
            errors.append(f"Person-Company link error: {exc}")

    # --- Deal ---
    # Attio has no native deal stage update — deals are created with status.
    # Gate behind create_deal only.
    if actions.get("create_deal", False) and deal_stage:
        try:
            deal_name = meeting_summary[:100] if meeting_summary else "New Deal"
            results["deal_id"] = await create_deal(
                name=deal_name,
                contact_id=results.get("contact_id"),
                company_id=results.get("company_id"),
                token=token,
            )
        except Exception as exc:
            errors.append(f"Deal error: {exc}")

    # --- Note ---
    if actions.get("attach_note", True) and meeting_summary:
        try:
            note_content = format_note_content(meeting_summary, follow_ups)
            # Prefer attaching to person, fall back to company
            parent_object = "people"
            parent_record_id = results.get("contact_id", "")
            if not parent_record_id:
                parent_object = "companies"
                parent_record_id = results.get("company_id", "")

            if parent_record_id:
                results["note_id"] = await create_note(
                    title="Meeting Summary",
                    content=note_content,
                    parent_object=parent_object,
                    parent_record_id=parent_record_id,
                    token=token,
                )
            else:
                errors.append("Note skipped: no contact or company to attach to")
        except Exception as exc:
            errors.append(f"Note error: {exc}")

    # --- Meeting ---
    # Attio has no meeting/activity object in their API — skipped.

    if errors:
        results["errors"] = errors

    return results
