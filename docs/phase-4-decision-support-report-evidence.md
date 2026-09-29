# Phase 4 decision-support report evidence

Date: 29 September 2026  
Branch: `stabilization/ui-refinement`  
Dataset: labeled, reproducible synthetic defense baseline

## Delivered report contract

The Reports screen now includes a decision-support evidence section tied to the selected Manila reporting dates and branch filter. It reports:

- the latest WMA run generated inside the selected period;
- total forecast positions and next-week positions;
- finalized horizon-1 MAPE, eligible sample count and zero-actual exclusions for target weeks inside the selected period;
- the latest supply evaluation for every forecast in the selected run, including shortage, surplus and balanced positions and unit totals;
- the newest allocation batch whose recommendations reference the exact current supply-evaluation identifiers;
- pending, approved and rejected recommendation counts and recommended versus approved units; and
- a branch/category table that reconciles next-week decimal demand, rounded required units, projected supply and the resulting gap.

Branch filtering narrows forecast, supply and table figures to the selected branch. A cross-branch allocation recommendation remains included when the selected branch is either its source or destination. Approval remains advisory and does not change vehicle location.

The same screen now exposes the supporting report subjects backed by canonical records:

- maintenance starts, completions, cancellations and blocking workload;
- utilization, rental days and explicit idle/unknown counts;
- booking demand, rental starts, fleet size and utilization by branch;
- fleet, rental days, utilization and idle evidence by vehicle category; and
- Owner/Admin-only counts and amounts for latest initial-payment submissions, verifications and resubmission reviews.

Payment amounts are explicitly labeled as initial-payment evidence rather than business income, profit or final settlement. Operations Staff do not receive the payment report. A “latest submission” is the current payment record whose latest `submitted_at` falls inside the selected period; it is not a count of every historical resubmission event.

If the period contains no forecast run, the screen states that explicitly instead of showing an older run as current. Accuracy samples remain separately described because their filter is the target-week period, not the forecast-generation period.

## Observed baseline reconciliation

For 1–29 September 2026 with all branches selected, the authenticated live report returned:

| Measure                                  | Observed value |
| ---------------------------------------- | -------------: |
| Forecast positions                       |             36 |
| Horizon-1 positions                      |             12 |
| Supply evaluations                       |             36 |
| Shortage positions                       |             11 |
| Shortage units                           |             18 |
| Surplus positions                        |              3 |
| Surplus units                            |              6 |
| Balanced positions                       |             22 |
| Exact current allocation recommendations |              1 |
| Recommended transfer units               |              2 |

Supporting records for the same all-branch period returned 38 latest payment submissions totaling PHP 60,500, 37 verified initial payments totaling PHP 58,000, one blocking maintenance record, 78 rental days, two branch rows and six vehicle-category rows. The payment figures are available only to Owner/Admin.

The current baseline recommendation was pending. The period-specific accuracy result contained 25 eligible samples and 11 retained zero-actual exclusions, with an overall MAPE of approximately 38.93%. These values are synthetic demonstration results and do not establish predictive performance on the client's real operations.

The Antipolo branch filter returned 18 forecast positions, 18 supply evaluations and 6 horizon-1 rows. It retained the one current allocation recommendation because Antipolo participates in that cross-branch recommendation.

## Verification

- `npx tsc --noEmit` — passed.
- `node --experimental-strip-types --test src/lib/admin-reports.test.ts` — 17 passed, 0 failed.
- `npm run build` — passed.
- Authenticated `/api/admin-reports` checks for all branches and one canonical branch — HTTP 200 with reconciled decision-support results.
- `npm run defense:baseline -- reset` — dry run returned `"differences": []`; report verification made no database changes.

The Playwright CLI browser pass could not start because no supported browser executable is installed in its local runtime. The production client and SSR builds passed, and the authenticated live API was verified. A final signed-in visual screenshot should be preserved during the defense rehearsal.

## Remaining Phase 4 scope

This closes the report-coverage portion of Phase 4 for bookings, initial payments, maintenance, utilization/idle, branch demand and allocation decisions. Reminder scheduling, email-delivery evidence, centrally persisted profile editing and the full report reconciliation walkthrough remain separate work. They should not delay preserving the main forecast and allocation walkthrough evidence.
