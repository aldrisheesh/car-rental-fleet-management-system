# Frontend implementation plan

Status: Phase 1 implemented on main and checked locally on 3 October 2026. Acceptance remains partial: staff redirect landing, payment-detail browser coverage, a committed movement replay, and deployed verification remain outstanding. See [Phase 1 verification](2026-10-03-frontend-phase1-verification.md). Phase 2 is implemented and checked locally for non-mutating review paths; see [Phase 2 verification](2026-10-03-frontend-phase2-verification.md). Phase 3 is implemented and verified locally with documented acceptance limits; see [Phase 3 verification](2026-10-03-frontend-phase3-verification.md). Ford Everest photo upload and integrated acceptance remain outstanding.

Basis: [Frontend audit](2026-10-03-frontend-ux-audit.md), `main` at `02705878`, 3 October 2026. Recheck current Git state before implementation and preserve unrelated manuscript/output files.

## Direction and skills

Reading this as: a refinement of an operational rental system for admins, staff, and customers, with a calm, task-focused interface preserving Briah's current brand and component system.

- Impeccable is the primary design skill, using Operate mode for DSS, dashboards, forms, and admin tasks. Use harden/adapt/clarify/layout/distill as applicable, followed by bounded visual checks and polish.
- Web Interface Guidelines is the verification reference. Fetch its latest rules for each scoped review and connect findings to changed files and lines.
- Design Taste explicitly excludes dashboards, data tables, and multi-step product UI. Use its preservation and relevant accessibility principles, and its full marketing guidance only if a public marketing surface becomes part of the agreed scope. Do not apply its hero, motion, imagery, or marketing-density rules to DSS.
- Preserve the existing React/TanStack, Tailwind, Radix-based components and brand. This plan does not call for a framework/component-library migration, new decorative images, or new animation dependencies.
- Before UI editing, read Impeccable's craft-floor and the relevant command references. Context was already loaded during this session; do not rerun it unnecessarily.

## Phase cycle

1. State the phase scope, current baseline, and acceptance checks.
2. Wait for the user's signal to start that phase. Once signaled, complete implementation and verification without asking permission for routine edits or fixes inside that scope.
3. Implement the full phase, including loading, empty, error, permission, and overflow states affected by the change.
4. Run relevant existing tests and targeted regression checks. Add tests for material logic/state regressions, not tests that merely mirror styling. Run the build and scoped lint/format checks appropriate to the phase.
5. Inspect desktop and mobile together in one batched browser pass, correct identified defects in one batch, and perform one confirmation pass. A remaining failure is reported as unresolved; do not call the phase passed or continue polishing indefinitely.
6. Report changed behavior, tests/results, screenshots, and any remaining limitations. Keep a separate commit/checkpoint per accepted phase on `main`, as previously requested. Check how pushing triggers Vercel before publishing; do not surprise the user with a production release.
7. Pause at the phase boundary for the next signal. A failed acceptance check must be resolved or explicitly reported before proceeding.

Status labels: **Not started**, **Implementing**, **Verification failed**, **Verified locally**, **Verified on deployment**, **Accepted**. Local verification must never be reported as live-site verification.

## Phase 1: Repair the foundations

Audit scope: F01, F02, F03, F06, F07.

Changes:
- Restore the existing fleet location-change workflow on desktop, reusing affected-booking review and role restrictions.
- Correct direct/reloaded Payments and analogous Requirements/detail route authentication handling without weakening server authorization.
- Correct date-only DSS week boundaries and inclusive range labels.
- Apply consistent admin theme tokens to portaled dialogs.
- Fix maintenance dialog naming/description handling and the clipped prior-record count.

Pass checks:
- Admin can paste/reload every affected protected URL; signed-out and staff access behaves correctly.
- Allocation-location control is discoverable at 1920 and 1366 and remains available on narrow layouts. Approval alone does not move a vehicle.
- Movement review identifies affected bookings and supports cancellation; exercise a committed movement only with identified resettable test records.
- September 28 to October 4 and October 5 to October 11 display correctly across browser timezones.
- Dialog text, inputs, focus, keyboard close, and focus restoration work; maintenance history count stays readable.

## Phase 2: Make DSS review coherent

Audit scope: F04, F05, DSS parts of F11 and F12.

