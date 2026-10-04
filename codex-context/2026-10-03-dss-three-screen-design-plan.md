# DSS three-screen design and implementation plan

Status updated October 4, 2026: Version A was selected. The three user-facing implementation phases (Demand Forecast, Fleet Allocation, Vehicle Utilization) are complete locally. Final controlled mutation rehearsal and deployment remain. The original concepts and planning checklist below are retained as design history; phase verification records document the delivered behavior.

## Decision

Separate Decision Support into Demand Forecast, Fleet Allocation, and Vehicle Utilization under one expanded sidebar group. Preserve the existing backend contracts, permissions, calculations, decision safeguards, and manual Fleet workflow. This is feasible as a frontend extraction, but should be implemented and verified in phases before the October 6 defense.

Recommend direction A (Familiar workspace) because it resembles the existing list/editor pattern and reduces navigation changes. B (Guided review) emphasizes the next task with a side rail. C (Compact analysis desk) emphasizes comparison tables and an inspector. Select one consistent family before implementation.

## Image interpretation

The nine generated images are visual concepts using illustrative synthetic data, not final specifications or evidence of working software. Their generated numbers, dates, wording, recommendation counts, and individual controls require reconciliation with actual application data before implementation. Do not reproduce invented branches, unsupported decision states, vehicle-selection controls, or forecasts from these images.

Known corrections required: all charts and WMA calculations must use one consistent server-provided series and horizon; zero-actual weeks are excluded from MAPE denominators, not demand history; readiness must distinguish evaluation coverage from sufficient supply; external context describes the current review, not target-week predicted weather; approval alone does not resolve a shortage; use the existing two operational locations and existing Pending/Approved/Rejected decision states. Candidate evidence is not a new vehicle dispatch selector. Do not suggest additional sourcing as an automated capability. Supply comparison is forecast demand against projected readiness for the target period, with the actual snapshot timestamp.

Utilization labels also need correction: the canonical idle-days counter is elapsed time since the later applicable last-rental end/current activation baseline, subject to eligibility and coverage checks. It is not simply reporting-period eligible days minus rental days. Do not copy the generated images' simplified definition or their assertion that only completed rentals contribute to rental days; use the actual analytics overlap rules.

## Visual review of the concepts

- A Forecast: strongest familiar chart/evidence hierarchy. Use the actual series to correct forecast values and readiness labels. A Allocation: a clear list/detail relationship, but keep current-context flags directly above the decision controls and remove invented vehicle-changing controls. A Utilization: a readable full-width comparison table; reduce the repeated small metric boxes in the selected review and correct idle/rental definitions.
- B Forecast: guidance rail makes the next action explicit but consumes chart space. B Allocation: good persistent evidence/decision rail, with a risk of narrow recommendation content on smaller laptops. Remove invented prior branches and vehicle selectors. B Utilization: guidance rail is more repetitive here; remove the invented support-article link and do not require forecasting before independently reviewing utilization.
- C Forecast: suitable for quick comparison, but its chart/history calculations need reconciliation and dense evidence needs responsive disclosure. C Allocation: strong aligned evidence rows; remove invented branches/states and ensure the inspector can remain readable on smaller screens. C Utilization: clearest table and selected-review division; verify metadata availability for each readiness/activity detail before displaying it.

Generated files are approximately 16:9 landscape (1672×940/941 pixels), intended as desktop design references. The implemented interface must be verified separately at 1920×1080. An image cannot display every confirmation/loading/error state; the functional checklist below specifies them.

## Functional ownership and complete workflow

### Demand Forecast

- Generate the forecast with existing endpoint scope. Branch/category viewing filters must not imply that generation affects only the selected chart if generation still covers all eligible pairs.
- Show historical actuals, future forecast horizons, saved-run timestamp, target weeks, forecast decimals and required units.
- Preserve the auditable WMA example, newest-first weights, contributions, rounding, horizon and series identification.
- Preserve insufficient-history cases; never manufacture an eligible forecast when fewer than the required completed weekly observations exist.
- Preserve completed-forecast finalization, MAPE, eligible forecast counts, zero-actual exclusions, scope and unavailable accuracy states. Synthetic results demonstrate behavior rather than real-world predictive validity.
- Expose run/history evidence and supply readiness. Link each target week/category into Fleet Allocation while preserving context.
- Explain loading, generation failure, empty series and stale saved runs. Do not duplicate generation or evaluation merely because users switch screens.

### Fleet Allocation

