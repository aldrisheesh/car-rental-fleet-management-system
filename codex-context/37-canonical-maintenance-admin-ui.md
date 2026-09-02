# Canonical Maintenance Administration UI

**Status:** Frozen for VS025
**Last updated:** 2026-09-02
**Authority:** Existing canonical maintenance backend + latest manuscript maintenance requirements + MIC-018

VS025 replaces the prototype-backed Admin Maintenance page with a canonical maintenance administration experience using the already-implemented maintenance records, vehicle odometer/PMS targets, maintenance readiness, and allowed lifecycle transitions.

This is primarily a UI canonicalization slice.

## 1. Existing canonical backend

The current backend already supports:

- Owner/Admin-only maintenance record list;
- record creation;
- record completion;
- record cancellation;
- vehicle odometer at service;
- next-service odometer;
- next-service date;
- maintenance cost;
- remarks;
- blocking-rental-use flag;
- audit actor attribution through atomic RPCs;
- active-rental conflict awareness;
- maintenance readiness calculation.

Canonical maintenance record lifecycle currently is:

`Open -> Completed`
or
`Open -> Cancelled`

Do not invent parallel Scheduled/In Progress/Overdue database statuses in VS025.

## 2. Current UI problem

`src/routes/admin.maintenance.tsx` currently uses prototype data from `@/data/admin`.

Current incorrect/prototype behaviors include:

- mock fleet data;
- mock maintenance records;
- hard-coded downtime chart;
- local React-only status overrides;
- `Overdue` KPI calculated from all Open records;
- `Scheduled` KPI calculated from the same Open records;
- `In progress` hard-coded to zero;
- status selector values that do not match canonical backend status;
- create dialog fields that do not match the canonical backend contract.

VS025 removes these prototype assumptions from the Maintenance page.

## 3. Manuscript intent

The latest manuscript requires maintenance support around:

- maintenance records/history;
- preventive maintenance/PMS scheduling;
- mileage/odometer tracking;
- next PMS date/mileage;
- vehicle condition/readiness;
- service cost;
- service provider/remarks;
- authorized maintenance administration;
- preventing unresolved maintenance issues from being treated as rental-ready.

The manuscript data dictionary currently includes more legacy fields/status names than the canonical implementation.

VS025 should follow the canonical implemented backend rather than recreating legacy manuscript-only schema fields.

Manuscript reconciliation remains tracked by MIC-018 and may require a later data-dictionary update.

## 4. Canonical Admin page

The Admin Maintenance page should load real data through `/api/maintenance`.

Do not import `maintenance` or `fleet` from `@/data/admin`.

Vehicle options must come from a canonical vehicle read/API already used elsewhere in the Admin app.

Prefer reusing an existing canonical vehicle endpoint rather than creating a duplicate fleet service.

## 5. Page information architecture

Recommended sections:

### A. Maintenance summary
Use only values that can be calculated from canonical records/vehicles.

Suitable summary metrics include:

- Open maintenance records;
- Blocking maintenance records;
- PMS due/overdue vehicles;
- Completed service cost for the current month, if canonical dates/costs support it.

Do not retain prototype KPI names when no canonical calculation exists.

### B. Attention / readiness
Surface vehicles that are not maintenance-ready, using canonical readiness semantics.

Reasons may include:

- active blocking maintenance;
- preventive maintenance due by date;
- preventive maintenance due by odometer;
- vehicle condition blocks rental use;
- current odometer unavailable for recorded service target;
- vehicle inactive.

Do not invent a new readiness algorithm in the page.

### C. Active maintenance
Show Open records with meaningful fields such as:

- vehicle;
- license plate;
- maintenance type;
- description;
- blocks rental use;
- service started at;
- odometer at service;
- next service date;
- next service odometer;
- cost;
- remarks;
- created date.

Actions:
- Complete;
- Cancel.

Do not allow arbitrary status dropdown changes.

### D. Maintenance history
Show Completed and Cancelled records.

Sort newest/relevant first.

History may include:
- completed/cancelled status;
- completion timestamp;
- service details;
- odometer;
- next PMS target;
- cost;
- remarks.

## 6. Create maintenance record

Replace the prototype draft schema with fields that map directly to `/api/maintenance`.

Required:
- vehicle;
- maintenance type;
- description.

Optional/canonical where supported:
- blocks rental use;
- service started at;
- odometer at service;
- next-service odometer;
- next-service date;
- cost;
- remarks.

New records always begin `Open`.

Do not expose a create-time status selector for Completed/Cancelled.

Do not expose fake `recorded_by`; the server resolves the authenticated actor.

Do not expose fake maintenance ID or created timestamp inputs.

## 7. Service provider / performed-by gap

The latest manuscript includes `performed_by`, but the current canonical API/schema contract exposed to the page does not currently accept a service-provider field.

VS025 must NOT silently invent persistence for this field.

If the actual canonical `maintenance_records` table already contains a suitable service-provider field that the current API simply omits, the implementation may add narrow read/write support after verifying the schema.

If no such canonical field exists:
- do not create it merely for UI parity in VS025;
- record it as a manuscript/data-model reconciliation gap;
- keep VS025 focused on existing canonical backend fields.

## 8. Condition before/after gap

The manuscript includes legacy `condition_before` / `condition_after` fields.