Changes:
- Establish a selected recommendation context with exact source/destination, category, target week, quantity, and supporting snapshots.
- Open Review transfer directly into the selected review; collapse unresolved-gap details without discarding them.
- Present the recommendation, rationale, and external advisory summary before detailed evidence.
- Prevent old/loading operational context from appearing to justify a newly selected recommendation. Make missing-data review deliberate and explicit.
- Clarify approval/rejection consequences, analysis generation versus fetching, snapshot freshness, and analysis-coverage counts.
- Connect an approved recommendation to the existing manual fleet workflow.
- Preserve WMA calculations, idle/utilization evidence, external factors, accuracy/exclusions, and provider assumptions in expandable evidence.

Pass checks:
- Selecting different recommendations, categories, or weeks never joins unrelated evidence under one apparent rationale.
- Loading, genuine no-transfer results, unavailable context, and failed requests are distinct.
- Reported closures and unverified routes are prominent, attributed, and advisory; no missing metric is silently treated as safe.
- Pending, Approved, Rejected, partial approved quantity, and unresolved shortages are understandable.
- Approval remains a human recommendation decision; external factors do not silently change WMA or move vehicles.
- Calculation/forecast results remain consistent before and after the UI change.

Before implementation, present a compact DSS layout/interaction brief for confirmation if the composition or decision acknowledgment requires a material choice. Resolve routine details autonomously. New persisted decision reasons/statuses require separate domain design; do not invent them as a cosmetic change.

## Phase 3: Finish role and customer refinements

Audit scope: F08, F09, F10, remaining F11/F12, F13, F14, F15.

Changes:
- Remove staff dead ends and explain Owner/Admin handoffs with role-appropriate copy.
- Use consistent, distinguishing booking display references without changing primary IDs.
- Remove inert profile navigation or link implemented destinations; compact the narrow account layout.
- Correct premature notification empty/preference states.
- Label report target weeks, accuracy scope, and generation times; reduce repeated evidence presentation.
- Diagnose affected vehicle image references and allow image recovery when the source changes.
- Give notification rows enough entity/time context and distinguish historical events from current tasks.
- Align deposit/downpayment timing wording with the actual business policy.

Pass checks:
- Every visible staff action is permitted or clearly identifies the responsible admin.
- The same rental has the same distinguishing display reference across lists, details, payment review, and relevant notifications.
- Profile navigation works; slow notification loading does not claim “all caught up” or an authoritative preference value.
- Reports clearly separate target week from generation/reporting dates and explain differing accuracy sample scopes.
- Image fallback recovers on a valid source; inbox items can be distinguished without opening each one.
- Quote copy consistently states amounts due now, at handover, and refundable after return.

## Phase 4: Defense acceptance and release check

Status: Implementing. Non-mutating browser checks, 369 regression tests, build,
typecheck and scoped lint pass. A fresh October 3 baseline import rehearsal
passed and rolled back; the older saved baseline still refuses reset because
of schema mismatch. Applying a replacement baseline, full lifecycle/movement
rehearsals and deployment remain pending. See
[Phase 4 verification](2026-10-03-frontend-phase4-verification.md).

Purpose: verify the integrated system after the preceding phases, not introduce a new redesign.

- Replay one customer booking to requirements review, payment, release, and return using designated resettable synthetic records.
- Replay one DSS recommendation to human decision and manual fleet movement, including affected-request review.
- Check no-donor shortages, flagged/unavailable external context, loading/error states, and staff access restrictions.
- Check 1920×1080, 1366×768, a representative tablet width, and 390×844; inspect keyboard access, dialog focus, contrast, and local table scrolling.
- Inspect defense script behavior before running it: do not assume `defense:verify` or `defense:decision-support` is read-only. Use the documented fixture/baseline workflow for mutations and never reset shared data silently.
- Verify the deployed version separately from local results. Record the commit/deployment and remaining limitations.
- Retake only affected GUI evidence after the accepted screens are stable. Assess whether changed visible terminology requires a small UCD/UCR/manuscript alignment; do not reopen submitted chapters automatically.

Final gate: no unresolved major audit findings in the tested scope, all phase acceptance checks pass, business/permission regressions are absent in the replayed journeys, and unavailable external data is honestly represented. This does not assert real-world predictive validity from synthetic data.

## Immediate next action

Resolve the pending replacement-baseline choice, then replay final decisions,
payments, lifecycle events and manual movement using designated resettable
fixtures. Supply the missing Ford Everest photo before a separately verified
release. Do not count local checks as a production acceptance pass.
