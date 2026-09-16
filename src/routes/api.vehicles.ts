import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { listCatalogVehiclesForAvailability } from "@/lib/vehicle-finder.server";

export const Route = createFileRoute("/api/vehicles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const search = new URL(request.url).searchParams;
        const requestedStart = search.get("finderStart");
        const requestedEnd = search.get("finderEnd");

        if (requestedStart || requestedEnd) {
          const availability = await listCatalogVehiclesForAvailability({
            requestedStart,
            requestedEnd,
          });
          return availability.ok
            ? Response.json(availability.data)
            : Response.json(
                {
                  message: availability.message,
                  errors:
                    "errors" in availability ? availability.errors : undefined,
                },
                { status: availability.status },
              );
        }

        const result = await getSupabaseServerClient()
          .from("vehicles")
          .select(
            "id,name,license_plate,transmission,fuel_type,seat_capacity,daily_rate,image_url,branch:branches(id,name),category:vehicle_categories(id,name)",
          )
          .eq("is_active", true)
          .order("name");
        if (result.error)
          return Response.json(
            { message: "Unable to load vehicles." },
            { status: 503 },
          );
        return Response.json(result.data ?? []);
      },
    },
  },
});
