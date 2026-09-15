# Production Supabase Baseline Verification

Date: 2026-09-15

Baseline evidence commit: `c501c0f4a503f011f85b94f11c9b376ce345a5c2`

## Repository and environment verification

- Branch: `stabilization/frontend-rebuild`
- Current HEAD before this verification document: `c501c0f4a503f011f85b94f11c9b376ce345a5c2`
- `origin/main`: unchanged at `faed190d9b78bb845e2c89e7160eda90106f741f`
- Tracked working tree changes: none
- `.env.local`: ignored and not tracked
- Non-blocking working-tree observation: pre-existing untracked Agent Skills artifacts remain under `.agents/` and `skills-lock.json`; they were preserved and are excluded from this commit

The active local environment now contains non-empty values for `SUPABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Values were not printed. No active Supabase environment value points to the retired project. Historical QA reset documents retain old-project references for archival context only.

## MCP project identity

- Connected project ref: `vkfacfjkwomhfvrieaza`
- Project name/region: unavailable through exposed safe MCP metadata
- MCP reachability: PASS
- MCP identity: PASS
- Old project targeted: NO

The connected MCP URL and migration ledger identify the new production project. No database mutation was performed during this verification.

## Application restart and smoke verification

The local application was restarted after the service-role variable was populated, so the server read the current ignored `.env.local` configuration.

| Check | Result |
| --- | --- |
| `/api/health` | HTTP 200; database `connected` |
| `/api/vehicles` | HTTP 200; 12 canonical vehicles returned |
| `/api/booking-master-data` | HTTP 200; 2 branches and 12 vehicles returned |
| `/api/vehicle-finder` | HTTP 200; valid non-mutating request returned 12 recommendations |

No Supabase-credential-related HTTP 500 or 503 occurred. No registration, authentication, booking, requirement, payment, rental, fixture, or other mutating request was sent.

## Canonical baseline reconfirmation

- Repository migrations: 52
- Remote application migrations: 52
- Migration set/order: exact match; `20260910010000_maintenance_service_access.sql` is applied
- Branches: 2
- Vehicle categories: 6
- Canonical `DEV-*` vehicles: 12
- Active demo payment methods: 1
- Initial vehicle operational-state events: 12
- Auth users: 0

The read-only MCP count query also confirmed zero profiles, bookings, renter requirement sets, payments, and rental transactions. Decision Support runtime tables remained empty; no output was generated.

## Runtime cleanliness

Read-only residue checks found:

- QA marker residue: 0
- `VS003` residue: 0
- Legacy QA/controlled-E2E transactions: none
- Defense bookings, requirements, payments, and rentals: 0

No users or defense data were created in this session.

## Tests and build

- `src/lib` test suite: 274 passed, 0 failed
- `npm run test:supabase`: 2 passed, 0 failed
- Production build: passed
- `git diff --check`: passed

No source files or migration files were modified.

## Remaining observations

Storage-specific MCP verification remains deferred from the baseline because that capability is not exposed in the connected MCP session. This does not affect the verified database/application readiness for creating the defense dataset. The pre-existing untracked Agent Skills artifacts are also outside the application and migration change set.

## Readiness result

The service-role blocker is resolved. The new production project is connected, the application server can reach Supabase, canonical reference data is available, and the database contains no QA or defense runtime residue.

**READY WITH NON-BLOCKING OBSERVATIONS**
