import { calculateMaintenanceReadiness } from "./maintenance-readiness.server";
import { overlaps, manilaDateBoundaryToInstant } from "./supply-evaluation.server";
import { getSupabaseServerClient } from "./supabase/server";
import { calculateCanonicalIdleSnapshot } from "./vehicle-analytics.server";

export type AllocationEvaluation = {
  id: string;
  evaluatedAt: string;
  forecastId: string;
  branchId: string;
  categoryId: string;
  horizon: number;
  targetWeekStart: string;
  targetWeekEnd: string;
  requiredUnits: number;
  projectedSupply: number;
  shortageUnits: number;
  surplusUnits: number;
};

export type AllocationCandidate = {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string | null;
  idleDays: number | null;
  idleReference: string | null;
  revalidationState: "EligibleAtGeneration";
  explanationCodes: string[];
};

export type AllocationDraft = {
  source: AllocationEvaluation;
  destination: AllocationEvaluation;
  recommendedUnits: number;
};

export function selectLatestEvaluations(evaluations: AllocationEvaluation[]) {
  const latest = new Map<string, AllocationEvaluation>();
  for (const evaluation of evaluations) {
    const existing = latest.get(evaluation.forecastId);
    if (
      !existing ||
      evaluation.evaluatedAt > existing.evaluatedAt ||
      (evaluation.evaluatedAt === existing.evaluatedAt && evaluation.id > existing.id)
    ) latest.set(evaluation.forecastId, evaluation);
  }
  return [...latest.values()];
}

export function generateAllocationDrafts(
  evaluations: AllocationEvaluation[],
  candidateCounts: ReadonlyMap<string, number>,
): AllocationDraft[] {
  const destinations = evaluations
    .filter((e) => e.shortageUnits > 0)
    .sort((a, b) => a.branchId.localeCompare(b.branchId) || a.id.localeCompare(b.id));
  const sources = evaluations
    .filter((e) => e.surplusUnits > 0)
    .sort((a, b) => a.branchId.localeCompare(b.branchId) || a.id.localeCompare(b.id));
  const destinationRemaining = new Map(destinations.map((e) => [e.id, e.shortageUnits]));
  const sourceRemaining = new Map(sources.map((e) => [e.id, e.surplusUnits]));
  const candidateRemaining = new Map(
    sources.map((e) => [e.id, Math.max(0, candidateCounts.get(e.id) ?? 0)]),
  );
  const drafts: AllocationDraft[] = [];

  for (const destination of destinations) {
    for (const source of sources) {
      if (
        source.branchId === destination.branchId ||
        source.categoryId !== destination.categoryId ||
        source.horizon !== destination.horizon ||
        source.targetWeekStart !== destination.targetWeekStart ||
        source.targetWeekEnd !== destination.targetWeekEnd
      ) continue;
      const recommendedUnits = Math.min(
        destinationRemaining.get(destination.id) ?? 0,
        sourceRemaining.get(source.id) ?? 0,
        candidateRemaining.get(source.id) ?? 0,
      );
      if (recommendedUnits <= 0) continue;
      drafts.push({ source, destination, recommendedUnits });
      destinationRemaining.set(
        destination.id,
        (destinationRemaining.get(destination.id) ?? 0) - recommendedUnits,
      );
      sourceRemaining.set(
        source.id,
        (sourceRemaining.get(source.id) ?? 0) - recommendedUnits,
      );
      candidateRemaining.set(
        source.id,
        (candidateRemaining.get(source.id) ?? 0) - recommendedUnits,
      );
    }
  }
  return drafts;
}

export function rankAllocationCandidates(candidates: AllocationCandidate[]) {
  return [...candidates].sort((a, b) => {
    if (a.idleDays == null && b.idleDays != null) return 1;
    if (a.idleDays != null && b.idleDays == null) return -1;
    if (a.idleDays != null && b.idleDays != null && a.idleDays !== b.idleDays)
      return b.idleDays - a.idleDays;
    return a.vehicleId.localeCompare(b.vehicleId);
  });
}

export function validateAllocationDecision(
  state: unknown,
  approvedUnits: unknown,
  recommendedUnits: number,
) {
  if (state === "Rejected") return { state, approvedUnits: null } as const;
  if (
    state !== "Approved" ||
    !Number.isInteger(approvedUnits) ||
    Number(approvedUnits) <= 0 ||
    Number(approvedUnits) > recommendedUnits
  ) throw new Error("invalid_allocation_decision");
  return { state, approvedUnits: Number(approvedUnits) } as const;
}

export async function revalidateSourceCandidates(
  evaluation: AllocationEvaluation,
  snapshotVehicleIds: string[],
  now = new Date(),
): Promise<AllocationCandidate[]> {
  if (!snapshotVehicleIds.length) return [];
  const client = getSupabaseServerClient() as any;
  const weekStart = manilaDateBoundaryToInstant(evaluation.targetWeekStart);
  const weekEnd = manilaDateBoundaryToInstant(evaluation.targetWeekEnd);
  if (!weekStart || !weekEnd) return [];
  const [vehicles, bookings, rentals, events] = await Promise.all([
    client.from("vehicles").select("id,name,license_plate,branch_id,category_id,is_active").in("id", snapshotVehicleIds),
    client.from("booking_requests").select("assigned_vehicle_id,pickup_at,return_at,booking_status").in("assigned_vehicle_id", snapshotVehicleIds).eq("booking_status", "Confirmed"),
    client.from("rental_transactions").select("vehicle_id,started_at,ended_at").in("vehicle_id", snapshotVehicleIds),
    client.from("vehicle_operational_state_events").select("vehicle_id,is_active,effective_at").in("vehicle_id", snapshotVehicleIds).order("effective_at", { ascending: true }),
  ]);
  if (vehicles.error || bookings.error || rentals.error || events.error)
    throw vehicles.error ?? bookings.error ?? rentals.error ?? events.error;

  const candidates: AllocationCandidate[] = [];
  for (const vehicle of vehicles.data ?? []) {
    if (
      vehicle.branch_id !== evaluation.branchId ||
      vehicle.category_id !== evaluation.categoryId ||
      !vehicle.is_active
    ) continue;
    let readiness;
    try { readiness = await calculateMaintenanceReadiness(vehicle.id); }
    catch { continue; }
    if (!readiness.maintenanceReady) continue;
    const vehicleRentals = (rentals.data ?? []).filter((r: any) => r.vehicle_id === vehicle.id);
    if (vehicleRentals.some((r: any) => r.started_at && (!r.ended_at || overlaps(r.started_at, r.ended_at, weekStart, weekEnd)))) continue;
    if ((bookings.data ?? []).some((b: any) => b.assigned_vehicle_id === vehicle.id && overlaps(b.pickup_at, b.return_at, weekStart, weekEnd))) continue;
    const idle = calculateCanonicalIdleSnapshot(
      vehicleRentals,
      (events.data ?? []).filter((e: any) => e.vehicle_id === vehicle.id),
      now,
    );
    candidates.push({
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      licensePlate: vehicle.license_plate,
      idleDays: idle.idleDays,
      idleReference: idle.idleReference,
      revalidationState: "EligibleAtGeneration",
      explanationCodes: ["VS015Eligible", "CurrentConstraintsPassed"],
    });
  }
  return rankAllocationCandidates(candidates);
}
