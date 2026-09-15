# Controlled E2E Plan

## Baseline

- Repository: `https://github.com/aldrisheesh/car-rental-fleet-management-system`
- Branch: `stabilization/frontend-rebuild`
- Discovery date: 2026-09-14, Asia/Manila
- Reviewed current HEAD: `5476694e41c7b0e5bd030c2c66067adc20bfa9fd`
  (`docs: re-review whole-system stabilization`)
- The current HEAD contains the requested implementation commit
  `db0ace391d94e8ab31fbe1325f52fbd9681fea67`.
- `origin/stabilization/frontend-rebuild` matched the current HEAD during
  pre-flight.
- `origin/main` remained `faed190d9b78bb845e2c89e7160eda90106f741f` during
  discovery.
- The working tree was clean before this planning document was created.
- The whole-system re-review, backend contracts, capability migration, and
  current QA fixture README/source/tests were read.
- No application source, schema, migration, fixture data, Auth user, Storage
  object, deployment, or lifecycle state was changed in this session.
- The configured QA fixture target is `local`. Required fixture environment
  values are present only in the ignored `.env.local`; no credentials or
  secret values are reproduced here. The local file emits a shell parse
  warning from an unescaped apostrophe in an unrelated sender-name setting.
  Future operators must use a secure dotenv-aware environment loader or fix
  that local-only setting outside this repository; the fixture command itself
  must never print or commit secrets.

The repository records the current controlled-E2E and PR/merge-review status as
**READY WITH NON-BLOCKING OBSERVATIONS**, with no confirmed defects. The
carried observations remain relevant: Staff-readable Decision Support GET APIs
versus the approved Owner/Admin-only UI, the unconfirmed Fleet nested-control
accessibility candidate, baseline repository diagnostics outside the rebuilt
surface, and the lack of an approved headed browser runner.

## Goal

Prepare one minimum, realistic, controlled lifecycle that is executed through
the supported application paths and produces defensible operational evidence:

`Customer -> Finder -> Rental Request -> Requirements -> Payment -> Admin
review -> Confirmation -> Allocation/assignment -> Release -> Active Rental ->
Return -> Return Recorded`.

The primary path must end with the canonical facts that the repository
actually persists:

- booking status `Submitted`, then `Confirmed`;
- requirement set `Pending Review`, then `Verified`;
- payment `Pending Verification`, then `Verified`;
- an explicitly assigned vehicle;
- one active rental, then one ended rental;
- customer-derived confirmation, active-rental, and returned views.

It must not claim or manufacture `Ready`, `Completed`, `Settled`, `Fully paid`,
settlement, a completed-booking status, a preparation state, a delivery
completion state, or an automated payment verification. After return, the
booking remains `Confirmed`; the rental is ended and the customer returned
view is a derived presentation state.

## Current environment inventory

Inventory was read through the existing fixture dry-run and safe read-only
database/Auth queries against the configured local QA target. Counts below are
reported without private customer identifiers, credentials, document contents,
or raw Auth/database IDs.

### Reference and operational data

| Area                        |                                                                                            Current inventory | Interpretation                                                                                                                                                                           |
| --------------------------- | -----------------------------------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical branches          |                                                                      2 active: Taft, Manila; Antipolo, Rizal | Sufficient; reuse only these two.                                                                                                                                                        |
| Additional branch           |                                                                             1 active `VS003 Temp 1788110993` | Known unexpected residue; report only and never use, edit, deactivate, or delete in this plan.                                                                                           |
| Vehicle categories          |                                                              6 active: Economy, Sedan, SUV, MPV, Van, Pickup | Sufficient for the primary path and existing Decision Support coverage.                                                                                                                  |
| DEV vehicles                |                                                                                   12 active `DEV-*` vehicles | Sufficient; no vehicle fixture or master-data mutation is required.                                                                                                                      |
| Primary candidate           |                    `DEV-WIGO-001`, Toyota Wigo, Taft, Economy, 5 seats, current daily rate read as PHP 1,000 | No active rental, open confirmed booking, open maintenance, or blocking condition at inventory time. Revalidate the current maintenance-eligibility checks immediately before execution. |
| Other occupied DEV vehicles |                                            2 active controlled rentals, on `DEV-INNO-001` and `DEV-URVN-001` | Do not select either for the primary path.                                                                                                                                               |
| Open blocking maintenance   |                                                                                            0 on DEV vehicles | No maintenance mutation is needed. Existing maintenance history is non-blocking.                                                                                                         |
| Active demo payment method  |                                                             `demo-bank-transfer`, label `Demo bank/e-wallet` | Reuse only if the application still returns it as active; it is not a real payment channel.                                                                                              |
| Forecast coverage           | Tracking begins at 2026-06-28 16:00 UTC, which covers the historical window beginning 2026-06-29 Manila week | Historical dry-run requires no coverage update.                                                                                                                                          |

### Existing non-fixture operational rows

Rows classified as `legitimate-or-unmarked` below are not assumed to be
fixture-owned merely because they are synthetic-looking. They were not opened,
enumerated by private ID, altered, or used as a substitute for the new E2E
booking.

- 7 unmarked `Submitted` booking requests exist.
- 7 unmarked requirement sets exist: 4 `Not Submitted`, 1 `Pending Review`,
  1 `Needs Resubmission`, and 1 `Verified`.
