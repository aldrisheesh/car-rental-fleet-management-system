# Controlled E2E Execution — Lead-Designated QA Accounts

## Lead authorization

The Customer account was Lead-designated for local QA E2E use and was NOT
claimed to be fixture-owned. The Owner/Admin account was likewise used as the
Lead-designated local QA Admin identity. The superseding Lead decision was
applied; the fixture-ownership gate was not rerun.

Credentials were used only for authentication. Credential values, email
addresses, cookies, tokens, signed URLs, and Auth identifiers are not recorded
here.

## Target

- Repository: `https://github.com/aldrisheesh/car-rental-fleet-management-system`
- Branch: `stabilization/frontend-rebuild`
- Target: configured local non-production QA environment (`QA_FIXTURE_TARGET=local`), accessed through the local application server.
- Execution date: 2026-09-15, Asia/Manila.
- Starting HEAD: `4891ca3ab2b7048f93387caf8099e2e140f463c4` (`docs: verify controlled e2e identity`).
- `origin/main` at preflight: `faed190d9b78bb845e2c89e7160eda90106f741f`; unchanged during execution.
- The worktree was clean at preflight. No production, staging, deployment, merge, or main-branch operation was used.

## Authentication

- Customer authentication succeeded: role `Customer/Renter`, status `Active`.
- Customer access to `/api/admin-dashboard` was denied with HTTP 403.
- Owner/Admin authentication succeeded: role `Owner/Admin`, status `Active`.
- Owner/Admin workspace access succeeded with HTTP 200.
- No Auth account, password, role, profile, or protected metadata was changed.

## Preflight

- `git fetch origin` completed successfully before execution.
- HEAD contained the authorized identity-verification commit.
- Local application health returned HTTP 200 with the QA database connected.
- Canonical active branches used for the scenario were `Taft, Manila` and
  `Antipolo, Rizal`. An existing active `VS003 Temp 1788110993` branch was
  observed read-only and was not used or changed.
- Active vehicle inventory contained 12 vehicles. `DEV-WIGO-001` was active,
  maintenance-ready, free of an active rental, and eligible for the selected
  period.
- The active demo payment method was `demo-bank-transfer` / `Demo bank/e-wallet`.
- Existing QA data was used as-is. No fixture apply, fixture cleanup, direct
  database edit, or ownership metadata check was used.

## Selected scenario

- Vehicle: Toyota Wigo, plate `DEV-WIGO-001`, vehicle ID
  `9ab3550e-0ade-48cf-b699-0e19f6d7a68b`.
- Category: `Economy`; branch: `Taft, Manila`.
- Manila-local rental period: 2026-09-16 09:00 through 2026-09-18 09:00.
- Persisted UTC period: `2026-09-16T01:00:00+00:00` through
  `2026-09-18T01:00:00+00:00`.
- Synthetic Finder criteria: 2 passengers, `Economy`, maximum base-rental
  budget PHP 2,000, destination `Synthetic QA Manila route`.
- The Finder estimated two rental days and PHP 2,000 base rental. This amount
  is a Finder budget/result, not a payment or settlement claim.

## Finder

- Customer `POST /api/vehicle-finder` succeeded with HTTP 200.
- Canonical criteria were `2026-09-16T01:00:00.000Z` through
  `2026-09-18T01:00:00.000Z`, 2 passengers, PHP 2,000 maximum budget, and
  `Economy` preference.
- One recommendation was returned. Toyota Wigo / `DEV-WIGO-001` was rank 1
  with reasons covering date availability, passenger capacity, budget,
  maintenance readiness, and the Economy preference.
- The result was revalidated immediately before booking creation and again
  before assignment/release. No Finder bypass or direct insertion was used.

## Rental Request

- Customer-created booking ID: `78e566c2-d503-4cc4-a1e4-7a03fb053081`.
- Canonical create response: HTTP 201; initial status `Submitted`.
- Customer and Owner/Admin projections both showed `Submitted`.
- Requested vehicle, pickup branch, return branch, dates, passenger count,
  purpose, destination, and pickup service method matched the Finder handoff.
