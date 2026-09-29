# Resettable synthetic defense baseline

All observations, historical forecast issuance timestamps, documents and payment proofs in this baseline are synthetic. They verify computation and workflow behavior; they are not real client records or evidence of predictive accuracy. Data covers 24 complete Manila weeks and six weeks of future bookings. External weather/route services remain live and are not frozen by the reset.

## Commands

Run from the repository with Node 22+ and the existing private `.env.local`:

```sh
# Inspect current database without changing it
npm run defense:baseline -- audit
# Preview a newly generated baseline
npm run defense:baseline -- prepare --as-of=2026-10-06
# Prove the import inside a transaction that is always rolled back
npm run defense:baseline -- prepare --as-of=2026-10-06 --rehearse
# Replace synthetic operational data and save the new baseline
npm run defense:baseline -- prepare --as-of=2026-10-06 --apply
# Preview differences from the latest saved baseline
npm run defense:baseline -- reset
# Discard subsequent operational test records and restore the saved baseline
npm run defense:baseline -- reset --apply
# Verify database contents and every referenced synthetic Storage object
npm run defense:baseline -- verify
# Temporarily edit a draft and add a booking, restore, verify, and roll back
npm run defense:baseline -- drill
```

Use today's reference date for current testing. Prepare October 6 shortly before the defense. Reset restores the saved timestamps exactly; it does not freeze the application clock. An October 6 baseline prepared early includes future simulated history, so it is unsuitable for demonstrating live results before that date.

## Reset boundaries

The command is locked to the existing synthetic Supabase project. It archives all public rows before replacing the explicitly listed operational tables, including their related notifications, email queue and synthetic audit entries. No seed-generated email is enqueued. Foreign keys and check constraints remain enabled; named application triggers are disabled only inside the transaction and restored before commit. Any database error rolls the transaction back.

Auth users/passwords, profiles, branches, categories, payment methods, contact configuration, backup/recovery records and schema remain intact. The existing twelve vehicles retain their identities and images; their synthetic branch distribution, odometers and operational state return to the baseline. Adding vehicles or changing catalog/account configuration requires preparing a new baseline. Account registrations are not undone. Test uploads remain in Storage but are detached when their test rows are removed; reset does not delete arbitrary Storage objects. The baseline's own clearly marked document/proof objects must be present and unchanged.

Baseline files, hashes and pre-reset database snapshots are private local files under `backup-artifacts/defense/`, excluded from Git. Preserve this directory on the operator's computer. They are public-schema snapshots, not full disaster-recovery backups of Auth and Storage. The older `defense:verify` checks September 15 fixtures and must not be used to assess this new baseline; use `defense:baseline -- verify`.

## Traceable example

Taft Sedan completed-week counts, oldest to newest: **1, 2, 1**.

`0.50 × 1 + 0.30 × 2 + 0.20 × 1 = 1.30`.

Planning requirement: 2. Taft eligible sedan supply: 0. Shortage: 2.
Antipolo sedan requirement: 0. Eligible supply/surplus: 2.
Proposed movement: up to 2 sedans, Vios before City by idle duration.
Approval remains advisory. Use the UI to check current eligibility and external context before deciding.

Other scenarios: active Innova rental, Wigo ready for pickup, Avanza requirement review, Rush payment review, a draft, cancelled/rejected requests, blocked Mirage maintenance, and upcoming Everest preventive maintenance. Completed rentals have consistent odometers and cleared inspections; confirmed bookings include four synthetic requirement documents and a matching quote/payment/proof.

The file's `expected` section records scenario IDs, dates, counts and synthetic MAPE. Historical forecast snapshots are generated fixtures, not evidence that the production endpoints were exercised. End-to-end application regeneration and decision testing belong to the next implementation/verification phase.

## Verified September 29 baseline

Applied to the synthetic project from `stabilization/ui-refinement` with reference date September 29, 2026: 231 bookings, 24 completed weeks of history, and future bookings through November 14. All 1,139 synthetic document/proof objects passed Storage verification. The transactional reset drill edited an existing draft and inserted a new booking, restored the saved baseline, and compared every reset table and vehicle row successfully. The drill was rolled back; a subsequent read-only reset preview reported no differences.

Generator tests (5), defense tests (19), and forecasting/supply/maintenance tests (22) passed. Baseline-script lint passed. Project type-checking still reports two errors in `src/routes/booking.tsx` concerning the pickup/delivery option type; these remain outside the baseline work. These checks establish a repeatable demonstration dataset, not complete defense readiness or empirical forecasting accuracy.
