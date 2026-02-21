"""Tests for the /api/dashboard endpoints."""

import pytest

from tests.conftest import make_supabase_chain


@pytest.mark.asyncio
async def test_dashboard_stats_with_data(client, mock_supabase):
    """GET /api/dashboard/stats should return aggregated stats."""
    # The endpoint makes 3 separate supabase.table("runs") calls:
    #   1. all_runs  — select("id, status, crm_results", count="exact")
    #   2. success_runs — select("id", count="exact").eq("status","success")
    #   3. meetings_resp — select("fireflies_meeting_id").eq("status","success")

    all_runs_data = [
        {
            "id": "run-1",
            "status": "success",
            "crm_results": {"contact_id": "c1"},
        },
        {
            "id": "run-2",
            "status": "success",
            "crm_results": {"contact_id": "c2"},
        },
        {
            "id": "run-3",
            "status": "failed",
            "crm_results": None,
        },
    ]

    all_runs_chain = make_supabase_chain(data=all_runs_data, count=3)
    success_chain = make_supabase_chain(data=[{"id": "run-1"}, {"id": "run-2"}], count=2)
    meetings_chain = make_supabase_chain(data=[
        {"fireflies_meeting_id": "meet-a"},
        {"fireflies_meeting_id": "meet-b"},
    ])

    mock_supabase.table.side_effect = [
        all_runs_chain,
        success_chain,
        meetings_chain,
    ]

    response = await client.get("/api/dashboard/stats")
    assert response.status_code == 200

    data = response.json()
    assert data["total_runs"] == 3
    assert data["success_rate"] == pytest.approx(66.7, abs=0.1)
    assert data["contacts_created"] == 2
    assert data["meetings_processed"] == 2


@pytest.mark.asyncio
async def test_dashboard_stats_empty(client, mock_supabase):
    """GET /api/dashboard/stats with no runs returns zeroes."""
    empty_chain = make_supabase_chain(data=[], count=0)
    mock_supabase.table.side_effect = [empty_chain, empty_chain, empty_chain]

    response = await client.get("/api/dashboard/stats")
    assert response.status_code == 200

    data = response.json()
    assert data["total_runs"] == 0
    assert data["success_rate"] == 0.0
    assert data["contacts_created"] == 0
    assert data["meetings_processed"] == 0


@pytest.mark.asyncio
async def test_dashboard_stats_response_shape(client, mock_supabase):
    """The response must contain exactly the expected keys."""
    empty_chain = make_supabase_chain(data=[], count=0)
    mock_supabase.table.side_effect = [empty_chain, empty_chain, empty_chain]

    response = await client.get("/api/dashboard/stats")
    data = response.json()
    expected = {"total_runs", "success_rate", "contacts_created", "meetings_processed"}
    assert set(data.keys()) == expected
