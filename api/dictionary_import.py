from typing import Any


def _item_from_value(field_key: str, value: dict, sort_order: int) -> dict[str, Any]:
    code = value.get("code")
    if code is None and "score" in value:
        code = str(value["score"])
        sort_order = int(value["score"])
    if not code:
        raise ValueError(f"{field_key} item is missing code/score")
    return {
        "field_key": field_key,
        "code": str(code),
        "label_zh": value.get("label_zh") or str(code),
        "definition": value.get("definition"),
        "sort_order": sort_order,
        "extra": {k: v for k, v in value.items() if k not in {"code", "label_zh", "definition", "score"}},
    }


def parse_label_dictionary(*, slug: str, name: str, payload: dict[str, Any]) -> dict[str, Any]:
    fields_out: list[dict[str, Any]] = []
    items_out: list[dict[str, Any]] = []
    fields = payload.get("fields") or {}
    for field_key, meta in fields.items():
        reserved = {"values", "sentinel_values", "anchors"}
        extra = {k: v for k, v in meta.items() if k not in {"label_zh", "field_kind", "question", *reserved}}
        fields_out.append(
            {
                "field_key": field_key,
                "label_zh": meta.get("label_zh") or field_key,
                "field_kind": meta.get("field_kind") or "enum",
                "question": meta.get("question"),
                "extra": extra,
            }
        )
        raw_items = meta.get("values") or meta.get("sentinel_values") or meta.get("anchors") or []
        for index, value in enumerate(raw_items, start=1):
            items_out.append(_item_from_value(field_key, value, index))
    return {
        "set": {
            "slug": slug,
            "name": name,
            "description": payload.get("scope"),
            "version": payload.get("version"),
            "source_doc": payload.get("source_doc"),
            "scope": payload.get("scope"),
            "extra": {k: v for k, v in payload.items() if k not in {"version", "source_doc", "scope", "fields"}},
        },
        "fields": fields_out,
        "items": items_out,
    }
