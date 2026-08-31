# Recommendation Specification

**Status:** Frozen for Development Baseline v1, except item-level transfer approval persistence  
**Last updated:** 2026-09-01

There are two separate deterministic rule-based recommendation functions. Do not merge them.

## A. Customer-Side Vehicle Recommendation

Customer-side rules remain unchanged:

- hard eligibility for active, period-available, maintenance-ready vehicles;
- capacity >= requested passenger capacity;
- base rental cost <= total base rental budget;
- deterministic preference/capacity/cost ranking;
- no arbitrary match score;
- no external-context hard dependency.

## B. Admin-Side Branch Allocation Recommendation

Allocation recommendation remains advisory and is implemented only after canonical projected-supply/demand-balance evaluation exists.

### Required Vehicles

`R[b,c,h] = ceil(F[b,c,h])`

VS014 persists this as `required_vehicle_units`.

### Projected Supply

`S[b,c,h]` is authoritative according to:

`21-projected-supply-and-demand-balance.md`

A vehicle counts only when it is:

- in the evaluated branch/category;
- active;
- maintenance-eligible;
- free of conflicting booking/rental commitments for the evaluated week.

### Shortage / Surplus

`Shortage = max(0, R - S)`

`Surplus = max(0, S - R)`

No arbitrary reserve or shortage threshold is added.

### Allocation Boundary

VS015 computes/persists supply and balance only.

It does not yet:

- pair source/destination branches;
- recommend transfer quantities;
- select transfer candidates;
- approve/reject recommendations;
- execute transfers.

Those remain the next allocation layer.

### Later Transfer Eligibility

A future transfer recommendation may exist only when:

- destination shortage > 0;
- another source branch surplus > 0;
- same vehicle category/week;
- eligible source vehicles exist.

`RecommendedTransferUnits = min(DestinationShortageUnits, SourceSurplusUnits)`

Candidate prioritization remains longest idle duration first with deterministic tie-breaking.

### Context

External context is applied after internal shortage/surplus/candidate analysis.

Context does not create shortage/surplus.

### Human Review

Allocation remains advisory.

Owner/Admin may later approve/reject/lower quantity.

No vehicle branch changes automatically.

### Open Item-Level Persistence

Exact approved-candidate item persistence remains open until the allocation recommendation/approval slice freezes it.

## Guardrails

Do not:

- merge customer recommendation with admin allocation;
- invent scores;
- alter WMA;
- let context create internal shortage/surplus;
- auto-transfer vehicles;
- overwrite original system recommendation quantities.
