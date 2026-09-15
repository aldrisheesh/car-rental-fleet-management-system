# Implementation Plan

**Status:** Placeholder until blueprint + Codex repository discovery are reconciled and Lead freezes the baseline.  
**Governance:** GitHub Issue #63  
**Authorized branch:** `stabilization/frontend-rebuild`

## Required planning constraints
- Use the existing Lead-created branch `stabilization/frontend-rebuild`; do not create a replacement branch unless authorized.
- Verify it remains based on the intended `main` baseline before implementation starts.
- Preserve production as rollback/reference until replacement passes P0 verification.
- No unrelated backend refactors.
- Prefer shared design-system primitives and incremental vertical slices.
- Integrate against canonical server contracts.
- Keep commits reviewable.

## Proposed six-day envelope

### Day 0 / Gate
Freeze workflow, lifecycle, IA, migration map, backend contracts, representative visual direction.

### Day 1
Application shells/design primitives + Home/Find Car/Vehicle/Reserve vertical slice.

### Day 2
Authentication handoff + Booking Detail + Requirements customer flow.

### Day 3
Payment customer flow + Admin Dashboard/Booking Queue/Booking Detail critical actions.

### Day 4
Fleet/Maintenance/Decision Support/Reports and remaining defense-critical operational surfaces.

### Day 5
Controlled E2E, responsive/accessibility, role/security regression, failure states.

### Day 6
Regression/deploy/demo data/evidence/rehearsal only. No discretionary redesign.

Codex must replace this provisional schedule with a repository-informed file/change plan after discovery.

## PR / merge boundary

All implementation for this stabilization effort remains on `stabilization/frontend-rebuild` until validation is complete. The final integration path is a reviewed PR from `stabilization/frontend-rebuild` to `main`. Codex must not merge or push directly to `main`.
