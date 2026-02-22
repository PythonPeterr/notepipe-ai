"""Account management endpoints."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.middleware.auth import get_current_user, get_supabase
from app.models.schemas import MessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/account", tags=["account"])


@router.delete("", response_model=MessageResponse)
async def delete_account(
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, str]:
    """Permanently delete the current user's account and all associated data.

    The database cascade (ON DELETE CASCADE) handles removing connections,
    prompts, action_configs, and runs automatically when the auth user is deleted.
    """
    try:
        supabase.auth.admin.delete_user(user.id)
    except Exception as exc:
        logger.exception("Failed to delete user %s: %s", user.id, exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete account",
        ) from exc

    return {"message": "Account deleted successfully"}
