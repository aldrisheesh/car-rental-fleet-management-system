type AllocationCandidateRow = {
  id: string;
  vehicle_id: string;
  vehicle_name_snapshot: string;
  license_plate_snapshot: string | null;
  candidate_rank: number;
  idle_days_snapshot: number | null;
};
export type AllocationRow = {
  id: string;
  batch_id: string;
  created_at: string;
  source_supply_evaluation_id: string;
  destination_supply_evaluation_id: string;
  destination_branch_name: string;
  source_branch_name: string;
  vehicle_category_name: string;
  target_week_start: string;
  target_week_end: string;
  forecast_horizon: number;
  approved_transfer_units?: number | null;
  decided_at?: string | null;
  decision_reason?: string | null;
  decision_reason_code?: string | null;
  decision_state: "Pending" | "Approved" | "Rejected";
  destination_shortage_snapshot: number;
  source_surplus_snapshot: number;
  recommended_transfer_units: number;
  destination_required_units_snapshot: number;
  destination_projected_supply_snapshot: number;
  source_required_units_snapshot: number;
  source_projected_supply_snapshot: number;
  destination_evaluated_at: string | null;
  source_evaluated_at: string | null;
  candidates: AllocationCandidateRow[];
};

/** Bind asynchronously fetched evidence to the exact selection that requested it. */
export function selectedContext<T>(
  selectionId: string,
  resultId: string,
  context: T | null,
): T | null {
  return selectionId && selectionId === resultId ? context : null;
}

export function canRecordTransferDecision(
  input: {
    pending: boolean;
    busy: boolean;
    contextLoading: boolean;
    acknowledged: boolean;
    approvedUnits: number;
    recommendedUnits: number;
  },
  decision: "Approved" | "Rejected",
) {
  if (
    !input.pending ||
    input.busy ||
    input.contextLoading ||
    !input.acknowledged
  )
    return false;
  return (
    decision === "Rejected" ||
    (Number.isInteger(input.approvedUnits) &&
      input.approvedUnits > 0 &&
      input.approvedUnits <= input.recommendedUnits)
  );
}

/** Explain reported flags without treating unknown or absent data as safe. */
export function externalAdvisory(
  factors: Array<{ name: string; value: string }>,
  incomplete: boolean,
) {
  const blocked = factors.some(({ value }) =>
    ["Closed/Impassable", "Closed/Restricted", "Not Feasible"].includes(value),
  );
  const severe = factors.some(({ value }) => value === "Severe");
  const nearbyClosure = factors.some(
    ({ value }) => value === "Closure reported nearby",
  );
  const flagged = factors.some(
    ({ value }) =>
      !["Normal", "Open", "Feasible", "Accessible"].includes(value),
  );
  return {
    critical: blocked || severe || nearbyClosure,
    headline: blocked
      ? "Reported closure or blocked route — verify before movement."
      : severe
        ? "Severe weather reported — verify conditions before movement."
        : nearbyClosure
          ? "Nearby road closure reported — verify the planned route before movement."
          : incomplete || !factors.length
            ? "Evidence incomplete — verify missing factors before movement."
            : flagged
              ? "Advisory flags require review before movement."
              : "Available factors have no reported advisory flags.",
  };
}
