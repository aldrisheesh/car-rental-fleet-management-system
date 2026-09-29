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
  candidates: AllocationCandidate[];
};
export type UnresolvedShortageReason =
  | "NoCompatibleSurplus"
  | "NoEligibleCandidates"
  | "InsufficientEligibleCandidates"
  | "NoRemainingCapacity";
export type UnresolvedShortage = {
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
  reason: UnresolvedShortageReason;
};
export type AllocationSummary = {
  evaluatedPositions: number;
  shortagePositions: number;
  surplusPositions: number;
  generatedRecommendations: number;
  unresolvedShortages: UnresolvedShortage[];
};
export function selectLatestEvaluations(rows: AllocationEvaluation[]) {
  const latest = new Map<string, AllocationEvaluation>();
  for (const row of rows) {
    const old = latest.get(row.forecastId);
    if (
      !old ||
      row.evaluatedAt > old.evaluatedAt ||
      (row.evaluatedAt === old.evaluatedAt && row.id > old.id)
    )
      latest.set(row.forecastId, row);
  }
  return [...latest.values()];
}
export function generateAllocationDrafts(
  evaluations: AllocationEvaluation[],
  candidatesBySource: ReadonlyMap<string, AllocationCandidate[]>,
) {
  const destinations = evaluations
    .filter((e) => e.shortageUnits > 0)
    .sort(
      (a, b) =>
        a.branchId.localeCompare(b.branchId) || a.id.localeCompare(b.id),
    );
  const sources = evaluations
    .filter((e) => e.surplusUnits > 0)
    .sort(
      (a, b) =>
        a.branchId.localeCompare(b.branchId) || a.id.localeCompare(b.id),
    );
  const dr = new Map(destinations.map((e) => [e.id, e.shortageUnits]));
  const sr = new Map(sources.map((e) => [e.id, e.surplusUnits]));
  const allocatedVehicleIds = new Set<string>();
  const result: AllocationDraft[] = [];
  for (const destination of destinations)
    for (const source of sources) {
      if (
        source.branchId === destination.branchId ||
        source.categoryId !== destination.categoryId ||
        source.horizon !== destination.horizon ||
        source.targetWeekStart !== destination.targetWeekStart ||
        source.targetWeekEnd !== destination.targetWeekEnd
      )
        continue;
      const candidates = (candidatesBySource.get(source.id) ?? []).filter(
        (candidate) => !allocatedVehicleIds.has(candidate.vehicleId),
      );
      const units = Math.min(
        dr.get(destination.id) ?? 0,
        sr.get(source.id) ?? 0,
        candidates.length,
      );
      if (units <= 0) continue;
      const selected = candidates.slice(0, units);
      result.push({
        source,
        destination,
        recommendedUnits: units,
        candidates: selected,
      });
      dr.set(destination.id, (dr.get(destination.id) ?? 0) - units);
      sr.set(source.id, (sr.get(source.id) ?? 0) - units);
      for (const candidate of selected)
        allocatedVehicleIds.add(candidate.vehicleId);
    }
  return result;
}
export function explainUnresolvedShortages(
  evaluations: AllocationEvaluation[],
  candidatesBySource: ReadonlyMap<string, AllocationCandidate[]>,
  drafts: AllocationDraft[],
): UnresolvedShortage[] {
  const destinations = evaluations.filter(
    (evaluation) => evaluation.shortageUnits > 0,
  );
  const sources = evaluations.filter(
    (evaluation) => evaluation.surplusUnits > 0,
  );
  return destinations.flatMap((destination) => {
    const recommendedUnits = drafts
      .filter((draft) => draft.destination.id === destination.id)
      .reduce((total, draft) => total + draft.recommendedUnits, 0);
    const unresolvedUnits = Math.max(
      0,
      destination.shortageUnits - recommendedUnits,
    );
    if (!unresolvedUnits) return [];
    const compatibleSources = sources.filter(
      (source) =>
        source.branchId !== destination.branchId &&
        source.categoryId === destination.categoryId &&
        source.horizon === destination.horizon &&
        source.targetWeekStart === destination.targetWeekStart &&
        source.targetWeekEnd === destination.targetWeekEnd,
    );
    const eligibleCandidateCount = new Set(
      compatibleSources.flatMap((source) =>
        (candidatesBySource.get(source.id) ?? []).map(
          (candidate) => candidate.vehicleId,
        ),
      ),
    ).size;
    const reason: UnresolvedShortageReason = !compatibleSources.length
      ? "NoCompatibleSurplus"
      : eligibleCandidateCount === 0
        ? "NoEligibleCandidates"
        : recommendedUnits > 0
          ? "InsufficientEligibleCandidates"
          : "NoRemainingCapacity";
    return [
      {
        evaluationId: destination.id,
        branchId: destination.branchId,
        categoryId: destination.categoryId,
        horizon: destination.horizon,
        targetWeekStart: destination.targetWeekStart,
        targetWeekEnd: destination.targetWeekEnd,
        shortageUnits: destination.shortageUnits,
        recommendedUnits,
        unresolvedUnits,
        compatibleSourceCount: compatibleSources.length,
        eligibleCandidateCount,
        reason,
      },
    ];
  });
}
export function buildAllocationSummary(
  evaluations: AllocationEvaluation[],
  candidatesBySource: ReadonlyMap<string, AllocationCandidate[]>,
  drafts: AllocationDraft[],
): AllocationSummary {
  return {
    evaluatedPositions: evaluations.length,
    shortagePositions: evaluations.filter(
      (evaluation) => evaluation.shortageUnits > 0,
    ).length,
    surplusPositions: evaluations.filter(
      (evaluation) => evaluation.surplusUnits > 0,
    ).length,
    generatedRecommendations: drafts.length,
    unresolvedShortages: explainUnresolvedShortages(
      evaluations,
      candidatesBySource,
      drafts,
    ),
  };
}
export function rankAllocationCandidates(candidates: AllocationCandidate[]) {
  return [...candidates].sort((a, b) =>
    a.idleDays == null && b.idleDays != null
      ? 1
      : a.idleDays != null && b.idleDays == null
        ? -1
        : a.idleDays != null && b.idleDays != null && a.idleDays !== b.idleDays
          ? b.idleDays - a.idleDays
          : a.vehicleId.localeCompare(b.vehicleId),
  );
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
  )
    throw new Error("invalid_allocation_decision");
  return { state, approvedUnits: Number(approvedUnits) } as const;
}
