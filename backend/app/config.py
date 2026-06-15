"""应用配置 — 从 .env 读取"""
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)


class Settings:
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret")
    ALGORITHM: str = os.environ.get("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./travel_assistant.db")
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")


settings = Settings()