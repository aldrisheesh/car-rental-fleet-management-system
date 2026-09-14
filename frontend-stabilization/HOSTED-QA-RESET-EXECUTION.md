# Hosted QA Reset Execution

## Lead authorization

- Classification: **HOSTED NON-PRODUCTION QA**.
- Approved Supabase project ref: `cpkyxnxpzufigcmaptpg`.
- The Lead attested that the hosted project's current Auth and runtime data is disposable QA/test data.
- Approved destructive command: `npx --no-install supabase db reset --linked --no-seed`.
- No Storage deletion, Auth bootstrap, defense-data creation, fixture operation, direct SQL cleanup, source change, migration change, deployment, merge, or main push was authorized or performed.
- Preflight commit: `a0fa5816b67dea92ec65a0c1e378e4f884d881ac`.
- The supplied plan identifier `11a5f19dc2fd46480abd69907c5e3360ff30487` is 39 characters and does not resolve as a Git object. The repository's exact plan commit is `11a5f199dc2fd46480abd69907c5e3360ff30487`; the preflight documents this one-character transcription discrepancy.

## Target identity

Final read-only identity verification immediately before the reset attempt:

| Identifier | Safe value |
| --- | --- |
| Branch | `stabilization/frontend-rebuild` |
| Starting HEAD | `a0fa5816b67dea92ec65a0c1e378e4f884d881ac` |
| Linked project ref | `cpkyxnxpzufigcmaptpg` |
| Application `SUPABASE_URL` ref | `cpkyxnxpzufigcmaptpg` |
| Frontend `VITE_SUPABASE_URL` ref | `cpkyxnxpzufigcmaptpg` |
| QA database connection ref | `cpkyxnxpzufigcmaptpg` |
| Project name | `car-rental-fleet-management-system` |
| Region | `ap-northeast-1` |
| Project status | `ACTIVE_HEALTHY` |
| CLI | `supabase` `2.116.0`, invoked with `npx --no-install` |
| Live database | PostgreSQL 17.6, server port `5432` |
| `origin/main` | `faed190d9b78bb845e2c89e7160eda90106f741f` (unchanged) |

The worktree was clean before the reset attempt. `QA_FIXTURE_TARGET=local` was treated as stale label data and was not used as environment identity evidence. No credential-bearing URL, token, password, service-role key, PII, document content, object path, or Auth identifier is recorded here.

## Pre-reset inventory

All inventory below was read-only and safe-count only. No customer PII or document contents were enumerated.

| Object | Count before reset attempt |
| --- | ---: |
| Branches | 3 (2 canonical; 1 VS residue) |
| Vehicle categories | 6 |
| Vehicles | 12 (12 canonical `DEV-*`) |
| Auth users | 33 |
| Profiles | 33 |
| Booking requests | 111 |
| Renter requirement sets | 19 |
| Requirement documents | 26 |
| Requirement reviews | 11 |
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
| Forecast coverage rows | 1 |
| Forecast runs / inputs / forecast rows | 2 / 162 / 54 |
| Supply evaluations / vehicle snapshots | 3 / 1 |
| Allocation batches / recommendations / candidates | 5 / 0 / 0 |
| Storage buckets | 2 private canonical buckets |
| Storage metadata objects | 34 |
| Storage API-visible physical objects | 34 (26 renter requirements; 8 payment proofs) |

The active demo payment method `demo-bank-transfer` was present with count 1. The Storage API listing matched the 34 metadata objects; no Storage object was deleted.

## Migration inventory before reset

- Local repository migrations: **52**.
- Remote migration history: **51**.
- Local-only migration: `20260910010000_maintenance_service_access.sql`.
- Remote-only migrations: **none**.
- The local migration directory and migration files were unchanged.

## Reset command

```sh
npx --no-install supabase db reset --linked --no-seed
```

This was the only destructive command attempted. No `--local`, arbitrary database URL, manual `DROP`/`TRUNCATE`, `psql` cleanup script, or Auth/Storage SQL deletion was used.

## Reset execution

The CLI began with:

```text
Initialising login role...
```

It then exited with status 1 and:

```text
LegacyDbResetCancelledError: context canceled
```

No project confirmation prompt visibly identifying the approved ref appeared, and no migration replay output or successful reset completion was reported. Per the failure rule, execution stopped immediately. The command was not retried.

Read-only post-failure checks showed the remote migration history still at 51 and the database inventory unchanged from the pre-reset counts. This is evidence that no completed reset or migration replay occurred; the attempt is nevertheless classified as failed and is not treated as a pass.

## Migration result

**Not achieved.** The post-failure read-only migration list remained 51 remote entries. `20260910010000_maintenance_service_access.sql` remained absent remotely, and no remote-only migration was present. The required 52/52 verification could not be performed because the reset failed before migration replay.

## Canonical baseline

**Not achieved.** The post-failure read-only state still contained the pre-reset runtime dataset. The observed values were:

- canonical branches: 2, with the additional VS residue branch still present;
- canonical categories: 6;
- canonical `DEV-*` vehicles: 12;
- active demo payment method: present;
- vehicle-state events: 24, not the clean migration baseline of 12;
- forecast coverage and Decision Support output: pre-reset rows still present;
- functions, triggers, RLS policies, grants, and configuration: not post-reset verified.

No missing canonical row was created manually.

## Runtime residue verification

**YES — runtime QA/VS/E2E residue remains in the database.** Post-failure read-only counts remained at the pre-reset values, including 3 branches, 111 booking requests, 81 rentals, 51 audit events, 61 notifications, and the existing Decision Support rows. No residue was manually deleted.

## Auth result

The post-failure read-only Auth count remained **33** and profiles remained **33**. The expected clean-reset Auth result of zero users/profiles was not reached. No Auth users were deleted or created. Defense bootstrap is not allowed after this failed reset.

## Storage result

Storage was not cleaned. The two canonical private buckets remained present, with 34 database metadata objects and 34 Storage API-visible objects. The old QA/synthetic objects therefore remain. This is residual disposable Storage requiring a separately authorized Phase B Storage API cleanup; no such cleanup was attempted.

## Application smoke verification

Not run. The reset did not produce a verified fresh hosted schema, and the failure rule required stopping before post-reset application checks. No accounts or transactions were created.

## Tests / build

Repository tests, build, scoped lint, scoped formatting, and post-reset smoke checks were not run because the hosted reset failed and the failure rule required stopping. No application source or migration files were changed.

## Safety review

- Only the approved project ref was targeted by the attempted reset command.
- The final identity gate passed before the attempt.
- `origin/main` was not mutated.
- No Storage object or bucket was deleted.
- No Auth user, profile, defense account, booking, payment, rental, fixture, or historical row was created or deleted.
- No direct SQL cleanup or migration-history repair was performed.
- No source, migration, configuration, deployment, merge, or main-branch change was performed.
- The failed command was not retried and no migration was skipped or edited.
- The evidence contains no secrets, PII, private document contents, Storage paths, signed URLs, or Auth identifiers.

## Remaining Phase B prerequisites

Phase B and all defense-data/bootstrap work are blocked by the failed Phase A reset. Before any continuation, the reset cancellation must be investigated and a fresh authorized execution must establish a successful 52-migration clean baseline. The residual 34 Storage objects still require a separate, explicitly authorized Storage API cleanup; they were intentionally left untouched. No Owner/Admin bootstrap, Staff/Customer creation, current workflow data, historical data, or Decision Support generation may follow this failed attempt.

## Reset result

HOSTED QA RESET FAILED
