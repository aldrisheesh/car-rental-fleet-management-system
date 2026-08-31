# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-09-01

## Currently Frozen

The implementation baseline now covers the canonical transactional chain through physical vehicle return:

- booking request;
- requirements;
- requirement review;
- down-payment submission/verification;
- vehicle assignment;
- booking confirmation;
- vehicle release/rental start;
- active rental;
- vehicle return/rental end.

Rental state continues to use canonical start/end timestamps rather than a prematurely frozen lifecycle enum.

## Still Open

- final financial settlement;
- security-deposit handling;
- remaining balance;
- late/damage/fuel charges;
- extension workflow;
- full vehicle operational state machine;
- maintenance lifecycle;
- exact Briah return/turnover checklists;
- Operations Staff detailed scope;
- notifications/audit details.

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
- `CHANGELOG.md`
