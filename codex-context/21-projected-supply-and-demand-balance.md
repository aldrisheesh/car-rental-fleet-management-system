# Projected Available Supply and Branch Demand Balance

**Status:** Frozen for VS015 Projected Supply / Demand Balance  
**Last updated:** 2026-09-01

This document defines the authoritative baseline for comparing persisted WMA demand requirements against projected available vehicle supply for each branch, vehicle category, and forecast target week.

VS015 is decision-support only. It does not recommend or execute inter-branch transfers.

## 1. Purpose

For each persisted forecast record:

- resolve required vehicle units from VS014;
- determine projected available supply from canonical fleet data;
- calculate shortage/surplus;
- preserve an auditable supply/balance evaluation for later allocation recommendation.

## 2. Evaluation Grain

One supply/balance evaluation belongs to exactly one canonical VS014 forecast record.

Therefore its grain is:

- forecast run;
- branch;
- vehicle category;
- forecast horizon;
- target week.

Do not create a second independent demand forecast.

## 3. Required Vehicle Units

Use the persisted VS014 value:

`RequiredVehicleUnits = ceil(ForecastedDemand)`

Do not recompute demand using another method.

Do not round the forecast again differently.

## 4. Target Week

Use the forecast record's canonical:

- `target_week_start`;
- `target_week_end`.

The week is already defined by VS014 as Monday-to-Monday in `Asia/Manila`.

Treat the target interval as half-open:

`[target_week_start, target_week_end)`

## 5. Projected Available Supply

For branch `b`, category `c`, forecast horizon/week `h`:

`S[b,c,h]`

is the number of canonical vehicles that satisfy all baseline supply-eligibility rules for the entire evaluated weekly interval.

A vehicle counts as one projected supply unit only when all required criteria pass.

## 6. Branch and Category Membership

A candidate supply vehicle must:

- currently belong to the evaluated branch;
- currently belong to the evaluated canonical vehicle category.

VS015 does not predict future branch/category changes.

Do not assume a future transfer before an approved transfer workflow exists.

## 7. Current Vehicle Active State

The vehicle must currently be:

`is_active = true`

A currently inactive vehicle is excluded.

VS015 does not speculate that an inactive vehicle will be reactivated before the target week.

## 8. Maintenance Eligibility

The vehicle must be maintenance-eligible.

Reuse the canonical VS012 maintenance-readiness boundary rather than duplicating its rules.

Current canonical readiness must be Ready.

Additionally, for the future target week, exclude a vehicle when known canonical maintenance data already establish that the vehicle cannot safely be treated as available for the whole week.

At minimum:

- an Open blocking maintenance record excludes the vehicle;
- a recorded next-service date that is due on or before the target week's end prevents counting the vehicle as confidently available for the whole target week unless a newer completed service target supersedes it.

Do not forecast future odometer accumulation.

A next-service odometer that is not currently due must not be projected forward using invented mileage.

Do not infer maintenance unavailability from free-text remarks.

## 9. Booking Commitment Conflicts

A Confirmed booking creates a future vehicle commitment only when it has a canonical:

`assigned_vehicle_id`

For supply eligibility, exclude a vehicle when a Confirmed booking assigned to that vehicle has a scheduled rental interval overlapping the target week.

Use the booking's canonical scheduled pickup/return interval.

A Submitted booking does not reserve projected supply.

Rejected/Cancelled bookings do not reserve projected supply.

A Confirmed booking with no assigned vehicle does not block a specific vehicle.

## 10. Booking Interval Overlap

Use half-open interval overlap:

`commitment_start < target_week_end`
and
`commitment_end > target_week_start`

Any overlap means the vehicle is not counted as available for the **entire** evaluated week.

This is intentionally conservative because weekly projected supply represents vehicles confidently available across the evaluated weekly period.

## 11. Rental Commitment Conflicts

Canonical rental transactions also block projected supply.

