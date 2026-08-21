# Test Plan

## Required Layers
- Schema: IDs, types, allowed labels, score ranges, dates, and missingness.
- Unit: cleaning, metrics, feature engineering, statistics, and AI agreement.
- Integration: raw-approved fixture through processed output.
- Notebook: execute cleanly in declared order without hidden state.
- SQL: three or more queries return documented columns and match Python definitions.
- Release: clean clone, install, pipeline, tests, links, privacy scan, and figure reproduction.

Evidence belongs under `evidence/<UnitID>/`. Failed tests remain recorded until repaired.
