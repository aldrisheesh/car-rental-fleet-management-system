# Vehicle Release and Rental Start Specification

**Status:** Frozen for Baseline Vehicle Release / Rental Start  
**Last updated:** 2026-09-01

This document defines the minimum authoritative behavior required to record vehicle turnover and begin a canonical active rental after a booking has already been Confirmed.

It intentionally does **not** freeze the complete rental lifecycle, return/settlement workflow, or final vehicle operational-status vocabulary.

Client-specific turnover and financial-release details remain tracked in `14-client-clarification-register.md`.

## 1. Source-Aligned Baseline

The manuscript establishes that before vehicle turnover the selected vehicle is prepared and checked, including:

- vehicle availability;
- physical condition;
- existing damages;
- fuel status;
- rental agreement coordination;
- possible penalties;
- return schedule;
- important rental reminders.

The manuscript also distinguishes vehicle release from later active-rental monitoring and from return/settlement.

Therefore, the system must preserve a separate explicit vehicle-release event rather than treating booking confirmation as rental start.

## 2. Authority

For the current baseline, only `Owner/Admin` may perform the final vehicle-release / rental-start action.

Operations Staff may assist with reservation coordination only within already-frozen permissions, but must not receive final release authority until the client clarifies the exact Staff scope under `CQ-016`.

Customer/Renter may view their own release/rental state but may not create or modify the release record.

## 3. Precondition

A release may be recorded only when:

1. booking exists;
2. booking status = `Confirmed`;
3. booking has a canonical assigned vehicle;
4. assigned vehicle exists and is active;
5. no active rental already exists for that booking;
6. no other active rental currently exists for that assigned vehicle;
7. Owner/Admin explicitly performs the release action.

Requirement/payment checks do not need to be independently reinterpreted here because the Confirmed booking already passed the VS009 confirmation gate. The release transaction should still rely on the canonical Confirmed booking rather than client-supplied claims.

## 4. Booking Confirmation Is Not Rental Start

`booking_status = Confirmed` does not mean a rental is active.

A rental begins only when the canonical vehicle-release action succeeds.

Do not change booking status to prototype values such as:

- `Ongoing`
- `Active`
- `Released`

The booking may remain `Confirmed` while the separate rental transaction represents active rental state.

## 5. Canonical Rental Transaction Foundation

Create a canonical rental-transaction entity associated with exactly one booking.

At minimum preserve:

- canonical rental ID;
- booking ID;
- customer ID or safely derivable ownership;
- assigned vehicle ID snapshot;
- scheduled pickup timestamp snapshot;
- scheduled return timestamp snapshot;
- released/started timestamp;
- released by Owner/Admin;
- release odometer reading when recorded;
- release fuel status/level;
- release vehicle-condition summary;
- existing-damage/condition notes;
- agreement/reminder acknowledgement fields where implemented;
- created timestamp;
- updated timestamp.

The exact return/settlement fields may be added later through additive migrations.

A booking must not silently create multiple active rental transactions.

## 6. Active Rental Semantics Without Freezing a Full Lifecycle Enum

Do not invent the full rental lifecycle status machine in VS010.

For the baseline, an active rental can be derived from canonical timestamps:

`started_at IS NOT NULL AND ended_at IS NULL`

A future return/settlement slice may add/freeze the completion semantics and any lifecycle vocabulary after client validation.

This approach allows real rental activity to exist without prematurely freezing statuses such as `Ongoing`, `Returned`, `Completed`, or `Closed`.

## 7. Release Snapshot

The release record represents what was recorded at turnover.

### Vehicle

The rental must use the booking's current canonical `assigned_vehicle_id`.

Do not accept an arbitrary vehicle ID from the client as rental truth.

### Odometer

A release odometer reading may be recorded in kilometers.

Until Briah's confirms whether an odometer reading is always mandatory at turnover, treat it as optional but validate it when supplied:

- numeric;
- non-negative;
- reasonable database precision;
- must not silently reduce the canonical vehicle mileage if the implementation also updates a master mileage value.

Do not invent a mandatory odometer rule.

### Fuel

Fuel status is known to be checked before turnover, but Briah's exact fuel measurement convention is not yet documented.

Use a conservative presentation/reference value rather than inventing a charge formula.

A safe initial implementation may record a normalized descriptive value such as:

- `Empty`
- `1/4`
- `1/2`
- `3/4`
- `Full`
- `Other/Unknown`

if the current vertical slice explicitly uses this provisional list.

This is a turnover snapshot only. It does not freeze the later fuel-return charging policy under `CQ-013`.

### Vehicle Condition

Record a concise release condition summary and/or notes.

The system should support documenting known existing damage/condition before release so later return inspection can compare against the recorded baseline.

Do not implement automated damage assessment.

## 8. Agreement / Reminder Acknowledgement

The manuscript states that the rental agreement, possible penalties, existing damages, return schedule, and important reminders are explained before vehicle release.

The baseline system may record simple acknowledgements such as:

- rental agreement coordinated/acknowledged;
- existing damage/condition reviewed;
- return schedule/reminders explained.

These acknowledgements indicate that the turnover step was recorded; they do not replace the legal rental agreement itself.

