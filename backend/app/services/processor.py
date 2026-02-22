"""Core orchestration service: transcript -> LLM extraction -> CRM write.

This is the main processing pipeline invoked by the webhook handler.
"""

import logging
import time
from typing import Any

from app.services import attio, fireflies, hubspot, llm, pipedrive, zoho

logger = logging.getLogger(__name__)


def _strip_nulls(obj: Any) -> Any:
    """Recursively strip None values from dicts to reduce JSONB storage."""
    if isinstance(obj, dict):
        return {k: _strip_nulls(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [_strip_nulls(item) for item in obj]
    return obj


async def process(
    transcript: dict[str, Any],
    prompt: dict[str, Any],
    action_config: dict[str, Any],
    crm_connection: dict[str, Any],
) -> dict[str, Any]:
    """Run the full extraction and CRM write pipeline.

    Args:
        transcript: The raw transcript data from Fireflies.
        prompt: The user's active prompt record (dict from Supabase).
        action_config: The user's action config record (dict from Supabase).
        crm_connection: The user's CRM connection record (dict from Supabase).

    Returns:
        Dict with extracted_data, crm_results, status, duration_ms,
        and optional error_message.
    """
    start_time = time.monotonic()
    crm_actions = {
        "create_contact": action_config.get("create_contact", True),
        "create_company": action_config.get("create_company", False),
        "link_contact_to_company": action_config.get("link_contact_to_company", False),
        "attach_note": action_config.get("attach_note", True),
        "create_deal": action_config.get("create_deal", False),
        "update_deal_stage": action_config.get("update_deal_stage", False),
        "extract_followups": action_config.get("extract_followups", False),
        "log_meeting": action_config.get("log_meeting", False),
    }
    system_prompt = prompt.get("system_prompt", "")

    try:
        # Step 1: Format transcript and call Claude for extraction
        formatted_transcript = fireflies.format_transcript_for_llm(transcript)
        prompt = llm.build_prompt(transcript, system_prompt, crm_actions)
        extracted = await llm.extract(prompt)
        extracted_dict = _strip_nulls(extracted.model_dump())

        logger.info(
            "LLM extraction complete: contact=%s, company=%s",
            extracted.contact.name,
            extracted.company.name,
        )

        # Step 2: Write to the appropriate CRM
        crm_service = crm_connection.get("service", "")
        access_token = crm_connection.get("access_token", "")
        metadata = crm_connection.get("metadata", {})

        if crm_service == "hubspot":
            crm_results = await hubspot.write(
                extracted_dict, access_token, crm_actions
            )
        elif crm_service == "pipedrive":
            crm_results = await pipedrive.write(
                extracted_dict, access_token, metadata, crm_actions
            )
        elif crm_service == "attio":
            crm_results = await attio.write(
                extracted_dict, access_token, crm_actions
            )
        elif crm_service == "zoho":
            crm_results = await zoho.write(
                extracted_dict, access_token, metadata, crm_actions
            )
        else:
            crm_results = {
                "errors": [f"Unsupported CRM service: {crm_service}"]
            }

        elapsed_ms = int((time.monotonic() - start_time) * 1000)

        crm_results = _strip_nulls(crm_results)
        has_errors = bool(crm_results.get("errors"))

        return {
            "extracted_data": extracted_dict,
            "crm_results": crm_results,
            "status": "failed" if has_errors else "success",
            "duration_ms": elapsed_ms,
            "error_message": (
                "; ".join(crm_results["errors"]) if has_errors else None
            ),
        }

    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        logger.exception("Processing pipeline failed: %s", exc)
        return {
            "extracted_data": None,
            "crm_results": None,
            "status": "failed",
            "duration_ms": elapsed_ms,
            "error_message": str(exc),
        }


async def process_upload(
    text: str,
    filename: str,
    prompt: dict[str, Any],
    action_config: dict[str, Any],
    crm_connection: dict[str, Any],
) -> dict[str, Any]:
    """Run the extraction and CRM write pipeline for an uploaded file.

    Args:
        text: Plain text extracted from the uploaded file.
        filename: Original filename for LLM context.
        prompt: The user's active prompt record.
        action_config: The user's action config record.
        crm_connection: The user's CRM connection record.

    Returns:
        Dict with extracted_data, crm_results, status, duration_ms,
        and optional error_message.
    """
    start_time = time.monotonic()
    crm_actions = {
        "create_contact": action_config.get("create_contact", True),
        "create_company": action_config.get("create_company", False),
        "link_contact_to_company": action_config.get("link_contact_to_company", False),
        "attach_note": action_config.get("attach_note", True),
        "create_deal": action_config.get("create_deal", False),
        "update_deal_stage": action_config.get("update_deal_stage", False),
        "extract_followups": action_config.get("extract_followups", False),
        "log_meeting": action_config.get("log_meeting", False),
    }
    system_prompt = prompt.get("system_prompt", "")

    try:
        # Step 1: Build prompt from raw text and call Claude
        prompt = llm.build_prompt_from_text(text, system_prompt, crm_actions, filename)
        extracted = await llm.extract(prompt)
        extracted_dict = _strip_nulls(extracted.model_dump())

        logger.info(
            "LLM extraction complete (upload): contact=%s, company=%s",
            extracted.contact.name,
            extracted.company.name,
        )

        # Step 2: Write to the appropriate CRM
        crm_service = crm_connection.get("service", "")
        access_token = crm_connection.get("access_token", "")
        metadata = crm_connection.get("metadata", {})

        if crm_service == "hubspot":
            crm_results = await hubspot.write(
                extracted_dict, access_token, crm_actions
            )
        elif crm_service == "pipedrive":
            crm_results = await pipedrive.write(
                extracted_dict, access_token, metadata, crm_actions
            )
        elif crm_service == "attio":
            crm_results = await attio.write(
                extracted_dict, access_token, crm_actions
            )
        elif crm_service == "zoho":
            crm_results = await zoho.write(
                extracted_dict, access_token, metadata, crm_actions
            )
        else:
            crm_results = {
                "errors": [f"Unsupported CRM service: {crm_service}"]
            }

        elapsed_ms = int((time.monotonic() - start_time) * 1000)

        crm_results = _strip_nulls(crm_results)
        has_errors = bool(crm_results.get("errors"))

        return {
            "extracted_data": extracted_dict,
            "crm_results": crm_results,
            "status": "failed" if has_errors else "success",
            "duration_ms": elapsed_ms,
            "error_message": (
                "; ".join(crm_results["errors"]) if has_errors else None
            ),
        }

    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        logger.exception("Upload processing pipeline failed: %s", exc)
        return {
            "extracted_data": None,
            "crm_results": None,
            "status": "failed",
            "duration_ms": elapsed_ms,
            "error_message": str(exc),
        }
