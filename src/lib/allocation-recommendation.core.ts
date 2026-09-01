export type AllocationEvaluation = {
  id: string; evaluatedAt: string; forecastId: string; branchId: string; categoryId: string; horizon: number;
  targetWeekStart: string; targetWeekEnd: string; requiredUnits: number; projectedSupply: number; shortageUnits: number; surplusUnits: number;
};
export type AllocationCandidate = { vehicleId: string; vehicleName: string; licensePlate: string | null; idleDays: number | null; idleReference: string | null; revalidationState: "EligibleAtGeneration"; explanationCodes: string[] };
export function selectLatestEvaluations(rows: AllocationEvaluation[]) {
  const latest = new Map<string, AllocationEvaluation>();
  for (const row of rows) { const old = latest.get(row.forecastId); if (!old || row.evaluatedAt > old.evaluatedAt || (row.evaluatedAt === old.evaluatedAt && row.id > old.id)) latest.set(row.forecastId, row); }
  return [...latest.values()];
}
export function generateAllocationDrafts(evaluations: AllocationEvaluation[], candidateCounts: ReadonlyMap<string, number>) {
  const destinations = evaluations.filter((e) => e.shortageUnits > 0).sort((a, b) => a.branchId.localeCompare(b.branchId) || a.id.localeCompare(b.id));
  const sources = evaluations.filter((e) => e.surplusUnits > 0).sort((a, b) => a.branchId.localeCompare(b.branchId) || a.id.localeCompare(b.id));
  const dr = new Map(destinations.map((e) => [e.id, e.shortageUnits])); const sr = new Map(sources.map((e) => [e.id, e.surplusUnits])); const cr = new Map(sources.map((e) => [e.id, Math.max(0, candidateCounts.get(e.id) ?? 0)])); const result: any[] = [];
  for (const destination of destinations) for (const source of sources) {
    if (source.branchId === destination.branchId || source.categoryId !== destination.categoryId || source.horizon !== destination.horizon || source.targetWeekStart !== destination.targetWeekStart || source.targetWeekEnd !== destination.targetWeekEnd) continue;
    const units = Math.min(dr.get(destination.id) ?? 0, sr.get(source.id) ?? 0, cr.get(source.id) ?? 0); if (units <= 0) continue;
    result.push({ source, destination, recommendedUnits: units }); dr.set(destination.id, (dr.get(destination.id) ?? 0) - units); sr.set(source.id, (sr.get(source.id) ?? 0) - units); cr.set(source.id, (cr.get(source.id) ?? 0) - units);
  }
  return result;
}
export function rankAllocationCandidates(candidates: AllocationCandidate[]) { return [...candidates].sort((a, b) => a.idleDays == null && b.idleDays != null ? 1 : a.idleDays != null && b.idleDays == null ? -1 : a.idleDays != null && b.idleDays != null && a.idleDays !== b.idleDays ? b.idleDays - a.idleDays : a.vehicleId.localeCompare(b.vehicleId)); }
export function validateAllocationDecision(state: unknown, approvedUnits: unknown, recommendedUnits: number) { if (state === "Rejected") return { state, approvedUnits: null } as const; if (state !== "Approved" || !Number.isInteger(approvedUnits) || Number(approvedUnits) <= 0 || Number(approvedUnits) > recommendedUnits) throw new Error("invalid_allocation_decision"); return { state, approvedUnits: Number(approvedUnits) } as const; }
