import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminDashboard } from "./admin-dashboard";
import type { AppRole } from "./auth";
import { calculateFleetMaintenanceSnapshot } from "./maintenance-readiness.server";
import type { Database } from "./supabase/database.types";
import { getSupabaseServerClient } from "./supabase/server";

export async function getCanonicalAdminDashboard(
  role: AppRole,
  client: SupabaseClient<Database> = getSupabaseServerClient(),
  now = new Date(),
) {
  return loadAdminDashboard(
    role,
    async () => {
      const [bookingsResult, rentalsResult, fleet] = await Promise.all([
        client
          .from("booking_requests")
          .select(
            "id,booking_status,pickup_at,return_at,created_at,requested_vehicle:vehicles!booking_requests_requested_vehicle_id_fkey(name),assigned_vehicle:vehicles!booking_requests_assigned_vehicle_id_fkey(name)",
          )
          .order("created_at", { ascending: false }),
        client
          .from("rental_transactions")
          .select("vehicle_id,started_at,ended_at"),
        calculateFleetMaintenanceSnapshot(client, now),
      ]);
      if (bookingsResult.error) throw bookingsResult.error;
      if (rentalsResult.error) throw rentalsResult.error;
      return {
        bookings: bookingsResult.data ?? [],
        rentals: rentalsResult.data ?? [],
        readiness: fleet.readiness,
        vehicles: fleet.vehicles,
      };
    },
    now.toISOString(),
  );
}
