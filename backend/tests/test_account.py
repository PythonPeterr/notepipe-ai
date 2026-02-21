"""Tests for the /api/account endpoints."""

import pytest


@pytest.mark.asyncio
async def test_delete_account_success(client, mock_supabase):
    """DELETE /api/account should delete the user and return a message."""
    # supabase.auth.admin.delete_user is called — mock it to succeed
    mock_supabase.auth.admin.delete_user.return_value = None

    response = await client.delete("/api/account")
    assert response.status_code == 200
    assert "deleted" in response.json()["message"].lower()

    mock_supabase.auth.admin.delete_user.assert_called_once_with("test-user-id")


@pytest.mark.asyncio
async def test_delete_account_failure(client, mock_supabase):
    """DELETE /api/account returns 500 when Supabase deletion fails."""
    mock_supabase.auth.admin.delete_user.side_effect = Exception("Supabase error")

    response = await client.delete("/api/account")
    assert response.status_code == 500
    assert "failed" in response.json()["detail"].lower()
