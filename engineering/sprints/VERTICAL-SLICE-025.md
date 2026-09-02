# Vertical Slice 025 — Canonical Maintenance Administration UI

**Status:** Approved for implementation
**Objective:** Replace the prototype-backed Admin Maintenance page with a canonical maintenance administration experience using the existing maintenance backend, readiness logic, vehicle odometer/PMS data, and allowed maintenance lifecycle transitions.

## Purpose

The maintenance backend is already canonical.

VS025 does not redesign maintenance business logic.

It connects the Admin Maintenance UI to the real implementation:

```text
Canonical maintenance records
        ↓
Maintenance API
        ↓
Maintenance readiness
        ↓
Admin Maintenance UI
        ↓
Create
Review
Complete
Cancel
History
PMS/readiness
```

The current prototype data and local-only status behavior must be removed.

---

## Manuscript Traceability

### Supports

The latest manuscript maintenance scope around:

- vehicle maintenance records;
- preventive maintenance / PMS;
- vehicle mileage/odometer monitoring;
- next PMS date;
- next PMS mileage;
- maintenance history;
- service cost;
- vehicle condition/readiness;
- maintenance administration;
- preventing unresolved-maintenance vehicles from being considered ready for rental.

### Existing MIC

`MIC-018 — Maintenance Backend Is Canonical but Admin Maintenance UI Still Contains Prototype Data`

VS025 is intended to close the remaining UI portion of MIC-018.

After implementation review:

```text
MIC-018
→ update to IMPLEMENTED / CANONICALIZED
```

### Still Pending

`MIC-019 — Maintenance and Low-Availability Notifications`

VS025 does not implement those notifications.

### Manuscript Schema Mismatch

The manuscript currently contains some legacy maintenance fields/statuses such as:

```text
Scheduled
In Progress
Overdue
condition_before
condition_after
performed_by
```

The canonical implementation instead currently uses:

```text
Open
Completed
Cancelled
```

with PMS due/overdue derived from maintenance targets/readiness.

VS025 must follow the canonical implemented data model.

Do not recreate obsolete fields/statuses merely to match the older manuscript.

---

## Required Context

Read only:

1. `engineering/AI-ENGINEERING-CONTEXT.md`
2. `engineering/sprints/VERTICAL-SLICE-025.md`
3. `codex-context/25-canonical-subsystem-map.md`
4. `codex-context/37-canonical-maintenance-admin-ui.md`
5. `codex-context/38-manuscript-traceability-vs025.md`

Then inspect only the exact maintenance-related implementation surfaces required below.

Do not read previous vertical-slice contracts.

---

## Strict Initial Inspection

Inspect:

1. `src/routes/admin.maintenance.tsx`
2. `src/components/admin/MaintenanceRecordDialog.tsx`
3. `src/routes/api.maintenance.ts`
4. `src/lib/maintenance-readiness.server.ts`
5. shared pure maintenance-readiness helper if needed
6. canonical vehicle list/read endpoint already used elsewhere in Admin UI
7. exact maintenance schema/RPC definitions only where necessary to confirm supported fields

Do not inspect or modify unrelated subsystems.

---

# Canonical Maintenance Lifecycle

Persisted maintenance status is:

```text
Open
Completed
Cancelled
```

Allowed transitions:

```text
Open
  ├── Completed
  └── Cancelled
```

Do not introduce:

```text
Scheduled
In Progress
Overdue
```

as persisted statuses.

Those were prototype/legacy concepts.

---

# Derived Maintenance State

Concepts such as:

```text
Due
Overdue
PMS Due
Not Ready
```

must be derived from canonical data.

At minimum, canonical readiness already considers:

```text
Vehicle inactive
Active blocking maintenance
Preventive maintenance due by date
Preventive maintenance due by odometer
Vehicle condition blocks rental use
Current odometer unavailable for recorded service target
```

Do not create a second independent readiness algorithm inside the React page.

---

# Remove Prototype Data

`src/routes/admin.maintenance.tsx` must no longer import:

```text
maintenance
fleet
```

from:

```text
@/data/admin
```

for Maintenance-page behavior.

Remove prototype-only:

```text
statusOverrides
hard-coded downtime data
mock service records
mock maintenance KPIs
```

Do not replace those with different fabricated values.

---

# Data Loading

Use canonical server-backed data.

Maintenance records:

```text
GET /api/maintenance
```

Vehicle options:

