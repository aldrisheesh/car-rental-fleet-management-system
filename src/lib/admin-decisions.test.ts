import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildWmaCalculation,
  buildForecastChart,
  canShowSupplyEvaluationActions,
  selectActionableForecasts,
  selectLatestForecasts,
  selectLatestSupplyEvaluations,
  selectCurrentRecommendations,
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

test("decision support exposes the stored WMA terms and rounded planning requirement", () => {
  const calculation = buildWmaCalculation(
    forecast({
      forecasted_demand: 1.3,
      required_vehicle_units: 2,
      inputs: [
        {
          source_type: "Actual",
          source_week_start: "2026-09-07",
          source_value: 1,
          input_order: 3,
          weight: 0.5,
          weighted_contribution: 0.5,
        },
        {
          source_type: "Actual",
          source_week_start: "2026-08-24",
          source_value: 1,
          input_order: 1,
          weight: 0.2,
          weighted_contribution: 0.2,
        },
        {
          source_type: "Actual",
          source_week_start: "2026-08-31",
          source_value: 2,
          input_order: 2,
          weight: 0.3,
          weighted_contribution: 0.6,
        },
      ],
    }),
  );

  assert.deepEqual(calculation, {
    terms: [
      {
        sourceType: "Actual",
        sourceWeekStart: "2026-08-24",
        sourceValue: 1,
        weight: 0.2,
        weightedContribution: 0.2,
      },
      {
        sourceType: "Actual",
        sourceWeekStart: "2026-08-31",
        sourceValue: 2,
        weight: 0.3,
        weightedContribution: 0.6,
      },
      {
        sourceType: "Actual",
        sourceWeekStart: "2026-09-07",
        sourceValue: 1,
        weight: 0.5,
        weightedContribution: 0.5,
      },
    ],
    forecastDemand: 1.3,
    requiredVehicles: 2,
  });
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

test("elapsed forecast weeks are excluded from current supply and allocation actions", () => {
  const rows = selectActionableForecasts(
    [
      forecast({
        id: "elapsed",
        target_week_start: "2026-09-14",
        target_week_end: "2026-09-21",
      }),
      forecast({
        id: "current",
        target_week_start: "2026-09-28",
        target_week_end: "2026-10-05",
      }),
      forecast({
        id: "future",
        target_week_start: "2026-10-05",
        target_week_end: "2026-10-12",
      }),
    ],
    "2026-09-29",
  );

  assert.deepEqual(
    rows.map((row) => row.id),
    ["current", "future"],
  );
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

test("current recommendations are bound to the exact latest supply snapshots", () => {
  const evaluations = selectLatestSupplyEvaluations([
    {
      id: "source-old",
      forecast_id: "source",
      evaluated_at: "2026-09-08T00:00:00Z",
      required_units_snapshot: 1,
      projected_supply: 3,
      shortage_units: 0,
      surplus_units: 2,
    },
    {
      id: "source-current",
      forecast_id: "source",
      evaluated_at: "2026-09-09T00:00:00Z",
      required_units_snapshot: 1,
      projected_supply: 2,
      shortage_units: 0,
      surplus_units: 1,
    },
    {
      id: "destination-current",
      forecast_id: "destination",
      evaluated_at: "2026-09-09T00:00:00Z",
      required_units_snapshot: 2,
      projected_supply: 1,
      shortage_units: 1,
      surplus_units: 0,
    },
  ]);
  const rows = selectCurrentRecommendations(
    [
      {
        id: "stale",
        batch_id: "batch-old-snapshot",
        created_at: "2026-09-08T00:00:00Z",
        source_supply_evaluation_id: "source-old",
        destination_supply_evaluation_id: "destination-current",
      },
      {
        id: "older-current-batch",
        batch_id: "batch-older",
        created_at: "2026-09-09T00:00:00Z",
        source_supply_evaluation_id: "source-current",
        destination_supply_evaluation_id: "destination-current",
      },
      {
        id: "current",
        batch_id: "batch-current",
        created_at: "2026-09-10T00:00:00Z",
        source_supply_evaluation_id: "source-current",
        destination_supply_evaluation_id: "destination-current",
      },
    ],
    evaluations,
  );

  assert.deepEqual(
    rows.map((row) => row.id),
    ["current"],
  );
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
  const allocationApi = await readFile(
    new URL("../routes/api.allocation-recommendations.ts", import.meta.url),
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
    /body: JSON\.stringify\(\{\s*forecastIds,\s*idempotencyKey,\s*\}\)/s,
  );
  assert.match(page, /setSupportVersion\(\(version\) => version \+ 1\)/);
  assert.match(
    page,
    /\[\s*analyticsRange\.start,\s*analyticsRange\.end,\s*vehicleRefreshVersion,\s*supportVersion,?\s*\]/,
  );
  assert.match(page, /latestForecastIds/);
  assert.match(page, /currentSupplyRows/);
  assert.match(page, /Decision brief/);
  assert.match(page, /Review supply gaps/);
  assert.match(page, /Generate transfer recommendations/);
  assert.match(page, /Branch balance/);
  assert.match(page, /Vehicle attention/);
  assert.match(page, /Supply analysis/);
  assert.match(page, /Unresolved shortage evidence/);
  assert.match(page, /Auditable decision trace/);
  assert.match(page, /External context/);
  const review = await readFile(
    new URL("../components/admin/allocation-review.tsx", import.meta.url),
    "utf8",
  );
  assert.match(review, /do not change WMA demand/);
  assert.match(page, /No compatible donor is available/);
  assert.match(page, /blocked by a booking, rental, maintenance/);
  assert.match(page, /forecastError \|\| allocationError \|\| forecastNotice/);
  assert.match(page, /automatic-supply-/);
  assert.match(page, /automaticAllocationKey\(allocationSnapshotIdentity\)/);
  assert.doesNotMatch(page, /generatedAllocationRuns\.current\.delete/);
  assert.doesNotMatch(page, /synchronizedSupplyRuns\.current\.delete/);
  assert.match(page, /allocationLoading/);
  assert.match(page, /currentAllocationRows\.length/);
  assert.match(page, /hasForecastSnapshot/);
  assert.match(page, /actual weekly demand/);
  assert.match(page, /selectedBranchId === "all"/);
  assert.match(page, /Forecast horizon:/);
  assert.match(page, /Auditable WMA example/);
  assert.match(page, /planning\s+requirement rounds up to/);
  assert.match(page, /supplyWeekSummaries\.map\(\(summary\) =>/);
  assert.match(page, /Automatic readiness snapshots/);
  assert.match(review, /approvedUnits/);
  assert.doesNotMatch(page, /window\.prompt/);
  assert.doesNotMatch(page, /High priority|expected unmet rental|revenue/i);
  assert.doesNotMatch(
    page,
    /Toyota Hilux|NDA 6610|Taft, Manila|High confidence/,
  );
  assert.doesNotMatch(page, /const forecast = \[/);
  assert.match(forecastsApi, /branch:branches\(id,name\)/);
  assert.match(forecastsApi, /category:vehicle_categories\(id,name\)/);
  assert.doesNotMatch(forecastsApi, /extractDailyDemand/);
  assert.match(supplyApi, /if \(principal\.role !== "Owner\/Admin"\)/);
  assert.match(
    allocationApi,
    /summary = \(await loadCurrentAllocationContext\(client\)\)\.summary/,
  );
  assert.match(
    allocationApi,
    /return Response\.json\(\{ \.\.\.view, summary \}\)/,
  );
});
