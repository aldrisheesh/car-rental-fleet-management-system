# Customer Slice 2 Re-review

Date: 2026-09-14

Issue: GitHub #63

Branch: `stabilization/frontend-rebuild`

Review mode: verification only. No application source, backend, schema, business rule, Admin surface, deployment, merge, or redesign change was made.

## Commits reviewed

- Customer Slice 1 acceptance: `cca6b1c7094f6cc141d3ae57c90cf760186ccfef`
- Customer Slice 2 implementation: `56c73c7f7491b95d687c791bfb34113046112c6c`
- First Slice 2 review: `c251c4398beb23a484f19a2493077a29b10eda32`
- Notification deep-link fix: `928c0d11f8d8851db60505a1beff306711987a38`
- Re-review HEAD at start: `928c0d11f8d8851db60505a1beff306711987a38`
- `origin/main` at review: `faed190d9b78bb845e2c89e7160eda90106f741f`

The required Slice 2 review, Slice 1 final verification, Direction E design system, and customer implementation reference documents were read before verification. `git fetch origin` completed successfully; the requested branch, HEAD, remote tracking ref, clean worktree, and unchanged recorded `origin/main` were verified.

## Notification defect regression

Result: PASS.

The prior confirmed defect is corrected and the regression suite passed 9/9 notification tests.

- Booking notifications use the booking entity ID directly through the encoded booking route.
- Payment, Requirements, and Rental notifications resolve their child ID only through a unique customer-owned binding to the canonical `booking_id`.
- Missing, stale, inaccessible, or ambiguous child bindings fall back to `/customer`.
- A child entity ID is never used directly as a booking ID.
- An inaccessible direct booking route is rejected by the exact customer booking read and renders a safe not-found message without opening requirement or payment context.
- Recipient scoping remains principal-scoped in the notification API, and mark-read behavior was unchanged.

Relevant implementation: `src/lib/notifications.ts`, `src/routes/customer.tsx`, `src/routes/bookings.$bookingId.tsx`, and `src/components/notifications/NotificationsPanel.tsx`. The route behavior is covered by `src/lib/notifications.test.ts`.

## Exact booking binding

Result: PASS.

My Bookings composes Requirements and Payment with `booking.id` query parameters. Payment selection uses `paymentForBooking(bookingId, payments)` and matches `payment.booking_id` exactly. Notification bindings validate `requirementSet.booking_id`, `payment.booking_id`, and `rental.booking_id` against the same booking before routing.

The booking detail route first finds the exact customer-owned booking by route `bookingId`, then reads Requirements and Payment with that same identity. A mismatched requirement set is treated as unavailable, and Payment is selected by exact `booking_id`.

Search found no first-booking, newest-booking, first-payment, global-current-payment, or implicit-booking fallback in the reviewed customer lifecycle composition. No cross-booking binding path was demonstrated.

## My Bookings

Result: PASS.

`/customer` uses the canonical customer booking collection, composes exact per-booking Requirements and Payment reads, and keeps the API’s newest-first ordering. Each record communicates the vehicle or truthful unavailable fallback, rental schedule, pickup branch, current lifecycle label, action-versus-waiting state, and one contextual record action. Action-required records use a primary action; waiting and completed-lifecycle records use ordinary detail navigation.

The accepted My Bookings reference composition is preserved: heading and attention area, All bookings controls, image-first records, status treatment, and restrained Direction E hierarchy. No unsupported customer lifecycle label (`Ready`, `Completed`, `Settled`, or `Fully paid`) is used as a state. The only `ready` wording found is an explicit non-claim about scheduled pickup and a Finder rationale mapping.

## Payment gating

Result: PASS.

Payment becomes actionable only when the Requirements status is exactly `Verified`:

- `Not Submitted`: Requirements action; payment is locked.
- `Pending Review`: requirements waiting state; no action needed; payment remains locked.
- `Needs Resubmission`: Requirements action; payment remains locked.
- `Verified`: Payment may become available.

