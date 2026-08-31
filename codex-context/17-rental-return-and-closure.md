# Rental Return and Closure Specification

**Status:** Frozen for Baseline Vehicle Return and Rental Closure Foundation  
**Last updated:** 2026-09-01

This document defines the minimum authoritative behavior required to record vehicle return and close an active rental transaction without prematurely freezing Briah's complete settlement, damage-pricing, late-return, fuel-charge, deposit-refund, or extension policies.

Client-specific return and settlement details remain tracked in `14-client-clarification-register.md`.

## 1. Scope

VS011 closes the canonical rental transaction created by VS010.

The baseline must support:

- Owner/Admin recording actual vehicle return;
- return odometer/fuel/condition snapshots;
- comparison against release information;
- recording observed return concerns;
- canonical rental end timestamp;
- prevention of duplicate closure;
- safe customer visibility of completed rental state.

This slice does **not** calculate or settle final financial charges.

## 2. Authority

Only `Owner/Admin` may perform final vehicle return/closure in the current baseline.

Operations Staff must not receive final rental-closure authority until `CQ-016` is confirmed.

Customer/Renter may view their own returned/completed rental state but may not close or modify the rental.

## 3. Rental Eligibility for Return

A rental may be returned only when:

1. canonical rental exists;
2. `started_at IS NOT NULL`;
3. `ended_at IS NULL`;
4. associated booking exists;
5. associated booking remains `Confirmed`;
6. assigned/rental vehicle exists;
7. Owner/Admin explicitly performs the return action.

Do not infer completion merely because the scheduled return timestamp has passed.

## 4. Canonical End Timestamp

`ended_at` is the canonical actual rental-return timestamp.

It must be database/server controlled at the successful return transaction.

Do not allow the browser to freely choose the canonical actual return time.

Scheduled return remains a separate snapshot.

## 5. Rental Completion Semantics

For the baseline:

`ActiveRental = started_at IS NOT NULL AND ended_at IS NULL`

`EndedRental = started_at IS NOT NULL AND ended_at IS NOT NULL`

Do not introduce a broad rental status enum in VS011.

Do not persist prototype values such as:

- `Returned`
- `Completed`
- `Closed`

unless a later specification explicitly freezes them.

A UI may derive labels such as “Active” or “Returned” from the timestamps.

## 6. Return Snapshot

Persist return information separately from the release snapshot.

At minimum support:

- return odometer nullable;
- return fuel level/status;
- return condition summary;
- newly observed damage/condition notes nullable;
- general return remarks nullable;
- returned/closed by Owner/Admin;
- ended_at.

Do not overwrite the original release values.

## 7. Odometer

Until `CQ-020` is confirmed, return odometer remains optional.

When supplied:

- numeric;
- non-negative;
- must not be less than the recorded release odometer when a release reading exists;
- must not reduce canonical vehicle mileage if the implementation updates a vehicle master odometer.

Mileage driven may be derived when both release and return odometers are available:

`DrivenKm = ReturnOdometer - ReleaseOdometer`

Do not fabricate mileage when either value is missing.

## 8. Fuel

Use the same provisional descriptive values established for release:

- `Empty`
- `1/4`
- `1/2`
- `3/4`
- `Full`
- `Other/Unknown`

This is only a return snapshot.

Do not calculate fuel shortage fees while `CQ-013` remains unresolved.

## 9. Condition / Damage

Owner/Admin may record:

- return condition summary;
- newly observed damage/condition concerns;
- general return remarks.

The system may present release-versus-return information side-by-side to assist manual inspection.

Do not:

- automatically determine renter liability;
- automatically calculate damage charges;
- infer that every difference is customer-caused damage;
- implement computer-vision damage assessment.

`CQ-012` remains open.

## 10. Late Return

The system may derive whether the actual return occurred after the scheduled return:

`LateReturn = ended_at > scheduled_return_at`

It may also derive lateness duration for informational display.

Do not automatically calculate the ₱3,000 or any other penalty while `CQ-011` remains unresolved.

The late indicator is operational information only.

## 11. Settlement Boundary

