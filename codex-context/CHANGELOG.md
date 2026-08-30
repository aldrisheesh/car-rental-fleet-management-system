# Changelog

## 2026-08-31 — Baseline Requirement Submission and Secure Storage

Updated the Development Baseline before VS006.

### Frozen / Clarified

- Frozen baseline self-drive renter requirements to:
  - `Valid Government ID`
  - `Driver's License`
- Clarified that an LTO portal screenshot is not a baseline customer-upload requirement.
- Preserved LTO portal checking as an external Owner/Admin verification aid.
- Frozen renter-document file formats to JPEG/JPG, PNG, and PDF.
- Frozen maximum renter-document size to 10 MiB per file.
- Frozen one-current-file-per-baseline-requirement-type behavior.
- Frozen replacement as versioned/superseding upload rather than in-place overwrite.
- Frozen private Supabase Storage requirement and protected access rules.
- Frozen Customer own-document isolation and Owner/Admin document access.
- Reaffirmed that Operations Staff cannot access raw government-ID or driver's-license files.
- Frozen booking-level requirement-set submission gate:
  - `Not Submitted` → `Pending Review` after both baseline required documents are present and submitted.
- Clarified that upload never equals verification.
- Deferred long-term retention/deletion duration; automatic time-based deletion is prohibited until the policy is frozen.
- Added `11-requirements-and-secure-storage.md`.

### Open Decisions Reduced

Removed baseline file type, size/count, and ordinary pre-verification replacement behavior from the open-decision register.

Still open:

- alternate renter/driver requirement scenarios
- long-term sensitive-upload retention/deletion duration
- exceptional replacement/reopening after verification
- payment-proof upload constraints
- later lifecycle/status decisions
- exact Operations Staff editable reservation fields

---

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
- `04-data-and-business-rules.md` is partially frozen.
- `03-workflows-and-status-rules.md` preserves the known client workflow order.

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
