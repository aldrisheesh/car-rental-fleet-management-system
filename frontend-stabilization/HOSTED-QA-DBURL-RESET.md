# Hosted QA DB-URL Reset

## Authorization

- Authorized destructive target: hosted non-production QA Supabase project `cpkyxnxpzufigcmaptpg`.
- Authorized branch: `stabilization/frontend-rebuild`.
- Starting HEAD: `4124e9fba0fb3cbf76a8b79e3cf24f9783310a1f` (`docs: record hosted qa reset retry`).
- `origin/main` remained `faed190d9b78bb845e2c89e7160eda90106f741f`.
- The authorized operation was Phase A hosted database reset only. Storage cleanup, Auth bootstrap, defense-data creation, deployment, merge, and production/staging changes were not authorized.

## Reason for abandoning --linked

The prior authorized reset retry repeatedly failed through `supabase db reset --linked` during temporary/legacy login-role initialization with `LegacyDbResetCancelledError: context canceled`. The `--linked` path was therefore treated as unusable for this reset. No `--linked` command was used in this execution.

## Secret handling

- `QA_FIXTURE_DATABASE_URL`: PRESENT in the ignored local environment file; value never printed, logged, recorded, committed, or reproduced.
- `SUPABASE_DB_PASSWORD`: PRESENT; value never printed, logged, recorded, committed, or reproduced.
- No full database URL, token, service-role key, Auth identifier, PII, private Storage path, signed URL, or document content is included here.

## Database URL identity

The database URL was parsed without printing it. Identity verification **PASSED**:

- safe project-ref classification: authorized target `cpkyxnxpzufigcmaptpg`;
- hosted infrastructure: Supabase pooler;
- database: `postgres`;
- URL identity: exact authorized project match;
- production exclusion: PASS under the Lead’s explicit non-production QA authorization.

## Read-only db-url verification

The required direct read-only check was run:

```sh
npx --no-install supabase migration list --db-url "$QA_FIXTURE_DATABASE_URL"
```

Result: **PASS**, exit code 0. The command connected through `--db-url` and did not emit the prior login-role initialization failure.

## Migration inventory before

| Inventory | Result |
| --- | ---: |
| Local migrations | 52 |
| Remote migrations | 51 |
| Remote-only migrations | 0 |
| Missing remote migration | `20260910010000_maintenance_service_access.sql` |

The final pre-reset migration gate passed. No migration history repair, migration edit, push, skip, or replay was performed before the reset attempt.

## Pre-reset inventory

All counts were obtained read-only immediately before the reset attempt. No PII was enumerated.

| Object | Count before reset |
| --- | ---: |
| Branches | 3 (2 canonical; 1 VS/test residue) |
| Vehicle categories | 6 |
| Vehicles | 12 canonical active `DEV-*` vehicles |
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
| Storage API-visible objects | 34 |

## Reset command

The only destructive command attempted was:

```sh
npx --no-install supabase db reset --db-url "$QA_FIXTURE_DATABASE_URL" --no-seed
```

No `--linked` path, manual SQL cleanup, `DROP`, `TRUNCATE`, migration-history repair, fixture cleanup, or Storage cleanup was used.

## Reset execution

The command exited with status 1 before any visible remote-reset confirmation, schema reset, or migration replay.

The invocation wrapper reported this local environment-loading warning:

```text
.env.local:36: unmatched '
```

The Supabase CLI then reported:

```text
LegacyDbResetCancelledError: context canceled
```

Failure stage: reset invocation / CLI legacy initialization before confirmation and migration replay. This invocation did not print the `Initialising login role...` progress text, but the error is the same legacy/login-role cancellation class recorded by the previous failed retry. The reset was not retried, and no alternate connection method was attempted.

## Migration inventory after

**NOT RUN.** The reset failed before migration replay. The required post-reset 52/52 verification and maintenance-service-access verification were not reached.

## Canonical baseline

**NOT ACHIEVED.** The pre-reset database had 2 canonical branches plus 1 VS/test branch and accumulated runtime data. A fresh migration-established baseline was not produced. No canonical or runtime data was manually recreated.

## Runtime residue

**YES — not retired by a successful reset.** The pre-reset database contained the prior QA, VS/test, and controlled-E2E runtime state, including `QA-CUST`, `QA-OPERATOR`, `QA-BOOK`, `QA-REQ`, `QA-PAY`, `QA-RENT`, `QA-MAINT`, `QA-HIST`, `VS003 Temp`, old E2E transaction rows, notifications, audit events, email outbox rows, and Decision Support output rows. No post-failure database query was run because the failure rule required stopping.

## Auth result

The safe pre-reset Auth count was **33** users with 33 profiles. The clean post-reset state was not reached and no post-failure Auth query was run. No Auth user or profile was created or deleted.

## Storage result

Storage cleanup was **NOT PERFORMED**. The safe pre-reset result was:

- bucket count: 2;
- Storage metadata object count: 34;
- Storage API-visible object count: 34.

No bucket or object was deleted. Residual physical objects remain for a separately authorized Phase B Storage API operation.

## Application smoke

**NOT RUN.** The reset did not establish a verified fresh hosted schema. No accounts or transactional rows were created.

## Tests/build

**NOT RUN.** Relevant tests, build, scoped ESLint, scoped Prettier, and `git diff --check` were not run after the destructive command failed, in accordance with the failure rule. No fixtures were applied.

## Safety review

- The database URL identity was parsed and matched exactly to authorized project ref `cpkyxnxpzufigcmaptpg` before the attempt.
- The direct read-only migration check passed with the required 52/51/0 inventory and one known missing migration.
- The only destructive command attempted was the authorized `--db-url --no-seed` reset.
- The reset failed before visible confirmation or replay and was not retried.
- No `--linked` reset, connection-method switch, manual SQL cleanup, schema drop, truncation, migration edit, history repair, Auth deletion, or Storage deletion was performed.
- Source files and migration files were not modified.
- `origin/main` was not mutated.
- Production and staging were not mutated.
- This document contains no secrets or full database URLs.

## Phase B prerequisites

Phase B is **REQUIRED but BLOCKED**. A successful authorized reset, complete 52/52 migration verification, canonical baseline verification, and clean runtime/Auth verification must be achieved before any defense-account bootstrap or defense-dataset creation. Storage cleanup remains a separate explicitly authorized API-only phase and was not performed.

## Result

**C. HOSTED QA DB-URL RESET FAILED**

