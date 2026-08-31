# Data and Business Rules

**Status:** Development Baseline v1 — Partially Frozen  
**Last updated:** 2026-09-01

This document contains stable data/business rules. Items marked open must not be guessed.

## Sensitive Records

Sensitive customer requirement files and payment proofs remain protected according to their dedicated specifications.

## Rental Activity Source

Once the canonical rental transaction foundation exists, actual active-rental activity is represented by rental transactions rather than booking status alone.

For the baseline:

`ActiveRental = started_at IS NOT NULL AND ended_at IS NULL`

A `Confirmed` booking without a release/start record is not active rental activity.

Completed rental-day/utilization calculations must later use canonical rental start/end records once return/closure is implemented.

Do not count a merely Confirmed booking as rental days.

## Vehicle Utilization

`UtilizationPercent = (RentalDays / EligibleOperationalDays) * 100`

RentalDays must ultimately come from canonical active/completed rental intervals, not unfulfilled reservations.

Dashboard default reporting period remains 30 days.

## Idle Vehicle Detection

A vehicle is idle when it is active/rental-ready, not currently rented, not unavailable because of maintenance, otherwise eligible, and has no rental activity for at least 14 consecutive days.

The active-rental test should use canonical rental transactions when available.

The post-return idle baseline remains dependent on a completed rental end/return timestamp.

## Maintenance Readiness

Maintenance readiness remains the deterministic gate previously frozen:

- no active blocking maintenance;
- no due/overdue required preventive maintenance;
- no unsafe/unsuitable recorded condition;
- no unresolved blocking repair concern.

Do not fabricate maintenance readiness when canonical records are absent.

## Reference Fuel Efficiency

Reference fuel efficiency remains km/L and may come from manufacturer or Owner/Admin-provided reference information.

Fuel level recorded at vehicle turnover is a separate operational snapshot and must not be confused with reference fuel efficiency.

## Estimated Fuel Consumption

`EstimatedFuelLiters = TravelDistanceKm / ReferenceFuelEfficiencyKmPerLiter`

This remains advisory.

## Context / Forecasting / Allocation

Previously frozen qualifying-demand, forecasting, supply, recommendation, and context rules remain unchanged.

## Open Data-Level Decisions

Do not invent:

- full rental/return lifecycle enums;
- final fuel-return charge rules;
- exact release odometer/fuel capture policy;
- long-term sensitive-upload retention;
- final fuel-reference administration rules.
