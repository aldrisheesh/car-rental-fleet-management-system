# Codex Discovery Prompt - Frontend Stabilization

You are performing DISCOVERY ONLY for the Lead-authorized frontend stabilization governed by GitHub Issue #63.

Canonical repository:
`https://github.com/aldrisheesh/car-rental-fleet-management-system`

Authorized working branch:
`stabilization/frontend-rebuild`

Before inspecting implementation:
1. Fetch latest remote refs.
2. Verify `origin/stabilization/frontend-rebuild` exists.
3. Switch to `stabilization/frontend-rebuild`.
4. Verify and report current branch, HEAD SHA, `origin/main` SHA, `origin/stabilization/frontend-rebuild` SHA, and working-tree cleanliness.
5. Do not switch back to `main`.
6. Read `frontend-stabilization/README.md` and files `01` through `10`.

## Objective
Produce repository-derived evidence needed to validate the proposed frontend blueprint without redesigning or modifying the application.

## Tasks
1. Inventory every user-facing route/surface for Public, Customer/Renter, Operations Staff, and Owner/Admin.
2. For each surface, record its purpose, visible actions, meaningful states, loaders/queries, server functions/mutations, role restrictions, and important error/empty/loading behavior.
3. Trace frontend-critical backend contracts for authentication, Finder, booking, requirements, payment, confirmation/assignment, rental release/return, notifications, fleet/readiness, maintenance, calendar, decision support, reports, customers, branches, users/roles, and settings.
4. Identify duplicate/overlapping frontend capabilities and legacy presentation assumptions, but do not decide new business rules.
5. Compare the repository evidence against `07-CAPABILITY-MIGRATION.md` and `08-BACKEND-CONTRACTS.md`.
6. Report conflicts where the proposed blueprint cannot be implemented without backend/domain changes.

## Deliverables
Update only documentation on `stabilization/frontend-rebuild`:
- `frontend-stabilization/evidence/CURRENT-UI-INVENTORY.md`
- repository-derived sections of `frontend-stabilization/07-CAPABILITY-MIGRATION.md`
- repository-derived sections of `frontend-stabilization/08-BACKEND-CONTRACTS.md`

Also provide a concise conflict report categorized as:
- frontend-only;
- implementation defect candidate;
- manuscript mismatch;
- domain/client ambiguity;
- architecture/schema/authorization conflict.

## Hard stops
Do NOT:
- modify application source;
- modify schema/migrations;
- change business rules;
- redesign screens;
- create new features;
- change authorization;
- deploy;
- treat legacy screenshots as the required new visual design.

The legacy frontend is evidence of capability coverage and usability problems, not the design baseline.

## Branch and Git hard stops
Do NOT:
- commit or push directly to `main`;
- merge `stabilization/frontend-rebuild` into `main`;
- rebase/reset/force-push `main`;
- create a new implementation branch unless the Lead explicitly changes the plan;
- modify application source during this discovery pass.

When discovery is complete, stop and report the evidence and conflicts. Do not begin redesign or implementation without explicit Lead authorization.