- Finder context was immutably bound to the booking with baseline `VS017`,
  selected vehicle ID `9ab3550e-0ade-48cf-b699-0e19f6d7a68b`, rank 1, and the
  exact requested period.
- A UUID idempotency key was used; its value is omitted because it is not
  needed as evidence.

## Requirements

- Requirement-set ID: `9b3af45e-04c0-4c5d-977c-3a1f4ee8d32e`.
- Customer initialized the exact set, uploaded both canonical required types,
  and submitted the set. Result: `Pending Review`.
- Current synthetic QA documents only:
  - `Valid Government ID`: document ID
    `f73ed9d9-de82-4473-bf6c-ce51349ad784`, version 1, PDF, 97 bytes,
    `QA-SYNTHETIC-GOVERNMENT-ID-NOT-A-REAL-DOCUMENT.pdf`.
  - `Driver's License`: document ID
    `9afd05fb-1fba-4fc4-8014-837d45ee4364`, version 1, PDF, 94 bytes,
    `QA-SYNTHETIC-DRIVERS-LICENSE-NOT-A-REAL-DOCUMENT.pdf`.
- Both documents were current and bound to the exact booking and requirement
  set. No real identity document, government ID, driver's license, or personal
  document was uploaded or retained in this evidence.

## Requirements Review

- Owner/Admin opened the exact requirement set and both current documents by
  their returned IDs.
- Review ID: `6ac9e1e4-f96d-4038-a35a-7e33a638c9ae`.
- Canonical outcomes: Government ID `Accepted`, Driver's License `Accepted`,
  identity `Consistent`, LTO `Clear`.
- Result: `Pending Review` -> `Verified`.
- Customer subsequently observed the exact set as `Verified`.
- The optional resubmission path was not run.

## Payment

- Customer payment submission was enabled only after Requirements were
  `Verified`.
- Payment ID: `79d40048-a678-4c4b-8eb6-8a2f74099b35`.
- Active demo method: `demo-bank-transfer` / `Demo bank/e-wallet`.
- `required_amount` was `null`; the controlled contract exercise used PHP 1.00.
  This is not described as 50%, fully paid, settled, or a real payment.
- A synthetic transaction-reference marker was submitted; its value is not
  recorded here.
- Payment proof ID: `c01e14dc-306e-470b-a054-ad117e21ee0d`, current version 1,
  PDF, 91 bytes,
  `QA-SYNTHETIC-PAYMENT-PROOF-NOT-A-REAL-ARTIFACT.pdf`.
- Initial payment result: `Pending Verification`. Payment and proof were
  bound to the exact booking; no second payment was created.

## Payment Review

- Owner/Admin opened the exact payment and current proof and performed the
  canonical `verify` action with proof version 1 and the persisted snapshot.
- Result: `Pending Verification` -> `Verified`.
- Customer subsequently observed the exact payment as `Verified`.
- Payment/proof/booking binding remained exact. Payment resubmission was not
  run.

## Assignment

- Owner/Admin revalidated the exact booking, `Verified` requirements,
  `Verified` payment, Wigo maintenance readiness, active-rental absence, and
  confirmed-booking conflict absence.
- Exact Wigo assignment succeeded with HTTP 200.
- Assignment timestamp: `2026-09-14T17:00:09.807195+00:00`.
- Booking remained `Submitted`; assigned vehicle ID was
  `9ab3550e-0ade-48cf-b699-0e19f6d7a68b`.
- Same-vehicle/same-branch canonical acknowledgment flags were true.

## Confirmation

- Owner/Admin confirmed the exact booking using the returned assignment
  snapshot.
- Result: `Submitted` -> `Confirmed`.
- Confirmation timestamp: `2026-09-14T17:00:44.330789+00:00`.
- Customer subsequently observed the exact booking as `Confirmed`.
- No `Ready`, preparation, delivery-completion, or completed-booking state was
  created or claimed.

## Release

- The exact confirmed booking, vehicle, prerequisites, and readiness were
  revalidated before release.
