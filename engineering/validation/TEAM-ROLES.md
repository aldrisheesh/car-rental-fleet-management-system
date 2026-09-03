# Team Roles

## Aldrich — Lead Developer
Owns architecture, domain decisions, final priority, schema approval, production/deployment, task assignment, PR approval/merge, cross-aspect reconciliation, final manuscript decisions, and release readiness.

## Seb — UI/UX & Accessibility QA
GitHub: @sebastiandane

Owns system-wide usability, visual consistency, accessibility, responsive behavior, forms, dialogs, navigation, wording clarity, empty/loading/error/success states, keyboard/focus behavior, and visual polish.

Hard stop:
- business/process/logic → Arron
- reliability/security → Shane
- manuscript/traceability → Mica
- architecture/domain/schema/production → Lead

## Arron — Functional & Business Rules QA
GitHub: @git-arron

Owns system-wide business process correctness, lifecycle/state transitions, authentication/roles, requirements, Finder, booking, payment, allocation, rental, maintenance/readiness, availability, notifications, calendar, reports, decision support, audit behavior, and cross-subsystem logic.

Hard stop:
- UI/UX/accessibility → Seb
- reliability/security/adversarial testing → Shane
- manuscript/traceability → Mica
- architecture/domain/schema/production → Lead

## Shane — Reliability, Security & Adversarial QA
GitHub: @Shayfeint

Principle: Break the workflow, not production.

Owns authorization boundaries, direct route/API checks, invalid/missing input, invalid IDs, duplicate actions, stale state, refresh/back behavior, failure handling, browser/runtime errors, sensitive-data exposure, RLS/server authorization, upload validation/access, and safe negative paths.

Must not brute-force, steal/manipulate credentials or tokens, DoS services, intentionally corrupt production, delete legitimate production data, attack third-party services, or expose private customer data.

Potentially destructive testing requires an approved preview/isolated environment.

Hard stop:
- UI redesign → Seb
- business/lifecycle redesign → Arron
- manuscript/traceability → Mica
- architecture/domain/schema/production → Lead

## Mica — Project Manager, Manuscript & Traceability QA
GitHub: @MicaDepaur

Owns Proposal Paper consistency, Revision Matrix traceability, MIC/change-register tracking, terminology consistency, requirements/scope/limitations alignment, architecture/provider descriptions, data dictionary/ERD alignment, screenshots/figures, role descriptions, testing/deployment evidence, defense evidence inventory, and GitHub Project hygiene.

When manuscript and implementation disagree:
OBSERVE → VERIFY → REPORT → LEAD DECIDES.

Mica does not modify application source, schema/migrations, auth/security implementation, provider implementation, dependencies, production configuration, or deployment infrastructure unless explicitly authorized for documentation-only work.
