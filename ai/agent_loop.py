import os
import random
import google.generativeai as genai
from dotenv import load_dotenv
from tools.canvas_tools import CANVAS_TOOLS

# Load environment variables from .env
load_dotenv()

def run_agent(canvas_context: str, user_message: str, persona_text: str, system_prompt: str) -> dict:
    """
    Executes the agent loop by calling Gemini with the specified tools.
    """
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please update your .env file.")

    # Configure Gemini client
    genai.configure(api_key=gemini_api_key)
    
    # Combine the core system prompt with the dynamically injected persona
    full_system_prompt = f"{system_prompt}\n\n{persona_text}"
    
    # Initialize the model (using recommended 1.5-flash for tool calling and speed)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=full_system_prompt,
        tools=CANVAS_TOOLS
    )

    prompt = f"<canvas_context>\n{canvas_context}\n</canvas_context>\n\nRequest: {user_message}"

    try:
        response = model.generate_content(prompt)

        # Parse response for a tool_call (function call) block
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.function_call:
                    # Safely convert protobuf args to simple Python dictionary
                    args_dict = {}
                    for key in part.function_call.args:
                        val = part.function_call.args[key]
                        # Handle iterables (like the shape_ids array) to standard list
                        if hasattr(val, '__iter__') and not isinstance(val, str):
                            args_dict[key] = list(val)
                        else:
                            args_dict[key] = val

                    return {
                        "name": part.function_call.name,
                        "input": args_dict
                    }

        # Fallback parsing if Gemini returns a standard text block instead of tool call
        text_content = response.text if response.text else ""
        
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

    except Exception as e:
        return {
            "error": str(e)
        }
