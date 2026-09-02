# Vertical Slice 026 — Canonical Administrative Dashboard

**Status:** Approved for implementation
**Objective:** Replace the prototype-backed Admin landing dashboard with a truthful, role-aware current operational snapshot derived entirely from canonical system data.

## Purpose

The current Admin dashboard still presents fabricated prototype values from `@/data/admin`.

VS026 removes those values and connects the dashboard to the real system.

The target is not to recreate every existing widget.

The target is:

```text
Canonical system state
        ↓
Role-aware dashboard aggregation
        ↓
Current operational snapshot
        ↓
Bookings
Rentals
Fleet readiness
Maintenance attention
Operational awareness
Optional canonical financial summary
```

Every displayed value must have a defensible canonical source.

---

## Manuscript Traceability

### Supports

The manuscript's administrative monitoring and dashboard intent around:

- booking activity;
- active rentals;
- fleet availability;
- maintenance/readiness;
- payments/financial oversight;
- operational alerts;
- management decision support.

### Scope Boundary

VS026 provides a **current operational snapshot**.

Historical/date-range analytics belong to:

`VS027 — Canonical Reports & Analytics`

Do not expand VS026 into a full reporting engine.

### Existing Open Work

Maintenance and low-availability notification generation remains pending under MIC-019.

VS026 may display already-existing canonical notifications/attention states but must not implement new notification-generation rules.

---

# Required Context

Read first:

1. `engineering/AI-ENGINEERING-CONTEXT.md`
2. `engineering/sprints/VERTICAL-SLICE-026.md`
3. `codex-context/25-canonical-subsystem-map.md`
4. `codex-context/39-canonical-admin-dashboard.md`
5. `codex-context/40-manuscript-traceability-vs026.md`

Do not read earlier vertical-slice contracts unless an exact implementation dependency genuinely requires it.

---

# Initial Inspection

Inspect:

1. `src/routes/admin.index.tsx`
2. `src/data/admin.ts` only to identify prototype dependencies being removed
3. canonical booking API/service
4. canonical rental API/service
5. canonical vehicle/readiness API/service
6. canonical maintenance/readiness API/service from VS025
7. canonical notification service if used
8. canonical audit-event service if used
9. canonical payment service if Owner/Admin financial metrics are used
10. existing vehicle analytics service only if useful for a current-state metric

Do not inspect unrelated subsystems.

---

# Prototype Removal

The Admin dashboard must no longer depend on these prototype exports from `@/data/admin`:

```text
kpis
revenueTrend
bookingVolume
branchDemand
fleetUtilization
alerts
activity
bookings
```

Remove fabricated:

```text
MoM percentages
YoY percentages
fake fleet totals
fake maintenance counts
fake payment amounts
fake alerts
fake activity
fake booking lists
```

Do not replace them with different hard-coded data.

---

# Static Systems Health

Remove:

```text
Systems healthy
```

unless there is a real infrastructure/system-health endpoint supporting that claim.

VS026 does not implement infrastructure monitoring.

---

# Export Report

Remove the dashboard:

```text
Export report
```

button unless it invokes a real canonical export flow already present.

Do not create an export subsystem in VS026.

Report/export work belongs to VS027 if still needed.

---

# Role Model

Preserve current application role boundaries.

## Owner/Admin Dashboard

May show:

- booking workload;
- active rentals;
- available/rentable fleet;
- maintenance/readiness attention;
- operational notifications/attention;
- safe recent activity;
- latest bookings;
- financial metrics only when canonically and defensibly defined.

## Operations Staff Dashboard

May show operational information necessary for:

- reservations;
- rentals;
- fleet coordination;
- customer coordination.

Do not expose Owner/Admin-only financial information.

---

# Dashboard Data Architecture

Prefer a small canonical dashboard aggregation service/endpoint rather than many unrelated browser requests if:

- several joins are required;
- business rules would otherwise be duplicated;
- multiple source requests create race/N+1 behavior.

A possible architecture is:

```text
GET /api/admin-dashboard
        ↓
canonical booking/rental/fleet/
maintenance/payment/notification services
        ↓
normalized dashboard response
```

The exact endpoint name is implementation-defined.

Do not build it from prototype data.

---

# Canonical KPI Set

The final dashboard may contain fewer KPIs than the prototype.

Recommended current-state KPIs:

```text
Pending / Submitted Bookings
Active Rentals
Available Vehicles
Maintenance / Readiness Attention
```

