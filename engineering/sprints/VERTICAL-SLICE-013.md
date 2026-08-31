# Vertical Slice 013 — Vehicle Utilization and Idle Detection

**Status:** Approved for implementation  
**Objective:** Implement canonical vehicle-utilization analytics and idle-vehicle detection using actual rental intervals, historical operational-state coverage, and canonical maintenance readiness without fabricating unavailable historical fleet data or triggering automatic fleet movement.

## Purpose

VS010–VS012 established the prerequisites for fleet analytics:

- canonical rental `started_at`;
- canonical rental `ended_at`;
- active/ended rental semantics;
- canonical maintenance records;
- canonical vehicle odometer;
- deterministic maintenance readiness.

VS013 uses those sources to implement:

1. Vehicle Utilization;
2. Idle Vehicle Detection.

The implementation must use canonical operational data rather than prototype booking statuses or mock analytics.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/10-open-decisions.md`
- `codex-context/14-client-clarification-register.md`
- `codex-context/18-maintenance-monitoring-and-readiness.md`
- `codex-context/19-vehicle-utilization-and-idle-detection.md`
- this slice contract.

Inspect only repository areas directly required for:

- canonical vehicles;
- vehicle active/inactive mutation;
- canonical rental transactions;
- canonical maintenance/readiness;
- existing admin dashboard/report/fleet presentation;
- Operations Staff fleet presentation where relevant;
- auth/server helpers;
- Supabase migrations required for operational-state history.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

## Business Reporting Timezone

Use:

`Asia/Manila`

for analytical calendar-day boundaries.

Do not derive utilization day boundaries from:

- browser timezone;
- device timezone;
- UTC calendar dates alone.

Timestamp storage may remain UTC.

Reporting-day interpretation must use `Asia/Manila`.

## Default Reporting Range

Default utilization range:

**most recent 30 Asia/Manila calendar days including the current local date**

For example, if the trusted current Manila date is September 1:

```text
start = August 3
end   = September 1
```

inclusive.

Where practical allow Owner/Admin to select:

- start date;
- end date.

Validate:

`start_date <= end_date`

Use a reasonable bounded reporting range.

Do not implement unbounded historical scans.

## Canonical Rental Source

Use only:

`rental_transactions`

Rental interval:

```text
started_at → ended_at
```

For an active rental:

```text
started_at → trusted current server time
```

Do not use:

- booking pickup date as actual start;
- booking return date as actual end;
- Confirmed booking duration;
- prototype rental arrays.

A Confirmed booking without a canonical rental transaction contributes:

**0 Rental Days**

## Rental-Day Semantics

Rental Days are **distinct local calendar dates** overlapped by actual rental activity.

For each vehicle:

```text
RentalDays =
count(distinct Asia/Manila calendar dates
      within report range
      overlapped by canonical rental intervals)
```

Examples:

```text
Sep 1 10:00 → Sep 1 18:00
= 1 Rental Day

Sep 1 23:00 → Sep 2 01:00
= 2 Rental Days

