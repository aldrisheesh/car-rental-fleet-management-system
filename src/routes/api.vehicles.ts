import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const Route = createFileRoute("/api/vehicles")({
  server: {
    handlers: {
      GET: async () => {
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
