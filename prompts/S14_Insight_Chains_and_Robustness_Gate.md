# S14 - Insight Chains and Robustness Gate

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
- Confirm `S13` is accepted and the repository status is clean or truthfully documented.
- Record the current checkpoint identifier.
- Confirm `S14` is the only active implementation unit in `TASKS.md`.
- Run the currently passing baseline tests before making changes.

## Session Objective
Write three to five evidence chains, stress-test major patterns, and decide whether a 100–300-record lightweight expansion is justified and legally feasible.

## Knowledge and Research Concepts
- Reproducibility, provenance, validity, uncertainty, and bounded marketing interpretation as applicable.
- Separation of observed facts, Lucy's judgment, AI suggestions, and public claims.
- Small-sample and single-viewer limitations must remain visible.

## Scope and Files
Create or modify only:
- `reports/marketing_insights.md`
- `notebooks/05_robustness_checks.ipynb`
- `docs/decisions.md`
- `docs/research_limitations.md`

Preserve all unrelated working behavior, private/raw data boundaries, completed-unit history, and evidence from prior units.

## Implementation Sequence
1. Inspect current implementations and tests; do not recreate working files blindly.
2. State the smallest bounded change that satisfies this unit.
3. Implement in small runnable steps.
4. Add or update tests before claiming completion.
5. Run the required checks and save evidence under `evidence/S14/`.
6. Update `TASKS.md`, `docs/decisions.md`, and `docs/CoBuildLog.md` truthfully.

## Manual Work
Lucy must state what the data cannot establish and approve every public claim.

## Tests and Checks
- Trace every numeric insight to a table, figure, or query.
- Run registered robustness alternatives and write the expansion go/no-go decision.
- Review `git diff --check`, `git status --short`, and the intended diff.

## Acceptance Criteria
- Insights cite reproducible evidence, alternatives, and next tests; sensitivity checks expose unstable conclusions.
- Expansion proceeds only if provenance, platform rules, time, and quality gates pass.
- Required evidence exists under `evidence/S14/`, and failed checks are not hidden.
- Lucy has personally run and understood at least one relevant check.

## Security, Privacy, and Licensing
- Never commit credentials, `.env`, private/raw transcripts, full video files, private account data, or unauthorized personal information.
- Use synthetic or publication-approved fixtures in tests.
- Respect platform rules; do not add bypass, scraping, or bulk collection that lacks approval.
- Treat AI output as a candidate requiring human verification.

## Do Not Do
- Do not begin `S15` or implement future-unit features.
- Do not build the optional dashboard or expansion dataset unless its separate gate has passed.
- Do not fill missing metrics with zero, pool incomparable platform fields, fabricate data/results, or write causal conclusions.
- Do not overwrite `TASKS.md` history or remove known issues.

## Checkpoint and Rollback
- If checks pass, stage only intended paths, commit as `S14: insight chains and robustness gate`, and optionally tag `checkpoint-s14`.
- If a check fails, keep `S14` active, record the failure and last verified checkpoint, and repair only this unit.

## Completion Report
Report changed files, commands run, actual results, manual verification, evidence paths, remaining limitations, and the next safe preparation step.

## Stop Condition
Stop when `S14` acceptance passes. Do not begin `S15`.
