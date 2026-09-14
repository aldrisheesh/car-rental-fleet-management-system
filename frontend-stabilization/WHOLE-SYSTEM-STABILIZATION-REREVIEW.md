# Whole-System Stabilization Re-review

## Baseline

Review scope: full integrated application re-review for GitHub Issue #63 on
`stabilization/frontend-rebuild`.

- Reviewed application HEAD: `db0ace391d94e8ab31fbe1325f52fbd9681fea67`
  (`fix: surface Finder evaluation failures`).
- `origin/stabilization/frontend-rebuild` matched the reviewed HEAD at
  pre-flight.
- `origin/main` remained `faed190d9b78bb845e2c89e7160eda90106f741f`, unchanged
  from the prior whole-system review record.
- The working tree was clean, with no unrelated modifications.
- The required prior whole-system, accepted-slice, backend-contract, and
  capability-migration records were read before verification.
- This review made no application, test, backend, schema, RBAC, production,
  or fixture/data changes. No synthetic data was created and no mutation
  workflow was executed.

## Finder regression

**Pass.** The previously confirmed Finder integration defect is resolved in the
reviewed HEAD.

- Complete criteria with a successful automatic evaluation render canonical
  evaluated results.
- A failed automatic evaluation now has an explicit failed-evaluation state,
  a prominent visible error, preserved Finder criteria, `Try again`, and
  `Change trip` recovery controls. It does not fall through to active-fleet
  direct browse.
- Retry reuses the preserved criteria; a successful retry returns to evaluated
  results.
- Refinement submits updated criteria and re-evaluates them.
- `/vehicles` without complete evaluated criteria remains canonical direct
  browse.
- URL-derived evaluation, direct browse, and history behavior remain distinct
  in the route state model. The source/test evidence covers reload and URL
  state; no headed browser claim is made below.
- The Finder API route and server algorithm were not changed by the fix. The
  reviewed commit changes presentation state, route handling, and tests only.

Focused Finder verification passed: **42 passed, 0 failed**.

## Accepted slice status

The accepted baseline remains unchanged:

- Customer Slice 1: **ACCEPTED**.
- Customer Slice 2: **ACCEPTED WITH NON-BLOCKING OBSERVATIONS**.
- Admin Slice 1: **ACCEPTED**.
- Admin Slice 2: **ACCEPTED WITH NON-BLOCKING OBSERVATIONS**.

The prior confirmed Finder defect is re-verified as fixed. Closed findings were
not reopened without contrary evidence.

## Customer lifecycle

**Pass.** The integrated customer journey is bound to explicit canonical
identifiers and canonical backend state:

`Home -> Find a Car -> Vehicle Detail -> Authentication interruption -> Rental
Request -> Requirements -> Payment -> Confirmation -> Active Rental -> Return
Recorded`.

- Vehicle identity is preserved from Finder/detail/booking through assigned
  vehicle, rental vehicle, and return; fallback is limited to matching
  canonical vehicle IDs.
- Pickup and return dates are carried in the booking payload and rendered from
  the exact booking record.
- Finder criteria/provenance are preserved through the booking handoff when
  they still match the selected vehicle and dates.
- Authentication interruption preserves a safe `returnTo` and the booking
  draft; direct protected booking routes retain their exact booking ID.
- Booking detail loads the exact route `bookingId`; it does not substitute a
  first, newest, or global booking.
- Requirements are read and submitted by the exact booking and requirement-set
  binding. Payment is read and submitted by the exact booking/payment binding.
- Customer lifecycle actions and waiting states are derived from requirements,
  payment, booking, and rental state; they do not infer success from a form
  submission alone.
- Confirmation, active rental, and returned views are distinct and remain
  safe on reload/deep link.
- Customer notification links resolve exact booking ownership, including
  requirement-set, payment, and rental child bindings.

## Admin lifecycle

**Pass.** The Admin journey uses the same canonical entities as the customer
journey:

`Dashboard -> Bookings -> Booking Detail -> Requirements Review -> Payment
Review -> Assignment -> Confirmation -> Rental Release -> Return`.

- Bookings and booking detail use exact booking IDs.
- Requirement review uses the exact requirement-set ID and verifies its
  `booking_id` before presenting or mutating review state.
- Payment review uses the exact payment ID, current proof version, and exact
  booking association; ambiguous or mismatched context is not substituted.
- Assignment and confirmation use explicit booking/vehicle IDs and expected
  snapshots.
- Rental release and return use explicit rental, booking, vehicle, and timing
  snapshots. The server-side RPCs enforce the same bindings and role rules.
- Staff receives the approved read-only booking workspace and no lifecycle
  mutation controls. Owner/Admin receives the supported management surfaces.