The return event and final financial settlement are separate concerns.

VS011 must not require or fabricate:

- remaining balance payment;
- security-deposit deduction/refund;
- damage charge settlement;
- fuel charge settlement;
- late-return charge settlement.

The rental may be physically returned/ended while financial settlement remains a later workflow.

This provisional separation exists because `CQ-002`, `CQ-003`, `CQ-011`, `CQ-012`, `CQ-013`, and `CQ-014` remain unresolved.

## 12. Rental Closure Transaction

The final return action must execute transactionally.

At minimum:

1. authorize active Owner/Admin;
2. lock/re-read rental;
3. require rental is active;
4. re-read booking/vehicle;
5. validate stale expected rental context;
6. validate return inputs;
7. set `ended_at` to database/server current time;
8. persist return snapshot;
9. return the canonical ended rental.

Two concurrent return attempts must not both succeed.

## 13. Stale Context

The return request must include a stable expected rental context such as:

- expected rental ID;
- expected `started_at`;
- expected vehicle ID.

The server/database must verify these against canonical state.

If the rental changed/ended since the reviewer loaded the page, reject and require reload.

## 14. Vehicle Active-Rental Exclusivity After Return

Once `ended_at` is set, the rental no longer satisfies the active-rental partial unique index.

This makes the vehicle eligible for a later rental from the active-rental exclusivity perspective.

Do not interpret this as a complete “Available” vehicle lifecycle transition.

Maintenance, cleaning, damage, and return-to-service rules remain separate.

## 15. Vehicle Master Data

If a canonical vehicle mileage/odometer field already exists and semantics are safe, the return odometer may update it only when:

- a return reading was supplied;
- it is not lower than the canonical existing mileage.

Do not mutate vehicle branch during return.

Do not set a final vehicle operational status such as `Available` merely because the rental ended.

## 16. Customer Visibility

Customer/Renter may see for their own rental:

- actual started_at;
- actual ended_at;
- scheduled return;
- derived active/returned state.

Safe return snapshot information may be shown where appropriate, but do not expose:

- returned_by;
- internal-only damage/condition notes;
- administrative settlement notes;
- another customer's rental data.

## 17. Owner/Admin UI

Provide the minimum return workflow for an active rental:

- identify customer/booking/vehicle;
- show release snapshot;
- show scheduled return;
- input return odometer;
- input return fuel;
- input return condition summary;
- record observed damage/condition concerns;
- record optional return remarks;
- explicitly complete vehicle return.

After return:

- show ended rental;
- show actual return time;
- show derived late-return indicator where applicable;
- do not automatically open a charge/settlement workflow.

## 18. Operations Staff

Operations Staff must not perform final return/closure in VS011.

A safe read-only active/returned indication may be available for coordination if already consistent with role boundaries.

## 19. Analytics

A completed rental interval becomes usable for later:

- RentalDays;
- utilization;
- idle-day baseline;
- historical rental reports.

Do not implement the full analytics dashboard in VS011 unless already trivially derived by existing code.

The important foundation is that canonical `started_at` and `ended_at` now exist.

## 20. Client Clarification Links

Preserve:

- `CQ-002` — security deposit;
- `CQ-003` — remaining balance;
- `CQ-009` — final vehicle-status vocabulary;
- `CQ-011` — late-return penalty;
- `CQ-012` — damage-charge matrix;
- `CQ-013` — fuel-return policy;
- `CQ-014` — final settlement/completion gate;
- `CQ-016` — Operations Staff scope;
- `CQ-020` — odometer/fuel convention;
- `CQ-021` — exact return inspection checklist;
- `CQ-022` — whether physical return and financial closure are operationally separate at Briah's.

## 21. Warning to Codex

Do not:

- end a rental from scheduled time alone;
- let Customer/Operations Staff close rentals;
- overwrite release snapshot data;
- invent financial settlement;
- calculate late/fuel/damage fees;
- refund/deduct security deposits;
- mark the vehicle definitively Available;
- invent a complete rental status enum;
- present provisional CQ behavior as final client policy.
