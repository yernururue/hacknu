from typing import List, Tuple
from models.schemas import CanvasShape

def build_canvas_context(shapes: List[CanvasShape]) -> str:
    """
    Converts list of shapes into a readable text description for the AI.
    """
    if not shapes:
        return "The canvas is currently empty."
    
    context_lines = ["Current canvas state:"]
    for shape in shapes:
        line = f'- "{shape.content}" ({shape.type}) at position ({shape.x}, {shape.y})'
        if shape.color:
            line += f" with color {shape.color}"
        context_lines.append(line)
    
    return "\n".join(context_lines)

def find_empty_position(shapes: List[CanvasShape], grid_size: int = 200) -> Tuple[float, float]:
    """
    Finds a likely empty position on the canvas to place a new sticky note.
    Simple grid-based heuristic to avoid immediate overlap.
    """
    if not shapes:
        return (100.0, 100.0)
    
    # Simple logic: find max X and offset or find a gap
    # For now, just offset from the last shape or move to a new 'row'
    max_x = max(s.x for s in shapes)
    max_y = max(s.y for s in shapes)
    
    # If the canvas is getting wide, start a new row
    if max_x > 1000:
        return (100.0, max_y + grid_size)
    
    return (max_x + grid_size, 100.0)
