# Changelog

## 2026-09-01 — Projected Supply / Demand Balance Baseline

Prepared the Development Baseline for VS015.

### Frozen / Clarified

- Added `21-projected-supply-and-demand-balance.md`.
- Bound projected supply to persisted VS014 forecast records.
- Frozen supply as current branch/category vehicles that are active, maintenance-eligible, and free of applicable booking/rental conflicts.
- Frozen half-open weekly commitment overlap.
- Frozen Confirmed assigned bookings as specific future vehicle commitments.
- Confirmed unassigned bookings do not block a specific vehicle.
- Frozen conservative active-rental behavior: a currently active rental is not assumed to return on schedule for future supply.
- Reaffirmed no invented turnaround buffer while `CQ-018` is unresolved.
- Frozen shortage/surplus formulas directly from required units and projected supply.
- Frozen immutable supply/balance evaluation snapshots and vehicle-level eligibility traceability.
- Frozen Owner/Admin evaluation authority and Operations Staff read-only access.
- Explicitly deferred source/destination pairing and transfer recommendation to the next allocation layer.
- Added `CQ-025` for any Briah-specific extra reserve/future-supply rule.

---

## 2026-09-01 — Weekly Demand Forecasting

VS014 established canonical qualifying demand, WMA, immutable forecast runs, APE/MAPE, and prospective coverage integrity.

---

## 2026-09-01 — Vehicle Utilization / Idle Detection

VS013 established canonical fleet utilization and idle analytics.