- Admin lifecycle labels and customer lifecycle labels represent the same
  canonical states: Submitted, Confirmed, active rental, returned, and the
  requirements/payment review states.

## Cross-role handoffs

**Pass.** Cross-role propagation is exact and booking-scoped:

- Customer requirements submission creates/updates the exact requirement set
  for the exact booking; the Admin queue and review page use that same set and
  booking, and the customer sees the exact resulting review state.
- Customer payment submission creates/updates the exact payment and proof for
  the exact booking; Admin review uses that payment ID, and customer state
  reflects Pending Verification, Needs Resubmission, or Verified.
- Admin assignment/confirmation updates the exact booking and vehicle; the
  customer reads that exact booking state.
- Admin release creates the rental for the exact booking/customer/vehicle; the
  customer reads the matching active rental.
- Admin return ends the exact rental with the exact booking/vehicle context;
  the customer reads the resulting returned state.

No cross-booking handoff path was found.

## Exact identity binding

**Pass.** The integrated audit covered booking, requirement set, payment,
vehicle, rental, branch, maintenance record, user, forecast, recommendation,
and audit entity handling.

Reviewed mutation and binding paths use explicit canonical IDs. No supported
mutation used a first-record, newest-record, selected-first, implicit-current,
global-payment, global-requirement, or ambiguous child-parent fallback.

Intentional latest-record reads are scoped to their canonical parent/context,
such as the latest persisted forecast run, latest supply evaluation for an
exact forecast, current requirement review, or display-only initial selection.
Those reads are not used as implicit mutation identity.

## Authentication / authorization

**Pass, with the carried Decision Support architecture conflict documented
below.**

- Anonymous users are redirected through the supported sign-in flow, with safe
  same-origin `returnTo` handling for protected customer routes.
- Customer/Renter users can access only their own customer data and are denied
  Admin workspace and Admin-only APIs/actions.
- Operations Staff receives only the approved Dashboard, Bookings, Calendar,
  Notifications, and Reports workspace. Staff lifecycle, review, Fleet,
  Maintenance, Branches, Users/Roles, Decision Support UI, Audit Trail, and
  Owner/Admin mutation actions are not permitted.
- Owner/Admin receives the supported management and evidence surfaces.
- Logout/session expiration and inactive-session handling return through the
  server-authenticated route boundary.
- Server-side role and ownership checks exist in addition to frontend route
  hiding. Reviewed mutation endpoints require Owner/Admin where the backend
  contract requires it.

## Notifications

**Pass.** Customer notifications are recipient-scoped and map child entities
back to an exact customer-owned booking:

- Booking notifications use the exact booking ID.
- Requirement notifications require an exact requirement-set-to-booking
  binding.
- Payment notifications require an exact payment-to-booking binding.
- Rental notifications require an exact rental-to-booking binding.
- Missing, stale, or ambiguous child bindings fall back safely to the customer
  notification surface; a child ID is never treated directly as a booking ID.
- Mark-read updates require the exact notification ID and recipient identity;
  failures remain visible.
- Admin notification behavior was reviewed only for implemented routes and
  preserves supported operational destinations.

## Fleet / Maintenance

**Pass.** Fleet and Maintenance remain canonical and ID-bound:

- Branch reassignment preserves canonical vehicle fields, including odometer,
  condition-blocking state, fuel metadata, image, category, rate, and active
  state.
- Fleet status/readiness is derived from inactive state, rental state,
  maintenance readiness, and confirmed reservation state. No persisted `Ready`
  field is written.
- Condition-blocking and active maintenance records continue to block derived
  readiness as specified.
- Maintenance transitions use the exact vehicle and maintenance record IDs;
  active-rental conflicts are surfaced.
- The maintenance state remains canonical rather than being inferred from a
  presentation-only selection.

## Branches

**Pass.** Branch surfaces use exact branch identity and canonical relationships:

- Assigned vehicle counts are derived from exact `branch_id` values.
- Booking branch selection uses the selected branch ID and server validation.
- Fleet branch reassignment is integrated with preserved vehicle fields.
- Deactivation requires an explicit confirmation for the exact branch.
- Historical records are retained; no branch deletion path was found.

## Reports

**Pass.** Reports remain operational and consistent with the report API
contract.

- The UI exposes canonical booking, rental, vehicle, maintenance, utilization,
  branch, and category data only.
- It does not invent revenue, profit, payment totals, unsupported utilization,
  branch ranking, demand forecast, or export behavior.
- Unavailable utilization/data is represented as unavailable rather than zero.
- API failure is rendered as an error/retry state, not as a successful empty or
  zero-valued report.
- Date and branch filters remain bounded by the backend report contract.

## Decision Support

**Pass for the supported Owner/Admin surface.** Decision Support remains:

