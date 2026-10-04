# Frontend Phase 2 — DSS review verification

3 October 2026. Implemented on `main`, baseline commit `02705878`, with Phase 1 changes still in the working tree. **Verified locally for the non-mutating paths below; not deployed or a declaration of full defense readiness.** No production push, baseline reset, final approval/rejection, or fleet movement was performed. Phase 3 has not started.

## Behavior changed

- Review transfer selects the exact recommendation, aligns branch/category/week overview controls using its destination evaluation and forecast IDs, and scrolls/focuses the selected review rather than the top of the entire recommendations section. The saved transfer review identifies source, destination, category, horizon, inclusive target week, and recommended quantity.
- External results are bound to the requesting recommendation ID and refresh generation. Old responses are aborted/ignored; old evidence is hidden immediately when the selection or check generation changes. Approval acknowledgment and confirmation also belong to that check generation. No acknowledgment carries across transfers or refreshed evidence.
- Review starts with the saved supply rationale and an external advisory summary. Reported closures/blocked routes and severe weather take precedence over generic incomplete-evidence messaging. Missing factors remain explicit and do not imply safety. Provider names and check time are visible; the warning describes current review conditions rather than target-week prediction.
- Supply snapshots, evaluation times, ranked candidates, external source statuses, fallback details, distance/travel-time metrics, limitations, and reference fuel assumptions remain accessible through native disclosures. Candidate-specific fuel estimates are separated from first-ranked-candidate aggregate metrics.
- Pending decisions require an acknowledgment and a second inline confirmation naming the exact route, week, and quantity. Invalid, fractional, out-of-range, busy, loading, unacknowledged, or non-pending approval is blocked. Rejection has its own confirmation and does not require an approval quantity. The acknowledgment is a UI safeguard, not a newly persisted audit field.
- Approval still uses the existing PATCH workflow; it does not relocate vehicles. Approved records show the recorded quantity and a Fleet link; rejected records explain the outcome. Partial approval is explicitly described as leaving recommended units unapproved rather than resolving the shortage.
- Unresolved shortages stay visible as a count below the selected review, with explanations expandable. Loading, analysis failure, unresolved shortages without matches, and genuine no-transfer states use different messages. Errors are not presented as an empty successful analysis.
- Loaded supply/vehicle tables remain visible during routine background fetches, avoiding skeleton-driven page jumps while reviewing. First loads still show loading states.
- Reload saved analysis is distinct from Generate recommendations and Generate new forecast. Coverage identifies evaluated branch/category/week positions rather than conflating them with vehicle counts. Existing automatic generation behavior is preserved.
- Forecast accuracy disclosure states horizon-1/nonzero-actual scope and observed exclusion counts. WMA arithmetic, forecasting/matching rules, external interpretation rules, API authorization, database schema, and human movement workflow are unchanged.

## Verification results

| Check | Result |
|---|---|
| Final production build | Passed |
| Relevant Node tests | **32 passed, 0 failed**: review evidence binding/decision gating/advisory priority, existing allocation generation/decision rules, canonical DSS sources/calculations, date boundaries, external interpretation and admin context |
| Type checking | Two existing Notifications API errors remain at `src/routes/api.notifications.ts:100–101`; no new errors. Phase 1 reproduced these on untouched HEAD. |
| Scoped ESLint including formatting | 0 errors, 4 existing DSS hook dependency warnings. All five Phase 2 TypeScript/TSX files formatted with Prettier. |
| Diff whitespace check | Passed |
| Impeccable detector on DSS route/review component | No findings |
| Desktop/laptop/narrow layouts | Checked at 1920×1080, 1366×768, and 390×844. No page-level horizontal overflow at 1366 or 390. These are emulated viewports, not physical-device touch tests. |

Browser checks used the local app with the existing authorized admin session and synthetic data:

1. Review transfer opened/focused the selected review; selecting Oct 5 displayed Horizon 2 and Oct 5–11, with the correct candidate snapshot.
2. Switching from Sep 28 to Oct 5 immediately hid old external evidence, cleared acknowledgment, and disabled decisions during loading.
3. Reported `Closed/Impassable` remained the leading warning while route feasibility was `Unavailable` and accessibility `Unknown`, with Open-Meteo/TomTom/unavailable route attribution.
4. Acknowledgment enabled approval; approval opened an exact route/week/quantity confirmation. Cancel closed it without recording a decision.
5. Quantity 0 disabled approval and displayed an inline error. Rejection opened its own confirmation and was cancelled without recording.
6. Rechecking context cleared acknowledgment and paused decisions. Keyboard activation retained focus on the checking button; repeated activation while loading is guarded.
7. Keyboard opened the external-source disclosure, including unavailable route metrics, provider statuses, candidate-specific reference fuel estimates, and assumptions.
8. Reload saved analysis left the loaded vehicle table visible rather than replacing it with a loading skeleton; decision controls were paused while the saved recommendation read was in progress.
9. Saved supply snapshots/candidate disclosure opened and exposed the correct required/projected values, evaluation dates, vehicle name, plate, and idle days. Optional evidence remains below the decision controls.

## Evidence

- [Desktop selected review](frontend-phase2-2026-10-03/review-desktop.png)
- [Laptop selected review](frontend-phase2-2026-10-03/review-laptop.png)
- [Narrow selected review](frontend-phase2-2026-10-03/review-mobile.png)

## Limits and next acceptance work

- Final approval/rejection persistence and the approved-record Fleet handoff were not replayed against shared data. Existing core decision tests pass; a designated resettable-fixture replay remains Phase 4 acceptance work.
- Current live fixtures had one-unit pending recommendations. Partial-quantity rules were tested with multi-unit inputs; saved partial/Approved/Rejected presentation still needs integrated fixture coverage.
- The browser exercised partial external data and reported closure, not every all-unavailable/provider-failure combination. Empty/no-donor/analysis-error recovery branches were implemented but not forced through browser network interception.
- Phase 1's payment-detail coverage, staff landing behavior, committed movement replay, and baseline Notifications type errors remain recorded in its report. These are not closed by this DSS UI phase.
- Verify an accepted deployment separately and retake submission GUI evidence after screens are stable. No manuscript, questionnaire, UCD, or UCR was edited in this phase.

Next: obtain the user's Phase 3 signal for role/customer/report/notification refinements. Preserve the remaining acceptance checks for the integrated Phase 4 replay.
