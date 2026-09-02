import assert from "node:assert/strict";
import test from "node:test";

import {
  artifactIntegrity,
  backupRunPrefix,
  BackupError,
  deriveBackupRunStatus,
  isSafeArtifactKey,
  PROTECTED_STORAGE_BUCKETS,
  retentionDeletionCandidates,
  selectCanonicalStorageBuckets,
  storageObjectArtifactKey,
  verifyArtifactIntegrity,
} from "./backup-domain.ts";
import {
  classifyConfigValue,
  parseBackupRunnerConfig,
  parseRecoveryDrillConfig,
  parseRetentionDays,
} from "./backup-config.server.ts";
import { canReadBackupStatus } from "./backup-status.ts";

test("BackupRun status honestly reflects required component outcomes", () => {
  assert.equal(deriveBackupRunStatus(["Completed", "Completed"]), "Completed");
  assert.equal(deriveBackupRunStatus(["Completed", "Failed"]), "Partial");
  assert.equal(deriveBackupRunStatus(["Failed", "Failed"]), "Failed");
  assert.equal(deriveBackupRunStatus([], true), "Failed");
});

test("completed artifact integrity records bytes and SHA-256 and rejects changes", () => {
  const original = new TextEncoder().encode("safe synthetic bytes");
  const integrity = artifactIntegrity(original);
  assert.equal(integrity.sizeBytes, 20);
  assert.match(integrity.sha256, /^[0-9a-f]{64}$/);
  assert.doesNotThrow(() => verifyArtifactIntegrity(original, integrity));
  assert.throws(
    () =>
      verifyArtifactIntegrity(
        new TextEncoder().encode("changed synthetic bytes"),
        integrity,
      ),
    (error) =>
      error instanceof BackupError &&
      error.code === "IntegrityValidationFailed",
  );
});

test("artifact keys are safe and preserve encoded bucket/object paths", () => {
  const prefix = backupRunPrefix(
    "11111111-1111-4111-8111-111111111111",
    new Date("2026-09-03T00:00:00Z"),
  );
  const key = storageObjectArtifactKey(
    prefix,
    "payment-proofs",
    "customer one/receipt (final).pdf",
  );
  assert.equal(
    key,
    "backup-runs/2026/09/03/11111111-1111-4111-8111-111111111111/storage/payment-proofs/objects/customer%20one/receipt%20%28final%29.pdf",
  );
  assert.equal(isSafeArtifactKey(key), true);
  assert.equal(isSafeArtifactKey("/absolute/key"), false);
  assert.equal(isSafeArtifactKey("safe/../escape"), false);
  assert.equal(isSafeArtifactKey("safe//empty"), false);
});

test("retention removes expired runs but preserves the latest Completed recovery set", () => {
  const now = new Date("2026-09-30T00:00:00Z");
  const expired = new Date("2026-09-20T00:00:00Z");
  const runs = [
    {
      id: "old-good",
      status: "Completed" as const,
      retentionUntil: new Date("2026-09-10T00:00:00Z"),
    },
    {
      id: "latest-good",
      status: "Completed" as const,
      retentionUntil: expired,
    },
    {
      id: "newer-partial",
      status: "Partial" as const,
      retentionUntil: new Date("2026-09-25T00:00:00Z"),
    },
    { id: "failed", status: "Failed" as const, retentionUntil: expired },
  ];
  assert.deepEqual(
    retentionDeletionCandidates(runs, now)
      .map((run) => run.id)
      .sort(),
    ["failed", "newer-partial", "old-good"],
  );
});

test("only canonical private application buckets are selected", () => {
  assert.deepEqual(
    selectCanonicalStorageBuckets([
      "public-images",
      "payment-proofs",
      "test-fixtures",
      "renter-requirements",
    ]),
    [...PROTECTED_STORAGE_BUCKETS],
  );
});

test("backup configuration distinguishes absent and placeholder values safely", () => {
  assert.equal(classifyConfigValue(undefined), "ABSENT");
  assert.equal(classifyConfigValue("your-secret"), "PLACEHOLDER");
  assert.equal(classifyConfigValue("configured-value"), "CONFIGURED");
  assert.equal(parseRetentionDays(undefined), 14);
  const secret = "never-print-this-secret";
  assert.throws(
    () => parseBackupRunnerConfig({ R2_SECRET_ACCESS_KEY: secret }),
    (error) =>
      error instanceof BackupError &&
      error.message === "ConfigurationError" &&
      !String(error).includes(secret),
  );
});

test("recovery drill requires explicit isolated non-production target", () => {
  const valid = {
    SUPABASE_URL: "https://source.supabase.co",
    RECOVERY_TARGET_ENV: "nonproduction",
    RECOVERY_DRILL_CONFIRM: "RESTORE_ISOLATED_NONPRODUCTION",
    RECOVERY_TARGET_DATABASE_URL: "postgresql://user:pass@db.invalid/postgres",
    RECOVERY_TARGET_SUPABASE_URL: "https://isolated.supabase.co",
    RECOVERY_TARGET_SUPABASE_SERVICE_ROLE_KEY: "controlled-target-key",
  };
  assert.equal(
    parseRecoveryDrillConfig(valid).targetSupabaseUrl,
    valid.RECOVERY_TARGET_SUPABASE_URL,
  );
  assert.throws(() =>
    parseRecoveryDrillConfig({ ...valid, RECOVERY_TARGET_ENV: "production" }),
  );
  assert.throws(() =>
    parseRecoveryDrillConfig({
      ...valid,
      RECOVERY_TARGET_DATABASE_URL:
        "postgresql://user:pass@production-db.internal/postgres",
    }),
  );
  assert.throws(() =>
    parseRecoveryDrillConfig({
      ...valid,
      RECOVERY_TARGET_SUPABASE_URL: valid.SUPABASE_URL,
    }),
  );
  assert.throws(() =>
    parseRecoveryDrillConfig({ ...valid, RECOVERY_DRILL_CONFIRM: undefined }),
  );
});

test("backup status authorization is Owner/Admin only", () => {
  assert.equal(canReadBackupStatus("Owner/Admin"), true);
  assert.equal(canReadBackupStatus("Operations Staff"), false);
  assert.equal(canReadBackupStatus("Customer/Renter"), false);
});
