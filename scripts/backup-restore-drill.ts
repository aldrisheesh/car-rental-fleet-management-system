import {
  parseBackupRunnerConfig,
  parseRecoveryDrillConfig,
} from "../src/lib/backup/backup-config.server.ts";
import { normalizeBackupError } from "../src/lib/backup/backup-domain.ts";
import { runRecoveryDrill } from "../src/lib/backup/recovery-drill.server.ts";

try {
  const result = await runRecoveryDrill(
    parseBackupRunnerConfig(process.env),
    parseRecoveryDrillConfig(process.env),
  );
  console.log(JSON.stringify(result));
} catch (error) {
  const safe = normalizeBackupError(error);
  console.error(JSON.stringify({ status: "Failed", errorCode: safe.code }));
  process.exitCode = 1;
}
