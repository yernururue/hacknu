"""
gemini_service.py
Thin wrapper around the Google Generative AI SDK.
"""

import base64
import logging
import os
from typing import Optional
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

_configured = False


def _ensure_configured():
    """Ensure an API key is available (GEMINI_API_KEY or GOOGLE_API_KEY)."""
    global _configured
    if not _configured:
        if not (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")):
            raise RuntimeError(
                "GEMINI_API_KEY is not set. "
                "Copy backend/.env.example to backend/.env and add your key."
            )
        _configured = True


def _decode_data_uri_payload(data_uri: str) -> bytes:
    """Strip data:*;base64, prefix if present (split on comma, take index 1), decode."""
    s = data_uri.strip()
    if "," in s:
        raw_b64 = s.split(",", 1)[1]
    else:
        raw_b64 = s
    return base64.b64decode(raw_b64)


def call_gemini(
    prompt: str, image_data: Optional[str] = None, audio_data: Optional[str] = None
) -> str:
    try:
        _ensure_configured()

        parts: list = [types.Part.from_text(text=prompt)]

        if image_data:
            decoded = _decode_data_uri_payload(image_data)
            parts.append(types.Part.from_bytes(data=decoded, mime_type="image/png"))

        if audio_data:
            decoded = _decode_data_uri_payload(audio_data)
            parts.append(types.Part.from_bytes(data=decoded, mime_type="audio/webm"))

        model = "gemini-2.5-flash-preview-04-17"

        client = genai.Client()
        response = client.models.generate_content(
            model=model,
            contents=parts,
        )
        return response.text or ""
    except Exception as exc:
        logger.exception("call_gemini failed: %s", exc)
        return '{"action": "place_sticky", "content": "I had trouble processing that", "x": 400, "y": 400, "reasoning": "fallback due to error", "tentative": false}'
