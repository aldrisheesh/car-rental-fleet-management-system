import assert from "node:assert/strict";
import test from "node:test";

import { BackupError } from "./backup-domain.ts";
import { R2BackupObjectStore } from "./r2-backup-object-store.server.ts";

test("R2 adapter provides put, get, paginated list, and delete through a mock", async () => {
  const commandNames: string[] = [];
  let listPage = 0;
  const client = {
    async send(command: unknown) {
      const commandName = (command as { constructor: { name: string } })
        .constructor.name;
      commandNames.push(commandName);
      if (commandName === "GetObjectCommand")
        return {
          Body: {
            async transformToByteArray() {
              return Uint8Array.from([1, 2, 3]);
            },
          },
        };
      if (commandName === "ListObjectsV2Command") {
        listPage += 1;
        return listPage === 1
          ? {
              Contents: [{ Key: "backup-runs/a" }],
              IsTruncated: true,
              NextContinuationToken: "next",
            }
          : { Contents: [{ Key: "backup-runs/b" }], IsTruncated: false };
      }
      return {};
    },
  };
  const store = new R2BackupObjectStore("private-test-bucket", { client });
  await store.put({ key: "backup-runs/a", bytes: Uint8Array.from([1]) });
  assert.deepEqual(
    await store.get("backup-runs/a"),
    Uint8Array.from([1, 2, 3]),
  );
  assert.deepEqual(await store.list("backup-runs"), [
    "backup-runs/a",
    "backup-runs/b",
  ]);
  await store.delete("backup-runs/a");
  assert.deepEqual(commandNames, [
    "PutObjectCommand",
    "GetObjectCommand",
    "ListObjectsV2Command",
    "ListObjectsV2Command",
    "DeleteObjectCommand",
  ]);
});

test("R2 provider errors are normalized without provider details", async () => {
  const secretProviderMessage = "signature contains never-print-this-secret";
  const store = new R2BackupObjectStore("private-test-bucket", {
    client: {
      async send() {
        throw new Error(secretProviderMessage);
      },
    },
  });
  await assert.rejects(
    store.put({ key: "backup-runs/a", bytes: Uint8Array.from([1]) }),
    (error) =>
      error instanceof BackupError &&
      error.code === "ArtifactUploadFailed" &&
      !String(error).includes(secretProviderMessage),
  );
  await assert.rejects(store.get("backup-runs/a"), /IntegrityValidationFailed/);
  await assert.rejects(store.list("backup-runs"), /UnknownBackupError/);
  await assert.rejects(store.delete("backup-runs/a"), /RetentionCleanupFailed/);
});
