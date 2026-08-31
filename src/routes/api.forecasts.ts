import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { addWeeks, calculateWma, extractWeeklyDemand, isoDay, loadCanonicalBookings, manilaWeekStart, mapeFromDatabaseRows } from "@/lib/forecasting.server";

export const Route = createFileRoute("/api/forecasts")({ server: { handlers: { GET: read, POST: generate } } });
const denied = (status: number, message: string) => Response.json({ message }, { status });
async function read() {
  try {
    const p = await requirePrincipal(); if (p.role === "Customer/Renter") return denied(403, "Forecast access is restricted.");
    const c = getSupabaseServerClient() as any; const rows = await loadCanonicalBookings(); const actualMap = extractWeeklyDemand(rows); const current = isoDay(manilaWeekStart(new Date()));
    const existing = await c.from("forecasts").select("*");
    for (const r of existing.data ?? []) { if (r.target_week_start >= current || r.actual_demand != null) continue; const actual = (actualMap.get(`${r.branch_id}:${r.vehicle_category_id}`) ?? []).find((x: any) => x.weekStart === r.target_week_start); if (actual) await c.from("forecasts").update({ actual_demand: actual.demand, ape: actual.demand > 0 ? Math.abs((actual.demand - Number(r.forecasted_demand)) / actual.demand) * 100 : null }).eq("id", r.id); }
    const [runs, records] = await Promise.all([c.from("forecast_runs").select("*").order("generated_at", { ascending: false }), c.from("forecasts").select("*, inputs:forecast_inputs(*)").order("target_week_start")]); if (runs.error || records.error) return denied(503, "Unable to load forecasts."); return Response.json({ runs: runs.data ?? [], forecasts: records.data ?? [], mape: mapeFromDatabaseRows(records.data ?? []) });
  } catch (e) { return denied(e instanceof Error && e.message === "forbidden" ? 403 : 401, e instanceof Error && e.message === "forbidden" ? "Forbidden." : "Authentication required."); }
}
async function generate({ request }: { request: Request }) {
  try {
    const p = await requirePrincipal(); if (p.role !== "Owner/Admin") return denied(403, "Owner/Admin access is required."); const body = await request.json().catch(() => ({})); const key = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : ""; if (!key) return denied(400, "idempotencyKey is required."); const c = getSupabaseServerClient() as any; const existing = await c.from("forecast_runs").select("*").eq("idempotency_key", key).maybeSingle(); if (existing.data) return Response.json(await runPayload(c, existing.data));
    const rows = await loadCanonicalBookings(); const actualMap = extractWeeklyDemand(rows); const branches = await c.from("branches").select("id").eq("is_active", true); const cats = await c.from("vehicle_categories").select("id").eq("is_active", true); const anchor = addWeeks(manilaWeekStart(new Date()), -1); const runInsert = await c.from("forecast_runs").insert({ generated_by: p.userId, method: "WMA", idempotency_key: key, coverage_start: rows.length ? isoDay(manilaWeekStart(rows.reduce((a: any, b: any) => new Date(a.pickup_at) < new Date(b.pickup_at) ? a : b).pickup_at)) : null }).select("*").single(); if (runInsert.error) return denied(409, "Forecast generation request already processed.");
    const run = runInsert.data; const records: any[] = []; const inputs: any[] = []; for (const b of branches.data ?? []) for (const cat of cats.data ?? []) { const wma = calculateWma(actualMap.get(`${b.id}:${cat.id}`) ?? []); if (!wma) continue; for (let i = 0; i < 3; i++) { const target = addWeeks(anchor, i + 1); const inserted = await c.from("forecasts").insert({ run_id: run.id, branch_id: b.id, vehicle_category_id: cat.id, horizon: i + 1, target_week_start: isoDay(target), target_week_end: isoDay(addWeeks(target, 1)), forecasted_demand: wma.forecasts[i], required_vehicle_units: Math.ceil(wma.forecasts[i]) }).select("*").single(); if (inserted.error) throw inserted.error; records.push(inserted.data); inputs.push(...wma.inputs[i].map((x: any) => ({ forecast_id: inserted.data.id, source_type: x.sourceType, source_week_start: x.sourceWeek, source_value: x.sourceValue, input_order: x.inputOrder, weight: x.weight, weighted_contribution: x.weightedContribution }))); } }
    if (inputs.length) { const ir = await c.from("forecast_inputs").insert(inputs); if (ir.error) throw ir.error; }
    const insufficientPairs = (branches.data ?? []).flatMap((b: any) => (cats.data ?? []).filter((cat: any) => !calculateWma(actualMap.get(`${b.id}:${cat.id}`) ?? [])).map((cat: any) => ({ branchId: b.id, vehicleCategoryId: cat.id, state: "Insufficient historical data" })));
    return Response.json({ run, forecasts: records, insufficientPairs }, { status: 201 });
  } catch (e) { return denied(e instanceof Error && e.message === "forbidden" ? 403 : 500, e instanceof Error && e.message === "forbidden" ? "Forbidden." : "Unable to generate forecast."); }
}
async function runPayload(c: any, run: any) { const r = await c.from("forecasts").select("*, inputs:forecast_inputs(*)").eq("run_id", run.id); return { run, forecasts: r.data ?? [] }; }
