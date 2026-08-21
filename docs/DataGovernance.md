# Data Governance

## Scope decisions (2026-08-18)

- **Platforms:** mixed Douyin, Xiaohongshu, and Bilibili sample.
- **Creator naming:** store real public display nicknames from platform pages; do not replace with synthetic aliases in public tables.
- **Fields:** enforce the twelve-field minimum required set first; add expansion fields only when their unit is active.

## Classification

| Class | Examples | Public rule |
|---|---|---|
| Public source metadata | platform, URL, title, creator_name, publication date | Allowed after review |
| Public performance snapshot | view/like/comment/favorite/share counts, metrics_collected_at | Allowed with dictionary; null if unavailable |
| Derived features | duration buckets, rates, labels | Allowed with provenance; compute only within platform when comparing rates |
| Necessary evidence excerpt | short Hook/CTA excerpt with timestamp | Allowed only when necessary and reviewed |
| Private/raw | full transcript, downloaded video, private account data | Never commit |
| Secrets | API keys, tokens, credentials | Environment variables only |

## Cross-platform rules

- Do not pool Douyin, Xiaohongshu, and Bilibili engagement metrics as if they share one definition.
- Record the unified field name in CSV/JSON and note any platform-specific raw label in `notes`.
- Missing public metrics remain null and carry a reason in `notes` or `metrics_unavailable_reason`; never substitute zero.

Automated collection must follow platform rules. No bypass or unapproved bulk scraping.
