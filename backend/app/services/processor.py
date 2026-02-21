"""Core orchestration service: transcript -> LLM extraction -> CRM write.

This is the main processing pipeline invoked by the webhook handler.
"""

import time
from typing import Any

from app.services import hubspot, llm, pipedrive


async def process(
    transcript: dict[str, Any],
    template: dict[str, Any],
    crm_connection: dict[str, Any],
) -> dict[str, Any]:
    """Run the full extraction and CRM write pipeline.

    Args:
        transcript: The raw transcript data from Fireflies.
        template: The user's active template record (dict from Supabase).
        crm_connection: The user's CRM connection record (dict from Supabase).

    Returns:
        Dict with extracted_data, crm_results, status, duration_ms, and optional error_message.
    """
    start_time = time.monotonic()
    crm_actions = template.get("crm_actions", {})
    system_prompt = template.get("system_prompt", "")

    try:
        # Step 1: Build prompt and call Claude for extraction
        prompt = llm.build_prompt(transcript, system_prompt, crm_actions)
        extracted = await llm.extract(prompt)
        extracted_dict = extracted.model_dump()

        # Step 2: Write to the appropriate CRM
        crm_service = crm_connection.get("service", "")
        access_token = crm_connection.get("access_token", "")
        metadata = crm_connection.get("metadata", {})

        if crm_service == "hubspot":
            crm_results = await hubspot.write(extracted_dict, access_token, crm_actions)
        elif crm_service == "pipedrive":
            crm_results = await pipedrive.write(
                extracted_dict, access_token, metadata, crm_actions
            )
        else:
            crm_results = {"errors": [f"Unsupported CRM service: {crm_service}"]}

        elapsed_ms = int((time.monotonic() - start_time) * 1000)

        has_errors = bool(crm_results.get("errors"))

        return {
            "extracted_data": extracted_dict,
            "crm_results": crm_results,
            "status": "failed" if has_errors else "success",
            "duration_ms": elapsed_ms,
            "error_message": "; ".join(crm_results["errors"]) if has_errors else None,
        }

    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        return {
            "extracted_data": None,
            "crm_results": None,
            "status": "failed",
            "duration_ms": elapsed_ms,
            "error_message": str(exc),
        }
