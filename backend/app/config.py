from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # Anthropic
    anthropic_api_key: str

    # Fireflies
    fireflies_webhook_secret: str

    # HubSpot OAuth
    hubspot_client_id: str
    hubspot_client_secret: str
    hubspot_redirect_uri: str = "https://notepipe-api.railway.app/auth/hubspot/callback"

    # Pipedrive OAuth
    pipedrive_client_id: str
    pipedrive_client_secret: str
    pipedrive_redirect_uri: str = "https://notepipe-api.railway.app/auth/pipedrive/callback"

    # Attio OAuth
    attio_client_id: str = ""
    attio_client_secret: str = ""
    attio_redirect_uri: str = "https://notepipe-api.railway.app/api/auth/attio/callback"

    # Zoho OAuth
    zoho_client_id: str = ""
    zoho_client_secret: str = ""
    zoho_redirect_uri: str = "https://notepipe-api.railway.app/api/auth/zoho/callback"

    # App
    frontend_url: str = "https://notepipe.vercel.app"
    dev_bypass_auth: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()  # type: ignore[call-arg]