- Preserve current saved analysis reload, supply refresh and recommendation generation as distinct actions.
- Show supply evaluation coverage, timestamps, required/projected units and branch/category/week balance. Preserve shortage, surplus, balanced, not evaluated and no forecast states.
- Retain gates that require applicable current forecasts and evaluated supply before recommending compatible same-category donors.
- Display recommendation source/destination, category, target week, horizon, suggested quantity, status and saved rationale.
- Retain selected recommendation review, candidate ranking/identity and eligibility at analysis time, source/destination snapshot evidence and saved evaluation timestamps.
- Preserve weather, road conditions, route feasibility/accessibility, checked time, provider sources, fallback limitations, route metrics, fuel assumptions and candidate fuel estimates in readable disclosures. Unavailable estimates must remain unavailable.
- Preserve Recheck external context. Critical flags and missing evidence stay visible; context is review-time evidence, not a target-week forecast or clearance to move.
- Retain acknowledgment, valid integer quantity bounded by the recommendation, partial approval, approve/reject final confirmation, cancellation, submission errors and persisted decisions. Reset acknowledgment when the reviewed context changes as the current implementation requires.
- Approval records permitted quantity; it neither moves a vehicle nor automatically resolves the shortage. Prevent repeat/overwritten decisions. Present the resulting recorded state explicitly.
- Preserve unresolved shortages and their actual reasons: no compatible surplus, no eligible candidates, insufficient eligible candidates, or no remaining capacity.
- Link to the manual Fleet workflow after approval, with booking/readiness checks before changing a vehicle's operational location. Preserve return context to the reviewed recommendation.
- Rejecting records non-use of the recommendation; show that outcome without implying a fleet movement.
- Clearly distinguish old recommendations from current analysis after a new forecast or supply evaluation.

### Vehicle Utilization

- Preserve current analysis/reporting period, vehicle identity and plate, branch, rental days, eligible operational days, utilization, idle days and classification.
- Explain the eligible-days denominator and historical coverage. Partial/insufficient eligibility must retain Unable to Determine rather than inferred utilization.
- Retain Fleet handoff for reviewing the actual vehicle. Idle status is a review signal, not an automatic transfer instruction or an unconditional donor eligibility claim.
- Proposed UI improvements: reporting-date controls (existing analytics API accepts start/end), filters, a selected-vehicle inspector, and stable vehicle links to related booking/maintenance review. Verify available metadata and destination route/query contracts before wiring these; they are UI additions, not already implemented capabilities.
- Link into allocation with matching category/branch context where applicable; allocation still runs its own supply and eligibility checks.

### Connected navigation

Forecast → selected week/category allocation → recommendation evidence → recorded approval → Fleet readiness and affected-booking review → manual location change → refreshed supply/analysis.

Utilization → selected vehicle → Fleet/bookings/maintenance review → allocation when applicable. Do not imply that opening an idle vehicle makes it the selected transfer vehicle.

Keep owner/admin authorization from the existing DSS route. Retain legacy `/admin/decisions` links through a redirect or compatible landing route. Store appropriate filters, selected run/week and recommendation identity in URL state so reload, back and cross-screen links preserve the review.

## Implementation phases

1. Shared DSS shell, route structure and data ownership. Extract reusable fetching/action logic without changing API contracts; preserve auth, pending operations and legacy links. Verify switching routes does not trigger duplicate writes.
2. Demand Forecast screen. Complete generation, chart, evidence, finalization/accuracy and supply handoff. Verify actual saved data and all failure/empty states before proceeding.
3. Fleet Allocation screen. Complete balance, generation/reload/refresh, all evidence, external context, quantity/acknowledgment, final confirmation, approval/rejection and manual Fleet handoff. This is the highest-risk phase and must preserve all existing safeguards.
4. Vehicle Utilization screen. Complete coverage-aware analytics, inspector and verified operational links. Keep date/filter additions bounded by existing data/API support.
5. Full rehearsal and regression. Test cold load, insufficient history, forecast generation, automatic readiness snapshots, shortages with and without donors, stale analysis, missing/outage external data, partial approval, rejection/cancel, persistence after reload, repeat-decision protection, and Fleet booking/maintenance conflicts. Check direct-route permissions, keyboard navigation, labeled controls, responsive overflow and sticky panels below the header. Review 1920×1080 and smaller desktop layouts; screenshots must wait for skeletons and charts to finish loading.

Use the synthetic defense baseline for reproducible scenarios, clearly labeled. Do not reset or mutate operational records during design selection. Do not expand into home-level parking capacity, new forecasting algorithms or new dispatch logic during this frontend refactor.

Reserve the final day before defense for regression and rehearsal. If the split is incomplete or destabilizes the workflow, retain the working single DSS route rather than presenting partially connected screens. Mockups alone cannot establish defense readiness.

## Audit sources

- `src/routes/admin.decisions.tsx`: current forecast, accuracy, supply, utilization and allocation actions and states.
- `src/components/admin/allocation-review.tsx`: full selected-transfer evidence and decision flow.
- Existing Briah admin shell, supplied screenshot and requested design skills.
- Web Interface Guidelines: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
