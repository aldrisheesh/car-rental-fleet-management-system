# Open Decisions

**Status:** Active
**Last updated:** 2026-09-03

Geocoding resolved by MIC-025.

Financial reporting remains deferred under MIC-026.

VS028 low-availability threshold remains configurable/provisional:
- LOW_AVAILABILITY_THRESHOLD fallback 1;
- alert at zero rentable vehicles.

VS029 Brevo application transactional email is implemented and live-provider validated. Deployment scheduler invocation remains required.

## VS030 Backup & Recovery — resolved baseline

- Supabase Free baseline.
- Daily automated backup.
- Optional trusted manual pre-maintenance/deployment backup.
- 14-day rolling retention while preserving latest known-good recovery set.
- Database + canonical private Storage object protection.
- Private Cloudflare R2 Standard off-site storage.
- SHA-256 + size integrity metadata.
- BackupRun / BackupArtifact / RecoveryDrill canonical model.
- Owner/Admin may inspect status.
- Technical Recovery Operator performs actual recovery.
- No browser backup/restore controls.
- RPO target 24 hours.
- RTO target 4 hours.
- Non-production restore drill required for final validation.
- Production scheduler/R2 credentials remain deployment configuration.

Other open items:
CQ-028, CQ-029, CQ-030, CQ-031, CQ-032.
