import { getSupabaseServerClient } from "./supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import { instantToManilaCalendarDate } from "./business-time";
import { evaluateMaintenanceReadiness } from "./maintenance-readiness";
export {
  evaluateMaintenanceReadiness,
  selectAuthoritativePreventiveTargets,
} from "./maintenance-readiness";
export type {
  MaintenanceReadiness,
  MaintenanceReadinessReason,
} from "./maintenance-readiness";

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
        "status,maintenance_type,blocks_rental_use,next_service_odometer,next_service_date,completed_at,created_at",
      )
      .eq("vehicle_id", vehicleId),
  ]);
  if (vehicleError) throw vehicleError;
  if (recordsError) throw recordsError;
  return evaluateMaintenanceReadiness(vehicle, records ?? []);
}

export async function getVehicleMaintenanceReadiness(vehicleId: string) {
  return calculateMaintenanceReadiness(vehicleId);
}

export type FleetMaintenanceReadinessItem = {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  maintenanceReady: boolean;
  reasons: import("./maintenance-readiness").MaintenanceReadinessReason[];
};

export type FleetMaintenanceReadinessVehicle = {
  vehicleId: string;
  branchId: string;
  isActive: boolean;
};

export type FleetMaintenanceReadiness = {
  readiness: FleetMaintenanceReadinessItem[];
  vehicles: FleetMaintenanceReadinessVehicle[];
};

export async function calculateFleetMaintenanceSnapshot(
  client: SupabaseClient<Database> = getSupabaseServerClient(),
  now = new Date(),
): Promise<FleetMaintenanceReadiness> {
  const [vehiclesResult, recordsResult] = await Promise.all([
    client
      .from("vehicles")
      .select(
        "id,name,license_plate,branch_id,is_active,current_odometer_km,condition_blocks_rental_use",
      )
      .order("name"),
    client
      .from("maintenance_records")
      .select(
        "vehicle_id,status,maintenance_type,blocks_rental_use,next_service_odometer,next_service_date,completed_at,created_at",
      ),
  ]);
  if (vehiclesResult.error) throw vehiclesResult.error;
  if (recordsResult.error) throw recordsResult.error;

  const recordsByVehicle = new Map<string, typeof recordsResult.data>();
  for (const record of recordsResult.data ?? []) {
    const records = recordsByVehicle.get(record.vehicle_id) ?? [];
    records.push(record);
    recordsByVehicle.set(record.vehicle_id, records);
  }

  const today = instantToManilaCalendarDate(now);
  const readiness = (vehiclesResult.data ?? []).map((vehicle) => ({
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    licensePlate: vehicle.license_plate,
    ...evaluateMaintenanceReadiness(
      vehicle,
      recordsByVehicle.get(vehicle.id) ?? [],
      today,
    ),
  }));
  return {
    readiness,
    vehicles: (vehiclesResult.data ?? []).map((vehicle) => ({
      vehicleId: vehicle.id,
      branchId: vehicle.branch_id,
      isActive: vehicle.is_active,
    })),
  };
}

export async function calculateFleetMaintenanceReadiness(): Promise<
  FleetMaintenanceReadinessItem[]
> {
  return (await calculateFleetMaintenanceSnapshot()).readiness;
}
