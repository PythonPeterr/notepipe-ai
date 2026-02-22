"""Prompt CRUD and seed endpoints."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.middleware.auth import get_current_user, get_supabase
from app.models.schemas import (
    MessageResponse,
    PromptCreate,
    PromptResponse,
    PromptSummaryResponse,
    PromptUpdate,
)

router = APIRouter(prefix="/prompts", tags=["prompts"])


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[PromptSummaryResponse])
async def list_prompts(
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> list[dict[str, Any]]:
    """List all prompts for the current user.

    Uses the prompt_list view to omit system_prompt,
    reducing egress on the list page.
    """
    response = (
        supabase.table("prompt_list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=False)
        .execute()
    )

    return response.data


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: str,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Get a single prompt with full details including system_prompt."""
    response = (
        supabase.table("prompts")
        .select("*")
        .eq("id", prompt_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return response.data[0]


@router.post("", response_model=PromptResponse, status_code=201)
async def create_prompt(
    body: PromptCreate,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Create a new prompt."""
    now = datetime.now(timezone.utc).isoformat()

    prompt_data = {
        "user_id": user.id,
        "name": body.name,
        "description": body.description or "",
        "system_prompt": body.system_prompt,
        "is_default": body.is_default,
        "is_active": body.is_active,
        "created_at": now,
        "updated_at": now,
    }

    # If this is marked as default, unset other defaults
    if body.is_default:
        supabase.table("prompts").update({"is_default": False}).eq(
            "user_id", user.id
        ).execute()

    response = supabase.table("prompts").insert(prompt_data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create prompt")

    return response.data[0]


@router.patch("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: str,
    body: PromptUpdate,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Update an existing prompt."""
    # Verify ownership
    existing = (
        supabase.table("prompts")
        .select("id")
        .eq("id", prompt_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Prompt not found")

    update_data: dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if body.name is not None:
        update_data["name"] = body.name
    if body.description is not None:
        update_data["description"] = body.description
    if body.system_prompt is not None:
        update_data["system_prompt"] = body.system_prompt
    if body.is_active is not None:
        update_data["is_active"] = body.is_active

    if body.is_default is not None:
        update_data["is_default"] = body.is_default
        # If setting as default, unset other defaults first
        if body.is_default:
            supabase.table("prompts").update({"is_default": False}).eq(
                "user_id", user.id
            ).execute()

    response = (
        supabase.table("prompts")
        .update(update_data)
        .eq("id", prompt_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update prompt")

    return response.data[0]


@router.delete("/{prompt_id}", response_model=MessageResponse)
async def delete_prompt(
    prompt_id: str,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, str]:
    """Delete a prompt."""
    response = (
        supabase.table("prompts")
        .delete()
        .eq("id", prompt_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return {"message": "Prompt deleted"}


@router.post("/seed", response_model=list[PromptResponse], status_code=201)
async def seed_prompts(
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> list[dict[str, Any]]:
    """Seed default prompt and action config for a new user.

    Called on first login. If the user already has prompts, returns
    the existing ones without creating duplicates.
    """
    # Check if user already has prompts
    existing = (
        supabase.table("prompts")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )

    if existing.data:
        return existing.data

    # Create seed prompt
    now = datetime.now(timezone.utc).isoformat()
    prompt_data = {
        "user_id": user.id,
        "name": "B2B Sales Call",
        "description": "Extract contact, company, deal stage, and follow-ups from B2B sales calls.",
        "system_prompt": (
            "You are extracting CRM data from a B2B sales call. Focus on: who the decision "
            "maker is, what their budget range is, what pain they described, what their "
            "timeline is, and what stage of evaluation they are in."
        ),
        "is_default": True,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    response = supabase.table("prompts").insert(prompt_data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to seed prompts")

    # Also seed default action config if user doesn't have one
    existing_config = (
        supabase.table("action_configs")
        .select("id")
        .eq("user_id", user.id)
        .execute()
    )

    if not existing_config.data:
        supabase.table("action_configs").insert({
            "user_id": user.id,
            "created_at": now,
            "updated_at": now,
        }).execute()

    return response.data
