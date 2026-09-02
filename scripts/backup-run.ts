import { parseBackupRunnerConfig } from "../src/lib/backup/backup-config.server.ts";
import { normalizeBackupError } from "../src/lib/backup/backup-domain.ts";
import {
  recordBackupConfigurationFailure,
  runBackup,
} from "../src/lib/backup/backup-runner.server.ts";

try {
  const config = parseBackupRunnerConfig(process.env);
  const result = await runBackup(config);
  console.log(
    JSON.stringify({
      backupRunId: result.runId,
      status: result.status,
      errorCode: result.errorCode,
    }),
  );
  if (result.status !== "Completed") process.exitCode = 1;
} catch (error) {
  const safe = normalizeBackupError(error);
  let backupRunId: string | null = null;
  if (safe.code === "ConfigurationError") {
    try {
      backupRunId = await recordBackupConfigurationFailure(process.env);
    } catch {
      // A missing metadata boundary remains a safe standalone configuration failure.
    }
  }
  console.error(
    JSON.stringify({ status: "Failed", errorCode: safe.code, backupRunId }),
  );
  process.exitCode = 1;
}
