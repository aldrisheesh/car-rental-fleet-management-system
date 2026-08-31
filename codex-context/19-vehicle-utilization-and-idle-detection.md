# Vehicle Utilization and Idle Detection Specification

**Status:** Frozen for Baseline Vehicle Utilization / Idle Detection  
**Last updated:** 2026-09-01

This document defines the authoritative baseline for vehicle-utilization analytics and idle-vehicle detection using canonical rental intervals and maintenance/operational eligibility data.

The manuscript remains authoritative that:

- utilization is based on actual rental activity, not reservations;
- utilization is `RentalDays / EligibleOperationalDays * 100`;
- inactive and maintenance-unavailable days are excluded from eligible operational days;
- the default dashboard reporting interval may be the most recent 30 days;
- idle vehicles must be active, rental-ready, not currently rented, not maintenance-unavailable, otherwise eligible, and without rental activity for at least 14 consecutive days;
- utilization/idle indicators are advisory and do not automatically transfer vehicles.

## 1. Reporting Timezone and Calendar-Day Semantics

Use the business reporting timezone:

`Asia/Manila`

Utilization is calendar-day based, not elapsed-24-hour-block based.

A reporting range is represented by inclusive local calendar dates:

`[start_date, end_date]`

A canonical timestamp interval overlaps a local calendar day when any portion of the interval intersects that day in `Asia/Manila`.

Do not use the browser/device timezone to change analytical day boundaries.

## 2. Canonical Rental Activity

Only canonical `rental_transactions` count as rental activity.

A reservation/Confirmed booking without a rental transaction does not count.

A rental interval is:

- start = `started_at`
- end = `ended_at` when ended;
- for an active rental, analytical end = trusted current server time for reports that include the current day.

Do not use scheduled pickup/return as actual utilization.

## 3. Rental Days

For vehicle `v` and selected reporting range:

`RentalDays(v)`

is the number of distinct `Asia/Manila` calendar dates within the reporting range that overlap at least one canonical active-rental interval for that vehicle.

If multiple rental intervals touch the same calendar date, count that date once.

Examples:

- rental 2026-09-01 10:00 to 2026-09-01 18:00 -> 1 Rental Day
- rental 2026-09-01 23:00 to 2026-09-02 01:00 -> 2 Rental Days
- two rentals on the same date -> 1 Rental Day

## 4. Eligible Operational Days

`EligibleOperationalDays(v)`

is the number of local calendar dates in the selected reporting range for which the system has sufficient recorded evidence that the vehicle could reasonably have been used for rental operations.

A day is eligible only when:

1. the vehicle is recorded active for that day;
2. the vehicle is not made unavailable for the entire analytical day by a known blocking maintenance condition;
3. the vehicle is not otherwise explicitly recorded as blocked from rental use.

Because current system records do not yet preserve complete historical `is_active` transitions, VS013 must establish analytical active/inactive history rather than silently treating the current `is_active` value as historical truth.

## 5. Analytical Vehicle Active-State History

Add the smallest canonical active/inactive history needed for analytics.

A suitable model is an append-only `vehicle_operational_state_events` record containing at minimum:

- event ID;
- vehicle ID;
- `is_active`;
- effective timestamp;
- recorded by / source;
- created timestamp.

Future canonical changes to `vehicles.is_active` must record the corresponding state event transactionally or through the same trusted mutation boundary.

Do not invent a full vehicle lifecycle/status machine.

This history exists specifically to establish active/inactive eligibility over time.

## 6. Initial Historical Coverage

Do not backdate an existing vehicle's current active state as though the system knows its full historical active/inactive history.

For vehicles that existed before VS013:

- create an initial state event no earlier than the time the state becomes canonically tracked by VS013;
- historical dates before that event have unknown active-state coverage unless an authorized historical state record is deliberately imported/provided.

For vehicles created after VS013:

- create the initial state event at canonical vehicle creation/effective activation time through the trusted vehicle mutation workflow.

## 7. Utilization Coverage

