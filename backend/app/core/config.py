"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from `.env` and environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    APP_NAME: str = "QuickSplit Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    DATABASE_URL: str
    DB_ECHO: bool = False
    SECRET_KEY: str | None = None
    JWT_SECRET_KEY: str = Field(..., description="Secret key for JWT generation")
    JWT_ALGORITHM: str = Field(..., description="JWT Algorithm to use")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(..., description="Access token expiration time")
    BACKEND_CORS_ORIGINS: list[str] = Field(default=["*"], description="CORS origins list")

    @model_validator(mode="before")
    def map_secret_key(cls, values: dict[str, object]) -> dict[str, object]:
        if "JWT_SECRET_KEY" not in values and "SECRET_KEY" in values:
            values["JWT_SECRET_KEY"] = values["SECRET_KEY"]
        return values


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
