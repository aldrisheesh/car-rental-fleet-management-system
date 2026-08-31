# Maintenance Monitoring and Readiness Specification

**Status:** Frozen for Baseline Maintenance Monitoring / Readiness Foundation  
**Last updated:** 2026-09-01

This document defines the minimum authoritative maintenance records and deterministic maintenance-readiness behavior required before utilization, idle detection, vehicle recommendation, assignment review, projected supply, and branch-allocation features can reliably consume fleet eligibility data.

Client-specific maintenance workflow details remain tracked under `CQ-015`.

## 1. Purpose

The manuscript requires maintenance monitoring to record and use:

- maintenance status;
- preventive maintenance schedule;
- mileage/odometer reading;
- vehicle condition;
- maintenance history;
- repair history;
- maintenance cost;
- remarks;
- related updates that may affect vehicle availability and recommendation.

The baseline must provide canonical maintenance information without inventing Briah's final maintenance lifecycle vocabulary.

## 2. Authority

### Owner/Admin

May:

- create maintenance records;
- update maintenance records;
- record preventive-maintenance targets;
- record repair/service history;
- record maintenance cost and remarks;
- mark maintenance work as completed where appropriate;
- review derived maintenance readiness.

### Operations Staff

Until `CQ-015` and `CQ-016` are confirmed, do not grant broad maintenance mutation authority.

Safe maintenance/readiness viewing may be permitted for coordination where consistent with the existing role specification.

### Customer/Renter

May not create, update, or view internal maintenance records.

Customer-facing vehicle eligibility/recommendation may consume a safe derived readiness result, but raw maintenance records remain internal.

## 3. Canonical Maintenance Record

Create a canonical maintenance/service record linked to one vehicle.

At minimum support:

- canonical maintenance record ID;
- vehicle ID;
- maintenance/service type or concise category;
- service/repair description;
- maintenance state needed by the baseline;
- service start date/time;
- completion date/time nullable;
- odometer at service nullable;
- next-service odometer nullable;
- next-service date nullable;
- cost nullable;
- remarks nullable;
- created by;
- updated by where useful;
- created at;
- updated at.

Do not create a large speculative repair-shop workflow.

## 4. Minimal Baseline Maintenance State

The exact Briah maintenance lifecycle remains open.

For the baseline, persist only the minimum state required to determine whether work is currently blocking vehicle use.

Use a small implementation state such as:

- `Open`
- `Completed`
- `Cancelled`

Meaning:

`Open`
: Maintenance/repair concern or service activity remains unresolved/in progress and blocks rental use when the record is marked blocking.

`Completed`
: The maintenance/service record has been resolved/completed.

`Cancelled`
: The maintenance record was cancelled/voided and no longer represents active work.

This state list is an implementation foundation, not a claim that these are Briah's final preferred operational labels.

## 5. Blocking Maintenance

Each maintenance record must explicitly distinguish whether it blocks rental use.

Use a canonical boolean such as:

`blocks_rental_use`

Do not infer every maintenance note automatically blocks the vehicle.

An active blocking maintenance condition exists when:

- maintenance record state = `Open`; and
- `blocks_rental_use = true`.

## 6. Preventive Maintenance Targets

A vehicle/service record may define:

- `next_service_odometer`;
- `next_service_date`.

A preventive-maintenance target is due/overdue when an applicable recorded criterion has been reached:

- current canonical vehicle odometer >= next-service odometer; or
- current date >= next-service date.

Use whichever criteria are actually present.

Do not invent missing service intervals.

## 7. Canonical Vehicle Odometer

Maintenance logic may consume the vehicle's canonical odometer/mileage value when one exists.

If the repository does not yet have a safe canonical vehicle odometer field, add the smallest appropriate field and update it only through authoritative operational records such as:

- maintenance service reading;
- rental release/return reading where already approved.

Never reduce canonical odometer.

Do not fabricate readings.

## 8. Vehicle Condition

The exact Briah condition vocabulary remains subject to client validation.

For deterministic readiness, the system must at least be able to identify whether the currently recorded condition blocks rental use.

Prefer a separate explicit boolean/flag or a small safe condition classification rather than inferring safety from free-text remarks.

Do not automatically classify a vehicle as unsafe from arbitrary note text.

