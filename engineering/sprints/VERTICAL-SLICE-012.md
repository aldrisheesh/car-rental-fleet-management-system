# Vertical Slice 012 — Maintenance Monitoring and Readiness

**Status:** Approved for implementation  
**Objective:** Establish canonical vehicle maintenance/service records and one reusable deterministic maintenance-readiness calculation so later utilization, idle detection, vehicle recommendation, assignment review, projected supply, and branch-allocation capabilities can rely on authoritative fleet eligibility data.

## Purpose

VS001–VS011 established the transactional foundation from booking request through physical vehicle return.

VS012 begins the fleet-management intelligence foundation.

The manuscript requires maintenance monitoring using:

- maintenance status;
- preventive-maintenance schedule;
- mileage/odometer;
- vehicle condition;
- maintenance history;
- repair history;
- maintenance cost;
- remarks;
- related operational updates.

Maintenance readiness is also an input to:

- customer vehicle recommendation;
- assignment review;
- projected available supply;
- idle-vehicle detection;
- branch allocation.

VS012 must therefore establish canonical maintenance information **before** utilization/idle analytics and allocation logic are implemented.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/03-workflows-and-status-rules.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/10-open-decisions.md`
- `codex-context/14-client-clarification-register.md`
- `codex-context/18-maintenance-monitoring-and-readiness.md`
- this slice contract.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

Inspect only existing:

- vehicle/master-data implementation;
- canonical odometer data if present;
- current maintenance prototype/UI;
- admin fleet/vehicle pages;
- auth/server helpers;
- Supabase schema/migrations required for VS012.

## Core Boundary

VS012 establishes:

```text
Vehicle
   ↓
Maintenance / Service Records
   ↓
Blocking maintenance?
Preventive maintenance due?
Condition blocks rental?
Unresolved repair concern?
   ↓
Canonical derived readiness
   ↓
Maintenance Ready
        OR
