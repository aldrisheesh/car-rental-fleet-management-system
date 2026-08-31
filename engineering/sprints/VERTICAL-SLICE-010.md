# Vertical Slice 010 — Vehicle Release and Rental Start

**Status:** Approved for implementation  
**Objective:** Establish the canonical vehicle-turnover event and active-rental foundation for an already Confirmed booking, while preserving unresolved Briah-specific turnover, financial-release, vehicle-status, and return/settlement rules as explicit client clarifications.

## Purpose

VS001–VS009 established the complete pre-rental chain:

- authentication and roles;
- canonical customer profiles;
- branches and vehicles;
- booking requests;
- renter requirements;
- requirement verification;
- down-payment submission;
- manual payment verification;
- final vehicle assignment;
- booking confirmation.

VS010 introduces the first canonical **rental transaction**.

A Confirmed booking is still a reservation.

A rental becomes active only after Owner/Admin explicitly records vehicle turnover/release.

This slice must establish:

- canonical rental-transaction persistence;
- Owner/Admin-only release;
- release-time revalidation;
- assigned-vehicle stability;
- duplicate active-rental prevention;
- vehicle-level concurrency protection;
- release condition/fuel/odometer snapshot;
- customer visibility of the active rental.

This slice must not implement return or settlement.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/03-workflows-and-status-rules.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/14-client-clarification-register.md`
- `codex-context/15-vehicle-assignment-and-booking-confirmation.md`
- `codex-context/16-rental-release-and-start.md`
- this slice contract.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

Inspect existing booking/payment/requirement implementations only as necessary to resolve canonical state.

## Core Boundary

The workflow entering VS010 is:

```text
Booking Confirmed
       ↓
assigned vehicle remains canonical
       ↓
Owner/Admin records vehicle turnover
       ↓
canonical rental transaction created
       ↓
started_at != null
ended_at = null
       ↓
Active Rental
```

Do not represent rental start by changing booking status to:

- `Ongoing`
- `Active`
- `Released`
- `Rented`

Booking status remains:

`Confirmed`

The active rental is a separate canonical entity.

## Authority

### Owner/Admin

May:

- inspect Confirmed bookings awaiting release;
- record turnover information;
- explicitly release the assigned vehicle;
- read active rental details.

### Customer/Renter

May:

- read their own rental/release status;
- see assigned vehicle;
- see actual release/start timestamp;
- see scheduled return timestamp.

May not:

- create a rental;
- perform release;
- change release data;
- choose a different vehicle.

### Operations Staff

For VS010, Operations Staff may not perform final vehicle release.

`CQ-016` remains unresolved.

Use least privilege.

Do not grant release authority merely because Staff can coordinate reservations.

## Canonical Rental Transaction

Create an additive migration for a canonical rental entity/table.

Use repository naming conventions.

Each rental transaction must belong to exactly one canonical booking.

At minimum persist:

- canonical rental ID;
- `booking_id`;
- `customer_id` or safe derivable ownership;
- assigned vehicle ID snapshot;
- scheduled pickup timestamp snapshot;
- scheduled return timestamp snapshot;
- `started_at`;
- `ended_at` nullable;
- `released_by`;
- release odometer nullable;
- release fuel level/status;
- release condition summary;
- existing-damage/condition notes nullable;
- applicable turnover acknowledgement fields;
- `created_at`;
- `updated_at`.

Do not add speculative settlement/return fields merely for convenience.

A future slice may extend the rental record additively.

## One Rental per Booking

A booking must not receive duplicate active rental transactions.

Prefer a database-level invariant ensuring that a canonical booking cannot have multiple rental records for the same baseline rental transaction.

If the intended data model supports exactly one rental transaction per booking, enforce uniqueness on:

`booking_id`

Do not rely only on UI disabling.

## Active Rental Definition

For the current baseline:

```text
ActiveRental =
started_at IS NOT NULL
AND ended_at IS NULL
```

Do not create a full rental lifecycle enum in VS010.

Do not invent:

- `Ongoing`
- `Returned`
- `Completed`
- `Closed`

as canonical rental statuses.

The later return/settlement slice will freeze closure semantics.

## Release Preconditions

Vehicle release may succeed only when all applicable checks pass at the trusted server/database boundary.

At minimum require:

1. authenticated principal is active Owner/Admin;
2. booking exists;
3. booking status = `Confirmed`;
4. booking has an assigned vehicle;
5. assigned vehicle exists;
6. assigned vehicle is active;
7. no existing rental already exists for this booking;
8. no other active rental exists for this assigned vehicle;
9. release applies to the current canonical assignment/confirmation context;
10. Owner/Admin explicitly performs Release Vehicle.

Do not trust client-supplied booking status or vehicle ownership.

## Requirement and Payment Boundary

Do not independently reproduce the full VS007/VS008 review logic during release.

The `Confirmed` booking is authoritative evidence that the pre-confirmation requirement/payment gates previously passed.

Do not allow release of a non-Confirmed booking even if the client claims requirement/payment are Verified.

## Financial Release Rules — CQ-002 / CQ-003 / CQ-019

The exact Briah policy for:

- security deposit;
- remaining 50% balance;
- mandatory financial prerequisites before turnover

is not yet confirmed.

Therefore VS010 must not invent a hard financial release condition.

Do not block release based on speculative:

```text
remaining_balance_paid = true
security_deposit_paid = true
```

unless those canonical capabilities already exist and an approved rule explicitly requires them.

The provisional baseline allows an eligible Confirmed booking to proceed to turnover while `CQ-019` remains open.

Do not represent this provisional behavior as final Briah policy.

## Assignment Stability

Release must use the vehicle currently assigned to the Confirmed booking.

The release request must not accept a freely selectable vehicle ID as authoritative truth.

Include stale-context protection.

The trusted request should carry the canonical assignment/confirmation context that Owner/Admin reviewed, such as:

- expected assigned vehicle ID;
- expected `confirmed_at`;
- and/or another stable canonical assignment token already supported by the implementation.

At release time:

- re-read booking;
- require current assigned vehicle matches expectation;
- require current confirmation context matches expectation.

If it changed:

reject as stale and require reload.

## Vehicle Concurrency

The release transaction must prevent:

```text
same vehicle
     ↓