## 9. Derived Maintenance Readiness

Maintenance readiness is **derived**, not freely editable.

A vehicle is `Maintenance Ready` only when all applicable checks are satisfied:

1. vehicle is active;
2. no open blocking maintenance record exists;
3. no applicable preventive-maintenance target is due/overdue;
4. no current recorded vehicle condition explicitly blocks rental use;
5. no unresolved blocking repair concern exists.

Otherwise:

`Not Maintenance Ready`

When required source data are unavailable, do not fabricate `Ready`.

Where practical return a reason list such as:

- Active blocking maintenance
- Preventive maintenance due
- Preventive maintenance overdue
- Vehicle condition blocks rental use
- Unresolved blocking repair concern
- Readiness data unavailable

## 10. Readiness Does Not Mutate Booking/Rental State

Maintenance readiness is an operational eligibility gate.

Changing maintenance records must not automatically:

- cancel bookings;
- reject bookings;
- transfer vehicles;
- end active rentals;
- confirm bookings.

Later workflows may surface conflicts for human action.

## 11. Active Rental Boundary

Do not open blocking maintenance on an actively rented vehicle as a way to silently end the rental.

If Owner/Admin records a maintenance concern while a vehicle has an active rental, preserve the active rental and clearly surface the operational conflict.

Do not invent roadside-repair/emergency-return behavior.

## 12. Maintenance History

Completed/cancelled records must remain historical records.

Do not overwrite prior service history when a new maintenance event occurs.

The vehicle should be able to display chronological maintenance/service history.

## 13. Maintenance Cost

Maintenance cost is optional.

When supplied:

- currency = PHP;
- numeric;
- non-negative.

Maintenance cost is an operational record only.

Do not use it in customer pricing or settlement.

## 14. Owner/Admin UI

Provide the minimum internal maintenance module necessary to:

- select/view a vehicle;
- create a maintenance/service record;
- mark whether it blocks rental use;
- record service/repair description;
- record service dates;
- record odometer;
- record next-service date/odometer where applicable;
- record cost/remarks;
- complete/cancel an existing maintenance record;
- view maintenance history;
- view derived maintenance readiness and reasons.

Preserve the existing visual style.

## 15. Fleet Integration

Expose a trusted server-side derived readiness function/read model that later slices can reuse.

Do not copy slightly different maintenance-readiness logic into:

- utilization;
- idle detection;
- customer vehicle recommendation;
- assignment;
- forecasting/projected supply;
- branch allocation.

Use one canonical calculation boundary where practical.

## 16. Utilization / Idle Dependency

VS012 does not yet implement utilization or idle analytics.

It establishes the eligibility data those analytics need.

Later analytics must:

- exclude days when maintenance made the vehicle operationally ineligible from `EligibleOperationalDays`;
- not classify a vehicle as idle while it is unavailable due to maintenance;
- use canonical rental start/end intervals.

## 17. Assignment / Supply Dependency

Later assignment and branch-allocation code must use this canonical readiness result when evaluating maintenance eligibility.

Do not modify already-confirmed historical bookings merely because maintenance data later change.

## 18. Client Clarification Link

`CQ-015` remains open for Briah's exact maintenance workflow, including:

- who opens maintenance records;
- exact status labels;
- who closes them;
- whether inspection is required after repair/service;
- who authorizes return to service.

The baseline state and readiness logic are deliberately conservative and revisable.

## 19. Out of Scope

Do not implement:

- parts inventory;
- supplier/vendor management;
- mechanic accounts;
- work orders beyond the minimal maintenance record;
- automated maintenance scheduling from manufacturer APIs;
- maintenance notifications unless separately approved;
- automatic vehicle transfer;
- automatic booking cancellation;
- customer-visible raw maintenance history;
- utilization/idle dashboard in this slice.

## 20. Warning to Codex

Do not:

- treat free-text remarks as authoritative safety logic;
- automatically mark every maintenance record as blocking;
- fabricate missing odometer/service targets;
- freely edit a stored `maintenance_ready` boolean as truth;
- reduce canonical odometer;
- erase maintenance history;
- invent Briah's final status vocabulary;
- begin utilization/idle/forecast/allocation implementation in VS012.
