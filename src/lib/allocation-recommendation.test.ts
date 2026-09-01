import assert from "node:assert/strict";
import test from "node:test";
import { generateAllocationDrafts, rankAllocationCandidates, selectLatestEvaluations, validateAllocationDecision, type AllocationCandidate, type AllocationEvaluation } from "./allocation-recommendation.core.ts";

const evaluation = (overrides: Partial<AllocationEvaluation>): AllocationEvaluation => ({
  id: "e", evaluatedAt: "2026-09-01T00:00:00Z", forecastId: "f", branchId: "b", categoryId: "c", horizon: 1,
  targetWeekStart: "2026-09-07", targetWeekEnd: "2026-09-14", requiredUnits: 1, projectedSupply: 1, shortageUnits: 0, surplusUnits: 0, ...overrides,
});
const candidate = (vehicleId: string, idleDays: number | null = 1): AllocationCandidate => ({ vehicleId, vehicleName: vehicleId, licensePlate: null, idleDays, idleReference: null, revalidationState: "EligibleAtGeneration", explanationCodes: [] });

test("latest evaluation is selected per forecast", () => {
  const rows = selectLatestEvaluations([evaluation({ id: "old", evaluatedAt: "2026-09-01T00:00:00Z" }), evaluation({ id: "new", evaluatedAt: "2026-09-02T00:00:00Z" })]);
  assert.deepEqual(rows.map((x) => x.id), ["new"]);
});

test("pairs only same category/week/horizon across branches", () => {
  const destination = evaluation({ id: "d", branchId: "destination", shortageUnits: 3 });
  const source = evaluation({ id: "s", branchId: "source", surplusUnits: 2 });
  const sourceCandidates = new Map([["s", [candidate("A"), candidate("B")]]]);
  assert.equal(generateAllocationDrafts([destination, source], sourceCandidates).at(0)?.recommendedUnits, 2);
  assert.equal(generateAllocationDrafts([destination, evaluation({ ...source, categoryId: "other" })], sourceCandidates).length, 0);
  assert.equal(generateAllocationDrafts([destination, evaluation({ ...source, targetWeekStart: "2026-09-14", targetWeekEnd: "2026-09-21" })], sourceCandidates).length, 0);
  assert.equal(generateAllocationDrafts([destination, evaluation({ ...source, branchId: "destination" })], sourceCandidates).length, 0);
});

test("remaining balances prevent source and destination oversubscription", () => {
  const d1 = evaluation({ id: "d1", branchId: "d1", shortageUnits: 2 });
  const d2 = evaluation({ id: "d2", branchId: "d2", shortageUnits: 2 });
  const s = evaluation({ id: "s", branchId: "s", surplusUnits: 3 });
  const rows = generateAllocationDrafts([d1, d2, s], new Map([["s", [candidate("A"), candidate("B"), candidate("C")]]]));
  assert.deepEqual(rows.map((x) => x.recommendedUnits), [2, 1]);
  assert.deepEqual(rows.map((x) => x.candidates.map((c: AllocationCandidate) => c.vehicleId)), [["A", "B"], ["C"]]);
});

test("candidate count caps quantity and zero candidates skip pair", () => {
  const d = evaluation({ id: "d", branchId: "d", shortageUnits: 3 });
  const s = evaluation({ id: "s", branchId: "s", surplusUnits: 5 });
  assert.equal(generateAllocationDrafts([d, s], new Map([["s", [candidate("A"), candidate("B")]]])).at(0)?.recommendedUnits, 2);
  assert.equal(generateAllocationDrafts([d, s], new Map([["s", []]])).length, 0);
});

test("candidate partition follows known idle ranking and never duplicates IDs", () => {
  const d1 = evaluation({ id: "d1", branchId: "d1", shortageUnits: 2 });
  const d2 = evaluation({ id: "d2", branchId: "d2", shortageUnits: 1 });
  const s = evaluation({ id: "s", branchId: "s", surplusUnits: 3 });
  const ranked = rankAllocationCandidates([candidate("C", 1), candidate("A", 10), candidate("B", 5)]);
  const rows = generateAllocationDrafts([d1, d2, s], new Map([["s", ranked]]));
  assert.deepEqual(rows.map((x) => x.candidates.map((c: AllocationCandidate) => c.vehicleId)), [["A", "B"], ["C"]]);
});

test("two revalidated candidates cap a multi-destination source at two units", () => {
  const s = evaluation({ id: "s", branchId: "s", surplusUnits: 5 });
  const rows = generateAllocationDrafts([
    evaluation({ id: "d1", branchId: "d1", shortageUnits: 3 }),
    evaluation({ id: "d2", branchId: "d2", shortageUnits: 3 }), s,
  ], new Map([["s", [candidate("A"), candidate("B")]]]));
  assert.equal(rows.reduce((sum, row) => sum + row.recommendedUnits, 0), 2);
});

test("known idle duration ranks longest first, unknown last, tie by vehicle", () => {
  const ranked = rankAllocationCandidates([
    { vehicleId: "z", vehicleName: "Z", licensePlate: null, idleDays: null, idleReference: null, revalidationState: "EligibleAtGeneration", explanationCodes: [] },
    { vehicleId: "b", vehicleName: "B", licensePlate: null, idleDays: 4, idleReference: null, revalidationState: "EligibleAtGeneration", explanationCodes: [] },
    { vehicleId: "a", vehicleName: "A", licensePlate: null, idleDays: 4, idleReference: null, revalidationState: "EligibleAtGeneration", explanationCodes: [] },
    { vehicleId: "c", vehicleName: "C", licensePlate: null, idleDays: 10, idleReference: null, revalidationState: "EligibleAtGeneration", explanationCodes: [] },
  ]);
  assert.deepEqual(ranked.map((x) => x.vehicleId), ["c", "a", "b", "z"]);
});

test("decision validation allows lower positive approval and rejects zero/over/terminal", () => {
  assert.deepEqual(validateAllocationDecision("Approved", 2, 3), { state: "Approved", approvedUnits: 2 });
  assert.deepEqual(validateAllocationDecision("Rejected", 0, 3), { state: "Rejected", approvedUnits: null });
  assert.throws(() => validateAllocationDecision("Approved", 0, 3));
  assert.throws(() => validateAllocationDecision("Approved", 4, 3));
});