- No unmarked payment rows were found.
- Existing derived operational data includes 2 forecast runs, 54 forecast
  rows, 162 forecast inputs, 3 supply evaluations, 1 supply vehicle snapshot,
  and 5 allocation recommendation batches. These rows are attributed to
  unmarked operational actors rather than either controlled fixture
  namespace; they are not treated as controlled defense evidence and must not
  be overwritten.

### Existing fixture-controlled rows

The standard namespace `briah-controlled-qa-v1` is already present and the
standard dry-run planned `SKIP` for every owned item:

- 11 Auth/profile identities: 10 synthetic customers and 1 synthetic
  Owner/Admin operator;
- 22 bookings: 15 `Submitted`, 5 `Confirmed`, 1 `Rejected`, and 1
  `Cancelled`;
- 10 requirement sets: 2 `Not Submitted`, 1 `Pending Review`, 1 `Needs
Resubmission`, and 7 `Verified`;
- 18 synthetic requirement documents and 8 requirement review rows;
- 7 payments: 1 `Pending Verification`, 1 `Needs Resubmission`, and 5
  `Verified`, with 7 synthetic proof artifacts;
- 5 rental transactions: 2 active and 3 returned;
- 5 maintenance records: 4 `Completed` and 1 `Cancelled`, all
  `blocks_rental_use = false`.

The historical namespace `briah-historical-decision-support-qa-v1` is also
already present and the historical dry-run planned `SKIP` for every owned item:

- 9 Auth/profile identities: 8 synthetic historical customers and 1
  historical Owner/Admin operator;
- 81 bookings: 75 `Confirmed`, 2 `Submitted`, 2 `Rejected`, and 2
  `Cancelled`;
- 75 returned rental transactions;
- 3 `Completed`, non-blocking maintenance records;
- 12 active vehicle operational-state events;
- no requirement documents, payments, payment proofs, forecast rows, supply
  rows, or allocation rows are created by historical fixture mode.

Thirty existing append-only audit events are associated with standard fixture
booking activity, primarily requirement transitions. No fixture-linked
notifications, Finder-context rows, booking idempotency bindings, or email
delivery rows were found by the cleanup dependency inventory. This audit
history is important: the standard fixture cleanup dry-run safely refused with
“append-only audit events reference fixture IDs.” It must not be bypassed.

## Controlled account strategy

Use the minimum three-role coverage without creating duplicate Auth users:

1. **Customer/Renter:** reuse `QA-CUST-001` from the standard controlled
   namespace, subject to Lead confirmation of the secure login credential. It
   has prior sign-in metadata, but this session did not test or expose its
   credential.
2. **Owner/Admin:** reuse `QA-OPERATOR-001` from the standard controlled
   namespace, subject to Lead confirmation of the secure login credential. It
   has prior sign-in metadata and its profile is already `Owner/Admin`.
3. **Operations Staff:** one active unmarked Staff profile exists in the
   environment, but there is no fixture-controlled Staff identity. Lead must
   designate and authorize that existing account for the later read-only
   checks. Do not create a duplicate Staff Auth user in this plan.

The historical accounts are not needed for the primary customer lifecycle.
They remain reserved for the historical Decision Support fixture namespace.
Credentials, email addresses, cookies, tokens, and private IDs remain outside
the plan and evidence report. If a controlled login cannot be established for
the two reusable accounts, execution stops and Lead must either provide secure
access or separately authorize account creation; no account is created by
assumption.

## Reference/master data

No precondition apply is required. Use the current canonical master data as
read-only reference data:

- Finder and booking use active canonical branches only. Select Taft for both
  pickup and return to avoid an unnecessary cross-branch assignment path.
- Select `DEV-WIGO-001` only if the immediate preflight still shows it active,
  maintenance-ready, and free for the selected period. It is the current
  minimum vehicle capable of proving Finder match, assignment, release, and
  return.
- Use a two-day Manila-local period beginning after the execution preflight.
  The exact dates must be chosen at execution time so the request is not in
  the past and does not collide with a newly appeared Confirmed booking or
  scheduled rental.
- Finder inputs should use a small synthetic party (for example, 2
  passengers), preferred category `Economy`, a synthetic destination, and a
  maximum total base-rental budget computed from the exact current Wigo rate.
  The budget is a Finder eligibility input, not a charge or payment claim.
- Do not use the additional `VS003 Temp 1788110993` branch or any vehicle not
  returned by the current canonical master-data/Finder response.
- Do not create or update branches, categories, vehicles, payment methods,
  maintenance rows, or user roles for this E2E.

## Historical fixture requirement

### Finding

One live booking is meaningful for current operational reports and state
propagation, but it is not enough historical volume for WMA forecast inputs,
supply comparisons, vehicle idle analysis, or allocation recommendations.
Meaningful Decision Support defense therefore requires historical operational
inputs in addition to the live E2E lifecycle.

### Minimum dataset

The existing historical fixture is already the minimum defensible bounded
coverage in the repository and is present in the target. It covers 10 complete
Asia/Manila weeks from 2026-06-29 through 2026-09-06 with:

