# VS030 Manuscript Traceability

**Status:** Frozen
**Last updated:** 2026-09-03

## Manuscript support

The manuscript requires centralized database storage with backup/recovery procedures and currently includes a `Backup_Logs` concept.

VS030 preserves the backup/recovery requirement but sharpens the implementation model.

## Manuscript mismatch

The manuscript's current `Backup_Logs` model treats backup largely as a single file/path record.

The canonical design instead distinguishes:
- Backup Run;
- Backup Artifact;
- Recovery Drill.

One Backup Run may produce multiple artifacts, including Database and Storage protection.

A backup is not considered fully proven merely because an artifact exists; RecoveryDrill records validate actual recoverability.

## Role correction

Business Owner/Admin may inspect backup status but is not automatically a Technical Recovery Operator.

Production restoration remains a technical/deployment procedure, not a normal application use case.

## Recovery targets

Baseline targets:
- RPO: 24 hours.
- RTO: 4 hours.

These must be documented as design targets rather than guaranteed service-level commitments.

## Retention

Baseline:
- 14-day rolling retention;
- preserve at least the latest known-good recovery set.

## Storage

Backups are stored privately outside the production Supabase environment.

The selected baseline destination is Cloudflare R2 Standard.

The manuscript should not imply backup files are publicly downloadable or stored in GitHub.

## Storage objects

Database backup does not by itself protect uploaded requirement/payment files.

The final manuscript should distinguish:
- database recovery data;
- file/object storage recovery data.

## Expected manuscript revision after implementation

Review/update:
- R14 / backup-recovery requirement wording;
- Backup_Logs data dictionary;
- ERD;
- System Architecture / deployment architecture;
- Admin role/use cases if backup status is shown;
- Security/privacy discussion;
- limitations/future enhancements;
- testing section with restore-drill evidence.

Do not edit the Proposal Paper during VS030 implementation.
