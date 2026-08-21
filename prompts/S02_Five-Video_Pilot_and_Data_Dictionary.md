# S02 - Five-Video Pilot and Data Dictionary

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
- Confirm `S01` is accepted and the repository status is clean or truthfully documented.
- Record the current checkpoint identifier.
- Confirm `S02` is the only active implementation unit in `TASKS.md`.
- Run the currently passing baseline tests before making changes.

## Session Objective
Select five representative public videos before analysis and define the source, performance, text, marketing, viewer-response, and quality fields needed to describe them.

## Knowledge and Research Concepts
- Reproducibility, provenance, validity, uncertainty, and bounded marketing interpretation as applicable.
- Separation of observed facts, Lucy's judgment, AI suggestions, and public claims.
- Small-sample and single-viewer limitations must remain visible.

## Scope and Files
Create or modify only:
- `data/sample/pilot_selection.csv`
- `docs/methodology.md`
- `data/data_dictionary.md`
- `config/schema.json`
- `docs/DataGovernance.md`

Preserve all unrelated working behavior, private/raw data boundaries, completed-unit history, and evidence from prior units.

## Implementation Sequence
1. Inspect current implementations and tests; do not recreate working files blindly.
2. State the smallest bounded change that satisfies this unit.
3. Implement in small runnable steps.
4. Add or update tests before claiming completion.
5. Run the required checks and save evidence under `evidence/S02/`.
6. Update `TASKS.md`, `docs/decisions.md`, and `docs/CoBuildLog.md` truthfully.

## Manual Work
Lucy must make and explain the scope decisions; AI may only propose wording or structure.

## Tests and Checks
- Validate five unique IDs and non-empty pre-analysis selection reasons.
- Parse `config/schema.json` and cross-check every pilot property against the dictionary and public/private rules.
- Review `git diff --check`, `git status --short`, and the intended diff.

## Acceptance Criteria
- Five records have stable IDs, dates, and pre-analysis selection reasons.
- Every pilot field has a definition, type, null rule, provenance class, and public/private classification.
- Required evidence exists under `evidence/S02/`, and failed checks are not hidden.
- Lucy has personally run and understood at least one relevant check.

## Security, Privacy, and Licensing
- Never commit credentials, `.env`, private/raw transcripts, full video files, private account data, or unauthorized personal information.
- Use synthetic or publication-approved fixtures in tests.
- Respect platform rules; do not add bypass, scraping, or bulk collection that lacks approval.
- Treat AI output as a candidate requiring human verification.

## Do Not Do
- Do not begin `S03` or implement future-unit features.
- Do not build the optional dashboard or expansion dataset unless its separate gate has passed.
- Do not fill missing metrics with zero, pool incomparable platform fields, fabricate data/results, or write causal conclusions.
- Do not overwrite `TASKS.md` history or remove known issues.

## Checkpoint and Rollback
- If checks pass, stage only intended paths, commit as `S02: five-video pilot and data dictionary`, and optionally tag `checkpoint-s02`.
- If a check fails, keep `S02` active, record the failure and last verified checkpoint, and repair only this unit.

## Completion Report
Report changed files, commands run, actual results, manual verification, evidence paths, remaining limitations, and the next safe preparation step.

## Stop Condition
Stop when `S02` acceptance passes. Do not begin `S03`.
