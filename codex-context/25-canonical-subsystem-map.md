# Canonical Subsystem Map
**Status:** Active AI navigation aid
**Last updated:** 2026-09-02

## VS020 starting points
Read `08-notifications-and-audit.md` and `28-scheduled-booking-rental-reminders.md`.

Inspect only:
1. VS019 canonical notification persistence/API/helper;
2. canonical booking state/timestamps needed for confirmed future pickup;
3. canonical rental state/timestamps needed for scheduled return/ended_at;
4. `src/lib/business-time.ts`;
5. smallest server-only boundary for a trusted reminder processor.

Do not inspect requirements, payments, Finder, forecasting, supply, allocation, maintenance, reports, or external context unless one exact dependency is required.

Keep reminder eligibility/provider-neutral processing separate from hosting scheduler invocation.

Use additive migrations only when notification type constraints/functions require them.

Provider-validation cleanup belongs in validation tooling/session cleanup or explicit development cleanup commands, never production migrations.

Corrections use a FRESH Codex session with exact failing files only.
