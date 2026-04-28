"""Runtime configuration loaded from environment variables."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PAGELENS_", env_file=".env", extra="ignore")

    environment: str = "development"
    redis_url: str = "redis://localhost:6379/0"
    database_url: str = "postgresql://localhost:5432/pagelens"
    demo_api_key: str = "demo-key-change-me"
    rate_limit_per_minute: int = 30
    cache_ttl_seconds: int = 60 * 60 * 24
    cors_origins: list[str] = ["chrome-extension://*"]


def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
