# S08 - Metrics and Feature Engineering

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
- Confirm `S07` is accepted and the repository status is clean or truthfully documented.
- Record the current checkpoint identifier.
- Confirm `S08` is the only active implementation unit in `TASKS.md`.
- Run the currently passing baseline tests before making changes.

## Session Objective
Implement platform-aware engagement measures plus text and timing features with explicit formulas, units, denominators, missingness, and comparability warnings.

## Knowledge and Research Concepts
- Reproducibility, provenance, validity, uncertainty, and bounded marketing interpretation as applicable.
- Separation of observed facts, Lucy's judgment, AI suggestions, and public claims.
- Small-sample and single-viewer limitations must remain visible.

## Scope and Files
Create or modify only:
- `src/lucy_marketing_analytics/metrics.py`
- `src/lucy_marketing_analytics/feature_engineering.py`
- `tests/test_metrics.py`
- `tests/test_feature_engineering.py`
- `data/data_dictionary.md`

Preserve all unrelated working behavior, private/raw data boundaries, completed-unit history, and evidence from prior units.

## Implementation Sequence
1. Inspect current implementations and tests; do not recreate working files blindly.
2. State the smallest bounded change that satisfies this unit.
3. Implement in small runnable steps.
4. Add or update tests before claiming completion.
5. Run the required checks and save evidence under `evidence/S08/`.
6. Update `TASKS.md`, `docs/decisions.md`, and `docs/CoBuildLog.md` truthfully.

## Manual Work
Lucy must review diffs, hand-check at least one result, and explain the implemented rule.

## Tests and Checks
- Run metrics and feature-engineering test files.
- Hand-calculate at least three metrics and inspect timestamp boundary cases.
- Review `git diff --check`, `git status --short`, and the intended diff.

## Acceptance Criteria
- Metric formulas and derived features pass hand-calculated boundary tests.
- Division-by-zero, invisible fields, and inapplicable timestamps return missing or flagged results rather than fabricated zeros.
- Required evidence exists under `evidence/S08/`, and failed checks are not hidden.
- Lucy has personally run and understood at least one relevant check.

## Security, Privacy, and Licensing
- Never commit credentials, `.env`, private/raw transcripts, full video files, private account data, or unauthorized personal information.
- Use synthetic or publication-approved fixtures in tests.
- Respect platform rules; do not add bypass, scraping, or bulk collection that lacks approval.
- Treat AI output as a candidate requiring human verification.

## Do Not Do
- Do not begin `S09` or implement future-unit features.
- Do not build the optional dashboard or expansion dataset unless its separate gate has passed.
- Do not fill missing metrics with zero, pool incomparable platform fields, fabricate data/results, or write causal conclusions.
- Do not overwrite `TASKS.md` history or remove known issues.

## Checkpoint and Rollback
- If checks pass, stage only intended paths, commit as `S08: metrics and feature engineering`, and optionally tag `checkpoint-s08`.
- If a check fails, keep `S08` active, record the failure and last verified checkpoint, and repair only this unit.

## Completion Report
Report changed files, commands run, actual results, manual verification, evidence paths, remaining limitations, and the next safe preparation step.

## Stop Condition
Stop when `S08` acceptance passes. Do not begin `S09`.
