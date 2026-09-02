# Canonical Subsystem Map

**Status:** Active AI navigation aid
**Last updated:** 2026-09-02

## VS025 starting points

Read:
- `codex-context/37-canonical-maintenance-admin-ui.md`
- `codex-context/38-manuscript-traceability-vs025.md`

Inspect only:
1. `src/routes/admin.maintenance.tsx`;
2. `src/components/admin/MaintenanceRecordDialog.tsx`;
3. `src/routes/api.maintenance.ts`;
4. `src/lib/maintenance-readiness.server.ts`;
5. shared pure maintenance readiness helper if required;
6. canonical vehicle list/read API already used by Admin UI;
7. exact maintenance schema/migrations/RPC definitions only if needed to verify field support.

Do not inspect/modify:
- Finder;
- booking lifecycle except compile-only vehicle API use;
- allocation;
- forecasting/supply;
- notification/reminder;
- external context providers;
- audit architecture;
- reports/dashboard.

## Canonical maintenance rule

Statuses:
- Open
- Completed
- Cancelled

Due/overdue:
derived readiness/presentation state.

Do not reintroduce prototype Scheduled/In Progress/Overdue persisted statuses.

## Prototype removal

`admin.maintenance.tsx` must no longer depend on `@/data/admin` maintenance/fleet arrays or hard-coded downtime data after VS025.
