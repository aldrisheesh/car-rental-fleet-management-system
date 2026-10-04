# Synthetic defense baseline v2

This dataset supports functional testing and demonstration. It is researcher-designed synthetic scenario data, not real client records, a measured demand pattern, a forecast of the client's business, or evidence of predictive accuracy in production. The client's social-media follower count was not converted into rental volume.

## What changed

Rebuilt booking dates from scratch with deterministic, independent weekday/time/duration/lead-time choices. Historical weekly volume varies; the schedule includes quiet days and all seven pickup weekdays. Completed history covers 24 complete weeks, plus elapsed current-week records where appropriate. Upcoming bookings extend about eight weeks. Existing accounts, credentials, locations, map points, vehicle catalog and payment-method configuration are preserved. The generator retains the existing 12-vehicle demonstration fleet and its agreed demo distribution; it does not claim that this is the client's actual inventory.

Confirmed bookings cannot overlap on the same vehicle. Upcoming generated reservations leave a 12-hour turnaround window. Vehicles under active blocking maintenance receive no new generated upcoming reservations. Historical rentals have matching bookings, payments/quotes and increasing odometers. Pending requests do not count as assigned commitments.

Named functional scenarios include an active rental, confirmed future pickup, requirements review, payment review, ready to confirm, awaiting payment, draft, cancellation and rejection. Two idle sedans remain a deliberately designed DSS example: the three historical weekly demand values [1, 2, 1] produce WMA 1.3; rounded required supply is 2. This scenario demonstrates the calculation and review flow, not the accuracy of a model trained on client records. Synthetic proofs remain explicitly labeled placeholders.

## Saved reference

Reference date: October 4, 2026 (Manila).
Requests: 249.
Latest scheduled return: December 2, 2026.
September: 32 pickups across all seven weekdays; peak of 5 daily pickup/return handovers.
October: 31 pickups across all seven weekdays; peak of 6 daily pickup/return handovers.
These are generated scenario characteristics, not claims about the client.

## Reset workflow

After this baseline is applied, the existing reset command uses the saved v2 snapshot:

```sh
npm run defense:baseline -- reset --apply
```

It restores the same fixed dates and records after rehearsals. It does not resample dates, rebase the calendar to today or add variation each time. Run a reset before a rehearsal/demo when a clean state is needed; do not reset in the middle of a workflow you want to retain.

```sh
npm run defense:baseline -- verify
npm run defense:baseline -- drill
```

Changing the reference date requires preparing a new baseline, not an ordinary reset. Old v1 envelopes intentionally do not pass the v2 version check. Each apply/reset archives the preceding records in backup-artifacts/defense; the latest pointer identifies the snapshot reset will restore.

## Verification

Seven baseline tests cover deterministic reproduction, payment/rental integrity, overlap rejection, reset drift detection, weekday/time/duration/weekly-volume variation and odometer continuity. TypeScript and focused ESLint pass. Transactional prepare rehearsal passed with changes rolled back. Live apply and calendar verification are recorded in the task response.

Live verification completed: saved database rows matched the baseline exactly; all 1,228 synthetic storage artifacts passed byte checks. The reset drill changed an existing request and inserted an additional test request, restored the baseline inside a transaction and rolled the drill back successfully. Both September and October were inspected through the admin calendar. Five calendar tests, TypeScript, ESLint and production build passed after replacing misleading handover labels with neutral “pickup” and “return”.

The named payment-review Toyota Rush request overlaps another confirmed reservation. This is an intentional realistic availability-review case in the resulting dataset: approving payment does not guarantee that this particular vehicle can be assigned. Recheck availability and select an eligible substitute before confirming. The ready-to-confirm Ford Ranger scenario has no confirmed booking conflict and can be used for the straightforward confirmation demonstration.

Applied snapshot: backup-artifacts/defense/baseline-2026-10-04-2026-10-03T21-25-41.581Z.json.
Pre-replacement archive: backup-artifacts/defense/before-prepare-2026-10-03T21-25-09.400Z.json.