### Ended rental

An ended rental only conflicts when its actual interval overlaps the evaluated target week.

For future target weeks after `ended_at`, it does not conflict.

### Active rental

When:

`started_at IS NOT NULL AND ended_at IS NULL`

the vehicle is currently rented.

Do not assume an active rental will definitely return on schedule.

For the baseline, a currently active rental excludes that vehicle from projected supply for all evaluated future horizons until the rental is canonically ended.

This is conservative and prevents overstating supply.

## 12. Avoid Double-Penalizing One Vehicle

A vehicle that has both:

- an active rental; and
- a related Confirmed booking record

is still only one excluded vehicle.

Supply counts eligible vehicles, not conflict records.

Return structured exclusion reasons without subtracting the same vehicle multiple times.

## 13. Turnaround / Preparation Buffer

`CQ-018` remains unresolved.

VS015 does not add an invented cleaning/preparation buffer before or after bookings/rentals.

Use raw canonical commitment interval overlap only.

After Briah confirms a turnaround buffer, supply eligibility may be updated.

## 14. Vehicle Condition / Other Rental-Use Blockers

Use explicit canonical blockers already represented through maintenance readiness/current vehicle data.

Do not infer operational blockers from free-text notes.

Do not invent a broad vehicle-status state machine.

## 15. Supply Eligibility Result per Vehicle

For auditability, the evaluation should determine per candidate vehicle:

- eligible or excluded;
- branch/category match;
- active state;
- maintenance-ready state;
- booking conflict;
- rental conflict;
- other explicit blocker if supported;
- reason(s) for exclusion.

Do not expose sensitive booking/customer information in the supply evaluation.

A conflict reason may identify that a commitment exists without exposing the renter.

## 16. Shortage / Surplus

For each forecast record:

`R = required_vehicle_units`
`S = projected_available_supply`

Then:

`Shortage = max(0, R - S)`

`Surplus = max(0, S - R)`

If:

`R = S`

then:

- Shortage = 0
- Surplus = 0
- balance state = Balanced

No arbitrary shortage threshold exists.

## 17. Balance State

Derived presentation state:

- `Shortage` when shortage units > 0
- `Surplus` when surplus units > 0
- `Balanced` when both are 0

Do not persist/edit a separate manually controlled state when it can be derived from the numbers.

## 18. Evaluation Snapshot / Historical Fidelity

Fleet state can change after a forecast is generated.

Therefore VS015 should preserve an immutable supply/balance evaluation snapshot rather than silently rewriting historical supply values.

A supply evaluation should preserve at minimum:

- evaluation ID;
- forecast record ID;
- evaluated at;
- evaluated by;
- required units snapshot;
- projected supply snapshot;
- shortage units;
- surplus units;
- optional data-quality state;
- created timestamp.

Do not overwrite an old evaluation solely because fleet state changes.

A later explicit evaluation may create a newer snapshot for the same forecast record.

## 19. Vehicle-Level Snapshot

Preserve the evaluated vehicle set where practical.

A child evaluation item should preserve at minimum:

- evaluation ID;
- vehicle ID;
- eligible-for-supply boolean;
- exclusion reason code(s) or equivalent structured reasons.

This gives later allocation recommendation a traceable basis without pretending historical fleet state never changed.

Do not store customer-sensitive booking details in these items.

## 20. Evaluation Authority

Owner/Admin may explicitly generate/refesh supply/balance evaluations.

Operations Staff may view safe read-only evaluations.

Customer/Renter must not access internal branch supply/demand balance.

## 21. Idempotency

Protect one explicit evaluation request from duplicate persistence caused by browser retry/double-click.

An idempotency key or equivalent trusted request identifier is appropriate.

Do not prevent legitimate later evaluations.

## 22. Atomic Persistence

For an explicit evaluation request, persist:

- evaluation snapshot;
- vehicle-level evaluation items

atomically.