- 75 qualifying `Confirmed` booking-demand observations;
- 75 returned rental observations with ended rentals;
- 3 completed, non-blocking maintenance observations;
- 12 active operational-state events across the 12 DEV vehicles;
- designed non-zero WMA pairs, Taft Economy and Taft Sedan shortage cases,
  balanced cases, Antipolo Sedan/Taft MPV/Antipolo Pickup surplus cases, and
  idle candidates;
- an intended Antipolo Sedan -> Taft Sedan allocation opportunity after the
  application evaluates the canonical forecast and supply state.

No additional historical rows should be added merely to increase dashboard
volume. The existing fixture is separate from the standard UI-state fixture,
uses its own ownership namespace, and does not create forecasts, supply
evaluations, allocation recommendations, payments, or documents.

### Derived-output execution boundary

Forecast, supply, and allocation outputs must be generated by the supported
Owner/Admin application workflow if Lead wants fresh Decision Support evidence:

- `POST /api/forecasts` with an explicit idempotency key;
- `POST /api/supply-evaluations` for the exact selected forecast;
- `POST /api/allocation-recommendations` with an explicit idempotency key;
- optional `PATCH /api/allocation-recommendations` for one advisory decision.

These are separate, authorized operational mutations, not fixture inserts and
not part of the minimum primary customer lifecycle. Approval does not transfer
a vehicle; allocation remains advisory. If they are not executed, evidence
must say that outputs were not generated rather than imply a forecast or
recommendation exists.

## Primary lifecycle

The following is the recommended happy path. All actions are later execution
steps only; nothing in this section was performed during discovery.

| Step                                      | Actor and route                                                                                                  | API/domain action                                                                                                                                                                                      | Expected before -> after                                                                                                      | Evidence and rollback implication                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Finder                                 | Customer, `/vehicles`                                                                                            | `POST /api/vehicle-finder` with current Manila-local dates, passengers, budget, Economy preference, and synthetic destination                                                                          | No new transaction -> canonical `{criteria, rentalDays, recommendations, noMatch:false}` with Wigo as an exact recommendation | Capture criteria, rental days, selected vehicle name/category/branch, rank, and reasons. If Wigo is not returned or evaluation fails, stop/reselect; do not insert a booking directly.                                                                                                                                                                  |
| 2. Rental request                         | Customer, `/booking`                                                                                             | Read `GET /api/booking-master-data` and `GET /api/vehicles`; submit Customer-only idempotent `POST /api/bookings` with a UUID idempotency key and Finder context                                       | No new E2E booking -> one exact booking in `Submitted`; no requirement/payment/rental yet                                     | Capture the exact booking ID, request timestamp, schedule, branches, vehicle, and submitted status. If response is uncertain, reload the exact customer booking list before retrying; never create a second request blindly.                                                                                                                            |
| 3. Requirements upload and submit         | Customer, `/bookings/:bookingId`                                                                                 | Two multipart `POST /api/requirements` uploads, then multipart `POST /api/requirements` with `action=submit`                                                                                           | Requirement set absent or `Not Submitted` -> two current documents and `Pending Review`                                       | Capture status, required types, versions, safe filenames, and submission timestamp only. Do not retain document contents. There is no direct rollback; an upload failure must be resolved through the canonical retry/cleanup behavior.                                                                                                                 |
| 4. Requirement review                     | Owner/Admin, `/admin/requirements/:bookingId` or exact booking workspace                                         | `GET /api/requirements?bookingId=...`; JSON `POST /api/requirements` with `action=review`, both current document IDs/versions, both `Accepted`, `Consistent`, `LTO Clear`, resulting status `Verified` | `Pending Review` -> `Verified`                                                                                                | Capture exact booking/set binding, review outcomes, reviewer role, resulting status, audit action, and customer notification. Open only a short-lived signed preview if needed; do not screenshot or retain private proof contents.                                                                                                                     |
| 5. Payment submission                     | Customer, `/bookings/:bookingId`                                                                                 | Read `GET /api/payments?bookingId=...`; submit multipart `POST /api/payments` with active demo method, positive amount, synthetic reference, and synthetic PDF proof                                   | No payment or `Not Submitted` -> `Pending Verification`                                                                       | Capture method label, `required_amount` value/null, submitted amount, proof version/filename, reference redacted or represented as synthetic marker, and timestamp. If `required_amount` is null, use a nominal positive controlled value such as PHP 1.00 only to satisfy the contract; never describe it as 50%, paid in full, or a real transaction. |
| 6. Payment review                         | Owner/Admin, `/admin/payments/:paymentId`                                                                        | Read exact payment and current proof; JSON `POST /api/payments` with `action=verify`, current proof version, amount, and transaction-reference snapshot                                                | `Pending Verification` -> `Verified`                                                                                          | Capture exact payment-to-booking binding, manual review result, current proof version, and customer notification. If `required_amount` is unexpectedly non-null, use only the exact returned canonical value or stop; do not derive a 50% amount.                                                                                                       |
| 7. Assignment                             | Owner/Admin, `/admin/bookings/:bookingId`                                                                        | `POST /api/bookings` with `action=assign`, exact booking ID, Wigo vehicle ID, and a short synthetic assignment note                                                                                    | `Submitted`, unassigned -> `Submitted`, Wigo assigned with assignment actor/time                                              | Capture assigned vehicle, expected/requested vehicle match, assignment timestamp, and audit action. Same vehicle and branch avoid substitution/cross-branch acknowledgement. Do not force assignment if the server reports a conflict.                                                                                                                  |
| 8. Confirmation                           | Owner/Admin, exact booking detail                                                                                | `POST /api/bookings` with `action=confirm`, exact assigned vehicle and `assigned_at` snapshot                                                                                                          | `Submitted` with Verified requirements/payment and assignment -> `Confirmed`                                                  | Capture confirmation timestamp, prerequisites, exact vehicle, customer confirmation notification, and audit action. On a 409, reload the exact booking and stop if the state differs from expectation.                                                                                                                                                  |
| 9. Release/start                          | Owner/Admin, exact booking detail                                                                                | `POST /api/bookings` with `action=release`, exact vehicle/confirmation snapshots, non-empty synthetic condition summary, allowed fuel value, and all three required acknowledgements                   | `Confirmed`, no rental -> one active rental with `started_at`, `ended_at=null`                                                | Capture rental ID, booking/vehicle binding, started timestamp, condition/fuel fields, and `rental.released` audit event. Odometer may remain null because the current Wigo odometer is null; do not invent a reading.                                                                                                                                   |
| 10. Active rental observation             | Customer, `/bookings/:bookingId`                                                                                 | Read `GET /api/bookings` and exact child reads after release                                                                                                                                           | Confirmed booking plus active rental -> customer sees the active-rental derived view                                          | Capture the safe customer projection: rental ID, vehicle, scheduled dates, started timestamp, active state. Do not claim preparation, readiness, settlement, or completion.                                                                                                                                                                             |
| 11. Return                                | Owner/Admin, exact booking detail                                                                                | `POST /api/bookings` with `action=return`, exact rental/booking/vehicle/start snapshots, non-empty synthetic return condition summary, allowed fuel value, optional remarks                            | Active rental -> same rental with `ended_at` and return fields                                                                | Capture ended timestamp, return condition, rental audit action, and exact binding. The RPC closes the rental only; it does not change the booking from `Confirmed`.                                                                                                                                                                                     |
| 12. Returned observation                  | Customer, `/bookings/:bookingId`                                                                                 | Reload exact customer booking and child reads                                                                                                                                                          | Rental `ended_at` null -> ended rental and customer returned view                                                             | Capture customer-facing `returned` state, returned time, vehicle, and booking status. Describe this as “Rental ended / Return recorded,” never “Completed,” “Settled,” or “Fully paid.”                                                                                                                                                                 |
| 13. Side effects and operational evidence | Owner/Admin, `/admin`, `/admin/bookings/:bookingId`, `/admin/activity`, `/admin/notifications`, `/admin/reports` | Read-only verification of canonical side effects and report inputs                                                                                                                                     | Transition rows -> related audit/notification/report projections                                                              | Capture exact IDs/timestamps, expected audit actions, notification types/deep links, dashboard counts, booking queue state, report impact, and source/error states. Do not mark notifications read unless Lead separately authorizes that small preference/read mutation.                                                                               |

