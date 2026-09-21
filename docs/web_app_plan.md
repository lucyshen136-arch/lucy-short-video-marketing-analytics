# Web Application Plan — Video Management & Visualization

**Status:** Approved planning document (implementation not started)  
**Last updated:** 2026-09-20  
**Owner:** Lucy  

This document defines Phase 1 of a local web app to view, analyze, and manage the short-video Gold / pilot dataset. It does **not** replace the public GitHub research deliverable; it is a working management layer aligned with `data/sample/public_sample.csv` and the three-layer field model.

---

## 1. Confirmed decisions (2026-09-20)

| Topic | Decision |
|-------|----------|
| Frontend | **Next.js** (App Router) under **`web/`** |
| Database | **PostgreSQL 16** via **Docker Compose** (local) |
| Schema | **Single wide table** `videos` (mirrors CSV columns) |
| Phase 1 CRUD | **List, detail, create, edit, delete** |
| Research field | **`selection_reason` required** on create/update (pre-analysis rationale) |
| Backend | **FastAPI** (recommended; shares Python stack with repo) |
| Source of truth (working copy) | PostgreSQL while developing; periodic export to CSV for reproducibility |

---

## 2. Goals and phases

### 2.1 Vision

| Phase | Capability | In scope now |
|-------|------------|--------------|
| **Phase 1** | Video list, detail, create, edit, delete; three-layer fields + `selection_reason` | Yes |
| Phase 2 | Filters, sort, CSV import/export, sync with `public_sample.csv` | Planned |
| Phase 3 | Charts: L1 ↔ L2 ↔ L3 exploratory views | Planned |
| Phase 4 | AI label comparison, audit log | Planned |

### 2.2 Phase 1 success criteria

- `docker compose up` starts local PostgreSQL.
- Next.js app in `web/` lists videos from the API.
- Detail page shows meta / content / viewer / ai in separate sections.
- Create and edit forms enforce dictionary enums and **missing-is-not-zero**.
- Delete removes a row (with confirmation); `video_id` is stable until delete.
- `selection_reason` is required before a record is accepted.

---

## 3. Architecture

```text
┌──────────────────────────────────────────────────────────┐
│  web/          Next.js (App Router)                      │
│                · /videos, /videos/new, /videos/[id]/edit │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTP (REST)
┌────────────────────────────▼─────────────────────────────┐
│  api/          FastAPI + Pydantic                          │
│                · validation from data/*_label_dictionary   │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│  PostgreSQL 16     Docker Compose (project root)         │
│  table: videos (wide)                                    │
└──────────────────────────────────────────────────────────┘

Parallel (existing repo, unchanged in Phase 1):
  src/ + DuckDB  →  batch analysis, tests, CI
  data/sample/   →  CSV snapshots for Git reproducibility
```

**Boundary (AuthoritativePlan):** The dashboard is an optional enhancement. This app is a **local research tool**; professor-facing claims still flow from reproducible CSV, code, SQL, and evidence under `evidence/`.

---

## 4. Repository layout (to add during implementation)

```text
lucy-short-video-marketing-analytics/
├── docker-compose.yml       # postgres service only (Phase 1)
├── .env.example             # DATABASE_URL (no secrets committed)
├── api/                     # FastAPI service
│   ├── main.py
│   ├── models/
│   ├── schemas/
│   └── routers/videos.py
├── alembic/                 # migrations
├── web/                     # Next.js frontend
│   ├── app/
│   │   ├── videos/
│   │   └── ...
│   └── package.json
├── data/
│   ├── content_label_dictionary.json
│   └── viewer_label_dictionary.json
└── docs/web_app_plan.md     # this file
```

Shared validation should eventually reuse or mirror `src/lucy_marketing_analytics/validation.py` (S03+) so web and CSV pipelines agree.

---

## 5. Data model — single table `videos`

One row per video. Column names match `data/sample/public_sample.csv` prefixes.

### 5.1 Primary key and governance

| Column | Type (PG) | Notes |
|--------|-----------|--------|
| `video_id` | `TEXT` PK | Pattern `^[A-Z0-9_-]+$` |
| `selection_reason` | `TEXT NOT NULL` | Lucy, **before** analysis; required on create/update |
| `source_kind` | `TEXT` | e.g. `observed`, `synthetic` |
| `created_at` | `TIMESTAMPTZ` | server default |
| `updated_at` | `TIMESTAMPTZ` | on update |

### 5.2 Layer 1 — `meta_*`

| Column | Type | Null |
|--------|------|------|
| `meta_platform` | enum/text | NOT NULL |
| `meta_public_url` | TEXT | NOT NULL |
| `meta_title` | TEXT | NOT NULL |
| `meta_creator_name` | TEXT | NOT NULL |
| `meta_publish_date` | DATE | NOT NULL |
| `meta_duration_seconds` | INTEGER | NULL |
| `meta_collected_at` | TIMESTAMPTZ | NULL |
| `meta_view_count` | BIGINT | NULL |
| `meta_like_count` | BIGINT | NULL |
| `meta_comment_count` | BIGINT | NULL |
| `meta_save_count` | BIGINT | NULL |
| `meta_share_count` | BIGINT | NULL |
| `meta_follower_count` | BIGINT | NULL |
| `meta_hashtags` | TEXT | NULL |

Platform enum: `douyin`, `xiaohongshu`, `bilibili` (see `data/data_dictionary.md`).

