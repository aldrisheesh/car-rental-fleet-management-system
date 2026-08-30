import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const Route = createFileRoute("/api/booking-master-data")({
  server: { handlers: { GET: async () => {
    try { await requirePrincipal(); } catch { return Response.json({ message: "Authentication required." }, { status: 401 }); }
    const client = getSupabaseServerClient();
    const [branches, vehicles] = await Promise.all([
      client.from("branches").select("id,name").eq("is_active", true).order("name"),
      client.from("vehicles").select("id,name,seat_capacity,image_url,branch_id,category:vehicle_categories(id,name)").eq("is_active", true).order("name"),
    ]);
    if (branches.error || vehicles.error) return Response.json({ message: "Unable to load booking options." }, { status: 503 });
    return Response.json({ branches: branches.data ?? [], vehicles: vehicles.data ?? [] });
  } } },
});