### Expected canonical side effects

The live application path should be allowed to create its own side effects.
Do not seed these rows directly:

- booking creation: `booking.created` audit and Owner/Admin
  `new_booking_request` notification;
- requirements submission: `requirements.submitted` audit and
  `requirements_submitted` Owner/Admin notification;
- verified requirements review: `requirements.verified` audit and
  `requirements_verified` customer notification;
- payment submission: `payment.submitted` audit and
  `payment_proof_submitted` Owner/Admin notification;
- payment verification: `payment.verified` audit and `payment_verified`
  customer notification;
- assignment and confirmation: `booking.vehicle_assigned` and
  `booking.confirmed` audit actions, plus `booking_confirmed` customer
  notification for confirmation;
- release and return: `rental.released` and `rental.returned` audit actions.

Scheduled pickup/return or overdue notifications are timing-dependent and must
not be required as proof of the primary lifecycle. Transactional email enqueue
or provider delivery is separate from in-app notification creation; do not
claim email delivery from an in-app row.

## Optional correction path

Use at most one correction path, only if Lead wants stronger defense evidence.
The preferred scenario is **Requirements Needs Resubmission** because it
exercises the canonical document-version and customer-facing-reason flow
without inventing a payment failure.

On the same booking, before payment:

1. Owner/Admin reviews the current synthetic Government ID as `Needs
Replacement` with a clear reason, reviews the Driver’s License as
   `Accepted`, and records `Needs Resubmission`.
2. Customer sees the exact reason, replaces only the flagged Government ID
   through the booking detail upload flow, and submits `resubmit`.
3. Owner/Admin reviews the new current document version with both outcomes
   `Accepted`, identity `Consistent`, LTO `Clear`, and resulting status
   `Verified`.
4. Continue with the primary payment step.

This replaces the single first-pass `Verified` review with four review-path
requests (initial review, replacement upload, resubmit, final review), adding
three logical mutations relative to the primary happy path. All files remain
obviously synthetic and are never real IDs. Do not add a payment correction
scenario unless the requirements correction is declined and Lead separately
authorizes it.

## Operations Staff checks

Use only the Lead-designated existing active Staff account. Staff validation is
read-only and must occur after the exact E2E booking has a safe state to view.

Allowed observations:

