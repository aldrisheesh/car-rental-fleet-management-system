import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../supabase/database.types.ts";
import {
  classifyConfigValue,
  parseRetentionDays,
  type BackupRunnerConfig,
} from "./backup-config.server.ts";
import {
  artifactIntegrity,
  backupRunPrefix,
  BackupError,
  databaseArtifactKey,
  deriveBackupRunStatus,
  normalizeBackupError,
  PROTECTED_STORAGE_BUCKETS,
  retentionDeletionCandidates,
  storageManifestArtifactKey,
  storageObjectArtifactKey,
  type BackupArtifactStatus,
  type BackupArtifactType,
  type BackupObjectStore,
  type ComponentOutcome,
  type StorageManifest,
} from "./backup-domain.ts";
import { R2BackupObjectStore } from "./r2-backup-object-store.server.ts";

type BackupArtifactInsert = {
  backup_run_id: string;
  artifact_type: BackupArtifactType;
  artifact_key: string;
  status: BackupArtifactStatus;
  size_bytes: number | null;
  sha256: string | null;
};

type ListedStorageObject = { name: string; id?: string | null };

export type BackupRunResult = {
  runId: string;
  status: "Completed" | "Partial" | "Failed";
  errorCode: string | null;
};

export async function recordBackupConfigurationFailure(
  values: Record<string, unknown>,
  clientOverride?: SupabaseClient<Database>,
) {
  if (
    classifyConfigValue(values.SUPABASE_URL) !== "CONFIGURED" ||
    classifyConfigValue(values.SUPABASE_SERVICE_ROLE_KEY) !== "CONFIGURED"
  )
    return null;
  const client =
    clientOverride ??
    createClient<Database>(
      String(values.SUPABASE_URL).trim(),
      String(values.SUPABASE_SERVICE_ROLE_KEY).trim(),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  const now = new Date();
  let retentionDays = 14;
  try {
    retentionDays = parseRetentionDays(values.BACKUP_RETENTION_DAYS);
  } catch {
    // Invalid policy is itself configuration failure; retain safe default metadata.
  }
  const trigger =
    values.BACKUP_TRIGGER === "Scheduled" ? "Scheduled" : "Manual";
  const result = await client
    .from("backup_runs")
    .insert({
      trigger,
      status: "Failed",
      started_at: now.toISOString(),
      completed_at: now.toISOString(),
      retention_until: new Date(
        now.getTime() + retentionDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      error_code: "ConfigurationError",
      remarks: "Backup tooling configuration validation failed.",
    })
    .select("id")
    .maybeSingle();
  return result.error ? null : (result.data?.id ?? null);
}

export async function runBackup(
  config: BackupRunnerConfig,
  dependencies?: {
    client?: SupabaseClient<Database>;
    objectStore?: BackupObjectStore;
    dumpDatabase?: typeof dumpDatabase;
  },
): Promise<BackupRunResult> {
  const client =
    dependencies?.client ??
    createClient<Database>(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  const objectStore =
    dependencies?.objectStore ??
    new R2BackupObjectStore(config.r2BucketName, {
      accountId: config.r2AccountId,
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    });
  const startedAt = new Date();
  const retentionUntil = new Date(
    startedAt.getTime() + config.retentionDays * 24 * 60 * 60 * 1000,
  );
  const created = await client
    .from("backup_runs")
    .insert({
      trigger: config.trigger,
      status: "Running",
      started_at: startedAt.toISOString(),
      retention_until: retentionUntil.toISOString(),
    })
    .select("id")
    .single();
  if (created.error || !created.data)
    throw new BackupError("UnknownBackupError");

  const runId = created.data.id;
  const prefix = backupRunPrefix(runId, startedAt);
  const outcomes: ComponentOutcome[] = [];
  let runError: BackupError | null = null;

  try {
    const databaseOutcome = await backupDatabaseComponent(
      runId,
      prefix,
      config.databaseSource,
      client,
      objectStore,
      dependencies?.dumpDatabase ?? dumpDatabase,
    );
    outcomes.push(databaseOutcome);
    if (databaseOutcome === "Failed")
      runError = new BackupError("DatabaseDumpFailed");
  } catch (error) {
    runError = normalizeBackupError(error);
    outcomes.push("Failed");
  }

  try {
    const storageOutcome = await backupStorageComponent(
      runId,
      prefix,
      client,
      objectStore,
    );
    outcomes.push(storageOutcome);
    if (storageOutcome === "Failed")
      runError ??= new BackupError("StorageObjectReadFailed");
  } catch (error) {
    runError ??= normalizeBackupError(error);
    outcomes.push("Failed");
  }

  const status = deriveBackupRunStatus(outcomes);
  const finished = await client
    .from("backup_runs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      error_code:
        status === "Completed"
          ? null
          : (runError?.code ?? "UnknownBackupError"),
      remarks: safeRunRemarks(status),
    })
    .eq("id", runId)
    .eq("status", "Running");
  if (finished.error) throw new BackupError("UnknownBackupError");

  try {
    await cleanupExpiredRecoverySets(client, objectStore, new Date());
  } catch {
    // Cleanup is independent of the completed attempt. It is retried by later runs.
  }
  return { runId, status, errorCode: runError?.code ?? null };
}

export async function backupStorageComponent(
  runId: string,
  prefix: string,
  client: SupabaseClient<Database>,
  objectStore: BackupObjectStore,
): Promise<ComponentOutcome> {
  let componentFailed = false;
  for (const bucket of PROTECTED_STORAGE_BUCKETS) {
    let paths: string[];
    try {
      paths = await listStorageObjects(client, bucket);
    } catch {
      componentFailed = true;
      await insertFailedArtifact(
        client,
        runId,
        "Storage",
        storageManifestArtifactKey(prefix, bucket),
      );
      continue;
    }

    const manifest: StorageManifest = { version: 1, bucket, objects: [] };
    let bucketFailed = false;
    for (const path of paths) {
      const key = storageObjectArtifactKey(prefix, bucket, path);
      try {
        const downloaded = await client.storage.from(bucket).download(path);
        if (downloaded.error || !downloaded.data)
          throw new BackupError("StorageObjectReadFailed");
        const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
        const integrity = artifactIntegrity(bytes);
        await objectStore.put({ key, bytes });
        await insertCompletedArtifact(client, runId, "Storage", key, integrity);
        manifest.objects.push({ path, artifactKey: key, ...integrity });
      } catch {
        bucketFailed = true;
        componentFailed = true;
        await insertFailedArtifact(client, runId, "Storage", key);
      }
    }

    const manifestKey = storageManifestArtifactKey(prefix, bucket);
    if (bucketFailed) {
      await insertFailedArtifact(client, runId, "Storage", manifestKey);
      continue;
    }
    const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
    try {
      await objectStore.put({ key: manifestKey, bytes: manifestBytes });
      await insertCompletedArtifact(
        client,
        runId,
        "Storage",
        manifestKey,
        artifactIntegrity(manifestBytes),
      );
    } catch {
      componentFailed = true;
      await insertFailedArtifact(client, runId, "Storage", manifestKey);
    }
  }
  return componentFailed ? "Failed" : "Completed";
}

export async function cleanupExpiredRecoverySets(
  client: SupabaseClient<Database>,
  objectStore: BackupObjectStore,
  now: Date,
) {
  const runs = await client
    .from("backup_runs")
    .select("id,status,retention_until,completed_at")
    .neq("status", "Running")
    .order("started_at", { ascending: false });
  if (runs.error) throw new BackupError("RetentionCleanupFailed");
  const candidates = retentionDeletionCandidates(
    (runs.data ?? []).map((run) => ({
      id: run.id,
      status: run.status,
      retentionUntil: new Date(run.retention_until),
      completedAt: run.completed_at ? new Date(run.completed_at) : null,
    })),
    now,
  );
  for (const candidate of candidates) {
    const artifacts = await client
      .from("backup_artifacts")
      .select("artifact_key")
      .eq("backup_run_id", candidate.id)
      .eq("status", "Completed");
    if (artifacts.error) throw new BackupError("RetentionCleanupFailed");
    for (const artifact of artifacts.data ?? [])
      await objectStore.delete(artifact.artifact_key);
    const deleted = await client
      .from("backup_artifacts")
      .delete()
      .eq("backup_run_id", candidate.id);
    if (deleted.error) throw new BackupError("RetentionCleanupFailed");
  }
}

async function backupDatabaseComponent(
  runId: string,
  prefix: string,
  source: "local" | "linked",
  client: SupabaseClient<Database>,
  objectStore: BackupObjectStore,
  dump: typeof dumpDatabase,
): Promise<ComponentOutcome> {
  const directory = await mkdtemp(join(tmpdir(), "briahs-backup-"));
  let failed = false;
  try {
    for (const specification of [
      { name: "roles.sql", flags: ["--role-only"] },
      { name: "schema.sql", flags: [] },
      { name: "data.sql", flags: ["--data-only", "--use-copy"] },
    ]) {
      const key = databaseArtifactKey(prefix, specification.name);
      try {
        const file = join(directory, specification.name);
        await dump(source, file, specification.flags);
        const bytes = new Uint8Array(await readFile(file));
        const integrity = artifactIntegrity(bytes);
        await objectStore.put({ key, bytes });
        await insertCompletedArtifact(
          client,
          runId,
          "Database",
          key,
          integrity,
        );
      } catch {
        failed = true;
        await insertFailedArtifact(client, runId, "Database", key);
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  return failed ? "Failed" : "Completed";
}

export function dumpDatabase(
  source: "local" | "linked",
  file: string,
  flags: string[],
) {
  return runCommand(
    "npx",
    [
      "--no-install",
      "supabase",
      "db",
      "dump",
      source === "local" ? "--local" : "--linked",
      "--file",
      file,
      ...flags,
    ],
    "DatabaseDumpFailed",
  );
}

async function listStorageObjects(
  client: SupabaseClient<Database>,
  bucket: string,
) {
  const paths: string[] = [];
  const visit = async (folder: string) => {
    let offset = 0;
    for (;;) {
      const result = await client.storage.from(bucket).list(folder, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (result.error) throw new BackupError("StorageEnumerationFailed");
      const entries = (result.data ?? []) as ListedStorageObject[];
      for (const entry of entries) {
        const path = folder ? `${folder}/${entry.name}` : entry.name;
        if (entry.id) paths.push(path);
        else await visit(path);
      }
      if (entries.length < 1000) break;
      offset += entries.length;
    }
  };
  await visit("");
  return paths.sort();
}

async function insertCompletedArtifact(
  client: SupabaseClient<Database>,
  runId: string,
  type: BackupArtifactType,
  key: string,
  integrity: { sizeBytes: number; sha256: string },
) {
  await insertArtifact(client, {
    backup_run_id: runId,
    artifact_type: type,
    artifact_key: key,
    status: "Completed",
    size_bytes: integrity.sizeBytes,
    sha256: integrity.sha256,
  });
}

async function insertFailedArtifact(
  client: SupabaseClient<Database>,
  runId: string,
  type: BackupArtifactType,
  key: string,
) {
  await insertArtifact(client, {
    backup_run_id: runId,
    artifact_type: type,
    artifact_key: key,
    status: "Failed",
    size_bytes: null,
    sha256: null,
  });
}

async function insertArtifact(
  client: SupabaseClient<Database>,
  artifact: BackupArtifactInsert,
) {
  const result = await client.from("backup_artifacts").insert(artifact);
  if (result.error) throw new BackupError("UnknownBackupError");
}

function runCommand(
  command: string,
  args: string[],
  errorCode: "DatabaseDumpFailed" | "RestoreFailed" | "ValidationFailed",
) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "ignore", "ignore"],
      env: process.env,
      shell: false,
    });
    child.on("error", () => reject(new BackupError(errorCode)));
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new BackupError(errorCode)),
    );
  });
}

function safeRunRemarks(status: "Completed" | "Partial" | "Failed") {
  if (status === "Completed")
    return "All required backup components completed.";
  if (status === "Partial")
    return "At least one required backup component did not complete.";
  return "No useful complete recovery set was produced.";
}
