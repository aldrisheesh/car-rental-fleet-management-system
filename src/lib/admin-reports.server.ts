import {
  assertCanonicalBranch,
  buildAdminReport,
  ReportSourceError,
  type AdminReportsResponse,
  type ReportRange,
} from "./admin-reports";
import { getSupabaseServerClient } from "./supabase/server";
import { getVehicleAnalytics } from "./vehicle-analytics.server";

export async function loadAdminReport(
  role: "Owner/Admin" | "Operations Staff",
  range: ReportRange,
  branchFilter: string,
): Promise<AdminReportsResponse> {
  const client = getSupabaseServerClient();
  const [
    branches,
    categories,
    bookings,
    rentals,
    maintenance,
    vehicles,
    analytics,
  ] = await Promise.all([
    client.from("branches").select("id,name,is_active").order("name"),
    client.from("vehicle_categories").select("id,name,is_active").order("name"),
    client
      .from("booking_requests")
      .select("id,booking_status,created_at,pickup_branch_id")
      .gte("created_at", range.startInstant)
      .lt("created_at", range.endExclusiveInstant),
    client
      .from("rental_transactions")
      .select(
        "id,vehicle_id,started_at,ended_at,booking:booking_requests(pickup_branch_id)",
      )
      .lt("started_at", range.endExclusiveInstant),
    client
      .from("maintenance_records")
      .select(
        "id,vehicle_id,status,blocks_rental_use,service_started_at,completed_at,updated_at,vehicle:vehicles(branch_id)",
      )
      .lt("service_started_at", range.endExclusiveInstant),
    client.from("vehicles").select("id,branch_id,category_id,created_at"),
    getVehicleAnalytics(range.start, range.end),
  ]);
  const failed = [
    branches,
    categories,
    bookings,
    rentals,
    maintenance,
    vehicles,
  ].find((result) => result.error);
  if (failed?.error)
    throw new ReportSourceError("canonical report source failed");

  const branchRows = (branches.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
  }));
  assertCanonicalBranch(branchFilter, branchRows);

  return buildAdminReport(role, range, branchFilter, {
    branches: branchRows,
    categories: (categories.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
    })),
    bookings: (bookings.data ?? []).map((row) => ({
      id: row.id,
      status: row.booking_status,
      createdAt: row.created_at,
      branchId: row.pickup_branch_id,
    })),
    rentals: (rentals.data ?? []).map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      branchId: row.booking?.pickup_branch_id ?? null,
      startedAt: row.started_at,
      endedAt: row.ended_at,
    })),
    maintenance: (maintenance.data ?? []).map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      branchId: row.vehicle?.branch_id ?? null,
      status: row.status,
      blocksRentalUse: row.blocks_rental_use,
      serviceStartedAt: row.service_started_at,
      completedAt: row.completed_at,
      updatedAt: row.updated_at,
    })),
    vehicles: (vehicles.data ?? []).map((row) => ({
      id: row.id,
      branchId: row.branch_id,
      categoryId: row.category_id,
      createdAt: row.created_at,
    })),
    vehicleAnalytics: analytics,
  });
}
