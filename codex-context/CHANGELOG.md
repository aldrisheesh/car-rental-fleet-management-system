# Changelog

## 2026-09-01 — Vehicle Utilization / Idle Detection Baseline

Prepared the Development Baseline for VS013.

### Frozen / Clarified

- Added `19-vehicle-utilization-and-idle-detection.md`.
- Frozen `Asia/Manila` calendar-day reporting semantics.
- Frozen Rental Days as distinct local calendar dates overlapped by canonical rental transactions.
- Reaffirmed that Confirmed reservations do not count as utilization.
- Frozen utilization formula using Rental Days / Eligible Operational Days.
- Frozen maintenance-history treatment for analytical eligibility.
- Required canonical prospective active/inactive state history instead of treating the current `is_active` value as historical truth.
- Frozen incomplete historical eligibility coverage as Unavailable rather than silently computing biased utilization.
- Frozen 30-day default dashboard interval.
- Frozen idle eligibility requiring current active state, canonical maintenance readiness, no active rental, and a trustworthy idle reference.
- Frozen latest canonical rental `ended_at` as the idle reference for previously rented vehicles.
- Prohibited using vehicle record `created_at` as an invented operational-availability baseline for never-rented vehicles.
- Added `CQ-023` for Briah's historical operational-availability/inactive-state data.
- Reaffirmed the fixed 14-day idle threshold.
- Reaffirmed that utilization/idle indicators never automatically transfer vehicles.

---

## 2026-09-01 — Maintenance Monitoring / Readiness Foundation

Frozen canonical maintenance records and reusable deterministic maintenance readiness.

---

## 2026-09-01 — Rental Return / Release Foundations

Frozen canonical physical rental start/end intervals needed by fleet analytics.