Not Maintenance Ready + reasons
```

Maintenance readiness is **derived**.

Do not persist a freely editable:

`maintenance_ready = true/false`

as authoritative truth.

## Authority

### Owner/Admin

May:

- create maintenance/service records;
- update permitted maintenance information;
- complete maintenance records;
- cancel maintenance records;
- record preventive-maintenance targets;
- record service odometer;
- record maintenance cost;
- record remarks;
- view maintenance history;
- view derived maintenance readiness and reasons.

### Operations Staff

Until `CQ-015` and `CQ-016` are confirmed:

- may not receive broad maintenance mutation authority;
- may receive safe read-only maintenance/readiness information where needed for operational coordination.

Use least privilege.

### Customer/Renter

May not:

- create maintenance records;
- update maintenance records;
- read raw internal maintenance history/cost/remarks.

Customer-facing vehicle workflows may later consume a safe readiness result without exposing maintenance details.

## Canonical Maintenance Persistence

Create additive canonical maintenance/service persistence.

Use repository naming conventions.

Each maintenance record belongs to exactly one canonical vehicle.

Persist at minimum:

- maintenance record ID;
- vehicle ID;
- service/maintenance type or concise category;
- service/repair description;
- baseline maintenance state;
- `blocks_rental_use`;
- service start timestamp/date;
- completion timestamp/date nullable;
- odometer at service nullable;
- next-service odometer nullable;
- next-service date nullable;
- cost nullable;
- remarks nullable;
- created by;
- updated by where appropriate;
- created at;
- updated at.

Do not create unrelated workshop/inventory entities.

## Minimal Baseline Maintenance State

Use only:

- `Open`
- `Completed`
- `Cancelled`

These are implementation states required to support deterministic readiness.

They are **not** Briah's final client-confirmed maintenance vocabulary.

`CQ-015` remains open.

### Open

Represents unresolved/in-progress maintenance/service/repair.

Whether it blocks rental use is determined by:

`blocks_rental_use`

### Completed

Represents completed/resolved service or repair.

### Cancelled

Represents a voided/cancelled maintenance record that no longer represents active work.

## State Transition Rules

For VS012, support only the minimum transitions:

```text
Open → Completed
Open → Cancelled
```

Do not implement:

```text
Completed → Open
Cancelled → Open
```

or other reopening/rework behavior unless later approved.

Do not delete completed maintenance history merely to recreate it.

If another service event is required, create another maintenance record.

## Blocking Maintenance

`blocks_rental_use` must be explicit.

An active blocking maintenance condition exists when:

```text
state = Open
AND
blocks_rental_use = true
```

An Open record with:

`blocks_rental_use = false`

does not by itself make the vehicle Not Maintenance Ready.

Do not infer blocking behavior from free-text descriptions.

## Preventive Maintenance

Support applicable preventive-maintenance targets:

- `next_service_odometer`;
- `next_service_date`.

Either may be null.

At least one does not need to exist for every record.

Do not invent missing intervals.

### Due / Overdue by Odometer

When both are available:

```text
current_vehicle_odometer >= next_service_odometer
```

means the applicable preventive maintenance is due/overdue.

### Due / Overdue by Date

When:

```text
current_date >= next_service_date
```

the applicable preventive maintenance is due/overdue.

If either applicable recorded criterion is due:

the vehicle is not Maintenance Ready until the applicable maintenance concern is resolved/updated through canonical maintenance records.

## Preventive-Maintenance Target Source

Do not infer service intervals such as:

- every 5,000 km;
- every 10,000 km;
- every six months;

unless Owner/Admin explicitly records the applicable next-service target.

No manufacturer API/service-schedule integration belongs in VS012.

## Canonical Vehicle Odometer

Inspect whether the canonical `vehicles` model already contains a trustworthy odometer/mileage field.

### If one already exists

Use it as the current odometer for maintenance-readiness checks.

### If none exists

Add the smallest appropriate canonical field, such as:

`current_odometer_km`

to the vehicle model through an additive migration.

Do not fabricate a value for existing vehicles.

Nullable is acceptable when no trustworthy reading exists.

## Odometer Update Rules

When a maintenance record includes:

`odometer_at_service`

validate:

- numeric;
- finite;
- non-negative.

If updating canonical vehicle odometer:

```text
new_odometer >= current_vehicle_odometer
```

must hold.

Never reduce canonical vehicle mileage.

The existing rental release/return snapshots remain historical records.

Do not rewrite them when vehicle master odometer changes.

## Missing Current Odometer

If a maintenance record has a next-service odometer but the vehicle has no trustworthy current odometer:

do not assume the mileage-based maintenance check passes.

Return an appropriate readiness reason such as:

`Current odometer unavailable for recorded service target`

or equivalent.

Do not fabricate `Maintenance Ready`.

Date-based criteria may still be evaluated independently.

## Vehicle Condition Blocking

The system needs a deterministic way to represent whether current vehicle condition blocks rental use.

Use the smallest explicit canonical mechanism.

A suitable implementation may add a vehicle-level boolean such as:

`condition_blocks_rental_use`

or an equivalent explicit field consistent with the existing schema.

Do not determine this from free-text condition/remarks.

Owner/Admin may update the explicit blocking condition where the current vehicle-management implementation reasonably supports it.

Do not invent a large condition classification system in VS012.

## Unresolved Blocking Repair Concern

An unresolved blocking repair concern may be represented through an:

```text
Open
+
blocks_rental_use = true
```

maintenance/repair record.

Do not create a duplicate independent repair-state system unless the repository already has one that is canonical.

## Derived Maintenance Readiness

Implement one canonical server-side calculation/read model.

At minimum:

```text
Maintenance Ready
```

requires:

1. vehicle exists;
2. vehicle is active;
3. no Open maintenance record with `blocks_rental_use = true`;
4. no recorded applicable next-service date is due/overdue;
5. no recorded applicable next-service odometer is due/overdue;
6. vehicle condition does not explicitly block rental use;
7. no required readiness input is unavailable in a way that prevents safe determination.

Otherwise:

```text
Not Maintenance Ready
```

## Readiness Reasons

Return structured/safe reasons where applicable.

Examples:

- `Vehicle inactive`
- `Active blocking maintenance`
- `Preventive maintenance due by date`
- `Preventive maintenance due by odometer`
- `Vehicle condition blocks rental use`
- `Current odometer unavailable for recorded service target`

Do not derive reason text from arbitrary maintenance remarks.

## One Canonical Calculation Boundary

Avoid separate implementations such as:

```text
isMaintenanceReadyForAssignment()
isMaintenanceReadyForRecommendation()
isMaintenanceReadyForIdle()
isMaintenanceReadyForAllocation()
```

with different logic.

Create one reusable trusted calculation/service/query boundary.

Later slices should consume this canonical result.

## Maintenance Record Creation

Owner/Admin may create a maintenance record for an active canonical vehicle.

Validate:

- vehicle exists;
- service type/category is non-empty;
- description is non-empty;
- valid baseline state;
- valid blocking flag;
- valid optional odometer;
- valid optional next-service odometer/date;
- valid optional non-negative cost.

New active maintenance work should normally begin as:

`Open`

Do not allow clients to spoof creator identity.

## Maintenance Completion

Only Owner/Admin may perform:

`Open → Completed`

Record completion time at the trusted server/database boundary.

Do not trust arbitrary client-supplied completion identity.

When completing maintenance, allow Owner/Admin to record/update applicable:

- odometer at service;
- next-service odometer;
- next-service date;
- cost;
- remarks.

After completion, recalculate readiness from canonical records.

Do not automatically force readiness to true.

Another blocking/due condition may still exist.

## Maintenance Cancellation

Only Owner/Admin may perform:

`Open → Cancelled`

Cancellation removes that specific record from active blocking-maintenance consideration.

It does not automatically make the vehicle ready if another readiness problem exists.

Record cancellation/update metadata appropriately.

## Historical Integrity

Do not delete/overwrite completed/cancelled maintenance records to represent new service.

Maintain chronological maintenance history.

For each vehicle, Owner/Admin should be able to inspect historical:

- service type;
- description;
- state;
- dates;
- odometer;
- next-service targets;
- cost;
- remarks.

## Maintenance During Active Rental

If Owner/Admin records a maintenance concern for a vehicle that currently has an active rental:

- allow the concern to be recorded if operationally necessary;
- do not automatically end the rental;
- visibly indicate the vehicle currently has an active rental;
- visibly indicate any blocking-maintenance conflict.

Do not invent emergency return/recovery behavior.

## Maintenance Readiness and Existing VS009 Assignment

VS009 previously could not enforce maintenance readiness because canonical maintenance data did not yet exist.

VS012 establishes that data.

Do **not** broadly rewrite VS009 in this slice.

However, expose the canonical readiness service so the next integration/correction slice can consume it where required.

If adding a small, safe read-only readiness indication to existing vehicle/admin surfaces is trivial and directly required for VS012, that is allowed.

Do not modify booking confirmation behavior beyond VS012 scope.

## Maintenance Readiness and Customer Data

Do not expose raw maintenance history to Customer/Renter.

A future recommendation/availability endpoint may consume:

```text
maintenanceReady
```

internally.

If a customer-facing vehicle should be excluded because it is not ready, exclude or mark it unavailable according to the later approved slice.

Do not expose:

- maintenance cost;
- repair remarks;
- internal safety notes.

## Maintenance Cost

Optional maintenance cost:

- numeric;
- non-negative;
- PHP.

Do not:

- include maintenance cost in customer rental price;
- treat maintenance cost as a customer charge;
- implement accounting/reporting beyond basic record storage.

## Owner/Admin UI Integration

Use the existing fleet/vehicle/maintenance surface where practical.

Provide the minimum usable workflow:

### Vehicle maintenance view

Show:

- vehicle identity;
- active state;
- current odometer when available;
- derived maintenance readiness;
- readiness reason(s);
- open maintenance records;
- maintenance history.

### Create maintenance

Support:

- service/category;
- description;
- blocking toggle;
- service start;
- odometer at service;
- next-service odometer;
- next-service date;
- cost;
- remarks.

### Existing Open record

Support:

- view;
- Complete;
- Cancel;
- applicable completion/update fields.

Do not broadly redesign the fleet module.

## Operations Staff UI

Do not add maintenance mutation controls.

If existing fleet coordination pages benefit from a safe readiness indicator, read-only:

```text
Ready / Not Ready
```

may be displayed.

Do not expose internal maintenance cost/remarks unnecessarily.

## Customer UI

No raw maintenance-management UI is required.

Do not expose maintenance records.

## Trusted Server Boundary

Maintenance mutations must validate:

- authentication;
- active account;
- Owner/Admin role;
- canonical vehicle;
- current maintenance state;
- input values.

Do not authorize based on client-side role/UI.

## Database / RLS

Use additive migrations.

Use least privilege.

Do not allow Customer/Renter or Operations Staff to directly mutate maintenance records.

Do not expose maintenance records publicly.

Prefer trusted server-mediated operational reads/mutations consistent with the completed architecture.

## Error Handling

Handle at minimum:

- unauthenticated request;
- wrong role;
- vehicle not found;
- maintenance record not found;
- invalid transition;
- invalid/negative odometer;
- odometer regression;
- invalid/negative cost;
- invalid next-service values;
- provider/database failure.

Use controlled errors.

Do not expose raw SQL or internal stack traces.

## Testing

Add focused tests where practical for:

- Owner/Admin can create maintenance;
- Customer cannot create/update maintenance;
- Operations Staff cannot create/update maintenance;
- Open blocking record makes readiness false;
- Open non-blocking record alone does not make readiness false;
- Completed/cancelled record does not count as active blocking maintenance;
- next-service date due makes readiness false;
- future next-service date does not make readiness false;
- next-service odometer reached makes readiness false;
- missing current odometer with recorded mileage target does not fabricate readiness;
- condition-blocking flag makes readiness false;
- inactive vehicle makes readiness false;
- multiple readiness failures return appropriate reasons;
- completing one record does not incorrectly override another blocker;
- odometer cannot regress;
- cost cannot be negative;
- historical maintenance records remain;
- maintenance concern during active rental does not end rental.

## Provider-Backed Validation

Where configured, validate at minimum:

1. Owner/Admin creates a non-blocking maintenance record;
2. record survives reload;
3. Owner/Admin creates a blocking Open record;
4. vehicle derives Not Maintenance Ready;
5. completing the blocking record removes that specific blocker;
6. another due criterion still keeps readiness false where applicable;
7. next-service date due is detected;
8. next-service odometer due is detected when current odometer exists;
9. Customer cannot mutate maintenance;
10. Operations Staff cannot mutate maintenance;
11. maintenance history remains after completion/cancellation;
12. active rental is not automatically ended by maintenance creation.

Use disposable development data where practical.

## Client Clarification Preservation

Do not resolve or remove:

- `CQ-009`;
- `CQ-015`;
- `CQ-016`;
- `CQ-020`.

In particular, do not present:

- `Open`;
- `Completed`;
- `Cancelled`;

as Briah's confirmed final maintenance terminology.

They are the minimal implementation states for the current baseline.

## Definition of Done

VS012 is complete when:

- canonical maintenance/service records exist;
- Owner/Admin can create/manage minimal maintenance history;
- active blocking maintenance is represented explicitly;
- preventive-maintenance targets are persisted;
- canonical odometer can support mileage-based readiness without regression;
- vehicle condition can explicitly block rental use;
- maintenance readiness is derived from one reusable trusted calculation;
- readiness provides meaningful reasons;
- Customer/Operations Staff cannot mutate maintenance;
- maintenance history is preserved;
- active rental is not silently changed by maintenance;
- no utilization/idle/forecast/allocation capability is implemented prematurely.

## Stop Rule

Stop after Maintenance Monitoring and Readiness is complete.

Do not implement:

- utilization dashboard;
- idle-vehicle detection;
- forecasting;
- branch demand;
- projected supply;
- branch allocation;
- customer Smart Vehicle Finder integration;
- maintenance notifications;
- parts inventory;
- suppliers/mechanics;
- VS013.