from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Lumina – AI Assistant for Enterprise Knowledge"
    environment: str = "development"
    # PostgreSQL is the deployment default. Tests/POC may override DATABASE_URL with SQLite.
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/shb_rag"
    database_ssl: bool = False
    jwt_secret_key: str = "change-me-in-development"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    refresh_token_days: int = 30
    storage_backend: str = "local"
    local_storage_path: str = "./storage"
    max_upload_bytes: int = 50 * 1024 * 1024
    ai_provider: str = "mock"
    ai_service_url: str = "http://localhost:9000/internal/v1"
    frontend_origins: str = "http://localhost:8443,http://localhost:5173"
    r2_account_id: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket: str | None = None
    r2_endpoint: str | None = None
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.frontend_origins.split(",") if item.strip()]

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        # Providers commonly expose postgresql:// URLs; the app requires asyncpg.
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+asyncpg://", 1)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
