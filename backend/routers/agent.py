import json

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse
from starlette.concurrency import run_in_threadpool

from ai.agent_loop import run_agent
from backend.models.schemas import AgentRequest, FALLBACK_ACTION
from backend.services.canvas_service import build_canvas_context

router = APIRouter(prefix="/agent", tags=["agent"])


async def _event_stream(request: AgentRequest):
    """
    Run the AI agent and yield SSE events.
    Each event is a JSON-encoded action object.
    """
    canvas_context = build_canvas_context(request.canvas_state)

    try:
        actions = await run_in_threadpool(
            run_agent,
            canvas_context,
            request.message,
            request.agent_mode,
            request.image_data,
            request.audio_data,
        )

        for action in actions:
            yield {
                "event": "action",
                "data": json.dumps(action),
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
    if not request.message.strip():
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "type": "string_too_short",
                    "loc": ["body", "message"],
                    "msg": "String should have at least 1 character",
                    "input": request.message,
                    "ctx": {"min_length": 1},
                }
            ],
        )
    return EventSourceResponse(_event_stream(request))


@router.post("/analyze")
async def analyze_canvas(req: AgentRequest):
    analysis_prompt = (
        "Look at this canvas. What patterns do you see? What should we explore next?"
    )
    canvas_context = build_canvas_context(req.canvas_state)

    async def _analyze_stream():
        try:
            actions = await run_in_threadpool(
                run_agent,
                canvas_context,
                analysis_prompt,
                req.agent_mode,
                req.image_data,
                req.audio_data,
            )

            for action in actions:
                yield {
                    "event": "action",
                    "data": json.dumps(action),
                }

        except Exception as exc:
            fallback = FALLBACK_ACTION.model_copy()
            fallback.reasoning = f"Error: {str(exc)[:120]}"
            yield {
                "event": "action",
                "data": json.dumps(fallback.model_dump()),
            }

        yield {"event": "done", "data": "{}"}

    return EventSourceResponse(_analyze_stream())
