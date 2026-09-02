import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("backup attention is one in-app Owner/Admin event per Partial or Failed run", async () => {
  const [migration, notificationFoundation] = await Promise.all([
    readFile(
      new URL(
        "../../../supabase/migrations/20260903000000_backup_recovery_metadata.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../../supabase/migrations/20260902000000_canonical_in_app_notifications.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(migration, /new\.status not in \('Partial', 'Failed'\)/);
  assert.match(migration, /profile\.user_type = 'Owner\/Admin'/);
  assert.match(migration, /profile\.account_status = 'Active'/);
  assert.match(migration, /'backup-attention:' \|\| new\.id::text/);
  assert.match(notificationFoundation, /unique \(recipient_id, event_key\)/);
  assert.doesNotMatch(migration, /email_deliveries|Brevo/i);
});

test("canonical metadata keeps BackupRun, BackupArtifact, and RecoveryDrill separate", async () => {
  const migration = await readFile(
    new URL(
      "../../../supabase/migrations/20260903000000_backup_recovery_metadata.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /create table public\.backup_runs/);
  assert.match(migration, /create table public\.backup_artifacts/);
  assert.match(migration, /create table public\.recovery_drills/);
  assert.match(migration, /target_environment = 'NonProduction'/);
  assert.match(migration, /sha256 ~ '\^\[0-9a-f\]\{64\}\$'/);
});

test("status API is a read-only Owner/Admin server boundary", async () => {
  const route = await readFile(
    new URL("../../routes/api.backup-status.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /requireRole\("Owner\/Admin"\)/);
  assert.match(route, /GET: getBackupStatus/);
  assert.doesNotMatch(route, /POST:|PUT:|DELETE:/);
});
