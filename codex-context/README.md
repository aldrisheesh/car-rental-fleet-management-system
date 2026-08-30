# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-08-31

This folder is the implementation context and source-of-truth package for developing the capstone system.

## Authority Order

When sources conflict, use this order:

1. Final/frozen implementation decisions in this folder
2. Current revised Proposal Paper / Chapters 1–3
3. Validated client interview information
4. Defended frontend and use-case behavior
5. Existing mock/sample data in the repository

If a required behavior remains unspecified, do not invent it.

## Currently Frozen for Implementation

The baseline now includes:

- system scope and actor boundaries;
- canonical authentication/roles;
- booking-request/status foundation;
- baseline self-drive renter documents;
- private secure requirement Storage;
- requirement submission and replacement/versioning;
- deterministic Owner/Admin requirement review;
- manual LTO-check outcome recording;
- `Pending Review → Needs Resubmission | Verified`;
- payment gate requiring verified requirements;
- forecasting/WMA/MAPE rules;
- recommendation/allocation logic;
- maintenance-readiness logic;
- primary/fallback external API strategy.

## Still Open

Do not guess:

- exact Operations Staff editable reservation fields;
- alternate renter/driver requirement scenarios;
- long-term sensitive-upload retention;
- payment-proof details;
- rental/vehicle/maintenance lifecycle state machines;
- cancellation/refund detail;
- selected fuel-reference administration detail;
- item-level transfer approval persistence;
- API cache/refresh policy;
- broader notification/audit specification.

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
- `CHANGELOG.md`

## Update Rule

Before implementing behavior still listed in `10-open-decisions.md`, freeze that decision first.

Do not silently overwrite previously frozen decisions.
