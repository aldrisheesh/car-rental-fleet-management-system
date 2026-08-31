import { calculateMaintenanceReadiness } from "./maintenance-readiness.server";
import { getSupabaseServerClient } from "./supabase/server";

const TZ = "Asia/Manila";
const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
const localDate = (key: string) => new Date(`${key}T00:00:00+08:00`);
const addDays = (key: string, n: number) => {
  const d = localDate(key);
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d);
};
const datesBetween = (from: string, to: string) => {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
};

export type VehicleAnalyticsRow = {
  vehicleId: string;
  name: string;
  licensePlate: string | null;
  branch: string | null;
  category: string | null;
  isActive: boolean;
  reportingStart: string;
  reportingEnd: string;
  coverage: "Complete" | "Partial/Insufficient Historical Eligibility Data";
  rentalDays: number;
  eligibleOperationalDays: number | null;
  utilizationPercent: number | null;
  maintenanceReady: boolean;
  maintenanceReasons: string[];
  activeRental: boolean;
  idleEligible: boolean;
  idleReference: string | null;
  idleDays: number | null;
  idleClassification: "Idle" | "Not Idle" | "Unable to Determine";
};

export async function getVehicleAnalytics(
  startDate: string,
  endDate: string,
  now = new Date(),
): Promise<VehicleAnalyticsRow[]> {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    startDate > endDate
  )
    throw new Error("Invalid reporting range");
  const days = datesBetween(startDate, endDate);
  if (days.length > 366)
    throw new Error("Reporting range is limited to 366 days");
  const client = getSupabaseServerClient();
  const db = client as any;
  const [
    { data: vehicles, error: ve },
    { data: rentals, error: re },
    { data: maintenance, error: me },
    { data: events, error: ee },
  ] = await Promise.all([
    db
      .from("vehicles")
      .select(
        "id,name,license_plate,is_active,branch:branches(name),category:vehicle_categories(name)",
      ),
    db.from("rental_transactions").select("vehicle_id,started_at,ended_at"),
    db
      .from("maintenance_records")
      .select(
        "vehicle_id,status,blocks_rental_use,service_started_at,completed_at",
      ),
    db
      .from("vehicle_operational_state_events")
      .select("vehicle_id,is_active,effective_at")
      .order("effective_at", { ascending: true }),
  ]);
  if (ve || re || me || ee) throw ve ?? re ?? me ?? ee;
  const nowKey = dayKey(now);
  return await Promise.all(
    (vehicles ?? []).map(async (v: any) => {
      const vr = (rentals ?? []).filter((r: any) => r.vehicle_id === v.id);
      const rentalDaysSet = new Set<string>();
      for (const r of vr) {
        if (!r.started_at) continue;
        const end = r.ended_at ? new Date(r.ended_at) : now;
        const start = new Date(r.started_at);
        for (const d of datesBetween(dayKey(start), dayKey(end)))
          if (d >= startDate && d <= endDate) rentalDaysSet.add(d);
      }
      const vevents = (events ?? []).filter((e: any) => e.vehicle_id === v.id);
      const coverage = days.every((d) =>
        vevents.some((e: any) => new Date(e.effective_at) <= localDate(d)),
      )
        ? "Complete"
        : "Partial/Insufficient Historical Eligibility Data";
      const blockers = (maintenance ?? []).filter(
        (m: any) =>
          m.vehicle_id === v.id &&
          m.blocks_rental_use &&
          m.status !== "Cancelled",
      );
      const eligible =
        coverage === "Complete"
          ? days.filter((d) => {
              const state = [...vevents]
                .reverse()
                .find((e: any) => new Date(e.effective_at) <= localDate(d));
              if (!state?.is_active) return false;
              if (rentalDaysSet.has(d)) return true;
              return !blockers.some(
                (m: any) =>
                  dayKey(new Date(m.service_started_at)) <= d &&
                  (!m.completed_at || dayKey(new Date(m.completed_at)) >= d),
              );
            }).length
          : null;
      const readiness = await calculateMaintenanceReadiness(v.id);
      const activeRental = vr.some((r: any) => r.started_at && !r.ended_at);
      const ended = vr
        .filter((r: any) => r.ended_at)
        .sort(
          (a: any, b: any) => +new Date(b.ended_at) - +new Date(a.ended_at),
        )[0];
      const baseline =
        ended?.ended_at ?? (vevents.length ? vevents[0].effective_at : null);
      const idleDays = baseline
        ? Math.max(
            0,
            datesBetween(dayKey(new Date(baseline)), nowKey).length - 1,
          )
        : null;
      const idleEligible = Boolean(
        v.is_active && readiness.maintenanceReady && !activeRental,
      );
      const idleClassification = !baseline
        ? "Unable to Determine"
        : idleEligible && (idleDays ?? 0) >= 14
          ? "Idle"
          : "Not Idle";
      return {
        vehicleId: v.id,
        name: v.name,
        licensePlate: v.license_plate,
        branch: v.branch?.name ?? null,
        category: v.category?.name ?? null,
        isActive: v.is_active,
        reportingStart: startDate,
        reportingEnd: endDate,
        coverage,
        rentalDays: rentalDaysSet.size,
        eligibleOperationalDays: eligible,
        utilizationPercent:
          eligible && eligible > 0 && coverage === "Complete"
            ? (rentalDaysSet.size / eligible) * 100
            : null,
        maintenanceReady: readiness.maintenanceReady,
        maintenanceReasons: readiness.reasons,
        activeRental,
        idleEligible,
        idleReference: baseline,
        idleDays,
        idleClassification,
      };
    }),
  );
}
