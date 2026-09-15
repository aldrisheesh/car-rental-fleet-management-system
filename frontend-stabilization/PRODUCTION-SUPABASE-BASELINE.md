# Production Supabase Baseline

Date: 2026-09-15

Starting repository HEAD: `782c76869fb521a198ec765c4983363e8f991ec4`

## Environment decision

The capstone uses one hosted Supabase environment for production and defense. The newly connected project is the only active target for this baseline. No defense accounts, transactional data, fixtures, deployment, merge, or main-branch push were performed.

The repository's migrations remain authoritative. `supabase/config.toml` uses imperative migrations, has no local seed file present, and has `auto_expose_new_tables = false`; no seed or QA fixture workflow was run.

Pre-flight found no tracked modifications, but the working tree contained pre-existing untracked Agent Skills installation artifacts under `.agents/` and `skills-lock.json`. They were preserved and excluded from the evidence commit. `.env.local` is ignored.

## MCP connection

The official Supabase MCP was reachable and provided project identity, migration, SQL inspection, and Auth inspection capabilities. Database writes were limited to applying the exact repository migrations through the MCP migration workflow. All verification queries after migration were read-only.

Storage-specific MCP capability was not exposed in this session; Storage verification is recorded as deferred below.

## New project identity

- Project ref: `vkfacfjkwomhfvrieaza`
- Project name: unavailable through the exposed safe MCP metadata
- Region: unavailable through the exposed safe MCP metadata
- Status: reachable through the Supabase MCP; platform health status was not exposed
- MCP identity: PASS
- Old project targeted: NO

The MCP project URL resolved to the new project ref. It did not resolve to the retired project.

## Local environment configuration

The ignored `.env.local` was updated without printing values:

| Variable | Classification | Result |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser/public | present; new project URL |
| `VITE_SUPABASE_ANON_KEY` | browser/public | present; existing application variable retained |
| `SUPABASE_URL` | server/database client | present; new project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only privileged | missing; requires manual configuration |

The application source consumes the four variables above. No application environment-variable names were renamed. `APP_BASE_URL`, `BREVO_*`, `GEOAPIFY_API_KEY`, `LOCATIONIQ_API_KEY`, `TOMTOM_API_KEY`, and `VERCEL_OIDC_TOKEN` were preserved as unrelated application/provider or deployment configuration. `E2E_*`, `QA_FIXTURE_*`, and `SUPABASE_DB_PASSWORD` remain historical QA/script configuration and were not used for the active application baseline.

The missing service-role variable was not invented or populated from an unsafe source. It is required by the server-side Supabase client, so server-backed application smoke cannot pass until the new-project value is supplied manually.

## Retired old-project references

`OLD PROJECT REFERENCE DETECTED` in historical QA reset documentation only. The active `.env.local` contains no old-project reference, and the connected MCP target is not the old project. The historical QA tooling and documentation were left intact and were not executed.

## Migration inventory

- Local repository migrations: 52
- Remote application migrations before application: 0
- Remote application migrations after application: 52
- Exact local/remote migration set match: yes
- Canonical timestamp order match: yes
- Missing expected migrations: none
- Unexpected application migrations: none

The repository migration directory was intact. The first migration is `20260830000000_initial_foundation.sql`; the last is `20260910010000_maintenance_service_access.sql`.

## Migration application

All 52 files were applied individually through the Supabase MCP in canonical order, preserving file contents and order. No migrations were combined, rewritten, skipped, retried after failure, or represented by manually inserted history rows.

`20260910010000_maintenance_service_access.sql` is present remotely and applied. No migration failed.

## Schema verification

Read-only MCP inspection verified:

- 33 public application tables
- 234 constraints: 33 primary keys, 22 unique constraints, 69 foreign keys, and 110 check constraints
- 83 indexes, including 58 unique indexes and 33 primary-key indexes
- 44 public function entries representing 43 distinct function names, including one overloaded function
- 30 public triggers
- All expected application tables, relationships, indexes, functions, triggers, status checks, and canonical configuration/reference structures are present

One initial read-only grants aggregation query used an incorrect catalog column and was corrected and rerun. It produced no database change.

## RLS / authorization baseline

RLS is enabled on all 33 public application tables; no expected application table was found with RLS disabled. The catalog contains 35 table-policy rows across the canonical tables.

