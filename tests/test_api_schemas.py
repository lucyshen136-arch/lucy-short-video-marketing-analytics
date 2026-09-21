import pytest
from pydantic import ValidationError

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
