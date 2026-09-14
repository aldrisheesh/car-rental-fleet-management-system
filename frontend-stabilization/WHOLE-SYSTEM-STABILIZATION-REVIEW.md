# Whole-System Stabilization Review

Date: 2026-09-14
Issue: GitHub #63
Branch: `stabilization/frontend-rebuild`

Verification mode: system-wide stabilization verification only. No application,
test, backend, schema, migration, RBAC, business-rule, deployment, or data
mutation was performed.

## Baseline

- `git fetch origin` completed successfully.
- Checked-out branch: `stabilization/frontend-rebuild`.
- Review-document starting HEAD: `42bbdb8e18bd4e4262d40d6e277c43eac9241bb1`.
- HEAD contains the required Admin Slice 2 final re-review commit.
- Reviewed application implementation remains based on
  `37d5450c36e1409f1a5b99f3d7be60d83fd728d1`; that commit is an ancestor of
  HEAD. The only commit between that implementation HEAD and the review start
  is the Admin Slice 2 documentation commit.
- `origin/main` remained unchanged at
  `faed190d9b78bb845e2c89e7160eda90106f741f` before and after fetch.
- The worktree was clean before this review document was created. No unrelated
  local modifications were present.
- The required acceptance records and implementation/contract references were
  read fully before source tracing.

The review was stopped after the confirmed Finder failure-state defect recorded
below. The remaining sections distinguish preliminary evidence from verification
that was not run after the stop condition.

## Accepted slice status

- Customer Slice 1: **ACCEPTED**.
- Customer Slice 2: **ACCEPTED WITH NON-BLOCKING OBSERVATIONS**.
- Admin Slice 1: **ACCEPTED**.
- Admin Slice 2: **ACCEPTED WITH NON-BLOCKING OBSERVATIONS**.
- Latest accepted Admin Slice 2 final re-review: `42bbdb8e18bd4e4262d40d6e277c43eac9241bb1`.

Carried forward without reopening or changing:

- Decision Support Staff-readable GET APIs versus Owner/Admin-only UI:
  **AUTHORIZATION / ARCHITECTURE CONFLICT**.
- Narrow Fleet disclosure with a nested selection button: finding candidate
  only; no runtime evidence was obtained in this stopped review.
- Existing standalone TypeScript and broader lint/format baseline issues.
- Lack of an approved headed browser runner, as documented by the accepted slice
  records and repository tooling inventory.

## Customer integrated lifecycle

Pre-stop source tracing covered Home/Find a Car, Vehicle Detail, authentication
interruption, Rental Request, Booking Detail, My Bookings, Requirements,
Payment, confirmation waiting, active rental, and return presentation.

The traced identity chain is coherent in the portions inspected:

- Finder criteria are carried in URL search state through `/vehicles`,
  `/vehicles/:vehicleId`, `/booking`, and the authentication continuation.
- Rental Request submission uses the selected vehicle ID and returns the created
  booking ID before navigating to `/bookings/:bookingId`.
- `/bookings/:bookingId` first resolves the exact customer-owned booking by the
  route parameter, requests Requirements and Payment with that same booking ID,
  rejects a mismatched requirement-set binding, and selects Payment by exact
  `payment.booking_id`.
- Authentication `returnTo` is restricted to `/booking` or `/bookings/*` before
  continuation.
- Customer lifecycle derivation keeps Requirements submitted separate from
  Requirements verified, Payment submitted separate from Payment verified,
  Payment verified separate from Booking confirmed, Booking confirmed separate
  from Active Rental, and Rental returned separate from settlement/completion.

This lifecycle result is **not a final integrated pass** because the review
stopped on the Finder failure path before all transitions, reloads, and failure
states could be verified end to end.

## Admin integrated lifecycle

Not completed after the stop condition. The accepted Admin Slice 1 and Slice 2
records remain the current evidence for Dashboard, Bookings, Booking Detail,
Requirements Review, Payment Review, assignment, confirmation, release, return,
Fleet, Maintenance, Branches, Users/Roles, Reports, Decision Support, and Audit
Trail. No new Admin acceptance claim is made here.

## Cross-role handoffs

Not completed after the stop condition. The intended canonical handoffs remain
documented: customer Requirements state maps to the exact Admin requirement set;
Admin review state feeds the customer projection; Admin confirmation/release/
return feeds customer Confirmation/Active Rental/Return Recorded. No live or
fixture data was mutated to exercise these handoffs.

