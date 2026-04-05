"""
gemini_service.py
Thin wrapper around the Google Generative AI SDK (google-genai, not deprecated google.generativeai).
"""

from __future__ import annotations

import base64
import os

from google import genai
from google.genai import types

# Used for multimodal only (screenshot + voice). Use a stable model id to avoid 404s.
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


def _api_key() -> str:
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY or GOOGLE_API_KEY must be set (e.g. in backend/.env)."
        )
    return key


_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=_api_key())
    return _client


def call_gemini(
    prompt: str,
    image_data: str | None = None,
    audio_data: str | None = None,
) -> str:
    parts: list = [types.Part.from_text(text=prompt)]

    if image_data:
        raw_b64 = image_data
        mime = "image/png"
        if "," in image_data:
            prefix, raw_b64 = image_data.split(",", 1)
            if "jpeg" in prefix or "jpg" in prefix:
                mime = "image/jpeg"
            elif "gif" in prefix:
                mime = "image/gif"
            elif "webp" in prefix:
                mime = "image/webp"

        parts.append(
            types.Part.from_bytes(
                data=base64.b64decode(raw_b64),
                mime_type=mime,
            )
        )

    if audio_data:
        raw_b64 = audio_data
        mime = "audio/webm"
        if "," in audio_data:
            prefix, raw_b64 = audio_data.split(",", 1)
            if "mp4" in prefix:
                mime = "audio/mp4"
            elif "mpeg" in prefix:
                mime = "audio/mpeg"
            elif "wav" in prefix:
                mime = "audio/wav"
            elif "ogg" in prefix:
                mime = "audio/ogg"
            elif "webm" in prefix:
                mime = "audio/webm"

        parts.append(
            types.Part.from_bytes(
                data=base64.b64decode(raw_b64),
                mime_type=mime,
            )
        )


    try:
        response = _get_client().models.generate_content(
            model=MODEL,
            contents=parts,
        )
        return response.text or ""
    except Exception as e:
        print(f"call_gemini failed: {e}")
        raise
