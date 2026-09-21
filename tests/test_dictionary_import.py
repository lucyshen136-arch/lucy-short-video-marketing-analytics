import json

from api.dictionary_import import parse_label_dictionary
from api.scripts.import_dictionaries import SOURCES


def test_parse_content_dictionary_creates_fields_and_items():
    payload = {
        "version": "1.0.0",
        "source_doc": "data/sample/视频三层特征.md",
        "scope": "content_*",
        "fields": {
            "content_hook_type": {
                "label_zh": "Hook（钩子）",
                "field_kind": "enum",
                "question": "开头靠什么把我留住？",
                "values": [
                    {"code": "question", "label_zh": "提问", "definition": "用问题勾起好奇"},
                    {"code": "result_first", "label_zh": "先给结果", "definition": "先给结论"},
                ],
            },
            "content_value_proposition": {
                "label_zh": "价值主张",
                "field_kind": "free_text",
                "question": "承诺什么好处？",
                "sentinel_values": [
                    {"code": "none_clear", "label_zh": "无明确主张", "definition": "不要硬编"}
                ],
            },
        },
    }

    parsed = parse_label_dictionary(
        slug="content",
        name="内容与营销",
        payload=payload,
    )

    assert parsed["set"]["slug"] == "content"
    assert parsed["set"]["version"] == "1.0.0"
    assert {f["field_key"] for f in parsed["fields"]} == {
        "content_hook_type",
        "content_value_proposition",
    }
    hook_items = [i for i in parsed["items"] if i["field_key"] == "content_hook_type"]
    assert [i["code"] for i in hook_items] == ["question", "result_first"]
    vp_items = [i for i in parsed["items"] if i["field_key"] == "content_value_proposition"]
    assert vp_items[0]["code"] == "none_clear"


def test_parse_ordinal_score_anchors_as_items():
    payload = {
        "version": "1.0.0",
        "fields": {
            "viewer_trust_score": {
                "label_zh": "信任",
                "field_kind": "ordinal_score",
                "question": "信不信？",
                "anchors": [
                    {"score": 1, "label_zh": "不可信", "definition": "像编的"},
                    {"score": 5, "label_zh": "很可信", "definition": "愿意讲给别人听"},
                ],
            }
        },
    }
    parsed = parse_label_dictionary(slug="viewer", name="个人反应", payload=payload)
    items = parsed["items"]
    assert [i["code"] for i in items] == ["1", "5"]
    assert items[0]["sort_order"] == 1


def test_parse_project_json_files_has_fields_and_items():
    assert SOURCES, "expected content and viewer import sources"
    for source in SOURCES:
        payload = json.loads(source["path"].read_text(encoding="utf-8"))
        parsed = parse_label_dictionary(
            slug=source["slug"],
            name=source["name"],
            payload=payload,
        )
        assert parsed["set"]["slug"] == source["slug"]
        assert parsed["fields"]
        assert parsed["items"]
        field_keys = {field["field_key"] for field in parsed["fields"]}
        item_keys = {item["field_key"] for item in parsed["items"]}
        assert item_keys <= field_keys
