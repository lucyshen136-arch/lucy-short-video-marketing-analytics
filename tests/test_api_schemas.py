import pytest
from pydantic import ValidationError

from api.schemas.dictionary import DictionaryItemCreate, DictionarySetCreate
from api.schemas.video import VideoCreate


def test_video_create_requires_selection_reason():
    with pytest.raises(ValidationError):
        VideoCreate(
            video_id="V999",
            selection_reason="",
            meta_platform="douyin",
            meta_public_url="https://example.com",
            meta_title="t",
            meta_creator_name="c",
            meta_publish_date="2026-01-01",
        )


def test_video_create_accepts_empty_metrics_as_none():
    row = VideoCreate(
        video_id="V999",
        selection_reason="pilot sample",
        meta_platform="douyin",
        meta_public_url="https://example.com",
        meta_title="t",
        meta_creator_name="c",
        meta_publish_date="2026-01-01",
        meta_view_count=None,
    )
    assert row.meta_view_count is None


def test_dictionary_set_slug_must_be_lowercase():
    with pytest.raises(ValidationError):
        DictionarySetCreate(slug="Content", name="内容")


def test_dictionary_item_create_requires_field_key():
    item = DictionaryItemCreate(field_key="content_hook_type", code="question", label_zh="提问")
    assert item.field_key == "content_hook_type"
