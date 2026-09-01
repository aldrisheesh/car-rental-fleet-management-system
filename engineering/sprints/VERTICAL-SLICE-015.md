# Vertical Slice 015 — Projected Available Supply and Branch Demand Balance

**Status:** Approved for implementation  
**Objective:** Evaluate persisted VS014 forecast requirements against canonical future fleet availability for each branch/category/target week, persist immutable supply/balance snapshots with per-vehicle traceability, and derive shortage/surplus without recommending or executing inter-branch transfers.

## Purpose

VS014 established canonical:

- weekly qualifying demand;
- WMA forecasts;
- required vehicle units;
- immutable forecast runs;
- forecast horizons.

VS015 adds the corresponding fleet-supply side.

For each canonical forecast record:

```text
Required Units
      +
Projected Available Supply
      ↓
Shortage / Balanced / Surplus
```

The result becomes the trusted input for the later allocation recommendation layer.

VS015 must **not** recommend or execute vehicle transfers.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/06-recommendation-specification.md`
- `codex-context/10-open-decisions.md`
- `codex-context/14-client-clarification-register.md`
- `codex-context/18-maintenance-monitoring-and-readiness.md`
- `codex-context/20-demand-extraction-and-forecasting-boundary.md`
- `codex-context/21-projected-supply-and-demand-balance.md`
- this slice contract.

Inspect only repository areas directly required for:

- canonical VS014 forecasts;
- vehicles;
- branches;
- vehicle categories;
- maintenance readiness;
- maintenance records/targets required for future-week eligibility;
- Confirmed booking assignments;
- canonical rental transactions;
- existing admin fleet/report/forecast UI;
- Operations Staff read-only reporting surfaces where relevant;
- auth/server helpers;
- Supabase migrations required for supply-evaluation persistence.

Do not read previous vertical-slice contracts unless a concrete blocker requires it.

## Evaluation Grain

Each supply/balance evaluation belongs to exactly one canonical VS014 forecast record.

Therefore one evaluation inherently identifies:

- forecast run;
- branch;
- vehicle category;
- forecast horizon;
- target week;
- required vehicle units.

Do not calculate demand independently.

## Required Vehicle Units

Use the forecast record's persisted:

`required_vehicle_units`

as canonical `R`.

Do not:

- recalculate WMA;
- use decimal forecast directly as fleet unit count;
- round differently.

## Target Week

Use the forecast record's:

- `target_week_start`;
- `target_week_end`.

Treat the interval as:

```text
[target_week_start, target_week_end)
```

The canonical VS014 weeks are Monday-to-Monday Manila calendar weeks.

Do not derive a different week interval.

## Projected Supply Definition

For forecast record `f`:

```text
ProjectedSupply(f)
=
count of canonical vehicles
eligible for the ENTIRE target week
```

A vehicle contributes exactly:

`1`

supply unit when every required criterion passes.

Do not calculate partial/fractional supply units.

## Candidate Vehicle Pool

Start from canonical vehicles whose current:

- `branch_id = forecast.branch_id`;
- `vehicle_category_id = forecast.vehicle_category_id`.

Do not include vehicles from another branch on the assumption they might later transfer.

VS015 only measures current source fleet supply.

## Active Vehicle Requirement

Vehicle must currently satisfy:

```text
is_active = true
```

A currently inactive vehicle does not count.

Do not speculate about future reactivation.

## Maintenance Readiness Reuse

Reuse the canonical VS012 maintenance-readiness service.

Do not recreate readiness logic.

Current readiness must be:

`Ready`

for the vehicle to count.

If readiness is unavailable or Not Ready:

exclude the vehicle conservatively.

Return a safe reason.

## Known Future Maintenance Eligibility

VS015 evaluates a future weekly period.

Current maintenance readiness alone may not capture a known future date-based service deadline.

Therefore additionally inspect canonical authoritative preventive targets.

### Date-based target

If the current authoritative:

`next_service_date`

is:

```text
< target_week_end
```

or falls anywhere before the end of the target weekly interval such that the vehicle cannot confidently be treated available throughout the whole week:

exclude the vehicle.

For clarity, if next service becomes due during the evaluated week:

the vehicle does not count as full-week projected supply.

### Odometer-based target

Do not forecast future mileage.

If odometer-based maintenance is already due under current canonical readiness:

the vehicle is already Not Ready.

If it is not currently due:

do not invent future mileage to decide that it will become due.

## Maintenance Record Semantics

Reuse the canonical latest-target supersession semantics established in VS012.

Do not let historical superseded maintenance targets incorrectly exclude a vehicle.

Do not infer future availability from:

- remarks;
- free-text descriptions.

## Booking Commitment Eligibility

Inspect canonical booking assignments.

A specific vehicle is blocked for the target week only by a canonical booking satisfying:

```text
booking_status = Confirmed
AND assigned_vehicle_id = vehicle.id
```

and whose scheduled rental interval overlaps the target week.

Do not let these block specific vehicle supply:

- Submitted;
- Rejected;
- Cancelled;
- Confirmed but unassigned.

## Scheduled Booking Interval

Use the canonical scheduled booking interval already established by the booking flow.

Prefer the existing canonical:

- pickup/start timestamp;
- return/end timestamp;

rather than reconstructing duration differently.

## Booking Overlap

A Confirmed assigned booking conflicts when:

```text
booking_start < target_week_end
AND
booking_end > target_week_start
```

Use half-open intervals.

Boundary examples:

```text
booking ends exactly Monday target_week_start
→ no overlap

