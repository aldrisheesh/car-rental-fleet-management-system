import { getSupabaseServerClient } from "./supabase/server";

export type MaintenanceReadinessReason =
  | "Vehicle inactive"
  | "Active blocking maintenance"
  | "Preventive maintenance due by date"
  | "Preventive maintenance due by odometer"
  | "Vehicle condition blocks rental use"
  | "Current odometer unavailable for recorded service target";

export type MaintenanceReadiness = {
  maintenanceReady: boolean;
  reasons: MaintenanceReadinessReason[];
};

type PreventiveTargetRecord = {
  status: string;
  maintenance_type?: string | null;
  next_service_odometer: number | null;
  next_service_date: string | null;
  created_at?: string;
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
      String(record.created_at ?? "") > String(previous.created_at ?? "")
    )
      latest.set(key, record);
  }
  return [...latest.values()];
}

export async function calculateMaintenanceReadiness(
  vehicleId: string,
): Promise<MaintenanceReadiness> {
  const client = getSupabaseServerClient();
  const [
    { data: vehicle, error: vehicleError },
    { data: records, error: recordsError },
  ] = await Promise.all([
    client
      .from("vehicles")
      .select("id,is_active,current_odometer_km,condition_blocks_rental_use")
      .eq("id", vehicleId)
      .maybeSingle(),
    client
      .from("maintenance_records")
      .select(
        "status,blocks_rental_use,next_service_odometer,next_service_date",
      )
      .eq("vehicle_id", vehicleId),
  ]);
  if (vehicleError) throw vehicleError;
  if (recordsError) throw recordsError;
  if (!vehicle)
    return { maintenanceReady: false, reasons: ["Vehicle inactive"] };
  const reasons: MaintenanceReadinessReason[] = [];
  if (!vehicle.is_active) reasons.push("Vehicle inactive");
  const active = (records ?? []).filter((r) => r.status === "Open");
  if (active.some((r) => r.blocks_rental_use))
    reasons.push("Active blocking maintenance");
  const targetRecords = selectAuthoritativePreventiveTargets(records ?? []);
  const today = new Date().toISOString().slice(0, 10);
  if (
    targetRecords.some(
      (r) => r.next_service_date && r.next_service_date <= today,
    )
  )
    reasons.push("Preventive maintenance due by date");
  const odometerTargets = targetRecords.filter(
    (r) => r.next_service_odometer != null,
  );
  if (odometerTargets.some((r) => vehicle.current_odometer_km == null))
    reasons.push("Current odometer unavailable for recorded service target");
  else if (
    odometerTargets.some(
      (r) =>
        Number(vehicle.current_odometer_km) >= Number(r.next_service_odometer),
    )
  )
    reasons.push("Preventive maintenance due by odometer");
  if (vehicle.condition_blocks_rental_use)
    reasons.push("Vehicle condition blocks rental use");
  return { maintenanceReady: reasons.length === 0, reasons };
}

export async function getVehicleMaintenanceReadiness(vehicleId: string) {
  return calculateMaintenanceReadiness(vehicleId);
}
