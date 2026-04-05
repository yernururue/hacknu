"""
agent_loop.py
Core AI agent: loads prompts, calls Groq (text) or Gemini (screenshot/voice), parses actions.
"""

import json
from pathlib import Path
from typing import Optional

from backend.models.schemas import CanvasShape

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
    Parse the raw model response into a list of action dicts.
    Handles both a JSON array and a legacy single object (wrapped as one-element list).
    """
    clean = raw.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip()

    _fallback = {
        "action": "place_sticky",
        "content": "I had trouble processing that",
        "x": 400,
        "y": 400,
        "reasoning": "fallback due to parse error",
        "tentative": False,
    }

    try:
        data = json.loads(clean)
        if isinstance(data, dict):
            data = [data]
        if not isinstance(data, list):
            print(f"_parse_actions failed: expected list or dict, got {type(data).__name__}")
            return [_fallback]
        actions = [item for item in data if isinstance(item, dict)]
        if not actions:
            print(f"_parse_actions failed: no dict actions in list, raw snippet: {repr(clean[:200])}")
            return [_fallback]
        return actions
    except Exception as e:
        print(f"_parse_actions failed on: {repr(clean[:200])}")
        print(f"Error: {e}")
        return [_fallback]


def _call_llm(
    full_prompt: str,
    image_data: Optional[str],
    audio_data: Optional[str],
) -> str:
    """Text-only: Groq. Screenshot or voice: Gemini multimodal."""
    if image_data or audio_data:
        from backend.services.gemini_service import call_gemini

        return call_gemini(full_prompt, image_data=image_data, audio_data=audio_data)

    from backend.services.groq_service import call_groq

    return call_groq(full_prompt)


def run_agent(
    canvas_context: str,
    user_message: str,
    agent_mode: str = "idea_generator",
    image_data: Optional[str] = None,
    audio_data: Optional[str] = None,
) -> list[dict]:
    """
    Main agent function called by the backend.

    1. Loads and assembles the system prompt with the chosen persona.
    2. Builds a user prompt combining the canvas state and user message.
    3. Calls Groq (text) or Gemini (screenshot / voice).
    4. Parses the response into action dicts (flexible JSON for the frontend).

    Returns a list of dicts (always at least one — the fallback).
    """
    system_prompt = _load_system_prompt(agent_mode)

    if image_data and audio_data:
        multimodal_hint = "The user provided both a screenshot of the canvas and a voice recording. Analyze the visual state and listen to the audio carefully."
    elif image_data:
        multimodal_hint = "The user provided a screenshot of the canvas. Analyze the visual layout to inform your response."
    elif audio_data:
        multimodal_hint = "The user provided a voice recording. Listen to the audio to understand their request."
    else:
        multimodal_hint = ""

    user_prompt = (
        f"=== CANVAS STATE ===\n"
        f"{canvas_context}\n\n"
        f"=== USER REQUEST ===\n"
        f"{user_message}\n\n"
        f"{multimodal_hint}"
    )

    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    print(
        f"[agent] LLM prompt length={len(full_prompt)}, "
        f"image={'yes' if image_data else 'no'}, "
        f"audio={'yes' if audio_data else 'no'}"
    )
    raw = _call_llm(full_prompt, image_data, audio_data)
    print(f"[agent] raw response: {repr(raw[:300])}")

    return _parse_actions(raw)
