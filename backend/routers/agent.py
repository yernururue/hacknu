import asyncio
import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from ai.agent_loop import run_agent
from backend.models.schemas import AgentRequest, FALLBACK_ACTION
from backend.services.canvas_service import build_canvas_context

router = APIRouter(prefix="/agent", tags=["agent"])


async def _event_stream(request: AgentRequest):
    """
    Run the AI agent and yield SSE events.
    Each event is a JSON-encoded StickyAction.
    """
    canvas_context = build_canvas_context(request.canvas_state)

    try:
        actions = await asyncio.to_thread(
            run_agent,
            user_message=request.message,
            canvas_context=canvas_context,
            agent_mode=request.agent_mode,
        )

        for action in actions:
            yield {
                "event": "action",
                "data": json.dumps(action.model_dump()),
            }

    except Exception as exc:
        fallback = FALLBACK_ACTION.model_copy()
        fallback.reasoning = f"Error: {str(exc)[:120]}"
        yield {
            "event": "action",
            "data": json.dumps(fallback.model_dump()),
        }

    yield {"event": "done", "data": "{}"}


@router.post("/message")
async def agent_message(request: AgentRequest):
    """
    Accept a user message + canvas state, stream back AI actions via SSE.
    """
    return EventSourceResponse(_event_stream(request))
