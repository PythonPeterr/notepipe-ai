"""File upload endpoint — manual meeting notes/transcripts.

Accepts .txt, .pdf, .docx files and processes them through the same
LLM extraction → CRM write pipeline as automated Fireflies webhooks.
"""

import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address
from supabase import Client

from app.middleware.auth import get_current_user, get_supabase
from app.models.schemas import RunResponse
from app.services import attio, hubspot, pipedrive, processor, zoho
from app.services.file_parser import FileValidationError, extract_text, validate_file

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", response_model=RunResponse)
@limiter.limit("10/minute")
async def upload_file(
    request: Request,
    file: UploadFile,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Upload a meeting notes file and process it through the CRM pipeline.

    Accepts .txt, .pdf, .docx files up to 10MB. The file is parsed to
    plain text, sent through LLM extraction, and written to the user's
    connected CRM — identical to the Fireflies webhook pipeline.
    """
    filename = file.filename or "upload.txt"

    # Read file content
    content = await file.read()

    # Validate file
    try:
        validate_file(filename, len(content), content)
    except FileValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Extract text
    try:
        text = extract_text(filename, content)
    except FileValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Get active prompt
    prompt_resp = (
        supabase.table("prompts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", True)
        .order("is_default", desc=True)
        .limit(1)
        .execute()
    )

    if not prompt_resp.data:
        raise HTTPException(status_code=400, detail="No active prompt found")

    prompt = prompt_resp.data[0]

    # Get action config
    action_config_resp = (
        supabase.table("action_configs")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )

    action_config = action_config_resp.data[0] if action_config_resp.data else {}

    # Get CRM connection
    crm_conn_resp = (
        supabase.table("connections")
        .select("*")
        .eq("user_id", user.id)
        .in_("service", ["hubspot", "pipedrive", "attio", "zoho"])
        .limit(1)
        .execute()
    )

    if not crm_conn_resp.data:
        raise HTTPException(status_code=400, detail="No CRM connection found")

    crm_connection = crm_conn_resp.data[0]
    crm_service = crm_connection["service"]

    # Ensure CRM token is valid
    if crm_service == "hubspot":
        crm_connection["access_token"] = await hubspot.ensure_valid_token(
            access_token=crm_connection["access_token"],
            refresh_token=crm_connection.get("refresh_token"),
            token_expires_at=crm_connection.get("token_expires_at"),
            user_id=user.id,
            supabase=supabase,
        )
    elif crm_service == "pipedrive":
        crm_connection["access_token"] = await pipedrive.ensure_valid_token(
            access_token=crm_connection["access_token"],
            refresh_token=crm_connection.get("refresh_token"),
            token_expires_at=crm_connection.get("token_expires_at"),
            user_id=user.id,
            supabase=supabase,
        )
    elif crm_service == "attio":
        crm_connection["access_token"] = await attio.ensure_valid_token(
            access_token=crm_connection["access_token"],
            refresh_token=crm_connection.get("refresh_token"),
            token_expires_at=crm_connection.get("token_expires_at"),
            user_id=user.id,
            supabase=supabase,
        )
    elif crm_service == "zoho":
        crm_connection["access_token"] = await zoho.ensure_valid_token(
            access_token=crm_connection["access_token"],
            refresh_token=crm_connection.get("refresh_token"),
            token_expires_at=crm_connection.get("token_expires_at"),
            user_id=user.id,
            supabase=supabase,
            metadata=crm_connection.get("metadata", {}),
        )

    # Create pending run
    upload_id = f"upload-{uuid.uuid4()}"
    run_data = {
        "user_id": user.id,
        "prompt_id": prompt["id"],
        "fireflies_meeting_id": upload_id,
        "meeting_title": filename,
        "crm_target": crm_service,
        "status": "pending",
        "source": "upload",
        "original_filename": filename,
    }

    run_resp = supabase.table("runs").insert(run_data).execute()

    if not run_resp.data:
        raise HTTPException(status_code=500, detail="Failed to create run record")

    run_id = run_resp.data[0]["id"]

    # Process
    try:
        result = await processor.process_upload(text, filename, prompt, action_config, crm_connection)

        supabase.table("runs").update({
            "status": result["status"],
            "extracted_data": result["extracted_data"],
            "crm_results": result["crm_results"],
            "error_message": result.get("error_message"),
            "duration_ms": result.get("duration_ms"),
        }).eq("id", run_id).execute()

    except Exception as exc:
        logger.exception("Upload processing failed for %s: %s", filename, exc)
        supabase.table("runs").update({
            "status": "failed",
            "error_message": str(exc),
        }).eq("id", run_id).execute()

    # Return the completed run
    updated_resp = (
        supabase.table("runs")
        .select("*")
        .eq("id", run_id)
        .execute()
    )

    return updated_resp.data[0]
