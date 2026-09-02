import type { AppRole } from "../auth.ts";
import {
  DEFAULT_BACKUP_RETENTION_DAYS,
  RPO_TARGET_HOURS,
  RTO_TARGET_HOURS,
} from "./backup-domain.ts";

export function canReadBackupStatus(role: AppRole) {
  return role === "Owner/Admin";
}

export function backupPolicyStatus(
  retentionDays = DEFAULT_BACKUP_RETENTION_DAYS,
) {
  return {
    retentionDays,
    rpoTargetHours: RPO_TARGET_HOURS,
    rtoTargetHours: RTO_TARGET_HOURS,
    targetsAreGuaranteedSla: false,
  };
}
