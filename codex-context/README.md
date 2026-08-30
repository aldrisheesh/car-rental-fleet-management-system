# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-08-31

This folder is the implementation context and source-of-truth package for developing the capstone system.

## Purpose

These documents translate the approved/revised Chapters 1–3, client-validated business processes, defended frontend, and subsequent implementation decisions into concise specifications that Codex can use during implementation.

Codex should not infer business rules from mock data, UI labels, or existing frontend behavior when a rule is defined here.

## Authority Order

When sources conflict, use this order:

1. Final/frozen implementation decisions in this folder
2. Current revised Proposal Paper / Chapters 1–3
3. Validated client interview information
4. Defended frontend and use-case behavior
5. Existing mock/sample data in the repository

If a required behavior remains unspecified, **do not invent it**. Flag the ambiguity for a project decision.

## Development Baseline v1

The following areas are now sufficiently frozen for implementation:

- system scope/non-negotiable boundaries
- actor boundaries and major role restrictions
- booking-request foundation and canonical booking statuses
- baseline requirement-verification statuses and workflow gate
- baseline self-drive renter requirement set:
  - Valid Government ID
  - Driver's License
- renter-document upload file types, 10 MiB limit, replacement/versioning, and private Storage rules
- qualifying-demand definition
- vehicle utilization calculation
- 14-day idle-vehicle rule
- maintenance-readiness gate
- three-period WMA with fixed `0.50 / 0.30 / 0.20` weights
- rolling Week +1 / Week +2 / Week +3 recursive forecast horizon
- forecast-run/history and MAPE/APE behavior
- customer recommendation hard filters and deterministic ranking
- branch shortage/surplus/transfer logic and longest-idle candidate priority
- reference fuel and estimated-fuel calculation
- primary/fallback API providers
- context fallback and normalization rules

The following remain intentionally open and must not be guessed:

- exact rental/vehicle/maintenance lifecycle status machines
- exact Operations Staff editable reservation fields
- alternate renter/driver requirement scenarios
- long-term sensitive-upload retention/deletion duration
- payment-proof upload details
- selected fuel-reference administration details
- item-level approved-transfer candidate persistence
- API refresh/caching policies
- notification/audit details
- non-blocking evaluation/documentation cleanup

## Documents

- `01-system-ground-truth.md` — system purpose, scope, actors, and non-negotiable boundaries
- `02-roles-and-permissions.md` — functional access boundaries derived from defended use cases
- `03-workflows-and-status-rules.md` — frozen booking/requirement/payment foundations plus remaining lifecycle boundaries
- `04-data-and-business-rules.md` — frozen analytical/business rules and sensitive-data principles
- `05-forecasting-specification.md` — **frozen WMA and MAPE rules**
- `06-recommendation-specification.md` — **frozen customer recommendation and branch-allocation rules**, except one item-level persistence detail
- `07-external-context-and-api-rules.md` — **frozen provider/fallback/classification strategy**, with refresh/caching details still open
- `08-notifications-and-audit.md` — notification triggers and audit requirements (**pending specification**)
- `09-implementation-constraints.md` — architectural and implementation guardrails for Codex
- `10-open-decisions.md` — unresolved decisions that must not be guessed
- `11-requirements-and-secure-storage.md` — **frozen baseline renter-document submission and private Storage rules**
- `CHANGELOG.md` — documentation revision history

## Start-Development Rule

Backend/platform and currently frozen transactional foundations may be implemented through approved vertical slices.

Before implementing a behavior still listed in `10-open-decisions.md`, freeze that decision first.

## Update Workflow

For every future iteration:

1. Use the latest repository state as the baseline.
2. Modify only documents affected by the new decision.
3. Keep established terminology consistent.
4. Move resolved items out of `10-open-decisions.md`.
5. Update `CHANGELOG.md`.
6. Commit the revised context before the next dependent vertical slice.

Do not silently overwrite previously frozen decisions.
