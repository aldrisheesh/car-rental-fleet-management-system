# Vertical Slice 027 — Canonical Reports & Analytics

**Status:** Approved for implementation
**Objective:** Replace the remaining prototype-derived Admin Reports calculations with canonical, role-aware, date-range analytics while preserving the existing canonical vehicle utilization and idle-detection model.

## Purpose

The Reports page is currently hybrid.

Already canonical:

```text
Vehicle analytics
├── Rental days
├── Eligible operational days
├── Utilization
├── Historical eligibility coverage
├── Maintenance readiness
├── Active rental state
└── Idle detection
```

Still prototype-derived:

```text
Bookings
Branches
Fleet
Maintenance workload
Revenue
Average ticket
Booking trends
Branch comparisons
Category performance
```

VS027 removes the prototype reporting layer.

The final Reports page must satisfy:

```text
Canonical historical records
        ↓
Server-side report aggregation
        ↓
Explicit date-range semantics
        ↓
Role-aware analytics
        ↓
Admin Reports UI
```

Every displayed value must have a defensible definition.

---

## Manuscript Traceability

VS027 supports the manuscript's reporting and decision-support requirements around:

- booking activity;
- rental operations;
- fleet utilization;
- vehicle performance;
- branch comparison;
- maintenance workload;
- idle vehicles;
- management analytics;
- financial reporting where canonical financial semantics permit it.

Do not interpret high-level manuscript reporting requirements as permission to fabricate unavailable analytics.

---

# Required Context

Read first:

1. `engineering/AI-ENGINEERING-CONTEXT.md`
2. `engineering/sprints/VERTICAL-SLICE-027.md`
3. `codex-context/25-canonical-subsystem-map.md`
4. `codex-context/41-canonical-reports-analytics.md`
5. `codex-context/42-manuscript-traceability-vs027.md`

Do not read previous vertical-slice contracts unless an exact dependency genuinely requires it.

---

# Initial Inspection

Inspect:

1. `src/routes/admin.reports.tsx`
2. `src/data/admin.ts` only to identify prototype Reports dependencies
3. `src/routes/api.vehicle-analytics.ts`
4. `src/lib/vehicle-analytics.server.ts`
5. vehicle analytics interval helpers/tests
6. canonical booking schema/API/service
7. canonical rental transactions
8. canonical maintenance records/readiness
9. canonical branches
10. canonical vehicle categories
11. canonical payment schema/API/state machine only to determine whether financial analytics are defensible

Do not inspect unrelated subsystems.

---

# Prototype Removal

The Reports page must no longer use prototype business records from:

```text
@/data/admin
```

including:

```text
bookings
branches
fleet
maintenance
```

Remove any report calculation whose source remains prototype data.

Formatting-only helpers may be moved/replaced with a neutral shared helper if needed.

Do not retain `@/data/admin` merely for `peso()` if doing so creates misleading coupling to prototype business data.

---

# Report Architecture

Prefer a canonical server-side aggregate endpoint/service.

Recommended conceptual architecture:

```text
GET /api/admin-reports
        ↓
validated range + branch
        ↓
canonical:
  bookings
  rental_transactions
  maintenance_records
  branches
  vehicles/categories
  vehicle analytics
  optional verified financial data
        ↓
role-aware report response
```

Exact filenames are implementation-defined.

Do not put raw Supabase aggregation/business rules directly into the React page if a server service is appropriate.

---

# Authorization

Server-side authorization is mandatory.

## Owner/Admin

May receive:

- operational reports;
- branch analytics;
- utilization;
- maintenance workload;
- idle analytics;
- financial analytics only if canonically defensible.

## Operations Staff

May receive:

- booking reports;
- rental activity;
- utilization;
- maintenance workload;
- branch/category operational analytics;
- idle analytics.

Must not receive restricted financial aggregates.

## Customer

Forbidden.

Do not rely only on client-side conditional rendering.

---

# Reporting Range

Use:

```text
YYYY-MM-DD
```

date values.

Rules:

```text
start <= end
```

