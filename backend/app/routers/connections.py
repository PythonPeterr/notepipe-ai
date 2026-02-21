"""Connections CRUD endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.config import Settings, get_settings
from app.middleware.auth import get_current_user, get_supabase
from app.models.schemas import (
    ConnectionResponse,
    FirefliesKeyRequest,
    MessageResponse,
    WebhookURLResponse,
)

router = APIRouter(prefix="/connections", tags=["connections"])


@router.get("", response_model=list[ConnectionResponse])
async def list_connections(
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> list[dict[str, Any]]:
    """List all connections for the current user.

    Tokens are redacted from the response for security.
    """
    response = (
        supabase.table("connections")
        .select("id, user_id, service, metadata, created_at")
        .eq("user_id", user.id)
        .execute()
    )

    return response.data


@router.post("/fireflies", response_model=ConnectionResponse)
async def save_fireflies_key(
    body: FirefliesKeyRequest,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, Any]:
    """Save or update the Fireflies API key.

    Upserts a connection record with service='fireflies' and stores
    the API key as the access_token.
    """
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="API key cannot be empty")

    # Upsert: try update first, insert if not found
    existing = (
        supabase.table("connections")
        .select("id")
        .eq("user_id", user.id)
        .eq("service", "fireflies")
        .execute()
    )

    if existing.data:
        response = (
            supabase.table("connections")
            .update({"access_token": body.api_key})
            .eq("user_id", user.id)
            .eq("service", "fireflies")
            .execute()
        )
    else:
        response = (
            supabase.table("connections")
            .insert({
                "user_id": user.id,
                "service": "fireflies",
                "access_token": body.api_key,
                "metadata": {},
            })
            .execute()
        )

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to save Fireflies API key")

    row = response.data[0]
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "service": row["service"],
        "metadata": row.get("metadata", {}),
        "created_at": row["created_at"],
    }


@router.delete("/{service}", response_model=MessageResponse)
async def delete_connection(
    service: str,
    user: Any = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict[str, str]:
    """Remove a connection for the specified service."""
    valid_services = {"fireflies", "hubspot", "pipedrive"}
    if service not in valid_services:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid service. Must be one of: {', '.join(valid_services)}",
        )

    response = (
        supabase.table("connections")
        .delete()
        .eq("user_id", user.id)
        .eq("service", service)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail=f"No {service} connection found")

    return {"message": f"{service} connection removed"}


@router.get("/fireflies/webhook-url", response_model=WebhookURLResponse)
async def get_fireflies_webhook_url(
    user: Any = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    """Return the webhook URL for the user to configure in Fireflies.

    The clientReferenceId field should be set to the user_id in Fireflies settings.
    This URL is what the user pastes into their Fireflies webhook configuration.
    """
    # Determine the backend base URL from the redirect URIs
    # Strip the path from hubspot redirect URI to get the base
    base_url = settings.hubspot_redirect_uri.rsplit("/auth/hubspot/callback", 1)[0]
    if not base_url:
        base_url = "https://notepipe-api.railway.app"

    webhook_url = f"{base_url}/api/webhooks/fireflies"

    return {"webhook_url": webhook_url}
