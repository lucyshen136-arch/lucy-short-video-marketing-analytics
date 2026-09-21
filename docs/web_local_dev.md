# Local Web App — Quick Start

Phase 1 video management UI: **Next.js** (`web/`) + **FastAPI** (`api/`) + **PostgreSQL** (Docker).

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Desktop (or Docker Engine)

## 1. Database

```bash
cd /path/to/lucy-short-video-marketing-analytics
docker compose up -d
```

Copy environment template if needed:

```bash
cp .env.example .env
cp web/.env.local.example web/.env.local
```

## 2. Python API

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[web,dev]"
alembic upgrade head
python -m api.scripts.seed_v001
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Open API docs: http://127.0.0.1:8000/docs

## 3. Next.js frontend

```bash
cd web
npm install
npm run dev
```

Open: http://localhost:3000/videos

## Health check

```bash
curl http://127.0.0.1:8000/health
```

## Notes

- Missing metrics stay **NULL** in Postgres; leave form fields empty.
- `selection_reason` is **required** on create and update.
- Enum fields validate against `data/content_label_dictionary.json` and `data/viewer_label_dictionary.json`.

See also: `docs/web_app_plan.md`
