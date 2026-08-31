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

A Confirmed booking without a release record does not count as rental activity.

Reservations that never became active rentals do not count as Rental Days.

## 5. Vehicle Utilization

Vehicle utilization is analytical only.

`UtilizationPercent = (RentalDays / EligibleOperationalDays) * 100`

Detailed calendar-day, coverage, active-state-history, and maintenance-interval rules are authoritative in:

`19-vehicle-utilization-and-idle-detection.md`

Dashboard default reporting period: most recent 30 `Asia/Manila` calendar days including the current date.

Do not assign unsupported qualitative labels to utilization.

Utilization does not independently trigger branch transfer.

## 6. Idle Vehicle Detection

A vehicle is idle only when:

- currently active;
- maintenance-ready;
- not currently rented;
- otherwise eligible for rental;
- it has a trustworthy idle reference;
- it has recorded no rental activity for at least 14 consecutive days.

For a previously rented vehicle, use the latest canonical rental `ended_at`.

For a never-rented vehicle, use a trustworthy recorded operational-availability baseline only when available.

Do not use `vehicles.created_at` as a substitute for operational availability.

If no trustworthy baseline exists, idle state is Unable to Determine rather than Idle.

Detailed rules are in `19-vehicle-utilization-and-idle-detection.md`.

Idle status is advisory and does not automatically transfer a vehicle.

## 7. Maintenance Readiness

Maintenance readiness is deterministic and derived.

A vehicle is not maintenance-ready when an applicable condition exists:

- active blocking maintenance;
- preventive maintenance due/overdue;
- recorded condition explicitly blocks rental use;
- unresolved blocking repair concern;
- required readiness input is unavailable in a way that prevents safe determination.

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
- client-specific maintenance workflow details under `CQ-015`;
- historical operational-availability dates for vehicles lacking authoritative records (`CQ-023`).
