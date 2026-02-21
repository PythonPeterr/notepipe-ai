from typing import Any

from fastapi import Depends, Header, HTTPException
from supabase import Client, create_client

from app.config import Settings, get_settings


def get_supabase(settings: Settings = Depends(get_settings)) -> Client:
    """Create a Supabase client using the service role key."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def get_current_user(
    authorization: str = Header(...),
    supabase: Client = Depends(get_supabase),
) -> Any:
    """Verify the Supabase JWT and return the authenticated user.

    Raises HTTPException 401 if the token is missing or invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        user_response = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    if not user_response or not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_response.user
