# Vertical Slice 030 — Backup & Recovery Alignment

**Status:** Approved for implementation
**Objective:** Implement deployment-managed backup and recovery tooling with canonical BackupRun, BackupArtifact, and RecoveryDrill metadata, private off-site Cloudflare R2 storage, integrity validation, retention behavior, failed-run awareness, and non-production recovery validation—without turning the web application into a backup or restore console.

## Purpose

Backup and recovery are technical/deployment operations.

They are not normal car-rental business actions.

The canonical architecture is:

```text
Trusted Technical Backup Runner
        ↓
BackupRun
        ├── Database Backup Artifact
        └── Storage Backup Artifact
        ↓
SHA-256 + size validation
        ↓
Private Cloudflare R2
        ↓
Retention
        ↓
Recovery Set
        ↓
RecoveryDrill
        ↓
Isolated non-production restore validation
```

The application may expose safe backup/recovery metadata to Owner/Admin.

The application must not execute production restoration from the browser.

---

# Domain Authority

Read and preserve the terminology in:

```text
CONTEXT.md
```

Canonical terms:

```text
Backup Run
Backup Artifact
Database Backup Artifact
Storage Backup Artifact
Recovery Set
Recovery Drill
Recovery Point Objective
Recovery Time Objective
Business Owner/Admin
Technical Recovery Operator
Backup Retention
Low-Level Storage Reference
```

Do not replace these with vague terms such as:

```text
backup file
restore thing
admin backup
database snapshot
```

where the canonical term is more precise.

---

# Manuscript Traceability

VS030 supports the manuscript requirement for:

- centralized data protection;
- backup procedures;
- recovery procedures;
- backup records/logging;
- operational continuity.

The manuscript's current `Backup_Logs` model is incomplete because it assumes one backup file/path.

Canonical implementation distinguishes:

```text
BackupRun
        ↓
one or more BackupArtifacts

RecoveryDrill
        ↓
validation of recoverability
```

Do not modify the Proposal Paper during VS030.

---

# Required Context

Read first:

1. `engineering/AI-ENGINEERING-CONTEXT.md`
2. `engineering/sprints/VERTICAL-SLICE-030.md`
3. `CONTEXT.md`
4. `codex-context/25-canonical-subsystem-map.md`
5. `codex-context/47-backup-recovery-domain-model.md`
6. `codex-context/48-manuscript-traceability-vs030.md`

Do not read earlier vertical-slice contracts unless an exact implementation dependency genuinely requires it.

---

# Initial Inspection

Inspect only relevant surfaces:

1. Supabase configuration;
2. current migrations/database types;
3. canonical private Storage buckets and upload paths;
4. deployment/tooling/package scripts;
5. existing environment conventions;
6. notification creation/helpers for failed-run awareness;
7. Owner/Admin authorization/read patterns;
8. Admin navigation only if implementing the optional read-only status view.

Do not inspect unrelated subsystems.

---

# Platform Baseline

Assume:

```text
Supabase Free
```

Do not require:

```text
Supabase Pro
Point-in-Time Recovery
managed daily database backups
```

for VS030 success.

Backup design must remain viable without paid Supabase backup features.

---

# Database Backup Mechanism

Use the Supabase-supported logical database backup workflow.

Prefer repository-controlled tooling around:

```text
supabase db dump
```

or the exact supported equivalent discovered in the installed Supabase CLI.

Do not build a custom PostgreSQL backup engine.

Do not execute database dumps from:

```text
React
browser requests
normal Admin API routes
```

The backup command belongs to trusted technical tooling.

---

# Database Recovery Assets

Create logical recovery artifacts compatible with a supported restore procedure.

Do not assume that one arbitrary `.sql` file is automatically a complete recovery set.

If Supabase requires separate logical artifacts for:

```text
roles
schema
data
```

or equivalent, preserve that supported structure.

The domain model may still classify the component as:

```text
Database Backup Artifact
```

with implementation-specific child/artifact details if needed.

---

# Storage Object Backup

Database backups do not protect file contents stored in Supabase Storage.

VS030 must separately protect canonical private application objects.

Inspect the actual buckets used for:

- requirement documents;
- payment proofs;
- other canonical private uploaded artifacts.

Do not automatically back up unrelated development/test/public buckets.

---

# Storage Backup Semantics

For each canonical protected bucket:

```text
enumerate objects
        ↓
read/download through trusted server credentials
        ↓
copy to private R2 backup namespace
        ↓
record integrity metadata
```

Preserve enough logical object-path information to allow restoration.

Do not turn backup copies public.

