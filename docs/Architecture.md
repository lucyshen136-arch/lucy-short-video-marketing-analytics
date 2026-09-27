# Architecture

`private/raw evidence -> validation -> cleaning -> feature engineering -> processed public-safe data -> Python/SQL analysis -> statistics/AI reliability -> figures/report/README`

Stable transformations live in `src/`; notebooks orchestrate exploration and explanation. DuckDB reads processed data for business queries. Tests cover deterministic rules. GitHub Actions runs public-safe CI. Full transcripts and private/raw materials remain outside version control.

## Video management app

Production is **one Vercel project**: the Next.js app in `web/`.

- UI: App Router pages under `web/app`.
- API: Route Handlers under `web/app/api/v1`, same origin as the UI.
- Database: Neon Postgres. The Node `pg` pool reads **`DATABASE_URL` from Vercel** (or `web/.env.local` on a laptop). Server-only; never `NEXT_PUBLIC_`.
- Schema: Alembic in the Python package still owns migrations (`alembic/`). Run those locally against the Neon direct host, then the Vercel app uses the pooled host.
- Dictionary JSON used at runtime is bundled from `web/data/` (copies of `data/*_label_dictionary.json` for the Vercel package root).

The FastAPI package (`api/`) remains for research scripts, seed, and migrations. It is not the production web server.
