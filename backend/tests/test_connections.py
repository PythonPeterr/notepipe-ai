"""Tests for the /api/connections endpoints."""

from unittest.mock import AsyncMock, patch

import pytest

from tests.conftest import make_supabase_chain


# ---------------------------------------------------------------------------
# GET /api/connections
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_connections_returns_list(client, mock_supabase):
    """GET /api/connections should return the user's connections."""
    sample = [
        {
            "id": "conn-1",
            "user_id": "test-user-id",
            "service": "fireflies",
            "metadata": {},
            "created_at": "2026-01-01T00:00:00Z",
        },
        {
            "id": "conn-2",
            "user_id": "test-user-id",
            "service": "hubspot",
            "metadata": {},
            "created_at": "2026-01-02T00:00:00Z",
        },
    ]
    mock_supabase.table.return_value = make_supabase_chain(data=sample)

    response = await client.get("/api/connections")
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2
    assert data[0]["service"] == "fireflies"
    assert data[1]["service"] == "hubspot"


@pytest.mark.asyncio
async def test_list_connections_empty(client, mock_supabase):
    """GET /api/connections should return an empty list when none exist."""
    mock_supabase.table.return_value = make_supabase_chain(data=[])

    response = await client.get("/api/connections")
    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------------------------
# POST /api/connections/fireflies
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
@patch(
    "app.services.fireflies.validate_api_key",
    new_callable=AsyncMock,
    return_value={"user_id": "ff-123", "email": "test@test.com", "name": "Test"},
)
async def test_save_fireflies_key_insert(mock_validate, client, mock_supabase):
    """POST /api/connections/fireflies should upsert the API key."""
    # First call: select to check existing -> no data (insert path)
    select_chain = make_supabase_chain(data=[])
    # Second call: insert -> return the new row
    insert_chain = make_supabase_chain(data=[{
        "id": "conn-new",
        "user_id": "test-user-id",
        "service": "fireflies",
        "metadata": {},
        "created_at": "2026-01-15T00:00:00Z",
    }])

    mock_supabase.table.side_effect = [select_chain, insert_chain]

    response = await client.post(
        "/api/connections/fireflies",
        json={"api_key": "ff-live-12345"},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["service"] == "fireflies"
    assert data["id"] == "conn-new"
    mock_validate.assert_called_once_with("ff-live-12345")


@pytest.mark.asyncio
@patch(
    "app.services.fireflies.validate_api_key",
    new_callable=AsyncMock,
    return_value={"user_id": "ff-123", "email": "test@test.com", "name": "Test"},
)
async def test_save_fireflies_key_update(mock_validate, client, mock_supabase):
    """POST /api/connections/fireflies with existing connection should update."""
    # First call: select existing -> found
    select_chain = make_supabase_chain(data=[{"id": "conn-existing"}])
    # Second call: update -> return updated row
    update_chain = make_supabase_chain(data=[{
        "id": "conn-existing",
        "user_id": "test-user-id",
        "service": "fireflies",
        "metadata": {},
        "created_at": "2026-01-10T00:00:00Z",
    }])

    mock_supabase.table.side_effect = [select_chain, update_chain]

    response = await client.post(
        "/api/connections/fireflies",
        json={"api_key": "ff-live-67890"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == "conn-existing"
    mock_validate.assert_called_once_with("ff-live-67890")


@pytest.mark.asyncio
async def test_save_fireflies_key_empty_rejected(client):
    """POST /api/connections/fireflies with an empty key returns 400."""
    response = await client.post(
        "/api/connections/fireflies",
        json={"api_key": "   "},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# DELETE /api/connections/{service}
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_connection_success(client, mock_supabase):
    """DELETE /api/connections/fireflies should remove the connection."""
    mock_supabase.table.return_value = make_supabase_chain(data=[{
        "id": "conn-1",
        "user_id": "test-user-id",
        "service": "fireflies",
    }])

    response = await client.delete("/api/connections/fireflies")
    assert response.status_code == 200
    assert "removed" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_delete_connection_invalid_service(client):
    """DELETE /api/connections/invalid should return 400."""
    response = await client.delete("/api/connections/invalid")
    assert response.status_code == 400
    assert "invalid service" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_connection_not_found(client, mock_supabase):
    """DELETE /api/connections/fireflies returns 404 when no row is deleted."""
    mock_supabase.table.return_value = make_supabase_chain(data=[])

    response = await client.delete("/api/connections/fireflies")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/connections/fireflies/webhook-url
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_fireflies_webhook_url(client):
    """GET /api/connections/fireflies/webhook-url should return the URL."""
    response = await client.get("/api/connections/fireflies/webhook-url")
    assert response.status_code == 200

    data = response.json()
    assert "webhook_url" in data
    assert "/api/webhooks/fireflies" in data["webhook_url"]
