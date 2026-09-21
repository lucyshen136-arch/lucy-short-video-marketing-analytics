"""Seed V001 from public_sample.csv row (run after migrations)."""

from datetime import date, datetime, timezone

from api.database import SessionLocal
from api.models.video import Video

SELECTION_REASON = "试点样本：动漫下饭切片，用于三层字段录入与 Web 管理验证。"


def main() -> None:
    db = SessionLocal()
    try:
        if db.get(Video, "V001"):
            print("V001 already exists; skip.")
            return
        row = Video(
            video_id="V001",
            selection_reason=SELECTION_REASON,
            source_kind="observed",
            meta_platform="douyin",
            meta_public_url="https://v.douyin.com/iNg6o6ZmzYY/",
            meta_title="谁会拒绝吃饭时看一集蜡笔小新呢？",
            meta_creator_name="蜡笔小新",
            meta_publish_date=date(2026, 8, 19),
            meta_duration_seconds=None,
            meta_collected_at=datetime(2026, 8, 21, 14, 14, tzinfo=timezone.utc),
            meta_view_count=None,
            meta_like_count=7140,
            meta_comment_count=124,
            meta_save_count=1267,
            meta_share_count=1143,
            meta_follower_count=1012000,
            meta_hashtags="#蜡笔小新,#野原新之助,#下饭剧",
            content_type="anime_comic_commentary",
            content_hook_type="strong_visual",
            content_narrative_structure="chronological",
            content_value_proposition="打发时间",
            content_persuasion="story_resonance",
            content_evidence_type="verbal_only",
            content_funnel_stage="awareness",
            content_cta_type="none",
            viewer_continued_watching="finished",
            viewer_memory_score=3,
            viewer_trust_score=3,
            viewer_action_intent_score=1,
        )
        db.add(row)
        db.commit()
        print("Seeded V001.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