- `/admin` and `GET /api/admin-dashboard`: operational counts and recent
  booking/readiness context;
- `/admin/bookings` and `/admin/bookings/:bookingId`: exact booking, trip,
  vehicle, schedule, requirement status, payment status, and safe rental
  state;
- `/admin/calendar` and `GET /api/admin-calendar?month=YYYY-MM`: calendar
  events;
- `/admin/notifications` and `GET /api/notifications`: Staff-recipient
  operational notifications only;
- `/admin/reports` and `GET /api/admin-reports`: operational reports with a
  bounded date range.

Verify that Staff does not receive candidate-vehicle mutation controls,
requirements documents, document review controls, payment records/proofs,
assignment, confirmation, release, return, Fleet, Maintenance, Branches,
Users/Roles, Audit Trail, or Decision Support UI. A controlled, expected
forbidden-action check may send an Owner/Admin-only booking action against the
exact E2E booking and must receive `403` with no state change; it is a
permission assertion, not a lifecycle action. If it returns success or changes
state, stop immediately.

Do not test or resolve Staff Decision Support access in this E2E. The approved
UI excludes it even though several read-only APIs currently permit Staff; this
is the documented architecture conflict.

## Reports / Decision Support coverage

### Reports

The single live lifecycle should contribute defensible operational changes:

- one created booking in the selected report range;
- one confirmed booking after confirmation;
- one started rental and one ended rental after release and return;
- vehicle and branch/category operational counts;
- audit and notification evidence tied to exact entities.

Query `/api/admin-reports` with a range that includes the exact created,
started, and ended timestamps, then capture the returned booking, rental,
vehicle, maintenance, branch, and category summaries. Do not expect or claim
revenue, profit, payment totals, settlement, charges, or a financial export.
Utilization may remain `Partial`, `Insufficient Historical Eligibility Data`,
or otherwise unavailable depending on the selected range; that is the honest
result and must not be converted to zero or a success claim.

### Decision Support

The live booking alone is insufficient for a meaningful WMA forecast. The
existing historical fixture is the minimum input coverage. If Lead separately
authorizes derived-output generation, capture:

1. the forecast run, WMA method, coverage start, three horizons, inputs, and
   any insufficient-data pairs;
2. the selected supply evaluation with required units, projected supply,
   shortage/surplus, readiness, and vehicle snapshots;
3. the allocation recommendation batch, candidate snapshots, explanation
   codes, and any explicit advisory decision.

Do not call WMA AI/ML, do not fabricate confidence, do not invent history, and
do not claim that an approved recommendation transferred a vehicle. If the
derived workflow is not authorized, report existing historical inputs as
available and derived outputs as not freshly generated.

## Live workflow vs fixture matrix