Current canonical maintenance readiness instead uses vehicle-level condition blocking and maintenance records.

Do not add condition_before/condition_after columns or UI controls in VS025 unless they already exist canonically.

This is a manuscript reconciliation matter, not a reason to recreate an older schema.

## 9. PMS meaning

Do not create a separate duplicate PMS subsystem.

Use the current canonical maintenance fields:
- current vehicle odometer;
- next_service_date;
- next_service_odometer;
- completed/open maintenance records;
- maintenance readiness.

The canonical readiness service determines whether PMS is due by date or odometer.

## 10. Overdue meaning

Do not store `Overdue` as a maintenance-record status merely to match the old UI/manuscript enum.

Overdue/due is a derived presentation state.

For preventive targets:
- due by date when next-service date is reached/passed;
- due by odometer when current odometer reaches/passes next-service odometer.

Use canonical readiness logic or shared pure helpers rather than duplicating inconsistent logic in UI.

## 11. Blocking maintenance

`blocks_rental_use` is operationally important.

The UI must clearly distinguish:
- Open non-blocking maintenance;
- Open blocking maintenance.

Blocking maintenance already participates in canonical readiness and assignment safeguards.

Do not create a second independent vehicle availability flag.

## 12. Active rental conflict

The create API can return an `active_rental_conflict` indicator.

If present:
- show a clear warning to Owner/Admin;
- do not silently hide it.

Do not automatically end or alter the rental.

## 13. Completion

Completing an Open maintenance record may include final canonical values supported by PATCH:

- odometer at service;
- next-service odometer;
- next-service date;
- cost;
- remarks.

Use the existing atomic backend transition.

Do not allow Completed -> Open or Completed -> Cancelled.

## 14. Cancellation

Cancel only Open records.

Use the existing canonical PATCH transition.

Cancellation may include remarks if supported.

Do not delete maintenance history to represent cancellation.

## 15. Authorization

Maintenance administration is Owner/Admin-only.

Preserve current API role enforcement.

Do not expand Operations Staff or Customer permissions in VS025 unless an already-canonical app rule explicitly requires it.

## 16. Downtime chart

Remove the hard-coded `Fleet downtime` chart unless canonical data can support a defensible calculation without expanding scope.

Do not replace one mock chart with another inferred chart.

A simpler canonical maintenance/readiness panel is preferable.

## 17. Cost

If showing service spend:
- compute only from canonical records with real cost values;
- define the time window explicitly;
- prefer completed service records for actual spend.

Do not sum all mock/open future costs as actual monthly spend.

## 18. Empty/loading/error states

The canonical page must handle:

- loading;
- no maintenance records;
- no Open records;
- no history;
- server failure;
- action failure.

Do not optimistically close dialogs while silently ignoring failed writes.

Display actionable error feedback.

## 19. Refetch / mutation consistency

After successful create/complete/cancel:
- refresh or update canonical state;
- do not rely on local-only overrides.

The page must reflect the server result.

## 20. No new predictive maintenance algorithm

The literature discusses predictive maintenance, but the current capstone implementation is rule-based PMS/readiness monitoring.

VS025 must not introduce:
- machine learning;
- failure prediction;
- sensor telemetry;
- artificial predictive-health scores.

## 21. No maintenance notifications yet

MIC-019 remains pending.

VS025 does not implement:
- maintenance alert notification generation;
- low-availability alerts;
- email/SMS maintenance alerts.

The page may display derived due/readiness warnings locally.

## 22. Audit

Existing create/complete/cancel backend flows are already part of the canonical audit coverage.

Do not create a second UI audit log.

## 23. Tests

At minimum validate:

### Loading / canonical data
- no `@/data/admin` maintenance/fleet import;
- GET maintenance records loads canonical values;
- vehicle options come from canonical data.

### Summary
- Open count uses actual Open records;
- blocking count uses actual `blocks_rental_use`;
- due/readiness display uses canonical readiness semantics;
- service-spend value is based on defensible canonical records or omitted.

### Create
- required vehicle/type/description;
- new record starts Open;
- optional canonical fields serialize correctly;
- server error remains visible;
- active rental conflict warning is surfaced.

### Complete
- only Open record;
- supported final fields sent;
- successful mutation refreshes UI.

### Cancel
- only Open record;
- successful mutation refreshes UI.

### History
- Completed/Cancelled records visible;
- no local-only fake status transition.

### Scope
- no mock downtime chart;
- no Finder changes;
- no allocation changes;
- no maintenance notification implementation.

## 24. Definition of Done

VS025 is complete when:

- Admin Maintenance page is fully canonical-data-backed;
- prototype maintenance/fleet data is removed from this page;
- mock downtime chart is removed unless canonically supportable;
- create form maps to canonical backend;
- Open records can be completed/cancelled through canonical API;
- PMS/readiness information is surfaced;
- blocking maintenance is clear;
- history is real;
- writes show success/error honestly;
- no duplicate maintenance algorithm/status model is introduced.

## 25. Stop Rule

Stop after Maintenance Admin UI canonicalization.

Do not implement:
- maintenance notifications;
- low-availability notifications;
- predictive ML;
- monitoring/GPS;
- reports/dashboard canonicalization;
- backup/recovery.
