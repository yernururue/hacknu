import sys
import os
from pathlib import Path

# Add project root to path so `ai` package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.routers import agent

# Load environment variables from backend/.env
load_dotenv(Path(__file__).resolve().parent / ".env")

app = FastAPI(
    title="AI Brainstorm Canvas",
    description="Backend for AI-powered brainstorming canvas with Gemini",
    version="1.0.0",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(agent.router)


@app.get("/health")
async def health():
    return {"ok": True}
