# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-09-01

## Currently Frozen

The implementation baseline covers:

- booking through physical rental return;
- maintenance/readiness;
- utilization/idle detection;
- canonical qualifying weekly demand extraction;
- three-period WMA with 0.50 / 0.30 / 0.20 weights;
- three-week recursive forecast horizon;
- immutable forecast-run fidelity;
- horizon-1 MAPE evaluation;
- recommendation/allocation specifications;
- external context provider/fallback rules.

## Fleet Intelligence Dependency Direction

1. Maintenance/readiness — VS012
2. Utilization/idle — VS013
3. Demand forecasting — VS014
4. Projected supply / branch demand balance
5. Branch allocation recommendation
6. Context/API enrichment
7. Reports/dashboard consolidation

## Forecast Integrity

Forecasting uses canonical Confirmed booking demand by scheduled rental-start week, requested pickup branch, and requested vehicle category.

Do not forecast from:

- rental days;
- utilization;
- assigned substitution vehicle;
- Submitted requests;
- fabricated historical zero weeks.

See:

- `05-forecasting-specification.md`
- `20-demand-extraction-and-forecasting-boundary.md`
- `CQ-024`

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
- `20-demand-extraction-and-forecasting-boundary.md`
- `CHANGELOG.md`
