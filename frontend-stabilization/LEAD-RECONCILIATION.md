# Lead Reconciliation — Frontend Stabilization Baseline

**GitHub Issue:** #63 — Frontend Stabilization Rewrite — First-Time Renter Guided Experience  
**Branch:** `stabilization/frontend-rebuild`  
**Purpose:** Resolve the remaining design-review conflicts before freezing the frontend blueprint for visual design and implementation.

## Decision 1 — Down-payment policy

**Classification:** Client-confirmed business rule + implementation gap.

The minimum down payment is **50% of the applicable total bill** after requirements verification. This rule is supported by the client clarification and is not a domain ambiguity.

Current backend/payment semantics do not reliably provide a canonical computed `required_amount` for every applicable booking. Therefore:

- the stabilized frontend may state the client-confirmed 50% minimum policy;
- the frontend must not invent or independently calculate a peso amount from incomplete financial semantics;
- a peso amount may be displayed only when a trustworthy canonical required amount is available from the backend;
- cancellation/refund exceptions remain separate unresolved policy items and must not be generalized beyond existing evidence.

## Decision 2 — Post-return customer state

The stabilized customer lifecycle ends at **Returned** for now.

A recorded rental `ended_at` may support the derived customer message `Your return has been recorded.` It does not establish settlement, inspection completion, final charges, or booking completion.

Do not present `Settlement pending`, `Settled`, `Completed`, completion dates, or finality claims until a Lead-approved canonical source exists.

## Decision 3 — Contact

The replacement frontend will use an **informational Contact experience** unless a verified server-backed delivery contract is separately authorized.

Do not preserve or recreate a form that reports successful delivery without a canonical delivery path. Verified external contact actions such as `mailto:` or `tel:` may be used when their destination data is canonical.

## Decision 4 — Settings and Audit Trail

- **Settings:** exclude from stabilized navigation because no server-backed settings contract exists.
- **Audit Trail:** retain for Owner/Admin because it is an implemented canonical capability.

A functioning-looking Settings surface must not be migrated merely because a legacy route exists.

## Decision 5 — Customers and Profile

Customer-management and profile surfaces may remain only where they use canonical server/auth-backed data.

Do not migrate static, fabricated, local-only, or nonfunctional values/actions into the replacement frontend.

## Decision 6 — Operations Staff

Preserve existing authorization boundaries.

Where Operations Staff can legitimately view a booking or operational record but cannot perform Owner/Admin mutations, render an explanatory read-only experience rather than controls that the server will reject.

Do not broaden mutation permissions as part of frontend stabilization.

## Decision 7 — Public vehicle availability

Do not equate `active` with `available` for a requested period.

Public browse may describe inventory without claiming period availability unless canonical availability/readiness has been evaluated. Finder eligibility may communicate suitability only within the criteria it canonically verifies.

## Finding separation

The following discovery items remain suspected implementation defects or implementation gaps and must not be silently treated as visual-design decisions:

- Operations Staff seeing Owner/Admin booking actions;
- requirements binding only to the newest booking rather than the intended booking;
- public browse presenting active vehicles as available without canonical date/readiness checks;
- fabricated Contact success behavior;
- static/non-canonical Customers, Admin Profile, or Settings data/actions.

These items require normal Finding/triage handling if they remain reproducible during implementation or verification.

## Freeze decision

With the decisions above incorporated into the blueprint, the frontend stabilization baseline is:

**FROZEN FOR VISUAL DESIGN AND IMPLEMENTATION**

This freeze authorizes frontend presentation/interaction implementation under Issue #63 only. It does not authorize schema, domain-rule, authorization, backend-architecture, or production changes outside separately triaged and Lead-approved work.

Future changes to the frozen blueprint require either:

- a reproducible correctness/usability/accessibility defect;
- a verified backend constraint discovered during implementation;
- a Lead-approved domain/manuscript reconciliation;
- or an explicit Lead decision.

Subjective preference alone does not reopen the architecture.
