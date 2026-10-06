/* eslint-disable @typescript-eslint/no-explicit-any -- Decision-support tables are normalized at this server boundary until generated database types include them. */
import {
  assertCanonicalBranch,
  buildAdminReport,
  buildDecisionSupportReport,
  previousReportRange,
  ReportSourceError,
  ALL_BRANCHES,
  type AdminReportsResponse,
  type ReportRange,
} from "./admin-reports";
import { forecastAccuracyFromDatabaseRows } from "./forecasting.server";
import { getSupabaseServerClient } from "./supabase/server";
import { getVehicleAnalytics } from "./vehicle-analytics.server";

export async function loadAdminReport(
  role: "Owner/Admin" | "Operations Staff",
  range: ReportRange,
  branchFilter: string,
): Promise<AdminReportsResponse> {
  const client = getSupabaseServerClient();
  const decisionClient = client as any;
  const historicalStart = previousReportRange(range).startInstant;
  const [
    branches,
    categories,
    bookings,
    rentals,
    maintenance,
    vehicles,
    analytics,
    payments,
  ] = await Promise.all([
    client.from("branches").select("id,name,is_active").order("name"),
    client.from("vehicle_categories").select("id,name,is_active").order("name"),
    client
      .from("booking_requests")
      .select(
        "id,booking_status,created_at,pickup_branch_id,purpose_of_use,destination,pickup_delivery_option",
      )
      .gte("created_at", historicalStart)
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
    role === "Owner/Admin"
      ? decisionClient
          .from("payments")
          .select(
            "id,status,submitted_at,reviewed_at,submitted_amount,reviewed_submitted_amount,booking:booking_requests(pickup_branch_id)",
          )
      : Promise.resolve({ data: [], error: null }),
  ]);
  const failed = [
    branches,
    categories,
    bookings,
    rentals,
    maintenance,
    vehicles,
    payments,
  ].find((result) => result.error);
  if (failed?.error)
    throw new ReportSourceError("canonical report source failed");

  const branchRows = (branches.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
  }));
  assertCanonicalBranch(branchFilter, branchRows);

  const categoryRows = (categories.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
  }));
  let accuracyQuery = decisionClient
    .from("forecasts")
    .select(
      "branch_id,vehicle_category_id,horizon,target_week_start,forecasted_demand,actual_demand,created_at",
    )
    .eq("horizon", 1)
    .gte("target_week_start", range.start)
    .lte("target_week_start", range.end);
  if (branchFilter !== ALL_BRANCHES)
    accuracyQuery = accuracyQuery.eq("branch_id", branchFilter);
  const [latestRunResult, accuracyResult] = await Promise.all([
    decisionClient
      .from("forecast_runs")
      .select("id,generated_at,method")
      .gte("generated_at", range.startInstant)
      .lt("generated_at", range.endExclusiveInstant)
      .order("generated_at", { ascending: false })
      .limit(1),
    accuracyQuery,
  ]);
  if (latestRunResult.error || accuracyResult.error)
    throw new ReportSourceError("decision-support report source failed");

  const latestRunRow = latestRunResult.data?.[0] ?? null;
  const latestRun = latestRunRow
    ? {
        id: String(latestRunRow.id),
        generatedAt: String(latestRunRow.generated_at),
        method: String(latestRunRow.method),
      }
    : null;
  const forecastResult = latestRun
    ? await decisionClient
        .from("forecasts")
        .select(
          "id,branch_id,vehicle_category_id,horizon,target_week_start,forecasted_demand,required_vehicle_units",
        )
        .eq("run_id", latestRun.id)
    : { data: [], error: null };
  if (forecastResult.error)
    throw new ReportSourceError("decision-support forecast source failed");

  const forecastRows = forecastResult.data ?? [];
  const forecastIds = forecastRows.map((row: any) => String(row.id));
  const [supplyResult, batchResult] = await Promise.all([
    forecastIds.length
      ? decisionClient
          .from("supply_evaluations")
          .select(
            "id,forecast_id,evaluated_at,projected_supply,shortage_units,surplus_units",
          )
          .in("forecast_id", forecastIds)
          .lt("evaluated_at", range.endExclusiveInstant)
      : { data: [], error: null },
    latestRun
      ? decisionClient
          .from("allocation_recommendation_batches")
          .select("id,generated_at")
          .gte("generated_at", latestRun.generatedAt)
          .lt("generated_at", range.endExclusiveInstant)
      : { data: [], error: null },
  ]);
  if (supplyResult.error || batchResult.error)
    throw new ReportSourceError("decision-support snapshot source failed");

  const batchRows = batchResult.data ?? [];
  const batchIds = batchRows.map((row: any) => String(row.id));
  const recommendationResult = batchIds.length
    ? await decisionClient
        .from("allocation_recommendations")
        .select(
          "batch_id,source_supply_evaluation_id,destination_supply_evaluation_id,source_branch_id,destination_branch_id,decision_state,recommended_transfer_units,approved_transfer_units,decided_at",
        )
        .in("batch_id", batchIds)
    : { data: [], error: null };
  if (recommendationResult.error)
    throw new ReportSourceError("decision-support allocation source failed");

  const branchNames = new Map(branchRows.map((row) => [row.id, row.name]));
  const categoryNames = new Map(categoryRows.map((row) => [row.id, row.name]));
  const decisionSupport = buildDecisionSupportReport(
    latestRun,
    branchFilter,
    forecastRows.map((row: any) => ({
      id: String(row.id),
      branchId: String(row.branch_id),
      branchName: branchNames.get(String(row.branch_id)) ?? "Unknown branch",
      categoryId: String(row.vehicle_category_id),
      categoryName:
        categoryNames.get(String(row.vehicle_category_id)) ??
        "Unknown category",
      horizon: Number(row.horizon),
      targetWeekStart: String(row.target_week_start),
      forecastedDemand: Number(row.forecasted_demand),
      requiredUnits: Number(row.required_vehicle_units),
    })),
    (supplyResult.data ?? []).map((row: any) => ({
      id: String(row.id),
      forecastId: String(row.forecast_id),
      evaluatedAt: String(row.evaluated_at),
      projectedSupply: Number(row.projected_supply),
      shortageUnits: Number(row.shortage_units),
      surplusUnits: Number(row.surplus_units),
    })),
    batchRows.map((row: any) => ({
      id: String(row.id),
      generatedAt: String(row.generated_at),
    })),
    (recommendationResult.data ?? []).map((row: any) => ({
      batchId: String(row.batch_id),
      sourceSupplyEvaluationId: String(row.source_supply_evaluation_id),
      destinationSupplyEvaluationId: String(
        row.destination_supply_evaluation_id,
      ),
      sourceBranchId: String(row.source_branch_id),
      destinationBranchId: String(row.destination_branch_id),
      decisionState:
        row.decided_at != null &&
        new Date(row.decided_at).getTime() >=
          new Date(range.endExclusiveInstant).getTime()
          ? "Pending"
          : row.decision_state,
      recommendedUnits: Number(row.recommended_transfer_units),
      approvedUnits:
        row.approved_transfer_units == null ||
        (row.decided_at != null &&
          new Date(row.decided_at).getTime() >=
            new Date(range.endExclusiveInstant).getTime())
          ? null
          : Number(row.approved_transfer_units),
    })),
    forecastAccuracyFromDatabaseRows(accuracyResult.data ?? []),
  );

  const report = buildAdminReport(role, range, branchFilter, {
    branches: branchRows,
    categories: categoryRows,
    bookings: (bookings.data ?? []).map((row) => ({
      id: row.id,
      status: row.booking_status,
      createdAt: row.created_at,
      branchId: row.pickup_branch_id,
      purpose: row.purpose_of_use,
      destination: row.destination,
      service: row.pickup_delivery_option,
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
    ...(role === "Owner/Admin"
      ? {
          payments: (payments.data ?? []).map((row: any) => ({
            id: String(row.id),
            branchId: row.booking?.pickup_branch_id ?? null,
            status: String(row.status),
            submittedAt: row.submitted_at,
            reviewedAt: row.reviewed_at,
            submittedAmount:
              row.submitted_amount == null
                ? null
                : Number(row.submitted_amount),
            reviewedSubmittedAmount:
              row.reviewed_submitted_amount == null
                ? null
                : Number(row.reviewed_submitted_amount),
          })),
        }
      : {}),
  });
  return { ...report, decisionSupport };
}
