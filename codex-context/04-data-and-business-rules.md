# Data and Business Rules

**Status:** Development Baseline v1 — Partially Frozen  
**Last updated:** 2026-08-31

This document contains business/data rules that are already stable enough for implementation. Items explicitly marked open must not be guessed.

## 1. Sensitive Records and Storage

Sensitive records include at minimum:

- customer government-ID files
- driver's-license files
- proof-of-payment files
- payment-verification information

These require restricted access.

Owner/Admin may access protected renter documents as needed for manual verification.

Operations Staff must not receive raw access to:

- customer government-ID files
- driver's-license files
- payment-proof files

Customer/Renter may access only their own protected submissions associated with their own booking records.

Baseline renter-document upload constraints and secure-storage rules are frozen in:

`11-requirements-and-secure-storage.md`

The long-term retention/deletion duration for sensitive uploads remains open. Until that policy is frozen, the implementation must not perform automatic time-based deletion.

## 2. Payment

Payment processing in the current scope is manual.

The system may store:

- payment reference
- proof-of-payment upload
- payment status
- verification metadata/remarks as later finalized

Owner/Admin verifies the submitted proof/reference against the business's external bank/e-wallet records.

Do not integrate an automated payment gateway unless the specification is formally revised.

## 3. Qualifying Weekly Demand

Demand forecasting uses **qualifying booking demand**, not rental duration or vehicle-usage days.

For branch `b`, vehicle category `c`, and calendar week `t`:

`D[b,c,t] = count of qualifying booking requests whose scheduled rental start date falls in week t`

A qualifying record must represent a valid booking that proceeded into the accepted/confirmed booking flow for the applicable branch/category/week.

Exclude records that are rejected, invalid, duplicates, or customer-cancelled before proceeding.

A completed calendar week with no qualifying bookings is a valid zero-demand observation when the underlying booking records for that week are complete.

Do not manufacture a zero observation merely because historical data are incomplete or unavailable.

## 4. Vehicle Utilization

Vehicle utilization is analytical only.

`UtilizationPercent = (RentalDays / EligibleOperationalDays) * 100`

Where:

- `RentalDays` = calendar days within the selected reporting period during which the vehicle was in an active rental
- `EligibleOperationalDays` = days in the reporting period during which the vehicle was operationally eligible for rental
- days when the vehicle was inactive or unavailable because of maintenance are excluded from eligible operational days
- reservations that never became active rentals do not count as rental days

Dashboard default reporting period: **30 days**.

Reports may support a user-selected reporting period.

Utilization does not independently trigger branch transfer.

## 5. Idle Vehicle Detection

A vehicle is considered idle when all of the following are true:

- vehicle is active and rental-ready
- vehicle is not currently rented
- vehicle is not unavailable because of maintenance
- vehicle is not otherwise prevented from being offered for rental
- it has recorded no rental activity for at least **14 consecutive days**

`IdleVehicle = EligibleForRental AND IdleDays >= 14`

`IdleDays` is measured from the last completed rental end/return date.

For a vehicle that has never been rented, use the vehicle's recorded operational availability/start date as the baseline when that value is available and valid.

Idle status is an operational indicator. It does not automatically transfer the vehicle.

## 6. Maintenance Readiness

Maintenance readiness is a deterministic gate used by customer recommendation, assignment review, projected supply, and branch-transfer candidate selection.

A vehicle is **not maintenance-ready** when any of the following applies:

- an active maintenance activity is in progress
- required preventive maintenance is due or overdue
- the recorded vehicle condition indicates that it is unsafe or unsuitable for rental
- an unresolved maintenance/repair concern blocks operational use

Preventive maintenance is due/overdue when an applicable recorded service criterion has been reached, including:

- current odometer is greater than or equal to the recorded next-service odometer; or
- current date is greater than or equal to the recorded next-service date

Use whichever applicable maintenance criteria are recorded for that vehicle/service rule.

Maintenance readiness may be derived from current records; it does not need to be treated as an independently editable truth value.

## 7. Reference Fuel Efficiency

Reference fuel efficiency is expressed in km/L and may come from:

- manufacturer specification; or
- Owner/Admin-provided vehicle reference information

It is reference data, not continuously measured actual fuel performance.

Exact source priority when multiple values exist, source-note requirements, and the authorized update workflow remain open.

## 8. Estimated Fuel Consumption

When a usable travel distance and valid positive reference fuel-efficiency value exist:

`EstimatedFuelLiters = TravelDistanceKm / ReferenceFuelEfficiencyKmPerLiter`

The result is supporting information only.

Do not calculate fuel cost unless a separate approved fuel-price/source methodology is added later.

## 9. Projected Available Supply

For an evaluated branch `b`, vehicle category `c`, and weekly forecast horizon `h`, projected available supply includes vehicles that are:

- assigned to the evaluated branch/category
- active
- maintenance-ready
- free of conflicting booking/rental commitments during the evaluated weekly period

Context does not create or subtract supply by itself. Context is evaluated later as advisory operational information.

## 10. Data Provenance for Context

Trip/context records should preserve the source mode and provider used where applicable.

Current manuscript fields include general source mode plus provider fields for:

- weather provider
- routing provider
- road-context provider

Manual and simulated inputs must not be represented as live API-derived operational data.

## Open Data-Level Decisions

The following remain open and must not be invented:

- alternate renter/driver requirement matrix beyond the baseline self-drive renter
- long-term sensitive-upload retention/deletion duration
- exact reference-fuel source priority and source-note requirements
- exact lifecycle status enums/transitions still marked open in `03-workflows-and-status-rules.md`