- Canonical release succeeded with HTTP 200.
- Release used null odometer, fuel `Other/Unknown`, synthetic condition text,
  and all three required acknowledgements.
- The current server contract permitted release before the scheduled pickup;
  no canonical timing block occurred. No timestamp was backdated or edited.

## Active Rental

- Rental ID: `31279a74-6755-46aa-aa2a-a75e485add92`.
- Exact binding: booking `78e566c2-d503-4cc4-a1e4-7a03fb053081`, vehicle
  `9ab3550e-0ade-48cf-b699-0e19f6d7a68b`.
- `started_at`: `2026-09-14T17:01:53.063225+00:00`.
- At active-rental observation, `ended_at` was `null` and Customer projection
  reported `active: true`.
- The booking remained `Confirmed`. No settlement, completion, or final-charge
  claim was made.

## Return

- Owner/Admin returned the exact active rental using its booking, vehicle, and
  start-time snapshots.
- `ended_at`: `2026-09-14T17:02:28.624108+00:00`.
- Return fuel was `Other/Unknown`; odometer remained null. Synthetic return
  condition and remarks were recorded through the canonical workflow.
- The booking remained `Confirmed`; the rental became ended.
- Customer subsequently observed the exact rental with `active: false` and a
  non-null `ended_at` (Rental ended / Return recorded). No Completed, Settled,
  Fully paid, or final-charge claim was made.

## Customer Final State

- Customer My Bookings contained 3 records; the exact new booking was
  `Confirmed` and assigned to `DEV-WIGO-001`.
- Exact Requirements: set `9b3af45e-04c0-4c5d-977c-3a1f4ee8d32e`, `Verified`,
  two current canonical documents.
- Exact Payment: `79d40048-a678-4c4b-8eb6-8a2f74099b35`, `Verified`, current
  proof `c01e14dc-306e-470b-a054-ad117e21ee0d`.
- Exact Rental: `31279a74-6755-46aa-aa2a-a75e485add92`, ended, `active: false`.
- Customer home and exact booking-detail routes returned HTTP 200. The route
  is client-rendered; its unhydrated HTML shell did not contain the post-load
  confirmation copy, while the authenticated API projection and lifecycle
  state were correct.

## Admin Final State

- Owner/Admin exact booking detail showed `Confirmed`, Wigo assigned,
  Requirements `Verified`, Payment `Verified`, and the ended exact rental.
- Exact requirements review and payment review records remained bound to the
  new booking.
- Dashboard returned HTTP 200 with role `Owner/Admin`; the exact booking was
  present in recent bookings as `Confirmed` with Toyota Wigo.
- Fleet returned Wigo as active, `Reserved`, maintenance-ready, with no
  readiness reasons. The reserved status reflects the still-future confirmed
  booking period; it was not normalized or changed.
- Admin booking detail, requirements detail, payment detail, activity, and
  reports routes all returned HTTP 200.

## Notifications

- Read-only notification verification found the expected exact Customer rows:
  - `requirements_verified` -> requirement set
    `9b3af45e-04c0-4c5d-977c-3a1f4ee8d32e` -> exact Customer booking route.
  - `payment_verified` -> payment
    `79d40048-a678-4c4b-8eb6-8a2f74099b35` -> exact Customer booking route.
  - `booking_confirmed` -> booking
    `78e566c2-d503-4cc4-a1e4-7a03fb053081` -> exact Customer booking route.
- Read-only notification verification found the expected exact Admin rows:
  - `new_booking_request` -> exact booking.
  - `requirements_submitted` -> exact requirement set.
  - `payment_proof_submitted` -> exact payment.
- All inspected rows remained unread. No notification-read mutation was
  performed. In-app notifications were verified; no email delivery was
  claimed.

## Audit Trail

The Owner/Admin audit read returned all nine expected exact-lifecycle actions in
the execution window, each bound to the correct booking or child entity:

