"""
gemini_service.py
Thin wrapper around the Google Generative AI SDK.
"""

import json
import logging
import os
from typing import Optional
from google import genai
from google.genai import types  # noqa: F401

logger = logging.getLogger(__name__)

_configured = False
_DEFAULT_MODEL = "gemini-2.5-flash"


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


def call_gemini(
    prompt: str, image_data: Optional[str] = None, audio_data: Optional[str] = None
) -> str:
    try:
        _ensure_configured()

        parts: list = [{"text": prompt}]

        if image_data:
            raw_b64 = image_data.split(",")[-1]
            parts.append(
                {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": raw_b64,
                    }
                }
            )

        if audio_data:
            raw_b64 = audio_data.split(",")[-1]
            parts.append(
                {
                    "inline_data": {
                        "mime_type": "audio/webm",
                        "data": raw_b64,
                    }
                }
            )

        model = (os.getenv("GEMINI_MODEL") or _DEFAULT_MODEL).strip() or _DEFAULT_MODEL

        client = genai.Client()
        response = client.models.generate_content(
            model=model,
            contents=parts,
        )
        return response.text or ""
    except Exception as exc:
        logger.exception("call_gemini failed: %s", exc)
        err = str(exc)
        content = "I had trouble processing that"
        if "RESOURCE_EXHAUSTED" in err or (
            "429" in err and "quota" in err.lower()
        ):
            content = (
                "Gemini quota or rate limit hit — wait and retry, check billing, "
                "or set GEMINI_MODEL in .env (e.g. gemini-2.5-flash)."
            )
        return json.dumps(
            {
                "action": "place_sticky",
                "content": content,
                "x": 400,
                "y": 400,
                "reasoning": "fallback due to error",
                "tentative": False,
            }
        )
