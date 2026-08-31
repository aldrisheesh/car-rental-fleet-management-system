export type PreventiveTargetRecord = {
  status: string;
  maintenance_type?: string | null;
  next_service_odometer: number | null;
  next_service_date: string | null;
  created_at?: string;
  completed_at?: string | null;
};

/** Latest completed target per service type supersedes older preventive targets. */
export function selectAuthoritativePreventiveTargets(
  records: PreventiveTargetRecord[],
) {
  const latest = new Map<string, PreventiveTargetRecord>();
  for (const record of records) {
    if (
      record.status !== "Completed" ||
      (record.next_service_odometer == null && record.next_service_date == null)
    )
      continue;
    const key = record.maintenance_type?.trim() || "__uncategorized__";
    const previous = latest.get(key);
    if (
      !previous ||
      String(record.completed_at ?? "") > String(previous.completed_at ?? "") ||
      (record.completed_at === previous.completed_at &&
        String(record.created_at ?? "") > String(previous.created_at ?? ""))
    )
      latest.set(key, record);
  }
  return [...latest.values()];
}