booking starts exactly next Monday target_week_end
→ no overlap
```

Any actual overlap means the vehicle is not available for the **entire week** and must be excluded.

## Rental Conflict

Use canonical `rental_transactions`.

### Active rental

When:

```text
started_at IS NOT NULL
AND ended_at IS NULL
```

exclude the vehicle from **all VS015 future forecast horizons**.

Do not assume scheduled return will occur.

Only canonical physical return ends this conservative block.

### Ended rental

When:

```text
ended_at IS NOT NULL
```

use its actual interval:

```text
[started_at, ended_at)
```

An ended rental only blocks a target week when those actual timestamps overlap it.

A past ended rental does not block future weeks after return.

## Avoid Duplicate Exclusion

Eligibility is per vehicle.

Example:

```text
vehicle has:
- active rental
- related Confirmed booking
- maintenance blocker
```

still means:

```text
eligible = false
```

for one vehicle.

Do not subtract three units.

Return all applicable safe reason codes if useful, but projected supply counts vehicles only.

## Turnaround Buffer

Do not add an implicit:

- cleaning buffer;
- inspection buffer;
- preparation interval;
- one-day gap;

between commitments.

`CQ-018` remains unresolved.

Use canonical commitment intervals exactly as recorded.

## Additional Reserve

Do not subtract:

```text
1 spare vehicle
```

or any other hidden reserve.

`CQ-025` remains unresolved.

A branch with supply exceeding requirement by 1 has a surplus of 1 under the current baseline.

## Other Explicit Vehicle Blockers

Use existing structured canonical blocker fields only where already authoritative.

Do not infer blocking state from:

- notes;
- remarks;
- prototype labels.

Do not create a new broad vehicle-status system.

## Per-Vehicle Eligibility Evaluation

For every candidate vehicle, derive a structured result.

At minimum:

- vehicle ID;
- eligible for projected supply;
- current active state;
- maintenance readiness summary;
- booking conflict boolean;
- rental conflict boolean;
- future date-based maintenance conflict where applicable;
- safe exclusion reason codes.

Suitable reason vocabulary may include:

- `VehicleInactive`
- `MaintenanceNotReady`
- `MaintenanceDueDuringTargetWeek`
- `ConfirmedBookingConflict`
- `ActiveRental`
- `RentalIntervalConflict`
- `ReadinessUnavailable`
- `InvalidCanonicalData`

Do not use customer identity/details as exclusion text.

## Projected Supply

After evaluating all candidate vehicles:

```text
S =
count(vehicle where eligible = true)
```

This is integer supply.

Do not manually override it.

## Shortage

Use:

```text
Shortage =
max(0, R - S)
```

## Surplus

Use:

```text
Surplus =
max(0, S - R)
```

## Balanced State

If:

```text
R = S
```

then:

```text
Shortage = 0
Surplus = 0
```

Derived presentation label:

`Balanced`

## No Arbitrary Threshold

Do not introduce:

- minimum shortage threshold;
- critical shortage level;
- reserve margin;
- utilization multiplier;
- percentage confidence.

Shortage/surplus comes directly from `R` and `S`.

## Canonical Supply Evaluation Persistence

Create additive persistence.

Recommended parent entity:

`supply_evaluations`

At minimum:

- evaluation ID;
- forecast ID;
- evaluated at;
- evaluated by;
- idempotency key;
- required units snapshot;
- projected supply;
- shortage units;
- surplus units;
- optional data-quality state;
- created timestamp.

Do not mutate the underlying forecast.

## Vehicle-Level Evaluation Persistence

Recommended child entity:

`supply_evaluation_vehicles`

At minimum:

- evaluation item ID;
- evaluation ID;
- vehicle ID;
- eligible boolean;
- structured exclusion reason data;
- created timestamp.

Use equivalent repository-consistent naming if appropriate.

## Historical Snapshot Fidelity

Evaluations are immutable snapshots.

If Owner/Admin evaluates the same forecast again after fleet state changes:

create a **new evaluation snapshot**.

Do not overwrite the old projected supply.

Latest evaluation may be selected for default display.

## Idempotency

Protect one explicit evaluation request from accidental duplication.

An identical idempotency key must resolve to the already-created evaluation rather than create a duplicate.

A later explicit evaluation with a new idempotency key is legitimate.

## Atomic Persistence

Evaluation persistence must be transactional.

Persist:

```text
supply_evaluation
+
all vehicle evaluation items
```

in one trusted database operation.

If child persistence fails:

no parent evaluation should remain.

Use an additive RPC or equivalent transaction boundary.

## Evaluation Generation Authority

Only active Owner/Admin may generate a supply evaluation.

Operations Staff:

read-only.

Customer/Renter:

no access.

Do not authorize solely from UI role state.

## Evaluation Read Boundary

Owner/Admin may read:

- latest evaluations;
- historical evaluations;
- per-vehicle eligibility detail.

Operations Staff may receive safe read-only decision-support output.

Customer/Renter must be denied.

## Sensitive Data Boundary

Supply evaluation may reference booking/rental conflicts internally but must not expose:

- customer name;
- government IDs;
- payment details;
- requirement documents;
- sensitive booking notes.

Only operational conflict state is needed.

## No Forecast

If no canonical VS014 forecast exists for a given branch/category/horizon:

do not create a supply/balance record by inventing `R`.

Return/display:

`Demand forecast unavailable`

or equivalent.

## Data-Quality Handling

If necessary canonical data cannot be safely resolved:

do not optimistically count the vehicle as supply.

Exclude conservatively and surface a structured reason.

Do not silently treat missing data as:

`eligible = true`.

## Owner/Admin API

Create a focused trusted endpoint or equivalent for:

- reading supply evaluations;
- generating a new evaluation for a canonical forecast record.

The generation request should primarily identify:

- forecast ID;
- idempotency key.

Do not accept client-supplied:

- required units;
- projected supply;
- shortage;
- surplus;
- vehicle eligibility.

Re-read all canonical data server-side.

## Operations Staff API

Read-only only.

Do not permit Staff to generate/recompute/persist evaluations.

## Customer API

Reject fleet supply/balance access.

## Owner/Admin UI

Extend the existing forecasting/report/fleet decision-support area.

At minimum, for canonical forecasts show:

- branch;
- vehicle category;
- horizon;
- target week;
- forecast decimal;
- required units;
- latest projected supply if evaluated;
- shortage;
- surplus;
- balance state;
- evaluation timestamp.

Provide explicit action:

`Evaluate Supply`

or equivalent.

Do not auto-evaluate just by opening the page.

## Evaluation Detail UI

Where practical, allow Owner/Admin to inspect:

### Eligible vehicles

- vehicle identity;
- Ready / no conflicts.

### Excluded vehicles

- vehicle identity;
- safe exclusion reason(s).

Do not display unrelated customer information.

## Operations Staff UI

May show safe latest:

- required units;
- projected supply;
- shortage;
- surplus;
- balance label.

No evaluation button.

## Customer UI

No fleet balance UI.

## No Automatic Recalculation on GET

GET/read endpoints must not create or update evaluation snapshots.

Evaluation occurs only through explicit Owner/Admin mutation.

## Trusted Current State

Supply evaluation is a snapshot of canonical data at:

`evaluated_at`

Do not pretend it guarantees fleet state will remain unchanged until the future target week.

UI should present it as projected decision support.

## Testing

Add focused tests where practical for:

- canonical required units copied from forecast;
- correct candidate branch/category filtering;
- inactive vehicle excluded;
- VS012 Not Ready excluded;
- readiness unavailable excluded;
- open blocking maintenance excluded;
- date-based service due before/during target week excluded;
- non-due odometer target not speculatively projected;
- Confirmed assigned booking overlap excluded;
- Submitted booking ignored;
- Rejected booking ignored;
- Cancelled booking ignored;
- Confirmed unassigned booking does not block specific vehicle;
- booking ending exactly at week start does not overlap;
- booking starting exactly at week end does not overlap;
- active rental excludes future horizons;
- ended rental past target does not incorrectly block future supply;
- actual ended rental overlap is detected;
- one vehicle with several blockers counts as one exclusion;
- supply count correct;
- shortage formula correct;
- surplus formula correct;
- balanced formula correct;
- all-zero required units can validly produce surplus;
- no forecast => no evaluation;
- idempotent retry returns same evaluation;
- new idempotency key permits later new snapshot;
- parent + child persistence atomic;
- read endpoint has no mutation;
- Customer denied;
- Operations Staff cannot generate evaluation.

## Provider-Backed Validation

Where configured, validate at minimum:

1. Owner/Admin can generate an evaluation from a canonical forecast;
2. required units are copied from forecast;
3. candidate vehicles come only from matching branch/category;
4. inactive vehicle excluded;
5. maintenance-not-ready vehicle excluded;
6. overlapping Confirmed assigned booking excluded;
7. active rental excluded;
8. valid vehicle counted;
9. shortage/surplus correct;
10. vehicle-level eligibility items persist;
11. duplicate idempotency request does not duplicate;
12. new evaluation later creates another immutable snapshot;
13. Operations Staff can read but not generate;
14. Customer cannot access;
15. no branch assignment changes occur.

Use disposable data where practical.

## Client Clarification Preservation

Preserve:

- `CQ-018`
- `CQ-025`

Do not invent:

- turnaround buffer;
- spare/reserve policy;
- hidden fleet availability rules.

## Definition of Done

VS015 is complete when:

- every evaluation is tied to a canonical VS014 forecast;
- required units come from the forecast;
- projected supply counts only canonically eligible branch/category vehicles;
- maintenance readiness is reused;
- known future date-based maintenance constraints are respected;
- Confirmed assigned booking conflicts are respected;
- active rental supply is conservatively excluded;
- half-open commitment overlap is correct;
- shortage/surplus formulas are correct;
- immutable evaluation snapshots exist;
- per-vehicle eligibility/exclusion traceability exists;
- evaluation persistence is atomic/idempotent;
- Operations Staff is read-only;
- Customer cannot access internal supply/balance analytics;
- no allocation recommendation or branch mutation is implemented.

## Stop Rule

Stop after Projected Available Supply and Branch Demand Balance is complete.

Do not implement:

- source/destination branch matching;
- recommended transfer quantity;
- candidate transfer ranking;
- transfer approval;
- branch reassignment;
- route/weather/road context;
- Smart Vehicle Finder integration;
- VS016.