import re
from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator

from api.dictionaries import (
    CONTENT_ENUM_FIELDS,
    PLATFORM_CODES,
    VIEWER_ENUM_FIELDS,
    VIDEO_ID_PATTERN,
    enum_codes,
    load_content_dictionary,
    load_viewer_dictionary,
)

Score = Annotated[int, Field(ge=1, le=5)]


def _empty_to_none(value: str | int | None) -> str | int | None:
    if value == "" or value is None:
        return None
    return value


class VideoBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    selection_reason: str = Field(min_length=1)
    source_kind: str | None = None

    meta_platform: str
    meta_public_url: str = Field(min_length=1)
    meta_title: str = Field(min_length=1)
    meta_creator_name: str = Field(min_length=1)
    meta_publish_date: date
    meta_duration_seconds: int | None = Field(default=None, ge=1)
    meta_collected_at: datetime | None = None
    meta_view_count: int | None = Field(default=None, ge=0)
    meta_like_count: int | None = Field(default=None, ge=0)
    meta_comment_count: int | None = Field(default=None, ge=0)
    meta_save_count: int | None = Field(default=None, ge=0)
    meta_share_count: int | None = Field(default=None, ge=0)
    meta_follower_count: int | None = Field(default=None, ge=0)
    meta_hashtags: str | None = None

    content_type: str | None = None
    content_hook_type: str | None = None
    content_narrative_structure: str | None = None
    content_value_proposition: str | None = None
    content_persuasion: str | None = None
    content_evidence_type: str | None = None
    content_funnel_stage: str | None = None
    content_cta_type: str | None = None

    viewer_continued_watching: str | None = None
    viewer_memory_score: int | None = Field(default=None, ge=1, le=5)
    viewer_trust_score: int | None = Field(default=None, ge=1, le=5)
    viewer_action_intent_score: int | None = Field(default=None, ge=1, le=5)

    ai_content_type: str | None = None
    ai_hook_type: str | None = None
    ai_narrative_structure: str | None = None
    ai_value_proposition: str | None = None
    ai_persuasion: str | None = None
    ai_evidence_type: str | None = None
    ai_funnel_stage: str | None = None
    ai_cta_type: str | None = None
    ai_label_status: str | None = None

    @field_validator(
        "meta_duration_seconds",
        "meta_view_count",
        "meta_like_count",
        "meta_comment_count",
        "meta_save_count",
        "meta_share_count",
        "meta_follower_count",
        "viewer_memory_score",
        "viewer_trust_score",
        "viewer_action_intent_score",
        mode="before",
    )
    @classmethod
    def coerce_empty_numeric(cls, value):
        return _empty_to_none(value)

    @field_validator("meta_platform")
    @classmethod
    def validate_platform(cls, value: str) -> str:
        if value not in PLATFORM_CODES:
            raise ValueError(f"meta_platform must be one of {sorted(PLATFORM_CODES)}")
        return value

    def validate_enums(self) -> None:
        content_dict = load_content_dictionary()
        viewer_dict = load_viewer_dictionary()
        for field in CONTENT_ENUM_FIELDS:
            val = getattr(self, field)
            if val is None:
                continue
            allowed = enum_codes(content_dict, field)
            if val not in allowed:
                raise ValueError(f"{field} must be one of {sorted(allowed)}")
        for field in VIEWER_ENUM_FIELDS:
            val = getattr(self, field)
            if val is None:
                continue
            allowed = enum_codes(viewer_dict, field)
            if val not in allowed:
                raise ValueError(f"{field} must be one of {sorted(allowed)}")


class VideoCreate(VideoBase):
    video_id: str = Field(min_length=1, max_length=64)

    @field_validator("video_id")
    @classmethod
    def validate_video_id(cls, value: str) -> str:
        if not re.match(VIDEO_ID_PATTERN, value):
            raise ValueError("video_id must match ^[A-Z0-9_-]+$")
        return value


class VideoUpdate(VideoBase):
    pass


class VideoRead(VideoBase):
    model_config = ConfigDict(from_attributes=True)

    video_id: str
    created_at: datetime
    updated_at: datetime


class VideoListResponse(BaseModel):
    items: list[VideoRead]
    total: int
    page: int
    page_size: int
