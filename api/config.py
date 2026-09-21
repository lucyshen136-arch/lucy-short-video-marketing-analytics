from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[1]


def to_sqlalchemy_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = (
        "postgresql+psycopg://lucy_marketing:lucy_marketing_dev@localhost:5432/video_analytics"
    )
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    content_dictionary_path: Path = REPO_ROOT / "data" / "content_label_dictionary.json"
    viewer_dictionary_path: Path = REPO_ROOT / "data" / "viewer_label_dictionary.json"

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        return to_sqlalchemy_url(value)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def database_migrate_url(self) -> str:
        """Alembic should prefer Neon's direct (non-pooler) host when present."""
        return self.database_url.replace("-pooler.", ".")


@lru_cache
def get_settings() -> Settings:
    return Settings()
