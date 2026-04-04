from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Brainstorm Canvas API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    ANTHROPIC_API_KEY: str = ""
    
    DEBUG: bool = True
    PORT: int = 8000
    
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
