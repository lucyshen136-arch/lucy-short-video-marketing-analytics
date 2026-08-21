# S09 - Integrated Pipeline and Regression Suite

## Role
Act as the implementation partner for this bounded InnovationLab session in `lucy-short-video-marketing-analytics`.

## Read First
- `README.md`
- `TASKS.md`
- `docs/AuthoritativePlan.md`
- `docs/Architecture.md`
- `docs/TestPlan.md`
- `docs/DataGovernance.md`
- `prompts/GlobalEngineeringContract.md`
- The latest entries in `docs/decisions.md` and `docs/CoBuildLog.md`

## Prior-State Check
- Confirm `S08` is accepted and the repository status is clean or truthfully documented.
- Record the current checkpoint identifier.
- Confirm `S09` is the only active implementation unit in `TASKS.md`.
- Run the currently passing baseline tests before making changes.

## Session Objective
Connect validation, cleaning, metrics, and feature engineering into one reproducible command with deterministic tests.

## Knowledge and Research Concepts
- Reproducibility, provenance, validity, uncertainty, and bounded marketing interpretation as applicable.
- Separation of observed facts, Lucy's judgment, AI suggestions, and public claims.
- Small-sample and single-viewer limitations must remain visible.

## Scope and Files
Create or modify only:
- `src/lucy_marketing_analytics/pipeline.py`
- `tests/test_pipeline.py`
- `pyproject.toml`

Preserve all unrelated working behavior, private/raw data boundaries, completed-unit history, and evidence from prior units.

## Implementation Sequence
1. Inspect current implementations and tests; do not recreate working files blindly.
2. State the smallest bounded change that satisfies this unit.
3. Implement in small runnable steps.
4. Add or update tests before claiming completion.
5. Run the required checks and save evidence under `evidence/S09/`.
6. Update `TASKS.md`, `docs/decisions.md`, and `docs/CoBuildLog.md` truthfully.

## Manual Work
Lucy must review diffs, hand-check at least one result, and explain the implemented rule.

## Tests and Checks
- Run `python -m lucy_marketing_analytics.pipeline`.
- Run `python -m pytest -q` on the public-safe fixture.
- Review `git diff --check`, `git status --short`, and the intended diff.

## Acceptance Criteria
- `python -m lucy_marketing_analytics.pipeline` produces documented outputs from approved inputs.
- `python -m pytest` passes on the synthetic or publishable fixture.
- Required evidence exists under `evidence/S09/`, and failed checks are not hidden.
- Lucy has personally run and understood at least one relevant check.

## Security, Privacy, and Licensing
- Never commit credentials, `.env`, private/raw transcripts, full video files, private account data, or unauthorized personal information.
- Use synthetic or publication-approved fixtures in tests.
- Respect platform rules; do not add bypass, scraping, or bulk collection that lacks approval.
- Treat AI output as a candidate requiring human verification.

## Do Not Do
- Do not begin `S10` or implement future-unit features.
- Do not build the optional dashboard or expansion dataset unless its separate gate has passed.
- Do not fill missing metrics with zero, pool incomparable platform fields, fabricate data/results, or write causal conclusions.
- Do not overwrite `TASKS.md` history or remove known issues.

## Checkpoint and Rollback
- If checks pass, stage only intended paths, commit as `S09: integrated pipeline and regression suite`, and optionally tag `checkpoint-s09`.
- If a check fails, keep `S09` active, record the failure and last verified checkpoint, and repair only this unit.

## Completion Report
Report changed files, commands run, actual results, manual verification, evidence paths, remaining limitations, and the next safe preparation step.

## Stop Condition
Stop when `S09` acceptance passes. Do not begin `S10`.
