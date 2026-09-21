"""Import content/viewer JSON dictionaries into Postgres (idempotent)."""

import json
from pathlib import Path

from sqlalchemy import select

from api.config import REPO_ROOT
from api.database import SessionLocal
from api.dictionary_import import parse_label_dictionary
from api.models.dictionary import DictionaryField, DictionaryItem, DictionarySet

SOURCES = [
    {
        "slug": "content",
        "name": "内容与营销",
        "path": REPO_ROOT / "data" / "content_label_dictionary.json",
    },
    {
        "slug": "viewer",
        "name": "个人反应",
        "path": REPO_ROOT / "data" / "viewer_label_dictionary.json",
    },
]


def upsert_parsed(db, parsed: dict) -> str:
    set_data = parsed["set"]
    dictionary_set = db.scalar(select(DictionarySet).where(DictionarySet.slug == set_data["slug"]))
    if dictionary_set is None:
        dictionary_set = DictionarySet(**set_data)
        db.add(dictionary_set)
        db.flush()
    else:
        for key, value in set_data.items():
            if key != "slug":
                setattr(dictionary_set, key, value)

    fields_by_key = {field.field_key: field for field in dictionary_set.fields}
    for field_data in parsed["fields"]:
        field = fields_by_key.get(field_data["field_key"])
        if field is None:
            field = DictionaryField(set_id=dictionary_set.id, **field_data)
            db.add(field)
            db.flush()
            fields_by_key[field.field_key] = field
        else:
            for key, value in field_data.items():
                if key != "field_key":
                    setattr(field, key, value)

    for item_data in parsed["items"]:
        field = fields_by_key[item_data["field_key"]]
        existing = next((i for i in field.items if i.code == item_data["code"]), None)
        payload = {k: v for k, v in item_data.items() if k != "field_key"}
        if existing is None:
            db.add(DictionaryItem(field_id=field.id, **payload))
        else:
            for key, value in payload.items():
                setattr(existing, key, value)
    return dictionary_set.slug


def import_file(db, slug: str, name: str, path: Path) -> str:
    payload = json.loads(path.read_text(encoding="utf-8"))
    parsed = parse_label_dictionary(slug=slug, name=name, payload=payload)
    return upsert_parsed(db, parsed)


def main() -> None:
    db = SessionLocal()
    try:
        slugs = []
        for source in SOURCES:
            slugs.append(import_file(db, source["slug"], source["name"], source["path"]))
        db.commit()
        print("Imported dictionary sets:", ", ".join(slugs))
    finally:
        db.close()


if __name__ == "__main__":
    main()
