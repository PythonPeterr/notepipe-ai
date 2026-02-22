"""Action config endpoints — per-user CRM action toggles."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.middleware.auth import get_current_user, get_supabase
from app.models.schemas import ActionConfigResponse, ActionConfigUpdate

router = APIRouter(prefix="/actions", tags=["actions"])


@router.get("", response_model=ActionConfigResponse)
async def get_action_config(
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Fetch the user's action config. Creates a default if none exists."""
    response = (
        supabase.table("action_configs")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )

    if response.data:
        return response.data[0]

    # Create default action config
    now = datetime.now(timezone.utc).isoformat()
    create_response = (
        supabase.table("action_configs")
        .insert({
            "user_id": user.id,
            "created_at": now,
            "updated_at": now,
        })
        .execute()
    )

    if not create_response.data:
        raise HTTPException(status_code=500, detail="Failed to create action config")

    return create_response.data[0]


@router.patch("", response_model=ActionConfigResponse)
async def update_action_config(
    body: ActionConfigUpdate,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Update the user's action config. Creates a default if none exists, then updates."""
    update_data: dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if body.create_contact is not None:
        update_data["create_contact"] = body.create_contact
    if body.create_company is not None:
        update_data["create_company"] = body.create_company
    if body.link_contact_to_company is not None:
        update_data["link_contact_to_company"] = body.link_contact_to_company
    if body.attach_note is not None:
        update_data["attach_note"] = body.attach_note
    if body.create_deal is not None:
        update_data["create_deal"] = body.create_deal
    if body.update_deal_stage is not None:
        update_data["update_deal_stage"] = body.update_deal_stage
    if body.extract_followups is not None:
        update_data["extract_followups"] = body.extract_followups
    if body.log_meeting is not None:
        update_data["log_meeting"] = body.log_meeting

    # Check if user has an action config
    existing = (
        supabase.table("action_configs")
        .select("id")
        .eq("user_id", user.id)
        .execute()
    )

    if existing.data:
        response = (
            supabase.table("action_configs")
            .update(update_data)
            .eq("user_id", user.id)
            .execute()
        )
    else:
        # Create with defaults + overrides
        update_data["user_id"] = user.id
        update_data["created_at"] = update_data["updated_at"]
        response = (
            supabase.table("action_configs")
            .insert(update_data)
            .execute()
        )

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update action config")

    return response.data[0]
