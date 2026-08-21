# S12 - Core Visual Evidence

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
- Confirm `S11` is accepted and the repository status is clean or truthfully documented.
- Record the current checkpoint identifier.
- Confirm `S12` is the only active implementation unit in `TASKS.md`.
- Run the currently passing baseline tests before making changes.

## Session Objective
Produce at least three publication-ready charts tied to research questions and bounded, non-causal captions.

## Knowledge and Research Concepts
- Reproducibility, provenance, validity, uncertainty, and bounded marketing interpretation as applicable.
- Separation of observed facts, Lucy's judgment, AI suggestions, and public claims.
- Small-sample and single-viewer limitations must remain visible.

## Scope and Files
Create or modify only:
- `src/lucy_marketing_analytics/visualization.py`
- `reports/figures/`
- `reports/marketing_insights.md`

Preserve all unrelated working behavior, private/raw data boundaries, completed-unit history, and evidence from prior units.

## Implementation Sequence
1. Inspect current implementations and tests; do not recreate working files blindly.
2. State the smallest bounded change that satisfies this unit.
3. Implement in small runnable steps.
4. Add or update tests before claiming completion.
5. Run the required checks and save evidence under `evidence/S12/`.
6. Update `TASKS.md`, `docs/decisions.md`, and `docs/CoBuildLog.md` truthfully.

## Manual Work
Lucy must connect each analysis to a research question and reject decorative charts.

## Tests and Checks
- Regenerate all core figures from a clean output folder.
- Inspect titles, units, n, source notes, captions, and color accessibility.
- Review `git diff --check`, `git status --short`, and the intended diff.

## Acceptance Criteria
- Three figures have titles, units, sample sizes, source notes, and accessible colors.
- Captions distinguish observed pattern from interpretation.
- Required evidence exists under `evidence/S12/`, and failed checks are not hidden.
- Lucy has personally run and understood at least one relevant check.

## Security, Privacy, and Licensing
- Never commit credentials, `.env`, private/raw transcripts, full video files, private account data, or unauthorized personal information.
- Use synthetic or publication-approved fixtures in tests.
- Respect platform rules; do not add bypass, scraping, or bulk collection that lacks approval.
- Treat AI output as a candidate requiring human verification.

## Do Not Do
- Do not begin `S13` or implement future-unit features.
- Do not build the optional dashboard or expansion dataset unless its separate gate has passed.
- Do not fill missing metrics with zero, pool incomparable platform fields, fabricate data/results, or write causal conclusions.
- Do not overwrite `TASKS.md` history or remove known issues.

## Checkpoint and Rollback
- If checks pass, stage only intended paths, commit as `S12: core visual evidence`, and optionally tag `checkpoint-s12`.
- If a check fails, keep `S12` active, record the failure and last verified checkpoint, and repair only this unit.

## Completion Report
Report changed files, commands run, actual results, manual verification, evidence paths, remaining limitations, and the next safe preparation step.

## Stop Condition
Stop when `S12` acceptance passes. Do not begin `S13`.