## Exact identity binding

Pre-stop customer source evidence was positive for the inspected boundaries:

- booking detail uses the explicit `bookingId` route parameter;
- requirement reads use `?bookingId=` and reject a mismatched returned set;
- payment selection uses exact `booking_id` equality;
- notification child bindings require exactly one customer-owned child-to-booking
  match and otherwise fall back safely;
- vehicle context uses the rental vehicle ID, then assigned vehicle ID, then
  requested vehicle ID only for presentation fallback, not cross-entity mutation.

The complete cross-role audit for maintenance, branch, fleet, user, forecast,
recommendation, and audit identities was not completed after the stop condition.

## Authentication / authorization

Pre-stop source tracing confirmed that Customer Booking Detail checks the server
session role and redirects non-customers to the Admin workspace or sign-in, and
that the Admin shell and routes retain role-aware access checks. The full
anonymous/customer/staff/Owner-Admin direct-URL, logout, expiration, and API
authorization matrix was not re-run after the stop condition.

The Decision Support Staff-readable GET/API mismatch remains recorded separately
and was not changed.

## Notifications

Pre-stop source tracing found the accepted customer notification binding:
booking notifications use the booking ID directly; Requirements, Payment, and
Rental notifications resolve a booking only through a unique customer-owned
binding; missing, stale, inaccessible, or ambiguous bindings fall back to
`/customer`. Mark-read remains recipient-scoped and idempotent through the
canonical notification API.

The full customer/Admin notification runtime and recipient matrix was not
completed after the stop condition.

## Fleet / Maintenance

Not re-verified after the stop condition. The accepted Admin Slice 2 record
remains the evidence for canonical Fleet state, derived readiness, maintenance
transitions, and branch-preserving vehicle reassignment. No Fleet or Maintenance
mutation was executed.

## Branches

Not re-verified after the stop condition. The accepted Admin Slice 2 record
remains the evidence for exact branch identity, confirmation-protected
deactivation, historical retention, and assigned-vehicle counts.

## Reports

Not re-verified after the stop condition. The accepted Admin Slice 2 record
remains the evidence for canonical operational metrics, Manila date bounds, and
the absence of unsupported revenue/profit/payment totals.

## Decision Support

Not re-verified after the stop condition. Existing accepted evidence remains that
forecasts, supply, vehicle analytics, allocation recommendations, and operational
context are canonical and advisory, with insufficient data distinguished from API
failure. No recommendation, forecast, allocation, or external-context mutation
was executed.

## Decision Support RBAC conflict

Classification: **AUTHORIZATION / ARCHITECTURE CONFLICT**.

The current UI and navigation preserve the stronger Owner/Admin-only Decision
Support boundary, while several Decision Support GET APIs remain Staff-readable.
Operations Staff is redirected away from the Decision Support route and receives
no Decision Support UI or mutation path. This conflict remains unresolved and
was not broadened, narrowed, or silently corrected in this review.

## Audit Trail

Not re-verified after the stop condition. The accepted Admin Slice 2 record
remains the evidence that Audit Trail is Owner/Admin-only, read-only, append-only,
filtered/paginated, and not a fabricated booking-specific feed.

## Error / empty / loading behavior

### Confirmed defect: Finder deep-link failure state is hidden

Classification: **CONFIRMED DEFECT**. Blocking for controlled E2E preparation and
PR/merge-readiness review.

Evidence:

- `src/routes/vehicles.tsx:112` initializes `refinementOpen` to `false`.
- `src/routes/vehicles.tsx:245-254` automatically evaluates complete Finder
  criteria on a reload/deep link with `updateUrl: false`.
- `src/routes/vehicles.tsx:229-237` stores a failed evaluation in
  `finderError`, but does not open the refinement disclosure or set a distinct
  failed-evaluation state.
- `src/routes/vehicles.tsx:582-586` renders the Finder error only inside the
  refinement `<details>`.
- `src/routes/vehicles.tsx:625-708` renders ordinary active-fleet browsing
  whenever `finderResponse` is null. After the failed automatic evaluation,
  the closed disclosure hides the error and the page falls through to the active
  fleet branch.

Impact: a Finder URL/reload can lose the visible Finder failure/recovery state
and present direct active-fleet browsing instead. The page does not make the
failed evaluation visible at the integration boundary, so a customer can proceed
without knowing that the requested evaluated journey failed. This violates the
required explicit Finder-error behavior and the rule that failed requests must
not silently appear as a legitimate successful state.