Do not leave a partial evaluation if child-item persistence fails.

## 23. Latest vs Historical Presentation

The UI may show the latest evaluation for each forecast record by default.

Historical evaluations remain available for traceability where practical.

Do not delete or mutate older snapshots merely to show the latest state.

## 24. Forecast Sufficiency Boundary

Supply/balance evaluation requires a canonical forecast record.

If VS014 reports Insufficient historical data and no forecast exists for a branch/category/horizon:

VS015 must not invent required units or shortage/surplus.

Display:

`Demand forecast unavailable`

or equivalent.

## 25. Data Quality

If canonical fleet data required to determine supply are unavailable or internally inconsistent, do not silently count the affected vehicle as eligible.

Use conservative exclusion / data-quality diagnostics.

Examples:

- maintenance readiness unavailable;
- branch/category missing;
- malformed commitment interval.

Do not fabricate favorable eligibility.

## 26. Decision-Support Boundary

A Shortage or Surplus does not itself:

- move a vehicle;
- change `branch_id`;
- assign a vehicle;
- confirm/cancel a booking;
- open/close maintenance;
- create an allocation decision.

VS016 or later may consume the immutable evaluation snapshot to create an allocation recommendation.

## 27. Context Separation

Weather, road, route, traffic, and fuel context do not create supply, shortage, or surplus.

External context remains a later layer applied after internal supply/demand analysis.

## 28. UI

Use the existing Owner/Admin dashboard/report/fleet decision-support area where practical.

At minimum show per forecast target:

- branch;
- category;
- target week/horizon;
- decimal forecast demand;
- required vehicle units;
- projected available supply;
- shortage;
- surplus;
- balance state;
- evaluated timestamp.

Where useful, allow Owner/Admin to inspect:

- eligible vehicle count/list;
- excluded vehicle list with safe reasons.

Do not broadly redesign unrelated pages.

## 29. Operations Staff

Operations Staff may view safe read-only:

- required units;
- projected supply;
- shortage/surplus;
- balance state;
- non-sensitive vehicle eligibility reasons.

No evaluation-generation or mutation authority unless separately approved later.

## 30. Customer/Renter

Customer/Renter must not receive internal supply/balance analytics.

## 31. Testing Requirements

Test at minimum:

- active/current-branch/current-category vehicle can be eligible;
- inactive vehicle excluded;
- maintenance-not-ready vehicle excluded;
- known future date-based maintenance due within target week excluded;
- non-due mileage target is not speculatively projected;
- overlapping Confirmed assigned booking excluded;
- Submitted booking does not block;
- Cancelled/Rejected booking does not block;
- Confirmed unassigned booking does not block a specific vehicle;
- boundary-touching booking with end == week start does not overlap;
- boundary-touching booking with start == week end does not overlap;
- active rental excludes all future evaluated horizons;
- ended rental after return does not block later target week;
- one vehicle with multiple conflict reasons counted only once;
- required units copied from canonical forecast;
- shortage formula;
- surplus formula;
- balanced case;
- no forecast => no invented balance;
- duplicate idempotency request does not duplicate evaluation;
- evaluation + vehicle items persist atomically;
- Customer denied;
- Operations Staff read-only.

## 32. Client Clarification Preservation

Preserve:

- `CQ-018` — turnaround/preparation buffer;
- `CQ-025` — whether Briah wants additional conservative future-supply rules beyond known commitments/readiness.

Do not invent these rules.

## 33. Warning to Codex

Do not:

- recompute WMA differently;
- count current total fleet as supply without eligibility checks;
- count inactive or maintenance-not-ready vehicles;
- ignore assigned Confirmed booking conflicts;
- assume active rentals end on schedule;
- invent turnaround buffers;
- automatically transfer vehicles;
- apply external context to create shortage/surplus;
- overwrite historical evaluation snapshots;
- expose customer-sensitive commitment details.
