# Recommendation Specification

**Status:** Frozen for Development Baseline v1 through internal allocation recommendation  
**Last updated:** 2026-09-01

There are two separate deterministic recommendation functions.

## A. Customer-Side Vehicle Recommendation

Customer-side Smart Vehicle Finder rules remain unchanged and separate.

## B. Admin-Side Branch Allocation Recommendation

Canonical implementation details are authoritative in:

`22-branch-allocation-recommendation.md`

### Canonical Inputs

Use immutable VS015 supply/balance evaluations.

### Pair Eligibility

A recommendation requires:

- destination shortage > 0;
- different source branch surplus > 0;
- same category;
- same target week.

### Quantity

`RecommendedTransferUnits = min(DestinationShortageUnits, SourceSurplusUnits)`

Across a batch, decrement remaining shortage/surplus so the same units are not recommended multiple times.

### Candidates

Candidates come from eligible source VS015 items and are revalidated against current minimum safety/availability constraints.

Rank primarily by longest canonical idle duration.

Known idle duration ranks ahead of unknown.

The 14-day Idle classification is not a hard transfer-eligibility requirement.

### Decision

Owner/Admin may Approve, approve a lower positive quantity, or Reject.

Preserve original recommended quantity.

Approval does not update vehicle branch.

### Context / Execution

External context and physical transfer execution remain later.

See `CQ-017` and `CQ-026`.
