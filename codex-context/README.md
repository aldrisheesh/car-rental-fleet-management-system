# Briah's Car Rental — Codex Context

**Status:** Development Baseline active
**Last updated:** 2026-09-02

Completed through:
- VS019 event-driven in-app notifications;
- VS020 scheduled booking/rental reminders.

## Next direction

VS021 is the Canonical Audit Trail.

Read:
- `29-canonical-audit-trail.md`
- `08-notifications-and-audit.md`
- `25-canonical-subsystem-map.md`

VS021 baseline:
- append-only semantic audit events;
- first-wave core booking lifecycle mutations;
- minimal safe metadata;
- Owner/Admin read-only Audit Trail;
- atomic audit + business mutation where approved;
- no generic database-wide auditing.

VS021 excludes:
- notification/reminder audit;
- forecasting/supply/allocation audit;
- context APIs;
- settlement;
- audit analytics/export.

## Maintenance note

VS012 backend is canonical, but Admin Maintenance UI still contains prototype/mock data. Canonicalize that UI later before treating maintenance awareness as finished product functionality.

## AI workflow

Implementation:
fresh Sol Medium session -> commit/push -> end.

Correction:
new fresh Sol Medium session -> exact failing files only.
