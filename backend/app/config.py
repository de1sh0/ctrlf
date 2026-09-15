from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    FRONTEND_URL: str = "http://localhost:8080"
    BACKEND_URL: str = "http://localhost:8000"
    GROQ_API_KEY: str = ""   # Legacy single-key fallback

    # Multi-key rotation pool (add up to 5 free keys)
    GROQ_API_KEY_1: str = ""
    GROQ_API_KEY_2: str = ""
    GROQ_API_KEY_3: str = ""
    GROQ_API_KEY_4: str = ""
    GROQ_API_KEY_5: str = ""

    # SMTP Config
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    # Google OAuth (replaces credentials.json)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()