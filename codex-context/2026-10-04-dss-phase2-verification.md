# DSS Phase 2 — Version A Fleet Allocation

Implemented locally on main, preserving the existing shared DSS controller and incumbent admin visual language. No deployment, database migration, baseline reset, vehicle movement, or saved approval/rejection was performed in this phase.

## Delivered

- Dedicated week/category toolbar; branch supply comparison; recommendation list with decision-status filtering; sticky review panel; unresolved-shortage evidence; recorded decision history.
- Refresh supply, reload saved analysis and generate recommendations retain their existing handlers. Refresh and generation cover the current forecast run; filters change the visible selection only.
- Generation requires loaded, error-free analysis, completed supply evaluations, shortages and surplus. Same-category eligibility matching remains in the existing domain logic.
- Recommendations are scoped to current supply evaluation identities, selected week and category. Stale snapshots and cross-category rows cannot appear as current review options. Unresolved explanations likewise require a current evaluation identity.
- Older recorded decisions have a separate read-only history disclosure. An approval neither moves a vehicle nor changes the saved shortage automatically.
- Candidate names, plates and saved eligibility appear before external evidence and decision controls. Saved supply snapshots, ranking, idle evidence, provider status/timestamps, route metrics, limitations and candidate fuel assumptions remain available in expandable evidence sections.
- Current external context, closure/severe warnings, unknown/missing evidence, context recheck and map-pin handoff retained. External context is explicitly review-time evidence, not a forecast for the target week or a WMA demand adjustment.
- Existing human acknowledgment, integer quantity bounds, partial-approval explanation, final approval/rejection confirmation, cancellation and recorded states retained. Rechecking context invalidates acknowledgment.
- Candidate Fleet links filter the existing register by plate/name and retain a return link with allocation context. Related booking links use the existing booking search. Vehicle movement remains the existing guarded operational action in Fleet.
- Fixed parent-route search navigation: filter/selection changes and restoration from Fleet explicitly target the appropriate child screen rather than accidentally returning to `/admin/decisions`.
- Owner/Admin access guard retained; no Staff permission expansion.

## Validation

- 42 focused tests passed: canonical forecast/supply selection, WMA, allocation matching, review safeguards, navigation parsing and four new workspace tests for snapshot scoping, gap scoping, generation gates and valid selection.
- TypeScript (`npx tsc --noEmit`) and production build passed.
- Focused ESLint: no errors, four existing shared-controller exhaustive-dependency warnings. The new workspace has no lint warnings.
- Actual browser workflow: selected forecast row → matching Oct 5–11/Sedan allocation; current recommendation and balance displayed; SUV and Oct 12 selections excluded the unrelated recommendation; Approved status with no matching row hid pending review; restoring All restored the pending review.
- Fleet link opened exactly one matching Toyota Vios; return action restored the allocation route, category, week and recommendation. Booking link showed Toyota Vios-related records through the existing search.
- Expanded evidence showed both supply snapshots, ranking, provider availability/timestamps, route distance/time, limitations and honest unavailable fuel estimates.
- Acknowledgment enabled actions; approval and rejection opened final confirmations and were cancelled. External-context recheck disabled approval until acknowledgment was renewed.
- Cold reload retained the allocation route/filter context and restored saved analysis after loading.
- Visual checks at 1920×1080, 1366×768 and 390×844: sticky panel stayed below the header; evidence and decision controls remained reachable inside its desktop scroll region; narrow layout stacked with no page-level horizontal overflow (390px document width for 390px viewport). Balance table has its own horizontal scroll region.
- Screenshots saved under `output/dss-phase2/`.

## Remaining scope

Live generation, supply refresh and final decision writes were not submitted during browser verification. Their retained handlers and domain rules were reviewed/tested, but this pass does not claim a fresh live mutation rehearsal. Phase 3 is the dedicated Vehicle Utilization workspace; final connected defense rehearsal and deployment remain afterward.
