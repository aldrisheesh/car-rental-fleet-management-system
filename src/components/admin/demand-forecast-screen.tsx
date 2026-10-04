import { DssScreenSkeleton } from "./dss-loading";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Btn } from "@/components/admin/ui";
import {
  supplyBalanceState,
  type CanonicalForecast,
  type CanonicalSupplyEvaluation,
  type CanonicalForecastRun,
} from "@/lib/admin-decisions";
import { formatWeekRange } from "@/lib/planning-week";

type Option = { id: string; name: string };
type Props = {
  branch: string;
  category: string;
  branches: Option[];
  categories: Option[];
  rows: CanonicalForecast[];
  evaluations: Map<string, CanonicalSupplyEvaluation>;
  runs: CanonicalForecastRun[];
  latestRunId?: string;
  loading: boolean;
  busy: boolean;
  error: string;
  notice: string;
  supplyLoading: boolean;
  supplyError: string;
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
  onUtilization: () => void;
};

export function DemandForecastScreen(p: Props) {
  if (p.loading) return <DssScreenSkeleton screen="forecast" />;
  const latestRun = p.runs.find((run) => run.id === p.latestRunId);
  return (
    <div className="dss-forecast-screen">
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
        <div className="dss-forecast-run">
          <span>Latest saved forecast</span>
          <strong>
            {latestRun
              ? p.formatDateTime(latestRun.generated_at)
              : "No saved forecast"}
          </strong>
          <small>
            Generate covers all configured branch/category pairs. Filters change
            the view.
          </small>
        </div>
        <Btn
          variant="primary"
          disabled={p.busy || p.loading}
          onClick={p.onGenerate}
        >
          {p.busy ? "Working…" : "Generate forecast"}
        </Btn>
      </section>

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

      <div className="dss-forecast-layout">
        <div className="dss-forecast-main">
          <section
            className="admin-decision-panel"
            aria-labelledby="forecast-chart-heading"
            aria-busy={p.loading}
          >
            <header className="admin-decision-panel-heading">
              <div>
                <h2 id="forecast-chart-heading">Weekly rental demand</h2>
                <p>
                  Actual weekly demand, saved historical forecasts, and the
                  latest 3-week Weighted Moving Average outlook.
                </p>
              </div>
            </header>
            <div className="admin-decision-chart">{p.chart}</div>
            <footer className="admin-decision-chart-footer">{p.legend}</footer>
          </section>

          <section
            className="admin-decision-panel"
            aria-labelledby="forecast-results-heading"
          >
            <header className="admin-decision-panel-heading">
              <div>
                <h2 id="forecast-results-heading">Forecast results</h2>
                <p>
                  Decimal demand is rounded up for the vehicle planning
                  requirement.
                </p>
              </div>
            </header>
            {p.loading && !p.rows.length ? (
              <p className="admin-decision-empty" role="status">
                Loading forecast results…
              </p>
            ) : !p.rows.length ? (
              <div className="admin-decision-empty">
                <strong>
                  {p.error
                    ? "Forecast results could not be loaded"
                    : "No saved forecast for this selection"}
                </strong>
                <span>
                  {p.error
                    ? "Reload the forecast to try again."
                    : "Three complete weekly observations are needed for each branch/category pair. Insufficient history cannot produce a forecast."}
                </span>
              </div>
            ) : (
              <div
                className="admin-decision-table-wrap admin-scroll-region"
                tabIndex={0}
                aria-label="Forecast results table"
              >
                <table className="admin-decision-data-table dss-forecast-results">
                  <thead>
                    <tr>
                      <th scope="col">Branch</th>
                      <th scope="col">Target week</th>
                      <th scope="col">Forecast demand</th>
                      <th scope="col">Required units</th>
                      <th scope="col">Supply balance</th>
                      <th scope="col">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...p.rows]
                      .sort(
                        (a, b) =>
                          a.target_week_start.localeCompare(
                            b.target_week_start,
                          ) ||
                          (a.branch?.name ?? a.branch_id).localeCompare(
                            b.branch?.name ?? b.branch_id,
                          ),
                      )
                      .map((row) => {
                        const evaluation = p.evaluations.get(row.id);
                        const state = evaluation
                          ? supplyBalanceState(evaluation)
                          : null;
                        return (
                          <tr key={row.id}>
                            <td>
                              <strong>
                                {row.branch?.name ?? row.branch_id}
                              </strong>
                              <small>
                                {row.category?.name ?? row.vehicle_category_id}
                              </small>
                            </td>
                            <td>
                              {formatWeekRange(
                                row.target_week_start,
                                row.target_week_end,
                              )}
                              <small>Horizon {row.horizon}</small>
                            </td>
                            <td className="is-numeric">
                              {p.formatQuantity(row.forecasted_demand)}
                            </td>
                            <td className="is-numeric">
                              {p.formatQuantity(row.required_vehicle_units)}
                            </td>
                            <td>
                              <span
                                className={`admin-decision-state is-${state ? state.toLowerCase() : "pending"}`}
                              >
                                <i />
                                {p.supplyError
                                  ? "Check unavailable"
                                  : p.supplyLoading
                                    ? "Checking…"
                                    : (state ?? "Not evaluated")}
                              </span>
                              {evaluation &&
                              !p.supplyError &&
                              !p.supplyLoading ? (
                                <small>
                                  {p.formatQuantity(
                                    evaluation.projected_supply,
                                  )}{" "}
                                  projected · checked{" "}
                                  {p.formatDateTime(evaluation.evaluated_at)}
                                </small>
                              ) : null}
                            </td>
                            <td>
                              <Btn onClick={() => p.onAllocation(row)}>
                                View allocation{" "}
                                <ArrowRight aria-hidden="true" size={14} />
                              </Btn>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
            {p.supplyError ? (
              <p className="admin-decision-feedback is-error" role="alert">
                {p.supplyError} Open Fleet Allocation to retry the supply check.
              </p>
            ) : null}
          </section>

          <section
            className="admin-decision-panel dss-forecast-evidence"
            aria-label="Forecast calculation evidence"
          >
            <header className="admin-decision-panel-heading">
              <div>
                <h2>How this forecast was calculated</h2>
                <p>
                  The example identifies its branch, category and target week
                  below.
                </p>
              </div>
            </header>
            {p.calculation ?? (
              <div className="admin-decision-empty">
                Calculation evidence will appear when a saved forecast with its
                input weeks is available.
              </div>
            )}
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
          </section>
        </div>

        <aside
          className="dss-forecast-aside"
          aria-label="Forecast accuracy and next actions"
        >
          <section className="admin-decision-panel">
            <header className="admin-decision-panel-heading">
              <div>
                <h2>Forecast accuracy</h2>
                <p>Finalized horizon-1 results across eligible series.</p>
              </div>
            </header>
            <div className="dss-forecast-accuracy">
              <span>Mean Absolute Percentage Error (MAPE)</span>
              <strong>
                {p.mape == null ? "Not yet available" : `${p.mape.toFixed(1)}%`}
              </strong>
              <p>
                {p.mape == null
                  ? "Accuracy becomes available after completed forecasts are finalized against nonzero actual weekly demand."
                  : "This reflects finalized observations, not a guarantee for future demand."}
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
                MAPE covers all eligible branch/category series, not only the
                chart selection. Zero-actual weeks remain in demand history but
                are excluded from MAPE. Unfinished weeks and later recursive
                horizons are excluded.
              </p>
              <p>
                Synthetic records demonstrate the calculation and workflow. They
                do not establish real-world predictive accuracy or measure
                transfer quality.
              </p>
            </details>
          </section>
          <section className="admin-decision-panel">
            <header className="admin-decision-panel-heading">
              <div>
                <h2>Continue the review</h2>
                <p>Use the forecast to review supply and vehicle activity.</p>
              </div>
            </header>
            <div className="dss-forecast-next">
              <button type="button" onClick={() => p.onAllocation()}>
                <strong>
                  Review fleet allocation{" "}
                  <ArrowRight aria-hidden="true" size={16} />
                </strong>
                <span>
                  Compare required units and projected supply, then review saved
                  transfer recommendations.
                </span>
              </button>
              <button type="button" onClick={p.onUtilization}>
                <strong>
                  Review vehicle utilization{" "}
                  <ArrowRight aria-hidden="true" size={16} />
                </strong>
                <span>
                  Inspect idle signals and recent rental activity before
                  reviewing vehicles in Fleet.
                </span>
              </button>
              <p>
                Approval records a decision. Vehicles are moved separately in
                Fleet after readiness and affected bookings are checked.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
