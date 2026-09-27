# Local Web App — Quick Start

The research UI is a **single Next.js app** in `web/`. It talks to **Neon Postgres** through `DATABASE_URL` (server-only). Production runs on **Vercel**; FastAPI remains optional for local Alembic migrations.

## Prerequisites

- Node.js 20+
- Python 3.11+ only if you need to run Alembic
- A Neon database (existing project is fine)

## 1. Database URL

Never commit the real connection string. Put it in gitignored files / Vercel settings only.

Local Next.js (`web/.env.local`):

```bash
cp web/.env.local.example web/.env.local
```

Use the **pooled** Neon URL (`-pooler` host, `postgresql://...`, `sslmode=require`). Do not prefix this variable with `NEXT_PUBLIC_`.

Schema changes still use Alembic from the repo root (direct / non-pooler host is preferred for migrations):

```bash
cp .env.example .env   # then set DATABASE_URL in .env only
.venv312/bin/alembic upgrade head
.venv312/bin/python -m api.scripts.import_dictionaries
```

## 2. Next.js (UI + API)

```bash
cd web
npm install
npm run dev
```

Open http://127.0.0.1:3000/videos  
Health: http://127.0.0.1:3000/api/health

Leave `NEXT_PUBLIC_API_URL` empty so the browser calls same-origin `/api/v1/...`.

## 3. Deploy on Vercel

1. Import this GitHub repo in Vercel.
2. Set **Root Directory** to `web`.
3. Add `DATABASE_URL` in Vercel → Project → Settings → Environment Variables (Production, Preview, Development). Use the Neon **pooled** connection string. Do not add `NEXT_PUBLIC_DATABASE_URL`.
4. Preferred: Marketplace → **Neon** (Neon-Managed / connect existing project) so Vercel injects `DATABASE_URL`. Manual paste works if the integration UI is unavailable.
5. Deploy. The live app uses that env var to reach Neon.

Optional CLI (from `web/` after `npx vercel login`):

```bash
npx vercel link --yes
printf '%s' "$DATABASE_URL" | npx vercel env add DATABASE_URL production
npx vercel --prod
```

## Notes

- Missing metrics stay **NULL**; leave form fields empty.
- `selection_reason` is required on create and update.
- FastAPI on port 8000 is no longer required for the website.

See also: `docs/web_app_plan.md`, `docs/Architecture.md`