Reuse the existing canonical vehicle endpoint/read path already used elsewhere in the Admin application.

Do not create another duplicate fleet data source unless there is a concrete architectural blocker.

---

# Page States

The Maintenance page must support:

```text
loading
loaded
empty
error
mutation pending
mutation error
```

Do not silently fail requests.

Do not pretend an operation succeeded until the server confirms it.

---

# Recommended Page Structure

## 1. Page Header

Title:

```text
Maintenance
```

Subtitle should reflect real functionality, e.g.:

```text
Preventive maintenance, service records, and vehicle readiness.
```

Primary action:

```text
Add maintenance record
```

or:

```text
Record maintenance
```

Avoid wording such as `Schedule service` if it implies a separate persisted Scheduled state.

---

# 2. Canonical Summary KPIs

Use only defensible canonical metrics.

Recommended:

```text
Open Maintenance
Blocking Maintenance
PMS / Readiness Attention
Service Spend
```

Exact labels may follow existing UI style.

## Open Maintenance

Count:

```text
status === "Open"
```

## Blocking Maintenance

Count Open records where:

```text
blocks_rental_use === true
```

Do not count completed/cancelled blockers as active.

## PMS / Readiness Attention

Prefer a canonical count of vehicles that fail maintenance readiness or are due by date/odometer.

Do not infer this from all Open records.

If retrieving readiness for every vehicle would create unreasonable N+1 behavior, implement the smallest canonical server-side summary/read enhancement necessary.

Do not duplicate readiness calculations in the client.

## Service Spend

If retained:

Use actual canonical cost data.

Prefer completed maintenance records for actual spend.

If shown as monthly spend:

```text
completed_at within current month
AND
status = Completed
AND
cost_php != null
```

Do not sum Open planned values and call them actual spend.

If a defensible spend metric is awkward with current data, omit the KPI rather than inventing one.

---

# 3. Maintenance Attention / Readiness

Surface vehicles requiring attention.

Use canonical readiness reasons.

Example presentation:

```text
Toyota Innova
Not maintenance-ready

Reasons:
• Preventive maintenance due by odometer
• Active blocking maintenance
```

Do not invent severity percentages or health scores.

If there are no attention items:

```text
All eligible active vehicles are maintenance-ready.
```

or equivalent.

---

# 4. Active Maintenance

Display canonical:

```text
status = Open
```

records separately from history.

Recommended columns/details:

```text
Vehicle
Plate
Maintenance type
Description
Started
Current/service odometer
Next service date
Next service odometer
Cost
Rental blocking
Actions
```

Use responsive layout consistent with existing Admin UI.

Not every value must be a table column if a detail/card layout is clearer.

---

# Blocking Maintenance Presentation

If:

```text
blocks_rental_use = true
```

display an explicit status such as:

```text
Blocks rental use
```

Use text, not color alone.

This is a canonical operational condition.

Do not manually change the vehicle's availability in VS025.

The canonical readiness/assignment layer already handles it.

---

# 5. Maintenance History

Display:

```text
Completed
Cancelled
```

records.

Do not remove completed/cancelled records from history.

Recommended information:

```text
vehicle
plate
maintenance type
status
description
service date
completed date
odometer
next PMS target
cost
remarks
```

Sort newest/relevant first.

---

# Create Maintenance Form

Refactor `MaintenanceRecordDialog` or replace it with a repository-consistent canonical form.

Do not preserve prototype draft fields simply because they already exist.

## Required Fields

```text
vehicle
maintenanceType
description
```

## Supported Optional Fields

Where supported by the current canonical API:

```text
blocksRentalUse
serviceStartedAt
odometerAtService
nextServiceOdometer
nextServiceDate
costPhp
remarks
```

---

# Create-Time Status

Do not show:

```text
Maintenance Status
```

selector during creation.

New records always start:

```text
Open
```

The server already enforces this.

---

# Remove Fake Metadata Inputs

Do not ask Owner/Admin to manually enter:

```text
maintenance_id
recorded_by
created_at
completed_date
```

during record creation.

Those are system/lifecycle metadata.

The authenticated server actor remains authoritative.

---

# Maintenance Type

The existing maintenance-type options may be retained if they are useful:

```text
Preventive Maintenance
Brake Service
Engine Oil & Filter
Tire Rotation
Aircon Service
Suspension Check
General Repair
```

Do not treat this list as an immutable business enum unless the backend already does so.

If the current form architecture supports free-form or custom description separately, keep maintenance type concise.

