from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from api.database import Base


class Video(Base):
    __tablename__ = "videos"

    video_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    selection_reason: Mapped[str] = mapped_column(Text, nullable=False)
    source_kind: Mapped[str | None] = mapped_column(String(32))

    meta_platform: Mapped[str] = mapped_column(String(32), nullable=False)
    meta_public_url: Mapped[str] = mapped_column(Text, nullable=False)
    meta_title: Mapped[str] = mapped_column(Text, nullable=False)
    meta_creator_name: Mapped[str] = mapped_column(Text, nullable=False)
    meta_publish_date: Mapped[date] = mapped_column(Date, nullable=False)
    meta_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    meta_collected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    meta_view_count: Mapped[int | None] = mapped_column(BigInteger)
    meta_like_count: Mapped[int | None] = mapped_column(BigInteger)
    meta_comment_count: Mapped[int | None] = mapped_column(BigInteger)
    meta_save_count: Mapped[int | None] = mapped_column(BigInteger)
    meta_share_count: Mapped[int | None] = mapped_column(BigInteger)
    meta_follower_count: Mapped[int | None] = mapped_column(BigInteger)
    meta_hashtags: Mapped[str | None] = mapped_column(Text)

    content_type: Mapped[str | None] = mapped_column(String(64))
    content_hook_type: Mapped[str | None] = mapped_column(String(64))
    content_narrative_structure: Mapped[str | None] = mapped_column(String(64))
    content_value_proposition: Mapped[str | None] = mapped_column(Text)
    content_persuasion: Mapped[str | None] = mapped_column(String(64))
    content_evidence_type: Mapped[str | None] = mapped_column(String(64))
    content_funnel_stage: Mapped[str | None] = mapped_column(String(64))
    content_cta_type: Mapped[str | None] = mapped_column(String(64))

    viewer_continued_watching: Mapped[str | None] = mapped_column(String(32))
    viewer_memory_score: Mapped[int | None] = mapped_column(Integer)
    viewer_trust_score: Mapped[int | None] = mapped_column(Integer)
    viewer_action_intent_score: Mapped[int | None] = mapped_column(Integer)

    ai_content_type: Mapped[str | None] = mapped_column(String(64))
    ai_hook_type: Mapped[str | None] = mapped_column(String(64))
    ai_narrative_structure: Mapped[str | None] = mapped_column(String(64))
    ai_value_proposition: Mapped[str | None] = mapped_column(Text)
    ai_persuasion: Mapped[str | None] = mapped_column(String(64))
    ai_evidence_type: Mapped[str | None] = mapped_column(String(64))
    ai_funnel_stage: Mapped[str | None] = mapped_column(String(64))
    ai_cta_type: Mapped[str | None] = mapped_column(String(64))
    ai_label_status: Mapped[str | None] = mapped_column(String(32))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
