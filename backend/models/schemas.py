from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CanvasShape(BaseModel):
    """A single shape on the canvas."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    type: str = Field(default="sticky", alias="shape_type")
    text: str = ""
    x: float = 0.0
    y: float = 0.0
    color: str = ""


class AgentRequest(BaseModel):
    """Incoming request from the frontend."""

    message: str = Field(
        default="",
        description="User prompt; required non-empty for /agent/message, may be empty for /agent/analyze",
    )
    canvas_state: list[CanvasShape] = Field(
        default_factory=list, description="Current shapes on canvas"
    )
    session_id: str = Field(default="default", description="Session identifier")
    agent_mode: str = Field(default="idea_generator", description="AI persona mode")
    image_data: Optional[str] = None  # base64-encoded canvas screenshot (e.g. PNG)
    audio_data: Optional[str] = None  # base64-encoded voice recording (e.g. webm/mp3)


class StickyAction(BaseModel):
    """Action the AI wants to perform on the canvas."""

    action: str = "place_sticky"
    content: str = ""
    x: float = 400.0
    y: float = 300.0
    reasoning: str = ""
    tentative: bool = False


# Fallback when Gemini returns garbage
FALLBACK_ACTION = StickyAction(
    action="place_sticky",
    content="I couldn't generate a valid idea. Please try again.",
    x=400,
    y=300,
    reasoning="AI response was malformed; returning safe fallback.",
    tentative=True,
)