---

# Service Started Time

The backend supports:

```text
serviceStartedAt
```

If the UI exposes it, default to the current date/time or another sensible Admin-editable value.

Do not confuse this with next PMS date.

---

# Odometer at Service

Expose:

```text
odometerAtService
```

where useful.

Validation must remain server authoritative.

The backend already rejects an odometer lower than the current canonical vehicle odometer where applicable.

Do not duplicate authoritative validation inconsistently.

Client-side validation may improve UX but server remains final.

---

# Next PMS / Service Target

Expose canonical optional:

```text
nextServiceDate
nextServiceOdometer
```

These are future preventive-maintenance targets.

Do not create separate:

```text
pms_date
pms_mileage_interval
```

client concepts unless they correspond to canonical persisted fields.

---

# Cost

Expose:

```text
costPhp
```

optional.

Must be non-negative.

Do not calculate rental charges from maintenance cost.

---

# Remarks

Expose:

```text
remarks
```

for final notes / maintenance observations.

Do not use immutable audit records as a substitute for remarks.

---

# Service Provider / performed_by

Before adding a `Performed By` field:

verify whether the actual canonical maintenance schema contains a supported field.

If it exists but `/api/maintenance` simply omits it:

a narrow API addition is permitted.

If it does not exist:

do not add schema solely for this UI slice.

Report it as:

```text
MANUSCRIPT / DATA MODEL RECONCILIATION GAP
```

and continue without the field.

Do not invent persistence.

---

# condition_before / condition_after

Do not introduce these fields unless already present in canonical schema.

The current maintenance/readiness model already uses vehicle-level condition and blocking state.

Any manuscript-only legacy fields belong to manuscript reconciliation.

---

# Create Mutation

Submit to:

```text
POST /api/maintenance
```

using canonical field names.

On success:

```text
refresh canonical maintenance records
refresh readiness/summary as necessary
close dialog
show success feedback if existing app patterns support it
```

On failure:

```text
keep dialog/page usable
show safe error
do not pretend record exists
```

---

# Active Rental Conflict

POST may return:

```text
active_rental_conflict
```

If true:

display a clear warning after successful creation.

Example:

```text
Maintenance was recorded, but this vehicle currently has an active rental.
Review the rental before taking the vehicle out of service.
```

Do not:

```text
automatically end rental
automatically cancel booking
automatically mutate assignment
```

---

# Complete Maintenance

For an Open record provide:

```text
Complete
```

action.

Completion may gather/update supported final canonical values:

```text
odometerAtService
nextServiceOdometer
nextServiceDate
costPhp
remarks
```

Then call:

```text
PATCH /api/maintenance

{
  id,
  status: "Completed",
  ...
}
```

Do not create a new maintenance record just to represent completion.

---

# Cancel Maintenance

For an Open record provide:

```text
Cancel
```

action.

Use:

```text
PATCH /api/maintenance

{
  id,
  status: "Cancelled",
  remarks?
}
```

Require deliberate user action.

Use an existing confirmation/dialog convention if available.

Do not physically delete the maintenance record.

---

# Immutable Final States

After:

```text
Completed
```

or:

```text
Cancelled
```

do not expose actions that transition the record again.

No:

```text
Completed → Open
Cancelled → Open
Completed → Cancelled
```

---

# Readiness Refresh

Create/complete/cancel may affect vehicle maintenance readiness.

After successful mutation, make sure the page's readiness presentation is refreshed rather than left stale.

Do not rely on page reload if a normal refetch/state update pattern exists.

---

# Downtime Chart

Remove the current hard-coded:

```text
Fleet downtime
Jan / Feb / Mar / ...
```

chart.

Do not implement historical downtime analytics in VS025 unless current canonical records already support it with a precise defensible calculation.

This slice does not need a replacement chart.

Use the space for useful canonical readiness/history content instead.

---

# Sorting

Active maintenance:

Prioritize meaningful canonical urgency.

Possible safe order:

```text
blocking Open records first
then service-start/created date
```

If PMS target urgency can be derived through existing shared logic, it may be surfaced.

Do not invent arbitrary urgency scores.

History:

Newest completed/cancelled first.

---

# Authorization

Preserve:

```text
Owner/Admin
```

as maintenance administration authority.

Do not weaken `/api/maintenance`.

Do not add Customer access.

Do not broaden Operations Staff permissions in this slice.

---

# Audit Boundary

