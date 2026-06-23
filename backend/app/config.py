import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "Smart Customer Triage Platform"
    API_V1_STR: str = "/api"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Database Settings
    # If DATABASE_URL is not set, default to SQLite in the workspace directory
    DATABASE_URL: str = "sqlite:///./gateway_triage.db"
    
    # LLM Settings (OpenAI Compatible - legacy fallback)
    OPENAI_API_KEY: str = ""
    OPENAI_API_BASE: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Google Gemini Settings (Primary)
    GEMINI_API_KEY: str = ""
    
    # Run in mock AI mode if True or if no API key is provided
    MOCK_AI_MODE: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Check if Gemini API key exists. If so, toggle mock mode off.
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
    settings.MOCK_AI_MODE = False
else:
    settings.MOCK_AI_MODE = True