A utilization percentage must not silently claim a full selected reporting period when active-state eligibility history is incomplete.

Return/display:

- reporting start/end;
- Rental Days;
- Eligible Operational Days;
- utilization percentage when computable;
- coverage state.

Coverage may be:

- `Complete`
- `Partial/Insufficient Historical Eligibility Data`

For the baseline, if any selected calendar day lacks enough active-state history to determine eligibility, the primary utilization percentage for the full requested range must be `Unavailable` / null rather than silently computing a biased full-period percentage.

The UI may still show known Rental Days and explain that eligibility history is insufficient.

Demonstration/sample historical state events may be used for functional testing when clearly labeled as demo/test data.

## 8. Historical Blocking Maintenance Intervals

For utilization-day eligibility, blocking maintenance uses canonical maintenance history.

A blocking maintenance interval is derived from a maintenance record where:

`blocks_rental_use = true`

Historical interval rules:

- `Completed`: from `service_started_at` through `completed_at`
- `Open`: from `service_started_at` through trusted current time
- `Cancelled`: does not establish an authoritative blocking-maintenance interval for utilization history unless a later client-confirmed rule says otherwise.

Do not use free-text remarks to infer downtime.

## 9. Day-Level Maintenance Eligibility

Because the manuscript defines utilization in calendar days, use conservative calendar-day classification.

For a day with no rental activity:

- if a known blocking-maintenance interval overlaps that local calendar date, exclude the date from Eligible Operational Days.

For a day with canonical rental activity:

- count the day as an Eligible Operational Day when the active-state history says the vehicle was active, because actual rental activity establishes that the vehicle was operationally used during that calendar date;
- a maintenance record opened later on the same date must not retroactively make the utilization denominator exclude a day on which the vehicle was actually rented.

This prevents `RentalDays > EligibleOperationalDays` from same-day return/maintenance sequencing.

## 10. Utilization Formula

When coverage is complete and `EligibleOperationalDays > 0`:

`UtilizationPercent = (RentalDays / EligibleOperationalDays) * 100`

Round only for presentation.

Keep sufficient calculation precision internally.

The result should normally remain between 0 and 100 under the day-classification rules.

When `EligibleOperationalDays = 0`:

- utilization percentage is unavailable/null;
- do not divide by zero;
- explain that no eligible operational days exist in the selected period.

## 11. Default and Custom Reporting Range

Owner/Admin dashboard default:

**most recent 30 local calendar days, including the current local date**

Reports may accept a selected start/end date.

Validate:

- start date <= end date;
- reasonable bounded date range to avoid accidental unbounded scans.

Do not invent a business interpretation threshold such as High/Medium/Low utilization.

## 12. Idle Eligibility

A vehicle may be considered for idle classification only when, at evaluation time:

1. vehicle currently exists;
2. `vehicles.is_active = true`;
3. canonical maintenance readiness = Ready using the reusable VS012 readiness service;
4. no canonical active rental exists;
5. no other explicit current rental-use blocker exists.

If any condition fails:

`IdleEligible = false`

and the vehicle must not be labeled Idle regardless of how old its last rental is.

## 13. Idle Baseline for Previously Rented Vehicle

If the vehicle has at least one ended canonical rental:

`IdleReference = max(ended_at)`

for that vehicle.

Idle duration is measured from the latest completed physical return time to trusted current server time.

Do not use booking scheduled-return time.

## 14. Vehicle With No Previous Rental

The manuscript permits the date when the vehicle became operationally available to be used as the reference date.

For the baseline:

- use a trustworthy canonical operational-availability/state-history timestamp only when available;
- do not substitute vehicle `created_at` merely because it exists;
- if no trustworthy operational-availability baseline exists, idle duration is `Unavailable` and the vehicle must not be classified Idle.

Client/historical data initialization remains tracked under `CQ-023`.

## 15. Fourteen-Day Threshold

For an idle-eligible vehicle with a trustworthy reference:

`IdleDuration >= 14 consecutive days`

means:

`Idle = true`

Use trusted server current time and `Asia/Manila` calendar interpretation for presentation.

