"""OAuth flow endpoints for HubSpot and Pipedrive."""

import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from supabase import Client

from app.config import Settings, get_settings
from app.middleware.auth import get_current_user, get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# HubSpot OAuth
# ---------------------------------------------------------------------------

HUBSPOT_SCOPES = [
    "crm.objects.contacts.write",
    "crm.objects.contacts.read",
    "crm.objects.companies.write",
    "crm.objects.companies.read",
    "crm.objects.deals.write",
    "crm.objects.deals.read",
]


@router.get("/hubspot")
async def hubspot_auth(
    user: Any = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """Redirect the user to HubSpot's OAuth consent screen."""
    params = {
        "client_id": settings.hubspot_client_id,
        "redirect_uri": settings.hubspot_redirect_uri,
        "scope": " ".join(HUBSPOT_SCOPES),
        "state": user.id,
    }
    url = f"https://app.hubspot.com/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/hubspot/callback")
async def hubspot_callback(
    code: str = Query(...),
    state: str = Query(""),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_supabase),
) -> RedirectResponse:
    """Exchange the HubSpot auth code for tokens and store the connection."""
    if not state:
        raise HTTPException(status_code=400, detail="Missing state (user_id)")

    user_id = state

    # Exchange code for tokens
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.hubapi.com/oauth/v1/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.hubspot_client_id,
                "client_secret": settings.hubspot_client_secret,
                "redirect_uri": settings.hubspot_redirect_uri,
                "code": code,
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"HubSpot token exchange failed: {response.text}",
        )

    tokens = response.json()
    expires_at = (
        datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 21600))
    ).isoformat()

    # Upsert connection
    connection_data = {
        "user_id": user_id,
        "service": "hubspot",
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_expires_at": expires_at,
        "metadata": {},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Check if connection already exists
    existing = (
        supabase.table("connections")
        .select("id")
        .eq("user_id", user_id)
        .eq("service", "hubspot")
        .execute()
    )

    if existing.data:
        supabase.table("connections").update(connection_data).eq(
            "id", existing.data[0]["id"]
        ).execute()
    else:
        supabase.table("connections").insert(connection_data).execute()

    redirect_url = f"{settings.frontend_url}/connections?connected=hubspot"
    return RedirectResponse(url=redirect_url)


# ---------------------------------------------------------------------------
# Pipedrive OAuth
# ---------------------------------------------------------------------------

@router.get("/pipedrive")
async def pipedrive_auth(
    user: Any = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """Redirect the user to Pipedrive's OAuth consent screen."""
    params = {
        "client_id": settings.pipedrive_client_id,
        "redirect_uri": settings.pipedrive_redirect_uri,
        "state": user.id,
    }
    url = f"https://oauth.pipedrive.com/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/pipedrive/callback")
async def pipedrive_callback(
    code: str = Query(...),
    state: str = Query(""),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_supabase),
) -> RedirectResponse:
    """Exchange the Pipedrive auth code for tokens and store the connection."""
    if not state:
        raise HTTPException(status_code=400, detail="Missing state (user_id)")

    user_id = state

    # Exchange code for tokens
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://oauth.pipedrive.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "redirect_uri": settings.pipedrive_redirect_uri,
                "code": code,
            },
            auth=(settings.pipedrive_client_id, settings.pipedrive_client_secret),
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"Pipedrive token exchange failed: {response.text}",
        )

    tokens = response.json()
    expires_at = (
        datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))
    ).isoformat()

    # Extract company_domain from the API domain returned by Pipedrive
    api_domain = tokens.get("api_domain", "")
    # api_domain looks like "https://companyname.pipedrive.com"
    company_domain = ""
    if api_domain:
        try:
            parsed = urllib.parse.urlparse(api_domain)
            hostname = parsed.hostname or ""
            # Extract subdomain: "companyname" from "companyname.pipedrive.com"
            if hostname.endswith(".pipedrive.com"):
                company_domain = hostname.replace(".pipedrive.com", "")
        except Exception:
            company_domain = ""

    # Upsert connection
    connection_data = {
        "user_id": user_id,
        "service": "pipedrive",
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_expires_at": expires_at,
        "metadata": {"company_domain": company_domain},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    existing = (
        supabase.table("connections")
        .select("id")
        .eq("user_id", user_id)
        .eq("service", "pipedrive")
        .execute()
    )

    if existing.data:
        supabase.table("connections").update(connection_data).eq(
            "id", existing.data[0]["id"]
        ).execute()
    else:
        supabase.table("connections").insert(connection_data).execute()

    redirect_url = f"{settings.frontend_url}/connections?connected=pipedrive"
    return RedirectResponse(url=redirect_url)
