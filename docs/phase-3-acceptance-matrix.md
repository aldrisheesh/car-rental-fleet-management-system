# Phase 3 decision-support acceptance matrix

Date: 29 September 2026  
Branch: `stabilization/ui-refinement`  
Dataset: labeled, reproducible synthetic defense baseline  
Environment: local application connected to the configured defense Supabase project

This matrix records observed functional behavior. It demonstrates deterministic operation with the synthetic baseline; it does not claim empirical forecasting accuracy on real client history or optimal fleet allocation.

| ID / requirement | Acceptance scenario | Observed outcome | Status |
| --- | --- | --- | --- |
| FORECAST-01 / R7 | Generate the fixed three-period WMA across the configured branch/category scope. | Generated 36 positions across three horizons. Every position stored three weighted inputs and used the ceiling of decimal demand as the planning requirement. | Passed |
| FORECAST-02 / R7 | Independently expose one calculation from weekly inputs through the rounded requirement. | The UI displayed the three complete weeks, `0.20 / 0.30 / 0.50` contributions, their sum and the rounded vehicle requirement. | Passed |
| FORECAST-03 / R7 | Apply the current MAPE sampling and zero-actual contract. | Returned 164 temporally eligible samples and retained but excluded 88 zero-actual observations from percentage division. | Passed |
| FORECAST-04 / R7 | Refuse generation when the configured scope has less than three complete weeks. | Returned HTTP 409 with the explicit three-complete-weeks requirement; no fabricated fallback forecast was created. | Passed |
| SUPPLY-01 / R8 | Evaluate current operational supply for every current forecast. | Persisted 36 of 36 snapshots using active state, booking, rental and maintenance evidence. | Passed |
| ALLOC-01 / R8 | Match a same-category, same-week, same-horizon surplus to a shortage. | Produced 1 recommendation with 2 ranked candidates from 11 shortage and 3 surplus positions. | Passed |
| ALLOC-02 / R8 | Explain shortage positions with no compatible donor. | Classified 8 positions as `NoCompatibleSurplus`. | Passed |
| ALLOC-03 / R8 | Preserve current recommendation evidence after reload. | Reconstructed summary matched the generation result; GET caused no additional allocation batch. | Passed |
| ALLOC-04 / R8 | Record a full approval. | Full recommended quantity was saved in its immutable recommendation batch. | Passed |
| ALLOC-05 / R8 | Record an approval below the recommendation. | A recommendation of 2 was approved for 1 unit. | Passed |
| ALLOC-06 / R8 | Record a rejection. | Rejection was saved in a separate immutable recommendation batch. | Passed |
| ALLOC-07 / R8 | Confirm that human decisions remain advisory. | Vehicle branch assignments were unchanged after full approval, lower approval and rejection. | Passed |
| ALLOC-08 / R8, maintenance readiness | Make previously eligible candidates ineligible through new blocking maintenance. | Temporarily blocking 2 candidates reduced generated recommendations to 0 and classified 3 positions as `NoEligibleCandidates`. | Passed |
| ALLOC-09 / R8 | Recalculate after an operational change while retaining old evidence. | Refreshed all 36 supply positions after maintenance and produced 0 current recommendations; earlier batches remained immutable until baseline restoration. | Passed |
| CONTEXT-01 / R8 | Load external operational context for allocation review. | Returned a partial current review-time result with 5 provider records and 2 explicit limitations. Source, status and check time were retained. | Passed |
| CONTEXT-02 / R8 | Keep external context supplementary to WMA and human authority. | UI states that current weather, road, route, distance, travel time and fuel evidence neither modify WMA nor approve a transfer. | Passed |
| BASELINE-01 | Return the shared synthetic environment to the saved defense state. | Restored 26 tables while preserving accounts; the subsequent dry run reported no differences. | Passed |

## Phase conclusion

The Phase 3 completion scenarios are now observed and repeatable. The research feature can demonstrate explainable WMA forecasting, operational supply evaluation, constrained candidate ranking, unresolved-shortage explanations, human-reviewed decisions, maintenance-driven revalidation, external-factor limitations and honest insufficient-data behavior.

The remaining Phase 3 presentation task is to preserve final screenshots from the defense viewport. The next implementation phase is objective-aligned reporting and reconciliation.

## Repeatable command

Start the application, then run:

```bash
npm run defense:decision-support -- --apply --base-url=http://127.0.0.1:3000
npm run defense:baseline -- reset --apply
npm run defense:baseline -- reset
```

The acceptance command intentionally changes only the controlled synthetic environment. Always restore afterward; the final dry run must contain `"differences": []`.
