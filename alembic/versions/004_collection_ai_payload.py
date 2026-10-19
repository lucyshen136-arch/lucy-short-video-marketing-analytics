"""store collected AI summary and labels

Revision ID: 004
Revises: 003
Create Date: 2026-10-18

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("collection_items", sa.Column("ai_payload", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("collection_items", "ai_payload")
