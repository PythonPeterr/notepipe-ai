import logging
from typing import Any
from types import SimpleNamespace

from fastapi import Depends, Header, HTTPException
from supabase import Client, create_client

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


def get_supabase(settings: Settings = Depends(get_settings)) -> Client:
    """Create a Supabase client using the service role key."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


# Dev bypass user — returned when DEV_BYPASS_AUTH=true
_DEV_USER = SimpleNamespace(
    id="00000000-0000-0000-0000-000000000000",
    email="dev@notepipe.local",
)


async def get_current_user(
    authorization: str = Header(default=""),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_supabase),
) -> Any:
    """Verify the Supabase JWT and return the authenticated user.

    When DEV_BYPASS_AUTH is set, returns a mock user for local development.
    """
    if settings.dev_bypass_auth:
        if settings.frontend_url and "localhost" not in settings.frontend_url:
            logger.critical(
                "DEV_BYPASS_AUTH is enabled with a non-localhost FRONTEND_URL (%s). "
                "This MUST be disabled in production!",
                settings.frontend_url,
            )
            raise HTTPException(
                status_code=500,
                detail="Server misconfiguration: auth bypass enabled in production",
            )
        logger.warning("DEV_BYPASS_AUTH is enabled — all requests use mock user")
        return _DEV_USER

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
