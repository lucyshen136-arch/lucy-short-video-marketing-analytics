# Data Dictionary

Field-level definitions for the 30-video Gold Dataset and the five-video pilot.
Scope decisions confirmed on 2026-08-18:

- **Platforms:** Douyin, Xiaohongshu (RED), and Bilibili — mixed sample.
- **Creator naming:** store the **real public display nickname** shown on each platform (not synthetic aliases).
- **Rollout:** start with the **minimum required set** below; add expansion fields in later units.

Global rules:

- Missing is not zero. Use null and a reason code when a metric is unavailable.
- Cross-platform public metrics are **not directly comparable** without explicit notes.
- Record `metrics_collected_at` whenever performance numbers are copied from a platform UI.
- AI suggestions and derived features remain candidates until human verification.

---

## Minimum Required Set (S02 pilot and Gold register)

These twelve fields must exist for every pilot and Gold record before analysis begins.

| Field | 中文名 | Type | Null rule | Provenance | Public |
|---|---|---|---|---|---|
| `video_id` | 视频编号 | string | not null | project-assigned | yes |
| `platform` | 平台 | enum | not null | observed | yes |
| `public_url` | 公开链接 | url | not null | observed | yes |
| `title` | 标题 | string | not null | platform UI | yes |
| `creator_name` | 作者昵称 | string | not null | platform UI (real public nickname) | yes |
| `publish_date` | 发布日期 | date (`YYYY-MM-DD`) | not null | platform UI | yes |
| `duration_seconds` | 播放时长（秒） | integer ≥ 1 | not null | platform UI or verified playback | yes |
| `view_count` | 播放量/浏览量 | integer ≥ 0 | null if unavailable | platform UI snapshot | yes |
| `like_count` | 点赞量 | integer ≥ 0 | null if unavailable | platform UI snapshot | yes |
| `favorite_count` | 收藏量 | integer ≥ 0 | null if unavailable | platform UI snapshot | yes |
| `share_count` | 分享量 | integer ≥ 0 | null if unavailable | platform UI snapshot | yes |
| `selection_reason` | 入选理由 | string | not null | Lucy, **before** analysis | yes |

### Strongly recommended at collection time

Add these on the same pass when the platform exposes them:

| Field | 中文名 | Type | Null rule | Notes |
|---|---|---|---|---|
| `comment_count` | 评论量 | integer ≥ 0 | null if unavailable | high-value engagement signal |
| `follower_count` | 粉丝量 | integer ≥ 0 | null if unavailable | creator snapshot at collection time |
| `metrics_collected_at` | 指标采集时间 | datetime (ISO 8601) | null only if no metrics collected | required whenever any performance field is filled |
| `hashtags` | 话题标签 | string | null if none | comma-separated `#tags` |

### Controlled enums

**`platform`**

| Value | Platform |
|---|---|
| `douyin` | 抖音 |
| `xiaohongshu` | 小红书 |
| `bilibili` | Bilibili |

**`video_id` pattern:** `^[A-Z0-9_-]+$` (example: `V001`, `PILOT03`).

---

## Platform field mapping (minimum set)

Use the unified field names above in CSV/JSON. When copying from a platform UI, also note the raw label in collection notes if it differs.

| Unified field | Douyin 抖音 | Xiaohongshu 小红书 | Bilibili |
|---|---|---|---|
| `view_count` | 播放量 | 浏览量 / 观看量 | 播放量 |
| `like_count` | 点赞 | 点赞 | 点赞 |
| `comment_count` | 评论 | 评论 | 评论 |
| `favorite_count` | 收藏 | 收藏 | 收藏（或三连中的收藏） |
| `share_count` | 分享 | 分享 | 分享（若页面展示） |
| `follower_count` | 粉丝数（作者主页） | 粉丝数 | 粉丝数 |
| `duration_seconds` | 视频时长 | 视频时长 | 视频时长 |

**Bilibili-only public metrics (expansion tier):** `danmaku_count`, `coin_count` — do not merge into Douyin/Xiaohongshu fields.

**Comparison rule:** compute rates such as `like_rate` only **within the same platform** and document `metrics_collected_at`.

---

## Expansion fields (later units — do not require for S02 pilot rows)

Populate when the relevant unit is active. Leaving them empty is expected early in the project.

### A. Source and content metadata

| Field | 中文名 | Type | Unit |
|---|---|---|---|
| `description` | 简介/文案 | string | S04+ |
| `content_category` | 平台类目 | string | S04+ |
| `language` | 主要语言 | string | S04+ |
| `is_sponsored` | 是否商业合作 | boolean / enum | S04+ |
| `platform_content_id` | 平台内容 ID | string | S04+ |

### B. Extended public performance

| Field | 中文名 | Type | Unit |
|---|---|---|---|
| `danmaku_count` | 弹幕量 | integer | S08+ (Bilibili) |
| `coin_count` | 投币量 | integer | S08+ (Bilibili) |
| `save_to_album_count` | 保存到相册 | integer | S08+ |
| `platform_raw_view_label` | 平台原始播放字段名 | string | S02 notes |
| `metrics_source` | 指标来源 | enum | S02+ |
| `metrics_unavailable_reason` | 指标不可用原因 | string | S02+ |
| `creator_metrics_collected_at` | 粉丝量采集时间 | datetime | S04+ |
| `following_count` | 关注数 | integer | S04+ |
| `total_likes_received` | 获赞总数 | integer | S04+ |
| `creator_verified` | 是否认证 | boolean | S04+ |
| `creator_category` | 账号类型 | enum | S04+ |

