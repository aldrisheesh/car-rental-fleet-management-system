# Changelog

## 2026-09-02 — VS025 Maintenance Admin UI planning

- Audited the current Admin Maintenance page and confirmed it remains prototype-backed.
- Confirmed canonical maintenance backend already supports create/complete/cancel, PMS targets, odometer values, blocking maintenance, cost, remarks, and readiness.
- Froze canonical maintenance statuses as Open / Completed / Cancelled.
- Defined due/overdue as derived presentation/readiness state, not persisted status.
- Required removal of `@/data/admin` maintenance/fleet data from the Maintenance page.
- Required removal of hard-coded downtime analytics unless canonically supportable.
- Preserved MIC-019 maintenance/low-availability notifications as a later slice.
- Deferred manuscript-only condition-before/after and service-provider fields unless verified in canonical schema.
