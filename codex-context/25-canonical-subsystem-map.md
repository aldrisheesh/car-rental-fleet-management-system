# Canonical Subsystem Map

**Status:** Active AI navigation aid
**Last updated:** 2026-09-02

## VS021 Audit starting points

Read:
- `codex-context/29-canonical-audit-trail.md`
- `codex-context/08-notifications-and-audit.md`

Locate only the exact canonical mutation boundaries for:
1. booking creation;
2. requirement submit/resubmit;
3. requirement review;
4. payment submit/resubmit;
5. payment review;
6. vehicle assignment;
7. booking confirmation/rejection/cancellation where implemented;
8. rental release;
9. rental return;
10. maintenance create/update.

Known entry points include:
- `src/routes/api.bookings.ts`
- `src/routes/api.maintenance.ts`

Use search only to find the exact route/RPC file for a listed transition.

Do not inspect:
- notifications implementation except to ensure it is not audited;
- reminder processor except to ensure it is not audited;
- forecasting;
- supply;
- allocation;
- Finder;
- reports;
- external context.

## Audit architecture rule

Prefer semantic audit insertion inside trusted canonical business transactions/RPCs.

Do not build a generic database-wide audit trigger.

## Migration discipline

Extend existing RPCs only through NEW additive migrations.

Do not rewrite applied migrations.

Provider-validation cleanup belongs in validation tooling/session cleanup or explicit development cleanup commands, never production migrations.

## Correction sessions

Use a FRESH Codex session with:
- current slice;
- exact failing files;
- exact migration(s) involved.

Do not resume a large implementation session by default.
