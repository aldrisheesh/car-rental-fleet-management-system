# Vertical Slice 009 — Vehicle Assignment and Booking Confirmation

**Status:** Approved for implementation  
**Objective:** Implement Owner/Admin-controlled final vehicle assignment and explicit booking confirmation for eligible submitted bookings, while preserving unresolved Briah-specific substitution, cross-branch, turnaround, vehicle-lifecycle, and rental-start policies as provisional/open.

## Purpose

VS001–VS008 established:

- canonical authentication and roles;
- branch and vehicle master data;
- customer profiles;
- booking requests;
- secure renter requirements;
- Owner/Admin requirement verification;
- down-payment submission;
- Owner/Admin payment verification.

VS009 connects those completed pre-confirmation capabilities.

The slice must establish:

- Owner/Admin final vehicle assignment;
- requested-vs-assigned vehicle visibility;
- canonical assignment metadata;
- confirmed-booking vehicle conflict checks;
- explicit final booking confirmation;
- transactional revalidation of all confirmation gates;
- customer visibility of the confirmed assignment.

This slice does **not** start the rental lifecycle.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/03-workflows-and-status-rules.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/14-client-clarification-register.md`
- `codex-context/15-vehicle-assignment-and-booking-confirmation.md`
- this slice contract.

Inspect payment/requirement implementations only as necessary to read their canonical states.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

## Authority

### Owner/Admin

May:

- view booking confirmation readiness;
- select a canonical vehicle;
- assign or change the assigned vehicle while the booking remains eligible;
- acknowledge provisional substitution/cross-branch situations;
- explicitly confirm an eligible booking.

### Customer/Renter

May:

- see their requested vehicle;
- see their assigned vehicle when one has been assigned;
- see booking status;
- see whether the assigned vehicle differs from the requested vehicle;
- see a safe customer-facing assignment message where applicable.

May not:

- set `assigned_vehicle_id`;
- change assignment;
- confirm a booking.

### Operations Staff

May not:

- perform final vehicle assignment;
- change final assignment;
- confirm a booking.

Do not broaden Staff permissions while `CQ-016` remains open.

## Booking Eligibility

Assignment and confirmation apply only to bookings whose canonical booking status is:

`Submitted`

Do not implement assignment/confirmation for:

- `Confirmed`
- `Rejected`
- `Cancelled`

Do not implement reopening/reassignment after confirmation.

## Requested Vehicle vs Assigned Vehicle

Preserve:

- `requested_vehicle_id`
- `assigned_vehicle_id`

as separate canonical fields.

Do not overwrite the requested vehicle when Owner/Admin assigns another unit.

The requested vehicle remains historical/customer-intent data.

## Assignment Candidate Source

Vehicle options must come from canonical persisted vehicle/master data.

Do not use prototype/mock vehicle arrays.

At minimum, assignment candidates must:

- exist;
- be active.

Where existing canonical category/branch information is useful, display it to Owner/Admin.

Do not treat prototype presentation statuses such as `Available` as final business truth unless backed by an implemented authoritative rule.

## Baseline Conflict Rule

A candidate vehicle cannot be considered assignable for the target booking when another canonical booking is:

- `Confirmed`;
- assigned to that same vehicle;
- overlapping the target booking's requested interval.

Use:

`[pickup_at, return_at)`

and overlap:

`candidate_pickup < existing_return AND candidate_return > existing_pickup`

Do not introduce an arbitrary preparation/turnaround buffer.

`CQ-018` remains open.

## Submitted Requests Do Not Reserve Vehicles

Other `Submitted` bookings must not automatically block a vehicle.

For VS009, the authoritative booking conflict is another overlapping:

`Confirmed`

booking assigned to the same vehicle.

Do not invent request holds or reservation expiries.

## Assignment-Time Validation

Before assigning a vehicle, trusted server logic must verify:

1. authenticated principal is active Owner/Admin;
2. target booking exists;
3. booking status = `Submitted`;
4. selected vehicle exists;
5. vehicle is active;
6. no overlapping Confirmed booking currently makes the vehicle ineligible.

When canonical maintenance-readiness information is already available through implemented data, enforce it.

If the maintenance subsystem is not yet implemented sufficiently to determine canonical readiness, do not fabricate maintenance readiness.

The UI may state that maintenance-readiness integration is pending rather than falsely indicating that it passed.

## Assignment Persistence

Persist assignment metadata additively.

At minimum:

- `assigned_vehicle_id`;
- `assigned_by`;
- `assigned_at`;
- assignment/substitution note where required;
- updated timestamp.

Use canonical Owner/Admin user ID for `assigned_by`.

When Owner/Admin changes assignment before confirmation:

- replace the current assigned vehicle;
- refresh `assigned_by`;
- refresh `assigned_at`;
- preserve requested vehicle;
- update the applicable assignment note.

Do not create fake client-only assignment IDs.

## Same-Vehicle Assignment

If:

`assigned_vehicle_id = requested_vehicle_id`

no substitution acknowledgement is necessary.

Cross-branch acknowledgement may still be required if applicable.

## Provisional Vehicle Substitution — CQ-007

Until Briah's confirms the permanent substitution policy:

Owner/Admin may explicitly assign a vehicle different from `requested_vehicle_id`.

When doing so:

- show a visible substitution warning;
- require explicit acknowledgement;
- require a concise assignment/substitution note;
- persist that note with the assignment.

Do not:

- automatically choose a replacement vehicle;
- automatically claim customer acceptance;
- implement a customer substitution-approval workflow;
- describe substitution as confirmed Briah's policy.

The UI should make the provisional nature clear where practical without disrupting the operational workflow.

## Provisional Cross-Branch Assignment — CQ-017

If:

`vehicle.branch_id != booking.pickup_branch_id`

do not automatically reject the assignment.

Instead:

- visibly indicate the branch mismatch;
- require Owner/Admin acknowledgement;
- require a concise note if one is not already required by substitution;
- persist the acknowledgement/note with assignment context.

Do not:

- mutate `vehicle.branch_id`;
- create an automatic branch transfer;
- claim that repositioning has happened.

`CQ-017` remains client-dependent.

## Maintenance-Readiness Boundary

`04-data-and-business-rules.md` already defines maintenance readiness.

However, VS009 must only enforce it if the canonical records needed to determine it have already been implemented.

Do not create a fake:

`maintenance_ready = true`

default.

If readiness cannot yet be authoritatively determined, the confirmation implementation must not claim that the maintenance gate was digitally verified.

Do not build the maintenance subsystem inside VS009.

## Assignment Does Not Confirm

Successfully assigning a vehicle must leave:

`booking_status = Submitted`

Assignment alone does not confirm the booking.

Final confirmation is a separate explicit Owner/Admin action.

## Confirmation Gate

Permit:

`Submitted → Confirmed`

only when all currently applicable canonical gates pass.

At minimum:

1. authenticated principal is active Owner/Admin;
2. booking exists;
3. booking status = `Submitted`;
4. requirement set status = `Verified`;
5. payment status = `Verified`;
6. `assigned_vehicle_id` exists;
7. assigned vehicle exists;
8. assigned vehicle is active;
9. no overlapping `Confirmed` booking uses that vehicle;
10. all applicable substitution/cross-branch acknowledgement requirements have been satisfied;
11. Owner/Admin explicitly performs Confirm.

When implemented canonical maintenance-readiness data exists, also require:

12. assigned vehicle is maintenance-ready.

Do not confirm if any applicable gate fails.

## Requirement Status Source

Read the canonical booking-linked requirement set established by VS006/VS007.

Do not trust:

- client-supplied requirement status;
- cached presentation state;
- UI labels.

Requirement status must be re-read at confirmation time.

## Payment Status Source

Read the canonical booking-linked initial-down-payment record established by VS008.

Require:

`Verified`

Do not trust:

- client-supplied payment status;
- payment page state;
- mock `Paid` values.

Payment status must be re-read at confirmation time.

## Transactional Confirmation

Final confirmation must execute through a trusted transactional database/server boundary.

The confirmation operation must atomically:

1. lock/re-read the target booking;
2. verify it is still `Submitted`;
3. re-read requirement status;
4. re-read payment status;
5. re-read assigned vehicle;
6. validate assigned vehicle is active;
7. recheck overlapping Confirmed bookings;
8. validate applicable assignment acknowledgement conditions;
9. validate maintenance readiness if canonical readiness is available;
10. update booking status to `Confirmed`;
11. record confirmation metadata.

Persist at minimum:

- `confirmed_by`;
- `confirmed_at`.

Do not rely only on UI checks performed before the transaction.

## Vehicle-Level Concurrency

Protect against two overlapping bookings being confirmed for the same vehicle at nearly the same time.

Use the smallest reliable mechanism, such as:

- transaction/advisory lock keyed by vehicle ID;
- equivalent PostgreSQL locking strategy.

After acquiring the relevant lock, repeat the overlap query before confirmation.

Two conflicting overlapping bookings must not both become `Confirmed`.

## Confirmation-Time Assignment Stability

The confirmation operation must apply to the currently assigned vehicle.

If the assignment changes between UI load and confirmation:

- reject the stale confirmation;
- require Owner/Admin to reload/review.

Where useful, include expected `assigned_vehicle_id` or assignment timestamp/version in the confirmation request and compare it to current canonical state.

Do not confirm a different vehicle than the reviewer saw.

## Confirmation Metadata

Persist confirmation data separately from ordinary booking creation data.

At minimum:

- `confirmed_by`;
- `confirmed_at`;
- booking status = `Confirmed`.

Do not modify:

- requested vehicle;
- customer ownership;
- payment verification history;
- requirement review history.

## Admin Booking UI Integration

Extend the existing Owner/Admin booking-management surface with the smallest practical assignment/confirmation workflow.

For a selected Submitted booking, show at minimum:

- customer;
- requested vehicle;
- requested dates;
- pickup/return branch;
- requirement status;
- payment status;
- currently assigned vehicle;
- candidate active vehicles;
- conflict availability indication;
- branch mismatch warning;
- substitution warning where applicable;
- assignment note/acknowledgement controls;
- Assign / Change Assignment action;
- Confirm Booking action.

Do not broadly redesign `/admin/bookings`.

## Readiness Presentation

Show confirmation gates individually where useful:

```text id="eygs9q"
Requirements       Verified / Not ready
Payment            Verified / Not ready
Vehicle assigned   Ready / Not ready
Conflict check     Clear / Conflict
Assignment notes   Complete / Required
Maintenance        Verified / Not yet digitally available
```

The UI may disable confirmation based on current data for UX.

The server/database must still independently revalidate everything.

## Customer Booking UI Integration

After assignment/confirmation, the authenticated customer should see canonical booking state.

For their booking, present at minimum:

- status;
- requested vehicle;
- assigned vehicle when set.

If assigned differs from requested:

- make the difference clear;
- show only the safe customer-facing assignment note/message if appropriate.

Do not expose:

- `assigned_by`;
- `confirmed_by`;
- internal acknowledgement flags;
- internal-only administrative notes.

## Operations Staff View

Do not expose assignment/confirmation mutations.

If the existing Staff booking read view shows assigned vehicle after Owner/Admin assigns it, that is acceptable as non-sensitive reservation coordination information.

Staff must still not see payment-sensitive details.

## Booking Confirmation Does Not Change Vehicle Master Branch

Do not update canonical `vehicles.branch_id` because of a booking assignment or confirmation.

Vehicle repositioning/branch transfer belongs to its own operational workflow.

## Booking Confirmation Does Not Start Rental

After confirmation:

```text id="qu3jxz"
booking_status = Confirmed
```

Do not:

- create an active rental automatically;
- mark vehicle `Rented`;
- record release odometer;
- record release fuel;
- settle remaining balance;
- settle security deposit;
- start utilization rental-day counting.

Those belong to later slices.

## Error Handling

Handle at minimum:

- unauthenticated access;
- wrong role;
- booking not found;
- booking no longer Submitted;
- inactive/nonexistent vehicle;
- conflicting Confirmed booking;
- stale assignment;
- requirement not Verified;
- payment not Verified;
- assignment missing;
- missing required substitution acknowledgement;
- missing required cross-branch acknowledgement;
- provider/database failure;
- concurrent confirmation conflict.

Return controlled user-facing errors.

Do not expose raw SQL or internal database details.

## Testing

Add focused tests where practical for:

- Owner/Admin-only assignment;
- Customer cannot assign;
- Operations Staff cannot assign;
- inactive vehicle rejection;
- overlapping Confirmed booking conflict detection;
- non-overlapping interval allowed;
- exact-end/exact-start does not overlap under the provisional no-buffer rule;
- Submitted requests do not block assignment;
- requested vehicle remains unchanged after different assignment;
- substitution requires acknowledgement/note;
- cross-branch assignment requires acknowledgement/note;
- assignment does not confirm booking;
- requirements must be Verified;
- payment must be Verified;
- vehicle must be assigned;
- stale assignment confirmation rejected;
- final conflict recheck;
- concurrent overlapping confirmations cannot both succeed;
- confirmation persists `confirmed_by` / `confirmed_at`;
- confirmation does not start rental;
- Customer/Staff cannot perform confirmation.

## Provider-Backed Validation

Where configured, validate at minimum:

1. Owner/Admin can assign an eligible active vehicle;
2. assignment survives reload;
3. requested vehicle remains unchanged;
4. Customer/Renter cannot assign;
5. Operations Staff cannot assign;
6. conflicting confirmed assignment is rejected;
7. non-overlapping confirmed assignment is allowed;
8. requirements not Verified blocks confirmation;
9. payment not Verified blocks confirmation;
10. missing assignment blocks confirmation;
11. eligible booking can be explicitly confirmed;
12. `confirmed_by` and `confirmed_at` persist;
13. customer sees Confirmed + assigned vehicle after reload;
14. booking confirmation does not create/start a rental;
15. vehicle master branch is not mutated.

Use disposable development bookings/vehicles where practical.

## Client Clarification Preservation

Do not resolve or remove:

- `CQ-007`;
- `CQ-008`;
- `CQ-009`;
- `CQ-017`;
- `CQ-018`.

VS009's substitution, cross-branch, and no-turnaround-buffer behavior is provisional where explicitly stated.

## Definition of Done

VS009 is complete when:

- Owner/Admin can assign a canonical active vehicle to a Submitted booking;
- assignment is separate from requested vehicle;
- overlapping Confirmed vehicle conflicts are enforced;
- substitution/cross-branch provisional warnings are handled explicitly;
- assignment alone leaves the booking Submitted;
- final confirmation transactionally requires Verified requirements, Verified payment, assigned active/conflict-free vehicle, and explicit Owner/Admin action;
- concurrent conflicting bookings cannot both confirm;
- customer sees canonical assigned vehicle/Confirmed status;
- Operations Staff/Customer cannot assign or confirm;
- confirmation does not start rental or mutate vehicle master branch;
- unresolved Briah-specific policies remain tracked as client clarifications.

## Stop Rule

Stop after Vehicle Assignment and Booking Confirmation is complete.

Do not implement:

- vehicle release/turnover;
- active rental lifecycle;
- remaining-balance/security-deposit settlement;
- extension;
- return processing;
- maintenance lifecycle;
- branch-transfer execution;
- notifications;
- VS010.