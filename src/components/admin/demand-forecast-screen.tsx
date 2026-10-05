import { DssScreenSkeleton } from "./dss-loading";
import type { ReactNode } from "react";
import { ArrowRight, Info } from "lucide-react";
import { Btn } from "@/components/admin/ui";
import {
  type CanonicalForecast,
  type CanonicalForecastRun,
} from "@/lib/admin-decisions";
import { formatWeekRange, weekEndFromStart } from "@/lib/planning-week";

type Option = { id: string; name: string };
type Props = {
  week: string;
  onWeek: (value: string) => void;
  branch: string;
  category: string;
  branches: Option[];
  categories: Option[];
  rows: CanonicalForecast[];
  runs: CanonicalForecastRun[];
  latestRunId?: string;
  loading: boolean;
  busy: boolean;
  error: string;
  notice: string;
  mape: number | null;
  eligible: number | undefined;
  excluded: number | undefined;
  finalizable: number;
  chart: ReactNode;
  calculation: ReactNode;
  legend: ReactNode;
  formatDateTime: (value: string | null | undefined) => string;
  formatQuantity: (value: number | string | null | undefined) => string;
  onBranch: (value: string) => void;
  onCategory: (value: string) => void;
  onGenerate: () => void;
  onFinalize: () => void;
  onReload: () => void;
  onAllocation: (row?: CanonicalForecast) => void;
};

