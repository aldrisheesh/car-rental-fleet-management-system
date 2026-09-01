import { calculateMaintenanceReadiness } from "./maintenance-readiness.server";
import { getSupabaseServerClient } from "./supabase/server";
import {
  addDays,
  datesBetween,
  dayKey,
  localDate,
  overlapsLocalDay,
} from "./vehicle-analytics-intervals";

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

export type CanonicalIdleSnapshot = {
  idleReference: string | null;
  idleDays: number | null;
};

/** Canonical VS013 idle-duration calculation, reusable by later advisory slices. */
export function calculateCanonicalIdleSnapshot(
  rentals: { ended_at: string | null }[],
  stateEvents: { is_active: boolean; effective_at: string }[],
  now = new Date(),
): CanonicalIdleSnapshot {
  const ended = rentals
    .filter((r) => r.ended_at)
    .sort(
      (a, b) =>
        +new Date(b.ended_at as string) - +new Date(a.ended_at as string),
    )[0];
  let currentActiveStart: string | null = null;
  for (const event of stateEvents) {
    if (event.is_active) currentActiveStart = event.effective_at;
    else currentActiveStart = null;
  }
  const baselineCandidates = [ended?.ended_at, currentActiveStart].filter(
    (value): value is string => Boolean(value),
  );
  const idleReference = baselineCandidates.length
    ? new Date(
        Math.max(...baselineCandidates.map((value) => +new Date(value))),
      ).toISOString()
    : null;
  return {
    idleReference,
    idleDays: idleReference
      ? Math.max(
          0,
          datesBetween(dayKey(new Date(idleReference)), dayKey(now)).length - 1,
        )
      : null,
  };
}

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
  return await Promise.all(
    (vehicles ?? []).map(async (v: any) => {
      const vr = (rentals ?? []).filter((r: any) => r.vehicle_id === v.id);
      const rentalDaysSet = new Set<string>();
      for (const r of vr) {
        if (!r.started_at) continue;
        const end = r.ended_at ? new Date(r.ended_at) : now;
        const start = new Date(r.started_at);
        for (const d of days)
          if (overlapsLocalDay(start, end, d)) rentalDaysSet.add(d);
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
              return !blockers.some((m: any) =>
                overlapsLocalDay(
                  new Date(m.service_started_at),
                  m.completed_at ? new Date(m.completed_at) : now,
                  d,
                ),
              );
            }).length
          : null;
      const readiness = await calculateMaintenanceReadiness(v.id);
      const activeRental = vr.some((r: any) => r.started_at && !r.ended_at);
      const { idleReference: baseline, idleDays } =
        calculateCanonicalIdleSnapshot(vr, vevents, now);
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
