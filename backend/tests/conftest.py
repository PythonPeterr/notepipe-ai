"""Shared fixtures for Notepipe backend tests.

Overrides FastAPI dependencies so that no real Supabase, auth, or
environment variables are needed.
"""

import pytest
from unittest.mock import MagicMock

from httpx import ASGITransport, AsyncClient

from app.main import app
from app.config import get_settings
from app.middleware.auth import get_current_user, get_supabase


# ---------------------------------------------------------------------------
# Fake user returned by the overridden get_current_user dependency
# ---------------------------------------------------------------------------

class MockUser:
    id = "test-user-id"
    email = "test@example.com"
    created_at = "2026-01-01T00:00:00Z"
    user_metadata = {}


# ---------------------------------------------------------------------------
# Fake settings returned by the overridden get_settings dependency
# ---------------------------------------------------------------------------

class MockSettings:
    supabase_url = "https://fake.supabase.co"
    supabase_service_role_key = "fake-key"
    anthropic_api_key = "fake-key"
    fireflies_webhook_secret = "test-secret"
    hubspot_client_id = "fake"
    hubspot_client_secret = "fake"
    hubspot_redirect_uri = "http://localhost:8000/auth/hubspot/callback"
    pipedrive_client_id = "fake"
    pipedrive_client_secret = "fake"
    pipedrive_redirect_uri = "http://localhost:8000/auth/pipedrive/callback"
    frontend_url = "http://localhost:3000"


# ---------------------------------------------------------------------------
# Helper: build a mock Supabase chain that supports
#   supabase.table("x").select(...).eq(...).execute()
# Each chained call returns the same builder so .eq().eq() etc. work.
# The terminal .execute() returns an object with .data and .count.
# ---------------------------------------------------------------------------

def make_supabase_chain(*, data=None, count=None):
    """Return a MagicMock that behaves like a Supabase query builder.

    ``data`` is the list returned by ``execute().data``.
    ``count`` is the optional integer returned by ``execute().count``.
    """
    if data is None:
        data = []

    result = MagicMock()
    result.data = data
    result.count = count

    chain = MagicMock()
    chain.execute.return_value = result

    # Every fluent method returns the same chain so calls can be chained
    for method in (
        "select", "insert", "update", "upsert", "delete",
        "eq", "neq", "gt", "gte", "lt", "lte",
        "in_", "order", "limit", "range", "single",
    ):
        getattr(chain, method).return_value = chain

    return chain


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_supabase():
    """A MagicMock standing in for the Supabase Client.

    By default ``supabase.table(...)`` returns a chain whose ``execute()``
    yields an empty list.  Individual tests can override the return value of
    ``supabase.table`` (or side_effect) to customise per-query responses.
    """
    sb = MagicMock()
    default_chain = make_supabase_chain()
    sb.table.return_value = default_chain
    return sb


@pytest.fixture
async def client(mock_supabase):
    """Async httpx client wired into the FastAPI app with overridden deps."""
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    app.dependency_overrides[get_settings] = lambda: MockSettings()
    app.dependency_overrides[get_supabase] = lambda: mock_supabase

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
