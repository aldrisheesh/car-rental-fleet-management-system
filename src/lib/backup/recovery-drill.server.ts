import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../supabase/database.types.ts";
import type {
  BackupRunnerConfig,
  RecoveryDrillConfig,
} from "./backup-config.server.ts";
import {
  BackupError,
  normalizeBackupError,
  parseStorageManifest,
  PROTECTED_STORAGE_BUCKETS,
  verifyArtifactIntegrity,
  type BackupObjectStore,
  type StorageManifest,
} from "./backup-domain.ts";
import { R2BackupObjectStore } from "./r2-backup-object-store.server.ts";

type ArtifactRow = {
  artifact_type: "Database" | "Storage";
  artifact_key: string;
  size_bytes: number;
  sha256: string;
};

const REQUIRED_DATABASE_ARTIFACTS = ["roles.sql", "schema.sql", "data.sql"];
const ESSENTIAL_TABLES = [
  "profiles",
  "booking_requests",
  "renter_requirement_documents",
  "payments",
  "payment_proofs",
  "backup_runs",
];

export async function runRecoveryDrill(
  backupConfig: BackupRunnerConfig,
  recoveryConfig: RecoveryDrillConfig,
  dependencies?: {
    sourceClient?: SupabaseClient<Database>;
    targetClient?: SupabaseClient<Database>;
    objectStore?: BackupObjectStore;
    restoreDatabase?: typeof restoreDatabase;
  },
) {
  const sourceClient =
    dependencies?.sourceClient ??
    createClient<Database>(
      backupConfig.supabaseUrl,
      backupConfig.supabaseServiceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  const targetClient =
    dependencies?.targetClient ??
    createClient<Database>(
      recoveryConfig.targetSupabaseUrl,
      recoveryConfig.targetSupabaseServiceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  const objectStore =
    dependencies?.objectStore ??
    new R2BackupObjectStore(backupConfig.r2BucketName, {
      accountId: backupConfig.r2AccountId,
      accessKeyId: backupConfig.r2AccessKeyId,
      secretAccessKey: backupConfig.r2SecretAccessKey,
    });

  let runQuery = sourceClient
    .from("backup_runs")
    .select("id")
    .eq("status", "Completed")
    .order("completed_at", { ascending: false })
    .limit(1);
  if (recoveryConfig.selectedRunId)
    runQuery = runQuery.eq("id", recoveryConfig.selectedRunId);
  const selected = await runQuery.maybeSingle();
  if (selected.error || !selected.data)
    throw new BackupError("ConfigurationError");

  const created = await sourceClient
    .from("recovery_drills")
    .insert({
      backup_run_id: selected.data.id,
      target_environment: "NonProduction",
      status: "Running",
      database_validation: "Pending",
      storage_validation: "Pending",
    })
    .select("id")
    .single();
  if (created.error || !created.data)
    throw new BackupError("UnknownBackupError");
  const drillId = created.data.id;
  let databaseValidation: "Pending" | "Passed" | "Failed" = "Pending";
  let storageValidation: "Pending" | "Passed" | "Failed" = "Pending";

  try {
    const artifactsResult = await sourceClient
      .from("backup_artifacts")
      .select("artifact_type,artifact_key,size_bytes,sha256")
      .eq("backup_run_id", selected.data.id)
      .eq("status", "Completed");
    if (artifactsResult.error) throw new BackupError("RestoreFailed");
    const artifacts = (artifactsResult.data ?? []) as ArtifactRow[];
    const downloaded = new Map<string, Uint8Array>();

    // This loop intentionally finishes before either target is mutated.
    for (const artifact of artifacts) {
      const bytes = await objectStore.get(artifact.artifact_key);
      verifyArtifactIntegrity(bytes, {
        sizeBytes: artifact.size_bytes,
        sha256: artifact.sha256,
      });
      downloaded.set(artifact.artifact_key, bytes);
    }
    const databaseArtifacts = requireDatabaseArtifacts(artifacts);
    const manifests = requireStorageManifests(artifacts, downloaded);

    const directory = await mkdtemp(join(tmpdir(), "briahs-recovery-drill-"));
    try {
      const files: Record<string, string> = {};
      for (const artifact of databaseArtifacts) {
        const name = basename(artifact.artifact_key);
        const file = join(directory, name);
        await writeFile(file, downloaded.get(artifact.artifact_key)!);
        files[name] = file;
      }
      await (dependencies?.restoreDatabase ?? restoreDatabase)(
        recoveryConfig.targetDatabaseUrl,
        files,
      );
      databaseValidation = "Passed";
    } finally {
      await rm(directory, { recursive: true, force: true });
    }

    await restoreAndValidateStorage(targetClient, manifests, downloaded);
    storageValidation = "Passed";
    const updated = await sourceClient
      .from("recovery_drills")
      .update({
        status: "Passed",
        completed_at: new Date().toISOString(),
        database_validation: databaseValidation,
        storage_validation: storageValidation,
        error_code: null,
        remarks: "Database and Storage restoration validation passed.",
      })
      .eq("id", drillId)
      .eq("status", "Running");
    if (updated.error) throw new BackupError("UnknownBackupError");
    return {
      drillId,
      backupRunId: selected.data.id,
      status: "Passed" as const,
    };
  } catch (error) {
    const safe = normalizeBackupError(error);
    if (databaseValidation === "Pending") databaseValidation = "Failed";
    else if (storageValidation === "Pending") storageValidation = "Failed";
    await sourceClient
      .from("recovery_drills")
      .update({
        status: "Failed",
        completed_at: new Date().toISOString(),
        database_validation: databaseValidation,
        storage_validation: storageValidation,
        error_code: recoveryErrorCode(safe),
        remarks: "Recovery drill restoration or validation did not pass.",
      })
      .eq("id", drillId)
      .eq("status", "Running");
    throw safe;
  }
}

export async function restoreDatabase(
  databaseUrl: string,
  files: Record<string, string>,
) {
  const connectionEnv = postgresConnectionEnv(databaseUrl);
  for (const name of REQUIRED_DATABASE_ARTIFACTS) {
    if (!files[name]) throw new BackupError("IntegrityValidationFailed");
    await runPsql(
      ["--set", "ON_ERROR_STOP=on", "--file", files[name]],
      connectionEnv,
    );
  }
  const tableCount = await runPsql(
    [
      "--tuples-only",
      "--no-align",
      "--command",
      `select count(*) from information_schema.tables where table_schema='public' and table_name in (${ESSENTIAL_TABLES.map((table) => `'${table}'`).join(",")});`,
    ],
    connectionEnv,
    true,
  );
  if (Number(tableCount.trim()) !== ESSENTIAL_TABLES.length)
    throw new BackupError("ValidationFailed");
  const readableCount = await runPsql(
    [
      "--tuples-only",
      "--no-align",
      "--command",
      "select (select count(*) from public.profiles) + (select count(*) from public.booking_requests);",
    ],
    connectionEnv,
    true,
  );
  if (!/^\d+$/.test(readableCount.trim()))
    throw new BackupError("ValidationFailed");
}

function requireDatabaseArtifacts(artifacts: ArtifactRow[]) {
  const database = artifacts.filter(
    (artifact) => artifact.artifact_type === "Database",
  );
  for (const name of REQUIRED_DATABASE_ARTIFACTS) {
    if (
      !database.some((artifact) => artifact.artifact_key.endsWith(`/${name}`))
    )
      throw new BackupError("IntegrityValidationFailed");
  }
  return database;
}

function requireStorageManifests(
  artifacts: ArtifactRow[],
  downloaded: Map<string, Uint8Array>,
) {
  const manifests = artifacts
    .filter(
      (artifact) =>
        artifact.artifact_type === "Storage" &&
        artifact.artifact_key.endsWith("/manifest.json"),
    )
    .map((artifact) =>
      parseStorageManifest(downloaded.get(artifact.artifact_key)!),
    );
  for (const bucket of PROTECTED_STORAGE_BUCKETS) {
    if (!manifests.some((manifest) => manifest.bucket === bucket))
      throw new BackupError("IntegrityValidationFailed");
  }
  for (const manifest of manifests) {
    for (const object of manifest.objects) {
      const artifact = artifacts.find(
        (candidate) => candidate.artifact_key === object.artifactKey,
      );
      if (
        !artifact ||
        artifact.artifact_type !== "Storage" ||
        artifact.size_bytes !== object.sizeBytes ||
        artifact.sha256 !== object.sha256 ||
        !downloaded.has(object.artifactKey)
      )
        throw new BackupError("IntegrityValidationFailed");
    }
  }
  return manifests;
}

async function restoreAndValidateStorage(
  targetClient: SupabaseClient<Database>,
  manifests: StorageManifest[],
  downloaded: Map<string, Uint8Array>,
) {
  for (const manifest of manifests) {
    const bucket = await targetClient.storage.getBucket(manifest.bucket);
    if (bucket.error || !bucket.data || bucket.data.public)
      throw new BackupError("RestoreFailed");
    for (const object of manifest.objects) {
      const bytes = downloaded.get(object.artifactKey)!;
      const uploaded = await targetClient.storage
        .from(manifest.bucket)
        .upload(object.path, bytes, {
          upsert: true,
          contentType: "application/octet-stream",
        });
      if (uploaded.error) throw new BackupError("RestoreFailed");
      const restored = await targetClient.storage
        .from(manifest.bucket)
        .download(object.path);
      if (restored.error || !restored.data)
        throw new BackupError("ValidationFailed");
      verifyArtifactIntegrity(
        new Uint8Array(await restored.data.arrayBuffer()),
        object,
      );
    }
  }
}

function postgresConnectionEnv(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:")
      throw new Error("invalid");
    const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
    if (!url.hostname || !url.username || !database) throw new Error("invalid");
    return {
      ...process.env,
      PGHOST: url.hostname,
      PGPORT: url.port || "5432",
      PGUSER: decodeURIComponent(url.username),
      PGPASSWORD: decodeURIComponent(url.password),
      PGDATABASE: database,
      PGSSLMODE: url.searchParams.get("sslmode") || "require",
    };
  } catch {
    throw new BackupError("ConfigurationError");
  }
}

function runPsql(args: string[], env: NodeJS.ProcessEnv, capture = false) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn("psql", args, {
      stdio: ["ignore", capture ? "pipe" : "ignore", "ignore"],
      env,
      shell: false,
    });
    let output = "";
    if (capture)
      child.stdout?.on("data", (chunk) => {
        output += String(chunk).slice(0, 1000);
      });
    child.on("error", () => reject(new BackupError("RestoreFailed")));
    child.on("exit", (code) =>
      code === 0 ? resolve(output) : reject(new BackupError("RestoreFailed")),
    );
  });
}

function recoveryErrorCode(error: BackupError) {
  return [
    "ConfigurationError",
    "IntegrityValidationFailed",
    "RestoreFailed",
    "ValidationFailed",
    "UnknownBackupError",
  ].includes(error.code)
    ? error.code
    : "UnknownBackupError";
}
