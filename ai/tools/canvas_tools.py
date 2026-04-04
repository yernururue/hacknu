# Gemini's Python SDK natively parses Python functions into JSON schemas for tool calling.
# We define dummy functions here with type hints and docstrings.

def place_sticky(content: str, x: float, y: float, reasoning: str, tentative: bool):
    """
    Place a new sticky note on the canvas.
    
    Args:
        content: Short text for the idea/sticky note (3-8 words).
        x: The x coordinate for the sticky note placement.
        y: The y coordinate for the sticky note placement.
        reasoning: Reasoning for the idea and its spatial placement.
        tentative: True if the idea is creative/risky, false if obvious.
    """
    pass

def group_ideas(shape_ids: list[str], label: str):
    """
    Group existing ideas together under a common label.
    
    Args:
        shape_ids: Array of string IDs of the shapes to group.
        label: A summarizing label for the group.
    """
    pass

# Pass these directly to the `tools` parameter in Gemini SDK
CANVAS_TOOLS = [place_sticky, group_ideas]
