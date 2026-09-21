"""create dictionary tables

Revision ID: 002
Revises: 001
Create Date: 2026-09-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dictionary_sets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("version", sa.String(length=32), nullable=True),
        sa.Column("source_doc", sa.Text(), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("extra", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("slug"),
    )
    op.create_table(
        "dictionary_fields",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("set_id", sa.Integer(), sa.ForeignKey("dictionary_sets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("field_key", sa.String(length=64), nullable=False),
        sa.Column("label_zh", sa.String(length=128), nullable=False),
        sa.Column("field_kind", sa.String(length=32), nullable=False, server_default="enum"),
        sa.Column("question", sa.Text(), nullable=True),
        sa.Column("extra", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.UniqueConstraint("set_id", "field_key", name="uq_dictionary_fields_set_key"),
    )
    op.create_table(
        "dictionary_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("field_id", sa.Integer(), sa.ForeignKey("dictionary_fields.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("label_zh", sa.String(length=128), nullable=False),
        sa.Column("definition", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("extra", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.UniqueConstraint("field_id", "code", name="uq_dictionary_items_field_code"),
    )


def downgrade() -> None:
    op.drop_table("dictionary_items")
    op.drop_table("dictionary_fields")
    op.drop_table("dictionary_sets")