| Entity                             | Existing                                                                                 | Fixture                                                    | Application Workflow                                                           | Reason                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Branch                             | 2 canonical active branches                                                              | Reused, never owned or modified                            | `GET /api/booking-master-data`                                                 | Master/reference data is sufficient; avoid the known extra branch.            |
| Vehicle category                   | 6 active categories                                                                      | Reused, never owned or modified                            | Finder/master-data reads                                                       | No category mutation is needed.                                               |
| Primary vehicle                    | 12 active DEV vehicles; Wigo currently free                                              | Reused, never owned or modified                            | `POST /api/vehicle-finder`, then booking and assignment reads                  | One clean Wigo demonstrates the full physical lifecycle.                      |
| Payment method                     | Active demo method exists                                                                | Reused by standard fixture but not changed                 | `GET /api/payments` and customer form                                          | It is explicitly demo-only; no real gateway or credentials.                   |
| Customer Auth/profile              | Standard controlled namespace has 10 customers                                           | Existing `QA-CUST-001` reused                              | Normal sign-in/session                                                         | Avoid duplicate Auth creation; Lead must authorize credentials.               |
| Owner/Admin Auth/profile           | Standard controlled namespace has one operator                                           | Existing `QA-OPERATOR-001` reused                          | Normal sign-in/session                                                         | Required for reviews and lifecycle mutations; no new user.                    |
| Staff Auth/profile                 | One active unmarked Staff profile exists                                                 | No Staff fixture identity                                  | Normal sign-in/session after Lead designation                                  | Use existing authorized account; do not create a duplicate.                   |
| Finder evaluation                  | No new transaction                                                                       | Not created by fixture tool                                | `POST /api/vehicle-finder`                                                     | Finder claims must come from the current evaluator.                           |
| Booking request                    | Existing unrelated and fixture bookings exist                                            | Do not reuse a fixture transaction                         | Customer `/booking` -> `POST /api/bookings`                                    | Transactional creation must be canonical and idempotent.                      |
| Finder context/idempotency binding | Existing fixture-linked dependency count is zero                                         | Not seeded as durable fixture evidence                     | Created by booking workflow when Finder context is accepted                    | Preserve exact Finder provenance and safe retry behavior.                     |
| Requirement set                    | Existing rows include mixed states                                                       | Do not reuse a fixture set                                 | Customer `/bookings/:bookingId` -> `POST /api/requirements`                    | Exact booking binding and current state must be proven.                       |
| Requirement documents/storage      | Existing synthetic artifacts exist                                                       | Do not reuse fixture documents                             | Customer multipart upload to private bucket through API                        | Later artifacts must be synthetic and obviously not real IDs.                 |
| Requirement review                 | Existing review rows exist                                                               | Do not direct-insert review history                        | Owner/Admin `/admin/requirements/:bookingId` -> `POST /api/requirements`       | Review gates and notifications must be canonical.                             |
| Payment/proof/storage              | Existing fixture payments exist; current live required amount remains contract-dependent | Do not reuse fixture payment/proof                         | Customer booking detail -> `POST /api/payments`                                | Manual payment submission must be exact-booking and synthetic.                |
| Payment review                     | Existing fixture reviews exist                                                           | Do not direct-insert a verified payment                    | Owner/Admin `/admin/payments/:paymentId` -> `POST /api/payments`               | Manual proof/version/snapshot review is the canonical gate.                   |
| Assignment/confirmation            | Existing confirmed fixture bookings exist                                                | Do not reuse one                                           | Owner/Admin booking detail -> `POST /api/bookings` actions `assign`, `confirm` | Proves current expected-snapshot lifecycle.                                   |
| Rental/release/return              | Existing active and returned fixture rentals exist                                       | Do not reuse one                                           | Owner/Admin booking detail -> `POST /api/bookings` actions `release`, `return` | Proves exact rental creation and closure.                                     |
| Maintenance                        | Existing non-blocking history exists                                                     | Standard/historical fixtures already cover bounded history | Read-only Fleet/Maintenance only, no mutation                                  | Avoid unresolved blocking-policy choices and extra volume.                    |
| Notifications                      | No fixture-linked notifications currently found                                          | Fixture tool does not seed them                            | Automatic DB/application side effects; `GET /api/notifications`                | Verify recipient, type, related entity, and deep link without direct inserts. |
| Audit events                       | Existing append-only events include standard fixture activity                            | Fixture tool does not seed them                            | Automatic lifecycle triggers; `/admin/activity`                                | Never delete or rewrite append-only history.                                  |
| Operational reports                | Read-only derived API                                                                    | Not directly fixture-created                               | `GET /api/admin-reports`                                                       | Reports must reflect canonical operational rows only.                         |
| Historical forecast inputs         | Historical fixture already present                                                       | Existing `QA-HIST-*` namespace                             | Read-only inputs; no new apply                                                 | Ten weeks is the minimum meaningful WMA coverage.                             |
| Forecast run/inputs                | Existing unmarked derived rows exist                                                     | Not created by fixture mode                                | Optional Owner/Admin `POST /api/forecasts`                                     | Generate only with separate authorization and an idempotency key.             |
| Supply evaluation                  | Existing unmarked derived rows exist                                                     | Not created by fixture mode                                | Optional Owner/Admin `POST /api/supply-evaluations`                            | Evaluate an exact forecast; do not overwrite existing rows.                   |
| Allocation recommendation          | Existing unmarked batches exist but no recommendation/candidate rows were found          | Not created by fixture mode                                | Optional Owner/Admin `POST/PATCH /api/allocation-recommendations`              | Advisory only; approval never performs a transfer.                            |

## Evidence capture plan

Capture evidence incrementally while the exact state is visible. Use
screenshots, timestamps, exact safe IDs, and concise API/state summaries. Do
not capture credentials, cookies, secret environment values, raw document or
proof contents, unnecessary customer PII, or private storage paths.

Minimum evidence set:

- Customer Finder criteria and canonical result showing the selected Wigo;
- rental-request review and submitted `Submitted` booking state;
- exact booking ID and timestamps after each cross-role handoff;
- customer requirements view showing the two canonical required types and
  `Pending Review`;
- Owner/Admin requirements review showing exact booking/set binding, outcomes,
  and `Verified` result;
- customer payment form showing the active demo method and the actual
  `required_amount` null/non-null behavior without a 50% claim;
- payment submitted `Pending Verification` state and Owner/Admin payment
  review context, proof version, and manual `Verified` result;
- Owner/Admin booking detail showing assignment and confirmation;
- customer confirmed view and exact assigned vehicle;
- Owner/Admin release fields and active rental state;
- customer active-rental view with safe rental projection;
- Owner/Admin return form result and ended rental;
- customer returned view with explicit “Rental ended / Return recorded” wording
  and booking still `Confirmed`;
- Customer and Owner/Admin notification panels, notification types, related
  entity IDs, and supported deep-link destinations;
- Owner/Admin Dashboard and Bookings state before/after the lifecycle;
- Owner/Admin Audit Trail entries for booking, requirements, payment, rental,
  actor, timestamp, and exact entity/booking binding;
- bounded Reports response and visible operational impact;
- Staff Dashboard, Bookings/detail, Calendar, Notifications, and Reports
  read-only views, including the absence of Owner/Admin controls;
- optional forecast, supply, allocation outputs only if their separate
  application workflows are authorized and executed.

For proof/document evidence, capture metadata and review state rather than the
file body. If a signed preview is opened, close it after verification and do
not place the signed URL in the report.

## Data safety / ownership

### Application workflow safety

- Use the application UI and its canonical API calls. No direct database
  inserts, updates, deletes, Auth administration, Storage uploads, or RPC calls
  outside the supported route flow are authorized for this session.
- Use exact IDs returned by the immediately preceding canonical read. Never
  choose the first, newest, global, or implicit child record.