Owner/Admin may additionally show one or more canonical financial/administrative metrics if safely supported.

Do not retain a KPI solely because the old UI had one.

---

# Booking Workload

A pending-booking metric must use a precise canonical booking state.

Do not treat all historical or cancelled bookings as pending.

Use the application's actual lifecycle terminology.

If the current actionable state is:

```text
Submitted
```

then label it accordingly.

Do not rename a canonical state merely for visual familiarity.

---

# Active Rentals

Use canonical rental transactions.

Definition should reflect currently active physical rentals, such as:

```text
started_at != null
AND
ended_at == null
```

or the authoritative existing helper/service equivalent.

Do not infer active rental from prototype booking statuses.

---

# Available Vehicles

Do not use the prototype `VehicleStatus = Available`.

Use canonical availability/readiness logic.

A vehicle should not be counted as currently available when it is:

- inactive;
- under active rental;
- blocked by maintenance;
- otherwise canonically not rental-ready.

If canonical current-booking conflict logic is necessary, reuse it.

Do not implement a competing availability algorithm.

---

# Maintenance / Readiness Attention

Reuse VS025 maintenance/readiness semantics.

Suitable count:

```text
vehicles where maintenanceReady === false
```

or another canonical aggregate based on the shared readiness helper.

Do not count all Open maintenance records as overdue.

---

# Financial Metrics

Financial dashboard values are optional.

If implemented, they must be derived from canonical verified payment state.

Do not use:

```text
booking amount
quoted rental price
base rental estimate
```

as realized revenue unless canonical finance rules explicitly define them that way.

Possible Owner/Admin-only metric:

```text
Verified payments this month
```

if exact canonical payment records support it.

The period must be labeled.

If revenue semantics remain ambiguous, omit the metric.

---

# Payment Attention

A useful Owner/Admin-only or appropriately authorized operational metric may be:

```text
Payments pending review
```

or equivalent.

This must count actual canonical payment-review state.

Do not invent peso totals unless the underlying data is authoritative.

---

# Recent Bookings

Show a short list from canonical booking records.

Suitable information:

- safe booking reference;
- customer display name only if already authorized;
- requested dates;
- assigned vehicle where applicable;
- canonical booking status.

Avoid unnecessary PII.

Do not show mock booking IDs or customers.

---

# Operational Attention

The current prototype `alerts` array must be removed.

A new attention panel may aggregate already-canonical actionable states such as:

- submitted bookings awaiting action;
- requirements pending review;
- payments pending review;
- maintenance/readiness attention;
- unread canonical notifications.

Do not invent alert events.

Do not generate maintenance/low-availability notifications in VS026.

A dashboard-derived attention card is not itself a notification record.

---

# Recent Activity

The prototype `activity` array must be removed.

If retained, use canonical semantic audit events.

Only display safe fields such as:

- action;
- entity type;
- safe entity reference;
- occurred time;
- actor display where authorized and safely available.

Do not expose:

- sensitive document contents;
- payment proof contents;
- identity values;
- generic old/new snapshots.

If canonical audit retrieval would significantly widen the slice, omit Recent Activity.

---

# Charts

Charts are optional.

Do not assume the dashboard must contain charts because the prototype had them.

Remove these unless backed by canonical data:

```text
Revenue trend
Booking volume
Branch demand
Fleet utilization
```

If one simple current-state chart can reuse an already-canonical aggregate safely, it may remain.

Historical trend analysis belongs to VS027.

A cleaner dashboard with no charts is acceptable.

---

# Branch Snapshot

If a branch breakdown is displayed, it must use canonical branch relations rather than hard-coded:

```text
Taft = 62%
Antipolo = 38%
```

Do not assume exactly two branches in calculation logic even if the current business has two operational locations.

---

# Current Time Semantics

Current-state metrics should use trusted server time where business-time interpretation matters.

Reuse the project's Asia/Manila conventions where applicable.

Do not calculate business-day boundaries differently in the dashboard.

---

# Partial Failure

If the dashboard endpoint/service aggregates several canonical sources:

- fail clearly if core data cannot load;
- optionally return safe partial sections only where the response explicitly identifies unavailable sections.

Never silently convert source failure into:

```text
0
₱0
No alerts
```

because that would misrepresent system state.

---

# Loading State

Show existing application loading patterns.

No prototype fallback data while loading.

---

# Empty State

Valid zero states should be represented honestly.

Examples:

