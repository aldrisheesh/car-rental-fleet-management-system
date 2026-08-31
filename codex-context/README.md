# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-09-01

## Currently Frozen

The implementation baseline covers:

- booking through physical rental return;
- secure requirements/payment verification;
- vehicle assignment/confirmation;
- canonical rental start/end intervals;
- maintenance records/readiness;
- vehicle utilization and idle-detection rules;
- qualifying weekly demand;
- WMA/MAPE forecasting;
- recommendation/allocation specifications;
- external context provider/fallback rules.

## Fleet Intelligence Dependency Direction

Implementation order:

1. Maintenance monitoring/readiness — completed through VS012
2. Vehicle utilization + idle detection — VS013
3. Demand forecasting
4. Branch demand / projected supply
5. Branch allocation recommendation
6. Context/API enrichment
7. Reports/dashboard consolidation

VS013 must use canonical rental intervals and canonical maintenance readiness rather than prototype booking/vehicle status data.

## Analytics Integrity

Utilization and idle are derived indicators.

Do not store manually editable utilization percentages or idle booleans.

Historical active/inactive eligibility must not be fabricated. See:

- `19-vehicle-utilization-and-idle-detection.md`
- `CQ-023`

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
- `19-vehicle-utilization-and-idle-detection.md`
- `CHANGELOG.md`
