# Canonical Reports & Analytics
**Status:** Frozen for VS027
**Last updated:** 2026-09-02

## Objective
Replace remaining prototype-derived Admin Reports calculations with canonical, date-range-aware operational analytics while preserving the already-canonical vehicle utilization/idle analytics.

## Current state
`src/routes/admin.reports.tsx` is hybrid: `/api/vehicle-analytics` is canonical, while broader booking, branch, fleet, maintenance, revenue, average-ticket, trend, category, and workload calculations still depend on `@/data/admin`.

## Core rules
- VS026 is current snapshot; VS027 is historical/date-range analytics.
- Use inclusive Asia/Manila calendar-date boundaries.
- Validate YYYY-MM-DD, start <= end, and a bounded range (prefer the existing 366-day limit).
- Owner/Admin may receive defensible financial analytics; Operations Staff is operational-only; Customer is forbidden.
- Every displayed metric needs a precise canonical definition.
- Source failure is not zero.

## Canonical report families
### Vehicle utilization / idle
Preserve `getVehicleAnalytics`: rental days, eligible operational days, historical eligibility coverage, utilization, maintenance readiness, active rental, and idle classification. Never convert unavailable utilization to 0%.

### Booking volume
Use canonical bookings. Prefer booking `created_at` as the event date for booking-demand/volume reporting. Separate status counts where useful. Do not count one booking repeatedly across rental days.

### Rental activity
Use canonical `rental_transactions`. Distinguish rentals started in range from current active rentals and from rental-day utilization.

### Maintenance workload
Use canonical `maintenance_records`: started, completed, cancelled, blocking work, and cost where defensible. Do not recreate Scheduled/In Progress/Overdue persisted statuses.

### Branch comparison
Use canonical branch relations, never hard-coded Taft/Antipolo logic. Suitable measures include booking requests, rental starts, fleet count, utilization where coverage is complete, and maintenance workload.

### Vehicle/category performance
Use canonical vehicle-category relations plus canonical vehicle analytics.

## Financial reporting
Before implementing Revenue or Average Ticket, inspect canonical payment data and prove:
1. authoritative accepted/verified amount;
2. authoritative acceptance timestamp;
3. multiple/partial-payment behavior;
4. cancellation/refund semantics.

If any are ambiguous, OMIT Revenue and Average Ticket and record the gap. Never use booking quote/base price as recognized revenue.

## Architecture
Prefer a server-side `/api/admin-reports` (or equivalent) aggregation service that composes canonical booking/rental/maintenance/branch/category/vehicle-analytics data. Reuse helpers; do not move Supabase business queries into React.

## Filters
Retain date range. Load branch options from canonical branches. Category filter is optional and must be canonical if added.

## Charts
Charts may remain only when fed entirely by canonical report response data and clearly state metric, range, and grouping. Remove prototype-fed charts.

## Export
Do not implement export unless a canonical export already exists and can be wired without widening scope.

## Tests
Cover prototype removal, canonical branch filter, date validation/Manila boundaries, booking aggregation, rental aggregation, maintenance workload, preserved vehicle analytics, branch/category grouping, role authorization, financial omission-or-proof, and honest unavailable/error states.

## Definition of Done
No Reports-page business-record imports from `@/data/admin`. Every displayed report value is canonical and date-range-defined. Ambiguous finance is omitted.