---

# Off-Site Destination

Use:

```text
Cloudflare R2
```

with a:

```text
Private Standard bucket
```

Baseline conceptual bucket name:

```text
briah-car-rental-backups
```

Exact deployment bucket name may be configuration-driven.

Do not hard-code credentials or account IDs.

---

# R2 Provider Boundary

Create a narrow storage-provider abstraction if useful.

Conceptually:

```text
BackupObjectStore
  put()
  get()
  list()
  delete()
```

with:

```text
R2BackupObjectStore
```

Do not spread S3/R2-specific API details throughout backup-domain logic.

Avoid overengineering multi-provider support; only one implementation is required.

---

# Environment Configuration

Use deployment/server-only configuration.

Likely variables:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME

BACKUP_RETENTION_DAYS=14
```

Repository naming conventions may differ.

Database/Supabase backup tooling may also require trusted environment configuration already present.

Never prefix secrets with:

```text
VITE_
```

Never expose them to browser code.

Never persist secrets in backup metadata tables.

---

# Backup Schedule

Canonical policy:

```text
Daily automated backup
```

plus:

```text
optional trusted manual pre-maintenance/deployment backup
```

VS030 does not need to provision production cron automatically.

The repository should provide a deterministic command/tool suitable for external scheduler invocation.

Example concept:

```text
npm run backup:run
```

Exact naming is implementation-defined.

---

# Backup Trigger

Canonical trigger values:

```text
Scheduled
Manual
```

`Manual` means manually invoked by a Technical Recovery Operator through trusted tooling.

It does NOT mean:

```text
Owner clicks Create Backup in Admin UI
```

---

# BackupRun

Implement canonical persistent metadata.

Suggested fields:

```text
id
trigger
status
started_at
completed_at
retention_until
remarks
created_by
created_at
```

Exact naming may follow database conventions.

`created_by` may be nullable because scheduled/deployment jobs may not correspond to an application user.

Do not fabricate a fake Owner user for scheduled runs.

---

# BackupRun Status

Use exactly a small explicit lifecycle such as:

```text
Running
Completed
Partial
Failed
```

Meaning:

## Running
Backup attempt is currently executing.

## Completed
Every required recovery component completed successfully.

## Partial
At least one required component succeeded and at least one required component failed.

Example:

```text
database backup: success
Storage backup: failure
→ Partial
```

## Failed
No usable required recovery set was produced, or a fatal failure prevented meaningful backup completion.

Do not report a partial recovery set as Completed.

---

# BackupArtifact

Implement persistent metadata for individual recovery assets.

Suggested fields:

```text
id
backup_run_id
artifact_type
artifact_key
status
size_bytes
sha256
created_at
```

Exact schema may vary.

Artifact types baseline:

```text
Database
Storage
```

If separate database components require finer internal differentiation, preserve the two top-level domain categories.

---

# Artifact Reference

Persist a non-secret object key.

Good example:

```text
database/2026/09/03/<run-id>/database.dump
```

or:

```text
storage/2026/09/03/<run-id>/<bucket>/<object-path>
```

Do not persist:

```text
signed URL
R2 secret
database password
Supabase service-role key
temporary download token
```

---

# Artifact Integrity

Every completed artifact must record:

```text
size_bytes
sha256
```

Use SHA-256.

Checksum the exact bytes that were uploaded/stored as the artifact.

Before restore:

```text
download/read artifact
        ↓
recompute SHA-256
        ↓
compare stored checksum
```

Mismatch must block restoration of that artifact.

Do not continue a restore after integrity failure.

---

# Encryption

Require:

```text
TLS/in-transit encryption
private bucket
provider at-rest encryption
```

Do not invent custom application cryptography.

Do not write home-grown encryption wrappers.

---

# Recovery Set

A Recovery Set is the complete set of required artifacts associated with a successful BackupRun.

A `Completed` run is a candidate known-good recovery set.

A `Partial` run is not equivalent to a complete known-good recovery set.

---

# Retention

Baseline:

```text
14-day rolling retention
```

Allow configuration through:

```text
BACKUP_RETENTION_DAYS
```

or repository-consistent equivalent.

Default:

```text
14
```

---

# Retention Safety Rule

Never delete the final known-good completed recovery set solely because it exceeded the retention age.

Conceptual cleanup rule:

```text
find expired recovery sets
        ↓
identify latest successful Completed run
        ↓
never delete that run
        ↓
delete other eligible expired artifacts
        ↓