- advisory and explicitly non-autonomous;
- based on canonical forecast, supply-evaluation, analytics, recommendation,
  and operational-context records;
- uncertainty-forward, with insufficient history/data distinguished from API
  failure;
- free of unsupported AI/ML claims, fabricated confidence, guaranteed
  predictions, or autonomous allocation execution;
- consistent with Fleet, Maintenance, and booking state.

## Decision Support RBAC conflict

**Unresolved authorization/architecture conflict; carried forward unchanged.**

The UI, route, and navigation exclude Operations Staff from Decision Support,
while several read-only Decision Support GET APIs permit Staff. Decision
generation, allocation decisions, and operational-context mutations remain
Owner/Admin-only. RBAC was not changed.

Materiality assessment:

- **Controlled E2E:** does not materially block the current approved E2E
  workflow. The supported Staff UI does not expose the route, and the current
  customer/Owner/Admin flows do not depend on Staff Decision Support access.
  A future Staff Decision Support E2E would require the policy to be settled
  first.
- **PR/merge review:** does not materially block review of the current
  supported UI because the route boundary and mutation boundary are coherent
  and server-side protections remain present. It remains a required
  non-blocking architecture observation and must not be silently resolved.
- **Release readiness:** does not materially block the currently supported
  surfaces, but remains a release-policy caveat because API readability is
  broader than the approved UI exposure. It should be resolved before any
  Staff Decision Support UI or contract expansion.

## Audit Trail

**Pass.** Audit integration is canonical for currently persisted actions:

- actor, action, domain/entity, timestamp, and structured details are shown;
- booking, requirements, payment, rental, and maintenance lifecycle events
  use the canonical audit records;
- filtering and pagination are explicit;
- the UI is read-only and Owner/Admin-only;
- source failure is distinct from an empty audit result;
- no fabricated booking-specific history or notification/intelligence history
  was added.

## Error / failure behavior

**Pass for reviewed representative paths.** Failure is not presented as
legitimate success or as an unexplained empty state:

- Finder failure is visible and keeps recovery/refinement controls.
- Vehicle loading failure is surfaced separately from a valid empty fleet.
- Booking conflicts and server validation failures remain actionable errors.
- Requirements upload/submit failures remain visible and do not advance the
  lifecycle.
- Payment submission failures remain visible and do not imply verification or
  confirmation.
- Admin, branch, and maintenance mutation failures remain visible; maintenance
  conflicts are not converted to readiness success.
- Reports API failure is distinct from no report rows.
- Decision Support insufficient data is distinct from Decision Support API
  failure.
- Notification child-binding failure falls back safely without guessing a
  booking.

## Loading / empty states

**Pass by source verification.** Key customer and Admin surfaces distinguish
LOADING, EMPTY, and ERROR. Explicit loading indicators, empty-state copy,
retry/error callouts, and safe unavailable states are present for the reviewed
list, detail, review, notification, report, audit, Fleet, Maintenance, and
Decision Support surfaces. Child request failures do not silently become a
successful empty booking or review context.

## Responsive verification

**Static/source verification only; no headed claim.**

- Customer source and responsive rules cover the requested 1440, 1024, 768,
  and 375-width layouts through the established desktop/tablet/mobile
  breakpoints and compact navigation/detail behavior.
- Admin source and responsive rules cover the requested 1440, 1024, and
  768-width layouts through the approved dense table/disclosure and mobile
  navigation patterns.
- No pixel-level or live headed-browser result is claimed because an approved
  repository browser workflow was unavailable.

## Accessibility

**Static/source pass with one carried finding candidate.**

Reviewed evidence includes skip links, landmarks, heading structure, visible
focus styles, keyboard-capable navigation and dialogs, labeled controls and
file inputs, accessible error/status announcements, associated field errors,
non-color-only state text/icons, touch-sized controls, and reduced-motion
handling. Radix dialogs/alert dialogs provide modal semantics and focus
return.

The Fleet narrow disclosure still contains a native `<summary>` with a nested
selection `<button>` (`src/routes/admin.fleet.tsx`, prior candidate around
lines 637-651). This remains an **unconfirmed finding candidate**, not a
confirmed defect, because no headed accessibility/runtime evidence was
available. It should be checked in a future approved browser pass.

## Security / privacy

**Pass for safe source/test review.**

- Customer booking, requirement, payment, proof, and rental reads enforce
  customer ownership and exact IDs.
- Private requirement documents and payment proofs are accessed through
  ownership-checked signed URLs; raw private storage paths are not exposed in
  customer projections.
- Customer access to another customer's booking is denied.
- `returnTo` handling is constrained to safe same-origin application paths.
- Customer and Staff callers are denied Owner/Admin-only mutations server-side.
- No private production IDs were enumerated, no production data was seeded or
  mutated, and no mock-defense data was created.

