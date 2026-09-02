import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../supabase/database.types.ts";
import type {
  BackupRunnerConfig,
  RecoveryDrillConfig,
} from "./backup-config.server.ts";
import {
  artifactIntegrity,
  BackupError,
  type StorageManifest,
} from "./backup-domain.ts";
import { runRecoveryDrill } from "./recovery-drill.server.ts";

const backupConfig: BackupRunnerConfig = {
  supabaseUrl: "https://source.supabase.co",
  supabaseServiceRoleKey: "source-service-key",
  r2AccountId: "account",
  r2AccessKeyId: "access",
  r2SecretAccessKey: "secret",
  r2BucketName: "private-backups",
  retentionDays: 14,
  databaseSource: "local",
  trigger: "Manual",
};
const recoveryConfig: RecoveryDrillConfig = {
  targetDatabaseUrl: "postgresql://user:pass@isolated.invalid/postgres",
  targetSupabaseUrl: "https://isolated.supabase.co",
  targetSupabaseServiceRoleKey: "target-service-key",
};

function recoveryFixture(options?: { corruptKey?: string }) {
  const bytes = new Map<string, Uint8Array>();
  for (const name of ["roles.sql", "schema.sql", "data.sql"])
    bytes.set(
      `backup-runs/run/database/${name}`,
      new TextEncoder().encode(name),
    );
  const manifests: StorageManifest[] = [
    {
      version: 1,
      bucket: "renter-requirements",
      objects: [
        {
          path: "customer/id.pdf",
          artifactKey:
            "backup-runs/run/storage/renter-requirements/objects/customer/id.pdf",
          ...artifactIntegrity(new TextEncoder().encode("id")),
        },
      ],
    },
    { version: 1, bucket: "payment-proofs", objects: [] },
  ];
  bytes.set(
    manifests[0].objects[0].artifactKey,
    new TextEncoder().encode("id"),
  );
  for (const manifest of manifests)
    bytes.set(
      `backup-runs/run/storage/${manifest.bucket}/manifest.json`,
      new TextEncoder().encode(JSON.stringify(manifest)),
    );
  const artifacts = [...bytes].map(([artifact_key, value]) => ({
    artifact_type: artifact_key.includes("/database/") ? "Database" : "Storage",
    artifact_key,
    ...toRowIntegrity(value),
  }));
  if (options?.corruptKey) {
    const artifact = artifacts.find(
      (item) => item.artifact_key === options.corruptKey,
    );
    if (artifact) artifact.sha256 = "0".repeat(64);
  }

  const drillUpdates: Array<Record<string, unknown>> = [];
  const sourceClient = {
    from(table: string) {
      if (table === "backup_runs")
        return selectionChain({ data: { id: "run-id" }, error: null });
      if (table === "backup_artifacts")
        return selectionChain({ data: artifacts, error: null });
      if (table === "recovery_drills")
        return {
          insert() {
            return {
              select() {
                return {
                  async single() {
                    return { data: { id: "drill-id" }, error: null };
                  },
                };
              },
            };
          },
          update(value: Record<string, unknown>) {
            drillUpdates.push(value);
            return updateChain();
          },
        };
      throw new Error(`unexpected table ${table}`);
    },
  };
  const restored = new Map<string, Uint8Array>();
  const targetClient = {
    storage: {
      async getBucket(id: string) {
        return { data: { id, public: false }, error: null };
      },
      from(bucket: string) {
        return {
          async upload(path: string, value: Uint8Array) {
            restored.set(`${bucket}/${path}`, value);
            return { data: { path }, error: null };
          },
          async download(path: string) {
            const value = restored.get(`${bucket}/${path}`);
            return value
              ? {
                  data: new Blob([value.slice().buffer as ArrayBuffer]),
                  error: null,
                }
              : { data: null, error: new Error("missing") };
          },
        };
      },
    },
  };
  const store = {
    async get(key: string) {
      return bytes.get(key)!;
    },
    async put() {},
    async list() {
      return [...bytes.keys()];
    },
    async delete() {},
  };
  return {
    sourceClient: sourceClient as unknown as SupabaseClient<Database>,
    targetClient: targetClient as unknown as SupabaseClient<Database>,
    store,
    drillUpdates,
  };
}

