# Canonical Backup & Recovery Domain Model

**Status:** Frozen for VS030
**Last updated:** 2026-09-03

## Objective

Implement backup/recovery as deployment-managed technical operations with canonical application-visible metadata, not as a browser-driven backup engine.

## Confirmed design

### Platform baseline
- Production baseline: Supabase Free.
- Do not depend on Supabase Pro/PITR.
- Use a trusted repository-controlled backup runner.
- Database backup mechanism: Supabase-supported logical dump workflow.
- File-storage backup: separate protection of canonical private Supabase Storage objects.
- Off-site destination: private Cloudflare R2 Standard bucket.
- Encryption: provider-supported encryption in transit and at rest; do not invent application cryptography.

### Schedule and retention
- Daily automated backup.
- Optional manual pre-maintenance/deployment backup from trusted technical tooling.
- 14-day rolling retention.
- Never delete the final known-good recovery set solely because it aged past 14 days.

### Recovery objectives
- RPO target: 24 hours.
- RTO target: 4 hours.
- These are operational targets, not guaranteed SLAs.

## Domain model

### BackupRun
Represents one backup attempt.

Conceptual fields:
- id
- trigger: Scheduled | Manual
- status: Running | Completed | Partial | Failed
- started_at
- completed_at
- retention_until
- safe error/remarks
- created_by nullable

A BackupRun is Completed only when every required recovery component succeeds.

If the database artifact succeeds but required Storage protection fails, the run is Partial.

### BackupArtifact
One recovery asset produced by a BackupRun.

Conceptual fields:
- id
- backup_run_id
- type: Database | Storage
- artifact_key
- status
- size_bytes
- sha256
- created_at

The artifact key is a non-secret logical reference. Never store signed URLs or access credentials.

### RecoveryDrill
A separate record proving a selected recovery set can be restored into an isolated non-production environment.

Conceptual fields:
- id
- backup_run_id
- target_environment: NonProduction
- status
- started_at
- completed_at
- database_validation
- storage_validation
- safe notes

A BackupRun and RecoveryDrill are not the same event.

## Integrity

Every produced artifact must record:
- byte size;
- SHA-256 checksum.

Restore validation should recompute and compare checksums before attempting restoration.

## Storage-object protection

Database backups alone are insufficient when records reference uploaded files.

The trusted backup workflow must protect canonical private application Storage objects separately.

Do not treat database metadata for Storage objects as equivalent to backing up the objects themselves.

## Failed-run awareness

A Failed or materially Partial backup run should create Owner/Admin operational in-app awareness.

Do not add Brevo backup-failure email in VS030.

Use the canonical Notifications subsystem and deduplication conventions where suitable.

## Responsibility boundary

### Owner/Admin
May inspect backup/recovery status.

### Operations Staff
No backup/recovery access.

### Customer
No backup/recovery access.

### Technical Recovery Operator
Performs:
- backup infrastructure configuration;
- manual backup invocation;
- artifact access;
- non-production restore drills;
- actual production recovery.

Do not equate the business Owner/Admin role with technical restore authority.

## Application UI boundary

A narrow read-only Owner/Admin Backup & Recovery view is allowed if it remains small.

Suitable content:
- latest run status;
- last successful backup;
- component/artifact coverage;
- retention target;
- last recovery drill;
- RPO target;
- RTO target.

Do not expose:
- Create Backup;
- Restore Database;
- Download Backup;
- R2 credentials;
- signed artifact URLs;
- database credentials.

If this UI materially widens VS030, implement the canonical read API/model first and defer polished UI.

## Deployment boundary

VS030 may implement:
- repository-controlled backup tooling;
- canonical metadata schema;
- Cloudflare R2 adapter/configuration boundary;
- integrity/checksum logic;
- retention cleanup logic;
- restore-drill tooling/runbook;
- failed-run notification integration;
- optional read-only status view.

VS030 must not:
- automatically provision Cloudflare R2;
- automatically configure production scheduling/cron;
- configure infrastructure credentials in Admin Settings;
- run restore through browser/API actions;
- build a custom database engine;
- depend on Supabase Pro/PITR.

## Configuration

Expected deployment-side values may include repository-consistent equivalents of:
- production database connection / Supabase CLI auth;
- R2 account/endpoint;
- R2 access key;
- R2 secret;
- private bucket name;
- backup retention days.

These are server/deployment secrets and must never be browser-exposed or persisted in business tables.

## Restore drill

A final validation should:
1. select a successful recovery set;
2. verify checksum/size;
3. restore database artifacts into isolated non-production PostgreSQL/Supabase;
4. restore/copy required Storage objects into isolated storage;
5. verify essential schema/data/object relationships;
6. record RecoveryDrill outcome.

Never routinely validate restore against production.

## Stop rule

Stop after backup/recovery tooling, metadata, validation, and optional status read model.

Do not implement unrelated Settings canonicalization, financial settlement, client-blocked CQs, or enterprise HA.
