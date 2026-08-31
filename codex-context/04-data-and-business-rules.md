# Data and Business Rules

**Status:** Development Baseline v1 — Partially Frozen  
**Last updated:** 2026-09-01

Previously frozen booking, rental, maintenance, utilization/idle, fuel-reference, and forecasting rules remain authoritative.

## Qualifying Weekly Demand

Demand forecasting uses canonical Confirmed booking demand by requested pickup branch and requested vehicle category.

See:

- `05-forecasting-specification.md`
- `20-demand-extraction-and-forecasting-boundary.md`

## Vehicle Utilization / Idle

Use canonical rental intervals, operational-state history, and maintenance readiness according to `19-vehicle-utilization-and-idle-detection.md`.

## Maintenance Readiness

Use the canonical VS012 derived readiness boundary.

Do not duplicate maintenance rules.

## Projected Available Supply

For branch `b`, category `c`, and persisted forecast horizon/week `h`:

`S[b,c,h]`

counts vehicles currently assigned to that branch/category that are:

- currently active;
- maintenance-eligible;
- free of overlapping canonical Confirmed assigned-booking commitments;
- free of canonical rental conflicts under the conservative active-rental rule.

Detailed rules are authoritative in:

`21-projected-supply-and-demand-balance.md`

Do not count an active rental as future supply until it is canonically ended.

Do not invent turnaround buffers while `CQ-018` remains unresolved.

## Required Vehicles

Use the persisted VS014:

`R[b,c,h] = required_vehicle_units`

## Shortage / Surplus

`Shortage[b,c,h] = max(0, R[b,c,h] - S[b,c,h])`

`Surplus[b,c,h] = max(0, S[b,c,h] - R[b,c,h])`

If `R = S`, both are zero.

No arbitrary reserve/shortage threshold exists.

## Supply Evaluation Fidelity

Supply/balance is time-sensitive decision support.

Preserve immutable evaluation snapshots tied to canonical forecast records rather than rewriting historical values when fleet state changes.

## Decision-Support Boundary

Utilization, idle, forecasts, projected supply, shortage, and surplus do not automatically mutate fleet branch assignments or bookings.

## Open Data-Level Decisions

Do not invent:

- full vehicle/rental/maintenance lifecycle vocabularies;
- historical data not supported by canonical coverage;
- turnaround/preparation buffer;
- final allocation approval item schema;
- client-specific future-supply reserve policies.
