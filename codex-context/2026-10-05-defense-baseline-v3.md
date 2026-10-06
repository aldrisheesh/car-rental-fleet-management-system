# Defense baseline v3

User authorized updating the defense baseline for tomorrow’s demonstration. Work was additive and preserved existing operational test records. No deployment, commit, actual transfer decision or physical movement was performed.

## Delivered

- Added nondestructive `capture` to `scripts/defense/baseline.ts`; capture archives all public data and hashes referenced storage objects before promoting a snapshot.
- Added payment-policy acceptance rows to restoration tables; generic per-object hashes preserve PDF/test uploads rather than assuming every proof is the original PNG fixture.
- Protected owner-confirmed branch route points through dependency comparisons.
- Added five synthetic Antipolo Economy donors with an idempotent script: four eligible, one excluded by explicit blocking maintenance. Fifteen original vehicles and nineteen original maintenance records remain unchanged.
- Refreshed availability and recommendations through the frontend. The batch assigns each candidate once across the three planning weeks.
- Preserved all 299 bookings, five date-change requests, four policy acknowledgements, 1,175 requirement documents, 289 proofs, 295 payments, 192 rentals, 25 forecast runs, 900 forecasts and 2,700 inputs.
- Added five isolated core exception examples without altering global demand coverage or live provider responses.
- Fixed floating-point noise in forecast axis labels using the existing quantity formatter; actual forecast values are unchanged.

## Verified frontend scenarios

See `output/defense-baseline-2026-10-05/DEMO-GUIDE.md` and screenshots.

- Taft Economy Oct 5: actual inputs oldest-first 3,2,1, WMA 1.7, ceiling 2. Later recursive values 1.55 and 1.49.
- Antipolo Economy: three complete zero-demand weeks, all horizons zero.
- Economy Oct 19: Taft needs 1, one pending transfer covers the gap.
- Economy Oct 12: Taft needs 2, one pending transfer leaves 1 still needed; other donors are reserved in other weekly recommendations.
- SUV Oct 5: both branches need 1, no spare donor.
- Sedan Oct 12: both branches have enough for the saved estimate.
- Latest Economy Oct 19 recommendation: `773078e6-8ac9-4859-9e01-cec1aaadd98a`, left pending.
- Live context checked Oct 5 4:03 PM: Open-Meteo drizzle caution, TomTom nearby closure needing verification, 33.8 km/1h23m route, synthetic reference 16 km/L yielding 2.1 L estimated fuel. This is current review context, not future weather or an alteration to WMA.

## Reproducible snapshot

Latest promoted snapshot: `backup-artifacts/defense/baseline-2026-10-05-2026-10-05T08-02-55.061Z.json`.

Complete pre-update archive: `backup-artifacts/defense/before-capture-2026-10-05T07-46-31.478Z.json`.

`npm run defense:baseline -- verify` passed: database matches, all 1,464 storage artifacts verified. `npm run defense:baseline -- drill` passed: simulated edits/addition restored inside transaction, all database changes rolled back. No actual reset executed. Version is synthetic-defense-v3; old v2 snapshots require old script compatibility, not blind reset using the new version guard.

TypeScript passed; scoped ESLint had zero errors and four pre-existing hook-dependency warnings in admin.decisions.tsx. Five changed defense scripts pass formatting. 59 focused baseline/forecast/allocation/context tests pass. Five isolated edge assertions pass. Preservation comparison covers sixteen unchanged operational/forecast tables plus original rows in three fixture tables; output saved in preservation-check.json.

Insufficient-history and simulated severe/unavailable external scenarios are offline fixture evidence, not current clickable UI baseline cases. Live provider conditions can change tomorrow and are not frozen in this database snapshot. Screenshots and guide explicitly separate these facts.
