/* eslint-disable @typescript-eslint/no-explicit-any -- Dynamic Supabase query rows are normalized at this server boundary. */
import { hasUnfinishedConfirmedReservation } from "./fleet-transfer-eligibility";
import {
  evaluateMaintenanceReadiness,
  selectAuthoritativePreventiveTargets,
} from "./maintenance-readiness.server";
import {
  hasFutureMaintenanceConflict,
  overlaps,
  manilaDateBoundaryToInstant,
} from "./supply-evaluation.server";
import { getSupabaseServerClient } from "./supabase/server";
import { calculateCanonicalIdleSnapshot } from "./vehicle-analytics.server";
import { instantToManilaCalendarDate } from "./business-time";
import {
  rankAllocationCandidates,
  type AllocationCandidate,
  type AllocationEvaluation,
} from "./allocation-recommendation.core";

export {
  buildAllocationSummary,
  explainUnresolvedShortages,
  generateAllocationDrafts,
  rankAllocationCandidates,
  selectLatestEvaluations,
  validateAllocationDecision,
} from "./allocation-recommendation.core";
export type {
  AllocationCandidate,
  AllocationDraft,
  AllocationEvaluation,
  AllocationSummary,
  UnresolvedShortage,
  UnresolvedShortageReason,
} from "./allocation-recommendation.core";

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
  const [vehicles, bookings, rentals, events, maintenance] = await Promise.all([
    client
      .from("vehicles")
      .select(
        "id,name,license_plate,branch_id,category_id,is_active,current_odometer_km,condition_blocks_rental_use",
      )
      .in("id", snapshotVehicleIds),
    client
      .from("booking_requests")
      .select("id,assigned_vehicle_id,pickup_at,return_at,booking_status")
      .in("assigned_vehicle_id", snapshotVehicleIds)
      .eq("booking_status", "Confirmed"),
    client
      .from("rental_transactions")
      .select("booking_id,vehicle_id,started_at,ended_at,inspection_status")
      .in("vehicle_id", snapshotVehicleIds),
    client
      .from("vehicle_operational_state_events")
      .select("vehicle_id,is_active,effective_at")
      .in("vehicle_id", snapshotVehicleIds)
      .order("effective_at", { ascending: true }),
    client
      .from("maintenance_records")
      .select(
        "vehicle_id,status,maintenance_type,blocks_rental_use,next_service_odometer,next_service_date,completed_at,created_at",
      )
      .in("vehicle_id", snapshotVehicleIds),
  ]);
  if (
    vehicles.error ||
    bookings.error ||
    rentals.error ||
    events.error ||
    maintenance.error
  )
    throw (
      vehicles.error ??
      bookings.error ??
      rentals.error ??
      events.error ??
      maintenance.error
    );

  const candidates: AllocationCandidate[] = [];
  for (const vehicle of vehicles.data ?? []) {
    if (
      vehicle.branch_id !== evaluation.branchId ||
      vehicle.category_id !== evaluation.categoryId ||
      !vehicle.is_active
    )
      continue;
    const readiness = evaluateMaintenanceReadiness(
      vehicle,
      (maintenance.data ?? []).filter(
        (record: any) => record.vehicle_id === vehicle.id,
      ),
      instantToManilaCalendarDate(now),
      (rentals.data ?? []).some(
        (r: any) =>
          r.vehicle_id === vehicle.id &&
          r.ended_at != null &&
          r.inspection_status === "Pending",
      ),
    );
    if (!readiness.maintenanceReady) continue;
    const maintenanceTargets = selectAuthoritativePreventiveTargets(
      (maintenance.data ?? []).filter(
        (record: { vehicle_id: string }) => record.vehicle_id === vehicle.id,
      ),
    );
    if (
      hasFutureMaintenanceConflict(maintenanceTargets, evaluation.targetWeekEnd)
    )
      continue;
    const vehicleRentals = (rentals.data ?? []).filter(
      (r: any) => r.vehicle_id === vehicle.id,
    );
    if (
      vehicleRentals.some(
        (r: any) =>
          r.started_at &&
          (!r.ended_at ||
            overlaps(r.started_at, r.ended_at, weekStart, weekEnd)),
      )
    )
      continue;
    if (
      hasUnfinishedConfirmedReservation(
        vehicle.id,
        bookings.data ?? [],
        vehicleRentals,
      )
    )
      continue;
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
