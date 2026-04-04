"""
gemini_service.py
Thin wrapper around the Google Generative AI SDK.
"""

import os
import google.generativeai as genai


_configured = False


def _ensure_configured():
    """Configure the SDK once using the API key from the environment."""
    global _configured
    if not _configured:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. "
                "Copy backend/.env.example to backend/.env and add your key."
            )
        genai.configure(api_key=api_key)
        _configured = True


def call_gemini(system_prompt: str, user_prompt: str) -> str:
    """
    Send a single request to Gemini and return the text response.

    Args:
        system_prompt: The full system instruction (persona + rules).
        user_prompt:   The combined user message + canvas context.

    Returns:
        Raw text from the model.
    """
    _ensure_configured()

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=system_prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.8,
            top_p=0.95,
            max_output_tokens=2048,
            response_mime_type="application/json",
        ),
    )

    response = model.generate_content(user_prompt)
    return response.text
