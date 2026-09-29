import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { listCatalogVehiclesForAvailability } from "@/lib/vehicle-finder.server";

type VehicleWithId = { id: string };

async function withVehicleImages<T extends VehicleWithId>(vehicles: T[]) {
  const ids = vehicles.map((vehicle) => vehicle.id);
  if (!ids.length) return vehicles.map((vehicle) => ({ ...vehicle, images: [] }));

  const images = await (getSupabaseServerClient() as any)
    .from("vehicle_images")
    .select("id, vehicle_id, public_url, alt_text, sort_order, is_cover")
    .in("vehicle_id", ids)
    .order("is_cover", { ascending: false })
    .order("sort_order");
  if (images.error) throw new Error("Unable to load vehicle photos.");

  const imagesByVehicle = new Map<string, unknown[]>();
  for (const image of images.data ?? []) {
    const list = imagesByVehicle.get(image.vehicle_id) ?? [];
    list.push(image);
    imagesByVehicle.set(image.vehicle_id, list);
  }
  return vehicles.map((vehicle) => ({
    ...vehicle,
    images: imagesByVehicle.get(vehicle.id) ?? [],
  }));
}

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
          if (!availability.ok)
            return Response.json(
                {
                  message: availability.message,
                  errors:
                    "errors" in availability ? availability.errors : undefined,
                },
                { status: availability.status },
              );
          try {
            return Response.json(await withVehicleImages(availability.data));
          } catch {
            return Response.json(
              { message: "Unable to load vehicle photos." },
              { status: 503 },
            );
          }
        }

        const result = await getSupabaseServerClient()
          .from("vehicles")
          .select(
            "id,name,license_plate,transmission,fuel_type,seat_capacity,large_luggage_capacity,daily_rate,image_url,current_odometer_km,condition_blocks_rental_use,branch:branches(id,name),category:vehicle_categories(id,name)",
          )
          .eq("is_active", true)
          .order("name");
        if (result.error)
          return Response.json(
            { message: "Unable to load vehicles." },
            { status: 503 },
          );
        try {
          return Response.json(await withVehicleImages(result.data ?? []));
        } catch {
          return Response.json(
            { message: "Unable to load vehicle photos." },
            { status: 503 },
          );
        }
      },
    },
  },
});
