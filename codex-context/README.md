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

## Development With Client-Specific Gaps

Not every undocumented client operational detail must block development.

Use:

- `10-open-decisions.md` for unresolved decisions that still require engineering/business resolution;
- `14-client-clarification-register.md` for specific operational details that only Briah's can reliably confirm.

A vertical slice may proceed with a conservative/configurable temporary assumption only when the slice explicitly authorizes it and the assumption does not compromise security, authorization, irreversible architecture, or core workflow integrity.

Temporary assumptions are not client-confirmed business truth.

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

Do not guess unless a current vertical-slice contract explicitly defines a safe provisional behavior:

- exact Operations Staff editable reservation fields;
- alternate renter/driver requirement scenarios;
- long-term sensitive-upload retention;
- payment-proof details;
- monetary/settlement details;
- rental/vehicle/maintenance lifecycle state machines;
- cancellation/refund detail;
- selected fuel-reference administration detail;
- item-level transfer approval persistence;
- API cache/refresh policy;
- broader notification/audit specification.

Client-confirmation questions for many operational gaps are maintained in `14-client-clarification-register.md`.

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
- `14-client-clarification-register.md`
- `CHANGELOG.md`

## Update Rule

Before implementing behavior that remains a blocking item in `10-open-decisions.md`, freeze that decision first.

When development uncovers a client-specific unknown that can safely use a provisional/configurable behavior, add or update the corresponding `CQ-###` entry in `14-client-clarification-register.md`.

After client validation, update the affected frozen specification and implementation rather than silently changing behavior.