Do not invent digital-signature/legal-contract semantics unless separately approved.

## 9. Financial Release Gate — Provisional Boundary

The client-specific relationship between vehicle release and:

- remaining balance;
- security deposit;
- other pre-release financial settlement

is not fully confirmed.

See:

- `CQ-002`
- `CQ-003`
- `CQ-019`

Therefore VS010 must **not invent** a hard financial gate such as "remaining balance must be fully paid" unless later client validation confirms it.

The existing verified down payment/Confirmed booking remains sufficient for the provisional system release workflow.

If the UI needs to show financial-release status, label unresolved items as requiring client/business confirmation rather than fabricating a paid state.

## 10. Release-Time Vehicle Revalidation

At release time, trusted server/database logic must re-read:

- booking;
- booking status;
- assigned vehicle;
- vehicle active state;
- existing active rental for the booking;
- existing active rental for the vehicle.

Do not rely solely on UI state loaded earlier.

## 11. Assignment Stability

Release must apply to the same vehicle currently assigned to the Confirmed booking.

The request should carry an expected assignment snapshot such as:

- expected assigned vehicle ID;
- expected booking confirmation timestamp or another stable confirmation/assignment token.

If the booking assignment/context differs from what the reviewer saw, reject the stale release action and require reload.

Do not permit the release endpoint to choose a different vehicle.

## 12. Transactional / Concurrency Safety

The release operation must be atomic.

Use the smallest reliable PostgreSQL transaction/locking strategy so that:

- the same booking cannot be released twice;
- the same vehicle cannot have two simultaneous active rental records;
- two Owner/Admin sessions cannot both start conflicting rental transactions.

Where practical, lock/serialize using the assigned vehicle ID and booking row before inserting the canonical rental record.

## 13. Vehicle Master Record

Vehicle release may update a canonical mileage/odometer field only if such a field already exists and the update is semantically safe.

Do not invent or freeze the full vehicle operational-status state machine.

Do not mutate vehicle branch merely because the vehicle was released.

If the UI derives that the vehicle is "Currently Rented" because an active rental exists, that is acceptable as a derived presentation state.

## 14. External GPS / Monitoring Boundary

The system does not replace or directly integrate the client's external GPS-related tools in this baseline.

Starting a rental does not need to call:

- AKSH GPS;
- Apple Find My;
- AirTags;
- other tracking hardware.

The system may later record monitoring-related operational notes, but VS010 does not implement live GPS tracking.

## 15. Customer Visibility

Customer/Renter may see for their own rental:

- booking status;
- assigned vehicle;
- whether vehicle has been released;
- actual release/start timestamp;
- scheduled return timestamp.

Do not expose:

- internal Owner/Admin IDs;
- internal-only condition remarks if intentionally marked administrative;
- unrelated customer/rental records.

## 16. Owner/Admin UI

The existing admin booking/rental area should minimally support:

1. selecting a Confirmed booking;
2. seeing the assigned vehicle;
3. seeing scheduled pickup/return;
4. recording release condition/fuel and optional odometer;
5. recording known existing damage/condition notes;
6. recording applicable agreement/reminder acknowledgements;
7. explicitly confirming vehicle release;
8. seeing the resulting active rental.

Do not broadly redesign unrelated admin modules.

## 17. Operations Staff

Until `CQ-016` is confirmed, Operations Staff may not perform final release.

A later client-confirmed role update may allow Staff to record selected turnover details, but VS010 uses least privilege.

## 18. Rental Start and Analytics

A successful release creates the canonical basis for later:

- active-rental monitoring;
- rental-day utilization;
- idle-vehicle calculation after return;
- return/settlement.

Do not calculate completed rental days or close the rental in VS010.

## 19. Out of Scope

Do not implement:

- full rental lifecycle status enum;
- vehicle return;
- settlement;
- remaining-balance payment processing;
- security-deposit settlement/refund;
- damage charge calculation;
- fuel shortage charge;
- late-return penalty;
- rental extension;
- vehicle return-to-available workflow;
- live GPS integration;
- maintenance lifecycle;
- notifications unless separately approved.

## 20. Client Clarification Links

Preserve:

- `CQ-002` — security deposit;
- `CQ-003` — remaining balance timing;
- `CQ-008` — exact turnover checklist and official rental-start event;
- `CQ-009` — vehicle operational statuses;
- `CQ-013` — fuel return policy;
- `CQ-016` — Operations Staff editable/action scope;
- `CQ-019` — exact financial prerequisites before vehicle release;
- `CQ-020` — odometer/fuel recording conventions at turnover.

The baseline release action is provisional where these client-specific details remain unanswered.

## 21. Warning to Codex

Do not:

- start a rental merely because a booking is Confirmed;
- let Customer or Operations Staff perform final release;
- accept arbitrary customer/vehicle ownership from client input;
- create multiple active rentals for one booking/vehicle;
- invent final rental statuses;
- invent security-deposit or remaining-balance gates;
- invent fuel charges;
- mutate vehicle branch;
- claim external GPS integration;
- present provisional CQ behavior as client-confirmed truth.
