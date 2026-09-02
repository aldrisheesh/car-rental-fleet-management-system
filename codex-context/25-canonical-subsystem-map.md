# Canonical Subsystem Map
**Status:** Active AI navigation aid
**Last updated:** 2026-09-02

## VS027
Read `41-canonical-reports-analytics.md` and `42-manuscript-traceability-vs027.md`.

Inspect only: `src/routes/admin.reports.tsx`; `src/data/admin.ts` to identify prototype dependencies; vehicle-analytics endpoint/server helper; canonical bookings; rental transactions; maintenance records/readiness; branches/categories; and canonical payment data only to decide whether finance semantics are defensible.

Do not modify Dashboard except compile-only shared helpers, Finder, forecasting, allocation, maintenance lifecycle, notification generation, external context, or backup/recovery.

Rule: every displayed report value must be canonical and date-range-defined. Ambiguous financial metrics are omitted.
