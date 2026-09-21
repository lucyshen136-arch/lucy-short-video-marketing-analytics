import json
from functools import lru_cache
from pathlib import Path

from api.config import get_settings


@lru_cache
def load_content_dictionary() -> dict:
    path: Path = get_settings().content_dictionary_path
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache
def load_viewer_dictionary() -> dict:
    path: Path = get_settings().viewer_dictionary_path
    return json.loads(path.read_text(encoding="utf-8"))


def enum_codes(dictionary: dict, field_name: str) -> set[str]:
    field = dictionary.get("fields", {}).get(field_name, {})
    values = field.get("values", [])
    return {item["code"] for item in values if "code" in item}


CONTENT_ENUM_FIELDS = {
    "content_type",
    "content_hook_type",
    "content_narrative_structure",
    "content_persuasion",
    "content_evidence_type",
    "content_funnel_stage",
    "content_cta_type",
}

VIEWER_ENUM_FIELDS = {"viewer_continued_watching"}

PLATFORM_CODES = {"douyin", "xiaohongshu", "bilibili"}

VIDEO_ID_PATTERN = r"^[A-Z0-9_-]+$"
