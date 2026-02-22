"""Fireflies webhook receiver.

This endpoint is public (no JWT) but verified via X-Webhook-Secret header.
Processing is dispatched to BackgroundTasks so we return 200 immediately.
"""

import hmac
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from supabase import Client

from app.config import Settings, get_settings
from app.middleware.auth import get_supabase
from app.models.schemas import FirefliesWebhookPayload
from app.services import attio, fireflies, hubspot, pipedrive, processor, zoho

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Only process these Fireflies event types
PROCESSABLE_EVENTS = {"Transcription completed"}


async def _process_fireflies_event(
    payload: FirefliesWebhookPayload,
    webhook_event_id: str,
    supabase: Client,
) -> None:
    """Background task: fetch transcript, run LLM extraction, write to CRM.

    This function handles the full pipeline after the webhook returns 200.
    """
    user_id = payload.clientReferenceId
    meeting_id = payload.meetingId

    try:
        # 1. Get the user's Fireflies connection (for the API key)
        ff_conn_resp = (
            supabase.table("connections")
            .select("*")
            .eq("user_id", user_id)
            .eq("service", "fireflies")
            .execute()
        )

        if not ff_conn_resp.data:
            raise ValueError(f"No Fireflies connection found for user {user_id}")

        ff_connection = ff_conn_resp.data[0]
        ff_api_key = ff_connection.get("access_token", "")

        if not ff_api_key:
            raise ValueError("Fireflies API key is empty")

        # 2. Fetch transcript from Fireflies
        transcript = await fireflies.fetch_transcript(meeting_id, ff_api_key)

        # 3. Find the user's active prompt (prefer default, fall back to any active)
        prompt_resp = (
            supabase.table("prompts")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .order("is_default", desc=True)
            .limit(1)
            .execute()
        )

        if not prompt_resp.data:
            raise ValueError(f"No active prompt found for user {user_id}")

        prompt = prompt_resp.data[0]

        # 3b. Get user's action config
        action_config_resp = (
            supabase.table("action_configs")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        action_config = action_config_resp.data[0] if action_config_resp.data else {}

        # 4. Find the user's connected CRM (hubspot or pipedrive)
        crm_conn_resp = (
            supabase.table("connections")
            .select("*")
            .eq("user_id", user_id)
            .in_("service", ["hubspot", "pipedrive", "attio", "zoho"])
            .limit(1)
            .execute()
        )

        if not crm_conn_resp.data:
            raise ValueError(f"No CRM connection found for user {user_id}")

        crm_connection = crm_conn_resp.data[0]

        # 5. Ensure CRM token is valid (refresh if needed)
        crm_service = crm_connection["service"]
        if crm_service == "hubspot":
            crm_connection["access_token"] = await hubspot.ensure_valid_token(
                access_token=crm_connection["access_token"],
                refresh_token=crm_connection.get("refresh_token"),
                token_expires_at=crm_connection.get("token_expires_at"),
                user_id=user_id,
                supabase=supabase,
            )
        elif crm_service == "pipedrive":
            crm_connection["access_token"] = await pipedrive.ensure_valid_token(
                access_token=crm_connection["access_token"],
                refresh_token=crm_connection.get("refresh_token"),
                token_expires_at=crm_connection.get("token_expires_at"),
                user_id=user_id,
                supabase=supabase,
            )
        elif crm_service == "attio":
            crm_connection["access_token"] = await attio.ensure_valid_token(
                access_token=crm_connection["access_token"],
                refresh_token=crm_connection.get("refresh_token"),
                token_expires_at=crm_connection.get("token_expires_at"),
                user_id=user_id,
                supabase=supabase,
            )
        elif crm_service == "zoho":
            crm_connection["access_token"] = await zoho.ensure_valid_token(
                access_token=crm_connection["access_token"],
                refresh_token=crm_connection.get("refresh_token"),
                token_expires_at=crm_connection.get("token_expires_at"),
                user_id=user_id,
                supabase=supabase,
                metadata=crm_connection.get("metadata", {}),
            )

        # 5b. Idempotency check — skip if a run already exists for this meeting
        existing_run = (
            supabase.table("runs")
            .select("id")
            .eq("user_id", user_id)
            .eq("fireflies_meeting_id", meeting_id)
            .limit(1)
            .execute()
        )

        if existing_run.data:
            logger.info(
                "Skipping duplicate: run already exists for meeting %s user %s",
                meeting_id, user_id,
            )
            supabase.table("webhook_events").update({
                "processed": True,
                "user_id": user_id,
            }).eq("id", webhook_event_id).execute()
            return

        # 6. Create a pending run record
        run_data = {
            "user_id": user_id,
            "prompt_id": prompt["id"],
            "fireflies_meeting_id": meeting_id,
            "meeting_title": transcript.get("title", "Untitled Meeting"),
            "meeting_date": transcript.get("date"),
            "crm_target": crm_service,
            "status": "pending",
        }

        run_resp = supabase.table("runs").insert(run_data).execute()
        run_id = run_resp.data[0]["id"]

        # 7. Run the processing pipeline
        result = await processor.process(transcript, prompt, action_config, crm_connection)

        # 8. Update the run with results
        supabase.table("runs").update({
            "status": result["status"],
            "extracted_data": result["extracted_data"],
            "crm_results": result["crm_results"],
            "error_message": result.get("error_message"),
            "duration_ms": result.get("duration_ms"),
        }).eq("id", run_id).execute()

        # 9. Mark webhook event as processed
        supabase.table("webhook_events").update({
            "processed": True,
            "user_id": user_id,
        }).eq("id", webhook_event_id).execute()

        logger.info(
            "Successfully processed meeting %s for user %s (run %s)",
            meeting_id, user_id, run_id,
        )

    except Exception as exc:
        logger.exception(
            "Failed to process Fireflies webhook for meeting %s: %s",
            meeting_id, exc,
        )

        # Mark webhook event with error
        try:
            supabase.table("webhook_events").update({
                "processed": True,
                "user_id": user_id,
                "error": str(exc),
            }).eq("id", webhook_event_id).execute()
        except Exception:
            logger.exception("Failed to update webhook_events error status")


limiter = Limiter(key_func=get_remote_address)


@router.post("/fireflies")
@limiter.limit("30/minute")
async def fireflies_webhook(
    request: Request,
    payload: FirefliesWebhookPayload,
    background_tasks: BackgroundTasks,
    x_webhook_secret: str = Header(..., alias="X-Webhook-Secret"),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_supabase),
) -> dict[str, str]:
    """Receive a Fireflies webhook event.

    Verifies the webhook secret, stores the raw event, and dispatches
    background processing only for "Transcription completed" events.
    Returns 200 immediately.
    """
    # Verify webhook secret (constant-time comparison to prevent timing attacks)
    if not hmac.compare_digest(x_webhook_secret, settings.fireflies_webhook_secret):
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    if not payload.clientReferenceId:
        raise HTTPException(
            status_code=400, detail="Missing clientReferenceId in payload"
        )

    # Deduplicate: check if this meeting was already processed for this user
    existing_event = (
        supabase.table("webhook_events")
        .select("id")
        .eq("source", "fireflies")
        .eq("user_id", payload.clientReferenceId)
        .eq("event_type", payload.eventType)
        .execute()
    )

    # Check if any existing event has the same meetingId in its payload
    for evt in existing_event.data or []:
        existing_run = (
            supabase.table("runs")
            .select("id")
            .eq("user_id", payload.clientReferenceId)
            .eq("fireflies_meeting_id", payload.meetingId)
            .execute()
        )
        if existing_run.data:
            logger.info(
                "Duplicate webhook for meeting %s, user %s — skipping",
                payload.meetingId, payload.clientReferenceId,
            )
            return {"status": "ok", "action": "duplicate"}

    # Store raw webhook event regardless of event type
    event_data = {
        "source": "fireflies",
        "event_type": payload.eventType,
        "payload": payload.model_dump(),
        "user_id": payload.clientReferenceId,
        "processed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    event_resp = supabase.table("webhook_events").insert(event_data).execute()
    webhook_event_id = event_resp.data[0]["id"]

    # Only process transcript completion events
    if payload.eventType not in PROCESSABLE_EVENTS:
        logger.info(
            "Ignoring Fireflies event type '%s' for meeting %s",
            payload.eventType, payload.meetingId,
        )
        supabase.table("webhook_events").update({
            "processed": True,
        }).eq("id", webhook_event_id).execute()
        return {"status": "ok", "action": "ignored"}

    # Dispatch background processing
    background_tasks.add_task(
        _process_fireflies_event,
        payload,
        webhook_event_id,
        supabase,
    )

    return {"status": "ok", "action": "processing"}
