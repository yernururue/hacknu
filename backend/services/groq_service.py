"""
groq_service.py
Thin wrapper around the Groq SDK for text-only agent turns (no image/audio).
Multimodal requests use gemini_service instead.
"""

from __future__ import annotations

import os

from groq import Groq

MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY must be set in backend/.env")
        _client = Groq(api_key=api_key)
    return _client


def call_groq(
    prompt: str,
    image_data: str | None = None,
    audio_data: str | None = None,
) -> str:
    full_prompt = prompt
    if image_data:
        full_prompt += "\n\n[Note: A canvas screenshot was provided by the user.]"
    if audio_data:
        full_prompt += "\n\n[Note: A voice recording was provided by the user.]"

    try:
        print(f"[groq] calling model={MODEL}, prompt_len={len(full_prompt)}")
        response = _get_client().chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": full_prompt}],
            max_tokens=1024,
            temperature=0.7,
        )
        result = response.choices[0].message.content or ""
        print(f"[groq] response: {repr(result[:300])}")
        return result
    except Exception as e:
        print(f"[groq] call_groq failed: {e}")
        raise