## Tests

The current relevant automated inventory was discovered from `src/lib` and
`scripts/qa` rather than using the historical count:

- Test files discovered: **50**.
- Test cases discovered: **305**.
- Passed: **305**.
- Failed: **0**.
- Skipped/cancelled: **0**.

The inventory covered the current source/lib and QA tests for authentication,
Finder, bookings, requirements, payment, rental/lifecycle, notifications,
Admin authorization, Fleet, Maintenance, Branches, Users/Roles, Reports,
Decision Support, Audit Trail, and non-mutating fixture-safety behavior. No
fixture apply or production mutation command was run.

## Build / lint / format / typecheck

- Scoped ESLint for the rebuilt source/test surface: **pass**.
- Scoped Prettier check for the rebuilt source/test surface: **pass**.
- Production build (`npm run build`): **pass**. Existing bundler/deprecation
  warnings were emitted, but no build failure occurred.
- `git diff --check`: **pass**.
- Standalone `tsc --noEmit`: **15 existing baseline diagnostics**, all in
  pre-existing/unchanged typed Supabase, operational-context,
  maintenance-readiness, notifications, and audit API/test code. No reviewed
  application HEAD change introduced a new typecheck diagnostic.
- Broader repository ESLint: **1253 errors and 6 warnings across 69 files**;
  broader repository Prettier: **164 files** reported. These are existing
  baseline diagnostics outside the scoped rebuilt-surface pass and were not
  modified.

The standalone/broader baseline diagnostics remain non-blocking for the
reviewed rebuild surface, production build, and current controlled workflow;
they are not silently reclassified as clean full-repository checks.

## Headed browser availability

No repository-configured or approved Playwright/Cypress headed verification
workflow was available. The project has no local Playwright/browser runner in
its installed dependency/bin inventory, and the accepted slice records already
document the absence of an approved headed runner. User-level npx/cache
artifacts were not used to claim application verification. Accordingly, no
headed 1440/1024/768/375 workflow, pixel comparison, or assistive-technology
runtime claim is made.

## Existing findings / conflicts

The following remain relevant and are carried forward without unauthorized
changes:

1. Decision Support Staff-readable GET APIs versus the Owner/Admin-only route
   and navigation: unresolved authorization/architecture conflict, non-blocking
   for the current approved UI, assessed above for controlled E2E, PR/merge,
   and release readiness.
2. Fleet narrow disclosure nested interactive button: unconfirmed finding
   candidate pending headed accessibility evidence.
3. Existing standalone TypeScript and broader lint/format diagnostics:
   baseline issues outside the reviewed rebuilt surface.
4. Accepted manuscript/reference mismatches and non-blocking slice
   observations: carried forward; no closed finding was restarted.

## Findings / observations

- **Confirmed defects found in this re-review: none.**
- The prior confirmed Finder failure-state defect is fixed and focused Finder
  tests pass.
- The Decision Support authorization/architecture conflict remains unresolved
  but is non-blocking for the current approved UI and is not to be silently
  changed.
- The Fleet nested-interactive control remains a finding candidate only.
- Browser unavailability and baseline diagnostics are recorded observations,
  not newly introduced application defects.

## Controlled E2E readiness

**READY WITH NON-BLOCKING OBSERVATIONS.**

The prior Finder blocker is resolved; the current relevant automated suite and
scoped rebuilt-surface checks pass; and no confirmed cross-role, identity,
authorization, lifecycle, failure-state, or privacy defect remains. Controlled
synthetic data may be prepared/used only through the separately approved
workflow. The carried Decision Support conflict, Fleet accessibility
candidate, baseline diagnostics, and lack of an approved headed browser remain
documented observations.

This does not authorize production data mutation, merge, deployment, or release.

## PR / merge-review readiness

**READY WITH NON-BLOCKING OBSERVATIONS.**

The reviewed application HEAD is suitable for PR/merge review, subject to the
documented Decision Support architecture conflict, existing baseline
diagnostics, Fleet accessibility candidate, and lack of headed runtime
evidence. No merge was performed or authorized by this review.

## Overall result

**READY WITH NON-BLOCKING OBSERVATIONS.** The full stabilization re-review
found no new confirmed defect. Finder regression behavior is corrected and
re-verified; customer/Admin lifecycle identity and state propagation are
canonical; authorization, notifications, Fleet/Maintenance, Branches,
Reports, Decision Support, Audit, failure handling, and privacy checks pass by
source/test evidence. The remaining items are explicitly carried-forward
observations and the unresolved Decision Support authorization/architecture
conflict; no source/test/RBAC/backend/data change was made.
