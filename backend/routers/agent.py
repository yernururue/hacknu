import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import AgentMessageRequest, AgentAction

router = APIRouter()

@router.post("/message")
async def process_agent_message(request: AgentMessageRequest):
    """
    Handle agent requests and return actions via SSE.
    """
    
    async def sse_event_generator():
        # Step 1: Thinking phase
        yield f"event: thinking\ndata: Analyzing canvas and generating ideas...\n\n"
        await asyncio.sleep(0.5)
        
        # Step 2: Get actions from Groq service
        from services.ai_service import get_agent_actions
        actions = await get_agent_actions(request.message, request.shapes, request.agent_mode)
        
        # Step 3: Stream each action one by one
        for action in actions:
            action_data = json.dumps(action.model_dump())
            yield f"event: action\ndata: {action_data}\n\n"
            await asyncio.sleep(0.2) # Small delay for visual effect
        
        # Step 4: Finalize
        yield f"event: close\ndata: done\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream"
    )
