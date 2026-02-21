"""Template CRUD and seed endpoints."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.middleware.auth import get_current_user, get_supabase
from app.models.schemas import MessageResponse, TemplateCreate, TemplateResponse, TemplateUpdate

router = APIRouter(prefix="/templates", tags=["templates"])


# ---------------------------------------------------------------------------
# Default seed templates
# ---------------------------------------------------------------------------

SEED_TEMPLATES = [
    {
        "name": "B2B Sales Call",
        "description": "Extract contact, company, deal stage, and follow-ups from B2B sales calls.",
        "system_prompt": (
            "You are extracting CRM data from a B2B sales call. Focus on: who the decision "
            "maker is, what their budget range is, what pain they described, what their "
            "timeline is, and what stage of evaluation they are in."
        ),
        "is_default": True,
        "crm_actions": {
            "create_contact": True,
            "create_company": True,
            "attach_note": True,
            "update_deal_stage": True,
            "extract_followups": True,
        },
    },
    {
        "name": "Discovery Call",
        "description": "Extract pain points, decision makers, and next steps from discovery calls.",
        "system_prompt": (
            "You are extracting CRM data from a discovery call. Focus on: the prospect "
            "company size and industry, who you spoke with and their role, what problems "
            "they described, and what the agreed next steps are."
        ),
        "is_default": False,
        "crm_actions": {
            "create_contact": True,
            "create_company": True,
            "attach_note": True,
            "update_deal_stage": False,
            "extract_followups": True,
        },
    },
    {
        "name": "Recruitment Interview",
        "description": "Extract candidate details and assessment from recruitment interviews.",
        "system_prompt": (
            "You are extracting data from a recruitment interview. Focus on: candidate name "
            "and contact details, the role they applied for, key strengths mentioned, "
            "concerns raised, and recommended next step."
        ),
        "is_default": False,
        "crm_actions": {
            "create_contact": True,
            "create_company": True,
            "attach_note": True,
            "update_deal_stage": False,
            "extract_followups": True,
        },
    },
    {
        "name": "Customer Success",
        "description": "Extract health signals, risks, and action items from customer success calls.",
        "system_prompt": (
            "You are extracting data from a customer success call. Focus on: what the "
            "customer said about their experience, any risks or churn signals mentioned, "
            "what they asked for, and what action items were agreed."
        ),
        "is_default": False,
        "crm_actions": {
            "create_contact": True,
            "create_company": False,
            "attach_note": True,
            "update_deal_stage": False,
            "extract_followups": True,
        },
    },
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[TemplateResponse])
async def list_templates(
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> list[dict[str, Any]]:
    """List all templates for the current user."""
    response = (
        supabase.table("templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=False)
        .execute()
    )

    return response.data


@router.post("", response_model=TemplateResponse, status_code=201)
async def create_template(
    body: TemplateCreate,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Create a new template."""
    now = datetime.now(timezone.utc).isoformat()

    template_data = {
        "user_id": user.id,
        "name": body.name,
        "description": body.description or "",
        "system_prompt": body.system_prompt,
        "is_default": body.is_default,
        "is_active": body.is_active,
        "crm_actions": body.crm_actions.model_dump(),
        "created_at": now,
        "updated_at": now,
    }

    # If this is marked as default, unset other defaults
    if body.is_default:
        supabase.table("templates").update({"is_default": False}).eq(
            "user_id", user.id
        ).execute()

    response = supabase.table("templates").insert(template_data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create template")

    return response.data[0]


@router.patch("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    body: TemplateUpdate,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Update an existing template."""
    # Verify ownership
    existing = (
        supabase.table("templates")
        .select("id")
        .eq("id", template_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Template not found")

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
    if body.crm_actions is not None:
        update_data["crm_actions"] = body.crm_actions.model_dump()

    if body.is_default is not None:
        update_data["is_default"] = body.is_default
        # If setting as default, unset other defaults first
        if body.is_default:
            supabase.table("templates").update({"is_default": False}).eq(
                "user_id", user.id
            ).execute()

    response = (
        supabase.table("templates")
        .update(update_data)
        .eq("id", template_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update template")

    return response.data[0]


@router.delete("/{template_id}", response_model=MessageResponse)
async def delete_template(
    template_id: str,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, str]:
    """Delete a template."""
    response = (
        supabase.table("templates")
        .delete()
        .eq("id", template_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Template not found")

    return {"message": "Template deleted"}


@router.post("/seed", response_model=list[TemplateResponse], status_code=201)
async def seed_templates(
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> list[dict[str, Any]]:
    """Seed default templates for a new user.

    Called on first login. If the user already has templates, returns
    the existing ones without creating duplicates.
    """
    # Check if user already has templates
    existing = (
        supabase.table("templates")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )

    if existing.data:
        return existing.data

    # Create seed templates
    now = datetime.now(timezone.utc).isoformat()
    templates_to_insert = []

    for seed in SEED_TEMPLATES:
        templates_to_insert.append({
            "user_id": user.id,
            "name": seed["name"],
            "description": seed["description"],
            "system_prompt": seed["system_prompt"],
            "is_default": seed["is_default"],
            "is_active": True,
            "crm_actions": seed["crm_actions"],
            "created_at": now,
            "updated_at": now,
        })

    response = supabase.table("templates").insert(templates_to_insert).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to seed templates")

    return response.data
