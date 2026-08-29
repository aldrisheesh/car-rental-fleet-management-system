# Reports GUI Demo Storyboard

## Demo Setup

- Run the app and open: `http://localhost:3000`
- Business owner demo login: `owner@briahs.local` / `owner123`
- Staff demo login: `staff@briahs.local` / `staff123`
- Main feature URL: `/admin/reports?from=2026-04-15&to=2026-05-15&branch=both`
- Demo goal: show that reports now support custom date ranges, branch filtering, and branch comparison.

## Scene 1: Open With The Problem

**Screen**

- Sign in as the Business Owner.
- Go to `Admin` then `Reports & Analytics`.

**Action**

- Start on the Reports page with the default YTD view.
- Point to the filter bar: From, To, Branch, and YTD.

**Talk Track**

> Previously, reports were basically a year-to-date snapshot. Now the owner can ask a more specific business question: what happened during this exact date range, and which branch contributed to it?

**Expected Takeaway**

- The audience sees that reporting is no longer locked to YTD.
- The filter bar is the control center for the report.

## Scene 2: Custom Date Range

**Screen**

- Reports page as Business Owner.

**Action**

- Set `From` to `2026-04-15`.
- Set `To` to `2026-05-15`.
- Keep Branch as `Both branches`.

**Talk Track**

> Here I am narrowing the report to April 15 through May 15. Every KPI and chart recalculates for that period, including bookings that overlap the selected dates.

**Expected Takeaway**

- Revenue, bookings, utilization, average ticket, and charts update together.
- The date summary shows the selected range.

## Scene 3: Explain The KPIs

**Screen**

- Top KPI row: Revenue, Bookings, Avg utilization, Avg ticket.

**Action**

- Hover or point across the KPI row from left to right.

**Talk Track**

> The top row gives the owner the quick answer: filtered revenue, non-cancelled bookings, average utilization, and average ticket. Revenue only counts paid valid rentals, so cancelled or invalid-payment activity does not inflate the result.

**Expected Takeaway**

- KPIs are business-focused and filtered by the selected date range.
- Revenue logic is credible and conservative.

## Scene 4: Revenue Trend And Utilization

**Screen**

- Revenue trend chart and Overall utilization card.

**Action**

- Point to the line chart.
- Point to the radial utilization chart.

**Talk Track**

> The trend chart shows paid rental revenue for the selected period. Utilization translates bookings into fleet usage, so the owner can see whether revenue is coming from healthy vehicle usage or from only a few expensive rentals.

**Expected Takeaway**

- The report supports both financial and operational interpretation.
- The owner can connect revenue with actual fleet usage.

## Scene 5: Side-By-Side Branch Comparison

**Screen**

- Keep Branch as `Both branches`.
- Show the Branch comparison card.

**Action**

- Point to Revenue, Demand share, Utilization, and Bookings rows.

**Talk Track**

> Because both branches are selected, the comparison card appears. This is the side-by-side view: Manila versus Antipolo across revenue, demand share, utilization, and bookings.

**Expected Takeaway**

- Branch comparison is only visible when both branches are selected.
- It directly answers which branch is stronger for the selected range.

## Scene 6: Manila-Only Filter

**Screen**

- Branch filter.

**Action**

- Change Branch from `Both branches` to `Taft, Manila`.

**Talk Track**

> Now I am isolating Manila. The same report becomes a Manila-only report, and the comparison card disappears because there is no second branch to compare.

**Expected Takeaway**

- Branch filtering affects the whole report.
- Single-branch mode removes the comparison card to keep the screen focused.

## Scene 7: Antipolo-Only Filter

**Screen**

- Branch filter.

**Action**

- Change Branch to `Antipolo, Rizal`.

**Talk Track**

> Switching to Antipolo gives the same focused view for the other branch. This lets the owner quickly check whether a branch issue is local or business-wide.

**Expected Takeaway**

- The same workflow works for either branch.
- The GUI supports branch-specific decision making.

## Scene 8: Reset Back To YTD

**Screen**

- Report filter bar.

**Action**

- Click `YTD`.

**Talk Track**

> If the owner wants to return to the regular executive snapshot, the YTD button resets the report to the year-to-date period and both branches.

**Expected Takeaway**

- Custom exploration is reversible.
- The old YTD workflow is still available.

## Scene 9: Staff-Safe View

**Screen**

- Sign out.
- Sign in as Staff.
- Go to Reports.

**Action**

- Use the same date and branch filters.
- Show that revenue is not displayed.

**Talk Track**

> Staff can still use operational reporting, but financial data stays hidden. They can monitor bookings, active rentals, available vehicles, maintenance workload, utilization, and branch performance without seeing revenue.

**Expected Takeaway**

- The GUI respects role-based access.
- Staff get operational insight without financial exposure.

## Scene 10: Closing Summary

**Screen**

- Return to owner view or keep the strongest final screen: `Both branches`, custom range, comparison visible.

**Talk Track**

> The reporting page now supports the three main questions the business owner asked for: custom periods like April 15 to May 15, per-branch filtering, and side-by-side branch comparison for revenue, demand, utilization, and bookings.

**Expected Takeaway**

- Custom date range filtering is implemented.
- Branch filtering is implemented.
- Branch comparison is implemented.

## Quick Demo Script

1. Sign in as owner.
2. Open Reports.
3. Set `2026-04-15` to `2026-05-15`.
4. Keep `Both branches` and show the comparison card.
5. Switch to `Taft, Manila` and explain focused reporting.
6. Switch to `Antipolo, Rizal` and explain branch isolation.
7. Click `YTD`.
8. Sign in as staff and show the financial-safe operational report.

## Backup Lines

- If asked why revenue changes by date: revenue is prorated for bookings that partially overlap the selected range.
- If asked why cancelled bookings are missing: bookings with cancelled status do not count toward demand or revenue.
- If asked why staff cannot see revenue: the report follows the existing role split between business owner and staff.
- If asked what Manila means: Manila maps to the existing `Taft, Manila` branch.
