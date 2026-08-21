# Methodology

## Sampling frame (confirmed 2026-08-18)

- **Core sample:** 30 manually selected public short videos (Gold Dataset).
- **Platforms:** Douyin, Xiaohongshu, and Bilibili in one mixed exploratory sample.
- **Selection:** Lucy chooses videos before analysis and records `selection_reason` for each row.
- **Pilot gate:** five videos (`data/sample/pilot_selection.csv`) validate the minimum field set before scaling to 30.

## Minimum record contract

Every video row starts with the twelve minimum required fields defined in `data/data_dictionary.md`, validated by `config/schema.json`. Expansion fields (marketing labels, derived rates, viewer response) are added in later units without retroactively changing ID or URL rules.

## Measurement boundaries

- Public metrics are point-in-time snapshots (`metrics_collected_at`), not live totals.
- Cross-platform counts are documented side by side but compared cautiously; rate features are computed within platform unless a later unit explicitly harmonizes definitions.
- Lucy’s viewer-response scores describe one viewer, not a population.
- Claims remain exploratory: observed patterns and hypotheses, not causal effects.

Detailed field definitions, platform mappings, and public/private rules live in `data/data_dictionary.md` and `docs/DataGovernance.md`.
