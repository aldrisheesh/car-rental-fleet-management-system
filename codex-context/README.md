# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-09-01

This folder is the implementation source-of-truth package.

## Authority Order

1. Frozen decisions in this folder
2. Current revised Proposal Paper
3. Validated client interviews
4. Defended frontend/use cases
5. Existing mock/sample data

Do not invent unspecified behavior.

## Client-Specific Gaps

Use `10-open-decisions.md` for unresolved engineering/business decisions and `14-client-clarification-register.md` for Briah-specific operational details that can use an explicitly authorized provisional implementation.

## Currently Frozen

The baseline includes:

- authentication/roles;
- booking request/status foundation;
- secure renter requirements and review;
- down-payment submission/manual verification;
- Owner/Admin vehicle assignment foundation;
- deterministic booking confirmation gate;
- requested-vs-assigned vehicle separation;
- overlapping-confirmed-booking conflict rule;
- forecasting/recommendation/allocation rules;
- maintenance-readiness rule;
- external API provider/fallback strategy.

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
- `CHANGELOG.md`
