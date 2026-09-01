# Changelog

## 2026-09-01 — Internal Branch Allocation Recommendation Baseline

Prepared the Development Baseline for VS016.

### Frozen / Clarified

- Added `22-branch-allocation-recommendation.md`.
- Bound allocation recommendation to immutable VS015 source/destination evaluations.
- Frozen same-category/same-week pairing.
- Frozen `min(destination shortage, source surplus)` quantity.
- Added batch-level remaining shortage/surplus accounting.
- Frozen candidates from eligible VS015 items plus current revalidation.
- Frozen longest-idle-duration-first ranking without arbitrary scores.
- Clarified that 14-day Idle classification is not a hard candidate requirement.
- Frozen immutable recommendation/candidate snapshots.
- Frozen Pending / Approved / Rejected advisory states.
- Frozen lower positive approved quantity while preserving original recommendation.
- Reaffirmed that approval does not mutate vehicle branch.
- Deferred item-level approved vehicle selection and physical transfer execution.
- Added `CQ-026`.
- Deferred external context enrichment.