The effective privilege inspection reported the expected role separation for this migration state: `authenticated` has read access to 27 application tables, `service_role` has read access to all 33, and ordinary `anon` table SELECT was not granted by the inspected catalog result. Routine execution grants were present for the migration-defined service operations. No authorization policy was changed during this session.

## Canonical branches

Two migration-established branches are present:

- Taft, Manila
- Antipolo, Rizal

## Vehicle categories

Six migration-established active categories are present:

- Economy
- MPV
- Pickup
- Sedan
- SUV
- Van

## Canonical fleet

Twelve migration-established active `DEV-*` vehicles are present. The catalog contains one vehicle for each canonical fleet entry: Ford Everest, Ford Ranger, Honda City, Mitsubishi Mirage, Nissan Urvan, Toyota Avanza, Toyota Hiace, Toyota Hilux, Toyota Innova, Toyota Rush, Toyota Vios, and Toyota Wigo.

Twelve initial vehicle operational-state events are present, all representing the migration-established active baseline. No additional operational history was added.

## Payment/reference data

One active migration-established demo payment method is present: `demo-bank-transfer`. No payment proof or payment transaction rows are present.

## Decision Support baseline

The fresh baseline contains one migration-established forecast demand coverage configuration row. Runtime Decision Support rows are empty:

- Forecast runs: 0
- Forecasts: 0
- Forecast inputs: 0
- Supply evaluations: 0
- Supply evaluation vehicles: 0
- Allocation recommendation batches: 0
- Allocation recommendations: 0
- Allocation recommendation candidates: 0
- Finder baseline rows: 0

No Decision Support output was generated.

## Auth baseline

Application Auth users: 0. No accounts were created.

## Storage baseline

The repository migrations define the intended `renter-requirements` and `payment-proofs` buckets. Storage-specific MCP capability was not available, so bucket/object verification was not performed.

`STORAGE VERIFICATION DEFERRED`

## Runtime cleanliness

The new project contains no legacy QA or defense runtime residue in the inspected application data. The following runtime tables were empty: profiles, booking requests, payments, rental transactions, maintenance records, notifications, audit events, email deliveries, and renter requirement sets.

Marker scans found zero rows containing the QA markers `QA-CUST`, `QA-OPERATOR`, `QA-BOOK`, `QA-REQ`, `QA-PAY`, `QA-RENT`, `QA-MAINT`, `QA-HIST`, or `VS003`. No old controlled-E2E transactions, QA notifications/audit history, or QA Decision Support outputs were present.

Intentional transactional baseline:

- Defense bookings: 0
- Defense requirements: 0
- Defense payments: 0
- Defense rentals: 0

Canonical migration reference rows, including branches, categories, vehicles, the demo payment method, and initial vehicle-state events, are not treated as runtime residue.

## Application smoke

The application development server started successfully. Anonymous page routes returned HTTP 200 for `/`, `/vehicles`, `/booking`, and `/customer`.

Server-backed smoke was incomplete because `SUPABASE_SERVICE_ROLE_KEY` is missing:

- `/api/health`: HTTP 503, `database: not_configured`
- `/api/vehicles`: HTTP 500 due to the missing server credential
- `/api/booking-master-data`: HTTP 500 due to the missing server credential
- `/api/vehicle-finder`: HTTP 503 with the controlled unavailable response

No registration, authentication, booking, requirement, payment, rental, or other mutating request was sent. Vehicle catalog/Finder data could not be loaded through the application until the required server credential is manually configured.

## Tests / build

- `src/lib` test suite: 274 passed, 0 failed
- `npm run test:supabase`: 2 passed, 0 failed
- Production build: passed
- Scoped ESLint (`npx eslint src`): failed on pre-existing repository violations (1,251 errors and 6 warnings)
- Scoped Prettier check: failed; 67 files reported as not formatted
- `git diff --check`: passed

No source or migration changes were made to address the existing lint/format findings.

## Secret safety

- `.env.local` remains ignored by `.gitignore` and is not committed
- No API key, password, database URL, token, or service-role value is included in this document or the evidence commit
- The missing `SUPABASE_SERVICE_ROLE_KEY` was not fabricated
- No old-project credential was added to tracked files
- Only this documentation record is authorized for the evidence commit

## Defense dataset readiness

The canonical database baseline is established and clean, but application server connectivity is not complete because `SUPABASE_SERVICE_ROLE_KEY` still requires manual configuration for the new project. No defense dataset may be created in this session.

**NOT READY — FIXES REQUIRED**