### C. Derived features (computed, not copied)

| Field | 中文名 | Formula / rule | Unit |
|---|---|---|---|
| `metrics_age_days` | 发布后至采集间隔（天） | `metrics_collected_at - publish_date` | S08+ |
| `engagement_rate` | 互动率 | `(like + comment + favorite + share) / view` | S08+ |
| `like_rate` | 点赞率 | `like / view` | S08+ |
| `comment_rate` | 评论率 | `comment / view` | S08+ |
| `save_rate` | 收藏率 | `favorite / view` | S08+ |
| `share_rate` | 分享率 | `share / view` | S08+ |

Derived fields stay **null** when the denominator is missing or zero.

### D. Content structure

| Field | 中文名 | Type | Unit |
|---|---|---|---|
| `duration_bucket` | 时长分档 | enum | S08+ |
| `aspect_ratio` | 画面比例 | string | S08+ |
| `has_subtitles` | 是否有字幕 | boolean | S06+ |
| `has_voiceover` | 是否有口播 | boolean | S06+ |
| `has_background_music` | 是否有背景音乐 | boolean | S06+ |
| `thumbnail_style` | 封面类型 | enum | S06+ |
| `video_format_note` | 形式备注 | string | S06+ |

### E. Text and marketing labels

| Field | 中文名 | Type | Unit |
|---|---|---|---|
| `transcript_status` | 转写状态 | enum | S05+ |
| `word_count` | 字数 | integer | S05+ |
| `hook_type` | 开头钩子类型 | enum | S03 / S06 |
| `hook_timestamp` | 钩子时间戳 | string | S06 |
| `value_proposition` | 价值主张 | string | S06 |
| `persuasion_mechanism` | 说服机制 | enum | S06 |
| `evidence_type` | 证据类型 | enum | S06 |
| `cta_type` | 行动号召类型 | enum | S06 |
| `cta_timestamp` | CTA 时间戳 | string | S06 |
| `funnel_stage` | 营销漏斗阶段 | enum | S03 / S06 |
| `content_type` | 内容类型 | enum | S03 / S06 |
| `target_audience` | 目标受众 | string | S06 |
| `brand_mention` | 品牌提及 | string | S06 |
| `ai_label_status` | AI 标注状态 | enum | S15 |

Taxonomy enums are finalized in `docs/MarketingLabelGuide.md` and `config/label_taxonomy.json` (S03).

### F. Viewer response (single viewer — Lucy)

| Field | 中文名 | Type | Range | Unit |
|---|---|---|---|---|
| `viewer_liking` | 喜好程度 | integer | 1–5 | S06 |
| `viewer_trust` | 信任程度 | integer | 1–5 | S06 |
| `viewer_memory` | 记忆程度 | integer | 1–5 | S06 |
| `viewer_action_intention` | 行动意向 | integer | 1–5 | S06 |
| `viewer_watched_full` | 是否看完 | boolean | | S06 |
| `viewer_rewatch` | 是否重看 | boolean | | S06 |
| `viewer_notes` | 观看笔记 | string | | S06 (private working copy) |

These describe **one viewer**, not population behavior.

### G. Quality and governance

| Field | 中文名 | Type | Unit |
|---|---|---|---|
| `record_created_at` | 记录创建时间 | datetime | S02+ |
| `last_updated_at` | 最后更新时间 | datetime | S02+ |
| `data_quality_status` | 数据质量状态 | enum | S07+ |
| `human_verified` | 人工核验 | boolean | S06+ |
| `public_safe` | 可进入公开样本 | boolean | S04+ |
| `notes` | 备注 | string | S02+ |

**`metrics_source` enum (expansion):** `platform_ui`, `manual_screenshot`, `unavailable`.

**`data_quality_status` enum (expansion):** `complete`, `partial`, `needs_review`.

---

## Public / private classification

| Class | Examples | Git rule |
|---|---|---|
| Public source metadata | `video_id`, `platform`, `public_url`, `title`, `creator_name`, `publish_date` | allowed after review |
| Public performance snapshot | counts and `metrics_collected_at` | allowed with dictionary |
| Derived public features | rates, buckets, marketing labels | allowed with provenance |
| Short evidence excerpt | ≤10 s Hook/CTA text with timestamp | allowed when necessary |
| Private / raw | full transcript, downloaded video, private account tokens | never commit |
| Private viewer working notes | long `viewer_notes` drafts | keep under `data/private/` |

Real public nicknames are permitted in the public repository because they are already visible on the linked platform pages.

---

## File mapping

| File | Contents |
|---|---|
| `data/sample/pilot_selection.csv` | five-video pilot; minimum required columns + strongly recommended columns |
| `data/private/source_register.csv` | full 30-video register (S04) |
| `data/sample/public_source_sample.csv` | publication-safe subset (S04) |
| `data/processed/gold_public.csv` | cleaned public Gold export (S07+) |
| `config/schema.json` | JSON Schema for minimum required validation |
