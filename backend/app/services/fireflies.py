"""Fireflies GraphQL API client for fetching meeting transcripts.

Aligned with official Fireflies GraphQL API docs:
https://docs.fireflies.ai/graphql-api/query/transcript
"""

import logging
from typing import Any

import httpx

from app.services.http import api_retry

logger = logging.getLogger(__name__)

FIREFLIES_API_URL = "https://api.fireflies.ai/graphql"

# Query aligned with real Fireflies schema:
# - meeting_attendees (NOT "attendees") with displayName, email, phoneNumber, name
# - sentences with raw_text (cleaner than text for LLM processing)
# - summary with action_items, overview, keywords, short_summary
GET_TRANSCRIPT_QUERY = """
query Transcript($transcriptId: String!) {
  transcript(id: $transcriptId) {
    id
    title
    date
    duration
    host_email
    organizer_email
    meeting_attendees {
      displayName
      email
      phoneNumber
      name
    }
    sentences {
      index
      speaker_name
      speaker_id
      text
      raw_text
      start_time
      end_time
    }
    summary {
      overview
      action_items
      keywords
      short_summary
    }
  }
}
"""

# Lightweight query to validate an API key without fetching full data
VALIDATE_KEY_QUERY = """
query {
  user {
    user_id
    email
    name
  }
}
"""


@api_retry
async def validate_api_key(api_key: str) -> dict[str, Any]:
    """Validate a Fireflies API key by making a test query.

    Returns:
        The user data dict if the key is valid.

    Raises:
        ValueError: If the API key is invalid or the query fails.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            FIREFLIES_API_URL,
            json={"query": VALIDATE_KEY_QUERY},
            headers=headers,
        )

    if response.status_code == 401:
        raise ValueError("Invalid Fireflies API key")

    response.raise_for_status()

    body = response.json()

    if "errors" in body:
        error_messages = "; ".join(
            e.get("message", "Unknown error") for e in body["errors"]
        )
        raise ValueError(f"Fireflies API key validation failed: {error_messages}")

    user_data = body.get("data", {}).get("user")
    if not user_data:
        raise ValueError("Fireflies API key validation returned no user data")

    return user_data


@api_retry
async def fetch_transcript(meeting_id: str, api_key: str) -> dict[str, Any]:
    """Fetch a full transcript from Fireflies by meeting ID.

    Args:
        meeting_id: The Fireflies meeting/transcript ID.
        api_key: The user's Fireflies API key stored in connections.

    Returns:
        The transcript data dictionary with normalized structure.

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
        response = await client.post(
            FIREFLIES_API_URL, json=payload, headers=headers
        )
        response.raise_for_status()

    body = response.json()

    if "errors" in body:
        error_messages = "; ".join(
            e.get("message", "Unknown error") for e in body["errors"]
        )
        raise ValueError(f"Fireflies GraphQL errors: {error_messages}")

    transcript = body.get("data", {}).get("transcript")
    if not transcript:
        raise ValueError(f"No transcript found for meeting ID: {meeting_id}")

    return transcript


def format_transcript_for_llm(transcript: dict[str, Any]) -> str:
    """Format a Fireflies transcript into clean text for LLM processing.

    Uses raw_text when available (cleaner than text), falls back to text.
    Includes meeting metadata header for context.
    """
    lines: list[str] = []

    # Header with meeting metadata
    title = transcript.get("title", "Untitled Meeting")
    lines.append(f"Meeting: {title}")

    attendees = transcript.get("meeting_attendees") or []
    if attendees:
        attendee_names = [
            a.get("displayName") or a.get("name") or "Unknown"
            for a in attendees
        ]
        lines.append(f"Attendees: {', '.join(attendee_names)}")

    lines.append("")
    lines.append("--- Transcript ---")

    # Sentence lines — prefer raw_text over text
    sentences = transcript.get("sentences") or []
    for s in sentences:
        speaker = s.get("speaker_name", "Unknown")
        content = s.get("raw_text") or s.get("text", "")
        if content.strip():
            lines.append(f"{speaker}: {content}")

    # Append Fireflies AI summary if available
    summary = transcript.get("summary") or {}
    overview = summary.get("overview")
    action_items = summary.get("action_items")

    if overview or action_items:
        lines.append("")
        lines.append("--- AI Summary (from Fireflies) ---")
        if overview:
            lines.append(f"Overview: {overview}")
        if action_items:
            lines.append(f"Action Items: {action_items}")

    return "\n".join(lines)
