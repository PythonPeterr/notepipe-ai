"""User profile endpoint."""

from typing import Any

from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.models.schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: Any = Depends(get_current_user)) -> dict[str, Any]:
    """Return the current authenticated user's profile."""
    return {
        "id": user.id,
        "email": getattr(user, "email", None),
        "created_at": getattr(user, "created_at", None),
        "user_metadata": getattr(user, "user_metadata", {}) or {},
    }
