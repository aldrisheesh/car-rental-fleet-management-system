import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../supabase/database.types.ts";
import { parseRetentionDays } from "./backup-config.server.ts";
import { backupPolicyStatus } from "./backup-status.ts";

export async function readBackupStatus(
  client: SupabaseClient<Database>,
  retentionValue: unknown,
) {
  const [latest, latestSuccessful, latestDrill] = await Promise.all([
    client
      .from("backup_runs")
      .select(
        "id,trigger,status,started_at,completed_at,retention_until,error_code,remarks",
      )
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("backup_runs")
      .select("id,started_at,completed_at,retention_until")
      .eq("status", "Completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("recovery_drills")
      .select(
        "id,backup_run_id,target_environment,status,started_at,completed_at,database_validation,storage_validation,error_code,remarks",
      )
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (latest.error || latestSuccessful.error || latestDrill.error)
    throw new Error("backup_status_unavailable");

  const latestComponents = latest.data
    ? Object.fromEntries(
        await Promise.all(
          (["Database", "Storage"] as const).map(async (type) => [
            type,
            await readComponentStatus(client, latest.data!.id, type),
          ]),
        ),
      )
    : null;

  return {
    latestRun: latest.data,
    latestSuccessfulRun: latestSuccessful.data,
    latestComponents,
    latestRecoveryDrill: latestDrill.data,
    policy: backupPolicyStatus(parseRetentionDays(retentionValue)),
  };
}

async function readComponentStatus(
  client: SupabaseClient<Database>,
  runId: string,
  artifactType: "Database" | "Storage",
) {
  const base = () =>
    client
      .from("backup_artifacts")
      .select("id", { count: "exact", head: true })
      .eq("backup_run_id", runId)
      .eq("artifact_type", artifactType);
  const [completed, failed, latest] = await Promise.all([
    base().eq("status", "Completed"),
    base().eq("status", "Failed"),
    client
      .from("backup_artifacts")
      .select("status,size_bytes,sha256,created_at")
      .eq("backup_run_id", runId)
      .eq("artifact_type", artifactType)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (completed.error || failed.error || latest.error)
    throw new Error("backup_status_unavailable");
  return {
    completedArtifactCount: completed.count ?? 0,
    failedArtifactCount: failed.count ?? 0,
    latestArtifact: latest.data,
  };
}
