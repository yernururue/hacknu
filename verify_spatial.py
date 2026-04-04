import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from services.canvas_service import find_empty_position
from models.schemas import CanvasShape

def test_positioning():
    print("Testing spatial intelligence...")
    shapes = [
        CanvasShape(id="1", type="sticky", content="Coffee beans", x=100, y=100),
        CanvasShape(id="2", type="sticky", content="Milk", x=400, y=100),
    ]
    
    # Test collision avoidance
    pos1 = find_empty_position(shapes)
    print(f"Empty pos (no keywords): {pos1}")
    assert pos1 != (100, 100) and pos1 != (400, 100)
    
    # Test keyword proximity
    pos2 = find_empty_position(shapes, keywords="beans")
    print(f"Empty pos (beans keyword): {pos2}")
    # Should be near (100, 100) but not overlapping
    assert abs(pos2[0] - 100) < 500
    assert abs(pos2[1] - 100) < 500

if __name__ == "__main__":
    test_positioning()
