# DSS Phase 1 — Version A navigation and Demand Forecast

Implemented locally on the current checkout. No deployment, database migration, or defense-baseline reset in this phase.

## Delivered

- Expanded Decision Support navigation: Demand Forecast, Fleet Allocation, Vehicle Utilization.
- Nested routes under one mounted DSS parent/controller; switching children does not recreate the controller or its synchronization refs. Existing forecast, supply, recommendation, external context, and decision handlers remain shared.
- Demand Forecast uses the Version A visual language: toolbar, historical/forecast chart, results table, WMA evidence, accuracy panel, and operational handoffs.
- Results show saved decimal demand, rounded required units, actual saved supply balance and evaluation time. Evaluation coverage is not mislabeled as adequate supply. Missing/failed checks remain explicit.
- Existing generation and completed-forecast finalization actions retained. Generation scope covers configured pairs; branch/category filters select the visible series.
- Accuracy disclosure preserves horizon-1 scope, zero-actual exclusions, unavailable states and the limits of synthetic records. Zero-demand weeks remain in forecast input history.
- WMA terms and chart data use the existing canonical functions and data. No mockup numbers or invented branches/vehicle-selector controls were added.
- Recent saved-run disclosure, insufficient-history guidance and forecast reload action added.
- Forecast row → allocation handoff stores branch, category and target week in URL search. Sidebar navigation preserves supported search context. Selection and selected recommendation identities can survive reload. Unsupported/stale IDs are normalized against saved data rather than treated as valid evidence.
- The existing allocation balance, supply refresh, recommendation generation/reload, external evidence and protected decision review remain accessible on the allocation route. The existing vehicle-attention table remains accessible on utilization pending its later redesign.
- `/admin/decisions` remains a compatible forecast landing page. Known legacy evidence hashes retain the prior full overview; the skip-to-main hash does not change the screen.
- Parent Owner/Admin guard remains in force for all new child routes. No Staff permission expansion.

## Validation

- `npm run build`: passed after final changes.
- `npx tsc --noEmit`: passed.
- Focused ESLint: no errors; four existing exhaustive-dependency warnings remain in the shared DSS effects. Their dependency behavior was not broadened by this phase.
- 38 focused tests passed: DSS navigation/search compatibility, canonical forecast/supply selection, WMA and horizon/accuracy rules, allocation eligibility and review safeguards.
- Updated one existing source audit assertion to accept formatting whitespace in the unchanged planning-rounding copy.
- Browser: actual saved data loaded; selected Taft/Sedan; selected Oct 5–11 forecast row opened allocation with matching URL context; allocation balance and transfer review present; utilization reachable; return to forecast retained context; cold reload restored Taft/Sedan once data loaded; accuracy disclosure opened successfully.
- Visual checks: 1920×1080, 1366×768, and 390×844. Narrow layout has no page-level horizontal overflow (390px document width at a 390px viewport); comparison table uses its own scroll region. Temporary viewport override reset afterward.
- Desktop evidence: `output/dss-phase1/demand-forecast-1920.jpg`.

## Scope limits and next phase

Live forecast generation/finalization were not submitted during browser verification, to avoid changing the shared saved analysis. Their existing handlers were retained, and forecasting/supply/allocation domain tests passed. No vehicle movement or approval/rejection was performed during this phase.

This verifies Phase 1; it does not certify the complete redesigned DSS as defense-ready. Phase 2 is the full Version A Fleet Allocation layout, with responsive evidence review, generation gates, context recheck, acknowledgement, partial approval/rejection confirmation, recorded states, unresolved shortages and verified manual Fleet handoff. Phase 3 follows with the full utilization workspace and final connected rehearsal.
