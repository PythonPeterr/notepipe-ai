"""Fireflies GraphQL API client for fetching meeting transcripts."""

from typing import Any

import httpx

FIREFLIES_API_URL = "https://api.fireflies.ai/graphql"

GET_TRANSCRIPT_QUERY = """
query GetTranscript($transcriptId: String!) {
  transcript(id: $transcriptId) {
    id
    title
    date
    duration
    attendees {
      name
      email
    }
    sentences {
      speaker_name
      text
      start_time
      end_time
    }
    summary {
      overview
      action_items
    }
  }
}
"""


async def fetch_transcript(meeting_id: str, api_key: str) -> dict[str, Any]:
    """Fetch a full transcript from Fireflies by meeting ID.

    Args:
        meeting_id: The Fireflies meeting/transcript ID.
        api_key: The user's Fireflies API key stored in connections.

    Returns:
        The transcript data dictionary.

    Raises:
        httpx.HTTPStatusError: If the Fireflies API returns an error status.
        ValueError: If the response contains GraphQL errors or no transcript data.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "query": GET_TRANSCRIPT_QUERY,
        "variables": {"transcriptId": meeting_id},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(FIREFLIES_API_URL, json=payload, headers=headers)
        response.raise_for_status()

    body = response.json()

    if "errors" in body:
        error_messages = "; ".join(e.get("message", "Unknown error") for e in body["errors"])
        raise ValueError(f"Fireflies GraphQL errors: {error_messages}")

    transcript = body.get("data", {}).get("transcript")
    if not transcript:
        raise ValueError(f"No transcript found for meeting ID: {meeting_id}")

    return transcript