export function DemandForecastScreen(p: Props) {
  if (p.loading) return <DssScreenSkeleton screen="forecast" />;
  const latestRun = p.runs.find((run) => run.id === p.latestRunId);
  const rows = [...p.rows].sort(
    (a, b) =>
      a.target_week_start.localeCompare(b.target_week_start) ||
      (a.branch?.name ?? a.branch_id).localeCompare(
        b.branch?.name ?? b.branch_id,
      ),
  );
  const weeks = [...new Set(rows.map((row) => row.target_week_start))];
  const week = weeks.includes(p.week) ? p.week : (weeks[0] ?? "");
  const selected = rows.filter((row) => row.target_week_start === week);
  const units = selected.reduce(
    (total, row) => total + Number(row.required_vehicle_units),
    0,
  );
  const demand = selected.reduce(
    (total, row) => total + Number(row.forecasted_demand),
    0,
  );
  const category =
    p.categories.find((option) => option.id === p.category)?.name ?? "vehicle";
  const vehicleLabel =
    category === "Economy"
      ? `economy vehicle${units === 1 ? "" : "s"}`
      : `${category === category.toUpperCase() ? category : category.toLowerCase()}${units === 1 ? "" : "s"}`;
  return (
    <div className="dss-forecast-screen dss-forecast-screen--focused">
      <section className="dss-forecast-toolbar" aria-label="Forecast controls">
        <label>
          Branch
          <select
            value={p.branch}
            onChange={(e) => p.onBranch(e.target.value)}
            disabled={!p.branches.length}
          >
            <option value="all">All branches</option>
            {p.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vehicle category
          <select
            value={p.category}
            onChange={(e) => p.onCategory(e.target.value)}
            disabled={!p.categories.length}
          >
            {!p.categories.length ? (
              <option value="">No forecast series</option>
            ) : null}
            {p.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Planning week
          <select
            value={week}
            onChange={(e) => p.onWeek(e.target.value)}
            disabled={!weeks.length}
          >
            {!weeks.length ? <option value="">No forecast weeks</option> : null}
            {weeks.map((value) => (
              <option key={value} value={value}>
                {formatWeekRange(
                  value,
                  rows.find((row) => row.target_week_start === value)!
                    .target_week_end,
                )}
              </option>
            ))}
          </select>
        </label>
        <div className="dss-forecast-generate">
          <Btn disabled={p.busy} onClick={p.onGenerate}>
            {p.busy ? "Working…" : "Generate forecast"}
          </Btn>
          <small>Updates all branches and categories.</small>
        </div>
      </section>
      <p className="dss-forecast-saved">
        {latestRun
          ? `Saved ${p.formatDateTime(latestRun.generated_at)}`
          : "No saved forecast"}
      </p>
      {p.error || p.notice ? (
        <div
          className={`admin-decision-feedback ${p.error ? "is-error" : ""}`}
          role={p.error ? "alert" : "status"}
        >
          <span>{p.error || p.notice}</span>
          {p.error ? (
            <Btn onClick={p.onReload} disabled={p.busy}>
              Reload forecast
            </Btn>
          ) : null}
        </div>
      ) : null}
      {selected.length ? (
        <section
          className="dss-forecast-conclusion"
          aria-labelledby="forecast-conclusion-heading"
        >
          <div className="dss-forecast-conclusion-copy">
            <Info size={28} aria-hidden="true" />
            <div>
              <h2 id="forecast-conclusion-heading">
                Plan for {p.formatQuantity(units)} {vehicleLabel}
                {p.branch === "all" ? " across branches" : ""} for the selected
                week.
              </h2>
              <p>
                {formatWeekRange(week, weekEndFromStart(week))} · Estimated
                rental demand: {p.formatQuantity(demand)}.{" "}
                {p.branch === "all"
                  ? "Each branch’s estimate is rounded up before adding its vehicle needs."
                  : "Rounded up to a whole vehicle for weekly planning."}
              </p>
              <small>
                This is a planning estimate, not confirmed bookings or
                simultaneous rental capacity.
              </small>
            </div>
          </div>
          <Btn
            variant="primary"
            onClick={() =>
              p.onAllocation(p.branch === "all" ? undefined : selected[0])
            }
          >
            Review fleet allocation <ArrowRight aria-hidden="true" size={16} />
          </Btn>
        </section>
      ) : (
        <div className="admin-decision-empty">
          <strong>
            {p.error
              ? "Forecast results could not be loaded"
              : "No saved forecast for this selection"}
          </strong>
          <span>
            Three complete weekly observations are needed to calculate a
            forecast.
          </span>
        </div>
      )}
      <section
        className="admin-decision-panel"
        aria-labelledby="forecast-chart-heading"
      >
        <header className="admin-decision-panel-heading">
          <div>
            <h2 id="forecast-chart-heading">Weekly rental demand</h2>
            <p>
              Recorded demand and saved forecasts for the selected branch and
              category.
            </p>
          </div>
        </header>
        <div className="admin-decision-chart">{p.chart}</div>
        <footer className="admin-decision-chart-footer">{p.legend}</footer>
      </section>
      {rows.length ? (
        <section
          className="admin-decision-panel"
          aria-labelledby="forecast-results-heading"
        >
          <header className="admin-decision-panel-heading">
            <div>
              <h2 id="forecast-results-heading">Weekly outlook</h2>
              <p>Estimated demand is rounded up separately for each branch.</p>
            </div>
          </header>
          <div
            className="admin-decision-table-wrap admin-scroll-region"
            tabIndex={0}
            aria-label="Weekly forecast outlook"
          >
            <table className="admin-decision-data-table dss-forecast-results">
              <thead>
                <tr>
                  {p.branch === "all" ? <th scope="col">Branch</th> : null}
                  <th scope="col">Planning week</th>
                  <th scope="col">Estimated rental demand</th>
                  <th scope="col">Vehicles to plan for</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.target_week_start === week
                        ? "is-selected-week"
                        : undefined
                    }
                  >
                    {p.branch === "all" ? (
                      <td>{row.branch?.name ?? row.branch_id}</td>
                    ) : null}
                    <td>
                      {formatWeekRange(
                        row.target_week_start,
                        row.target_week_end,
                      )}
                      {row.target_week_start === week ? (
                        <small>Selected week</small>
                      ) : null}
                    </td>
                    <td className="is-numeric">
                      {p.formatQuantity(row.forecasted_demand)}
                    </td>
                    <td className="is-numeric">
                      {p.formatQuantity(row.required_vehicle_units)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <div className="dss-forecast-details">
        <details className="dss-forecast-disclosure dss-forecast-evidence">
          <summary>How the selected week was calculated</summary>
          <div className="dss-forecast-disclosure-body">
            <p>
              Three recent weekly inputs are weighted at 50%, 30% and 20%. Later
              weeks also use earlier forecast values.
            </p>
            {p.branch === "all" ? (
              <p>
                The example below shows one branch. Each branch is calculated
                separately.
              </p>
            ) : null}
            {p.calculation ?? (
              <p>No calculation evidence is available for this selection.</p>
            )}
          </div>
        </details>
        <details className="dss-forecast-disclosure">
          <summary>Past forecast performance and history</summary>
          <div className="dss-forecast-disclosure-body">
            <h2>Past forecast performance</h2>
            <p>
              One-week-ahead forecasts compared with completed actual demand
              across all eligible branches and categories.
            </p>
            <div className="dss-forecast-accuracy">
              <span>Average forecast error</span>
              <strong>
                {p.mape == null ? "Not yet available" : `${p.mape.toFixed(1)}%`}
              </strong>
              <p>
                {p.mape == null
                  ? "Forecast error becomes available after earlier forecasts are compared with completed weeks that recorded demand."
                  : "Lower is better. This compares earlier one-week forecasts with recorded demand; it is not an accuracy score or a guarantee of future results."}
              </p>
              <dl>
                <div>
                  <dt>Eligible observations</dt>
                  <dd>{p.eligible ?? "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Zero-actual exclusions</dt>
                  <dd>{p.excluded ?? "Unavailable"}</dd>
                </div>
              </dl>
              <Btn
                disabled={p.busy || p.loading || !p.finalizable}
                onClick={p.onFinalize}
              >
                {p.busy
                  ? "Working…"
                  : p.finalizable
                    ? `Finalize ${p.finalizable} completed`
                    : "No forecasts awaiting finalization"}
              </Btn>
            </div>
            <details className="admin-transfer-evidence admin-forecast-accuracy">
              <summary>Accuracy scope and exclusions</summary>
              <p>
                Mean Absolute Percentage Error (MAPE) covers all eligible
                branch/category series, not only the chart selection.
                Zero-actual weeks remain in demand history but are excluded from
                MAPE. Unfinished weeks and later recursive horizons are
                excluded.
              </p>
              <p>
                Synthetic records demonstrate the calculation and workflow. They
                do not establish real-world predictive accuracy or measure
                transfer quality.
              </p>
            </details>{" "}
            <details className="admin-transfer-evidence">
              <summary>Saved forecast runs</summary>
              {p.runs.length > 10 ? (
                <p>Showing the 10 most recent saved runs.</p>
              ) : null}
              <p>
                The chart uses the latest saved run containing forecast results.
                A newer run with insufficient history does not replace those
                results.
              </p>
              {!p.runs.length ? (
                <p>No saved runs are available.</p>
              ) : (
                <ul className="dss-forecast-history">
                  {[...p.runs]
                    .sort((a, b) =>
                      b.generated_at.localeCompare(a.generated_at),
                    )
                    .slice(0, 10)
                    .map((run) => (
                      <li key={run.id}>
                        <span>{p.formatDateTime(run.generated_at)}</span>
                        {run.id === p.latestRunId ? (
                          <strong>Displayed run</strong>
                        ) : (
                          <span>Saved run</span>
                        )}
                        <small>{run.id}</small>
                      </li>
                    ))}
                </ul>
              )}
            </details>
          </div>
        </details>
      </div>
      <p className="dss-forecast-footnote">
        Forecasts support planning. Vehicle transfers require admin review.
      </p>
    </div>
  );
}