two rentals during Sep 1
= 1 Rental Day
```

Do not count the same calendar day twice.

## Canonical Vehicle Operational-State History

Current `vehicles.is_active` alone is insufficient for historical utilization.

Create additive canonical state-event persistence.

Recommended entity:

`vehicle_operational_state_events`

At minimum:

- `id`;
- `vehicle_id`;
- `is_active`;
- `effective_at`;
- `recorded_by`;
- source/reason where useful;
- `created_at`.

Do not create a full vehicle-status state machine.

This table exists to answer:

> Was this vehicle canonically recorded active or inactive on this historical date?

## Initial State Event

For existing vehicles when VS013 becomes active:

create/ensure one initial state event representing the vehicle's current canonical `is_active` state.

Its effective time must be no earlier than the time canonical state-history tracking begins.

Do not backdate it to:

- vehicle `created_at`;
- acquisition date;
- arbitrary demo date;

unless an authoritative historical record explicitly supports that value.

Historical days before known state history remain unknown.

## Future Vehicle Creation

Where a canonical vehicle is created after VS013:

record its initial active/inactive state event transactionally or through the same trusted mutation workflow.

Do not require a separate manual event after every vehicle creation.

## Future Active-State Changes

When Owner/Admin changes:

`vehicles.is_active`

the corresponding state event must also be persisted through the trusted mutation boundary.

The vehicle master state and state-history event must not diverge due to partial success.

Prefer an atomic RPC/transactional database boundary.

Do not permit Customer/Renter or Operations Staff to modify operational-state history.

## Historical Coverage

For each reporting calendar day, determine whether active-state eligibility is known.

If the selected reporting range contains dates before trustworthy state-history coverage:

```text
coverage = Partial/Insufficient Historical Eligibility Data
```

Do not pretend current active state applied historically.

## Complete Coverage

A report has:

`Complete`

active-state coverage only when every selected calendar day has sufficient canonical state-history information to determine active/inactive eligibility.

If coverage is incomplete:

- still calculate/show Rental Days from canonical rentals;
- show known supporting information;
- set full-range utilization percentage to `Unavailable` / null;
- clearly state why.

Do not calculate a misleading percentage using only the known subset and label it as full-period utilization.

## Eligible Operational Days

For complete-coverage reports:

```text
EligibleOperationalDays =
count of eligible local calendar dates
```

A date is eligible when:

1. active-state history establishes the vehicle was active;
2. it was not unavailable for the analytical day because of known blocking maintenance;
3. it was not explicitly blocked from rental use through canonical condition/readiness data.

## Historical Maintenance Downtime

Use canonical:

`maintenance_records`

For:

```text
blocks_rental_use = true
```

derive blocking intervals.

### Completed

```text
service_started_at → completed_at
```

### Open

```text
service_started_at → trusted current server time
```

### Cancelled

Do not treat a Cancelled record as authoritative historical downtime for utilization in VS013.

Do not infer downtime from:

- remarks;
- description;
- maintenance type.

## Maintenance Day Rule

For a calendar date with **no actual rental activity**:

if a known blocking-maintenance interval overlaps the date:

exclude it from Eligible Operational Days.

For a calendar date with actual canonical rental activity:

if active-state history establishes the vehicle was active:

count it as an Eligible Operational Day even if blocking maintenance began later on that same local date.

This prevents:

```text
RentalDays > EligibleOperationalDays
```

from normal same-day rental-return/maintenance sequencing.

## Explicit Condition Blocker

The current condition-blocking flag is part of canonical maintenance readiness.

For historical utilization, do not assume the **current** condition-blocking flag existed on earlier dates unless historical condition-state data exist.

VS013 must not fabricate historical condition downtime.

For current idle eligibility, use the canonical VS012 readiness service directly.

## Utilization Formula

When:

```text
coverage = Complete
AND EligibleOperationalDays > 0
```

calculate:

```text
UtilizationPercent =
(RentalDays / EligibleOperationalDays) × 100
```

Keep calculation precision internally.

Round only for display.

Do not persist the percentage as manually editable truth.

## Zero Eligible Days

If:

`EligibleOperationalDays = 0`

then:

```text
UtilizationPercent = Unavailable
```

Do not divide by zero.

Display an appropriate explanation.

## No Qualitative Utilization Categories

Do not invent:

- Low utilization;
- Medium utilization;
- High utilization;
- Underutilized;

thresholds in VS013.

Only show the measured percentage.

Idle detection is a separate indicator.

## Canonical Idle Eligibility

Evaluate idle status using trusted current server time.

A vehicle is idle-eligible only when:

1. vehicle exists;
2. current `vehicles.is_active = true`;
3. canonical VS012 maintenance readiness = Ready;
4. no active canonical rental exists;
5. no other explicit current rental-use blocker exists.

If any fail:

```text
Idle = false
```

and explain why idle classification is not applicable where useful.

## Maintenance Readiness Reuse

Reuse:

`calculateMaintenanceReadiness`

or the canonical VS012 readiness boundary.

Do not reimplement maintenance logic in VS013.

## Active Rental Check

An active rental exists when:

```text
started_at IS NOT NULL
AND ended_at IS NULL
```

If active rental exists:

```text
Idle = false
```

Do not calculate idle duration from an earlier rental.

## Idle Reference — Previously Rented

If at least one ended rental exists:

```text
IdleReference =
latest ended_at
```

Use canonical physical-return timestamp.

Do not use scheduled return.

## Idle Reference — Never Rented

If no ended rental exists:

use the earliest trustworthy canonical operational-availability/active-state timestamp only when it actually establishes operational availability.

For pre-VS013 vehicles whose first event merely records current state at migration/tracking start:

that timestamp may serve as the beginning of **known prospective eligibility**, but must not be represented as the historical date the vehicle originally became available.

Idle may become determinable prospectively after 14 days of continuous known eligibility from that event.

For earlier historical periods:

do not fabricate idle duration.

## Idle Threshold

Fixed:

**14 consecutive days**

Do not make configurable.

When:

```text
IdleEligible = true
AND trustworthy idle duration >= 14 days
```

then:

```text
Idle = true
```

Otherwise:

```text
Idle = false
```

If there is no trustworthy reference:

```text
Idle = Unable to Determine
```

rather than false certainty.

## Idle Duration and Maintenance

The study definition requires the vehicle to currently be rental-ready.

Do not label a currently maintenance-blocked vehicle Idle.

The baseline idle duration may still be measured from the last ended rental/reference for informational purposes, but the classification requires current readiness.

Do not invent a separate accumulated “eligible idle days excluding historical maintenance” metric unless required later.

## Analytics Read Model

Create a trusted server-side analytics representation per vehicle.

At minimum include:

- vehicle ID;
- vehicle display information;
- branch;
- category;
- current active state;
- reporting start;
- reporting end;
- coverage state;
- Rental Days;
- Eligible Operational Days when determinable;
- Utilization Percent nullable;
- current maintenance readiness;
- readiness reasons where safe;
- active-rental boolean;
- idle eligibility;
- idle reference nullable;
- idle duration/days nullable;
- idle classification:
  - `Idle`
  - `Not Idle`
  - `Unable to Determine`.

Do not expose raw maintenance remarks/costs through the analytics response.

## Owner/Admin API

Create a focused authenticated server endpoint or equivalent trusted boundary for fleet analytics.

Owner/Admin may request:

- default 30-day report;
- bounded custom date range.

Do not allow client-supplied analytics values.

## Operations Staff API

Operations Staff may receive safe read-only operational analytics:

- utilization;
- idle indication;
- active-rental state;
- maintenance-ready/not-ready summary.

Do not expose:

- maintenance cost;
- maintenance remarks;
- protected customer/payment information.

No analytics mutations exist.

## Customer/Renter

Customer/Renter must not receive fleet-wide utilization/idle analytics.

Reject unauthorized analytics access.

## Owner/Admin UI

Integrate into the existing dashboard/report/fleet surface.

Do not broadly redesign the application.

At minimum provide:

- reporting date range;
- utilization per vehicle;
- Rental Days;
- Eligible Operational Days;
- coverage warning where incomplete;
- active-rental state;
- maintenance readiness;
- idle status;
- idle duration where determinable.

Make:

`Unavailable`

different from:

`0%`

A vehicle with insufficient eligibility history must not appear to have 0% utilization.

## Operations Staff UI

Where an existing fleet coordination screen exists, a safe read-only view may display the same operational indicators.

Do not add mutation controls.

## Current Vehicle State Event Integration

Inspect the canonical vehicle create/update boundary.

Add state-history synchronization only where necessary.

Do not broadly rewrite vehicle management.

Ensure:

```text
vehicles.is_active
+
vehicle_operational_state_events
```

remain transactionally consistent for future changes.

## Existing Vehicle Bootstrap

Use an additive migration or controlled initialization mechanism.

For each existing vehicle lacking state events:

record one event using its current canonical `is_active`.

Use tracking-start time as effective time.

Do not backdate.

Make bootstrap idempotent.

## Analytics Functions

Prefer separately testable pure functions for:

- local-day enumeration;
- rental-day overlap;
- maintenance-day overlap;
- operational-state resolution;
- coverage determination;
- utilization calculation;
- idle-duration calculation.

Keep data fetching/auth separate where practical.

## Trusted Current Time

Do not trust browser-provided “now”.

Use trusted server/database current time.

Tests may inject a deterministic clock into pure calculation functions.

## Testing

Add focused tests for at least:

- Confirmed booking without rental = zero Rental Days;
- same-day rental = one Rental Day;
- cross-midnight Manila rental = two Rental Days;
- multiple rentals same date count once;
- active rental counts through trusted current date;
- incomplete active-state history makes utilization Unavailable;
- current `is_active` is not backdated;
- blocking maintenance excludes non-rental day;
- rental day remains eligible when blocking maintenance begins later same day;
- Cancelled maintenance does not establish downtime;
- zero Eligible Operational Days avoids divide-by-zero;
- percentage calculation uses Rental Days / Eligible Operational Days;
- percentage is not persisted/editable;
- inactive vehicle not Idle;
- not-maintenance-ready vehicle not Idle;
- active-rental vehicle not Idle;
- latest ended rental is idle reference;
- 13 days = Not Idle;
- 14 days = Idle;
- never-rented vehicle without trustworthy reference = Unable to Determine;
- prospective state-history baseline can become determinable after sufficient known time;
- Customer cannot access fleet analytics;
- Owner/Admin can access;
- Operations Staff receives only safe read-only analytics;
- vehicle active-state mutation creates matching state event;
- state-event/master-state update is atomic.

## Provider-Backed Validation

Where configured, validate at minimum:

1. existing vehicles receive non-backdated initial state events;
2. future active/inactive change records state history;
3. state/master update remains consistent;
4. canonical rental interval produces expected Rental Days;
5. maintenance blocking interval affects Eligible Operational Days;
6. incomplete historical coverage returns utilization Unavailable;
7. complete test coverage produces correct utilization;
8. latest ended rental drives idle reference;
9. 14-day threshold works;
10. active rental prevents Idle;
11. maintenance-not-ready prevents Idle;
12. Customer cannot access analytics;
13. Owner/Admin can access analytics;
14. Operations Staff receives safe read-only analytics.

Use clearly labeled disposable/demo data where historical test intervals are required.

## Client Clarification Preservation

Do not resolve or remove:

`CQ-023`

Do not claim tracking-start events are historical acquisition/availability dates.

## Definition of Done

VS013 is complete when:

- utilization uses canonical rental intervals;
- Rental Days use Asia/Manila distinct calendar dates;
- active/inactive state history is canonically tracked going forward;
- historical eligibility gaps are represented explicitly;
- Eligible Operational Days account for known inactive/maintenance-unavailable days;
- utilization percentage is correct when coverage is complete;
- insufficient coverage yields Unavailable rather than misleading 0%;
- idle eligibility reuses canonical maintenance readiness;
- active rental prevents idle classification;
- latest ended rental drives idle reference for previously rented vehicles;
- never-rented vehicles without trustworthy baseline are not falsely classified;
- fixed 14-day threshold is implemented;
- analytics are read-only/advisory;
- no automatic transfer/allocation occurs;
- Customer cannot access fleet-wide analytics.

## Stop Rule

Stop after Vehicle Utilization and Idle Detection is complete.

Do not implement:

- demand forecasting;
- WMA/MAPE;
- branch demand;
- projected supply;
- branch allocation;
- Smart Vehicle Finder integration;
- automatic fleet movement;
- analytics export unless trivially already supported;
- notifications;
- VS014.