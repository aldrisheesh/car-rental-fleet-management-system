# Backup and Recovery Runbook

## Scope and responsibility

Backup and recovery are deployment operations performed by an authorized Technical Recovery Operator. Business Owner/Admin users may inspect safe status metadata through the application, but they cannot create, download, delete, or restore backups. Operations Staff and Customer/Renter users have no backup-status access.

The production baseline is Supabase Free. This procedure uses supported logical dumps and does not depend on Supabase Pro backups or point-in-time recovery.

## Prerequisites

- Node.js and repository dependencies installed.
- The repository-pinned Supabase CLI and its container prerequisites.
- `psql` available to the recovery operator for recovery drills.
- A linked Supabase project for production backup, or a running local Supabase stack for safe validation.
- A separately provisioned private Cloudflare R2 Standard bucket. Do not make the bucket public and do not configure a public/custom-domain access path.
- Trusted Supabase service-role access for metadata and private Storage reads.
- For drills, an isolated non-production PostgreSQL/Supabase project with the canonical private buckets already created.

Never paste secrets into command arguments, logs, tickets, screenshots, Git history, or application settings. Use the deployment platform's protected environment configuration.

## Deployment configuration

The backup process reads server/deployment variables only:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
BACKUP_RETENTION_DAYS
BACKUP_DATABASE_SOURCE
BACKUP_TRIGGER
```

`BACKUP_RETENTION_DAYS` defaults to `14`. `BACKUP_DATABASE_SOURCE` must be `linked` in the normal deployed workflow or `local` for a safe local database. A linked workflow also requires the Supabase CLI project link/authentication and database-password configuration expected by that CLI. `BACKUP_TRIGGER` is `Scheduled` or `Manual`; omission means `Manual`.

None of these secrets may use a `VITE_` prefix. Missing or placeholder backup configuration fails only the trusted command with `ConfigurationError`; it does not prevent the web application from starting. When the trusted Supabase metadata boundary itself is configured, the command also persists a Failed `BackupRun` so Owner/Admin awareness is generated. If that boundary is absent, the failure can only be reported safely by the command.

Recovery drill configuration additionally requires:

```text
RECOVERY_TARGET_ENV=nonproduction
RECOVERY_DRILL_CONFIRM=RESTORE_ISOLATED_NONPRODUCTION
RECOVERY_TARGET_DATABASE_URL
RECOVERY_TARGET_SUPABASE_URL
RECOVERY_TARGET_SUPABASE_SERVICE_ROLE_KEY
BACKUP_RUN_ID                       # optional; latest Completed run otherwise
```

The target Supabase URL must differ from `SUPABASE_URL`. Missing target configuration never defaults to production.

## Backup commands and daily schedule

Manual trusted backup:

```sh
BACKUP_TRIGGER=Manual npm run backup:run
```

Exact daily scheduler command:

```sh
BACKUP_TRIGGER=Scheduled npm run backup:run
```

Configure the production deployment scheduler to invoke the scheduled command once every 24 hours. VS030 deliberately does not provision cron or place production secrets in GitHub Actions. Alert on a non-zero command exit and inspect the safe `BackupRun` status/Owner notification; do not rely on command output as the canonical record.

## Database backup behavior

The runner invokes the repository-pinned Supabase CLI with `supabase db dump` and the configured `--linked` or `--local` source. It creates the supported logical components in secure OS temporary storage:

- `roles.sql` with `--role-only`;
- `schema.sql` for database schema;
- `data.sql` with `--data-only --use-copy`.

The files are copied to private R2 and removed from temporary storage. The runner does not implement custom SQL export logic and never runs from a browser/API action.

## Storage backup behavior

Database metadata is not a backup of Supabase Storage bytes. The runner separately enumerates and downloads only these canonical private buckets through trusted credentials:

- `renter-requirements`;
- `payment-proofs`.

Each object is copied byte-for-byte to R2. A per-bucket manifest preserves its logical bucket and object path, byte size, checksum, and artifact key, including an empty manifest for an empty canonical bucket. Unrelated/public/test buckets are excluded. Contents and signed URLs are never stored in canonical metadata or logs.

## Private artifact layout and integrity

The logical R2 namespace is:

```text
backup-runs/YYYY/MM/DD/<backup-run-id>/database/roles.sql
backup-runs/YYYY/MM/DD/<backup-run-id>/database/schema.sql
backup-runs/YYYY/MM/DD/<backup-run-id>/database/data.sql
backup-runs/YYYY/MM/DD/<backup-run-id>/storage/<bucket>/objects/<encoded-object-path>
backup-runs/YYYY/MM/DD/<backup-run-id>/storage/<bucket>/manifest.json
```

Every completed artifact records its exact byte size and SHA-256. Artifact keys are low-level private references, not URLs. The drill downloads and validates every artifact before it mutates either isolated target. Any size or checksum mismatch stops restoration and records a failed drill.

Cloudflare provides TLS in transit and provider-managed encryption at rest. Do not add home-grown application encryption.

## Status semantics and retention

- `Completed`: database roles/schema/data and both canonical Storage buckets all completed.
- `Partial`: at least one required component completed and at least one failed.
- `Failed`: no required component produced useful protection or a fatal failure prevented the run.

Partial and Failed runs create at most one in-app awareness event per active Owner/Admin and never a Brevo email. They do not mutate bookings, payments, requirements, rentals, vehicles, or maintenance records.

After each attempt, application-controlled cleanup removes eligible expired object-store artifacts and metadata. The default rolling retention is 14 days. Cleanup always preserves the latest Completed known-good Recovery Set even when it is older than the window; Partial and Failed runs never replace that protection. Do not configure an R2 lifecycle rule that can delete the final known-good set independently.

## Recovery drill

Run only after verifying that the configured database and Storage project are isolated non-production resources:

```sh
npm run backup:restore-drill
```

The tool selects `BACKUP_RUN_ID` when supplied, otherwise the latest Completed `BackupRun`. It then:

1. records a Running `RecoveryDrill` targeting `NonProduction`;
2. retrieves every completed artifact in the Recovery Set;
3. validates exact byte size and SHA-256 before restoration begins;
4. restores roles, schema, and data with `psql` into the isolated database;
5. checks essential canonical tables and representative readable counts;
6. copies canonical Storage objects to pre-existing private target buckets;
7. downloads restored objects and verifies them again;
8. records `Passed` only if database and Storage validation both pass, otherwise `Failed`.

The drill rejects a production target value, an obviously production-named target host, a missing explicit confirmation, a target Supabase URL equal to the source, and a target database URL equal to `PRODUCTION_DATABASE_URL` when that optional comparison value is available. The target database password is passed to `psql` through process environment, not its argument list. Raw subprocess/provider errors are suppressed and normalized.

## Production recovery (emergency, high level)

Production recovery is not the normal drill command and has no application UI. Under an authorized incident procedure, the Technical Recovery Operator should freeze writes, select a Completed Recovery Set, independently verify all sizes/checksums, provision or approve the production replacement database and private Storage buckets, restore roles/schema/data in supported order, restore Storage objects to their original bucket/object paths, validate essential records and object references, rotate or re-establish deployment credentials as needed, then authorize traffic cutover. Record timestamps and evidence for incident review. Never bypass checksum failure.

## Recovery objectives

- Target Recovery Point Objective (RPO): 24 hours, aligned to the daily schedule.
- Target Recovery Time Objective (RTO): 4 hours, assuming artifacts, credentials, replacement infrastructure, and a Technical Recovery Operator are available.

These are operational design targets, not guaranteed service-level commitments.

## Validation classifications

Report validation separately as application/tooling, R2 provider, database backup, Storage backup, and recovery drill. Automated tests mock R2. If controlled R2 configuration is absent, report `R2 LIVE VALIDATION = DEFERRED — CONFIGURATION`; this is not application failure. Do not upload production/customer data merely to test R2 access—use synthetic bytes only in an explicitly controlled test prefix.