Rental A active
AND
Rental B active
```

Use the smallest reliable PostgreSQL locking strategy.

Prefer acquiring an advisory transaction lock keyed by the assigned vehicle ID, consistent with VS009 where appropriate.

After acquiring the vehicle lock, recheck whether another active rental exists.

Do not depend solely on a query performed before locking.

## Booking Concurrency

Lock the Confirmed booking during release.

Two Owner/Admin sessions attempting to release the same booking must not create duplicate rentals.

One should succeed; the other must receive a controlled already-released/stale response.

## Release Timestamp

`started_at` is the canonical actual vehicle-release/rental-start timestamp.

It must be server/database controlled.

Do not allow the browser to freely choose `started_at`.

Use the actual successful release time.

Scheduled pickup remains a separate booking snapshot.

## Scheduled Rental Snapshot

Persist the booking's currently canonical:

- scheduled pickup timestamp;
- scheduled return timestamp;

into the rental transaction where useful for historical integrity.

Do not allow the client to alter the scheduled interval during vehicle release.

Rental extension belongs to a later slice.

## Release Odometer

Under `CQ-020`, exact Briah odometer requirements remain open.

For VS010:

- release odometer is optional;
- when supplied, require numeric non-negative kilometers;
- use sensible precision;
- reject malformed or negative values.

If an authoritative vehicle mileage/odometer field already exists and updating it is safe:

- do not reduce the master mileage value;
- update it only if the release reading is valid and consistent.

If master mileage semantics are unclear, persist the rental snapshot without inventing master-record behavior.

## Release Fuel Snapshot

Use a simple provisional turnover fuel value.

Allowed baseline values:

- `Empty`
- `1/4`
- `1/2`
- `3/4`
- `Full`
- `Other/Unknown`

This is a **snapshot**, not a fuel-charge rule.

Do not:

- compute fuel costs;
- enforce return fuel settlement;
- imply this is Briah's final measurement convention.

`CQ-020` and `CQ-013` remain open.

## Vehicle Condition

Allow Owner/Admin to record a concise release condition summary.

Support:

- general release condition;
- known existing damage/condition notes.

The purpose is to establish a turnover baseline for a future return inspection.

Do not:

- perform automated image assessment;
- calculate damage charges;
- classify repair responsibility automatically.

## Turnover Acknowledgements

The manuscript identifies coordination around:

- rental agreement;
- existing damages/condition;
- return schedule;
- important reminders;
- penalties.

VS010 may persist simple boolean acknowledgement fields such as:

- agreement coordinated/acknowledged;
- existing condition reviewed;
- return schedule/reminders explained.

These are operational checklist indicators only.

Do not treat them as:

- legal digital signatures;
- electronic contract acceptance;
- payment settlement;
- final proof of customer consent.

## CQ-008 Boundary

The exact Briah turnover checklist is not confirmed.

The VS010 checklist is therefore intentionally minimal.

Do not add many speculative mandatory checklist items.

Keep the implementation easy to revise after client presentation.

## Release Mutation

Create a focused authenticated server/API boundary for release.

At minimum support:

- Owner/Admin list/read Confirmed bookings awaiting release;
- Owner/Admin perform release;
- Owner/Admin read active rentals;
- Customer/Renter read own active rental where appropriate.

Operations Staff must not gain the final release mutation.

## Transactional Release

Prefer a PostgreSQL RPC/function for the final release transition.

Within one transaction, the operation should:

1. authorize active Owner/Admin;
2. lock target booking;
3. require `Confirmed`;
4. validate expected assignment/confirmation snapshot;
5. resolve assigned vehicle;
6. require vehicle active;
7. acquire vehicle-level transaction/advisory lock;
8. recheck no rental exists for booking;
9. recheck no other active rental exists for vehicle;
10. validate release snapshot inputs;
11. create canonical rental transaction;
12. set database-controlled `started_at`;
13. return canonical rental.

Do not partially create an active rental.

## Database Authorization

Use additive migrations.

Apply least privilege and RLS where appropriate.

Customer must not be able to:

- insert their own rental;
- release a vehicle directly;
- modify another customer's rental;
- choose arbitrary ownership/vehicle;
- set `released_by`.

Operations Staff must not receive release mutation rights.

## Vehicle Master Status

Do not introduce a final vehicle operational lifecycle enum in VS010.

If the UI needs a label, it may derive:

```text
Active rental exists → Currently rented
```

as presentation state.

Do not persist prototype status vocabulary merely to display it.

## Vehicle Branch

Do not change:

`vehicles.branch_id`

when rental starts.

Assignment/release is not automatically a canonical branch transfer.

`CQ-017` remains open.

## Customer UI

Extend the existing Customer/Renter booking area minimally.

For a booking with a rental record, show:

- booking Confirmed;
- assigned vehicle;
- actual release/start timestamp;
- scheduled return timestamp;
- a clear indication that the rental is active.

Do not expose:

- `released_by`;
- internal release notes if administrative;
- other customers' rental records.

Do not broadly redesign the customer portal.

## Owner/Admin UI

Extend the existing booking/admin area or an existing rental screen with the minimum turnover workflow.

A Confirmed booking awaiting release should allow Owner/Admin to view:

- customer;
- assigned vehicle;
- scheduled pickup;
- scheduled return;
- confirmation information;
- release odometer input;
- fuel snapshot input;
- condition/existing-damage notes;
- turnover acknowledgement controls;
- explicit Release Vehicle action.

After successful release:

- show the canonical active rental;
- do not continue into return/settlement.

## Operations Staff UI

Do not add final release controls for Staff.

If active rental state is needed for permitted reservation coordination, a safe non-payment/read-only derived status may be shown.

Do not expose unrelated sensitive information.

## External Tracking

Do not implement or simulate integration with:

- AKSH GPS;
- Apple Find My;
- AirTag;
- other live tracking systems.

Do not pretend the app is actively tracking a released vehicle.

## Error Handling

Handle at minimum:

- unauthenticated request;
- wrong role;
- booking not found;
- booking not Confirmed;
- no assigned vehicle;
- inactive/missing vehicle;
- stale assignment/confirmation context;
- booking already released;
- vehicle already has another active rental;
- invalid odometer;
- invalid fuel level;
- database/provider failure;
- concurrent release conflict.

Use controlled errors.

Do not expose raw SQL or internal stack traces.

## Testing

Add focused tests where practical for:

- Owner/Admin-only release;
- Customer cannot release;
- Operations Staff cannot release;
- non-Confirmed booking rejected;
- unassigned booking rejected;
- inactive vehicle rejected;
- stale assignment/confirmation rejected;
- one rental per booking;
- active-rental vehicle exclusivity;
- concurrent release attempts cannot both succeed;
- server-controlled started_at;
- invalid negative odometer rejected;
- allowed fuel-level values;
- booking remains Confirmed after release;
- rental becomes active via started_at/ended_at;
- vehicle branch remains unchanged;
- no full rental-status enum introduced.

## Provider-Backed Validation

Where configured, verify:

1. eligible Confirmed booking can be released by Owner/Admin;
2. canonical rental record is created;
3. rental references the booking's assigned vehicle;
4. `started_at` is persisted;
5. `ended_at` remains null;
6. second release of same booking fails;
7. another booking cannot start an active rental using the same active-rental vehicle;
8. Customer cannot release;
9. Operations Staff cannot release;
10. customer can see own active rental after reload;
11. booking status remains `Confirmed`;
12. vehicle branch is unchanged;
13. no return/settlement workflow starts automatically.

Use disposable development data where practical.

## Client Clarification Preservation

Do not resolve or remove:

- `CQ-002`;
- `CQ-003`;
- `CQ-008`;
- `CQ-009`;
- `CQ-013`;
- `CQ-016`;
- `CQ-017`;
- `CQ-019`;
- `CQ-020`.

The current release behavior is provisional where those items apply.

## Definition of Done

VS010 is complete when:

- Confirmed booking and rental start are separate canonical events;
- only Owner/Admin can perform final release;
- release uses the currently assigned canonical vehicle;
- stale release context is rejected;
- one canonical rental exists per booking;
- one vehicle cannot have multiple simultaneous active rentals;
- rental start is transactionally/concurrently safe;
- actual start timestamp is canonical;
- release condition/fuel/optional odometer are persisted;
- Customer sees their own active rental;
- booking remains Confirmed;
- no return/settlement/full lifecycle behavior is implemented prematurely;
- client-dependent turnover/financial rules remain explicit clarifications.

## Stop Rule

Stop after Vehicle Release and Rental Start is complete.

Do not implement:

- return processing;
- rental completion;
- remaining-balance settlement;
- security-deposit settlement/refund;
- damage/fuel/late charges;
- rental extensions;
- maintenance lifecycle;
- branch transfer;
- live GPS;
- notifications;
- VS011.