record cleanup result safely
```

Do not rely only on object-storage lifecycle deletion if it could violate this invariant.

If R2 lifecycle rules are used later, they must remain compatible with this safety rule.

---

# Failed / Partial Backup Awareness

A:

```text
Failed
```

or materially:

```text
Partial
```

backup should generate canonical Owner/Admin in-app operational awareness.

Use existing Notifications infrastructure.

Add only the smallest new notification type necessary.

Possible:

```text
backup_failed
```

or:

```text
backup_attention
```

Use repository naming conventions.

Do not email these through Brevo in VS030.

---

# Backup Failure Recipients

Recipients:

```text
active Owner/Admin
```

only.

Do not notify:

```text
Operations Staff
Customer
```

Backup infrastructure awareness is outside their application responsibility.

---

# Failed-Run Deduplication

Do not repeatedly emit multiple notifications for the same failed BackupRun.

The BackupRun ID/event identity should provide a stable dedupe key.

A separate later failed run may create a new notification.

Do not reuse VS028's condition-state model if a simple one-event-per-run notification is more appropriate.

---

# Owner/Admin Backup Status Read Model

Implement a small read-only API/view if reasonably contained.

Recommended API concept:

```text
GET /api/backup-status
```

Owner/Admin only.

Operations Staff and Customer:

```text
403
```

---

# Status View Content

Suitable fields:

```text
latest run
latest successful run
latest run status
latest artifacts/components
retention days
last recovery drill
RPO target
RTO target
```

Do not return:

```text
R2 credentials
signed URLs
database connection strings
full backup contents
restore credentials
```

---

# Optional Admin UI

If low-cost and consistent with current Admin architecture, add:

```text
/admin/backup-recovery
```

or repository-consistent equivalent.

This page is read-only.

Suitable content:

```text
Backup & Recovery

Last successful backup
Latest backup status
Database protection
Storage protection
Retention policy
Last recovery drill
RPO target: 24 hours
RTO target: 4 hours
```

Do not add:

```text
Create backup
Restore
Download
Delete backup
Configure R2
```

If the UI materially widens VS030, omit it and report that the canonical API/read model exists without a polished page.

---

# Technical Recovery Operator

Actual execution authority belongs to the:

```text
Technical Recovery Operator
```

This is a domain responsibility, not necessarily a database-backed application role.

Do not add a new application role merely for this concept.

Trusted CLI/deployment credentials establish technical authority.

---

# RecoveryDrill

Implement persistent metadata separate from BackupRun.

Suggested fields:

```text
id
backup_run_id
target_environment
status
started_at
completed_at
database_validation
storage_validation
remarks
created_at
```

Target baseline:

```text
NonProduction
```

Do not implement:

```text
Production
```

as the normal drill target.

---

# RecoveryDrill Status

Keep explicit and simple.

Possible:

```text
Running
Passed
Failed
```

Exact convention may follow repository style.

Do not label a drill Passed merely because a restore command launched.

Validation must complete.

---

# Restore Drill Tooling

Provide trusted repository-controlled tooling.

Conceptually:

```text
npm run backup:restore-drill
```

or equivalent.

It must require explicit non-production target configuration.

Do not allow target omission to silently mean production.

---

# Restore Safety

The tooling must refuse an obvious production target in normal drill mode.

Implement reasonable safeguards.

Examples:

- explicit `RECOVERY_TARGET_ENV=nonproduction`;
- require distinct non-production connection URL;
- reject equality with production connection where detectable;
- require explicit confirmation/flag for destructive restore tooling.

Do not rely solely on naming a script `test`.

---

# Restore Drill Sequence

Preferred:

```text
select completed BackupRun
        ↓
retrieve required artifacts
        ↓
verify size/checksum
        ↓
restore DB to isolated target
        ↓
restore/copy Storage objects to isolated target
        ↓
verify essential schema/data/files
        ↓
