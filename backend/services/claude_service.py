import asyncio
import json
from models.schemas import AgentAction, CanvasShape
from typing import List

async def get_agent_action(message: str, canvas_context: str) -> AgentAction:
    """
    Mocked version of calling Anthropic Claude API.
    In the future, this will use the `anthropic` library and stream 
    the response or return the final action object.
    """
    # Simulate API latency
    await asyncio.sleep(1)
    
    # Simple hardcoded mock logic
    if "sticky" in message.lower() or "idea" in message.lower():
        return AgentAction(
            action="place_sticky",
            content="Generated idea base on: " + message[:30],
            x=350.0,
            y=250.0,
            reasoning="Responding to the request for a new sticky note.",
            tentative=False
        )
    
    return AgentAction(
        action="update_shape",
        reasoning="I'm here to help brainstorm. How can I assist?",
        content="Hello! Let's brainstorm.",
        tentative=True,
        shape_id="mock_id_1"
    )
