"""Dashboard stats endpoint."""

from typing import Any

from fastapi import APIRouter, Depends
from supabase import Client

from app.middleware.auth import get_current_user, get_supabase
from app.models.schemas import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Return aggregated dashboard stats for the current user."""
    # Total runs
    all_runs = (
        supabase.table("runs")
        .select("id, status, crm_results", count="exact")
        .eq("user_id", user.id)
        .execute()
    )

    total_runs = all_runs.count if all_runs.count is not None else len(all_runs.data)

    # Success count
    success_runs = (
        supabase.table("runs")
        .select("id", count="exact")
        .eq("user_id", user.id)
        .eq("status", "success")
        .execute()
    )
    success_count = (
        success_runs.count if success_runs.count is not None else len(success_runs.data)
    )

    success_rate = (success_count / total_runs * 100) if total_runs > 0 else 0.0

    # Contacts created: count runs where crm_results has a non-null contact_id
    contacts_created = 0
    for run in all_runs.data:
        crm_results = run.get("crm_results")
        if isinstance(crm_results, dict) and crm_results.get("contact_id"):
            contacts_created += 1

    # Meetings processed = distinct fireflies_meeting_ids with success
    meetings_resp = (
        supabase.table("runs")
        .select("fireflies_meeting_id")
        .eq("user_id", user.id)
        .eq("status", "success")
        .execute()
    )
    unique_meetings = {r["fireflies_meeting_id"] for r in meetings_resp.data}
    meetings_processed = len(unique_meetings)

    return {
        "total_runs": total_runs,
        "success_rate": round(success_rate, 1),
        "contacts_created": contacts_created,
        "meetings_processed": meetings_processed,
    }
