import type {
  CanonicalForecast,
  CanonicalSupplyEvaluation,
} from "./admin-decisions.ts";
import type { AllocationRow } from "./allocation-review.ts";

export type AllocationGap = {
  evaluationId: string;
  branchId: string;
  categoryId: string;
  horizon: number;
  targetWeekStart: string;
  targetWeekEnd: string;
  shortageUnits: number;
  recommendedUnits: number;
  unresolvedUnits: number;
  compatibleSourceCount: number;
  eligibleCandidateCount: number;
  reason:
    | "NoCompatibleSurplus"
    | "NoEligibleCandidates"
    | "InsufficientEligibleCandidates"
    | "NoRemainingCapacity";
};
export type AllocationSummary = {
  evaluatedPositions: number;
  shortagePositions: number;
  surplusPositions: number;
  generatedRecommendations: number;
  unresolvedShortages: AllocationGap[];
};

/** Decisions are planning permissions, never evidence of executed movement. */
export function allocationDecisionCoverage(
  evaluationId: string,
  shortageUnits: number,
  rows: AllocationRow[],
) {
  const matching = rows.filter(
    (row) => row.destination_supply_evaluation_id === evaluationId,
  );
  const pending = matching
    .filter((row) => row.decision_state === "Pending")
    .reduce((sum, row) => sum + row.recommended_transfer_units, 0);
  const approved = matching
    .filter((row) => row.decision_state === "Approved")
    .reduce((sum, row) => sum + (row.approved_transfer_units ?? 0), 0);
  const rejected = matching
    .filter((row) => row.decision_state === "Rejected")
    .reduce((sum, row) => sum + row.recommended_transfer_units, 0);
  return {
    pending,
    approved,
    rejected,
    awaitingApproval: Math.max(0, shortageUnits - approved),
  };
}

export function filterAllocationRows(
  rows: AllocationRow[],
  forecasts: CanonicalForecast[],
  evaluations: CanonicalSupplyEvaluation[],
  week: string,
  category: string,
) {
  const byForecast = new Map(forecasts.map((row) => [row.id, row]));
  const byEvaluation = new Map(
    evaluations.map((row) => [row.id, byForecast.get(row.forecast_id)]),
  );
  return rows.filter((row) => {
    const destination = byEvaluation.get(row.destination_supply_evaluation_id);
    const source = byEvaluation.get(row.source_supply_evaluation_id);
    return (
      destination &&
      source &&
      (!week || row.target_week_start === week) &&
      (!category || destination.vehicle_category_id === category) &&
      source.vehicle_category_id === destination.vehicle_category_id
    );
  });
}

export function filterAllocationGaps(
  gaps: AllocationGap[],
  evaluations: CanonicalSupplyEvaluation[],
  week: string,
  category: string,
) {
  const current = new Set(evaluations.map((row) => row.id));
  return gaps.filter(
    (gap) =>
      current.has(gap.evaluationId) &&
      (!week || gap.targetWeekStart === week) &&
      (!category || gap.categoryId === category),
  );
}

export function allocationGenerationBlock(input: {
  loading: boolean;
  busy: boolean;
  readOnly: boolean;
  error: boolean;
  forecasts: number;
  unevaluated: number;
  shortages: number;
  surpluses: number;
}) {
  if (input.readOnly)
    return "Only the Owner/Admin can generate recommendations.";
  if (input.loading || input.busy)
    return "Wait for the current analysis to finish.";
  if (input.error)
    return "Reload the analysis and resolve its errors before generating recommendations.";
  if (!input.forecasts) return "Generate a current demand forecast first.";
  if (input.unevaluated)
    return "Update availability to check the remaining forecasts.";
  if (!input.shortages)
    return "No branch needs extra vehicles in the current saved analysis.";
  if (!input.surpluses)
    return "Some branches need vehicles, but no branch has spare vehicles to transfer in the current saved analysis.";
  return null;
}

export function selectAllocationId(
  rows: AllocationRow[],
  preferred: string | undefined,
  current: string,
) {
  if (preferred && rows.some((row) => row.id === preferred)) return preferred;
  if (rows.some((row) => row.id === current)) return current;
  return rows[0]?.id ?? "";
}

/** Refreshing supply creates new evaluation IDs even within the same run. */
export function allocationContextIdentity(
  runId: string,
  evaluationIds: string[],
) {
  return JSON.stringify([runId, [...evaluationIds].sort()]);
}

export async function automaticAllocationKey(context: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(context),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `automatic-allocation-v2-${hex}`;
}
