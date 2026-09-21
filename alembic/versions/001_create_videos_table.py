"""create videos table

Revision ID: 001
Revises:
Create Date: 2026-09-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "videos",
        sa.Column("video_id", sa.String(length=64), nullable=False),
        sa.Column("selection_reason", sa.Text(), nullable=False),
        sa.Column("source_kind", sa.String(length=32), nullable=True),
        sa.Column("meta_platform", sa.String(length=32), nullable=False),
        sa.Column("meta_public_url", sa.Text(), nullable=False),
        sa.Column("meta_title", sa.Text(), nullable=False),
        sa.Column("meta_creator_name", sa.Text(), nullable=False),
        sa.Column("meta_publish_date", sa.Date(), nullable=False),
        sa.Column("meta_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("meta_collected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("meta_view_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_like_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_comment_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_save_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_share_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_follower_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_hashtags", sa.Text(), nullable=True),
        sa.Column("content_type", sa.String(length=64), nullable=True),
        sa.Column("content_hook_type", sa.String(length=64), nullable=True),
        sa.Column("content_narrative_structure", sa.String(length=64), nullable=True),
        sa.Column("content_value_proposition", sa.Text(), nullable=True),
        sa.Column("content_persuasion", sa.String(length=64), nullable=True),
        sa.Column("content_evidence_type", sa.String(length=64), nullable=True),
        sa.Column("content_funnel_stage", sa.String(length=64), nullable=True),
        sa.Column("content_cta_type", sa.String(length=64), nullable=True),
        sa.Column("viewer_continued_watching", sa.String(length=32), nullable=True),
        sa.Column("viewer_memory_score", sa.Integer(), nullable=True),
        sa.Column("viewer_trust_score", sa.Integer(), nullable=True),
        sa.Column("viewer_action_intent_score", sa.Integer(), nullable=True),
        sa.Column("ai_content_type", sa.String(length=64), nullable=True),
        sa.Column("ai_hook_type", sa.String(length=64), nullable=True),
        sa.Column("ai_narrative_structure", sa.String(length=64), nullable=True),
        sa.Column("ai_value_proposition", sa.Text(), nullable=True),
        sa.Column("ai_persuasion", sa.String(length=64), nullable=True),
        sa.Column("ai_evidence_type", sa.String(length=64), nullable=True),
        sa.Column("ai_funnel_stage", sa.String(length=64), nullable=True),
        sa.Column("ai_cta_type", sa.String(length=64), nullable=True),
        sa.Column("ai_label_status", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("video_id"),
    )


def downgrade() -> None:
    op.drop_table("videos")
