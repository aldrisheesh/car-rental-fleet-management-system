# Data and Business Rules

**Status:** Development Baseline v1 — Partially Frozen  
**Last updated:** 2026-09-01

This document contains stable data/business rules. Items explicitly marked open must not be guessed.

## 1. Sensitive Records and Storage

Sensitive renter requirement files and payment proofs remain protected according to their dedicated specifications.

Operations Staff must not receive raw government-ID, driver's-license, or payment-proof access.

## 2. Payment

Baseline payment processing remains manual.

See `13-payment-submission-and-verification.md`.

## 3. Qualifying Weekly Demand

Demand forecasting uses **qualifying booking demand**, not rental duration or vehicle-usage days.

For branch `b`, vehicle category `c`, and calendar week `t`:

`D[b,c,t] = count of qualifying booking requests whose scheduled rental start date falls in week t`

A qualifying record must represent a valid booking that proceeded into the accepted/confirmed booking flow for the applicable branch/category/week.

Exclude records that are rejected, invalid, duplicates, or customer-cancelled before proceeding.

A completed calendar week with no qualifying bookings is a valid zero-demand observation when the underlying booking records for that week are complete.

Do not manufacture a zero observation merely because historical data are incomplete or unavailable.

## 4. Canonical Rental Activity

Active rental:

`started_at IS NOT NULL AND ended_at IS NULL`

Ended rental:

`started_at IS NOT NULL AND ended_at IS NOT NULL`

A Confirmed booking without a release record does not count as actual rental activity.

Reservations that never became active rentals do not count as rental days.

## 5. Vehicle Utilization

Vehicle utilization is analytical only.

`UtilizationPercent = (RentalDays / EligibleOperationalDays) * 100`

Where:

- `RentalDays` = calendar days within the selected reporting period during which the vehicle was in an active rental;
- `EligibleOperationalDays` = days in the reporting period during which the vehicle was operationally eligible for rental;
- days when the vehicle was inactive or unavailable because of maintenance are excluded from eligible operational days;
- reservations that never became active rentals do not count as rental days.

Dashboard default reporting period: **30 days**.

Reports may later support a user-selected reporting period.

Utilization does not independently trigger branch transfer.

## 6. Idle Vehicle Detection

A vehicle is considered idle when all of the following are true:

- vehicle is active and rental-ready;
- vehicle is not currently rented;
- vehicle is not unavailable because of maintenance;
- vehicle is not otherwise prevented from being offered for rental;
- it has recorded no rental activity for at least **14 consecutive days**.

`IdleVehicle = EligibleForRental AND IdleDays >= 14`

`IdleDays` is measured from the latest completed rental end/return timestamp.

For a vehicle that has never been rented, use the vehicle's recorded operational availability/start date only when that value exists and is valid.

Do not fabricate an idle baseline for never-rented vehicles when no trustworthy operational start date exists.

Idle status is an operational indicator and does not automatically transfer the vehicle.

## 7. Maintenance Readiness

Maintenance readiness is deterministic and derived.

A vehicle is not maintenance-ready when any applicable condition exists:

- active blocking maintenance;
- preventive maintenance due/overdue;
- recorded condition explicitly makes the vehicle unsafe/unsuitable;
- unresolved blocking repair concern.

Preventive maintenance is due/overdue when an applicable criterion is reached:

- canonical current odometer >= recorded next-service odometer; or
- current date >= recorded next-service date.

Use only criteria actually recorded.

Detailed implementation is authoritative in `18-maintenance-monitoring-and-readiness.md`.

## 8. Return Odometer / Driven Distance

When both release and return odometers exist:

`DrivenKm = ReturnOdometer - ReleaseOdometer`

Return odometer must not be lower than release odometer.

Do not fabricate mileage when either reading is unavailable.

## 9. Reference Fuel Efficiency

Reference fuel efficiency is expressed in km/L and may come from manufacturer specification or Owner/Admin-provided reference information.

It is reference data, not continuously measured actual fuel performance.

## 10. Estimated Fuel Consumption

When usable travel distance and positive reference fuel efficiency exist:

`EstimatedFuelLiters = TravelDistanceKm / ReferenceFuelEfficiencyKmPerLiter`

This is supporting information only.

Do not calculate fuel cost without an approved fuel-price methodology.

## 11. Projected Available Supply

For branch `b`, category `c`, and weekly forecast horizon `h`, projected available supply includes vehicles that are:

- assigned to the evaluated branch/category;
- active;
- maintenance-ready;
- free of conflicting booking/rental commitments during the evaluated weekly period.

Context does not independently create or subtract supply.

## 12. Late Return

Late status may be derived:

`ended_at > scheduled_return_at`

Do not calculate monetary late penalties until `CQ-011` is confirmed.

## 13. Return / Settlement

Return snapshots are operational records.

Do not automatically infer renter liability or monetary charges from return condition differences.

Do not invent damage, security-deposit, fuel, or final-settlement calculations.

## 14. Context Data Provenance

Manual/simulated context inputs must not be represented as live API-derived operational data.

Provider/source mode should be preserved where applicable.

## Open Data-Level Decisions

Do not invent:

- full rental/vehicle/maintenance lifecycle vocabulary beyond frozen minimal states;
- final fuel-return charge rules;
- long-term sensitive-upload retention;
- final fuel-reference source priority/update workflow;
- client-specific maintenance workflow details under `CQ-015`.
