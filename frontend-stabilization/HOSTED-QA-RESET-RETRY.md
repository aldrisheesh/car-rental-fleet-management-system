# Hosted QA Reset Retry

## Lead authorization

- Classification: **HOSTED NON-PRODUCTION QA — DISPOSABLE QA / TEST DATA**.
- Authorized destructive target: Supabase project ref `cpkyxnxpzufigcmaptpg`.
- Authorized operation: Phase A hosted database reset only.
- Storage cleanup, Auth bootstrap, defense-data creation, fixture operations,
  deployment, merge, and production/staging changes were not authorized.
- Branch: `stabilization/frontend-rebuild`.
- Starting HEAD: `9eef710583e4ecb00e159f1c3c75a97b4b2a4c00`.
- `origin/main`: `faed190d9b78bb845e2c89e7160eda90106f741f` and unchanged.

## Secret handling

`SUPABASE_DB_PASSWORD` was present and non-empty for this retry. Its value was
never printed, logged, recorded, committed, or otherwise exposed. No
credential-bearing URL, token, service-role key, PII, private document content,
Storage path, or Auth identifier is included in this evidence.

## Project identity

The following safe project references all matched the authorized target before
the reset attempt:

| Identity | Ref |
| --- | --- |
| Linked Supabase project | `cpkyxnxpzufigcmaptpg` |
| Application `SUPABASE_URL` | `cpkyxnxpzufigcmaptpg` |
| Frontend `VITE_SUPABASE_URL` | `cpkyxnxpzufigcmaptpg` |
| QA database connection | `cpkyxnxpzufigcmaptpg` |

`QA_FIXTURE_TARGET=local` was treated as stale metadata and was not used as
environment identity evidence. Project identity: **PASS**.

## Direct connection verification

The mandatory read-only command was run with the hosted database password
available to the process:

```sh
npx --no-install supabase migration list --linked
```

Result: **PASS**, exit code 0. The command connected directly to the hosted
database and did not produce `LegacyDbResetCancelledError`.

## Migration inventory before reset

| Inventory | Result |
| --- | ---: |
| Local migrations | 52 |
| Remote migrations | 51 |
| Remote-only migrations | 0 |
| Missing remote migration | `20260910010000_maintenance_service_access.sql` |

The migration safety gate passed. No migration history repair, migration edit,
push, skip, or replay was performed before the reset attempt.

## Pre-reset inventory

All counts were captured read-only immediately before the reset attempt. No PII
was enumerated.

| Object | Count before reset |
| --- | ---: |
| Branches | 3 (2 canonical; 1 VS/test residue) |
| Vehicle categories | 6 |
| Vehicles | 12 canonical `DEV-*` vehicles |
| Auth users | 33 |
| Profiles | 33 |
| Booking requests | 111 |
| Renter requirement sets | 19 |
| Requirement documents | 26 |
| Requirement reviews | 11 |
| Active payment methods | 1 |
| Payments | 8 |
| Payment proofs | 8 |
| Rental transactions | 81 |
| Maintenance records | 8 |
| Notifications | 61 |
| Audit events | 51 |
| Email outbox rows | 9 |
| Booking finder context rows | 2 |
| Booking idempotency rows | 8 |
| Vehicle operational-state events | 24 |
| Forecast-demand coverage rows | 1 |
| Forecast runs / inputs / forecasts | 2 / 162 / 54 |
| Supply evaluations / vehicle snapshots | 3 / 1 |
| Allocation batches / recommendations / candidates | 5 / 0 / 0 |
| Storage buckets | 2 |
| Storage metadata objects | 34 |
| Storage API-visible objects | 34 (26 renter requirements; 8 payment proofs) |

## Reset execution

The final pre-reset gate passed for the exact branch, clean worktree, exact
authorized project ref, unchanged `origin/main`, and 52 local migrations.

The only destructive command attempted was:

```sh
npx --no-install supabase db reset --linked --no-seed
```

The command exited with status 1 during the CLI legacy/login-role
initialization path, before any visible project confirmation, schema reset, or
migration replay. The exact process error was:

```text
LegacyDbResetCancelledError: context canceled
```

The command was not retried. No `--local`, arbitrary database URL, manual
`DROP`, `TRUNCATE`, `psql` cleanup, Auth deletion, or Storage deletion was
used.

## Migration replay

**NOT ACHIEVED.** The reset failed before migration replay. The required 52/52
post-reset verification was not reached, and the missing service-access
migration was not resolved. No post-failure database query was run after the
failure rule took effect.

## Canonical baseline

**NOT ACHIEVED.** No fresh migration-established baseline was produced. The
pre-reset database contained the accumulated runtime dataset recorded above,
including the VS/test branch and Decision Support output rows. No canonical
row was created manually.

## Runtime residue

**YES — runtime QA/VS/E2E residue remains for Phase A purposes.** The reset
failed before the destructive reset/replay phase, so the pre-reset runtime
dataset was not retired by this retry. The old QA bookings, requirements,
payments, rentals, maintenance, notifications, audit events, email outbox,
Decision Support rows, and VS branch therefore remain within the failed Phase A
state. No residue was manually deleted.

## Auth result

The pre-reset safe Auth count was 33 users with 33 profiles. The clean-reset
zero-user/zero-profile state was not reached. No Auth user or profile was
created or deleted, and no post-failure Auth query was run.

## Storage result

Storage cleanup was **NOT PERFORMED**. Immediately before the failed reset,
there were 2 canonical private buckets, 34 Storage metadata objects, and 34
Storage API-visible objects. No bucket or object was deleted. Residual objects
remain a separate, explicitly unauthorized Phase B Storage API task.

## Application smoke

**NOT RUN.** The reset did not establish a verified fresh hosted schema, and no
accounts or transactions were created.

## Tests / build

Repository tests, build, scoped lint, scoped formatting, and application smoke
checks were not run because the hosted reset failed and the failure rule
required stopping. No fixture apply was run.

## Safety review

- The exact authorized project ref was verified before the attempt.
- The direct password connection test passed before the attempt.
- The only destructive command was the authorized linked reset command.
- The command failed before confirmation/reset replay and was not retried.
- No migration history repair, migration edit, migration skip, or manual schema
  recreation was performed.
- No runtime row, Auth user, profile, Storage bucket, or Storage object was
  manually deleted or created.
- `origin/main` was not mutated.
- Source files and migration files were not modified.
- This evidence contains no secrets, PII, credential URLs, private Storage
  paths, signed URLs, or Auth identifiers.

## Phase B prerequisites

Phase B is **REQUIRED but BLOCKED**. A future continuation must first resolve
the hosted CLI legacy/login-role cancellation and obtain a fresh explicit
authorization to repeat Phase A. A successful 52/52 migration replay and clean
canonical baseline must be verified before any Auth bootstrap, defense-data
creation, or Decision Support generation. Storage cleanup remains separately
authorized only in a later phase and must use the Storage API; it was not
performed here.

## Result

**HOSTED QA RESET FAILED**
