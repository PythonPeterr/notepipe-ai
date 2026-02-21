"""Claude API wrapper for extracting structured CRM data from transcripts."""

import json
from typing import Any

import anthropic

from app.config import get_settings
from app.models.schemas import ExtractedData

SYSTEM_PROMPT_BASE = """
You are a CRM data extraction assistant. Given a meeting transcript, extract structured information.
Return ONLY valid JSON matching this schema exactly — no markdown, no explanation.

Schema:
{
  "contact": { "name": str, "email": str, "phone": str | null, "title": str | null },
  "company": { "name": str, "domain": str | null, "industry": str | null },
  "meeting_summary": str,  // 2-3 sentence summary
  "deal_stage": str | null,  // e.g. "Discovery", "Proposal", "Negotiation", "Closed Won"
  "follow_ups": [{ "owner": str, "action": str, "due_date": str | null }],
  "custom_fields": {}  // template-specific fields
}
""".strip()

MODEL = "claude-sonnet-4-5"


def build_prompt(transcript: dict[str, Any], template_prompt: str, actions: dict[str, Any]) -> str:
    """Build the full prompt from transcript data, template prompt, and CRM actions.

    Args:
        transcript: The raw transcript data from Fireflies.
        template_prompt: The user's template-specific system prompt.
        actions: The CRM actions configuration dict.

    Returns:
        The assembled prompt string to send to Claude.
    """
    sentences = transcript.get("sentences", [])
    formatted_lines = [
        f"{s.get('speaker_name', 'Unknown')}: {s.get('text', '')}"
        for s in sentences
    ]
    conversation_text = "\n".join(formatted_lines)

    action_instructions: list[str] = []
    if not actions.get("create_contact", True):
        action_instructions.append("Do NOT extract contact information.")
    if not actions.get("create_company", True):
        action_instructions.append("Do NOT extract company information.")
    if not actions.get("update_deal_stage", False):
        action_instructions.append("Set deal_stage to null.")
    if not actions.get("extract_followups", True):
        action_instructions.append("Set follow_ups to an empty list.")

    action_section = ""
    if action_instructions:
        action_section = "\n\nAction constraints:\n" + "\n".join(
            f"- {instr}" for instr in action_instructions
        )

    return (
        f"{SYSTEM_PROMPT_BASE}\n\n"
        f"{template_prompt}"
        f"{action_section}\n\n"
        f"Transcript:\n{conversation_text}"
    )


async def extract(prompt: str) -> ExtractedData:
    """Send the prompt to Claude and parse the JSON response into ExtractedData.

    Args:
        prompt: The fully assembled prompt including transcript.

    Returns:
        Parsed ExtractedData from Claude's response.

    Raises:
        ValueError: If Claude returns non-JSON or unparseable output.
    """
    settings = get_settings()
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    message = await client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    raw_text = ""
    for block in message.content:
        if block.type == "text":
            raw_text += block.text

    raw_text = raw_text.strip()

    # Strip markdown code fences if Claude wraps the JSON
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        # Remove first line (```json or ```) and last line (```)
        lines = [line for line in lines if not line.strip().startswith("```")]
        raw_text = "\n".join(lines).strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Claude returned invalid JSON: {raw_text[:500]}") from exc

    return ExtractedData.model_validate(parsed)
