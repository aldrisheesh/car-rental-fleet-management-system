# Frontend Stabilization QA Checklist

## Seb - UI/UX & Accessibility
- novice comprehension;
- navigation consistency;
- responsive behavior;
- typography/spacing/hierarchy;
- forms/validation;
- loading/empty/error/success/waiting states;
- keyboard/focus/accessibility;
- wording clarity;
- role-to-role design consistency.

## Arron - Functional & Business Rules
- requirements-before-payment;
- booking lifecycle transitions;
- Finder -> Booking behavior;
- role behavior;
- assignment/rental/return integration;
- maintenance/readiness/availability;
- notifications/calendar/reports/decision-support behavior;
- synthetic/demo data does not masquerade as actual client history.

## Shane - Reliability/Security/Adversarial
- direct route/API authorization;
- stale/refresh/back behavior;
- duplicate submissions;
- invalid/missing IDs/input;
- upload access/validation;
- network/runtime failures;
- sensitive-data exposure;
- cross-role session/navigation behavior;
- no destructive production testing.

## Mica - Manuscript/Traceability
- terminology and role descriptions;
- screenshots/figures after stabilization;
- use-case/activity alignment;
- requirements/scope/limitations consistency;
- implemented provider/algorithm descriptions;
- demo/synthetic data claims clearly identified;
- new UI does not imply unimplemented capabilities.

## Lead release checks
- P0 lifecycle browser-verified;
- build/checks reviewed;
- backend/schema diff reviewed for unauthorized changes;
- role/security regression reviewed;
- synthetic demo scenario stable;
- unresolved Findings triaged;
- PR scope bounded;
- production deployment explicitly authorized.
