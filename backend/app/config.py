"""Application settings powered by pydantic-settings."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Database ──
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = Field(default="quiz", alias="DB")
    MONGO_MIN_POOL_SIZE: int = 5
    MONGO_MAX_POOL_SIZE: int = 50

    # ── Auth / JWT ──
    JWT_SECRET: str = "change-me-in-production-use-a-strong-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── AI ──
    GEMINI_API_KEY: str = ""

    # ── CORS ──
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # ── Limits ──
    MAX_REQUEST_BODY_BYTES: int = 2 * 1024 * 1024  # 2 MB

    # ── Environment ──
    ENVIRONMENT: str = "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()