The threshold is fixed for the study.

Do not make it an Owner/Admin configurable business setting in the baseline.

## 16. Active Rental

If an active rental exists:

- `Idle = false`;
- idle duration may be omitted or presented as not applicable.

Do not count time since an earlier completed rental while a newer rental is active.

## 17. Maintenance and Idle

A vehicle that is not maintenance-ready is not Idle for the study definition.

Do not label a maintenance-blocked vehicle as idle merely because it has had no recent rentals.

Readiness reasons may be surfaced internally to explain why idle classification is not applicable.

## 18. Current Condition Blocker

The explicit VS012 vehicle condition blocker participates through canonical maintenance readiness.

Do not duplicate condition logic in the idle calculation.

## 19. Branch and Vehicle Category

Utilization and idle results should retain safe vehicle metadata needed for fleet monitoring, such as:

- vehicle ID/name/plate;
- branch;
- category;
- current active state;
- maintenance readiness summary;
- active-rental state.

Do not mutate branch assignment from analytics.

## 20. Owner/Admin UI

Provide an internal fleet analytics view using existing dashboard/report surfaces where practical.

At minimum show per vehicle:

- vehicle;
- branch/category;
- Rental Days;
- Eligible Operational Days;
- utilization percentage or Unavailable;
- coverage state;
- active-rental state;
- maintenance readiness;
- idle eligibility;
- idle days/duration where computable;
- Idle / Not Idle / Unable to Determine.

Default to the most recent 30 days for utilization.

Allow a selected reporting date range where practical.

## 21. Operations Staff

Operations Staff may receive safe read-only utilization/idle operational indicators where useful for fleet coordination.

Do not expose:

- maintenance costs;
- internal maintenance remarks;
- payment/customer-sensitive records.

Do not add analytics mutation authority.

## 22. Customer/Renter

No customer-facing utilization/idle dashboard is required.

Do not expose fleet-wide analytics to Customer/Renter.

## 23. Trusted Calculation Boundary

Create reusable server-side analytical functions/services for:

- rental-day calculation;
- eligible-operational-day calculation;
- utilization;
- idle detection.

Do not derive these metrics independently in multiple UI components.

Where practical, keep pure date/interval calculation functions separately testable.

## 24. Data Source Integrity

Use:

- canonical `rental_transactions`;
- canonical vehicle active-state history;
- canonical maintenance records;
- canonical VS012 maintenance-readiness service;
- trusted server current time.

Do not use:

- mock rental arrays;
- Confirmed booking duration as actual rental duration;
- prototype vehicle statuses;
- localStorage analytics values.

## 25. Persistence

Utilization and idle are derived analytics.

Do not persist manually editable utilization percentages or idle booleans as canonical truth.

Caching/materialized summaries may be added later only when justified.

## 26. Decision-Support Boundary

Utilization and idle indicators do not independently:

- transfer vehicles;
- change branch;
- cancel/confirm bookings;
- mark a vehicle available;
- change maintenance state.

Later allocation logic may consume them as supporting inputs under the frozen allocation rules.

## 27. Testing / Demonstration Data

When real client historical data are insufficient, explicitly labeled sample/simulated:

- rental intervals;
- operational-state history;
- maintenance records

may be used for functional demonstration.

Do not present those outputs as measured real-world Briah performance.

## 28. Client Clarification Link

`CQ-023` tracks the trustworthy historical operational-availability baseline for client vehicles that predate canonical state-history tracking.

Do not guess acquisition/start dates.

## 29. Warning to Codex

Do not:

- count Confirmed reservations as Rental Days;
- use scheduled pickup/return as actual rental activity;
- treat current `is_active` as historical truth for unknown dates;
- backdate operational-state history without authoritative input;
- count maintenance-unavailable vehicles as idle;
- fabricate idle duration for never-rented vehicles without a baseline;
- persist editable utilization/idle results;
- add qualitative utilization classifications;
- automatically transfer/reallocate a vehicle;
- begin forecasting/allocation implementation in VS013.
