# Architecture

`private/raw evidence -> validation -> cleaning -> feature engineering -> processed public-safe data -> Python/SQL analysis -> statistics/AI reliability -> figures/report/README`

Stable transformations live in `src/`; notebooks orchestrate exploration and explanation. DuckDB reads processed data for business queries. Tests cover deterministic rules. GitHub Actions runs public-safe CI. Full transcripts and private/raw materials remain outside version control.
