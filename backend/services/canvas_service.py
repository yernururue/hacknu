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
        return "The canvas is currently empty. You have full freedom to place ideas anywhere."

    lines = [f"The canvas currently has {len(shapes)} shape(s):\n"]

    for i, shape in enumerate(shapes, start=1):
        text_preview = shape.text.strip()[:80] if shape.text.strip() else "(empty)"
        lines.append(
            f"  {i}. [{shape.type}] \"{text_preview}\" at position ({shape.x:.0f}, {shape.y:.0f})"
        )

    lines.append(
        "\nPlace new ideas in open space to avoid overlapping existing shapes. "
        "Each sticky note occupies roughly 200×200 pixels."
    )

    return "\n".join(lines)
