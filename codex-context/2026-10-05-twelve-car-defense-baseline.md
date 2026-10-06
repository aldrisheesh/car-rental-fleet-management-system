# Twelve-car defense reconciliation

User authorized correcting the synthetic defense baseline to the original 12 active cars while retaining different test cases. This supersedes `2026-10-05-defense-baseline-v3.md` and its extra-donor guide.

## Data outcome

- Project: `vkfacfjkwomhfvrieaza`; localhost and public deployment share this synthetic database.
- Original 12 active plates: DEV-AVAN-001, DEV-CITY-001, DEV-EVST-001, DEV-HIAC-001, DEV-HILX-001, DEV-INNO-001, DEV-MIRA-001, DEV-RANG-001, DEV-RUSH-001, DEV-URVN-001, DEV-VIOS-001, DEV-WIGO-001.
- Eight extra fixture rows were retired (`is_active=false`), rather than deleted, to preserve completed rental and old recommendation references. Total database vehicle rows remain 20; public catalog is 12.
- All 299 booking IDs/statuses retained. Exact unchanged comparisons passed for payments, proofs, date-change requests, policy acceptances, requirement documents/reviews/sets and rental financial records.
- Seven future seed Sedan bookings moved to non-overlapping May/June 2027 Vios schedules. Durations and quote monetary fields retained. Missing saved handover arrangements filled with explicit synthetic instructions. See `applied.json` and `preservation-check.json` for IDs and field changes.
- Returned Vios booking f41bb865-bf2c-4977-9af1-744b5a951c50 scheduled pickup aligned to its actual October 4 release and return kept two days later. Actual rental start/end and odometers unchanged. Lead-time trigger bypass was restricted to the locked historical fixture repair and restored within the same transaction.
- Original Mirage moved to Antipolo. Its previous blocking maintenance moved to the original Everest. New completed Mirage inspection e4000000-0000-4000-8000-000000000001 has next service October 19; lifecycle transitions were respected.
- Earlier 936 forecasts preserved; corrected newest run adds 36, total 972 across 27 runs. An intermediate run created during this correction was archived to `backup-artifacts/defense/retired-interim-twelve-car.json` then pruned with its pending generated analysis only. Existing approved/rejected decisions preserved.

## Demonstration

Use `output/fleet-reconciliation-2026-10-05/DEMO-GUIDE.md`.

Saved batch: October 5 Sedan full coverage using original Honda City; October 5 Economy partial coverage using original Mirage, leaving one needed. Candidates are reserved once across the whole three-week batch. Regeneration can choose a different eligible week due to evaluation ordering; use the saved analysis for repeatability. Everest blocking maintenance, Innova active rental, no-donor SUV, zero-demand Antipolo Economy and booking ledger exceptions remain.

Public catalog verified via frontend: 12 articles and original 12 models. Local transfer review checked live Open-Meteo and TomTom sources; they remain current review-time advisory evidence and do not modify WMA demand. Pending decisions were not approved/rejected during verification.

## Local reliability fixes — not deployed

- `forecast-history.server.ts` sequentially pages history and fails on later-page errors. `api.forecasts.ts` uses stable ordering for forecast and run paging, preventing default 1,000-row truncation from omitting newest positions.
- `hasOutstandingBookingConflict` in `supply-evaluation.server.ts` ignores scheduled reservations belonging to ended rentals; actual rental overlap remains separately checked. `api.supply-evaluations.ts` now selects booking IDs and applies that rule. Active rentals and unfinished reservations remain blockers.
- Regression coverage for 1,008-row history, partial-fetch failure and returned/unfinished rental conflicts.
- Old `dss-demo-donors.ts` builder refuses to run when the reconciliation marker exists, preventing extra vehicles from being reintroduced by that historical script.

No deployment or commit performed. Public catalog data is corrected immediately; production forecast/supply regeneration still uses old code until publication. Use localhost for the verified DSS rehearsal until then. Do not deploy the large dirty tree blindly.

## Backup and verification

Pre-correction archive: `backup-artifacts/defense/before-capture-2026-10-05T08-30-03.386Z.json`.

Promoted latest corrected snapshot: `backup-artifacts/defense/baseline-2026-10-05-2026-10-05T09-01-17.923Z.json` (latest.txt updated). It contains 299 bookings, 295 payments, 289 proofs, 192 rental transactions, five date changes, 21 maintenance records and 1,464 referenced storage artifacts.

`defense:baseline verify` passed exact database comparison and all 1,464 storage hashes. The transactional restore drill passed, reproduced the baseline exactly, verified application triggers enabled, and rolled all changes back. Its result is saved in `output/fleet-reconciliation-2026-10-05/baseline-drill.log`. No actual reset performed.

Final scoped checks: TypeScript noEmit passed; scoped ESLint passed; Prettier check passed; 21 focused regression tests passed. Earlier in this task 33 focused tests also passed before the final unchanged test rerun scope.

Use capture/verify/drill/reset of this snapshot. The historical `prepare` seed builder is not appropriate for preserving these expanded ledger cases and archived vehicle history. Restoring old snapshots would reactivate extra fixtures. Live provider conditions are not frozen by a database backup.

Frontend evidence is in `output/fleet-reconciliation-2026-10-05/`: catalog-twelve.jpg, full-transfer.jpg, partial-transfer.jpg, context-review.jpg. Do not navigate user-owned tabs while they are actively using them; the existing screenshots were already verified.

## Follow-up: retired fixtures appearing in Vehicle Utilization

The shared analytics API intentionally includes historical inactive vehicles. The DSS route now uses `currentUtilizationFleet` when accepting that response, so its table, branch/category choices, no-activity summary and idle insights all use active vehicles. Historical reporting data and archived rental records remain available. Regression test retains active maintenance and on-rental cases while excluding an archived vehicle with past rentals. Six utilization tests and TypeScript passed. Frontend verified 12 matching vehicles across both pages, including the original Mirage and active Innova rental on page two. Screenshot: `utilization-current-fleet.png`. This frontend fix is also local and not deployed.
