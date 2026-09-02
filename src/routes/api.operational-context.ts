import { createFileRoute } from "@tanstack/react-router";
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase dynamic query adapter is isolated at this server boundary. */
import {
  handleOperationalContextRequest,
  type OperationalContextRepository,
} from "@/lib/admin-operational-context.server";
import { requirePrincipal } from "@/lib/auth.server";
import { getTrustedTripContext } from "@/lib/external-context.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function repository(client: any): OperationalContextRepository {
  const one = async (query: any) => {
    const result = await query.maybeSingle();
    if (result.error) throw new Error("canonical_read_failed");
    return result.data;
  };
  return {
    async findBooking(id) {
      const row = await one(
        client
          .from("booking_requests")
          .select("id,destination,pickup_at,pickup_branch_id,booking_status")
          .eq("id", id),
      );
      return row
        ? {
            id: row.id,
            destination: row.destination,
            pickupAt: row.pickup_at,
            pickupBranchId: row.pickup_branch_id,
            bookingStatus: row.booking_status,
          }
        : null;
    },
    async findBranch(id) {
      const row = await one(
        client.from("branches").select("id,name,address").eq("id", id),
      );
      return row ?? null;
    },
    async findActiveVehicle(id) {
      const row = await one(
        client
          .from("vehicles")
          .select(
            "id,name,license_plate,reference_fuel_efficiency_km_per_liter",
          )
          .eq("id", id)
          .eq("is_active", true),
      );
      return row
        ? {
            id: row.id,
            name: row.name,
            licensePlate: row.license_plate,
            referenceEfficiencyKmPerLiter:
              row.reference_fuel_efficiency_km_per_liter,
          }
        : null;
    },
    async findAllocation(id) {
      const row = await one(
        client
          .from("allocation_recommendations")
          .select(
            "id,source_branch_id,destination_branch_id,recommended_transfer_units",
          )
          .eq("id", id),
      );
      return row
        ? {
            id: row.id,
            sourceBranchId: row.source_branch_id,
            destinationBranchId: row.destination_branch_id,
            recommendedTransferUnits: Number(row.recommended_transfer_units),
          }
        : null;
    },
    async findAllocationCandidates(recommendationId) {
      const rows = await client
        .from("allocation_recommendation_candidates")
        .select(
          "vehicle_id,vehicle_name_snapshot,license_plate_snapshot,candidate_rank",
        )
        .eq("recommendation_id", recommendationId)
        .order("candidate_rank", { ascending: true });
      if (rows.error) throw new Error("canonical_read_failed");
      const vehicleIds = (rows.data ?? []).map((row: any) => row.vehicle_id);
      const vehicles = vehicleIds.length
        ? await client
            .from("vehicles")
            .select(
              "id,name,license_plate,reference_fuel_efficiency_km_per_liter",
            )
            .in("id", vehicleIds)
        : { data: [], error: null };
      if (vehicles.error) throw new Error("canonical_read_failed");
      const byId = new Map(
        (vehicles.data ?? []).map((vehicle: any) => [vehicle.id, vehicle]),
      );
      return (rows.data ?? []).map((row: any) => {
        const vehicle: any = byId.get(row.vehicle_id);
        return {
          id: row.vehicle_id,
          name: vehicle?.name ?? row.vehicle_name_snapshot,
          licensePlate: vehicle?.license_plate ?? row.license_plate_snapshot,
          candidateRank: Number(row.candidate_rank),
          referenceEfficiencyKmPerLiter:
            vehicle?.reference_fuel_efficiency_km_per_liter ?? null,
        };
      });
    },
  };
}

async function post({ request }: { request: Request }) {
  return handleOperationalContextRequest(request, {
    getPrincipal: requirePrincipal,
    repository: repository(getSupabaseServerClient() as any),
    getTripContext: getTrustedTripContext,
  });
}

export const Route = createFileRoute("/api/operational-context")({
  server: { handlers: { POST: post } },
});
