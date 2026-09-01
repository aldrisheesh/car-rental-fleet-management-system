# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-09-01

## Fleet Intelligence Progression

1. Maintenance/readiness — VS012
2. Utilization/idle — VS013
3. Demand forecasting — VS014
4. Projected supply/demand balance — VS015
5. Internal branch allocation recommendation — VS016
6. External context enrichment
7. Transfer execution / final branch mutation after client clarification
8. Reports/dashboard consolidation

## VS016 Boundary

VS016 consumes immutable VS015 supply evaluations to generate deterministic advisory branch-allocation recommendations.

It may persist:

- source/destination pairing;
- recommended quantity;
- ranked candidate vehicles;
- Owner/Admin Approved/Rejected decision;
- lower approved quantity.

It must not mutate `vehicles.branch_id`, claim approved quantity selected exact units, create transfer-execution lifecycle states, or integrate external context yet.

See:

- `06-recommendation-specification.md`
- `21-projected-supply-and-demand-balance.md`
- `22-branch-allocation-recommendation.md`
- `CQ-026`
