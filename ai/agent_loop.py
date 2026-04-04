"""
agent_loop.py
Core AI agent: loads prompts, calls Gemini, parses response into StickyActions.
"""

import json
from pathlib import Path

from backend.models.schemas import StickyAction, FALLBACK_ACTION
from backend.services.gemini_service import call_gemini

# Resolve paths relative to THIS file so they work regardless of cwd
_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
_PERSONAS_DIR = _PROMPTS_DIR / "personas"


def _load_text(path: Path) -> str:
    """Read a text file or return an empty string if missing."""
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    return ""


def _load_system_prompt(agent_mode: str) -> str:
    """
    Build the full system prompt by combining the base system prompt
    with the persona addon for the requested mode.
    """
    base = _load_text(_PROMPTS_DIR / "system_prompt.txt")
    persona = _load_text(_PERSONAS_DIR / f"{agent_mode}.txt")

    if persona:
        return f"{base}\n\n---\n\n{persona}"
    return base


def _parse_actions(raw: str) -> list[StickyAction]:
    """
    Parse the raw Gemini response into a list of StickyAction objects.
    Handles both a single object and an array of objects.
    Falls back to FALLBACK_ACTION on any parse error.
    """
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        first_newline = cleaned.index("\n")
        cleaned = cleaned[first_newline + 1 :]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return [FALLBACK_ACTION]

    if isinstance(data, dict):
        data = [data]

    if not isinstance(data, list):
        return [FALLBACK_ACTION]

    actions: list[StickyAction] = []
    for item in data:
        try:
            actions.append(StickyAction(**item))
        except Exception:
            continue

    return actions if actions else [FALLBACK_ACTION]


def run_agent(
    user_message: str,
    canvas_context: str,
    agent_mode: str = "idea_generator",
) -> list[StickyAction]:
    """
    Main agent function called by the backend.

    1. Loads and assembles the system prompt with the chosen persona.
    2. Builds a user prompt combining the canvas state and user message.
    3. Calls Gemini.
    4. Parses the response into validated StickyAction objects.

    Returns a list of StickyAction objects (always at least one — the fallback).
    """
    system_prompt = _load_system_prompt(agent_mode)

    user_prompt = (
        f"=== CANVAS STATE ===\n"
        f"{canvas_context}\n\n"
        f"=== USER REQUEST ===\n"
        f"{user_message}"
    )

    raw_response = call_gemini(system_prompt=system_prompt, user_prompt=user_prompt)

    return _parse_actions(raw_response)
