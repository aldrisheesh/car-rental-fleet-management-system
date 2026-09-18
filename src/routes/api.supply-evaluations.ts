import { createFileRoute } from "@tanstack/react-router";
import { AuthBoundaryError, requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  evaluateSupplyVehicles,
  calculateBalance,
  overlaps,
  manilaDateBoundaryToInstant,
} from "@/lib/supply-evaluation.server";
import {
  calculateMaintenanceReadiness,
  selectAuthoritativePreventiveTargets,
} from "@/lib/maintenance-readiness.server";

const fail = (message: string, status = 400) =>
  Response.json({ message }, { status });
const internal = (role: string) =>
  role === "Owner/Admin" || role === "Operations Staff";

async function evaluateForecastSupply({
  client,
  forecastId,
  evaluatedBy,
  idempotencyKey,
}: {
  client: any;
  forecastId: string;
  evaluatedBy: string;
  idempotencyKey: string;
}) {
  const { data: forecast, error: forecastError } = await client
    .from("forecasts")
    .select(
      "id,branch_id,vehicle_category_id,target_week_start,target_week_end,required_vehicle_units",
    )
    .eq("id", forecastId)
    .maybeSingle();
  if (forecastError) throw new Error("Unable to load forecast.");
  if (!forecast) throw new Error("Demand forecast unavailable.");

  const targetWeekStart = manilaDateBoundaryToInstant(
    forecast.target_week_start,
  );
  const targetWeekEnd = manilaDateBoundaryToInstant(forecast.target_week_end);
  if (!targetWeekStart || !targetWeekEnd)
    throw new Error("Invalid canonical forecast interval.");

  const { data: vehicles, error: vehicleError } = await client
    .from("vehicles")
    .select("id,branch_id,category_id,is_active")
    .eq("branch_id", forecast.branch_id)
    .eq("category_id", forecast.vehicle_category_id);
  if (vehicleError) throw new Error("Unable to load fleet.");

  const ids = (vehicles ?? []).map((vehicle: any) => vehicle.id);
  const [bookings, rentals, maintenance] = await Promise.all([
    ids.length
      ? client
          .from("booking_requests")
          .select("assigned_vehicle_id,pickup_at,return_at,booking_status")
          .in("assigned_vehicle_id", ids)
          .eq("booking_status", "Confirmed")
      : { data: [], error: null },
    ids.length
      ? client
          .from("rental_transactions")
          .select("vehicle_id,started_at,ended_at")
          .in("vehicle_id", ids)
      : { data: [], error: null },
    ids.length
      ? client
          .from("maintenance_records")
          .select(
            "vehicle_id,status,maintenance_type,blocks_rental_use,next_service_odometer,next_service_date,completed_at,created_at",
          )
          .in("vehicle_id", ids)
      : { data: [], error: null },
  ]);
  if (bookings.error || rentals.error || maintenance.error)
    throw new Error("Unable to load canonical fleet commitments.");

  const maintenanceByVehicle = new Map<string, any[]>();
  for (const record of maintenance.data ?? []) {
    maintenanceByVehicle.set(record.vehicle_id, [
      ...(maintenanceByVehicle.get(record.vehicle_id) ?? []),
      record,
    ]);
  }
  const evaluatedVehicles = await Promise.all(
    (vehicles ?? []).map(async (vehicle: any) => {
      let readiness:
        | { maintenanceReady: boolean; reasons: string[] }
        | undefined;
      try {
        readiness = await calculateMaintenanceReadiness(vehicle.id);
      } catch {
        readiness = undefined;
      }
      const targets = selectAuthoritativePreventiveTargets(
        maintenanceByVehicle.get(vehicle.id) ?? [],
      );
      const futureMaintenanceConflict = targets.some(
        (record: any) =>
          record.next_service_date &&
          record.next_service_date < forecast.target_week_end,
      );
      const bookingConflict = (bookings.data ?? [])
        .filter((booking: any) => booking.assigned_vehicle_id === vehicle.id)
        .some((booking: any) =>
          overlaps(
            booking.pickup_at,
            booking.return_at,
            targetWeekStart,
            targetWeekEnd,
          ),
        );
      const rentalConflict = (rentals.data ?? [])
        .filter((rental: any) => rental.vehicle_id === vehicle.id)
        .some(
          (rental: any) =>
            rental.started_at &&
            (!rental.ended_at ||
              overlaps(
                rental.started_at,
                rental.ended_at,
                targetWeekStart,
                targetWeekEnd,
              )),
        );
      return {
        ...vehicle,
        readiness,
        futureMaintenanceConflict,
        bookingConflict,
        rentalConflict,
      };
    }),
  );
  const result = evaluateSupplyVehicles(evaluatedVehicles);
  const balance = calculateBalance(
    Number(forecast.required_vehicle_units),
    result.projectedSupply,
  );
  const persisted = await client.rpc("persist_supply_evaluation", {
    p_forecast_id: forecast.id,
    p_evaluated_by: evaluatedBy,
    p_idempotency_key: idempotencyKey,
    p_required_units: Number(forecast.required_vehicle_units),
    p_projected_supply: result.projectedSupply,
    p_shortage_units: balance.shortageUnits,
    p_surplus_units: balance.surplusUnits,
    p_items: result.items,
  });
  if (persisted.error)
    throw new Error("Unable to persist supply evaluation atomically.");
  return persisted.data;
}

