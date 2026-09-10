import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAdminFleet,
  type FleetCanonicalBooking,
  type FleetCanonicalRental,
  type FleetCanonicalVehicle,
  type FleetOption,
} from "./admin-fleet";
import { calculateFleetMaintenanceSnapshot } from "./maintenance-readiness.server";
import type { Database } from "./supabase/database.types";
import { getSupabaseServerClient } from "./supabase/server";

export async function getCanonicalAdminFleet(
  client: SupabaseClient<Database> = getSupabaseServerClient(),
  now = new Date(),
) {
  const [
    vehiclesResult,
    branchesResult,
    categoriesResult,
    bookingsResult,
    rentalsResult,
    readiness,
  ] = await Promise.all([
    client
      .from("vehicles")
      .select(
        "id,name,license_plate,transmission,seat_capacity,daily_rate,is_active,branch:branches(id,name),category:vehicle_categories(id,name)",
      )
      .order("name"),
    client.from("branches").select("id,name").order("name"),
    client.from("vehicle_categories").select("id,name").order("name"),
    client
      .from("booking_requests")
      .select("assigned_vehicle_id,booking_status,pickup_at,return_at"),
    client.from("rental_transactions").select("vehicle_id,started_at,ended_at"),
    calculateFleetMaintenanceSnapshot(client, now),
  ]);

  const failed = [
    vehiclesResult,
    branchesResult,
    categoriesResult,
    bookingsResult,
    rentalsResult,
  ].find((result) => result.error);
  if (failed?.error) throw failed.error;

  return buildAdminFleet(
    {
      vehicles: (vehiclesResult.data ??
        []) as unknown as FleetCanonicalVehicle[],
      branches: (branchesResult.data ?? []) as FleetOption[],
      categories: (categoriesResult.data ?? []) as FleetOption[],
      bookings: (bookingsResult.data ?? []) as FleetCanonicalBooking[],
      rentals: (rentalsResult.data ?? []) as FleetCanonicalRental[],
      readiness: readiness.readiness,
    },
    now.toISOString(),
    now,
  );
}
