from fastapi import APIRouter
from typing import List
from models.schemas import CanvasShape

router = APIRouter()

@router.get("/")
async def get_canvas_state():
    return {"shapes": []}

@router.post("/update")
async def update_canvas(shapes: List[CanvasShape]):
    return {"status": "ok", "count": len(shapes)}
