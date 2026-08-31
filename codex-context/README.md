# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-09-01

This folder is the implementation source-of-truth package.

## Authority Order

1. Frozen implementation decisions in this folder
2. Current revised Proposal Paper / Chapters 1–3
3. Validated client interview information
4. Defended frontend/use-case behavior
5. Existing mock/sample data

Do not invent unspecified behavior.

## Client-Specific Gaps

Use:

- `10-open-decisions.md` for blocking/unfrozen engineering decisions;
- `14-client-clarification-register.md` for Briah-specific questions with safe provisional behavior.

Temporary assumptions are not client-confirmed truth.

## Currently Frozen

The baseline now includes:

- authentication/roles;
- booking request;
- secure requirements and review;
- down-payment submission/manual verification;
- vehicle assignment;
- booking confirmation;
- vehicle-release / rental-start foundation;
- active-rental derivation from start/end timestamps without freezing a full lifecycle enum;
- forecasting/WMA/MAPE;
- recommendation/allocation;
- maintenance-readiness rule;
- external API provider/fallback strategy.

## Still Open

- full rental lifecycle and return/settlement;
- full vehicle operational lifecycle;
- maintenance lifecycle;
- exact turnover/financial-release rules;
- security deposit/remaining balance;
- extensions/late return/damage/fuel settlement;
- Operations Staff detailed write/action scope;
- long-term file retention;
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
- `CHANGELOG.md`
