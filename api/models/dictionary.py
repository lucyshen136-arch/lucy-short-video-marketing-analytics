from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.database import Base


class DictionarySet(Base):
    __tablename__ = "dictionary_sets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    version: Mapped[str | None] = mapped_column(String(32))
    source_doc: Mapped[str | None] = mapped_column(Text)
    scope: Mapped[str | None] = mapped_column(Text)
    extra: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    fields: Mapped[list["DictionaryField"]] = relationship(
        back_populates="set", cascade="all, delete-orphan", order_by="DictionaryField.id"
    )


class DictionaryField(Base):
    __tablename__ = "dictionary_fields"
    __table_args__ = (UniqueConstraint("set_id", "field_key", name="uq_dictionary_fields_set_key"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    set_id: Mapped[int] = mapped_column(ForeignKey("dictionary_sets.id", ondelete="CASCADE"), nullable=False)
    field_key: Mapped[str] = mapped_column(String(64), nullable=False)
    label_zh: Mapped[str] = mapped_column(String(128), nullable=False)
    field_kind: Mapped[str] = mapped_column(String(32), nullable=False, default="enum")
    question: Mapped[str | None] = mapped_column(Text)
    extra: Mapped[dict | None] = mapped_column(JSONB)
    items: Mapped[list["DictionaryItem"]] = relationship(
        back_populates="field", cascade="all, delete-orphan", order_by="DictionaryItem.sort_order"
    )
    set: Mapped[DictionarySet] = relationship(back_populates="fields")


class DictionaryItem(Base):
    __tablename__ = "dictionary_items"
    __table_args__ = (UniqueConstraint("field_id", "code", name="uq_dictionary_items_field_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    field_id: Mapped[int] = mapped_column(ForeignKey("dictionary_fields.id", ondelete="CASCADE"), nullable=False)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    label_zh: Mapped[str] = mapped_column(String(128), nullable=False)
    definition: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    extra: Mapped[dict | None] = mapped_column(JSONB)
    field: Mapped[DictionaryField] = relationship(back_populates="items")
