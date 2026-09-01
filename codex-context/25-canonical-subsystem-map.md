# Canonical Subsystem Map
**Status:** Active AI navigation aid
**Last updated:** 2026-09-02

Purpose: reduce Codex repository rediscovery.

## VS019 starting points
Read:
- `codex-context/08-notifications-and-audit.md`
- `codex-context/27-notification-foundation.md`

Locate only:
1. existing Notifications route/page;
2. canonical transition files for booking creation, requirement submit/resubmit, requirement review, payment proof submit/resubmit, payment review, and booking confirmation/rejection/cancellation where implemented;
3. auth helpers required for current-principal notification reads.

Known booking creation boundary:
- `src/routes/api.bookings.ts`

Do not inspect forecasting, supply, allocation, Finder, reports, context APIs, or maintenance unless a VS019 trigger directly requires them.

## Correction-session rule
Use a FRESH Codex session for corrections. Read only current slice, exact failing files, and exact relevant migration. Do not resume the large implementation session by default.

## Migration discipline
Inspect only the latest migration affecting an exact transition/function. Add new migrations; never rewrite applied migrations.
