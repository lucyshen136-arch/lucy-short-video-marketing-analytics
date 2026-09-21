# Lucy Short-Video Marketing Analytics

Prepared InnovationLab starter for a reproducible, exploratory study of short-video marketing strategies, public engagement signals, one viewer's response, and the reliability of AI-assisted content labels.

> This starter is already initialized. Do **not** rerun `prompts/INIT_Project_Initialization.md` against it. Begin with the one-time workspace audit, then execute S01 only.

## Research Position

- Core dataset: 30 manually selected and deeply annotated public videos.
- Core output: a professor-readable public GitHub repository with reproducible data, code, SQL, tests, results, limitations, and AI-collaboration evidence.
- Optional only: a 100-300 record lightweight extension and a dashboard.
- Claims: exploratory observations and hypotheses, not population estimates or causal effects.

## Environment

Recommended: Python 3.11 or 3.12, Git 2.40+, and JupyterLab. GitHub Desktop is optional.

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
python -m pytest
```

## First Run

1. Read `docs/AuthoritativePlan.md`, `TASKS.md`, and `prompts/GlobalEngineeringContract.md`.
2. Follow `docs/StartHere.md`.
3. Run `prompts/WORKSPACE_AUDIT.md` once. It must not implement features.
4. Execute only `prompts/S01_Research_Scope_and_Evidence_Workflow.md`.

## Local video management web app (optional)

Phase 1 UI for list / detail / create / edit / delete: see **`docs/web_local_dev.md`** and **`docs/web_app_plan.md`**.

## Privacy Boundary

Never commit complete transcripts, video files, credentials, private-account information, or unapproved personal information. Private/raw working files belong under ignored paths. Public fixtures must be synthetic or publication-approved.

## Baseline Sources

The authoritative student proposal is represented in `docs/AuthoritativePlan.md`. Current implementation conventions also align with the Python Packaging User Guide and GitHub's official Python Actions guidance.
