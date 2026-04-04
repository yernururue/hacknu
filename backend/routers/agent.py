import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import AgentMessageRequest, AgentAction
from services.canvas_service import build_canvas_context
from services.claude_service import get_agent_action

router = APIRouter()

@router.post("/message")
async def process_agent_message(request: AgentMessageRequest):
    """
    Handle agent requests and return actions via SSE.
    """
    
    async def sse_event_generator():
        # Step 1: Pre-processing message
        yield {
            "event": "message",
            "data": json.dumps({
                "status": "thinking",
                "message": "Processing your brainstorm request..."
            })
        }
        await asyncio.sleep(0.5)
        
        # Step 2: Build canvas context
        context = build_canvas_context(request.shapes)
        
        # Step 3: Get action from (mocked) Claude Service
        action = await get_agent_action(request.message, context)
        
        # Step 4: Stream the actual action
        yield {
            "event": "message",
            "data": json.dumps(action.model_dump())
        }
        
        # Step 5: Finalize
        yield {
            "event": "close",
            "data": "done"
        }

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream"
    )
