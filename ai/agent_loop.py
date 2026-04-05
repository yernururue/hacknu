"""
agent_loop.py
Core AI agent: loads prompts, calls Gemini, parses response into action dicts.
"""

import json
from pathlib import Path

from backend.models.schemas import FALLBACK_ACTION, CanvasShape
from backend.services.gemini_service import call_gemini

# Resolve paths relative to THIS file so they work regardless of cwd
_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
_PERSONAS_DIR = _PROMPTS_DIR / "personas"


def _load_text(path: Path) -> str:
    """Read a text file or return an empty string if missing."""
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    return ""


def build_canvas_context(shapes: list[CanvasShape]) -> str:
    """
    Format canvas state for the model: ids, types, positions, colors, and text.
    """
    if not shapes:
        return "Canvas is empty. No existing stickies."

    lines: list[str] = ["Current canvas contents:"]
    for s in shapes:
        stype = getattr(s, "type", None) or "sticky"
        color = getattr(s, "color", "") or "yellow"
        body = (s.text or "").replace("'", "\\'")
        lines.append(
            f"  - id={s.id} type={stype} at ({int(s.x)},{int(s.y)}) "
            f"color={color}: '{body}'"
        )
    lines.append(f"Total: {len(shapes)} items")
    return "\n".join(lines)


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


def _parse_actions(raw: str) -> list[dict]:
    """
    Parse the raw Gemini response into a list of action dicts.
    Handles both a JSON array and a legacy single object (wrapped as one-element list).
    Falls back to FALLBACK_ACTION on any parse error or empty result.
    """
    clean = raw.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        clean = "\n".join(lines).strip()
    raw = clean

    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            data = [data]
        if not isinstance(data, list):
            return [FALLBACK_ACTION.model_dump()]
        actions = [item for item in data if isinstance(item, dict)]
        return actions if actions else [FALLBACK_ACTION.model_dump()]
    except Exception:
        return [FALLBACK_ACTION.model_dump()]


def run_agent(
    canvas_context: str,
    user_message: str,
    agent_mode: str = "idea_generator",
    image_data: str | None = None,
    audio_data: str | None = None,
) -> list[dict]:
    """
    Main agent function called by the backend.

    1. Loads and assembles the system prompt with the chosen persona.
    2. Builds a user prompt combining the canvas state and user message.
    3. Calls Gemini.
    4. Parses the response into action dicts (flexible JSON for the frontend).

    Returns a list of dicts (always at least one — the fallback).
    """
    system_prompt = _load_system_prompt(agent_mode)

    user_prompt = (
        f"=== CANVAS STATE ===\n"
        f"{canvas_context}\n\n"
        f"=== USER REQUEST ===\n"
        f"{user_message}"
    )

    full_prompt = f"{system_prompt}\n\n{user_prompt}"
    raw = call_gemini(full_prompt, image_data=image_data, audio_data=audio_data)

    return _parse_actions(raw)