The server submission path independently enforces the same `Verified`-only gate through `isPaymentEligibleRequirementStatus`. Documents being present alone do not unlock payment.

## Payment amount handling

Result: PASS.

The customer UI reads only the supplied canonical `payment.required_amount`. When it is null or invalid, no peso amount is displayed and no client-side 50% or vehicle-rate-by-days calculation is performed. The 50% policy is stated without inventing a peso value. When a canonical amount is present, only that supplied amount is formatted and shown.

## Payment submission / review / resubmission

Result: PASS.

Submission uses only the canonical booking identity, payment method, submitted amount, transaction reference, and proof file. `fetchJson` preserves the browser-generated multipart boundary for `FormData`; the server applies the canonical MIME, extension, size, and signature validation before invoking the atomic payment-proof submission RPC. There is no auto-verification, gateway claim, or immediate confirmation claim.

Pending Verification presents `No action needed — payment is under review.`, read-only submitted details, and an optional current-proof viewer. It has no duplicate payment CTA and does not claim booking confirmation.

Needs Resubmission is clearly action-required, displays only the customer-facing resubmission reason from the customer projection, uses the canonical payment submission endpoint, and does not expose an old proof URL. The current proof is the only proof projected for the waiting view.

## Confirmation

Result: PASS.

The standalone confirmed state is derived from canonical `booking.booking_status === "Confirmed"`. Verified payment, assigned vehicle, or verified Requirements alone produce a waiting state and do not claim confirmation. The rental release and return server transitions are also Confirmed-gated, supporting the active and returned canonical states.

## Active rental

Result: PASS.

Active Rental is derived only by `started_at != null && ended_at == null`. The customer view exposes scheduled return, actual start, assigned vehicle, and safe trip facts. It provides no GPS, live tracking, extension controls, emergency tooling, or Ready state.

## Return recorded

Result: PASS.

Any canonical `ended_at != null` rental maps to `Return recorded` / `Rental ended`. The view shows actual return and trip facts and explicitly avoids `Completed`, `Settled`, `Fully paid`, and final-charge-complete claims.

## Payment-details redirect

Result: PASS.

`/payment-details` reads only the explicit `bookingId` query value and replaces the route with the exact `/bookings/:bookingId` route. It has no first/newest booking fallback and no open redirect mechanism. Missing identity renders a safe explanation and a My Bookings link. Invalid or inaccessible identity is handled by the exact booking route’s customer-scoped not-found path.

## Visual fidelity

Result: PASS by accepted-reference and source comparison; no live rendered pixel result is claimed.

The accepted My Bookings, Payment Action desktop/mobile, Payment Waiting, Confirmed, Active Rental, and Returned references were inspected. The implementation preserves the Direction E decisions visible in those references:

- Instrument Sans for interface copy and Newsreader for customer lifecycle headings.
- Rice Paper / Evergreen / Road Ink / orange action accents and restrained status tones.
- Image-first booking records and a single clear action/waiting surface.
- Six-stage lifecycle rail with complete/current/locked treatment.
- Action-required, waiting, success, and locked panels with explicit text rather than color-only status.
- Payment policy, form, review expectation, confirmation separation, rental facts, and return facts in the reference order.
- No generic SaaS dashboard drift in the reviewed customer lifecycle surfaces.

## Responsive verification

Result: static responsive source verification PASS; headed browser verification was unavailable.

The CSS composition was checked for the required widths:

- 1440: four-column My Bookings records, horizontal six-stage rail, two-column booking detail with sticky summary.
- 1024: reduced-width four-column records and tighter detail gap without the mobile collapse.
- 768: two-column records, three-column lifecycle grid, and one-column detail with the summary after the primary task.
- 375: compact two-column record identity, full-width actions, two-column lifecycle grid, stacked facts and form actions, and primary content before the summary.