record RecoveryDrill
```

---

# Database Restore Validation

At minimum verify:

```text
database connects
essential canonical tables exist
selected representative records/counts are readable
schema/migrations are coherent
```

Do not validate by comparing secrets or sensitive raw values.

A small safe verification manifest may be used.

---

# Storage Restore Validation

At minimum verify:

```text
expected protected buckets/object sets represented
sample restored objects exist
object byte/checksum validation passes
database references can resolve to restored object paths where practical
```

Do not expose contents of private customer documents during logging.

---

# Restore Drill Environment

Restore only to:

```text
isolated non-production PostgreSQL/Supabase
```

and isolated non-production Storage.

Do not routinely restore against production.

Production recovery remains a separate emergency runbook procedure.

---

# RPO

Document target:

```text
24 hours
```

This corresponds to daily baseline backup frequency.

Do not call this:

```text
guaranteed maximum data loss
```

Use:

```text
target RPO
```

---

# RTO

Document target:

```text
4 hours
```

assuming:

- recovery artifacts are available;
- deployment credentials are accessible;
- replacement database/storage environment is available;
- Technical Recovery Operator is available.

Do not call it a guaranteed SLA.

---

# Backup Runner Failure Isolation

Failure to create a backup must not mutate:

```text
bookings
payments
requirements
rentals
vehicles
maintenance
```

Backup tooling is operational infrastructure.

Do not couple normal business transactions to successful backup execution.

---

# Business Application Availability

Do not make application startup fail merely because:

```text
R2 credentials absent
backup tooling unavailable
```

The main web application should remain operational.

Backup commands may fail configuration validation independently.

---

# Configuration Classification

Backup tooling should distinguish:

```text
CONFIGURED
ABSENT
PLACEHOLDER
```

for deployment validation where appropriate.

Never print secrets.

---

# R2 Credentials

Expected server/deployment configuration may include:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

Do not expose actual values in normal output.

Do not put R2 secrets into `.env.example`.

Only placeholders.

---

# Supabase Storage Credentials

Use server-held canonical credentials for trusted backup access.

Do not create public bucket access merely to simplify backups.

Do not make private customer files public.

---

# Logging

Safe logs may include:

```text
backup run id
artifact type
safe artifact key
bytes
checksum present
status
duration
error category
```

Do not log:

```text
database URL with password
service-role key
R2 secret
signed URL
private file contents
```

---

# Error Classification

Normalize safe backup error categories.

Examples:

```text
ConfigurationError
DatabaseDumpFailed
StorageEnumerationFailed
StorageObjectReadFailed
ArtifactUploadFailed
IntegrityValidationFailed
RetentionCleanupFailed
RestoreFailed
ValidationFailed
UnknownBackupError
```

Do not persist arbitrary shell stderr if it could contain secrets.

Store sanitized summaries.

---

# Shell Command Safety

If scripts execute external commands:

- avoid interpolating untrusted user input;
- use argument arrays where feasible;
- validate paths;
- create temporary directories securely;
- clean them up after use;
- never echo environment secrets.

---

# Temporary Backup Files

Use a temporary working directory outside tracked repository paths.

Ensure:

```text
.gitignore
```

protects any backup working/artifact directory if one exists locally.

Do not commit backup artifacts to Git.

---

# GitHub Boundary

Never store backup artifacts in the repository.

Never attach production database dumps to commits/releases.

GitHub is source control, not backup storage for customer data.

---

# Admin Settings Boundary

Do not modify the prototype Admin Settings page to manage:

```text
R2
backup schedule
database credentials
recovery target
```

Infrastructure configuration remains deployment-side.

---

# Brevo Boundary

Do not add backup alerts to transactional email in VS030.

Failed-run awareness is in-app only.

VS029 email eligibility remains unchanged.

---

# Existing Notification Regression

If a new backup notification type is added:

- update notification type projection/rendering;
- route it to backup status page if one exists, otherwise a safe Admin destination;
- preserve all VS028/VS029 notification behavior.

---

# Deployment Documentation

Add a focused runbook.

Recommended path:

```text
engineering/runbooks/BACKUP-RECOVERY.md
```

or repository-consistent equivalent.

Document:

- required tools;
- environment configuration;
- R2 bucket prerequisites;
- daily scheduled command;
- manual backup command;
- retention;
- artifact layout;
- restore-drill procedure;
- production recovery procedure at a high level;
- RPO/RTO targets;
- security warnings.

Do not place actual secrets in documentation.

---

# Scheduler

Provide the exact command suitable for a daily external scheduler.

Do not automatically create:

```text
Vercel cron
Cloudflare cron
GitHub Actions production backup
```

unless the repository already has an approved deployment scheduler architecture.

Scheduler configuration remains deployment work.

---

# GitHub Actions

Do not introduce a scheduled GitHub Action containing production DB/R2 secrets unless the existing deployment architecture already explicitly uses GitHub Actions for trusted production infrastructure.

Prefer keeping scheduler selection deployment-neutral in VS030.

---

# Validation Without Real R2

Automated tests must mock the object-store adapter.

Do not require real R2 during unit/regression tests.

---

# Optional Live R2 Validation

If real R2 configuration is already present and a controlled test bucket/path exists:

a non-sensitive provider smoke test may be performed.

Do not upload production database/customer data merely for a provider smoke test.

Use synthetic validation bytes.

If configuration is absent:

```text
R2 LIVE VALIDATION
→ DEFERRED — CONFIGURATION
```

This is not application failure.

---

# Database Backup Validation

Where possible, run the actual logical dump tooling against a safe development/test database.

Do not dump production merely for validation unless explicitly performing the authorized production backup procedure.

---

# Recovery Drill Final Validation

A full VS030 recovery validation may require deployment configuration after implementation.

Classify separately:

```text
APPLICATION / TOOLING
R2 PROVIDER
DATABASE BACKUP
STORAGE BACKUP
RECOVERY DRILL
```

Do not mark application code failed merely because deployment credentials are intentionally absent.

---

# Tests

Add focused automated coverage.

## Domain State

Test:

```text
all required components succeed
→ Completed

