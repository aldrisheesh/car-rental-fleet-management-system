import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateMaintenanceReadiness } from "./maintenance-readiness.server.ts";
import {
  findVehicles,
  hasScheduledRentalConflict,
  intervalsOverlap,
  validateFinderInput,
  type FinderCandidate,
  type VehicleFinderInput,
} from "./vehicle-finder.ts";
import type { Database } from "./supabase/database.types.ts";
import { getSupabaseServerClient } from "./supabase/server.ts";

type FinderClient = SupabaseClient<Database>;

export type CanonicalFinderEvaluation =
  | {
      ok: true;
      input: VehicleFinderInput;
      preferredCategoryId: string | null;
      result: ReturnType<typeof findVehicles>;
    }
  | {
      ok: false;
      status: 400 | 503;
      message: string;
      errors?: Record<string, string>;
    };

export async function evaluateCanonicalVehicleFinder(
  body: Record<string, unknown>,
  client: FinderClient = getSupabaseServerClient(),
): Promise<CanonicalFinderEvaluation> {
  const categoryResult = await client
    .from("vehicle_categories")
    .select("id,name")
    .eq("is_active", true)
    .order("name");
  if (categoryResult.error)
    return {
      ok: false,
      status: 503,
      message: "Unable to load Finder options.",
    };

  const categories = categoryResult.data ?? [];
  const validation = validateFinderInput(
    body,
    categories.map((category) => category.name),
  );
  if (!validation.ok)
    return {
      ok: false,
      status: 400,
      message: "Please review your trip requirements.",
      errors: validation.errors,
    };

  const [vehicleResult, bookingResult, rentalResult] = await Promise.all([
    client
      .from("vehicles")
      .select(
        "id,name,transmission,fuel_type,seat_capacity,daily_rate,image_url,is_active,branch:branches(name),category:vehicle_categories(name)",
      )
      .order("name"),
    client
      .from("booking_requests")
      .select("assigned_vehicle_id,pickup_at,return_at,booking_status")
      .eq("booking_status", "Confirmed"),
    client
      .from("rental_transactions")
      .select("vehicle_id,scheduled_pickup_at,scheduled_return_at"),
  ]);
  if (vehicleResult.error || bookingResult.error || rentalResult.error)
    return {
      ok: false,
      status: 503,
      message: "Unable to find vehicles right now.",
    };

  const vehicles = vehicleResult.data ?? [];
  const readiness = await Promise.all(
    vehicles.map((vehicle) => calculateMaintenanceReadiness(vehicle.id)),
  );
  const candidates: FinderCandidate[] = vehicles.map((vehicle, index) => ({
    id: vehicle.id,
    name: vehicle.name,
    category: vehicle.category?.name ?? "",
    passengerCapacity: vehicle.seat_capacity,
    baseRentalRate:
      vehicle.daily_rate === null ? null : Number(vehicle.daily_rate),
    imageUrl: vehicle.image_url,
    branchName: vehicle.branch?.name ?? null,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuel_type,
    isActive: vehicle.is_active,
    maintenanceReady: readiness[index]?.maintenanceReady === true,
    bookingConflict: (bookingResult.data ?? []).some(
      (booking) =>
        booking.assigned_vehicle_id === vehicle.id &&
        intervalsOverlap(
          booking.pickup_at,
          booking.return_at,
          validation.value.requestedStart,
          validation.value.requestedEnd,
        ),
    ),
    rentalConflict: hasScheduledRentalConflict(
      rentalResult.data ?? [],
      vehicle.id,
      validation.value.requestedStart,
      validation.value.requestedEnd,
    ),
  }));

  return {
    ok: true,
    input: validation.value,
    preferredCategoryId:
      categories.find(
        (category) => category.name === validation.value.preferredCategory,
      )?.id ?? null,
    result: findVehicles(validation.value, candidates),
  };
}