- Use a unique idempotency key for booking creation and explicit current
  snapshots for confirmation, release, and return.
- Use a synthetic purpose/reference marker such as
  `CONTROLLED-E2E-MOCK-DEFENSE-2026-09` in allowed free-text fields so the
  later controlled rows can be identified without PII. This marker is not a
  substitute for application ownership enforcement.
- Let audit and notification triggers run. Do not disable triggers, seed
  audit rows, seed notifications, or call service-role cleanup during the live
  workflow.

### Fixture safety controls inspected

The existing fixture tool has the following controls, which are relevant if a
future Lead-authorized fixture operation is considered:

- dry-run is the default; writes require `--apply`;
- missing Auth creation additionally requires `--include-auth-users`;
- production writes additionally require `--confirm-production-fixtures`;
- remote API and database URLs must identify the same project;
- required active canonical branches, all 12 DEV vehicles, and the active demo
  payment method are validated before planning;
- Auth ownership requires the exact synthetic email plus protected metadata;
- deterministic record IDs, labels, and storage paths are planned as
  `CREATE`, `SKIP`, or hard `collision` from fingerprint comparisons;
- an existing identifier with a changed fingerprint refuses the operation;
- partial Auth inventory or residue without the complete owned identity set
  refuses ambiguous operations;
- storage artifacts are content-hashed before skip/cleanup decisions;
- historical coverage changes require the explicit synthetic-coverage flag and
  capture the exact prior PostgreSQL timestamp text, including microseconds;
- coverage apply/restore locks and rechecks the singleton and refuses a
  changed timestamp rather than overwriting it;
- database apply uses one transaction, an advisory lock, foreign keys and
  constraints remain enabled, and only five named side-effect triggers are
  temporarily disabled for direct fixture inserts;
- cleanup checks append-only audit references, notification ownership,
  Finder-context/idempotency dependencies, and unknown references from owned
  Auth identities before removing anything;
- cleanup is dependency-ordered, removes only positively owned artifacts/rows,
  and refuses collisions or uncertain restoration.

No fixture apply is authorized by this plan. Existing standard cleanup is
currently refused because of append-only audit references; that refusal is a
safety result, not permission to delete or repair audit history.

## Cleanup / retention strategy

Cleanup is decided before execution and is not implicit.

### A. Existing fixture-created preconditions/history

- Retain the standard and historical controlled namespaces through mock
  defense unless Lead separately authorizes cleanup.
- Do not run standard cleanup apply. Its current dry-run refuses on existing
  append-only audit references.
- Historical cleanup may be considered only after a fresh historical cleanup
  dry-run, exact ownership validation, and Lead approval. The current
  historical coverage singleton already reaches the fixture window and has no
  fixture-owned coverage snapshot, so this plan does not restore or modify it.
- If a future historical apply must move coverage, cleanup must use the code’s
  exact raw-timestamp snapshot/restore gate. A changed current timestamp is a
  hard stop.
- Never remove the known extra branch, legitimate/unmarked rows, existing
  derived Decision Support rows, or append-only audit events as “cleanup.”

### B. New E2E transactional records

- Retain the primary application-created booking, requirements, payment,
  rental, returned rental, notifications, and audit trail temporarily as
  controlled mock-defense evidence by default.
- The application has no supported delete/cancel/settlement/completed-booking
  cleanup path for this lifecycle. The return action is the canonical terminal
  rental operation and must be preserved as evidence.
- Do not pass these application-generated rows to the deterministic fixture
  cleanup tool and do not delete them directly. If Lead later decides that
  retention is no longer appropriate, a separate exact-ID, audit-preserving
  cleanup procedure must be authorized and reviewed; it is outside this plan.
- Record the final retention decision and the exact safe entity IDs in the
  later evidence package, not in source or secrets.

## Stop conditions

Stop the execution immediately and preserve the evidence if any of the
following occurs:

- an unexpected legitimate-data collision or schedule conflict;
- the selected account has the wrong role, inactive status, or unclear
  ownership;
- an existing row, Auth identity, Storage path, or derived output cannot be
  classified as controlled or legitimate/unmarked;
- any mutation would affect a non-controlled row or a row other than the exact
  E2E booking/child entity;
- a lifecycle transition differs from the canonical expectation, including a
  claim of Ready, Completed, Settled, or Fully paid;
- a payment amount is unclear, a required amount appears unexpectedly, or a
  real-looking payment reference/proof is requested;
- private document contents, private proof contents, credentials, tokens, or
  unnecessary PII appears in evidence;
- a Staff request exposes Owner/Admin-only data or accepts an Owner/Admin-only
  mutation;
- fixture restoration or cleanup ownership cannot be proven exactly;
- a schema, RLS, RBAC, trigger, Auth, or Storage conflict is discovered;
- a confirmed application defect is encountered;
- an API response lacks the exact expected booking, requirement-set, payment,
  rental, vehicle, or parent-child binding;
- a retry would require guessing whether a prior mutation committed.

Do not work around a stop condition with a direct database edit, service-role
call, fixture insert, schema change, or source change.

## Dry-run result

The existing safe commands were inspected and run without `--apply`:

```text
QA_FIXTURE_TARGET=local npm run qa:fixtures
QA_FIXTURE_TARGET=local npm run qa:fixtures -- --historical
npm run test:qa-fixtures
```

