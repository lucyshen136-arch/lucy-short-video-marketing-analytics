from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DictionaryItemBase(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    label_zh: str = Field(min_length=1, max_length=128)
    definition: str | None = None
    sort_order: int = 0
    extra: dict | None = None


class DictionaryItemCreate(DictionaryItemBase):
    field_key: str = Field(min_length=1, max_length=64)


class DictionaryItemUpdate(DictionaryItemBase):
    pass


class DictionaryItemRead(DictionaryItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    field_id: int


class DictionaryFieldBase(BaseModel):
    field_key: str = Field(min_length=1, max_length=64)
    label_zh: str = Field(min_length=1, max_length=128)
    field_kind: str = "enum"
    question: str | None = None
    extra: dict | None = None


class DictionaryFieldCreate(DictionaryFieldBase):
    pass


class DictionaryFieldUpdate(BaseModel):
    label_zh: str = Field(min_length=1, max_length=128)
    field_kind: str = "enum"
    question: str | None = None
    extra: dict | None = None


class DictionaryFieldRead(DictionaryFieldBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    items: list[DictionaryItemRead] = []


class DictionarySetBase(BaseModel):
    slug: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9_-]+$")
    name: str = Field(min_length=1, max_length=128)
    description: str | None = None
    version: str | None = None
    source_doc: str | None = None
    scope: str | None = None
    extra: dict | None = None


class DictionarySetCreate(DictionarySetBase):
    pass


class DictionarySetUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    description: str | None = None
    version: str | None = None
    source_doc: str | None = None
    scope: str | None = None
    extra: dict | None = None


class DictionarySetSummary(DictionarySetBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    field_count: int = 0
    item_count: int = 0


class DictionarySetRead(DictionarySetBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    fields: list[DictionaryFieldRead] = []
