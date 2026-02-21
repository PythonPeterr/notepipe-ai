"""Run history and retry endpoints."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.middleware.auth import get_current_user, get_supabase
from app.models.schemas import PaginatedResponse, RunResponse
from app.services import fireflies, hubspot, pipedrive, processor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("", response_model=PaginatedResponse)
async def list_runs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    crm_target: str | None = Query(None),
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """List runs for the current user with pagination and optional filters."""
    # Build query for counting
    count_query = (
        supabase.table("runs")
        .select("id", count="exact")
        .eq("user_id", user.id)
    )

    if status:
        count_query = count_query.eq("status", status)
    if crm_target:
        count_query = count_query.eq("crm_target", crm_target)

    count_resp = count_query.execute()
    total = count_resp.count if count_resp.count is not None else len(count_resp.data)

    # Build query for paginated data
    offset = (page - 1) * per_page
    data_query = (
        supabase.table("runs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
    )

    if status:
        data_query = data_query.eq("status", status)
    if crm_target:
        data_query = data_query.eq("crm_target", crm_target)

    data_resp = data_query.execute()

    return {
        "items": data_resp.data,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{run_id}", response_model=RunResponse)
async def get_run(
    run_id: str,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Get a single run with full extracted_data and crm_results."""
    response = (
        supabase.table("runs")
        .select("*")
        .eq("id", run_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Run not found")

    return response.data[0]


@router.post("/{run_id}/rerun", response_model=RunResponse)
async def rerun_run(
    run_id: str,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Re-run processing for an existing run using the same transcript and current active template.

    Creates a new run record rather than overwriting the old one.
    """
    # Fetch the original run
    original_resp = (
        supabase.table("runs")
        .select("*")
        .eq("id", run_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not original_resp.data:
        raise HTTPException(status_code=404, detail="Run not found")

    original_run = original_resp.data[0]
    meeting_id = original_run["fireflies_meeting_id"]

    # Get user's Fireflies connection
    ff_conn_resp = (
        supabase.table("connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("service", "fireflies")
        .execute()
    )

    if not ff_conn_resp.data:
        raise HTTPException(status_code=400, detail="No Fireflies connection found")

    ff_api_key = ff_conn_resp.data[0].get("access_token", "")
    if not ff_api_key:
        raise HTTPException(status_code=400, detail="Fireflies API key is empty")

    # Get active template
    template_resp = (
        supabase.table("templates")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", True)
        .order("is_default", desc=True)
        .limit(1)
        .execute()
    )

    if not template_resp.data:
        raise HTTPException(status_code=400, detail="No active template found")

    template = template_resp.data[0]

    # Get CRM connection
    crm_conn_resp = (
        supabase.table("connections")
        .select("*")
        .eq("user_id", user.id)
        .in_("service", ["hubspot", "pipedrive"])
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

    # Fetch transcript
    try:
        transcript = await fireflies.fetch_transcript(meeting_id, ff_api_key)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch transcript from Fireflies: {exc}",
        ) from exc

    # Create a new pending run
    new_run_data = {
        "user_id": user.id,
        "template_id": template["id"],
        "fireflies_meeting_id": meeting_id,
        "meeting_title": transcript.get("title", original_run.get("meeting_title", "Untitled")),
        "meeting_date": transcript.get("date", original_run.get("meeting_date")),
        "crm_target": crm_service,
        "status": "pending",
    }

    new_run_resp = supabase.table("runs").insert(new_run_data).execute()

    if not new_run_resp.data:
        raise HTTPException(status_code=500, detail="Failed to create retry run")

    new_run = new_run_resp.data[0]
    new_run_id = new_run["id"]

    # Process
    try:
        result = await processor.process(transcript, template, crm_connection)

        supabase.table("runs").update({
            "status": result["status"],
            "extracted_data": result["extracted_data"],
            "crm_results": result["crm_results"],
            "error_message": result.get("error_message"),
            "duration_ms": result.get("duration_ms"),
        }).eq("id", new_run_id).execute()

        # Fetch the updated run
        updated_resp = (
            supabase.table("runs")
            .select("*")
            .eq("id", new_run_id)
            .execute()
        )

        return updated_resp.data[0]

    except Exception as exc:
        logger.exception("Retry failed for run %s: %s", run_id, exc)
        supabase.table("runs").update({
            "status": "failed",
            "error_message": str(exc),
        }).eq("id", new_run_id).execute()

        updated_resp = (
            supabase.table("runs")
            .select("*")
            .eq("id", new_run_id)
            .execute()
        )

        return updated_resp.data[0]