some succeed + some fail
→ Partial

fatal/no usable recovery artifacts
→ Failed
```

---

## Artifact Integrity

Test:

```text
same bytes
→ checksum matches

changed bytes
→ integrity failure
```

---

## R2 Adapter

Mock:

```text
put
get
list
delete
```

Test provider errors normalize safely.

---

## Retention

Test:

```text
expired old backup
+ newer successful backup
→ eligible deletion

expired backup is latest known-good
→ preserved

failed/partial run handling
→ does not accidentally replace latest known-good
```

---

## Storage Backup

Test:

- canonical protected buckets included;
- unrelated buckets excluded;
- object paths preserved safely;
- upload failures create Partial/Failed state correctly;
- no public URLs required.

---

## Notifications

Test:

```text
Completed
→ no failure notification

Failed
→ Owner/Admin awareness

Partial
→ awareness if materially incomplete

same BackupRun
→ no duplicate notification
```

Customers/Operations Staff excluded.

---

## Authorization

If status API/UI implemented:

```text
Owner/Admin → allowed
Operations Staff → forbidden
Customer → forbidden
```

---

## Status Data

Test no response contains:

```text
credentials
signed URLs
database URLs
secret configuration
```

---

## Restore Drill

Test:

```text
checksum failure
→ restoration blocked

non-production target
→ allowed

production-looking target in drill mode
→ rejected

successful validation
→ RecoveryDrill Passed

restore/verification error
→ Failed
```

---

## Business Isolation

Test backup failures do not modify canonical business state.

---

## Configuration

Test absent/placeholder credentials produce safe configuration failures.

No secret values in error output.

---

# Validation

Run at minimum:

```text
backup/recovery-focused tests
notification regression if changed
authorization tests if status read added
npm run build
focused lint
git diff --check
```

If migrations are added:

```text
Supabase migration validation
remote schema lint where appropriate
generated DB type validation
```

If scripts are added:

run:

```text
shell/tooling static validation
safe dry-run where supported
```

---

# Manuscript Post-Implementation Review

Final implementation response must identify:

1. BackupRun schema;
2. BackupArtifact schema;
3. RecoveryDrill schema;
4. database backup mechanism;
5. protected Storage buckets;
6. R2 artifact layout;
7. checksum/integrity behavior;
8. retention behavior;
9. failed-run notification behavior;
10. Owner/Admin visibility;
11. recovery-drill behavior;
12. RPO/RTO targets;
13. deployment/scheduler requirements;
14. manuscript `Backup_Logs` reconciliation required.

Do not edit Proposal Paper during VS030.

---

# Definition of Done

VS030 implementation is complete when:

- canonical BackupRun metadata exists;
- canonical BackupArtifact metadata exists;
- canonical RecoveryDrill metadata exists;
- trusted database backup tooling exists;
- canonical private Storage backup tooling exists;
- private R2 adapter/configuration boundary exists;
- artifacts record SHA-256 and byte size;
- Partial vs Completed semantics are honest;
- 14-day retention preserves the latest known-good recovery set;
- failed/partial backup awareness exists for Owner/Admin;
- recovery-drill tooling targets non-production only;
- no browser backup/restore operation exists;
- no secrets are exposed;
- optional status read/UI is Owner/Admin-only;
- deployment runbook exists;
- automated validation passes.

Full live backup/restore validation may remain deployment-blocked if real R2/non-production recovery credentials are not yet configured.

---

# Stop Rule

Stop after VS030.

Do not implement:

- VS031;
- Admin Settings canonicalization;
- financial settlement/refunds;
- backup-failure Brevo email;
- managed Supabase PITR;
- enterprise HA;
- CQ-028;
- CQ-029;
- CQ-030;
- CQ-031;
- CQ-032.
