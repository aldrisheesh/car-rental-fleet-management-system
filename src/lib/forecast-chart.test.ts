import test from "node:test";
import assert from "node:assert/strict";
import { buildFocusedForecastChart } from "./forecast-chart.ts";
import type { CanonicalForecast } from "./admin-decisions.ts";

const row = (
  id: string,
  week: string,
  run = "latest",
  branch = "taft",
): CanonicalForecast => ({
  id,
  run_id: run,
  branch_id: branch,
  vehicle_category_id: "suv",
  horizon: 1,
  target_week_start: week,
  target_week_end: "2026-10-05",
  forecasted_demand: 0.8,
  required_vehicle_units: 1,
  actual_demand: null,
  ape: null,
  branch: { id: branch, name: branch },
  inputs: ["2026-08-17", "2026-08-24", "2026-08-31"].map((week) => ({
    source_type: "Actual",
    source_week_start: week,
    source_value: 1,
  })),
});
const latest = row("latest-row", "2026-09-28");
latest.inputs = ["2026-09-07", "2026-09-14", "2026-09-21"].map((week, i) => ({
  source_type: "Actual",
  source_week_start: week,
  source_value: i,
}));
const runs = [
  { id: "latest", generated_at: "2026-09-27T10:00:00Z" },
  {
    id: "old",
    generated_at: "2026-09-06T15:59:59Z",
    idempotency_key: "demo:SIMULATED:sep7",
  },
];

test("historical forecast and zero actual remain distinct and traceable", () => {
  const result = buildFocusedForecastChart(
    [latest],
    [row("old-row", "2026-09-07", "old")],
    runs,
  );
  const sep7 = result.points.find((p) => p.d === "2026-09-07")!;
  assert.equal(sep7["actual-taft"], 0);
  assert.equal(sep7["forecast-taft"], 0.8);
  assert.equal(sep7["generated-taft"], runs[1].generated_at);
  assert.equal(result.hasSimulatedHistory, true);
  assert.equal(
    result.points.find((p) => p.d === "2026-09-28")!["forecast-taft"],
    0.8,
  );
});
test("missing historical values are not fabricated from actual points", () => {
  const result = buildFocusedForecastChart([latest], [], runs);
  assert.equal(
    result.points.find((p) => p.d === "2026-09-21")!["forecast-taft"],
    undefined,
  );
});
test("dotted bridge connects only adjacent actual and latest forecast without replacing history", () => {
  const historical = row("historical", "2026-09-21", "old");
  historical.forecasted_demand = 1.4;
  const result = buildFocusedForecastChart([latest], [historical], runs);
  const start = result.points.find((p) => p.d === "2026-09-21")!;
  const end = result.points.find((p) => p.d === "2026-09-28")!;
  assert.equal(start["connector-taft"], 2);
  assert.equal(start["forecast-taft"], 1.4);
  assert.equal(end["connector-taft"], 0.8);
  assert.equal(
    result.points.filter((p) => p["connector-taft"] !== undefined).length,
    2,
  );
  const gap = buildFocusedForecastChart(
    [{ ...latest, target_week_start: "2026-10-05" }],
    [],
    runs,
  );
  assert.equal(
    gap.points.some((p) => p["connector-taft"] !== undefined),
    false,
  );
});
test("later issuance, recursive forecasts and future inputs cannot be historical predictions", () => {
  const late = row("late", "2026-09-07", "late");
  const recursive = { ...row("recursive", "2026-09-07", "old"), horizon: 2 };
  const leakage = row("leakage", "2026-09-07", "old");
  leakage.inputs![0].source_week_start = "2026-09-07";
  const result = buildFocusedForecastChart(
    [latest],
    [late, recursive, leakage],
    [...runs, { id: "late", generated_at: "2026-09-06T16:00:00Z" }],
  );
  assert.equal(
    result.points.find((p) => p.d === "2026-09-07")!["forecast-taft"],
    undefined,
  );
});
test("branch/category scope is retained and most recent eligible issuance wins", () => {
  const valid = row("valid", "2026-09-07", "old");
  const earlier = {
    ...row("earlier", "2026-09-07", "earlier"),
    forecasted_demand: 0.3,
  };
  const wrongCategory = {
    ...row("other", "2026-09-14", "old"),
    vehicle_category_id: "van",
  };
  const result = buildFocusedForecastChart(
    [latest],
    [
      earlier,
      valid,
      wrongCategory,
      row("other-branch", "2026-09-14", "old", "rizal"),
    ],
    [...runs, { id: "earlier", generated_at: "2026-09-05T10:00:00Z" }],
  );
  assert.equal(result.series.length, 1);
  assert.equal(
    result.points.find((p) => p.d === "2026-09-07")!["forecast-taft"],
    0.8,
  );
  assert.equal(
    result.points.find((p) => p.d === "2026-09-14")!["forecast-taft"],
    undefined,
  );
});
