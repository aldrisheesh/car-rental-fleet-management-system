import { createFileRoute } from "@tanstack/react-router";
import { calculateMaintenanceReadiness } from "@/lib/maintenance-readiness.server";
import {
  findVehicles,
  intervalsOverlap,
  validateFinderInput,
  type FinderCandidate,
} from "@/lib/vehicle-finder";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const errorResponse = (message: string, status: number) =>
  Response.json({ message }, { status });

export const Route = createFileRoute("/api/vehicle-finder")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        if (!body) return errorResponse("Invalid Finder request.", 400);

        try {
          const client = getSupabaseServerClient();
          const categoryResult = await client
            .from("vehicle_categories")
            .select("name")
            .eq("is_active", true)
            .order("name");
          if (categoryResult.error)
            return errorResponse("Unable to load Finder options.", 503);

          const validation = validateFinderInput(
            body,
            (categoryResult.data ?? []).map((category) => category.name),
          );
          if (!validation.ok)
            return Response.json(
              {
                message: "Please review your trip requirements.",
                errors: validation.errors,
              },
              { status: 400 },
            );

          const [vehicleResult, bookingResult, rentalResult] =
            await Promise.all([
              client
                .from("vehicles")
                .select(
                  "id,name,transmission,fuel_type,seat_capacity,daily_rate,image_url,is_active,branch:branches(name),category:vehicle_categories(name)",
                )
                .order("name"),
              client
                .from("booking_requests")
                .select(
                  "assigned_vehicle_id,pickup_at,return_at,booking_status",
                )
                .eq("booking_status", "Confirmed"),
              client
                .from("rental_transactions")
                .select(
                  "vehicle_id,scheduled_pickup_at,scheduled_return_at,started_at,ended_at",
                ),
            ]);
          if (vehicleResult.error || bookingResult.error || rentalResult.error)
            return errorResponse("Unable to find vehicles right now.", 503);

          const vehicles = vehicleResult.data ?? [];
          const readiness = await Promise.all(
            vehicles.map((vehicle) =>
              calculateMaintenanceReadiness(vehicle.id),
            ),
          );
          const candidates: FinderCandidate[] = vehicles.map(
            (vehicle, index) => {
              const bookingConflict = (bookingResult.data ?? []).some(
                (booking) =>
                  booking.assigned_vehicle_id === vehicle.id &&
                  intervalsOverlap(
                    booking.pickup_at,
                    booking.return_at,
                    validation.value.requestedStart,
                    validation.value.requestedEnd,
                  ),
              );
              const rentalConflict = (rentalResult.data ?? []).some(
                (rental) =>
                  rental.vehicle_id === vehicle.id &&
                  ((rental.started_at !== null && rental.ended_at === null) ||
                    intervalsOverlap(
                      rental.scheduled_pickup_at,
                      rental.scheduled_return_at,
                      validation.value.requestedStart,
                      validation.value.requestedEnd,
                    )),
              );
              return {
                id: vehicle.id,
                name: vehicle.name,
                category: vehicle.category?.name ?? "",
                passengerCapacity: vehicle.seat_capacity,
                baseRentalRate:
                  vehicle.daily_rate === null
                    ? null
                    : Number(vehicle.daily_rate),
                imageUrl: vehicle.image_url,
                branchName: vehicle.branch?.name ?? null,
                transmission: vehicle.transmission,
                fuelType: vehicle.fuel_type,
                isActive: vehicle.is_active,
                maintenanceReady: readiness[index]?.maintenanceReady === true,
                bookingConflict,
                rentalConflict,
              };
            },
          );

          return Response.json(findVehicles(validation.value, candidates));
        } catch {
          return errorResponse("Unable to find vehicles right now.", 503);
        }
      },
    },
  },
});
