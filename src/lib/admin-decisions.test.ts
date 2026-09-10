import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildForecastChart,
  canShowSupplyEvaluationActions,
  selectLatestForecasts,
  selectLatestSupplyEvaluations,
  supplyBalanceState,
  type CanonicalForecast,
} from "./admin-decisions.ts";

const forecast = (
  overrides: Partial<CanonicalForecast> = {},
): CanonicalForecast => ({
  id: "forecast-1",
  run_id: "run-new",
  branch_id: "branch-1",
  vehicle_category_id: "category-1",
  horizon: 1,
  target_week_start: "2026-09-14",
  target_week_end: "2026-09-21",
  forecasted_demand: 12,
  required_vehicle_units: 12,
  actual_demand: null,
  ape: null,
  branch: { id: "branch-1", name: "Canonical branch" },
  category: { id: "category-1", name: "Canonical category" },
  ...overrides,
});

test("decision support selects the latest persisted forecast run", () => {
  const rows = selectLatestForecasts(
    [
      { id: "run-old", generated_at: "2026-09-01T00:00:00Z" },
      { id: "run-new", generated_at: "2026-09-08T00:00:00Z" },
      { id: "run-insufficient", generated_at: "2026-09-09T00:00:00Z" },
    ],
    [
      forecast({ id: "old", run_id: "run-old", forecasted_demand: 99 }),
      forecast({ id: "new", forecasted_demand: 12 }),
    ],
  );

  assert.deepEqual(
    rows.map((row) => row.id),
    ["new"],
  );
  assert.deepEqual(buildForecastChart(rows).data, [
    { d: "2026-09-14", "series-0": 12 },
  ]);
});

test("decision support keeps the latest canonical supply snapshot per forecast", () => {
  const rows = selectLatestSupplyEvaluations([
    {
      id: "evaluation-old",
      forecast_id: "forecast-1",
      evaluated_at: "2026-09-08T00:00:00Z",
      required_units_snapshot: 10,
      projected_supply: 4,
      shortage_units: 6,
      surplus_units: 0,
    },
    {
      id: "evaluation-new",
      forecast_id: "forecast-1",
      evaluated_at: "2026-09-09T00:00:00Z",
      required_units_snapshot: 10,
      projected_supply: 12,
      shortage_units: 0,
      surplus_units: 2,
    },
  ]);

  assert.deepEqual(
    rows.map((row) => row.id),
    ["evaluation-new"],
  );
  assert.equal(supplyBalanceState(rows[0]), "Surplus");
});

test("zero-snapshot state exposes supply evaluation only for Owner/Admin forecasts", () => {
  const latestForecasts = selectLatestForecasts(
    [{ id: "run-new", generated_at: "2026-09-08T00:00:00Z" }],
    [forecast({ id: "forecast-1" })],
  );
  const evaluatedForecastIds = new Set(
    selectLatestSupplyEvaluations([]).map(
      (evaluation) => evaluation.forecast_id,
    ),
  );
  const unevaluatedForecasts = latestForecasts.filter(
    (row) => !evaluatedForecastIds.has(row.id),
  );

  assert.equal(
    canShowSupplyEvaluationActions(false, unevaluatedForecasts.length),
    true,
  );
  assert.equal(canShowSupplyEvaluationActions(true, 3), false);
  assert.equal(canShowSupplyEvaluationActions(false, 0), false);
});

test("Decision Support uses canonical sources and has no prototype analytics", async () => {
  const page = await readFile(
    new URL("../routes/admin.decisions.tsx", import.meta.url),
    "utf8",
  );
  const forecastsApi = await readFile(
    new URL("../routes/api.forecasts.ts", import.meta.url),
    "utf8",
  );
  const supplyApi = await readFile(
    new URL("../routes/api.supply-evaluations.ts", import.meta.url),
    "utf8",
  );

  assert.match(page, /\/api\/forecasts/);
  assert.match(page, /\/api\/supply-evaluations/);
  assert.match(page, /\/api\/vehicle-analytics/);
  assert.match(page, /\/api\/allocation-recommendations/);
  assert.match(
    page,
    /readApi\("\/api\/supply-evaluations", \{\s*method: "POST"/s,
  );
  assert.match(
    page,
    /body: JSON\.stringify\(\{\s*forecastId,\s*idempotencyKey: crypto\.randomUUID\(\),\s*\}\)/s,
  );
  assert.match(page, /setSupportVersion\(\(version\) => version \+ 1\)/);
  assert.match(
    page,
    /\[analyticsRange\.end, analyticsRange\.start, supportVersion\]/,
  );
  assert.match(page, /canShowSupplyEvaluationActions\(/);
  assert.match(page, /showSupplyEvaluationActions \?/);
  assert.match(page, /Persisted forecasts without a supply snapshot/);
  assert.match(page, /supplyRows\.map\(\(evaluation\) =>/);
  assert.match(
    page,
    /No canonical projected-supply evaluations are available yet/,
  );
  assert.match(page, /Sufficient covered demand history is required/);
  assert.match(page, /Insufficient historical eligibility data/);
  assert.doesNotMatch(
    page,
    /Toyota Hilux|NDA 6610|Taft, Manila|High confidence/,
  );
  assert.doesNotMatch(page, /const forecast = \[/);
  assert.match(forecastsApi, /branch:branches\(id,name\)/);
  assert.match(forecastsApi, /category:vehicle_categories\(id,name\)/);
  assert.match(supplyApi, /if \(principal\.role !== "Owner\/Admin"\)/);
});
