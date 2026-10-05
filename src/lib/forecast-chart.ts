import type {
  CanonicalForecast,
  CanonicalForecastRun,
} from "./admin-decisions.ts";

type Point = {
  d: string;
  weekEnd: string;
  [key: string]: string | number | undefined;
};

// Compare the latest observed weeks with saved horizon-1 predictions issued
// before each target week. Never manufacture a prediction from actual demand.
export function buildFocusedForecastChart(
  rows: CanonicalForecast[],
  history: CanonicalForecast[] = [],
  runs: Array<CanonicalForecastRun & { idempotency_key?: string }> = [],
) {
  const points = new Map<string, Point>();
  const branches = [
    ...new Map(
      rows.map((row) => [row.branch_id, row.branch?.name ?? row.branch_id]),
    ),
  ];
  const palette = ["#176454", "#426a93", "#a56624", "#765c86"];
  const series = branches.map(([branchId, label], index) => ({
    branchId,
    label,
    actualKey: `actual-${branchId}`,
    forecastKey: `forecast-${branchId}`,
    connectorKey: `connector-${branchId}`,
    color: palette[index % palette.length],
  }));
  const runById = new Map(runs.map((run) => [run.id, run]));
  const pointFor = (week: string, end?: string) => {
    const existing = points.get(week);
    if (existing) return existing;
    const point: Point = {
      d: week,
      weekEnd:
        end ??
        new Date(Date.parse(`${week}T00:00:00Z`) + 7 * 86400000)
          .toISOString()
          .slice(0, 10),
    };
    points.set(week, point);
    return point;
  };
  let hasSimulatedHistory = false;
  for (const item of series) {
    const branchRows = rows.filter((row) => row.branch_id === item.branchId);
    const observedWeeks = new Set<string>();
    for (const row of branchRows)
      for (const input of row.inputs ?? []) {
        if (input.source_type !== "Actual") continue;
        const value = Number(input.source_value);
        if (!Number.isFinite(value)) continue;
        pointFor(input.source_week_start)[item.actualKey] = value;
        observedWeeks.add(input.source_week_start);
      }
    for (const week of observedWeeks) {
      const cutoff = Date.parse(`${week}T00:00:00+08:00`);
      const saved = history
        .filter((row) => {
          const generated = Date.parse(
            runById.get(row.run_id)?.generated_at ?? "",
          );
          return (
            row.branch_id === item.branchId &&
            row.vehicle_category_id === branchRows[0]?.vehicle_category_id &&
            row.target_week_start === week &&
            Number(row.horizon) === 1 &&
            generated < cutoff &&
            Number.isFinite(Number(row.forecasted_demand)) &&
            (row.inputs?.length ?? 0) === 3 &&
            row.inputs!.every(
              (input) =>
                input.source_type === "Actual" &&
                input.source_week_start < week,
            )
          );
        })
        .sort(
          (a, b) =>
            Date.parse(runById.get(b.run_id)!.generated_at) -
              Date.parse(runById.get(a.run_id)!.generated_at) ||
            a.id.localeCompare(b.id),
        )[0];
      if (!saved) continue;
      const run = runById.get(saved.run_id)!;
      const simulated = run.idempotency_key?.includes(":SIMULATED:") ?? false;
      const point = pointFor(week);
      point[item.forecastKey] = Number(saved.forecasted_demand);
      point[`kind-${item.branchId}`] = simulated
        ? "Simulated historical forecast · horizon 1"
        : "Saved historical forecast · horizon 1";
      point[`generated-${item.branchId}`] = run.generated_at;
      hasSimulatedHistory ||= simulated;
    }
    for (const row of branchRows) {
      const value = Number(row.forecasted_demand);
      if (!Number.isFinite(value)) continue;
      const point = pointFor(row.target_week_start, row.target_week_end);
      point[item.forecastKey] = value;
      point[`kind-${item.branchId}`] =
        `Latest saved forecast · horizon ${row.horizon}`;
      point[`generated-${item.branchId}`] = runById.get(
        row.run_id,
      )?.generated_at;
    }
    // A visual bridge has its own key so the last actual is never presented
    // as a historical prediction in the tooltip or forecast series.
    const firstForecast = [...branchRows].sort((a, b) =>
      a.target_week_start.localeCompare(b.target_week_start),
    )[0];
    const lastObserved = [...observedWeeks]
      .filter((week) => week < firstForecast?.target_week_start)
      .sort()
      .at(-1);
    if (firstForecast && lastObserved) {
      const start = pointFor(lastObserved);
      const end = pointFor(firstForecast.target_week_start);
      if (
        Number.isFinite(start[item.actualKey]) &&
        Number.isFinite(end[item.forecastKey]) &&
        Date.parse(`${firstForecast.target_week_start}T00:00:00Z`) -
          Date.parse(`${lastObserved}T00:00:00Z`) ===
          7 * 86400000
      ) {
        start[item.connectorKey] = start[item.actualKey];
        end[item.connectorKey] = end[item.forecastKey];
      }
    }
  }
  return {
    points: [...points.values()].sort((a, b) => a.d.localeCompare(b.d)),
    series,
    hasSimulatedHistory,
  };
}
