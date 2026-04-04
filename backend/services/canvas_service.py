from typing import List, Tuple, Optional
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

def find_empty_position(shapes: List[CanvasShape], grid_x: int = 300, grid_y: int = 200, keywords: Optional[str] = None) -> Tuple[float, float]:
    """
    Finds a visually optimal empty position on the canvas.
    - Spreads items in a 300x200 grid.
    - Avoids overlapping existing shapes (250x150 bounding box).
    - Prefers placing near related ideas if keywords match.
    """
    # Define standard sticky size for collision detection
    STICKY_W, STICKY_H = 250, 150
    
    # Starting point: if we have keywords, find the most related existing shape
    start_x, start_y = 100.0, 100.0
    
    if keywords and shapes:
        # Simple keyword matching for proximity
        keywords_list = keywords.lower().split()
        best_match_score = 0
        
        for shape in shapes:
            score = sum(1 for kw in keywords_list if kw in shape.content.lower())
            if score > best_match_score:
                best_match_score = score
                # Start searching around this related shape
                start_x, start_y = shape.x, shape.y
    
    def is_occupied(px: float, py: float) -> bool:
        for s in shapes:
            sw = s.width or STICKY_W
            sh = s.height or STICKY_H
            # Check for overlap with a small buffer
            if (px < s.x + sw + 50) and (px + STICKY_W > s.x - 50) and \
               (py < s.y + sh + 50) and (py + STICKY_H > s.y - 50):
                return True
        return False

    # Spiral/Grid search starting from start_x, start_y
    # For simplicity, we search in a expanding grid from (100, 100) if no start point
    # or from start_x, start_y if provided.
    
    # Limit search to avoid infinite loops
    for row in range(0, 10):
        for col in range(0, 10):
            # Check positions in an expanding square pattern around start
            for dx, dy in [(col, row), (-col, row), (col, -row), (-col, -row)]:
                curr_x = max(100.0, start_x + dx * grid_x)
                curr_y = max(100.0, start_y + dy * grid_y)
                
                if not is_occupied(curr_x, curr_y):
                    return (curr_x, curr_y)
                    
    # Ultimate fallback: just shift from max
    if not shapes:
        return (100.0, 100.0)
    return (max(s.x for s in shapes) + grid_x, 100.0)
