import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const fail = (message: string, status = 400) => Response.json({ message }, { status });

export const Route = createFileRoute("/api/vehicle-location")({
  server: { handlers: { GET: preview, POST: reconcile } },
});

async function preview({ request }: { request: Request }) {
  try {
    await requireRole("Owner/Admin");
    const vehicleId = new URL(request.url).searchParams.get("vehicleId")?.trim();
    if (!vehicleId) return fail("Vehicle reference is required.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    const result = await client
      .from("booking_requests")
      .select("id,booking_status,pickup_at,customer:profiles!booking_requests_customer_id_fkey(full_name)")
      .in("booking_status", ["Draft", "Submitted"])
      .or(`requested_vehicle_id.eq.${vehicleId},assigned_vehicle_id.eq.${vehicleId}`)
      .order("pickup_at");
    if (result.error) return fail("Unable to check affected booking requests.", 503);
    return Response.json({ impactedBookings: result.data ?? [] });
  } catch (error) {
    return fail(error instanceof Error && error.message === "forbidden" ? "Forbidden." : "Authentication required.", error instanceof Error && error.message === "forbidden" ? 403 : 401);
  }
}

async function reconcile({ request }: { request: Request }) {
  try {
    const principal = await requireRole("Owner/Admin");
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const vehicleId = typeof body?.vehicleId === "string" ? body.vehicleId.trim() : "";
    const branchId = typeof body?.branchId === "string" ? body.branchId.trim() : "";
    if (!vehicleId || !branchId) return fail("Vehicle and allocation location are required.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    const result = await client.rpc("reconcile_vehicle_location_atomic", {
      p_vehicle_id: vehicleId,
      p_actor_id: principal.userId,
      p_branch_id: branchId,
      p_acknowledge_impacts: body?.acknowledgeImpacts === true,
    });
    if (result.error) {
      const messages: Record<string, string> = {
        vehicle_not_found: "Vehicle not found.",
        branch_not_found: "Choose an active allocation location.",
        vehicle_reserved: "This vehicle has a confirmed reservation and cannot be moved.",
        pending_bookings_affected: "Review and acknowledge the affected booking requests before moving this vehicle.",
      };
      return fail(messages[result.error.message] ?? "Unable to update the allocation location.", 409);
    }
    return Response.json(result.data);
  } catch (error) {
    return fail(error instanceof Error && error.message === "forbidden" ? "Forbidden." : "Authentication required.", error instanceof Error && error.message === "forbidden" ? 403 : 401);
  }
}
