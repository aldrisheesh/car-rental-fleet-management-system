# Final Validation Round 001 — Aspect-Based Baseline

Mode: Discovery only. No code changes until a Lead-confirmed Issue exists.

## Seb — UI/UX & Accessibility
Audit the entire system for global consistency, navigation, typography/spacing, forms/dialogs, loading/error/empty/success states, accessibility, keyboard/focus behavior, responsive/mobile behavior, wording/clarity, and role-to-role design consistency.

## Arron — Functional & Business Rules
Audit the entire system for happy-path workflows, lifecycle/state transitions, role behavior, requirements/payment/booking/allocation/rental integration, maintenance/readiness/availability logic, notifications/calendar/reports/decision-support behavior, and canonical-vs-fabricated data behavior.

Stateful production flows require Lead coordination.

## Shane — Reliability & Adversarial
Audit the entire system safely for authorization boundaries, direct routes/APIs, invalid/missing input, duplicate actions, stale/refresh/back behavior, error states, runtime/network failures, sensitive-data exposure, and safe negative paths.

Break the workflow, not production. Potentially destructive tests require preview/isolated approval.

## Mica — Manuscript & Traceability
Audit Proposal Paper, Revision Matrix, MIC/change register, codex-context traceability, provider descriptions, role descriptions, data dictionary/ERD, screenshots/figures, requirements/scope/limitations, testing/deployment claims, and accumulated implementation reconciliation notes.

Create P4 Findings for real documentation/manuscript mismatches. Do not edit application source.

Shared deliverable: GitHub Validation Finding Issues for team-visible problems. Ordinary questions stay in the member's own ChatGPT Project unless unresolved.
