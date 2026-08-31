# Data and Business Rules

**Status:** Development Baseline v1 — Partially Frozen  
**Last updated:** 2026-09-01

## Canonical Rental Activity

Active rental:

`started_at IS NOT NULL AND ended_at IS NULL`

Ended rental:

`started_at IS NOT NULL AND ended_at IS NOT NULL`

A Confirmed booking without a release record does not count as rental activity.

## Rental Days

Once ended_at exists, rental-day analytics must use canonical rental intervals rather than booking status.

Exact day-count presentation/reporting details may be implemented by the later analytics slice.

## Vehicle Utilization

`UtilizationPercent = (RentalDays / EligibleOperationalDays) * 100`

RentalDays come from canonical rental intervals.

## Idle Baseline

For a previously rented vehicle, the post-rental idle baseline should use the latest canonical rental end/return time.

The 14-day idle rule remains frozen.

## Return Odometer

When both release and return odometers exist:

`DrivenKm = ReturnOdometer - ReleaseOdometer`

Return odometer must not be lower than release odometer.

Do not fabricate mileage when either reading is unavailable.

## Fuel

Release/return fuel snapshots are operational values only.

Do not calculate fuel charges until `CQ-013` is confirmed.

## Late Return

Late status may be derived:

`ended_at > scheduled_return_at`

Do not calculate monetary late penalties until `CQ-011` is confirmed.

## Damage / Settlement

Return condition differences may be recorded, but do not automatically infer renter liability or monetary charges.

Do not invent damage/security-deposit/final settlement calculations.

## Maintenance Readiness

Previously frozen maintenance-readiness rules remain unchanged.

Ending a rental does not automatically prove the vehicle is maintenance-ready or generally Available.
