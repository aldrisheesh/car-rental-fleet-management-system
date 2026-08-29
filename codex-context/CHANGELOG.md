# Changelog

## 2026-08-29 — Development Baseline v1

Updated the latest uploaded context package after manuscript alignment and API/provider verification.

### Frozen / Clarified

- Defined qualifying weekly booking demand by branch and vehicle category.
- Frozen vehicle-utilization calculation and 30-day dashboard default.
- Frozen 14-day idle-vehicle definition.
- Frozen deterministic maintenance-readiness exclusions and PMS due/overdue logic.
- Frozen reference fuel-efficiency semantics and estimated-fuel formula.
- Frozen three-period WMA using weights `0.50`, `0.30`, and `0.20`.
- Frozen rolling Week +1 / Week +2 / Week +3 recursive forecasting formulas.
- Frozen minimum three-complete-actual-week requirement.
- Added forecast-run/history guidance so multiple forecasts for the same target week are not overwritten.
- Clarified per-record APE versus aggregate MAPE.
- Frozen primary MAPE evaluation to historical one-week-ahead forecasts with zero-actual periods excluded from the divisor.
- Frozen customer recommendation hard filters and deterministic ranking without arbitrary percentage scores.
- Frozen branch requirement/supply/shortage/surplus/transfer formulas.
- Frozen longest-idle eligible-candidate priority for branch allocation.
- Clarified preservation of original recommended transfer quantity versus Owner/Admin-approved quantity.
- Frozen primary/fallback API providers:
  - Open-Meteo -> OpenWeather One Call API 3.0 for weather
  - TomTom Orbis -> HERE for geocoding/routing
  - TomTom Traffic Incidents -> HERE Traffic API v7 for road incidents
- Removed `traffic_condition` as a separate finalized business classification.
- Frozen API fallback triggers, manual/unavailable behavior, and prohibition against fallback-shopping after a valid adverse primary result.
- Frozen study-defined normalization semantics for weather, road condition, route feasibility, route accessibility, and context presentation states.
- Clarified that external weather may not cover the full three-week WMA horizon and must not be fabricated/extrapolated.

### Updated Source-of-Truth Status

- `05-forecasting-specification.md` is now frozen for Development Baseline v1.
- `06-recommendation-specification.md` is frozen except for item-level transfer approval persistence.
- `07-external-context-and-api-rules.md` has frozen provider/classification behavior; refresh/caching policies remain open.
- `04-data-and-business-rules.md` is partially frozen with remaining upload/reference-data details explicitly open.
- `03-workflows-and-status-rules.md` preserves the known client workflow order, but exact state machines remain open.

### Open Decisions Reduced

Removed resolved forecasting, recommendation, and provider-selection questions from `10-open-decisions.md`.

Remaining development-critical open areas are primarily:

- exact booking/requirement/payment/rental/vehicle/maintenance state transitions
- exact Operations Staff editable booking fields
- protected-upload constraints/retention
- item-level approved transfer-candidate persistence
- API refresh/caching policies
- notification/audit rules

### Development Readiness

Backend/platform foundation work may begin. Final transactional mutation flows must not invent unresolved state transitions.

---

## 2026-08-24 — Initial Context Package

Created the initial Codex context package.

### Added

- System ground truth and scope boundaries
- Baseline roles and permissions derived from defended Chapter 3 use cases
- Implementation constraints for future Codex work
- Placeholder specifications for workflows, data/business rules, WMA/MAPE, recommendations, APIs/context, notifications, and audit
- Central open-decisions register

### Important Role Decision

The system uses three defended actors:

- Owner/Admin
- Operations Staff
- Customer/Renter

Operations Staff is intentionally restricted primarily to reservation coordination. The defended use case explicitly prohibits Staff access to payment-related reservation information.

### Pending

Workflow/status rules and the remaining open decisions had not yet been frozen.
