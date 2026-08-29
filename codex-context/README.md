# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active  
**Last updated:** 2026-08-29

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

- exact transactional status machines
- exact Operations Staff editable reservation fields
- upload/file constraints and retention rules
- selected fuel-reference administration details
- item-level approved-transfer candidate persistence
- API refresh/caching policies
- notification/audit details
- non-blocking evaluation/documentation cleanup

## Documents

- `01-system-ground-truth.md` — system purpose, scope, actors, and non-negotiable boundaries
- `02-roles-and-permissions.md` — functional access boundaries derived from defended use cases
- `03-workflows-and-status-rules.md` — high-level workflow gates; exact state machines still pending
- `04-data-and-business-rules.md` — frozen analytical/business rules plus remaining data-level open items
- `05-forecasting-specification.md` — **frozen WMA and MAPE rules**
- `06-recommendation-specification.md` — **frozen customer recommendation and branch-allocation rules**, except one item-level persistence detail
- `07-external-context-and-api-rules.md` — **frozen provider/fallback/classification strategy**, with refresh/caching details still open
- `08-notifications-and-audit.md` — notification triggers and audit requirements (**pending specification**)
- `09-implementation-constraints.md` — architectural and implementation guardrails for Codex
- `10-open-decisions.md` — unresolved decisions that must not be guessed
- `CHANGELOG.md` — documentation revision history

## Start-Development Rule

Codex may begin backend/platform foundation work now.

Safe initial work includes:

- Supabase/PostgreSQL project and migration foundation
- Supabase Auth integration
- server-side authorization/RBAC infrastructure
- private Storage foundation for protected uploads
- shared validation and server-function patterns
- stable entity/data-model migrations that do not require inventing unresolved state transitions
- test/build/environment infrastructure
- replacement of mock reads where the corresponding business rules are already frozen

Before implementing final booking/payment/rental mutation flows, freeze the exact state-transition matrix in `03-workflows-and-status-rules.md`.

## Update Workflow

For every future iteration:

1. Use the latest ZIP as the baseline.
2. Extract it without recreating the specification from memory.
3. Modify only the documents affected by the new decision.
4. Keep established terminology consistent.
5. Move resolved items out of `10-open-decisions.md`.
6. Update `CHANGELOG.md`.
7. Repackage the entire folder as the next ZIP.

Do not silently overwrite previously frozen decisions.
