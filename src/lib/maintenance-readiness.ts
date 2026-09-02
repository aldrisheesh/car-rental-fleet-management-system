export type PreventiveTargetRecord = {
  status: string;
  maintenance_type?: string | null;
  next_service_odometer: number | null;
  next_service_date: string | null;
  created_at?: string;
  completed_at?: string | null;
};

export type MaintenanceReadinessReason =
  | "Vehicle inactive"
  | "Active blocking maintenance"
  | "Preventive maintenance due by date"
  | "Preventive maintenance due by odometer"
  | "Vehicle condition blocks rental use"
  | "Current odometer unavailable for recorded service target";

export type MaintenanceReadinessRecord = PreventiveTargetRecord & {
  blocks_rental_use?: boolean | null;
};

export type MaintenanceReadinessVehicle = {
  is_active: boolean;
  current_odometer_km: number | null;
  condition_blocks_rental_use: boolean;
};

export type MaintenanceReadiness = {
  maintenanceReady: boolean;
  reasons: MaintenanceReadinessReason[];
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

export function evaluateMaintenanceReadiness(
  vehicle: MaintenanceReadinessVehicle | null,
  records: MaintenanceReadinessRecord[],
  today = new Date().toISOString().slice(0, 10),
): MaintenanceReadiness {
  if (!vehicle)
    return { maintenanceReady: false, reasons: ["Vehicle inactive"] };

  const reasons: MaintenanceReadinessReason[] = [];
  if (!vehicle.is_active) reasons.push("Vehicle inactive");
  if (
    records.some(
      (record) => record.status === "Open" && record.blocks_rental_use,
    )
  )
    reasons.push("Active blocking maintenance");

  const targetRecords = selectAuthoritativePreventiveTargets(records);
  if (
    targetRecords.some(
      (record) =>
        record.next_service_date != null && record.next_service_date <= today,
    )
  )
    reasons.push("Preventive maintenance due by date");

  const odometerTargets = targetRecords.filter(
    (record) => record.next_service_odometer != null,
  );
  if (odometerTargets.length > 0 && vehicle.current_odometer_km == null)
    reasons.push("Current odometer unavailable for recorded service target");
  else if (
    odometerTargets.some(
      (record) =>
        Number(vehicle.current_odometer_km) >=
        Number(record.next_service_odometer),
    )
  )
    reasons.push("Preventive maintenance due by odometer");

  if (vehicle.condition_blocks_rental_use)
    reasons.push("Vehicle condition blocks rental use");

  return { maintenanceReady: reasons.length === 0, reasons };
}
