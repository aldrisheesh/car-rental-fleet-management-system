# Canonical Subsystem Map

**Status:** Active AI navigation aid
**Last updated:** 2026-09-02

## VS024 starting points

Read:
- codex-context/34-admin-context-aware-decision-support.md
- codex-context/35-manuscript-traceability-vs024.md

Inspect only:
1. `src/routes/admin.bookings.tsx` assignment section;
2. canonical booking API/read fields necessary to resolve destination/pickup branch/candidate;
3. `src/routes/admin.decisions.tsx` allocation recommendation section;
4. `/api/allocation-recommendations` view shape;
5. VS022 `getTrustedTripContext`;
6. VS023 `interpretOperationalContext`;
7. smallest Owner/Admin server route for context.

Do not inspect/modify:
- Finder;
- allocation generation/scoring library;
- forecasting/supply algorithms;
- notification/reminder;
- audit;
- maintenance;
- payment/requirements except compile-only booking fields.

## Important UI reality

`admin.decisions.tsx` still contains prototype/mock analytical UI and an obsolete hard-coded Admin vehicle-recommendation card.

VS024 may replace only the obsolete Admin recommendation card/context area.

Do not canonicalize the entire Decision Support page in this slice.

## Security

New operational-context endpoint: Owner/Admin only.

Resolve canonical branch/destination/vehicle inputs server-side.