Use inclusive reporting dates.

Use Asia/Manila business-day boundaries consistently.

Prefer the existing maximum range:

```text
366 days
```

unless an already-canonical shared helper specifies another limit.

Invalid ranges must return a clear safe validation error.

---

# Default Range

A sensible canonical default is acceptable.

For example:

```text
last 30 calendar days
```

ending on the current Asia/Manila date.

If the current Reports page has a useful YTD shortcut, it may remain as a UI convenience provided the server still validates the resulting explicit dates.

Do not create hidden inconsistent range semantics.

---

# Canonical Branch Filter

Remove hard-coded:

```text
Both branches
Taft, Manila
Antipolo, Rizal
```

as the source of truth.

Load canonical branches.

UI may offer:

```text
All branches
```

plus canonical branch records.

Filter by canonical branch identifier where possible.

Do not use display-name string parsing as the authoritative filter.

Do not assume exactly two branches.

---

# Booking Volume

Use canonical booking records.

For booking-demand/report-volume semantics, use:

```text
booking.created_at
```

as the reporting event unless existing canonical implementation proves a better explicit event.

This answers:

> How many booking requests were created during this reporting period?

Do not count the same booking once per rental day.

---

# Booking Status Breakdown

Use actual canonical booking statuses.

Report counts may include statuses such as the application's current lifecycle states.

Do not map them back to prototype:

```text
Pending
Confirmed
Ongoing
Completed
Cancelled
```

unless those are actually canonical.

Use current implementation terminology.

---

# Cancelled Bookings

Do not automatically remove cancelled/rejected historical records from booking-volume reporting.

If showing:

```text
Total booking requests
```

a cancelled booking is still historically a booking request.

If showing:

```text
Successful bookings
```

then exclusion rules must be explicit.

Prefer status breakdown over ambiguous "non-cancelled bookings."

---

# Rental Activity

Use:

```text
rental_transactions
```

Canonical historical metrics may include:

```text
Rentals started in range
Rentals completed in range
Rental days
Active-at-period-end
```

only where definitions are precise and useful.

Do not use booking status as a substitute for physical rental transactions.

---

# Vehicle Utilization

Preserve the existing canonical model.

For each vehicle:

```text
utilization =
rental days
──────────────
eligible operational days
```

only when historical eligibility coverage is:

```text
Complete
```

When coverage is:

```text
Partial/Insufficient Historical Eligibility Data
```

utilization remains unavailable.

Never convert unavailable to:

```text
0%
```

---

# Eligible Operational Days

Preserve existing eligibility logic based on historical operational-state events and blocking maintenance.

Do not simplify denominator to total calendar days.

---

# Overall Utilization

If showing fleet/branch/category average utilization:

include only vehicle rows whose utilization is canonically available.

Clearly communicate unavailable coverage where material.

Do not treat unavailable vehicles as zero-utilization vehicles.

---

# Idle Vehicles

Preserve canonical idle semantics.

Do not redefine idle based solely on:

```text
no booking this week
```

Use the existing canonical idle snapshot/classification.

Suitable reporting:

```text
Idle
Not Idle
Unable to Determine
```

Do not hide `Unable to Determine`.

---

# Maintenance Workload

Use canonical:

```text
maintenance_records
```

Possible historical metrics:

```text
Maintenance started
Maintenance completed
Maintenance cancelled
Blocking maintenance
```

Use appropriate canonical timestamps for each metric.

Do not use prototype maintenance statuses.

Do not create:

```text
Scheduled
In Progress
Overdue
```

as persisted reporting states.

---

# Maintenance Due / Overdue

PMS due/overdue remains derived.

Do not count all Open maintenance as overdue.

If historical due/overdue cannot be reconstructed accurately for arbitrary past dates using existing state history:

do not present a historical overdue count.

Current readiness belongs primarily to Dashboard/Maintenance.

---

# Maintenance Cost

Maintenance cost may be reported if:

- canonical `cost_php` exists;
- status/date semantics are clear.

Prefer actual completed-service costs.

If shown:

```text
Completed maintenance cost
```