Results:

- Standard create dry-run exited successfully, validated 2 canonical branches
  and 12 DEV vehicles, and planned `SKIP` for all existing standard rows and
  artifacts. No `CREATE`, `UPDATE`, `REMOVE`, Auth creation, Storage upload,
  or database write occurred.
- Historical create dry-run exited successfully, found the existing 10-week
  historical namespace, reported 180 owned database rows (81 bookings, 75
  rentals, 3 maintenance, 12 state events), and required no synthetic
  coverage update. It reported no collisions/refusals and no derived forecast,
  supply, or allocation rows in the fixture dataset.
- Standard cleanup dry-run was attempted read-only and safely refused because
  append-only audit events reference fixture IDs. No cleanup mutation occurred.
- Fixture safety tests passed: 31 passed, 0 failed, 0 skipped.
- No unsafe create collision was detected. The known extra branch and the
  existing audit-linked cleanup condition remain documented observations.

Expected future dry-run outputs are `SKIP` for the already-owned reference and
history namespaces. Any `CREATE`, `UPDATE`, collision, ownership refusal, or
historical coverage update outside this plan must stop execution and return to
Lead review.

## Execution prerequisites

Before any E2E mutation, Lead must confirm all of the following:

1. The target is the authorized non-production QA environment; this plan does
   not authorize production.
2. The current branch/HEAD, working tree, and `origin/main` are rechecked.
3. A secure login method is available for `QA-CUST-001` and
   `QA-OPERATOR-001`, without putting credentials in the plan or evidence.
4. Lead designates the existing active Staff account for read-only checks, or
   explicitly defers Staff validation; no duplicate Staff Auth user is
   created.
5. A fresh read-only inventory confirms Wigo is still active, passes the
   current maintenance-eligibility checks, and is free for the selected
   period; both canonical branches and the demo payment method are still
   active.
6. Synthetic PDF artifacts are prepared locally with obvious “NOT A REAL”
   content, the canonical PDF MIME/magic bytes, and size well below 10 MiB.
   They are not uploaded before authorization.
7. Lead chooses whether to run the optional requirements correction path.
8. Lead chooses whether to generate fresh forecast/supply/allocation outputs
   after the lifecycle.
9. Lead decides that application-created E2E records may remain temporarily
   as mock-defense evidence and records the later retention review point.
10. Evidence storage is controlled and excludes credentials, raw private
    documents/proofs, signed URLs, and unnecessary PII.

## Recommended execution order

1. Re-run the safe standard and historical dry-runs and capture only summary
   counts, collision/refusal status, and reference sufficiency.
2. Sign in separately as the designated Customer and Owner/Admin; verify each
   role and clear any prior test navigation state.
3. Capture a read-only baseline for Finder, Dashboard, Bookings, Reports,
   notifications, and audit counts.
4. Run Finder and create exactly one rental request for the selected Wigo and
   dynamic two-day window. Record the exact booking ID before proceeding.
5. Submit the two synthetic requirement documents and verify `Pending Review`.
6. Review requirements as Owner/Admin. Run the optional correction branch only
   if Lead selected it; otherwise verify directly to `Verified`.
7. Submit one synthetic payment proof using the active demo method and the
   contract-safe amount rule; verify `Pending Verification`.
8. Verify payment as Owner/Admin and confirm that customer payment state is
   `Verified`.
9. Assign Wigo and confirm the exact booking. Observe the customer confirmed
   view.
10. Release/start the exact rental with null odometer if the current vehicle
    value remains null, `Other/Unknown` fuel, a synthetic condition summary,
    and all required acknowledgements. Observe the customer active view.
11. Record return against the exact active rental with a synthetic condition
    summary and allowed fuel value. Observe the customer returned view and
    record that booking status remains `Confirmed`.
12. Run the Staff read-only checks if the account was designated, including the
    expected forbidden mutation assertion. Stop on any exposure or 2xx.
13. As Owner/Admin, capture notification deep links, Dashboard/Bookings state,
    Audit Trail entries, and bounded Reports impact.
14. Only after the primary evidence is complete, and only with separate Lead
    approval, generate fresh Decision Support outputs from the existing
    historical inputs and capture their uncertainty/coverage states.
15. Perform a final read-only inventory. Do not run cleanup apply, fixture
    apply, schema/migration commands, deployment, merge, or production writes.

## Authorization required before execution

Lead authorization is required for:

- the 11 logical primary workflow mutations: one booking create, three
  requirement customer requests, one requirement review, one payment submit,
  one payment review, assignment, confirmation, release, and return;
- the two synthetic requirement uploads and one synthetic payment-proof
  upload, including their private Storage effects;
- reuse of the named controlled Customer and Owner/Admin accounts and use of
  the designated existing Staff account;
- the optional requirements correction path;
- any fresh forecast, supply, allocation-generation, or advisory decision
  workflow;
- the temporary retention of application-created E2E rows and later review
  of their audit-preserving cleanup status.

This authorization does not include fixture apply, production Auth creation,
production data mutation, direct database changes, schema/migration changes,
source changes, deployment, merge, or main-branch pushes.

## Readiness result

READY WITH NON-BLOCKING OBSERVATIONS
