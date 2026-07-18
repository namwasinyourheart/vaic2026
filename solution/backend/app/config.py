from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SHB Advanced RAG Backend"
    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./shb_rag.db"
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
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.frontend_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
