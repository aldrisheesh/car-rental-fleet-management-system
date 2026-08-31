# Changelog

## 2026-09-01 — Demand Extraction / Forecasting Boundary

Prepared the Development Baseline for VS014.

### Frozen / Clarified

- Added `20-demand-extraction-and-forecasting-boundary.md`.
- Bound qualifying demand to canonical Confirmed bookings.
- Frozen Asia/Manila Monday-based calendar-week aggregation.
- Frozen demand attribution to requested pickup branch.
- Frozen category attribution to requested vehicle/category intent rather than substituted assigned vehicle.
- Prohibited current incomplete week from actual forecast inputs.
- Distinguished trustworthy zero-demand completed weeks from unavailable historical data.
- Reaffirmed three consecutive complete actual weekly observations before WMA.
- Reaffirmed fixed 0.50 / 0.30 / 0.20 WMA and recursive 3-week horizon.
- Reaffirmed immutable forecast run fidelity and detailed Actual/Forecast WMA inputs.
- Reaffirmed `ceil()` required units.
- Reaffirmed APE and horizon-1-only primary MAPE behavior.
- Added `CQ-024` for Briah historical booking-demand data availability.
- Explicitly prohibited fake historical bookings/zero weeks merely to make forecasting produce output.

---

## 2026-09-01 — Vehicle Utilization / Idle Detection Baseline

Frozen canonical utilization and idle detection.

---

## 2026-09-01 — Maintenance Monitoring / Readiness Foundation

Frozen canonical maintenance records and reusable maintenance readiness.
