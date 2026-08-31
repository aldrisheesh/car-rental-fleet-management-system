export type WeeklyActual = { weekStart: string; weekEnd: string; demand: number };
export type ForecastInput = { sourceType: "Actual" | "Forecast"; sourceWeek: string; sourceValue: number; inputOrder: number; weight: number; weightedContribution: number };

const WEIGHTS = [0.5, 0.3, 0.2] as const;
const TZ = "Asia/Manila";

export function manilaWeekStart(value: Date | string): Date {
  const d = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const year = Number(parts.find(p => p.type === "year")?.value);
  const month = Number(parts.find(p => p.type === "month")?.value);
  const day = Number(parts.find(p => p.type === "day")?.value);
  const local = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (local.getUTCDay() + 6) % 7;
  local.setUTCDate(local.getUTCDate() - mondayOffset);
  return local;
}
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const addWeeks = (d: Date, n: number) => new Date(d.getTime() + n * 7 * 86400000);

export function calculateWma(actuals: WeeklyActual[]) {
  if (actuals.length < 3) return null;
  const [d0, d1, d2] = actuals.slice(-3).reverse();
  const f1 = WEIGHTS[0] * d0.demand + WEIGHTS[1] * d1.demand + WEIGHTS[2] * d2.demand;
  const f2 = WEIGHTS[0] * f1 + WEIGHTS[1] * d0.demand + WEIGHTS[2] * d1.demand;
  const f3 = WEIGHTS[0] * f2 + WEIGHTS[1] * f1 + WEIGHTS[2] * d0.demand;
  const inputs = (values: Array<["Actual" | "Forecast", string, number]>) => values.map(([sourceType, sourceWeek, sourceValue], i) => ({ sourceType, sourceWeek, sourceValue, inputOrder: i + 1, weight: WEIGHTS[i], weightedContribution: sourceValue * WEIGHTS[i] }));
  return { anchorWeek: d0.weekStart, forecasts: [f1, f2, f3], inputs: [inputs([["Actual", d0.weekStart, d0.demand], ["Actual", d1.weekStart, d1.demand], ["Actual", d2.weekStart, d2.demand]]), inputs([["Forecast", isoDay(addWeeks(new Date(d0.weekStart), 1)), f1], ["Actual", d0.weekStart, d0.demand], ["Actual", d1.weekStart, d1.demand]]), inputs([["Forecast", isoDay(addWeeks(new Date(d0.weekStart), 2)), f2], ["Forecast", isoDay(addWeeks(new Date(d0.weekStart), 1)), f1], ["Actual", d0.weekStart, d0.demand]])] };
}

export function trustworthyCoverageWeekStart(trackingStartedAt: Date | string): Date {
  const start = manilaWeekStart(trackingStartedAt);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "2-digit", hour12: false }).formatToParts(new Date(trackingStartedAt));
  const hour = Number(parts.find(p => p.type === "hour")?.value ?? 0);
  const weekday = parts.find(p => p.type === "weekday")?.value;
  return weekday === "Mon" && hour === 24 ? start : addWeeks(start, 1);
}

export function extractWeeklyDemand(rows: any[], trackingStartedAt: Date | string, now = new Date()) {
  const current = manilaWeekStart(now);
  const coverage = trustworthyCoverageWeekStart(trackingStartedAt);
  const qualifying = rows.filter(r => r.booking_status === "Confirmed" && r.pickup_branch_id && r.pickup_at && r.requested_vehicle?.category?.id);
  const latest = addWeeks(current, -1);
  const counts = new Map<string, Map<string, number>>();
  for (const r of qualifying) { const w = manilaWeekStart(r.pickup_at); if (w < coverage || w >= current) continue; const key = `${r.pickup_branch_id}:${r.requested_vehicle.category.id}`; const map = counts.get(key) ?? new Map(); map.set(isoDay(w), (map.get(isoDay(w)) ?? 0) + 1); counts.set(key, map); }
  const result = new Map<string, WeeklyActual[]>();
  for (const [key, map] of counts) { const values: WeeklyActual[] = []; for (let w = new Date(coverage); w <= latest; w = addWeeks(w, 1)) values.push({ weekStart: isoDay(w), weekEnd: isoDay(addWeeks(w, 1)), demand: map.get(isoDay(w)) ?? 0 }); result.set(key, values); }
  return result;
}

export function ape(actual: number, forecast: number): number | null { return actual > 0 ? Math.abs((actual - forecast) / actual) * 100 : null; }
export function mape(records: Array<{ horizon: number; targetWeekStart: string; generatedAt: string; actualDemand: number | null; forecastedDemand: number }>) {
  const valid = records.filter(r => r.horizon === 1 && r.actualDemand != null && r.actualDemand > 0).sort((a,b) => a.targetWeekStart.localeCompare(b.targetWeekStart) || b.generatedAt.localeCompare(a.generatedAt));
  const chosen = new Map<string, typeof valid[number]>(); for (const r of valid) if (!chosen.has(r.targetWeekStart) && new Date(r.generatedAt) < new Date(`${r.targetWeekStart}T00:00:00+08:00`)) chosen.set(r.targetWeekStart, r);
  const values = [...chosen.values()].map(r => ape(r.actualDemand!, r.forecastedDemand)!); return values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
}

export function mapeFromDatabaseRows(rows: any[]) {
  return mape(rows.map(r => ({ horizon: Number(r.horizon), targetWeekStart: r.target_week_start, generatedAt: r.created_at ?? new Date(0).toISOString(), actualDemand: r.actual_demand == null ? null : Number(r.actual_demand), forecastedDemand: Number(r.forecasted_demand) })));
}

export async function loadCanonicalBookings() {
  const { getSupabaseServerClient } = await import("./supabase/server");
  const client = getSupabaseServerClient() as any;
  const result = await client.from("booking_requests").select("id,booking_status,pickup_at,pickup_branch_id,requested_vehicle:vehicles!booking_requests_requested_vehicle_id(id,category:vehicle_categories(id,name))");
  if (result.error) throw result.error;
  return result.data ?? [];
}

export async function loadDemandCoverage() {
  const { getSupabaseServerClient } = await import("./supabase/server");
  const client = getSupabaseServerClient() as any;
  const result = await client.from("forecast_demand_coverage").select("tracking_started_at").eq("id", 1).single();
  if (result.error || !result.data?.tracking_started_at) throw new Error("Demand coverage is not configured.");
  return result.data.tracking_started_at as string;
}
