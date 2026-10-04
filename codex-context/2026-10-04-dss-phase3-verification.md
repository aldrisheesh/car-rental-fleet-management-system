# DSS Phase 3 — Version A Vehicle Utilization

Implemented locally on main. This phase preserves the existing analytics API and calculation boundary. No database/schema changes, baseline resets, vehicle movements, maintenance submissions, or deployment were performed.

## Delivered

- Full vehicle register, replacing the utilization screen's former six-vehicle attention excerpt. The legacy overview excerpt remains compatible.
- Inclusive reporting-date controls with the default latest 30 Manila calendar dates, explicit Apply period and read-only Refresh analysis. Invalid dates, reversed ranges, future end dates and periods exceeding 366 days are rejected.
- Analytics fetching separated from forecast/supply fetching. Changing the reporting period or refreshing utilization does not initiate forecast generation or supply mutations. Abort handling prevents superseded responses from replacing a later period; previous-period data is hidden while the newly selected period loads.
- Independent location/category filters, search, idle classification filters, pagination, empty/filter-recovery and load/retry states. Date/filter/vehicle context is supported in URL search. Reload restores the selected vehicle and its table page.
- Table preserves actual rental days, eligible operational days, full-period utilization, historical coverage, applicable idle duration and canonical idle classification. No invented High/Medium/Low utilization classes or client-side metric recomputation.
- Selected review includes the utilization formula, coverage explanation, current activation/rental/maintenance/idle eligibility, idle baseline and reasons. Incomplete historical eligibility never becomes a measured percentage. Zero eligible days remain unavailable. Idle days are displayed as Not applicable when current idle eligibility fails, rather than presenting an old baseline duration as an applicable idle period.
- Calculation disclosure distinguishes actual rental transactions from reservations, unique Manila rental dates (including active rentals), active-state coverage, maintenance exclusion, the independent current idle baseline and the fixed 14-day threshold.
- No mockup activity breakdown was invented: the API does not expose distinct completed/ongoing/other downtime day totals. The inspector displays the evidence actually provided.
- Fleet link opens the selected vehicle by plate/name and offers a utilization return link. Booking link uses existing vehicle search. Maintenance review uses its supported vehicle ID, with scoped service/history/readiness records and a View all vehicles link; global status totals are labeled as such. This prevents an empty selected-vehicle review from showing unrelated service records.
- Allocation handoff uses actual branch/category IDs and the planning-week context. It does not select a transfer vehicle, authorize movement or claim donor eligibility.
- Review actions focus the selected inspector without resetting scroll to the top. Narrow layouts stack controls and inspector evidence; the comparison table has its own horizontal scroll region.
- Owner/Admin DSS guard retained. No access-policy or backend changes.

## Validation

- 53 focused tests passed: prior forecasting/supply/allocation/review/navigation checks, Manila interval checks, reporting-date validation, utilization filter identity/ordering, null/zero coverage behavior, idle blockers/baselines and independent utilization URL context.
- TypeScript and production build passed.
- Focused ESLint: no errors and no warnings in the new utilization component/helper. Four existing exhaustive-dependency warnings remain in the shared DSS controller.
- Updated the existing canonical-source audit assertion to follow the separated analytics refresh effect rather than requiring the old combined-fetch dependency list.
- Browser used actual saved synthetic data. Default period loaded all 12 vehicles; second page displayed the remaining two; selecting Toyota Rush persisted through cold reload with page 2 restored. Its active rental was explicitly disclosed and applicable idle duration was suppressed.
- January 1–30 reporting period displayed known zero rental days and unavailable eligibility/utilization with an incomplete-history explanation. Reversed dates produced an inline error without applying the invalid range. Restoring the current period restored its measured formula.
- Location/category filtering isolated Taft/SUV; unmatched search produced clear filter recovery. Idle filtering displayed the actual Nissan Urvan flag. Read-only Refresh analysis reloaded successfully.
- Nissan Urvan Fleet handoff opened exactly one matching vehicle. Fleet showed its confirmed-reservation state, demonstrating why an idle signal alone cannot establish transfer eligibility. Return preserved utilization dates and selected vehicle.
- Maintenance handoff showed Nissan Urvan's own completed service record/history. Booking handoff showed Nissan Urvan-related requests, including future bookings. No operational record was changed.
- Allocation handoff opened the Van comparison for the same branch/category and target week; saved balanced supply remained balanced, with no transfer authorization inferred from idle status.
- Expanded calculation/coverage evidence inspected. Read-only connected navigation across the three DSS screens remains available.
- Visual checks at 1920×1080, 1366×768 and 390×844: desktop table actions fit; mobile review focus stays below the header; controls/actions/evidence stack; no page-level horizontal overflow (390px document width at 390px viewport).
- Screenshots: `output/dss-phase3/vehicle-utilization-1920.jpg` and `vehicle-utilization-review-1920.jpg`.

## Remaining release work

The three Version A frontend phases are complete locally. The final controlled defense rehearsal remains: forecast generation/finalization, supply refresh, generation with/without compatible donors, missing external evidence, partial approval/rejection persistence and repeat-decision protection, then guarded Fleet booking/maintenance conflicts and manual movement. Coordinate that rehearsal with the resettable synthetic baseline so expected records and outcomes are reviewable. This phase's read-only browser verification does not claim those mutations were submitted.

After the rehearsal, deploy the reviewed build and verify the same flows on the defense domain. Preserve the synthetic-data disclosure; screenshots and test passes alone do not establish real-world predictive accuracy or institutional submission approval.