No fix was made. Verification stopped immediately after this defect was
confirmed. The defect must be triaged and fixed in an authorized follow-up before
controlled E2E data preparation or merge review.

Other failure paths were not reviewed after the stop condition: vehicle API,
booking conflict, Requirements upload, Payment submission, Admin mutations,
branch mutation, maintenance conflict, Reports, Decision Support, and child
notification resolution.

## Responsive verification

Not completed for the integrated application after the stop condition. No live
responsive claim is made. The accepted slice records' static breakpoint evidence
remains unchanged.

## Accessibility

Not completed for the integrated application after the stop condition. The
accepted shared source evidence remains in force for skip links, landmarks,
focus-visible treatment, labels, error summaries, status text, reduced motion,
and touch targets. The Fleet nested `<summary>`/selection-button item remains an
unconfirmed candidate; no headed runtime evidence was obtained here.

The latest Web Interface Guidelines were fetched from
`https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
for this review. No application changes were made from that guidance.

## Security / privacy

Not completed after the stop condition. No private production identifiers were
enumerated, no production data was mutated, and no destructive or privacy-invasive
test was performed. Existing accepted source/test evidence for customer-owned
bookings, signed private document/proof access, server-side role checks, and
storage-path redaction was not reopened.

## Test inventory and results

Test execution was **not started** after the confirmed defect, per the established
stop workflow. Therefore this review establishes no current pass/fail count.

Historical accepted evidence on the reviewed implementation reports the complete
relevant suite, including `scripts/qa/*.test.ts`, at **301 passed, 0 failed**.
That historical count is not presented as a fresh result for this stopped review.

The relevant current inventory is represented by `src/lib/*.test.ts` and
`scripts/qa/*.test.ts`; no synthetic fixture apply, production seed, or data
mutation was run.

## Build / lint / format / typecheck

Not run after the stop condition. Historical accepted evidence remains:

- production build passed;
- scoped rebuilt-surface ESLint and Prettier checks passed;
- `git diff --check` passed at the accepted slice reviews;
- standalone TypeScript diagnostics and broader unchanged-code lint/format
  findings remain existing baseline issues.

No baseline issue was changed.

## Headed browser availability

No approved Playwright/Cypress/Chromium harness was found in the repository
package/tooling inventory. The accepted slice records also document that no
approved headed runner or browser executable was available. No headed browser
verification is claimed for this stopped review.

## Existing relevant findings / conflicts

- Decision Support Staff-readable GET APIs versus Owner/Admin-only route/UI:
  unresolved **authorization/architecture conflict**; preserved.
- Fleet narrow disclosure nested interactive button: unconfirmed finding
  candidate; preserved without classification as a defect.
- Existing standalone TypeScript diagnostics and broader unchanged-code
  lint/format failures: existing baseline issues; not changed.
- Accepted non-blocking manuscript/reference observations remain carried forward
  and were not reopened.

## Findings / observations

1. **Confirmed defect — Finder deep-link/reload evaluation failure is not visibly
   surfaced.** The defect is documented in Error / empty / loading behavior above
   with exact source evidence. It blocks controlled E2E preparation and PR/merge
   readiness review.
2. **Authorization/architecture conflict — Decision Support Staff GET access.**
   Non-blocking for the current approved UI; unresolved and unchanged.
3. **Finding candidate — Fleet disclosure nested button.** No runtime evidence;
   not promoted to a confirmed defect.
4. **Observation — headed verification unavailable.** No live responsive or
   assistive-technology claim is made.
5. **Existing baseline issue — TypeScript/lint/format diagnostics.** Not
   introduced or modified by this review.

## Controlled E2E readiness

**NOT READY — FIXES REQUIRED**

The confirmed Finder failure-state defect must be fixed and re-verified before
controlled end-to-end data preparation can begin. This review did not create,
seed, apply, or mutate any mock-defense dataset.

## PR / merge-review readiness

**NOT READY**

The confirmed integration defect blocks PR/merge-readiness review. No merge,
deployment, or push to `main` was performed.

## Overall stabilization result

**NOT READY — CONFIRMED DEFECT FOUND; VERIFICATION STOPPED.**

The accepted slices were not silently changed. The sole new confirmed defect was
recorded, no automatic fix was applied, and no synthetic production history or
mock-defense data was created.
