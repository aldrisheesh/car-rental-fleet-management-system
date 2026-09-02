# Changelog

## 2026-09-03 — VS030 Backup & Recovery design

- Used structured design grilling to resolve the backup/recovery domain before implementation.
- Defined BackupRun, BackupArtifact, RecoverySet, RecoveryDrill, and Technical Recovery Operator terminology.
- Selected Supabase Free-compatible logical backup procedure.
- Selected private Cloudflare R2 Standard for off-site artifacts.
- Required separate protection for database and canonical private Storage objects.
- Set 14-day retention while preserving latest known-good recovery set.
- Set RPO target 24h and RTO target 4h.
- Required SHA-256 and byte-size integrity metadata.
- Kept backup/restore execution outside normal browser/application actions.
- Allowed narrow Owner/Admin read-only status visibility.
- Required non-production recovery drill evidence.
