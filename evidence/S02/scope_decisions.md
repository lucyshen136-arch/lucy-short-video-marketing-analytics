# S02 Scope Confirmation — Video Attribute Definition

**Date:** 2026-08-18  
**Confirmed by:** Lucy

## Decisions

| Topic | Choice |
|---|---|
| Platforms | Douyin + Xiaohongshu + Bilibili (mixed) |
| Creator naming | Real public display nickname (`creator_name`) |
| Field rollout | Minimum required set now; expansion fields in later units |

## Minimum required fields (12)

`video_id`, `platform`, `public_url`, `title`, `creator_name`, `publish_date`, `duration_seconds`, `view_count`, `like_count`, `favorite_count`, `share_count`, `selection_reason`

## Strongly recommended at collection

`comment_count`, `follower_count`, `metrics_collected_at`, `hashtags`

## Written to

- `data/data_dictionary.md`
- `config/schema.json`
- `data/sample/pilot_selection.csv` (header row only)
- `docs/DataGovernance.md`
- `docs/methodology.md`

## Next manual step

Fill five pilot rows in `data/sample/pilot_selection.csv` before running S03 validation.
