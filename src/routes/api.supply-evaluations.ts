import { createFileRoute } from "@tanstack/react-router";
import { AuthBoundaryError, requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateSupplyVehicles, calculateBalance, overlaps } from "@/lib/supply-evaluation.server";
import { calculateMaintenanceReadiness, selectAuthoritativePreventiveTargets } from "@/lib/maintenance-readiness.server";

const fail = (message: string, status = 400) => Response.json({ message }, { status });
const internal = (role: string) => role === "Owner/Admin" || role === "Operations Staff";

async function read() {
  try {
    const principal = await requirePrincipal();
    if (!internal(principal.role)) return fail("Supply evaluation access is restricted.", 403);
    const c = getSupabaseServerClient() as any;
    const { data, error } = await c.from("supply_evaluations").select("*, vehicles:supply_evaluation_vehicles(*)").order("evaluated_at", { ascending: false });
    if (error) return fail("Unable to load supply evaluations.", 503);
    return Response.json({ evaluations: data ?? [] });
  } catch (e) { return fail("Authentication required.", e instanceof AuthBoundaryError && e.reason === "forbidden" ? 403 : 401); }
}

async function generate({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    if (principal.role !== "Owner/Admin") return fail("Owner/Admin access is required.", 403);
    const body = await request.json().catch(() => ({}));
    const forecastId = typeof body.forecastId === "string" ? body.forecastId : "";
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    if (!forecastId || !idempotencyKey) return fail("forecastId and idempotencyKey are required.");
    const c = getSupabaseServerClient() as any;
    const { data: forecast, error: fe } = await c.from("forecasts").select("id,branch_id,vehicle_category_id,target_week_start,target_week_end,required_vehicle_units").eq("id", forecastId).maybeSingle();
    if (fe) return fail("Unable to load forecast.", 503);
    if (!forecast) return fail("Demand forecast unavailable.", 404);
    const { data: vehicles, error: ve } = await c.from("vehicles").select("id,branch_id,category_id,is_active").eq("branch_id", forecast.branch_id).eq("category_id", forecast.vehicle_category_id);
    if (ve) return fail("Unable to load fleet.", 503);
    const ids = (vehicles ?? []).map((v: any) => v.id);
    const [bookings, rentals, maintenance] = await Promise.all([
      ids.length ? c.from("booking_requests").select("assigned_vehicle_id,pickup_at,return_at,booking_status").in("assigned_vehicle_id", ids).eq("booking_status", "Confirmed") : { data: [], error: null },
      ids.length ? c.from("rental_transactions").select("vehicle_id,started_at,ended_at").in("vehicle_id", ids) : { data: [], error: null },
      ids.length ? c.from("maintenance_records").select("vehicle_id,status,maintenance_type,blocks_rental_use,next_service_odometer,next_service_date,completed_at,created_at").in("vehicle_id", ids) : { data: [], error: null },
    ]);
    if (bookings.error || rentals.error || maintenance.error) return fail("Unable to load canonical fleet commitments.", 503);
    const byVehicle = new Map<string, any[]>();
    for (const r of maintenance.data ?? []) byVehicle.set(r.vehicle_id, [...(byVehicle.get(r.vehicle_id) ?? []), r]);
    const evaluated = await Promise.all((vehicles ?? []).map(async (v: any) => {
      let readiness: { maintenanceReady: boolean; reasons: string[] } | undefined;
      try { readiness = await calculateMaintenanceReadiness(v.id); } catch { readiness = undefined; }
      const targets = selectAuthoritativePreventiveTargets(byVehicle.get(v.id) ?? []);
      const futureMaintenanceConflict = targets.some((r: any) => r.next_service_date && r.next_service_date < forecast.target_week_end);
      const bookingConflict = (bookings.data ?? []).filter((b: any) => b.assigned_vehicle_id === v.id).some((b: any) => overlaps(b.pickup_at, b.return_at, `${forecast.target_week_start}T00:00:00.000Z`, `${forecast.target_week_end}T00:00:00.000Z`));
      const rentalConflict = (rentals.data ?? []).filter((r: any) => r.vehicle_id === v.id).some((r: any) => r.started_at && (!r.ended_at || overlaps(r.started_at, r.ended_at, `${forecast.target_week_start}T00:00:00.000Z`, `${forecast.target_week_end}T00:00:00.000Z`)));
      return { ...v, readiness, futureMaintenanceConflict, bookingConflict, rentalConflict };
    }));
    const result = evaluateSupplyVehicles(evaluated);
    const balance = calculateBalance(Number(forecast.required_vehicle_units), result.projectedSupply);
    const rpc = await c.rpc("persist_supply_evaluation", { p_forecast_id: forecast.id, p_evaluated_by: principal.userId, p_idempotency_key: idempotencyKey, p_required_units: Number(forecast.required_vehicle_units), p_projected_supply: result.projectedSupply, p_shortage_units: balance.shortageUnits, p_surplus_units: balance.surplusUnits, p_items: result.items });
    if (rpc.error) return fail("Unable to persist supply evaluation atomically.", 409);
    return Response.json(rpc.data, { status: 201 });
  } catch (e) { return fail(e instanceof AuthBoundaryError ? (e.reason === "forbidden" ? "Owner/Admin access is required." : "Authentication required.") : "Unable to process supply evaluation.", e instanceof AuthBoundaryError ? (e.reason === "forbidden" ? 403 : 401) : 500); }
}

export const Route = createFileRoute("/api/supply-evaluations")({ server: { handlers: { GET: read, POST: generate } } });