- `booking.created` -> booking `78e566c2-d503-4cc4-a1e4-7a03fb053081`.
- `requirements.submitted` -> requirement set `9b3af45e-04c0-4c5d-977c-3a1f4ee8d32e`.
- `requirements.verified` -> requirement set `9b3af45e-04c0-4c5d-977c-3a1f4ee8d32e`.
- `payment.submitted` -> payment `79d40048-a678-4c4b-8eb6-8a2f74099b35`.
- `payment.verified` -> payment `79d40048-a678-4c4b-8eb6-8a2f74099b35`.
- `booking.vehicle_assigned` -> booking `78e566c2-d503-4cc4-a1e4-7a03fb053081`.
- `booking.confirmed` -> booking `78e566c2-d503-4cc4-a1e4-7a03fb053081`.
- `rental.released` -> rental `31279a74-6755-46aa-aa2a-a75e485add92`.
- `rental.returned` -> rental `31279a74-6755-46aa-aa2a-a75e485add92`.

## Reports

- Owner/Admin `GET /api/admin-reports?start=2026-09-15&end=2026-09-15` returned
  HTTP 200 for the Manila-local report day.
- Report summary: 1 booking request, 1 rental started, 1 rental completed,
  fleet count 12. Booking status breakdown was `Confirmed: 1`.
- Report `rentals.completed` is an ended-rental metric; it is not a claim that
  the booking was Completed or Settled.
- No forecast, supply evaluation, allocation recommendation, or Decision
  Support output was generated.

## Data Created

- One application-created booking and its immutable Finder context.
- One requirement set, two synthetic current requirement documents, and one
  requirement review.
- One payment and one synthetic current payment proof.
- One rental transaction, subsequently ended through the canonical return
  workflow.
- Expected application side effects: six in-app notifications and nine audit
  events listed above.
- The UUID booking idempotency binding was created by the application; its
  value is not recorded.

## Existing Data Touched

- Existing reference data was read: canonical branches, active vehicles,
  maintenance readiness, payment method, existing booking/rental context,
  dashboard, reports, notifications, and audit trail.
- The reusable existing Wigo master record was used as the selected vehicle;
  only the new booking's assignment and rental lifecycle referenced it.
- Existing Auth accounts were authenticated only.
- Existing unrelated bookings, Customers, requirements, documents, payments,
  proofs, rentals, maintenance records, branches, vehicles, and Decision
  Support rows were not mutated.
- Existing unrelated records mutated: **NO**.

## Safety Review

- No direct database editing, fixture apply, fixture cleanup, Storage deletion,
  schema change, migration, source change, role change, password change, Auth
  metadata change, deployment, merge, or main push was performed.
- Only the configured Lead-authorized Customer and Owner/Admin identities were
  used. Staff validation performed: **NO**.
- Synthetic QA artifacts were clearly labeled `NOT-A-REAL`; no real identity,
  government, license, customer, or personal document was used.
- Decision Support generation performed: **NO**.
- Cleanup performed: **NO**. The new lifecycle and its application-generated
  evidence are retained temporarily as authorized defense evidence.
- Credential values were never printed, logged, committed, screenshotted, or
  placed in this document.

## Findings / observations

- No confirmed application defect was demonstrated.
- The canonical branch display name is `Taft, Manila`; the non-canonical
  `VS003 Temp 1788110993` branch was observed as existing QA residue and was
  not used or changed.
- The payment-submit success response is the raw persisted payment object;
  exact readback confirmed one payment and one proof, so no retry was made.
- The customer route shell is client-rendered; post-hydration lifecycle state
  was verified through the authenticated canonical API projections and route
  HTTP responses.
- The current release contract permitted a release before the scheduled pickup
  time; no timing block was returned, and no timestamp was altered to bypass a
  rule.
- Regression tests passed: 13 auth/requirements/admin-access tests, 26
  booking/Finder/lifecycle/rental tests, and 44 payment/notification/fleet/
  report tests.

## Retention

The new booking, requirement set/documents, payment/proof, review records,
rental, notifications, and audit events are retained temporarily as mock-defense
evidence under the Lead authorization. No fixture cleanup or record deletion was
performed.

## E2E Result

CONTROLLED E2E PASSED WITH NON-BLOCKING OBSERVATIONS
