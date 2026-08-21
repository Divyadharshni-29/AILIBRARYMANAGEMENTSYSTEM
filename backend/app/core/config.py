import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Library Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Server Binding (honors PORT and HOST provided by cloud environments like Render/Railway/Heroku)
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security: Override with environment variable SECRET_KEY in production
    SECRET_KEY: str = "super-secret-key-ai-library-management-2026-prod-jwt"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database: Supports MySQL (mysql+pymysql://user:pass@host:port/dbname) and SQLite
    # Default to local SQLite database for zero-config local execution, override via DATABASE_URL for MySQL
    DATABASE_URL: str = "sqlite:///./ai_library.db"

    # AI Recommendation Weights
    CONTENT_WEIGHT: float = 0.40
    COLLAB_WEIGHT: float = 0.30
    BEHAVIOUR_WEIGHT: float = 0.20
    POPULARITY_WEIGHT: float = 0.10

    # Library Policy Defaults (College Central Library Standards)
    BORROW_DAYS_LIMIT: int = 14
    MAX_ACTIVE_BORROWS: int = 5
    DAILY_FINE_RATE: float = 5.0  # ₹5.00 INR per day overdue

    # CORS Allowed Origins
    # Can be provided as comma-separated string or list in environment variables
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, str):
            return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        return list(self.ALLOWED_ORIGINS)

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()
