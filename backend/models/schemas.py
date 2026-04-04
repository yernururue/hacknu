from pydantic import BaseModel, Field
from typing import List, Optional, Union

class CanvasShape(BaseModel):
    id: str
    type: str = Field(..., description="Type of shape (e.g., sticky, box, arrow)")
    content: str
    x: float
    y: float
    color: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None

class AgentMessageRequest(BaseModel):
    message: str = Field(..., description="The user's message to the agent")
    shapes: List[CanvasShape] = Field(default_factory=list, description="Current state of the canvas")
    agent_mode: str = Field(default="brainstorm", description="The current mode of the agent")
    image_base64: Optional[str] = None

class AgentAction(BaseModel):
    action: str = Field(..., description="Action type: place_sticky, update_shape, delete_shape")
    content: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    shape_id: Optional[str] = None
    reasoning: str = Field(..., description="Explanation for the action")
    tentative: bool = Field(default=False, description="Whether the action is a suggestion or a final decision")

class HealthCheck(BaseModel):
    ok: bool = True
