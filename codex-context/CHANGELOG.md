# Changelog

## 2026-09-01 — Maintenance Monitoring / Readiness Foundation

Prepared the Development Baseline for VS012.

### Frozen / Clarified

- Added `18-maintenance-monitoring-and-readiness.md`.
- Frozen a minimal canonical maintenance/service record.
- Frozen explicit `blocks_rental_use` semantics.
- Frozen preventive-maintenance due/overdue checks using recorded next-service odometer/date.
- Frozen maintenance readiness as derived rather than manually editable truth.
- Preserved `CQ-015` for Briah's final workflow/status terminology and return-to-service authority.
- Clarified that maintenance readiness becomes a reusable dependency for utilization, idle detection, recommendation, assignment, projected supply, and branch allocation.
- Clarified that VS012 must not implement utilization/idle analytics yet.

### Context Integrity Correction

- Restored previously frozen qualifying weekly demand, utilization, idle detection, maintenance readiness, reference fuel-efficiency, estimated-fuel-consumption, and projected-supply rules in `04-data-and-business-rules.md`.
- Earlier rental-return context updates had unintentionally shortened that file and omitted several still-authoritative frozen rules.
- No business rule was intentionally changed by the restoration.

---

## 2026-09-01 — Rental Return and Closure Foundation

Frozen physical vehicle return and canonical rental end timestamp.

---

## 2026-09-01 — Vehicle Release and Rental Start Foundation

Frozen canonical rental start and turnover snapshot.

---

## 2026-09-01 — Vehicle Assignment and Booking Confirmation

Frozen Owner/Admin vehicle assignment and explicit booking confirmation.
