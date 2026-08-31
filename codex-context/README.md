# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-09-01

## Currently Frozen

The implementation baseline covers:

- booking through physical rental return;
- secure requirements and payment verification;
- vehicle assignment/confirmation;
- canonical rental start/end intervals;
- baseline maintenance records and deterministic maintenance-readiness rules;
- qualifying weekly demand;
- utilization/idle formulas;
- WMA/MAPE forecasting specification;
- recommendation/allocation specifications;
- external context provider/fallback rules.

## Dependency Direction

The recommended implementation order after physical rental return is:

1. Maintenance monitoring/readiness foundation
2. Vehicle utilization + idle detection
3. Demand forecasting
4. Branch demand/projected supply
5. Branch allocation recommendation
6. Context/API enrichment
7. Reports/dashboard consolidation

Maintenance comes before utilization/idle because eligible operational days and rental-ready/idle eligibility depend on maintenance availability/readiness.

## Client-Specific Gaps

See:

- `10-open-decisions.md`
- `14-client-clarification-register.md`

Temporary assumptions are not client-confirmed truth.

## Documents

- `01-system-ground-truth.md`
- `02-roles-and-permissions.md`
- `03-workflows-and-status-rules.md`
- `04-data-and-business-rules.md`
- `05-forecasting-specification.md`
- `06-recommendation-specification.md`
- `07-external-context-and-api-rules.md`
- `08-notifications-and-audit.md`
- `09-implementation-constraints.md`
- `10-open-decisions.md`
- `11-requirements-and-secure-storage.md`
- `12-requirement-review-and-verification.md`
- `13-payment-submission-and-verification.md`
- `14-client-clarification-register.md`
- `15-vehicle-assignment-and-booking-confirmation.md`
- `16-rental-release-and-start.md`
- `17-rental-return-and-closure.md`
- `18-maintenance-monitoring-and-readiness.md`
- `CHANGELOG.md`
