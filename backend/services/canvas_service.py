"""
canvas_service.py
Transforms raw canvas state into a concise text summary for the AI prompt.
"""

from backend.models.schemas import CanvasShape


def build_canvas_context(shapes: list[CanvasShape]) -> str:
    """
    Convert a list of canvas shapes into a human-readable context string
    that the AI can reason over.

    Returns an empty-canvas notice when there are no shapes.
    """
    if not shapes:
        return "Canvas is empty."

    lines = []
    for shape in shapes:
        body = shape.text.replace("'", "\\'")
        color = shape.color if shape.color else "default"
        lines.append(
            f"Sticky id={shape.id} at ({shape.x:.0f},{shape.y:.0f}) color={color}: '{body}'"
        )

    return "\n".join(lines)
