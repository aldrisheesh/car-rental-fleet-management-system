# Vehicle Assignment and Booking Confirmation Specification

**Status:** Frozen for Baseline Vehicle Assignment and Booking Confirmation  
**Last updated:** 2026-09-01

This document defines the minimum authoritative rules needed to assign a canonical vehicle to a booking and explicitly confirm that booking. It does **not** define the full vehicle operational lifecycle or rental lifecycle.

Client-specific assignment/substitution details remain tracked in `14-client-clarification-register.md`.

## Authority

Only `Owner/Admin` may assign the final vehicle and perform final booking confirmation. Operations Staff and Customer/Renter may not assign or confirm.

## Requested vs Assigned Vehicle

Keep separate:

- `requested_vehicle_id` — customer preference/request;
- `assigned_vehicle_id` — Owner/Admin-selected vehicle.

Never overwrite the requested vehicle to represent assignment.

Until `CQ-007` is confirmed, Owner/Admin may provisionally assign a different active vehicle. When assigned differs from requested:

- visibly identify the substitution;
- require explicit acknowledgement;
- record a concise assignment/substitution note;
- do not present unrestricted substitution as client-confirmed policy;
- do not invent an automatic customer-approval workflow.

## Booking State

Assignment/confirmation applies to a booking currently `Submitted`.

Do not implement reassignment/reopening for `Confirmed`, `Rejected`, or `Cancelled` bookings unless later frozen.

## Baseline Assignment Eligibility

A candidate vehicle may be assigned only when:

1. the vehicle exists canonically;
2. the vehicle is active;
3. the target booking exists and is `Submitted`;
4. no other `Confirmed` booking assigned to that same vehicle overlaps the target rental interval.

When canonical maintenance-readiness records exist, maintenance readiness must also pass according to `04-data-and-business-rules.md`.

If the maintenance subsystem has not yet been implemented, do not fabricate maintenance readiness. The current assignment slice may proceed using the implemented active/conflict gates while clearly not claiming maintenance was system-verified.

## Booking Interval / Conflict Rule

Treat booking intervals as half-open:

`[pickup_at, return_at)`

Two intervals overlap when:

`candidate_pickup < existing_return AND candidate_return > existing_pickup`

A vehicle assigned to an overlapping `Confirmed` booking is not eligible.

A `Submitted` request does not itself reserve/block the requested vehicle.

No turnaround/preparation buffer is frozen yet. This is tracked in `CQ-018`.

## Assignment Persistence

Persist at minimum:

- `assigned_vehicle_id`;
- `assigned_by`;
- `assigned_at`;
- assignment/substitution note when applicable;
- updated timestamp.

Do not mutate `requested_vehicle_id`.

## Branch Consideration

Exact cross-branch assignment/repositioning remains `CQ-017`.

Until confirmed:

- do not hard-block solely because vehicle `branch_id` differs from booking pickup branch;
- surface the mismatch to Owner/Admin;
- require explicit acknowledgement/note for cross-branch assignment;
- do not mutate vehicle master `branch_id` as a side effect;
- do not claim that branch transfer/repositioning has already occurred.

## Final Booking Confirmation Gate

`Submitted -> Confirmed` is allowed only when all are true at the trusted server/database boundary:

1. booking status = `Submitted`;
2. requirement status = `Verified`;
3. payment status = `Verified`;
4. `assigned_vehicle_id` is non-null;
5. assigned vehicle exists and is active;
6. assigned vehicle has no overlapping `Confirmed` booking;
7. Owner/Admin explicitly performs confirmation.

If canonical maintenance-readiness data exists, it must also pass.

Do not auto-confirm merely because all prerequisites become true.

## Conflict Recheck / Concurrency

Recheck assignment eligibility during final confirmation, inside the same trusted transactional boundary.

At confirmation:

- lock/read the target booking;
- re-read requirement/payment gates;
- re-read the assigned vehicle;
- recheck overlapping confirmed assignments;
- transition to `Confirmed` atomically.

Where practical, serialize confirmations involving the same vehicle so two overlapping bookings cannot both become confirmed concurrently.

## Confirmation Is Not Rental Start

Booking `Confirmed` does not mean:

- vehicle released;
- rental active;
- turnover completed;
- odometer/fuel/condition captured;
- final/remaining balance or security deposit settled.

The rental-start/vehicle-release event remains `CQ-008` and a later lifecycle decision.

## Customer Visibility

Customer may see:

- booking status;
- requested vehicle;
- assigned vehicle;
- that a substitution occurred where applicable;
- a safe customer-facing assignment note where appropriate.

Do not expose internal Owner/Admin IDs or protected payment/requirement review metadata.

## Owner/Admin UI

The booking-management area should minimally allow Owner/Admin to:

1. select a `Submitted` booking;
2. inspect requirement/payment status;
3. see requested vehicle;
4. choose an active canonical vehicle;
5. see conflict and branch-mismatch warnings;
6. explicitly assign;
7. explicitly confirm only when the frozen gate passes.

Preserve the existing UI style; do not broadly redesign the module.

## Operations Staff

Do not give Operations Staff:

- final vehicle assignment;
- final booking confirmation;
- payment-sensitive data;
- raw protected requirement documents.

## Out of Scope

Do not implement:

- vehicle release/turnover;
- rental lifecycle;
- remaining balance/security deposit settlement;
- rental extension;
- return/settlement;
- damage/fuel/late charges;
- full vehicle operational state machine;
- maintenance lifecycle;
- automatic branch transfer;
- automatic substitution;
- customer substitution-approval workflow.

## Warning to Codex

Do not:

- treat requested vehicle as assigned vehicle;
- let Customer/Renter or Operations Staff assign/confirm;
- confirm without Verified requirements and payment;
- skip the conflict recheck at confirmation;
- mutate vehicle master branch from booking assignment;
- mark rental active when booking becomes Confirmed;
- invent a turnaround buffer;
- present `CQ-007`, `CQ-017`, or `CQ-018` assumptions as client-confirmed truth.