use completed records and an explicit completion-date reporting rule.

Do not count planned Open maintenance costs as actual historical spend.

---

# Branch Comparison

Use canonical branch relationships.

Possible measures:

```text
Booking requests
Rental starts
Fleet size
Vehicle utilization
Maintenance workload
Idle vehicles
```

Do not force every measure into the comparison.

Use only defensible values.

---

# Vehicle Category Performance

Use canonical vehicle-category relations.

Possible category metrics:

```text
Fleet count
Rental days
Average available utilization
Idle vehicles
```

Do not use prototype category arrays.

Do not rank a category on unavailable utilization as if it were zero.

---

# Financial Reporting Gate

Before implementing any financial report, inspect the canonical payment implementation.

Explicitly answer:

1. What persisted amount represents money actually accepted/verified?
2. Which timestamp represents acceptance?
3. Can multiple payment proofs/payments exist for one booking?
4. Can payments be partial?
5. What happens to accepted payment records if a booking is cancelled?
6. Are refunds represented?
7. Can an accepted payment later become invalid/reversed?

Only implement financial analytics if the existing system answers enough of these questions to produce a defensible report.

---

# Revenue

Do not define:

```text
Revenue = booking quoted amount
```

or:

```text
Revenue = base rental amount
```

unless canonical financial implementation explicitly makes that authoritative.

If canonical payment semantics support it, use an accurately named metric such as:

```text
Verified payments
```

rather than overclaiming recognized accounting revenue.

---

# Average Ticket

Only implement Average Ticket if its numerator and denominator are unambiguous.

For example, if canonical verified payments are authoritative:

```text
verified payment amount
───────────────────────
distinct qualifying bookings
```

might be defensible.

But do not invent this if partial/multiple payment semantics make it misleading.

If uncertain:

```text
OMIT
```

---

# Revenue Trend

Only retain a financial trend chart if the Financial Reporting Gate passes.

Otherwise remove the prototype Revenue Trend entirely.

---

# Booking Trend

A canonical booking-volume trend is allowed.

Group canonical booking `created_at` values over the selected range.

Choose grouping granularity appropriate to the range.

Examples:

```text
short range → day
longer range → week/month
```

Do not over-engineer granularity.

A single consistent grouping is acceptable if clear.

---

# Branch Comparison Chart

Allowed if based on canonical branch aggregates.

Do not hard-code exactly two chart series.

---

# Utilization Visualization

The existing utilization visualization may remain if it uses canonical vehicle analytics.

If an overall percentage is shown, its aggregation rule must be explicit and tested.

---

# Report Empty State

Valid zero data should render honestly.

Examples:

```text
No booking requests in this range.
No rentals started in this range.
No maintenance records in this range.
```

Do not substitute prototype examples.

---

# Unavailable Analytics

Use explicit unavailable states where data coverage is insufficient.

Examples:

```text
Utilization unavailable
Insufficient historical eligibility data
Financial analytics unavailable
```

Do not render unavailable as zero.

---

# Error Handling

No prototype fallback.

If the report service fails:

show:

```text
Unable to load reports.
```

or repository-consistent equivalent.

Provide retry.

---

# Partial Failure

If vehicle analytics fails while other aggregates succeed, either:

1. fail the complete report clearly; or
2. return explicit section-level availability.

Do not silently omit a failed section and make the report appear complete.

Choose the smallest consistent architecture.

---

# Loading

Use honest loading states.

Do not calculate temporary prototype reports while canonical data loads.

---

# Reports UI

Retain the existing Admin design language.

The final page may be simpler than the prototype.

Recommended high-level structure:

```text
Reports & Analytics

[Date range] [Branch] [Reset]

Summary
Booking Activity
Rental Activity
Vehicle Utilization & Idle
Branch / Category Performance
Maintenance Workload
Optional Verified Financial Analytics
```

Not every section is mandatory if canonical data cannot support it.

---

# Operations Staff View

Use operational labels.

Do not render:

```text
Revenue
Average Ticket
Verified payment totals
```