### 5.3 Layer 2 — `content_*`

| Column | Notes |
|--------|--------|
| `content_type`, `content_hook_type`, `content_narrative_structure`, `content_persuasion`, `content_evidence_type`, `content_funnel_stage`, `content_cta_type` | Enum codes from `data/content_label_dictionary.json` |
| `content_value_proposition` | Free text or `none_clear` |

### 5.4 Layer 3 — `viewer_*`

| Column | Notes |
|--------|--------|
| `viewer_continued_watching` | `finished`, `half_left`, `left_early` |
| `viewer_memory_score` | 1–5 or NULL |
| `viewer_trust_score` | 1–5 or NULL |
| `viewer_action_intent_score` | 1–5 or NULL |

Only Lucy fills viewer fields; app copy should state this in the UI.

### 5.5 Layer 4 — `ai_*`

Mirror content fields plus `ai_label_status` (e.g. `candidate`, `verified`, `rejected`). All nullable in Phase 1.

**Rule:** NULL means missing or not applicable; never coerce NULL to `0` for counts or scores.

---

## 6. Docker — PostgreSQL

Planned `docker-compose.yml` (project root):

- Image: `postgres:16-alpine`
- Port: `5432:5432`
- Database: `video_analytics`
- User/password: from `.env` (not committed)
- Volume: `pgdata` for persistence

Application connection string (example in `.env.example`):

```text
DATABASE_URL=postgresql+asyncpg://lucy_marketing:CHANGE_ME@localhost:5432/video_analytics
```

---

## 7. API design (Phase 1)

Base path: `/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/videos` | Paginated list; optional `platform`, `content_type` filters |
| GET | `/videos/{video_id}` | Full row |
| POST | `/videos` | Create; `selection_reason` required |
| PUT or PATCH | `/videos/{video_id}` | Update; `selection_reason` required |
| DELETE | `/videos/{video_id}` | Hard delete (UI: confirm dialog) |
| GET | `/dictionaries/content` | From `content_label_dictionary.json` |
| GET | `/dictionaries/viewer` | From `viewer_label_dictionary.json` |
| GET | `/health` | DB connectivity |

Error responses should name the field and reference dictionary codes when validation fails.

---

## 8. Next.js UI (`web/`)

### 8.1 Routes

| Route | Purpose |
|-------|---------|
| `/` | Redirect to `/videos` |
| `/videos` | Table: id, title, platform, creator, publish_date, content_type, trust, actions |
| `/videos/new` | Create wizard or tabbed form (meta → content → viewer → ai) |
| `/videos/[video_id]` | Read-only detail; tabs for four layers |
| `/videos/[video_id]/edit` | Same fields as create; supports delete from edit or detail |

### 8.2 Form requirements

- **Step 1 (meta):** include **`selection_reason`** (required textarea).
- Enum fields: dropdowns with Chinese labels from dictionaries.
- Numeric metrics: empty input → NULL in API.
- Detail: external link opens `meta_public_url` in new tab.
- Delete: destructive confirmation; show `video_id` and title in prompt.

### 8.3 Suggested UI stack

- Next.js App Router, TypeScript
- Tailwind CSS + shadcn/ui (table, form, tabs, dialog)
- Fetch API or TanStack Query toward FastAPI origin (env `NEXT_PUBLIC_API_URL`)

---

## 9. CSV and Git workflow

| Direction | Purpose |
|-----------|---------|
| DB → CSV export | Snapshot for `data/sample/public_sample.csv` or `data/processed/` |
| CSV → DB import | Seed / restore (Phase 2 script) |

After export, Lucy reviews before commit; no private fields in public CSV.

---

## 10. Security and privacy (Phase 1)

- Local only: bind API and Next dev server to `localhost`.
- No auth in Phase 1; do not expose compose ports on public networks without auth.
- Do not store full transcripts, downloaded videos, or credentials in Postgres.
- Real public nicknames in `meta_creator_name` allowed per `docs/DataGovernance.md`.

---

## 11. Implementation milestones

| ID | Task | Deliverable |
|----|------|-------------|
| M0 | Lock this plan | `docs/web_app_plan.md` |
| M1 | `docker-compose.yml` + Alembic migration for `videos` | Running Postgres + schema |
| M2 | FastAPI CRUD + dictionary routes | OpenAPI `/docs` |
| M3 | Next list + detail | Read from API |
| M4 | Create + edit + delete + `selection_reason` validation | End-to-end in browser |
| M5 | Seed from existing CSV (optional) | V001 in DB |
| M6 | `README` section: local start commands | One-page dev guide |

Estimated effort: **5–7 days** at student pace.

---

## 12. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| DB and CSV diverge | Document export cadence; Phase 2 import/export commands |
| Dictionary drift | Single JSON source in `data/`; API serves same files |
| Scraping platform metrics | Manual entry only; no Douyin crawler in web app |
| Scope creep (analytics) | Defer charts to Phase 3; Phase 1 is CRUD only |

---

## 13. References

- `data/sample/public_sample.csv` — column template
- `data/sample/视频三层特征.md` — layer semantics
- `data/content_label_dictionary.json`, `data/viewer_label_dictionary.json`
- `data/data_dictionary.md`, `docs/DataGovernance.md`
- `docs/Architecture.md` — analysis pipeline remains Python/DuckDB

---

## Revision history

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-09-20 | Initial approved plan: Next.js, `web/`, single table, full CRUD, `selection_reason` required |
