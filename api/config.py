from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = (
        "postgresql+psycopg://lucy_marketing:lucy_marketing_dev@localhost:5432/video_analytics"
    )
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    content_dictionary_path: Path = REPO_ROOT / "data" / "content_label_dictionary.json"
    viewer_dictionary_path: Path = REPO_ROOT / "data" / "viewer_label_dictionary.json"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