```text
No active rentals.
No bookings awaiting review.
No maintenance attention required.
```

Differentiate a true zero from a failed query.

---

# Error State

Display a safe actionable message, such as:

```text
Unable to load the operational dashboard.
```

Support retry using repository-consistent UI patterns.

---

# Authorization

Dashboard aggregation must respect server-side role authorization.

Do not rely solely on client-side hiding.

If one endpoint serves both roles, it must construct a role-specific response server-side.

Operations Staff must not be able to request Owner/Admin-only financial fields by modifying the browser.

---

# No New Business Rules

VS026 must not introduce:

- new booking statuses;
- new rental states;
- new payment semantics;
- new availability formulas;
- new maintenance rules;
- new notification types;
- new allocation rules.

Reuse canonical logic.

---

# Reports Boundary

Do not implement:

- arbitrary date filters;
- historical comparisons;
- YTD analytics;
- monthly trends;
- export files;
- printable reports;
- report scheduling.

Those belong to VS027.

---

# Notification Boundary

Do not implement:

- maintenance notification generation;
- low-availability notification generation;
- Brevo delivery;
- email templates.

Existing notifications may be displayed if useful.

MIC-019 remains pending.

---

# Audit Boundary

Do not modify audit persistence or audit-event generation.

Only consume audit events if a safe existing read path is suitable.

---

# Testing

Add focused tests for the canonical Dashboard.

## Prototype Removal

Verify Dashboard no longer imports or uses:

```text
kpis
revenueTrend
bookingVolume
branchDemand
fleetUtilization
alerts
activity
mock bookings
```

from `@/data/admin`.

Verify static:

```text
Systems healthy
```

is gone.

Verify fake:

```text
Export report
```

is gone unless canonically wired.

---

## Authorization

Test:

Owner/Admin:

- receives authorized dashboard data;
- may receive financial section where implemented.

Operations Staff:

- receives operational data;
- cannot receive restricted financial values through direct API request.

Customer:

- cannot access Admin dashboard aggregation.

---

## Bookings

Test:

- current actionable booking count uses canonical states;
- latest bookings use canonical records;
- cancelled/history-only records do not inflate actionable counts.

---

## Rentals

Test:

- active-rental count uses canonical active rental state;
- ended rentals are excluded.

---

## Vehicles

Test:

- inactive vehicles are excluded from available count;
- maintenance-not-ready vehicles are excluded;
- active-rental vehicles are excluded;
- canonical availability helpers are reused.

---

## Maintenance

Test:

- readiness-attention count comes from canonical readiness;
- no fake overdue logic.

---

## Financial

If implemented:

- verified payment/revenue inclusion rule is tested;
- unverified/resubmission/payment-rejected values excluded appropriately;
- Operations Staff receives no restricted values.

If not implemented:

- dashboard does not show placeholder revenue.

---

## Failure States

Test:

- source error does not become zero;
- loading state;
- retry/error behavior;
- true empty/zero states.

---

## Scope

Verify no changes to:

- Reports historical analytics;
- Finder;
- forecasting;
- allocation;
- maintenance lifecycle;
- notifications generation;
- Brevo;
- external-context providers;
- backup/recovery.

---

# Validation

Run:

```text
dashboard-focused tests
reused helper tests where changed
authorization tests
npm run build
focused lint
git diff --check
```

Repository-wide unrelated lint debt is not a VS026 blocker.

---

# Manuscript Post-Implementation Review

After VS026:

1. confirm final canonical KPI set;
2. identify any prototype dashboard figures/labels still present in manuscript;
3. update Change Register if implementation materially changes a manuscript-level dashboard definition;
4. do not revise Reports sections until VS027.

---

# Definition of Done

VS026 is complete when:

- `/admin/` contains no fabricated operational/business data;
- Dashboard no longer depends on prototype dashboard arrays;
- all displayed KPI values use canonical state;
- Owner/Admin and Operations Staff views are server-authorized appropriately;
- latest/actionable operational information is real;
- mock charts are removed unless canonically justified;
- no static health claim remains;
- no fake export action remains;
- loading/error/empty behavior is honest;
- no historical Reports subsystem is duplicated.

---

# Stop Rule

Stop after VS026.

Do not implement:

- VS027;
- report canonicalization;
- report export;
- maintenance/low-availability notifications;
- Brevo delivery;
- backup/recovery;
- CQ-028;
- CQ-029;
- CQ-030;
- CQ-031;
- CQ-032.
