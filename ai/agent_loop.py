import os
import random
from anthropic import Anthropic
from tools.canvas_tools import CANVAS_TOOLS

def run_agent(canvas_context: str, user_message: str, persona_text: str, system_prompt: str) -> dict:
    """
    Executes the agent loop by calling Claude with the specified tools.
    """
    anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set.")

    client = Anthropic(api_key=anthropic_api_key)
    
    # Combine the core system prompt with the dynamically injected persona
    full_system_prompt = f"{system_prompt}\n\n{persona_text}"
    
    messages = [
        {
            "role": "user",
            "content": f"<canvas_context>\n{canvas_context}\n</canvas_context>\n\nRequest: {user_message}"
        }
    ]

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        system=full_system_prompt,
        messages=messages,
        tools=CANVAS_TOOLS
    )

    # Parse response for a tool_use block
    for block in response.content:
        if block.type == "tool_use":
            return {
                "name": block.name,
                "input": block.input
            }

    # Fallback parsing if Claude returns a standard text block
    text_content = "".join([block.text for block in response.content if block.type == "text"])
    
    # Extract the first 50 characters for the fallback sticky note content
    fallback_content = text_content[:50].strip() if text_content else "Fallback sticky"
    
    return {
        "name": "place_sticky",
        "input": {
            "content": fallback_content,
            "x": random.randint(0, 1000),
            "y": random.randint(0, 1000),
            "reasoning": "Fallback triggered. Model responded with text instead of a tool call.",
            "tentative": False
        }
    }
