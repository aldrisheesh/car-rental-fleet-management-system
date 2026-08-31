import { createFileRoute } from "@tanstack/react-router";
import { requireRole, requirePrincipal } from "@/lib/auth.server";
import { calculateMaintenanceReadiness } from "@/lib/maintenance-readiness.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function fail(message: string, status = 400) {
  return Response.json({ message }, { status });
}
function numberOrNull(value: unknown, label: string) {
  if (value == null || value === "") return { value: null as number | null };
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0)
    return { error: `${label} must be a non-negative number.` };
  return { value: n };
}

export const Route = createFileRoute("/api/maintenance")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const principal = await requirePrincipal();
          const url = new URL(request.url);
          const vehicleId = url.searchParams.get("vehicleId");
          if (url.searchParams.get("readiness") === "true") {
            if (principal.role === "Customer/Renter")
              return fail("Forbidden.", 403);
            if (!vehicleId) return fail("vehicleId is required.");
            return Response.json(
              await calculateMaintenanceReadiness(vehicleId),
            );
          }
          if (principal.role !== "Owner/Admin") return fail("Forbidden.", 403);
          const client = getSupabaseServerClient();
          let query = client
            .from("maintenance_records")
            .select(
              "*, vehicle:vehicles(id,name,license_plate,is_active,current_odometer_km,condition_blocks_rental_use)",
            )
            .order("created_at", { ascending: false });
          if (vehicleId) query = query.eq("vehicle_id", vehicleId);
          const result = await query;
          if (result.error)
            return fail("Unable to load maintenance records.", 503);
          return Response.json(result.data ?? []);
        } catch (error) {
          return fail(
            error instanceof Error && error.message === "forbidden"
              ? "Forbidden."
              : "Authentication required.",
            error instanceof Error && error.message === "forbidden" ? 403 : 401,
          );
        }
      },
      POST: async ({ request }) => {
        let actor;
        try {
          actor = await requireRole("Owner/Admin");
        } catch (error) {
          return fail(
            error instanceof Error && error.message === "forbidden"
              ? "Forbidden."
              : "Authentication required.",
            error instanceof Error && error.message === "forbidden" ? 403 : 401,
          );
        }
        const body = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        if (!body || typeof body.vehicleId !== "string")
          return fail("A valid vehicle is required.");
        if (
          typeof body.maintenanceType !== "string" ||
          !body.maintenanceType.trim()
        )
          return fail("Service type is required.");
        if (typeof body.description !== "string" || !body.description.trim())
          return fail("Description is required.");
        const odo = numberOrNull(body.odometerAtService, "Odometer");
        const nextOdo = numberOrNull(
          body.nextServiceOdometer,
          "Next-service odometer",
        );
        const cost = numberOrNull(body.costPhp, "Cost");
        if (odo.error || nextOdo.error || cost.error)
          return fail(odo.error ?? nextOdo.error ?? cost.error!);
        if (body.status != null && body.status !== "Open")
          return fail("New maintenance records must start Open.");
        const client = getSupabaseServerClient();
        const vehicle = await client
          .from("vehicles")
          .select("id,is_active,current_odometer_km")
          .eq("id", body.vehicleId)
          .maybeSingle();
        if (vehicle.error || !vehicle.data)
          return fail("Vehicle not found.", 404);
        if (
          odo.value != null &&
          vehicle.data.current_odometer_km != null &&
          odo.value < Number(vehicle.data.current_odometer_km)
        )
          return fail(
            "Odometer cannot be lower than the current vehicle odometer.",
          );
        const result = await client
          .from("maintenance_records")
          .insert({
            vehicle_id: body.vehicleId,
            maintenance_type: body.maintenanceType.trim(),
            description: body.description.trim(),
            blocks_rental_use: body.blocksRentalUse === true,
            service_started_at:
              typeof body.serviceStartedAt === "string" && body.serviceStartedAt
                ? body.serviceStartedAt
                : new Date().toISOString(),
            odometer_at_service: odo.value,
            next_service_odometer: nextOdo.value,
            next_service_date:
              typeof body.nextServiceDate === "string" && body.nextServiceDate
                ? body.nextServiceDate
                : null,
            cost_php: cost.value,
            remarks:
              typeof body.remarks === "string"
                ? body.remarks.trim() || null
                : null,
            created_by: actor.userId,
            updated_by: actor.userId,
          })
          .select()
          .single();
        if (result.error)
          return fail("Unable to create maintenance record.", 400);
        if (odo.value != null) {
          const advance = await client.rpc("advance_vehicle_odometer", {
            p_vehicle_id: body.vehicleId,
            p_odometer: odo.value,
          });
          if (advance.error)
            return fail(
              advance.error.message.includes("odometer_regression")
                ? "Odometer cannot be lower than the current vehicle odometer."
                : "Unable to update vehicle odometer.",
            );
        }
        const activeRental = await client
          .from("rental_transactions")
          .select("id")
          .eq("vehicle_id", body.vehicleId)
          .not("started_at", "is", null)
          .is("ended_at", null)
          .maybeSingle();
        return Response.json(
          {
            ...result.data,
            active_rental_conflict: Boolean(activeRental.data),
          },
          { status: 201 },
        );
      },
      PATCH: async ({ request }) => {
        let actor;
        try {
          actor = await requireRole("Owner/Admin");
        } catch (error) {
          return fail(
            error instanceof Error && error.message === "forbidden"
              ? "Forbidden."
              : "Authentication required.",
            error instanceof Error && error.message === "forbidden" ? 403 : 401,
          );
        }
        const body = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        const id = typeof body?.id === "string" ? body.id : null;
        const status = body?.status;
        if (!id || (status !== "Completed" && status !== "Cancelled"))
          return fail(
            "Only Open to Completed or Open to Cancelled is supported.",
          );
        const client = getSupabaseServerClient();
        const existing = await client
          .from("maintenance_records")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (existing.error || !existing.data)
          return fail("Maintenance record not found.", 404);
        if (existing.data.status !== "Open")
          return fail("Only Open records can be transitioned.");
        const patch: Record<string, unknown> = {
          status,
          updated_by: actor.userId,
          completed_at:
            status === "Completed" ? new Date().toISOString() : null,
        };
        for (const [key, label] of [
          ["odometerAtService", "Odometer"],
          ["nextServiceOdometer", "Next-service odometer"],
          ["costPhp", "Cost"],
        ] as const)
          if (body?.[key] !== undefined) {
            const parsed = numberOrNull(body[key], label);
            if (parsed.error) return fail(parsed.error);
            patch[
              key === "odometerAtService"
                ? "odometer_at_service"
                : key === "nextServiceOdometer"
                  ? "next_service_odometer"
                  : "cost_php"
            ] = parsed.value;
          }
        if (body?.nextServiceDate !== undefined)
          patch.next_service_date = body.nextServiceDate || null;
        if (typeof body?.remarks === "string")
          patch.remarks = body.remarks.trim() || null;
        if (patch.odometer_at_service != null) {
          const vehicle = await client
            .from("vehicles")
            .select("current_odometer_km")
            .eq("id", existing.data.vehicle_id)
            .maybeSingle();
          if (
            vehicle.data?.current_odometer_km != null &&
            Number(patch.odometer_at_service) <
              Number(vehicle.data.current_odometer_km)
          )
            return fail(
              "Odometer cannot be lower than the current vehicle odometer.",
            );
        }
        // Dynamic maintenance update shape is validated above; generated types cannot model it.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (client as any)
          .from("maintenance_records")
          .update(patch)
          .eq("id", id)
          .eq("status", "Open")
          .select()
          .single();
        if (result.error)
          return fail("Unable to update maintenance record.", 400);
        if (patch.odometer_at_service != null) {
          const advance = await client.rpc("advance_vehicle_odometer", {
            p_vehicle_id: existing.data.vehicle_id,
            p_odometer: Number(patch.odometer_at_service),
          });
          if (advance.error)
            return fail(
              advance.error.message.includes("odometer_regression")
                ? "Odometer cannot be lower than the current vehicle odometer."
                : "Unable to update vehicle odometer.",
            );
        }
        return Response.json(result.data);
      },
    },
  },
});