for Operations Staff.

This restriction must also exist in the API response.

---

# Owner/Admin View

May include financial analytics only if the Financial Reporting Gate passes.

If it does not:

Owner/Admin simply receives the same canonical operational analytics plus any other authorized management information.

Do not add placeholders saying:

```text
Revenue coming soon
```

unless repository UX conventions genuinely require it.

---

# Export Boundary

VS027 focuses on canonical on-screen reporting.

Do not implement:

```text
PDF export
Excel export
CSV export
scheduled reports
email reports
```

unless a complete canonical export mechanism already exists and wiring it is trivial.

Otherwise defer.

---

# No New Forecasting

Do not use Reports to create a new forecast model.

Existing WMA/projected-supply capabilities remain separate.

---

# No New Notification Rules

Do not generate:

```text
maintenance alerts
low availability alerts
report alerts
```

in VS027.

---

# No Manuscript Editing

Do not modify Proposal Paper in this session.

Record discrepancies in the final implementation report.

---

# Tests

## Prototype Removal

Verify `admin.reports.tsx` no longer imports prototype:

```text
bookings
branches
fleet
maintenance
```

from `@/data/admin`.

---

## Date Range

Test:

```text
valid range
same-day range
start > end
invalid date
range > maximum
Asia/Manila boundary
```

---

## Authorization

Test:

```text
Owner/Admin → allowed
Operations Staff → allowed operationally
Customer → forbidden
```

If financial analytics exist:

```text
Operations Staff response contains no financial fields
```

---

## Branch Filter

Test:

- canonical branch list;
- all-branches mode;
- specific canonical branch;
- invalid branch identifier;
- no hard-coded two-branch assumption.

---

## Booking Aggregation

Test:

- `created_at` range inclusion;
- boundary dates;
- status breakdown;
- cancelled booking historical handling;
- branch grouping.

---

## Rental Aggregation

Test canonical transaction semantics.

Do not derive from booking status.

---

## Vehicle Analytics

Run/preserve existing vehicle-analytics tests.

Test that:

```text
Complete coverage
→ utilization available

Partial coverage
→ utilization unavailable
```

---

## Maintenance

Test:

- started/completed/cancelled reporting;
- blocking maintenance;
- completed cost if implemented;
- no fake overdue calculation.

---

## Category / Branch

Test canonical grouping and unknown/null category/branch handling.

---

## Finance

If implemented:

test every inclusion/exclusion rule.

If omitted:

test that no Revenue/Average Ticket prototype value remains.

---

## Failure

Test:

- DB/service error;
- analytics failure;
- true zero data;
- unavailable coverage.

---

# Validation

Run at minimum:

```text
reports-focused tests
vehicle-analytics tests
authorization tests
affected maintenance/rental helper tests
npm run build
focused lint
git diff --check
```

Repository-wide unrelated lint debt is not a blocker.

---

# Manuscript Post-Implementation Review

After implementation, report:

1. final report sections;
2. exact booking-volume definition;
3. exact rental metrics;
4. utilization definition;
5. maintenance-workload definition;
6. branch/category definitions;
7. whether financial analytics were implemented or omitted;
8. manuscript claims requiring revision.

Do not edit manuscript yet.

---

# Definition of Done

VS027 is complete when:

- Reports contains no prototype business records;
- report filters use canonical branch identities;
- all displayed values are date-range-defined;
- booking analytics are canonical;
- rental analytics are canonical;
- vehicle analytics preserve historical coverage semantics;
- maintenance workload is canonical;
- branch/category analytics are canonical where displayed;
- role authorization is server-side;
- ambiguous finance is omitted;
- no unavailable metric is misrepresented as zero;
- no export/notification/forecast subsystem is accidentally introduced.

---

# Stop Rule

Stop after VS027.

Do not implement:

- VS028;
- maintenance/low-availability notification generation;
- Brevo delivery;
- backup/recovery;
- report exports unless already canonical and trivial;
- CQ-028;
- CQ-029;
- CQ-030;
- CQ-031;
- CQ-032.
