export type CanonicalForecastRun = {
  id: string;
  generated_at: string;
};

export type CanonicalForecast = {
  id: string;
  run_id: string;
  branch_id: string;
  vehicle_category_id: string;
  horizon: number;
  target_week_start: string;
  target_week_end: string;
  forecasted_demand: number | string;
  required_vehicle_units: number | string;
  actual_demand: number | string | null;
  ape: number | string | null;
  branch?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
};

export type CanonicalSupplyEvaluation = {
  id: string;
  forecast_id: string;
  evaluated_at: string;
  required_units_snapshot: number | string;
  projected_supply: number | string;
  shortage_units: number | string;
  surplus_units: number | string;
  data_quality_state?: string | null;
};

export type ForecastChartSeries = {
  key: string;
  name: string;
};

export function forecastLabel(
  forecast: Pick<
    CanonicalForecast,
    "branch_id" | "vehicle_category_id" | "branch" | "category"
  >,
) {
  return `${forecast.branch?.name ?? forecast.branch_id} · ${forecast.category?.name ?? forecast.vehicle_category_id}`;
}

export function selectLatestForecasts(
  runs: CanonicalForecastRun[],
  forecasts: CanonicalForecast[],
) {
  const orderedRuns = [...runs].sort(
    (left, right) =>
      Date.parse(right.generated_at) - Date.parse(left.generated_at),
  );
  const latestRun = orderedRuns.find((run) =>
    forecasts.some((forecast) => forecast.run_id === run.id),
  );
  const rows = latestRun
    ? forecasts.filter((forecast) => forecast.run_id === latestRun.id)
    : forecasts;
  return [...rows].sort(
    (left, right) =>
      left.target_week_start.localeCompare(right.target_week_start) ||
      left.branch_id.localeCompare(right.branch_id) ||
      left.vehicle_category_id.localeCompare(right.vehicle_category_id) ||
      Number(left.horizon) - Number(right.horizon),
  );
}

export function selectLatestSupplyEvaluations(
  evaluations: CanonicalSupplyEvaluation[],
) {
  const latestByForecast = new Map<string, CanonicalSupplyEvaluation>();
  for (const evaluation of evaluations) {
    const previous = latestByForecast.get(evaluation.forecast_id);
    if (
      !previous ||
      Date.parse(evaluation.evaluated_at) > Date.parse(previous.evaluated_at)
    ) {
      latestByForecast.set(evaluation.forecast_id, evaluation);
    }
  }
  return [...latestByForecast.values()].sort((left, right) =>
    right.evaluated_at.localeCompare(left.evaluated_at),
  );
}

export function buildForecastChart(rows: CanonicalForecast[]) {
  const seriesBySource = new Map<string, ForecastChartSeries>();
  const dataByWeek = new Map<string, Record<string, string | number>>();

  for (const forecast of rows) {
    const sourceKey = `${forecast.branch_id}:${forecast.vehicle_category_id}`;
    let series = seriesBySource.get(sourceKey);
    if (!series) {
      series = {
        key: `series-${seriesBySource.size}`,
        name: forecastLabel(forecast),
      };
      seriesBySource.set(sourceKey, series);
    }
    const week = dataByWeek.get(forecast.target_week_start) ?? {
      d: forecast.target_week_start,
    };
    week[series.key] = Number(forecast.forecasted_demand);
    dataByWeek.set(forecast.target_week_start, week);
  }

  return {
    series: [...seriesBySource.values()],
    data: [...dataByWeek.values()].sort((left, right) =>
      String(left.d).localeCompare(String(right.d)),
    ),
  };
}

export function supplyBalanceState(
  evaluation: Pick<
    CanonicalSupplyEvaluation,
    "shortage_units" | "surplus_units"
  >,
) {
  if (Number(evaluation.shortage_units) > 0) return "Shortage" as const;
  if (Number(evaluation.surplus_units) > 0) return "Surplus" as const;
  return "Balanced" as const;
}
