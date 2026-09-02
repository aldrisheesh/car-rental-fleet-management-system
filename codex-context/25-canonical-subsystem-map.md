# Canonical Subsystem Map

**Status:** Active AI navigation aid
**Last updated:** 2026-09-02

## VS026 starting points

Read:
- `codex-context/39-canonical-admin-dashboard.md`
- `codex-context/40-manuscript-traceability-vs026.md`

Inspect:
1. `src/routes/admin.index.tsx`;
2. `src/data/admin.ts` only to identify prototype dependencies to remove;
3. canonical booking APIs/services;
4. canonical rental APIs/services;
5. canonical vehicle/readiness APIs/services;
6. canonical maintenance/readiness API from VS025;
7. canonical notifications/audit/payment services only if used by the final dashboard;
8. existing vehicle analytics service only if a current-snapshot metric can reuse it.

Do not modify:
- Reports page beyond compile-only shared helper changes;
- Finder;
- allocation;
- forecasting;
- external context;
- maintenance lifecycle;
- notification generation;
- backup/recovery.

## Dashboard rule

Current snapshot only.

No fabricated KPI, chart, delta, health indicator, alert, activity, booking, or revenue value.

Historical/deep analytics belong to VS027.
