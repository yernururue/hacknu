import asyncio
import json
import base64
import sys
import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import AgentMessageRequest, AgentAction

# Ensure we can import from ai folder
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "ai"))
from agent_loop import run_agent

router = APIRouter()

@router.post("/message")
async def process_agent_message(request: AgentMessageRequest):
    """
    Handle agent requests and return actions via SSE.
    """
    
    # Process base64 image if provided
    image_bytes = None
    if request.image_base64:
        # Strip data URL prefix if present
        b64_data = request.image_base64
        if b64_data.startswith("data:image/png;base64,"):
            b64_data = b64_data.split(",")[1]
        image_bytes = base64.b64decode(b64_data)

    async def sse_event_generator():
        # Step 1: Thinking phase
        if image_bytes:
            yield f"event: thinking\ndata: Analyzing canvas with Vision...\n\n"
        else:
            yield f"event: thinking\ndata: Analyzing canvas layout...\n\n"
        await asyncio.sleep(0.5)
        
        # Step 2: Set basic roles and build context
        system_prompt = "You are an AI brainstorming collaborator on a visual canvas."
        persona_text = "Provide ideas and structural groupings based on the drawing."
        
        canvas_context = ""
        for s in request.shapes:
            canvas_context += f"- Shape {s.id} ({s.type}): content='{s.content}', x={s.x}, y={s.y}\n"
        
        # Run agent with vision input
        try:
            # We call the imported run_agent which wraps the Gemini SDK implementation
            result = run_agent(
                canvas_context=canvas_context,
                user_message=request.message,
                persona_text=persona_text,
                system_prompt=system_prompt,
                image_bytes=image_bytes
            )
            
            # Step 3: Stream each returned parsed action
            actions_list = result.get("actions", [])
            for action in actions_list:
                # Resolve field mapping to fit the frontend/backend action expectation
                out_action = {
                    "action": action.get("action_type", action.get("action")),
                    "content": action.get("content"),
                    "x": action.get("x"),
                    "y": action.get("y"),
                    "reasoning": action.get("reasoning", "Vision insights generated this location"),
                    "tentative": action.get("tentative", True)
                }
                action_data = json.dumps(out_action)
                yield f"event: action\ndata: {action_data}\n\n"
                await asyncio.sleep(0.1)
                
        except Exception as e:
            print("Error executing agent:", e)
            
        yield f"event: close\ndata: done\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream"
    )
