from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agent, canvas
from core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend for AI Brainstorm Canvas"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(agent.router, prefix="/agent", tags=["Agent"])
app.include_router(canvas.router, prefix="/canvas", tags=["Canvas"])

@app.get("/health")
async def health_check():
    return {"ok": True, "status": "active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
