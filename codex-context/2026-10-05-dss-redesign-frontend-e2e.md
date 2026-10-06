# DSS redesign frontend E2E — October 5, 2026

Scope: the three redesigned DSS screens on localhost, using the existing Owner/Admin session. All workflow actions and test-data creation were performed through the frontend. No direct API/database writes, baseline reset, or deployment were used. This is functional verification, not the later nontechnical-admin usability rehearsal or evidence of predictive accuracy.

## Frontend results

- Demand Forecast: branch/category/week selection, all-branch totals, selected-week table and WMA evidence agree. Generated a new forecast successfully; the October 5 run retained the selected October 12 week and Sedan category. Recursive horizon inputs updated correctly.
- Finalized the 60 completed observations offered by the frontend. The control changed to “No forecasts awaiting finalization”; zero-actual exclusion count changed from 110 to 119. The displayed MAPE remained 38.3%, with 142 eligible observations. These are synthetic-data results.
- Forecast → Allocation preserved the selected week/category. Availability loading completed and controls became usable again. Current MPV data initially showed a one-unit shortage in each branch with no donor.
- Created two synthetic MPVs through Fleet → Add vehicle. After updating availability, Antipolo had two available units against one required; Taft had none against one required. The generated October 19–25 recommendation offered one synthetic vehicle.
- Review transfer opened and focused the new review section. Supply/candidate and external-evidence disclosures worked. Nearby closure copy required verification rather than claiming the planned route was blocked.
- Decision controls required acknowledgement and category. Approval quantity zero was rejected with an inline explanation; a quantity of one was allowed.
- Rejected recommendation `db498bb8-5f9d-4d28-899d-3abc26b9326a` with a synthetic-test reason. Rejected state and decision history persisted; the one-unit shortage remained.
- Generated another analysis and approved one unit on recommendation `4325eb75-3fef-496f-aec7-b0d839123ddc`. Recorded approval replaced decision controls. Fleet still showed the candidate in Antipolo, proving approval did not move it.
- Updated only that synthetic vehicle’s allocation location through Fleet, returned to Allocation, and updated availability. Both branches then showed one available unit against one required, with no transfer needed. Both recorded decisions remained in history.
- Utilization: pagination showed 1–10 and 11–15 correctly; branch/category, search, idle filters, empty results and Clear filters worked. Current readiness distinguished rental-ready, maintenance and active-rental vehicles.
- Reversed reporting dates were rejected. October 1–5 applied successfully. Honda City evidence showed one rental day / five eligible days = 20%; incomplete-history Vios retained known rental days without inventing utilization.
- Fleet, filtered bookings and vehicle-specific maintenance links reached the expected records. Browser Back retained reporting dates, category and selected vehicle. Utilization → Allocation used the selected utilization category and planning week.
- Refresh activity preserved the table and a draft reporting-date input throughout the request. The automatic 60-second cycle was additionally verified in the preceding refresh-fix turn.

## Fixes made and rechecked

1. Allocation review did not pass the first-ranked candidate to operational context, leaving aggregate efficiency/fuel unavailable while candidate estimates were populated. It now passes the lowest-rank candidate. Frontend aggregate and candidate both showed 12 km/L and 2.8 L; regression assertions verify candidate propagation and fuel results.
2. Review bookings links in Allocation and Utilization used plain anchors and reloaded the document. Both now use TanStack navigation. Retested the utilization link; the admin sidebar remained expanded and matching bookings loaded.
3. DSS read the pending global destination pathname while its old component was still mounted, briefly showing Demand Forecast when leaving Utilization or Allocation. It now reads the resolved route location. Retested Utilization → Maintenance; the destination loading screen appeared without the unrelated Forecast screen.

## Remaining test data

- `DSS-UAT-MPV-01`, SYNTHETIC DSS Test MPV 01: Antipolo, active, no rentals/bookings.
- `DSS-UAT-MPV-02`, SYNTHETIC DSS Test MPV 02: Taft after record-only movement, active, no rentals/bookings.
- Both use MPV, 7 seats, 3 bags, PHP 2,500 rate, 12 km/L and 10,000 km odometer. No physical transfer occurred. The fleet grew from 13 to 15 vehicles. These are supplementary fixtures, not part of a certified reset baseline.

## Validation and limits

27 focused automated tests passed; TypeScript and focused ESLint passed. Production build passed after the final navigation change. Screenshots are in `output/dss-e2e-2026-10-05/`.

Not covered through the frontend in this run: Staff-role permissions, forced provider/network outages, a multi-unit partial approval, production deployment, or a participant usability study. Related automated checks cover missing evidence and partial-approval logic, but do not replace those frontend scenarios. Forecast reliability still depends on the manuscript method and quality of real historical data.
