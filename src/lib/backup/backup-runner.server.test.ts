import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../supabase/database.types.ts";
import type { BackupObjectStore } from "./backup-domain.ts";
import {
  backupStorageComponent,
  recordBackupConfigurationFailure,
} from "./backup-runner.server.ts";

function storageClient(options?: { failPaymentUpload?: boolean }) {
  const visitedBuckets: string[] = [];
  const inserted: Array<Record<string, unknown>> = [];
  const files: Record<string, Record<string, Uint8Array>> = {
    "renter-requirements": {
      "customer-a/id.pdf": new TextEncoder().encode("id"),
    },
    "payment-proofs": {
      "customer-a/proof.png": new TextEncoder().encode("proof"),
    },
  };
  const client = {
    storage: {
      from(bucket: string) {
        visitedBuckets.push(bucket);
        return {
          async list(folder: string) {
            if (!folder)
              return { data: [{ name: "customer-a", id: null }], error: null };
            return {
              data: Object.keys(files[bucket] ?? {})
                .filter((path) => path.startsWith(`${folder}/`))
                .map((path) => ({
                  name: path.slice(folder.length + 1),
                  id: "object-id",
                })),
              error: null,
            };
          },
          async download(path: string) {
            const bytes = files[bucket]?.[path];
            return bytes
              ? {
                  data: new Blob([bytes.slice().buffer as ArrayBuffer]),
                  error: null,
                }
              : { data: null, error: new Error("missing") };
          },
        };
      },
    },
    from(table: string) {
      assert.equal(table, "backup_artifacts");
      return {
        async insert(row: Record<string, unknown>) {
          inserted.push(row);
          return { error: null };
        },
      };
    },
  };
  const uploaded: string[] = [];
  const store: BackupObjectStore = {
    async put(object) {
      if (
        options?.failPaymentUpload &&
        object.key.includes("payment-proofs/objects")
      )
        throw new Error("provider failure");
      uploaded.push(object.key);
    },
    async get() {
      return new Uint8Array();
    },
    async list() {
      return [];
    },
    async delete() {},
  };
  return {
    client: client as unknown as SupabaseClient<Database>,
    store,
    visitedBuckets,
    inserted,
    uploaded,
  };
}

test("Storage backup includes canonical buckets, preserves paths, and excludes unrelated buckets", async () => {
  const fixture = storageClient();
  const outcome = await backupStorageComponent(
    "run-id",
    "backup-runs/2026/09/03/run-id",
    fixture.client,
    fixture.store,
  );
  assert.equal(outcome, "Completed");
  assert.deepEqual(
    [...new Set(fixture.visitedBuckets)],
    ["renter-requirements", "payment-proofs"],
  );
  assert.equal(fixture.visitedBuckets.includes("public-images"), false);
  assert.equal(
    fixture.uploaded.some((key) =>
      key.endsWith("payment-proofs/objects/customer-a/proof.png"),
    ),
    true,
  );
  assert.equal(
    fixture.inserted.every((row) => row.artifact_type === "Storage"),
    true,
  );
});

test("one Storage object upload failure makes the component Failed without touching business tables", async () => {
  const fixture = storageClient({ failPaymentUpload: true });
  const outcome = await backupStorageComponent(
    "run-id",
    "backup-runs/2026/09/03/run-id",
    fixture.client,
    fixture.store,
  );
  assert.equal(outcome, "Failed");
  assert.equal(
    fixture.inserted.some(
      (row) =>
        row.status === "Failed" &&
        String(row.artifact_key).includes("payment-proofs"),
    ),
    true,
  );
});

test("configuration failure persists one safe Failed run when metadata access exists", async () => {
  const inserted: Array<Record<string, unknown>> = [];
  const client = {
    from(table: string) {
      assert.equal(table, "backup_runs");
      return {
        insert(row: Record<string, unknown>) {
          inserted.push(row);
          return {
            select() {
              return {
                async maybeSingle() {
                  return { data: { id: "failed-run-id" }, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
  const id = await recordBackupConfigurationFailure(
    {
      SUPABASE_URL: "https://configured.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "configured-service-key",
      BACKUP_TRIGGER: "Scheduled",
    },
    client as unknown as SupabaseClient<Database>,
  );
  assert.equal(id, "failed-run-id");
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0]?.status, "Failed");
  assert.equal(inserted[0]?.error_code, "ConfigurationError");
  assert.equal(
    JSON.stringify(inserted).includes("configured-service-key"),
    false,
  );
});
