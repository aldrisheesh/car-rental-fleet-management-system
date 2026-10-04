import assert from "node:assert/strict";
import test from "node:test";
import {
  filterAllocationRows,
  filterAllocationGaps,
  allocationGenerationBlock,
  selectAllocationId,
  type AllocationGap,
} from "./allocation-workspace.ts";
import type {
  CanonicalForecast,
  CanonicalSupplyEvaluation,
} from "./admin-decisions.ts";
import type { AllocationRow } from "./allocation-review.ts";
const forecast = (id: string, category = "sedan"): CanonicalForecast => ({
  id,
  run_id: "current",
  branch_id: id,
  vehicle_category_id: category,
  horizon: 1,
  target_week_start: "2026-10-05",
  target_week_end: "2026-10-11",
  forecasted_demand: 2,
  required_vehicle_units: 2,
  actual_demand: null,
  ape: null,
});
const evaluation = (
  id: string,
  forecast_id: string,
): CanonicalSupplyEvaluation => ({
  id,
  forecast_id,
  evaluated_at: "2026-10-04T00:00:00Z",
  required_units_snapshot: 2,
  projected_supply: 1,
  shortage_units: 1,
  surplus_units: 0,
});
const row = (overrides: Partial<AllocationRow> = {}): AllocationRow => ({
  id: "match",
  batch_id: "current",
  created_at: "2026-10-04T00:00:00Z",
  source_supply_evaluation_id: "source",
  destination_supply_evaluation_id: "dest",
  source_branch_name: "Source",
  destination_branch_name: "Destination",
  vehicle_category_name: "Sedan",
  target_week_start: "2026-10-05",
  target_week_end: "2026-10-11",
  forecast_horizon: 1,
  decision_state: "Pending",
  destination_shortage_snapshot: 2,
  source_surplus_snapshot: 1,
  recommended_transfer_units: 1,
  destination_required_units_snapshot: 2,
  destination_projected_supply_snapshot: 0,
  source_required_units_snapshot: 1,
  source_projected_supply_snapshot: 2,
  destination_evaluated_at: null,
  source_evaluated_at: null,
  candidates: [],
  ...overrides,
});
const forecasts = [forecast("a"), forecast("b"), forecast("c", "suv")];
const evaluations = [
  evaluation("source", "a"),
  evaluation("dest", "b"),
  evaluation("other", "c"),
];
test("allocation view excludes stale snapshot identities, other weeks and cross-category matches", () => {
  const rows = [
    row(),
    row({ id: "stale", source_supply_evaluation_id: "old" }),
    row({ id: "other-week", target_week_start: "2026-10-12" }),
    row({ id: "cross-category", source_supply_evaluation_id: "other" }),
  ];
  assert.deepEqual(
    filterAllocationRows(
      rows,
      forecasts,
      evaluations,
      "2026-10-05",
      "sedan",
    ).map((r) => r.id),
    ["match"],
  );
  assert.deepEqual(
    filterAllocationRows(rows, forecasts, evaluations, "2026-10-05", "suv"),
    [],
  );
  assert.deepEqual(
    filterAllocationRows(rows, forecasts, [], "2026-10-05", "sedan"),
    [],
  );
});
test("unresolved shortage explanations belong to current evaluated positions", () => {
  const gap: AllocationGap = {
    evaluationId: "dest",
    branchId: "b",
    categoryId: "sedan",
    horizon: 1,
    targetWeekStart: "2026-10-05",
    targetWeekEnd: "2026-10-11",
    shortageUnits: 2,
    recommendedUnits: 1,
    unresolvedUnits: 1,
    compatibleSourceCount: 1,
    eligibleCandidateCount: 1,
    reason: "InsufficientEligibleCandidates",
  };
  const gaps = [
    gap,
    { ...gap, evaluationId: "old" },
    { ...gap, categoryId: "suv" },
    { ...gap, targetWeekStart: "2026-10-12" },
  ];
  assert.deepEqual(
    filterAllocationGaps(gaps, evaluations, "2026-10-05", "sedan"),
    [gap],
  );
});
test("generation requires permission, loaded error-free complete supply and compatible balances", () => {
  const ready = {
    loading: false,
    busy: false,
    readOnly: false,
    error: false,
    forecasts: 36,
    unevaluated: 0,
    shortages: 2,
    surpluses: 1,
  };
  assert.equal(allocationGenerationBlock(ready), null);
  for (const blocked of [
    { loading: true },
    { busy: true },
    { readOnly: true },
    { error: true },
    { forecasts: 0 },
    { unevaluated: 1 },
    { shortages: 0 },
    { surpluses: 0 },
  ])
    assert.ok(allocationGenerationBlock({ ...ready, ...blocked }));
});
test("selection cannot carry a recommendation from another filter context", () => {
  const rows = [row(), row({ id: "second" })];
  assert.equal(selectAllocationId(rows, "second", "match"), "second");
  assert.equal(selectAllocationId(rows, "stale", "second"), "second");
  assert.equal(selectAllocationId(rows, "stale", "old"), "match");
  assert.equal(selectAllocationId([], "match", "match"), "");
});