No configured Playwright/Chromium runner, browser executable, or approved headed browser harness was present in the workspace. Therefore no headed verification is claimed for My Bookings, Payment Action, Payment Waiting, Confirmed, Active Rental, Return recorded, or notification deep links.

## Accessibility

Result: source inspection PASS with one non-blocking observation; no assistive-technology/browser result is claimed.

Verified in source:

- Skip link, header/navigation, main landmarks, footer, semantic headings, ordered lifecycle list, and `aria-current="step"` for the active lifecycle stage.
- My Bookings navigation exposes `aria-current="page"` on customer and booking-detail paths.
- Persistent form labels, fieldsets/legends, named controls, file inputs, visible focus styles, and touch targets at or above the project’s 44px baseline.
- Error summary focus after validation, linked inline errors for text/select controls, alert/status messaging, and polite loading/redirect status messages.
- Status meaning is communicated with text and icons, not color alone.
- Reduced-motion CSS disables smooth scrolling and reduces transition/animation duration.
- Mobile CSS moves the primary task before the summary and uses one-column form/action composition.

Non-blocking observation: the shared `FileTarget` exposes a labelled native file input and visible `role="alert"` errors, but does not add `aria-invalid` or `aria-describedby` to associate the file input directly with its inline error. This remains an accessibility observation, not a confirmed Slice 2 defect; headed/assistive-technology verification was unavailable.

## Slice 1 regression

Result: PASS for the requested spot-check scope.

The Slice 1 final verification was read and the current source/test boundary was spot-checked for Home, Finder, Vehicle Detail, auth continuation, Rental Request, Requirements, My Bookings navigation state, and Operations Staff Header behavior. Slice 2 adds lifecycle primitives and file-input naming to shared customer primitives; it does not alter the Slice 1 route implementations or Operations Staff header behavior. The current Slice 1 regression suite passed 65/65 tests, including auth, booking reads/retrieval/idempotency, customer navigation, Finder booking/presentation/vehicle-finder, master data, rental projection, and Requirements access/validation coverage.

## Tests/build

- Slice 2 lifecycle/payment/booking-read/Requirements/notification/rental-reminder/transactional-email scope: **64 passed, 0 failed**.
- Auth checks: **10 passed, 0 failed**.
- Slice 1 regression scope: **65 passed, 0 failed**.
- Scoped ESLint on the Slice 2 changed implementation files: **passed**.
- Scoped Prettier check on the Slice 2 changed implementation files: **passed**.
- `npm run build`: **passed**. Existing dependency `"use client"` bundler warnings were emitted.
- `git diff --check`: **passed**.
- Repository-wide `npm run lint`: **failed as an existing out-of-scope baseline** with 1,342 problems (1,335 errors and 7 warnings), overwhelmingly repository-wide Prettier violations. The reviewed Slice 2 changed-file lint scope passed independently; no baseline issue was fixed.

## Findings / observations

| Classification                    | Result                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirmed defect                  | None found in the re-review scope. The prior notification defect is fixed and its regression tests pass.                                                                                                                                                                                                                                    |
| Observation                       | Headed Chromium/Playwright verification could not be performed because no approved runner or browser executable is available in the workspace.                                                                                                                                                                                              |
| Observation                       | The shared file-input error association should be strengthened with direct invalid/description semantics; this was not confirmed through assistive technology.                                                                                                                                                                              |
| Existing unrelated baseline issue | Repository-wide lint remains at 1,342 problems outside the reviewed changed-file scope.                                                                                                                                                                                                                                                     |
| Existing unrelated baseline issue | Pre-existing transactional email templates use coarse `/payment-details` or `/customer` links without booking identity. The in-app notification regression requested by this review is exact and safe; `/payment-details` itself fails safely without identity. No email-template source was changed or classified as a new Slice 2 defect. |

No finding candidate was promoted to a confirmed defect. No application source or unrelated baseline issue was changed.

## Review result

**SLICE 2 ACCEPTED WITH NON-BLOCKING OBSERVATIONS**
