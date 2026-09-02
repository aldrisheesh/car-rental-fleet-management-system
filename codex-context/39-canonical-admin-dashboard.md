# Canonical Administrative Dashboard

**Status:** Frozen for VS026
**Last updated:** 2026-09-02

## Objective

Replace the prototype-backed Admin dashboard with a truthful operational dashboard derived from canonical system data.

The current `/admin/` page imports mock KPIs, charts, alerts, activity, bookings, and utilization from `@/data/admin`. VS026 removes that dependency from the dashboard.

## Principle

A dashboard metric is allowed only when:
1. it has a precise definition;
2. it can be derived from canonical records;
3. role visibility is appropriate;
4. the displayed period is explicit.

If a current prototype widget cannot satisfy these rules, remove it rather than fabricating a replacement.

## Role views

### Owner/Admin
May see business-sensitive aggregates that are already supported by canonical payment/rental data, including revenue where the definition is defensible.

### Operations Staff
Operational-only view. Do not expose Owner/Admin-only financial information merely because the old dashboard did.

Preserve existing role authorization boundaries.

## Canonical sources to reuse

Prefer existing APIs/services for:
- bookings;
- rental transactions;
- vehicles;
- maintenance/readiness;
- notifications;
- audit events/recent activity where role-safe;
- verified payment data;
- vehicle analytics/utilization if appropriate.

Do not create duplicate business logic if an existing canonical service already calculates the value.

## Recommended dashboard content

### Core operational KPIs

Suitable candidates:
- Submitted / pending booking requests;
- active rentals;
- currently available/rentable vehicles;
- maintenance/readiness attention;
- unread notifications/operational attention where canonical.

For Owner/Admin only, optionally:
- verified/recognized revenue for an explicitly stated period;
- pending payment-review count/amount only if a canonical definition is available.

Do not preserve prototype numbers or fake month-over-month deltas.

### Booking activity

A short recent-bookings panel may be retained using canonical booking records.

Do not expose unnecessary customer PII.

### Operational attention

Use canonical notification/readiness/payment/booking states rather than the prototype `alerts` array.

Do not invent alert types in VS026.

### Recent activity

If using audit events, show only safe semantic metadata already present in canonical audit records.

Do not reconstruct sensitive old/new values.

### Trends/charts

Charts are optional.

A chart may remain only if its dataset is derived canonically and its metric definition is explicit.

Do not keep:
- mock revenue trend;
- mock booking-volume chart;
- mock branch-demand pie;
- mock fleet-utilization bars.

If canonical chart support would substantially widen the slice, use compact truthful lists/KPIs and defer deeper analytics to VS027 Reports.

## Systems healthy

Remove the static `Systems healthy` indicator unless backed by a real health check.

VS026 does not implement infrastructure monitoring.

## Export report

Remove the dashboard `Export report` action unless it invokes a real canonical export.

Report/export functionality belongs to the Reports slice if not already canonical.

## Revenue

Do not calculate revenue from booking quoted/base amounts.

If revenue is displayed, derive it from the canonical verified payment/financial state and document the exact inclusion rule.

Operations Staff must not receive Owner/Admin-only revenue.

## Vehicle availability

Do not derive availability from a prototype vehicle status enum.

Reuse the canonical vehicle availability/readiness rules already used by booking/Finder/assignment where feasible.

At minimum, do not count:
- inactive vehicles;
- active rentals/time conflicts;
- blocking maintenance/not-ready vehicles
as available.

Do not introduce a competing availability algorithm.

## Maintenance

Use canonical maintenance/readiness data from VS025.

Do not use old `In maintenance` mock KPI or legacy Scheduled/In Progress/Overdue status concepts.

## Alerts

Dashboard operational attention should consume existing canonical awareness sources.

MIC-019 maintenance and low-availability notification generation remains pending. Do not implement it in VS026 merely to populate the dashboard.

## Latest bookings

Use canonical booking records.

Display only safe operational information appropriate to the viewer.

## Empty/loading/error

No mock fallback data.

Support:
- loading;
- empty;
- partial-source failure where defensible;
- full load failure;
- retry.

A source failure must not silently become zero.

## Server aggregation

Prefer one small dashboard aggregate endpoint/server service if multiple browser requests would duplicate joins/business logic or create N+1 behavior.

Any new aggregate service must call/reuse canonical helpers instead of reimplementing domain rules.

## No Reports duplication

VS026 is a current operational snapshot.

Do not build arbitrary historical date-range analytics, export infrastructure, or complex report definitions. Those belong to VS027.

## No new notifications

Do not implement maintenance/low-availability notification generation in this slice.

## Tests

Validate:
- no dashboard dependency on mock `kpis`, `revenueTrend`, `bookingVolume`, `branchDemand`, `fleetUtilization`, `alerts`, `activity`, or mock `bookings`;
- Owner/Admin vs Operations Staff financial visibility;
- canonical KPI definitions;
- loading/error/empty behavior;
- recent bookings from canonical data;
- maintenance/readiness from canonical logic;
- no static Systems healthy claim;
- no fake export action;
- no invented MoM/YoY deltas.

## Definition of Done

The first Admin screen contains no fabricated operational/business values.

Fewer widgets are acceptable.

Every displayed metric/list is traceable to canonical data and a clear definition.
