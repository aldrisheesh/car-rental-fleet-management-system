# Canonical Subsystem Map

**Status:** Active AI navigation aid
**Last updated:** 2026-09-03

## VS030 starting points

Read:
- `CONTEXT.md`
- `codex-context/47-backup-recovery-domain-model.md`
- `codex-context/48-manuscript-traceability-vs030.md`

Inspect only:
1. current Supabase configuration/migrations;
2. Storage bucket usage for canonical uploaded files;
3. canonical notification generation/helpers for backup-failure awareness;
4. admin authorization/read patterns if implementing backup-status view;
5. environment/deployment scripts/conventions;
6. package scripts/tooling conventions.

Do not modify:
- booking/rental/payment/requirements lifecycles;
- VS028 operational notification semantics except adding a narrowly scoped backup-failure type if needed;
- VS029 Brevo email scope;
- Reports/Dashboard logic except optional navigation/read-only status integration;
- external context;
- allocation/forecasting;
- client-blocked CQs.

## Core boundary

Backup and recovery are technical/deployment operations.

The application may store and display safe backup/recovery metadata.

The application must not become an infrastructure restore console.