async function read() {
  try {
    const principal = await requirePrincipal();
    if (!internal(principal.role))
      return fail("Supply evaluation access is restricted.", 403);
    const c = getSupabaseServerClient() as any;
    const { data, error } = await c
      .from("supply_evaluations")
      .select("*, vehicles:supply_evaluation_vehicles(*)")
      .order("evaluated_at", { ascending: false });
    if (error) return fail("Unable to load supply evaluations.", 503);
    return Response.json({ evaluations: data ?? [] });
  } catch (e) {
    return fail(
      "Authentication required.",
      e instanceof AuthBoundaryError && e.reason === "forbidden" ? 403 : 401,
    );
  }
}

async function generate({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    if (principal.role !== "Owner/Admin")
      return fail("Owner/Admin access is required.", 403);
    const body = await request.json().catch(() => ({}));
    const forecastId =
      typeof body.forecastId === "string" ? body.forecastId : "";
    const forecastIds = Array.isArray(body.forecastIds)
      ? [
          ...new Set(
            body.forecastIds.filter(
              (id): id is string => typeof id === "string" && id.length > 0,
            ),
          ),
        ]
      : [];
    const idempotencyKey =
      typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    if ((!forecastId && !forecastIds.length) || !idempotencyKey)
      return fail("A forecast id and idempotency key are required.");
    if (forecastIds.length > 60)
      return fail("A maximum of 60 forecasts can be evaluated at once.");
    const c = getSupabaseServerClient() as any;
    const ids = forecastIds.length ? forecastIds : [forecastId];
    const evaluations = [];
    for (const id of ids) {
      evaluations.push(
        await evaluateForecastSupply({
          client: c,
          forecastId: id,
          evaluatedBy: principal.userId,
          idempotencyKey: forecastIds.length
            ? `${idempotencyKey}:${id}`
            : idempotencyKey,
        }),
      );
    }
    return Response.json(
      forecastIds.length
        ? { evaluations, evaluated: evaluations.length }
        : evaluations[0],
      { status: 201 },
    );
  } catch (e) {
    return fail(
      e instanceof AuthBoundaryError
        ? e.reason === "forbidden"
          ? "Owner/Admin access is required."
          : "Authentication required."
        : "Unable to process supply evaluation.",
      e instanceof AuthBoundaryError
        ? e.reason === "forbidden"
          ? 403
          : 401
        : 500,
    );
  }
}

export const Route = createFileRoute("/api/supply-evaluations")({
  server: { handlers: { GET: read, POST: generate } },
});