test("successful non-production restore and validation records RecoveryDrill Passed", async () => {
  const fixture = recoveryFixture();
  let databaseRestored = false;
  const result = await runRecoveryDrill(backupConfig, recoveryConfig, {
    sourceClient: fixture.sourceClient,
    targetClient: fixture.targetClient,
    objectStore: fixture.store,
    async restoreDatabase() {
      databaseRestored = true;
    },
  });
  assert.equal(result.status, "Passed");
  assert.equal(databaseRestored, true);
  const finalUpdate = fixture.drillUpdates.at(-1);
  assert.ok(finalUpdate);
  assert.equal(finalUpdate.status, "Passed");
  assert.equal(finalUpdate.database_validation, "Passed");
  assert.equal(finalUpdate.storage_validation, "Passed");
});

test("checksum mismatch stops restoration and records RecoveryDrill Failed", async () => {
  const key = "backup-runs/run/database/schema.sql";
  const fixture = recoveryFixture({ corruptKey: key });
  let databaseRestored = false;
  await assert.rejects(
    runRecoveryDrill(backupConfig, recoveryConfig, {
      sourceClient: fixture.sourceClient,
      targetClient: fixture.targetClient,
      objectStore: fixture.store,
      async restoreDatabase() {
        databaseRestored = true;
      },
    }),
    (error) =>
      error instanceof BackupError &&
      error.code === "IntegrityValidationFailed",
  );
  assert.equal(databaseRestored, false);
  const finalUpdate = fixture.drillUpdates.at(-1);
  assert.ok(finalUpdate);
  assert.equal(finalUpdate.status, "Failed");
  assert.equal(finalUpdate.error_code, "IntegrityValidationFailed");
});

test("failed restore validation records RecoveryDrill Failed rather than Passed", async () => {
  const fixture = recoveryFixture();
  await assert.rejects(
    runRecoveryDrill(backupConfig, recoveryConfig, {
      sourceClient: fixture.sourceClient,
      targetClient: fixture.targetClient,
      objectStore: fixture.store,
      async restoreDatabase() {
        throw new BackupError("ValidationFailed");
      },
    }),
    /ValidationFailed/,
  );
  const finalUpdate = fixture.drillUpdates.at(-1);
  assert.ok(finalUpdate);
  assert.equal(finalUpdate.status, "Failed");
  assert.equal(finalUpdate.database_validation, "Failed");
});

function toRowIntegrity(bytes: Uint8Array) {
  const integrity = artifactIntegrity(bytes);
  return { size_bytes: integrity.sizeBytes, sha256: integrity.sha256 };
}

function selectionChain(result: unknown) {
  type Chain = {
    select: () => Chain;
    eq: () => Chain;
    order: () => Chain;
    limit: () => Chain;
    maybeSingle: () => Promise<unknown>;
    then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
  };
  const chain = {} as Chain;
  Object.assign(chain, {
    select() {
      return chain;
    },
    eq() {
      return chain;
    },
    order() {
      return chain;
    },
    limit() {
      return chain;
    },
    async maybeSingle() {
      return result;
    },
    then(resolve: (value: unknown) => unknown) {
      return Promise.resolve(result).then(resolve);
    },
  });
  return chain;
}

function updateChain() {
  const result = { error: null };
  type Chain = {
    eq: () => Chain;
    then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
  };
  const chain = {} as Chain;
  Object.assign(chain, {
    eq() {
      return chain;
    },
    then(resolve: (value: unknown) => unknown) {
      return Promise.resolve(result).then(resolve);
    },
  });
  return chain;
}
