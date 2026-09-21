from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from api.database import get_db
from api.dictionaries import load_content_dictionary, load_viewer_dictionary
from api.models.dictionary import DictionaryField, DictionarySet

router = APIRouter(prefix="/dictionaries", tags=["dictionaries"])


def _set_as_label_json(row: DictionarySet) -> dict:
    fields = {}
    for field in row.fields:
        values = [
            {
                "code": item.code,
                "label_zh": item.label_zh,
                "definition": item.definition,
                **(item.extra or {}),
            }
            for item in field.items
        ]
        field_body = {
            "label_zh": field.label_zh,
            "field_kind": field.field_kind,
            "question": field.question,
            **(field.extra or {}),
        }
        if field.field_kind == "ordinal_score":
            field_body["anchors"] = [
                {
                    "score": int(item.code) if item.code.isdigit() else item.code,
                    "label_zh": item.label_zh,
                    "definition": item.definition,
                }
                for item in field.items
            ]
        elif field.field_kind == "free_text":
            field_body["sentinel_values"] = values
        else:
            field_body["values"] = values
        fields[field.field_key] = field_body
    return {
        "version": row.version,
        "source_doc": row.source_doc,
        "scope": row.scope,
        "fields": fields,
    }


def _load_set(db: Session, slug: str) -> DictionarySet | None:
    return db.scalar(
        select(DictionarySet)
        .options(selectinload(DictionarySet.fields).selectinload(DictionaryField.items))
        .where(DictionarySet.slug == slug)
    )


@router.get("/content")
def get_content_dictionary(db: Session = Depends(get_db)):
    row = _load_set(db, "content")
    return _set_as_label_json(row) if row else load_content_dictionary()


@router.get("/viewer")
def get_viewer_dictionary(db: Session = Depends(get_db)):
    row = _load_set(db, "viewer")
    return _set_as_label_json(row) if row else load_viewer_dictionary()