Existing maintenance create/complete/cancel operations already participate in canonical audit coverage through backend flows.

VS025 must not implement:

```text
client-side audit log
second audit table
manual audit record UI
```

---

# Notifications Boundary

Do not implement:

```text
maintenance due notifications
low availability notifications
maintenance emails
```

in VS025.

MIC-019 remains pending.

A local page warning is not a notification subsystem.

---

# No Predictive Maintenance

Do not implement:

```text
AI vehicle-health score
predictive failure model
ML maintenance prediction
sensor telemetry
IoT
GPS monitoring
```

The implemented maintenance baseline is deterministic PMS/readiness monitoring.

---

# Loading UX

While initial canonical data loads:

show the existing application loading pattern.

Do not temporarily display prototype data.

---

# Error UX

If records cannot load:

show a meaningful safe message.

Example:

```text
Unable to load maintenance records.
```

Provide retry behavior where repository patterns allow it.

Do not swallow API errors.

---

# Empty UX

If no maintenance records exist:

```text
No maintenance records yet.
```

and make the create action available.

If no Open maintenance exists:

```text
No active maintenance.
```

History may still display.

---

# Testing

Add focused tests around the canonical page/data behavior.

## Prototype Removal

Verify:

```text
admin.maintenance.tsx
```

does not import:

```text
maintenance
fleet
```

from `@/data/admin`.

Verify hard-coded downtime data is gone.

---

## Maintenance Read

Test:

- Owner/Admin can retrieve records;
- canonical vehicle relation is displayed;
- Open / Completed / Cancelled values are reflected correctly;
- empty list works;
- API failure is handled.

---

## Create

Test:

- vehicle required;
- maintenance type required;
- description required;
- status is implicitly Open;
- optional canonical fields serialize correctly;
- no recorded-by/user-ID input;
- success refreshes canonical page;
- failure remains visible;
- active-rental conflict warning appears.

---

## Complete

Test:

- Complete shown only for Open;
- canonical supported final fields sent;
- successful completion refreshes state;
- failed completion does not mutate local display falsely.

---

## Cancel

Test:

- Cancel shown only for Open;
- successful cancellation refreshes state;
- final history shows Cancelled;
- no deletion.

---

## Readiness

Test:

- canonical readiness reasons render;
- blocking maintenance is visible;
- PMS due by date/odometer is represented through canonical readiness;
- no invented readiness percentages.

---

## KPI / Summary

Test:

- Open count reflects Open records;
- blocking count reflects active blocking records;
- no `Overdue = all Open` behavior;
- no fake In Progress value;
- no mock service-spend math.

---

## Scope

Verify no changes to:

- Finder;
- booking lifecycle;
- allocation;
- forecasting/supply;
- notification/reminder;
- external-context providers;
- pricing;
- audit architecture.

---

# Validation

Run at minimum:

```text
maintenance-focused tests
existing maintenance-readiness tests
appropriate API tests
build
focused lint
```

If no dedicated Admin Maintenance UI test harness exists, add the smallest sensible pure/component test coverage without introducing a new test framework.

Repository-wide unrelated lint debt is not part of VS025.

---

# Manuscript Post-Implementation Review

After implementation:

1. verify canonical fields actually exposed in the final UI;
2. update MIC-018 from partial to implemented;
3. determine whether a new MIC is needed for legacy manuscript maintenance status/schema differences;
4. update manuscript backlog for:
   - Maintenance_Records dictionary;
   - status vocabulary;
   - PMS mapping;
   - condition fields;
   - performed-by field if unsupported;
5. preserve MIC-019 as pending.

Do not edit the proposal paper during this implementation session.

---

# Definition of Done

VS025 is complete when:

- Maintenance page uses canonical API data;
- no Maintenance-page mock fleet/maintenance arrays remain;
- hard-coded downtime chart is gone;
- canonical statuses are displayed;
- due/overdue is derived rather than persisted;
- Open records can be completed or cancelled;
- create form maps correctly to backend;
- PMS/readiness information is visible;
- blocking maintenance is clearly identified;
- maintenance history is real;
- server errors are visible;
- mutations refresh canonical state;
- no unrelated maintenance subsystem is invented.

---

# Stop Rule

Stop after VS025.

Do not implement:

- VS026;
- maintenance notifications;
- low-availability alerts;
- predictive maintenance;
- reports/dashboard canonicalization;
- backup/recovery;
- GPS/telemetry;
- CQ-028;
- CQ-032.
