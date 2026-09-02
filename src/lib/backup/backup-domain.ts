import { createHash } from "node:crypto";

export const PROTECTED_STORAGE_BUCKETS = [
  "renter-requirements",
  "payment-proofs",
] as const;
export const DEFAULT_BACKUP_RETENTION_DAYS = 14;
export const RPO_TARGET_HOURS = 24;
export const RTO_TARGET_HOURS = 4;

export type BackupTrigger = "Scheduled" | "Manual";
export type BackupRunStatus = "Running" | "Completed" | "Partial" | "Failed";
export type BackupArtifactType = "Database" | "Storage";
export type BackupArtifactStatus = "Completed" | "Failed";
export type RecoveryDrillStatus = "Running" | "Passed" | "Failed";
export type ComponentOutcome = "Completed" | "Failed";

export type BackupArtifactIntegrity = {
  sizeBytes: number;
  sha256: string;
};

export type BackupObject = {
  key: string;
  bytes: Uint8Array;
};

export type BackupObjectStore = {
  put(object: BackupObject): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  list(prefix: string): Promise<string[]>;
  delete(key: string): Promise<void>;
};

export type StorageManifest = {
  version: 1;
  bucket: string;
  objects: Array<{
    path: string;
    artifactKey: string;
    sizeBytes: number;
    sha256: string;
  }>;
};

export type BackupErrorCode =
  | "ConfigurationError"
  | "DatabaseDumpFailed"
  | "StorageEnumerationFailed"
  | "StorageObjectReadFailed"
  | "ArtifactUploadFailed"
  | "IntegrityValidationFailed"
  | "RetentionCleanupFailed"
  | "RestoreFailed"
  | "ValidationFailed"
  | "UnknownBackupError";

export class BackupError extends Error {
  readonly code: BackupErrorCode;

  constructor(code: BackupErrorCode) {
    super(code);
    this.code = code;
    this.name = "BackupError";
  }
}

export function deriveBackupRunStatus(
  outcomes: readonly ComponentOutcome[],
  fatal = false,
): Exclude<BackupRunStatus, "Running"> {
  if (fatal || outcomes.length === 0) return "Failed";
  const completed = outcomes.filter(
    (outcome) => outcome === "Completed",
  ).length;
  if (completed === outcomes.length) return "Completed";
  return completed > 0 ? "Partial" : "Failed";
}

export function artifactIntegrity(bytes: Uint8Array): BackupArtifactIntegrity {
  return {
    sizeBytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export function verifyArtifactIntegrity(
  bytes: Uint8Array,
  expected: BackupArtifactIntegrity,
) {
  const actual = artifactIntegrity(bytes);
  if (
    actual.sizeBytes !== expected.sizeBytes ||
    actual.sha256 !== expected.sha256
  ) {
    throw new BackupError("IntegrityValidationFailed");
  }
}

export function isSafeArtifactKey(key: string) {
  return (
    key.length > 0 &&
    key.length <= 1024 &&
    !key.startsWith("/") &&
    !key.includes("//") &&
    !key.split("/").includes("..") &&
    /^[A-Za-z0-9][A-Za-z0-9._~%/-]*$/.test(key)
  );
}

export function assertSafeArtifactKey(key: string) {
  if (!isSafeArtifactKey(key)) throw new BackupError("ConfigurationError");
  return key;
}

export function backupRunPrefix(runId: string, startedAt: Date) {
  const year = String(startedAt.getUTCFullYear()).padStart(4, "0");
  const month = String(startedAt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(startedAt.getUTCDate()).padStart(2, "0");
  return assertSafeArtifactKey(`backup-runs/${year}/${month}/${day}/${runId}`);
}

export function databaseArtifactKey(prefix: string, name: string) {
  return assertSafeArtifactKey(`${prefix}/database/${encodeSegment(name)}`);
}

export function storageObjectArtifactKey(
  prefix: string,
  bucket: string,
  objectPath: string,
) {
  const path = objectPath.split("/").map(encodeSegment).join("/");
  return assertSafeArtifactKey(
    `${prefix}/storage/${encodeSegment(bucket)}/objects/${path}`,
  );
}

export function storageManifestArtifactKey(prefix: string, bucket: string) {
  return assertSafeArtifactKey(
    `${prefix}/storage/${encodeSegment(bucket)}/manifest.json`,
  );
}

export function isSafeStorageObjectPath(path: string) {
  return (
    path.length > 0 &&
    path.length <= 1024 &&
    !path.startsWith("/") &&
    !path.includes("//") &&
    path.split("/").every((segment) => segment !== "." && segment !== "..")
  );
}

export function selectCanonicalStorageBuckets(bucketIds: readonly string[]) {
  const available = new Set(bucketIds);
  return PROTECTED_STORAGE_BUCKETS.filter((bucket) => available.has(bucket));
}

export function parseStorageManifest(bytes: Uint8Array): StorageManifest {
  try {
    const value = JSON.parse(
      new TextDecoder().decode(bytes),
    ) as StorageManifest;
    if (
      value.version !== 1 ||
      !PROTECTED_STORAGE_BUCKETS.includes(
        value.bucket as (typeof PROTECTED_STORAGE_BUCKETS)[number],
      ) ||
      !Array.isArray(value.objects) ||
      value.objects.some(
        (object) =>
          typeof object.path !== "string" ||
          !isSafeStorageObjectPath(object.path) ||
          typeof object.artifactKey !== "string" ||
          !isSafeArtifactKey(object.artifactKey) ||
          !Number.isSafeInteger(object.sizeBytes) ||
          object.sizeBytes < 0 ||
          !/^[0-9a-f]{64}$/.test(object.sha256),
      )
    ) {
      throw new Error("invalid");
    }
    return value;
  } catch {
    throw new BackupError("IntegrityValidationFailed");
  }
}

export function retentionDeletionCandidates<
  T extends {
    id: string;
    status: BackupRunStatus;
    retentionUntil: Date;
    completedAt?: Date | null;
  },
>(runs: readonly T[], now: Date) {
  const latestKnownGood = runs
    .filter((run) => run.status === "Completed")
    .sort((left, right) => {
      const leftTime =
        left.completedAt?.getTime() ?? left.retentionUntil.getTime();
      const rightTime =
        right.completedAt?.getTime() ?? right.retentionUntil.getTime();
      return rightTime - leftTime;
    })[0];
  return runs.filter(
    (run) =>
      run.status !== "Running" &&
      run.retentionUntil < now &&
      run.id !== latestKnownGood?.id,
  );
}

export function normalizeBackupError(error: unknown): BackupError {
  return error instanceof BackupError
    ? error
    : new BackupError("UnknownBackupError");
}

function encodeSegment(value: string) {
  if (!value || value === "." || value === "..")
    throw new BackupError("ConfigurationError");
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
