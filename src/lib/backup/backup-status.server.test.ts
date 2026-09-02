import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../supabase/database.types.ts";
import { readBackupStatus } from "./backup-status.server.ts";

test("status read model returns safe metadata and operational targets only", async () => {
  let backupRunRead = 0;
  const client = {
    from(table: string) {
      if (table === "backup_runs") {
        backupRunRead += 1;
        return readChain({
          data:
            backupRunRead === 1
              ? {
                  id: "run-id",
                  trigger: "Scheduled",
                  status: "Completed",
                  started_at: "2026-09-03T00:00:00Z",
                  completed_at: "2026-09-03T00:05:00Z",
                  retention_until: "2026-09-17T00:00:00Z",
                  error_code: null,
                  remarks: "All required backup components completed.",
                }
              : {
                  id: "run-id",
                  started_at: "2026-09-03T00:00:00Z",
                  completed_at: "2026-09-03T00:05:00Z",
                  retention_until: "2026-09-17T00:00:00Z",
                },
          error: null,
        });
      }
      if (table === "recovery_drills")
        return readChain({ data: null, error: null });
      if (table === "backup_artifacts")
        return readChain({
          data: {
            status: "Completed",
            size_bytes: 10,
            sha256: "a".repeat(64),
            created_at: "2026-09-03T00:01:00Z",
          },
          error: null,
          count: 1,
        });
      throw new Error("unexpected table");
    },
  };
  const result = await readBackupStatus(
    client as unknown as SupabaseClient<Database>,
    "21",
  );
  assert.deepEqual(result.policy, {
    retentionDays: 21,
    rpoTargetHours: 24,
    rtoTargetHours: 4,
    targetsAreGuaranteedSla: false,
  });
  const serialized = JSON.stringify(result);
  for (const forbidden of [
    "R2_SECRET_ACCESS_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "databaseUrl",
    "signedUrl",
    "artifact_key",
  ])
    assert.equal(serialized.includes(forbidden), false);
});

function readChain(result: unknown) {
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
