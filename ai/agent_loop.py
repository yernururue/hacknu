import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Structured Output Schemas ---
class Action(BaseModel):
    action_type: str = Field(description="The type of action: 'place_sticky', 'suggest', or 'group'")
    content: str = Field(description="Short text for the idea/sticky note (3-8 words)")
    x: float = Field(description="The x coordinate for the sticky note placement")
    y: float = Field(description="The y coordinate for the sticky note placement")
    reasoning: str = Field(description="Reasoning for the idea and its spatial placement")
    tentative: bool = Field(description="True if the idea is creative/risky, false if obvious")

class CanvasResponse(BaseModel):
    actions: list[Action] = Field(description="List of actions to take on the canvas")

def run_agent(canvas_context: str, user_message: str, persona_text: str, system_prompt: str) -> dict:
    """
    Executes the agent loop by calling Gemini using native Structured Outputs.
    Guarantees a clean dictionary return natively without fallback text strings.
    """
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Check your .env file.")

    # 1. Initialize the modern client
    client = genai.Client(api_key=gemini_api_key)
    
    # Structure prompts
    full_system_prompt = f"{system_prompt}\n\nPersona Instructions:\n{persona_text}"
    prompt = f"<canvas_context>\n{canvas_context}\n</canvas_context>\n\nRequest: {user_message}"

    try:
        # 2. Enforce strict JSON output matching Pydantic class
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=full_system_prompt,
                response_mime_type="application/json",
                response_schema=CanvasResponse,
                temperature=0.7 # Add optional creativity for brainstorming
            )
        )

        # 3. Model returns the fully parsed Pydantic object, return as native dict
        if response.parsed:
            return response.parsed.model_dump()
        else:
            return {"error": "Failed to parse structured output", "raw": response.text}

    except Exception as e:
        return {
            "error": str(e)
        }

if __name__ == "__main__":
    # Self-contained testing block to verify the implementation
    dummy_system = "You are a brainstorming assistant. Apply spatial intelligence."
    dummy_persona = "Focus on bold, disruptive ideas."
    dummy_context = "Notes: 1. 'Use AI' (X:100, Y:200)"
    dummy_request = "Give me two lateral thinking alternatives to AI."
    
    print("Testing Native Structured Outputs with Gemini-2.5-Flash...")
    result = run_agent(dummy_context, dummy_request, dummy_persona, dummy_system)
    
    from pprint import pprint
    print("\nFinal Clean Output Dictionary:")
    pprint(result)
