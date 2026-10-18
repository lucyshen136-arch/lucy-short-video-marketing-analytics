"""video model, model keys, and collection tables

Revision ID: 003
Revises: 002
Create Date: 2026-10-18

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "video_model_layers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("layer_key", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("layer_key"),
    )
    op.create_table(
        "video_model_fields",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("layer_id", sa.Integer(), sa.ForeignKey("video_model_layers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("field_key", sa.String(length=64), nullable=False),
        sa.Column("label", sa.String(length=128), nullable=False),
        sa.Column("field_kind", sa.String(length=32), nullable=False, server_default="text"),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("dictionary_slug", sa.String(length=64), nullable=True),
        sa.Column("builtin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.UniqueConstraint("layer_id", "field_key", name="uq_video_model_fields_layer_key"),
    )
    op.add_column("videos", sa.Column("extra", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.create_table(
        "model_api_keys",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("base_url", sa.Text(), nullable=False),
        sa.Column("model_name", sa.String(length=128), nullable=False),
        sa.Column("api_key", sa.Text(), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("timeout_seconds", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cooldown_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "collection_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("site_url", sa.Text(), nullable=False),
        sa.Column("keyword", sa.Text(), nullable=False, server_default=""),
        sa.Column("collect_count", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "collection_batches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("collection_jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("batch_no", sa.String(length=32), nullable=False),
        sa.Column("item_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "collection_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("batch_id", sa.Integer(), sa.ForeignKey("collection_batches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("meta_platform", sa.String(length=64), nullable=True),
        sa.Column("meta_public_url", sa.Text(), nullable=True),
        sa.Column("meta_title", sa.Text(), nullable=True),
        sa.Column("meta_creator_name", sa.Text(), nullable=True),
        sa.Column("meta_publish_date", sa.Date(), nullable=True),
        sa.Column("meta_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("meta_view_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_like_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_comment_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_save_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_share_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_follower_count", sa.BigInteger(), nullable=True),
        sa.Column("meta_hashtags", sa.Text(), nullable=True),
        sa.Column("imported_video_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("collection_items")
    op.drop_table("collection_batches")
    op.drop_table("collection_jobs")
    op.drop_table("model_api_keys")
    op.drop_column("videos", "extra")
    op.drop_table("video_model_fields")
    op.drop_table("video_model_layers")
