import {
  BackupError,
  DEFAULT_BACKUP_RETENTION_DAYS,
  type BackupTrigger,
} from "./backup-domain.ts";

export type ConfigState = "CONFIGURED" | "ABSENT" | "PLACEHOLDER";

export type BackupRunnerConfig = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  retentionDays: number;
  databaseSource: "local" | "linked";
  trigger: BackupTrigger;
};

export type RecoveryDrillConfig = {
  targetDatabaseUrl: string;
  targetSupabaseUrl: string;
  targetSupabaseServiceRoleKey: string;
  selectedRunId?: string;
};

const PLACEHOLDER = /(your-|replace-|placeholder|changeme|example\.(com|co))/i;

export function classifyConfigValue(value: unknown): ConfigState {
  if (typeof value !== "string" || value.trim() === "") return "ABSENT";
  return PLACEHOLDER.test(value.trim()) ? "PLACEHOLDER" : "CONFIGURED";
}

export function parseRetentionDays(value: unknown) {
  if (value == null || value === "") return DEFAULT_BACKUP_RETENTION_DAYS;
  const days = Number(value);
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650)
    throw new BackupError("ConfigurationError");
  return days;
}

export function parseBackupRunnerConfig(
  values: Record<string, unknown>,
): BackupRunnerConfig {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
  ] as const;
  if (required.some((key) => classifyConfigValue(values[key]) !== "CONFIGURED"))
    throw new BackupError("ConfigurationError");

  const databaseSource = values.BACKUP_DATABASE_SOURCE;
  if (databaseSource !== "local" && databaseSource !== "linked")
    throw new BackupError("ConfigurationError");
  const trigger = values.BACKUP_TRIGGER ?? "Manual";
  if (trigger !== "Scheduled" && trigger !== "Manual")
    throw new BackupError("ConfigurationError");

  return {
    supabaseUrl: String(values.SUPABASE_URL).trim(),
    supabaseServiceRoleKey: String(values.SUPABASE_SERVICE_ROLE_KEY).trim(),
    r2AccountId: String(values.R2_ACCOUNT_ID).trim(),
    r2AccessKeyId: String(values.R2_ACCESS_KEY_ID).trim(),
    r2SecretAccessKey: String(values.R2_SECRET_ACCESS_KEY).trim(),
    r2BucketName: String(values.R2_BUCKET_NAME).trim(),
    retentionDays: parseRetentionDays(values.BACKUP_RETENTION_DAYS),
    databaseSource,
    trigger,
  };
}

export function parseRecoveryDrillConfig(
  values: Record<string, unknown>,
): RecoveryDrillConfig {
  const required = [
    "RECOVERY_TARGET_DATABASE_URL",
    "RECOVERY_TARGET_SUPABASE_URL",
    "RECOVERY_TARGET_SUPABASE_SERVICE_ROLE_KEY",
  ] as const;
  if (
    values.RECOVERY_TARGET_ENV !== "nonproduction" ||
    values.RECOVERY_DRILL_CONFIRM !== "RESTORE_ISOLATED_NONPRODUCTION" ||
    required.some((key) => classifyConfigValue(values[key]) !== "CONFIGURED")
  ) {
    throw new BackupError("ConfigurationError");
  }
  const sourceUrl = String(values.SUPABASE_URL ?? "").replace(/\/$/, "");
  const targetUrl = String(values.RECOVERY_TARGET_SUPABASE_URL).replace(
    /\/$/,
    "",
  );
  const targetDatabaseUrl = String(values.RECOVERY_TARGET_DATABASE_URL).trim();
  if (
    !sourceUrl ||
    sourceUrl === targetUrl ||
    looksLikeProductionTarget(targetUrl) ||
    looksLikeProductionTarget(targetDatabaseUrl) ||
    (classifyConfigValue(values.PRODUCTION_DATABASE_URL) === "CONFIGURED" &&
      targetDatabaseUrl === String(values.PRODUCTION_DATABASE_URL).trim())
  )
    throw new BackupError("ConfigurationError");

  const selectedRunId =
    typeof values.BACKUP_RUN_ID === "string" && values.BACKUP_RUN_ID.trim()
      ? values.BACKUP_RUN_ID.trim()
      : undefined;
  return {
    targetDatabaseUrl,
    targetSupabaseUrl: targetUrl,
    targetSupabaseServiceRoleKey: String(
      values.RECOVERY_TARGET_SUPABASE_SERVICE_ROLE_KEY,
    ).trim(),
    selectedRunId,
  };
}

function looksLikeProductionTarget(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return /(^|[._-])prod(uction)?([._-]|$)/.test(hostname);
  } catch {
    return true;
  }
}
