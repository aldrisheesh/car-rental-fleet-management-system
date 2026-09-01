import { createFileRoute } from "@tanstack/react-router";
import {
  generateAllocationDrafts,
  revalidateSourceCandidates,
  selectLatestEvaluations,
  validateAllocationDecision,
  type AllocationCandidate,
  type AllocationEvaluation,
} from "@/lib/allocation-recommendation.server";
import { AuthBoundaryError, requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const fail = (message: string, status = 400) => Response.json({ message }, { status });
const internal = (role: string) => role === "Owner/Admin" || role === "Operations Staff";
const authStatus = (error: unknown) => error instanceof AuthBoundaryError ? (error.reason === "forbidden" ? 403 : 401) : 503;

async function loadRecommendationView(client: any, batchId?: string) {
  let batchQuery = client.from("allocation_recommendation_batches").select("id,generated_by,generated_at,idempotency_key,created_at").order("generated_at", { ascending: false });
  if (batchId) batchQuery = batchQuery.eq("id", batchId);
  const batches = await batchQuery;
  if (batches.error) throw batches.error;
  const batchIds = (batches.data ?? []).map((b: any) => b.id);
  if (!batchIds.length) return { batches: [], recommendations: [] };
  const recommendations = await client.from("allocation_recommendations").select("*").in("batch_id", batchIds).order("created_at", { ascending: false });
  if (recommendations.error) throw recommendations.error;
  const recommendationIds = (recommendations.data ?? []).map((r: any) => r.id);
  const branchIds = [...new Set((recommendations.data ?? []).flatMap((r: any) => [r.source_branch_id, r.destination_branch_id]))];
  const categoryIds = [...new Set((recommendations.data ?? []).map((r: any) => r.vehicle_category_id))];
  const evaluationIds = [...new Set((recommendations.data ?? []).flatMap((r: any) => [r.source_supply_evaluation_id, r.destination_supply_evaluation_id]))];
  const [candidates, branches, categories, evaluations] = await Promise.all([
    recommendationIds.length ? client.from("allocation_recommendation_candidates").select("*").in("recommendation_id", recommendationIds).order("candidate_rank", { ascending: true }) : { data: [], error: null },
    branchIds.length ? client.from("branches").select("id,name").in("id", branchIds) : { data: [], error: null },
    categoryIds.length ? client.from("vehicle_categories").select("id,name").in("id", categoryIds) : { data: [], error: null },
    evaluationIds.length ? client.from("supply_evaluations").select("id,evaluated_at").in("id", evaluationIds) : { data: [], error: null },
  ]);
  if (candidates.error || branches.error || categories.error || evaluations.error) throw candidates.error ?? branches.error ?? categories.error ?? evaluations.error;
  const branchNames = new Map((branches.data ?? []).map((x: any) => [x.id, x.name]));
  const categoryNames = new Map((categories.data ?? []).map((x: any) => [x.id, x.name]));
  const evaluationTimes = new Map((evaluations.data ?? []).map((x: any) => [x.id, x.evaluated_at]));
  return {
    batches: batches.data ?? [],
    recommendations: (recommendations.data ?? []).map((r: any) => ({
      ...r,
      source_branch_name: branchNames.get(r.source_branch_id) ?? r.source_branch_id,
      destination_branch_name: branchNames.get(r.destination_branch_id) ?? r.destination_branch_id,
      vehicle_category_name: categoryNames.get(r.vehicle_category_id) ?? r.vehicle_category_id,
      source_evaluated_at: evaluationTimes.get(r.source_supply_evaluation_id) ?? null,
      destination_evaluated_at: evaluationTimes.get(r.destination_supply_evaluation_id) ?? null,
      candidates: (candidates.data ?? []).filter((x: any) => x.recommendation_id === r.id),
    })),
  };
}

async function read() {
  try {
    const principal = await requirePrincipal();
    if (!internal(principal.role)) return fail("Allocation recommendation access is restricted.", 403);
    return Response.json(await loadRecommendationView(getSupabaseServerClient() as any));
  } catch (error) {
    return fail(error instanceof AuthBoundaryError ? (error.reason === "forbidden" ? "Allocation recommendation access is restricted." : "Authentication required.") : "Unable to load allocation recommendations.", authStatus(error));
  }
}

async function generate({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    if (principal.role !== "Owner/Admin") return fail("Owner/Admin access is required.", 403);
    const body = await request.json().catch(() => ({}));
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    if (!idempotencyKey || idempotencyKey.length > 200) return fail("A valid idempotencyKey is required.");
    const client = getSupabaseServerClient() as any;
    const [evaluationRows, forecasts] = await Promise.all([
      client.from("supply_evaluations").select("id,forecast_id,evaluated_at,required_units_snapshot,projected_supply,shortage_units,surplus_units"),
      client.from("forecasts").select("id,branch_id,vehicle_category_id,horizon,target_week_start,target_week_end"),
    ]);
    if (evaluationRows.error || forecasts.error) return fail("Unable to load canonical supply evaluations.", 503);
    const forecastById = new Map((forecasts.data ?? []).map((f: any) => [f.id, f]));
    const allEvaluations: AllocationEvaluation[] = (evaluationRows.data ?? []).flatMap((row: any) => {
      const forecast: any = forecastById.get(row.forecast_id);
      return forecast ? [{
        id: row.id,
        evaluatedAt: row.evaluated_at,
        forecastId: row.forecast_id,
        branchId: forecast.branch_id,
        categoryId: forecast.vehicle_category_id,
        horizon: Number(forecast.horizon),
        targetWeekStart: forecast.target_week_start,
        targetWeekEnd: forecast.target_week_end,
        requiredUnits: Number(row.required_units_snapshot),
        projectedSupply: Number(row.projected_supply),
        shortageUnits: Number(row.shortage_units),
        surplusUnits: Number(row.surplus_units),
      }] : [];
    });
    const latest = selectLatestEvaluations(allEvaluations);
    const sourceEvaluations = latest.filter((e) => e.surplusUnits > 0);
    const sourceIds = sourceEvaluations.map((e) => e.id);
    const snapshotItems = sourceIds.length
      ? await client.from("supply_evaluation_vehicles").select("evaluation_id,vehicle_id,eligible").in("evaluation_id", sourceIds).eq("eligible", true)
      : { data: [], error: null };
    if (snapshotItems.error) return fail("Unable to load VS015 vehicle snapshots.", 503);
    const candidatesBySource = new Map<string, AllocationCandidate[]>();
    await Promise.all(sourceEvaluations.map(async (evaluation) => {
      const ids = (snapshotItems.data ?? []).filter((x: any) => x.evaluation_id === evaluation.id).map((x: any) => x.vehicle_id);
      candidatesBySource.set(evaluation.id, await revalidateSourceCandidates(evaluation, ids));
    }));
    const candidateCounts = new Map([...candidatesBySource].map(([id, rows]) => [id, rows.length]));
    const drafts = generateAllocationDrafts(latest, candidateCounts);
    const payload = drafts.map(({ source, destination, recommendedUnits }) => ({
      source_supply_evaluation_id: source.id,
      destination_supply_evaluation_id: destination.id,
      source_branch_id: source.branchId,
      destination_branch_id: destination.branchId,
      vehicle_category_id: source.categoryId,
      forecast_horizon: source.horizon,
      target_week_start: source.targetWeekStart,
      target_week_end: source.targetWeekEnd,
      source_required_units_snapshot: source.requiredUnits,
      source_projected_supply_snapshot: source.projectedSupply,
      source_surplus_snapshot: source.surplusUnits,
      destination_required_units_snapshot: destination.requiredUnits,
      destination_projected_supply_snapshot: destination.projectedSupply,
      destination_shortage_snapshot: destination.shortageUnits,
      recommended_transfer_units: recommendedUnits,
      candidates: (candidatesBySource.get(source.id) ?? []).map((candidate, index) => ({
        vehicle_id: candidate.vehicleId,
        vehicle_name_snapshot: candidate.vehicleName,
        license_plate_snapshot: candidate.licensePlate,
        candidate_rank: index + 1,
        idle_days_snapshot: candidate.idleDays,
        idle_reference_snapshot: candidate.idleReference,
        explanation_codes: candidate.explanationCodes,
      })),
    }));
    const contextFingerprint = `all-latest-v1:${latest.map((e) => e.id).sort().join(",")}`;
    const persisted = await client.rpc("persist_allocation_recommendation_batch", {
      p_generated_by: principal.userId,
      p_idempotency_key: idempotencyKey,
      p_context_fingerprint: contextFingerprint,
      p_recommendations: payload,
    });
    if (persisted.error) {
      const mismatch = String(persisted.error.message).includes("idempotency_key_context_mismatch");
      return fail(mismatch ? "Idempotency key was already used for a different generation context." : "Unable to persist the allocation recommendation batch atomically.", 409);
    }
    return Response.json(await loadRecommendationView(client, persisted.data.id), { status: 201 });
  } catch (error) {
    return fail(error instanceof AuthBoundaryError ? (error.reason === "forbidden" ? "Owner/Admin access is required." : "Authentication required.") : "Unable to generate allocation recommendations.", error instanceof AuthBoundaryError ? (error.reason === "forbidden" ? 403 : 401) : 500);
  }
}

async function decide({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    if (principal.role !== "Owner/Admin") return fail("Owner/Admin access is required.", 403);
    const body = await request.json().catch(() => ({}));
    const recommendationId = typeof body.recommendationId === "string" ? body.recommendationId : "";
    if (!recommendationId) return fail("recommendationId is required.");
    const client = getSupabaseServerClient() as any;
    const current = await client.from("allocation_recommendations").select("recommended_transfer_units").eq("id", recommendationId).maybeSingle();
    if (current.error) return fail("Unable to load recommendation.", 503);
    if (!current.data) return fail("Recommendation not found.", 404);
    let decision;
    try { decision = validateAllocationDecision(body.state, body.approvedTransferUnits, Number(current.data.recommended_transfer_units)); }
    catch { return fail("Approved quantity must be positive and no greater than the recommendation."); }
    const result = await client.rpc("decide_allocation_recommendation", {
      p_recommendation_id: recommendationId,
      p_actor_id: principal.userId,
      p_decision_state: decision.state,
      p_approved_transfer_units: decision.approvedUnits,
    });
    if (result.error) {
      const terminal = String(result.error.message).includes("recommendation_already_decided");
      return fail(terminal ? "This recommendation has already been decided." : "Unable to record recommendation decision.", 409);
    }
    return Response.json({ recommendation: result.data });
  } catch (error) {
    return fail(error instanceof AuthBoundaryError ? (error.reason === "forbidden" ? "Owner/Admin access is required." : "Authentication required.") : "Unable to decide allocation recommendation.", error instanceof AuthBoundaryError ? (error.reason === "forbidden" ? 403 : 401) : 500);
  }
}

export const Route = createFileRoute("/api/allocation-recommendations")({
  server: { handlers: { GET: read, POST: generate, PATCH: decide } },
});
