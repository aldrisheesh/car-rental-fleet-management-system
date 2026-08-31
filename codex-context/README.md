# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-09-01

## Fleet Intelligence Progression

Implemented/frozen dependency direction:

1. Maintenance/readiness — VS012
2. Utilization/idle — VS013
3. Demand forecasting — VS014
4. Projected available supply / demand balance — VS015
5. Branch allocation recommendation
6. Context/API enrichment
7. Reports/dashboard consolidation

## VS015 Boundary

VS015 compares canonical forecast requirements against canonical eligible fleet supply.

It produces:

- projected available supply;
- shortage;
- surplus;
- balanced state;
- auditable per-vehicle eligibility snapshot.

It does **not** transfer or recommend movement between branches yet.

See:

- `05-forecasting-specification.md`
- `06-recommendation-specification.md`
- `18-maintenance-monitoring-and-readiness.md`
- `20-demand-extraction-and-forecasting-boundary.md`
- `21-projected-supply-and-demand-balance.md`

## Integrity Rules

Do not:

- treat raw fleet count as available supply;
- count active rentals as assumed future supply;
- ignore assigned Confirmed booking conflicts;
- invent a turnaround buffer;
- invent a spare/reserve threshold;
- mutate branch assignments from shortage/surplus analytics.

## Client Gaps

See `14-client-clarification-register.md`, especially:

- `CQ-018`
- `CQ-024`
- `CQ-025`
