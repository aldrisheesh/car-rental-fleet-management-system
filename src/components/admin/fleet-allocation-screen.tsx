import { DssScreenSkeleton } from "./dss-loading";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ArrowRightLeft } from "lucide-react";
import { Btn } from "@/components/admin/ui";
import {
  supplyBalanceState,
  type CanonicalForecast,
  type CanonicalSupplyEvaluation,
} from "@/lib/admin-decisions";
import type { AllocationRow } from "@/lib/allocation-review";
import type { AllocationGap } from "@/lib/allocation-workspace";
import { formatWeekRange, weekEndFromStart } from "@/lib/planning-week";

type Props = {
  week: string;
  category: string;
  weeks: string[];
  categories: Array<{ id: string; name: string }>;
  branches: Array<{ id: string; name: string }>;
  forecasts: CanonicalForecast[];
  evaluations: CanonicalSupplyEvaluation[];
  rows: AllocationRow[];
  history: AllocationRow[];
  selected: AllocationRow | null;
  gaps: AllocationGap[];
  review: ReactNode;
  loading: boolean;
  busy: boolean;
  error: string;
  generationBlock: string | null;
  forecastCount: number;
  evaluatedCount: number;
  refreshDisabled: boolean;
  formatQuantity: (value: number | string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
  gapCopy: (reason: AllocationGap["reason"]) => string;
  onFilter: (week: string, category: string) => void;
  onSelect: (row: AllocationRow) => void;
  onRefresh: () => void;
  onReload: () => void;
  onGenerate: () => void;
  onForecast: () => void;
};

export function FleetAllocationScreen(p: Props) {
  const [status, setStatus] = useState("All");
  const visible = p.rows.filter(
    (row) => status === "All" || row.decision_state === status,
  );
  const displayed =
    p.selected && visible.some((row) => row.id === p.selected?.id);
  const { loading, busy, error, onSelect } = p;
  useEffect(() => {
    if (!loading && !busy && !error && visible.length && !displayed)
      onSelect(visible[0]);
  }, [loading, busy, error, onSelect, visible, displayed]);
  const forecasts = p.forecasts.filter(
    (row) =>
      (!p.week || row.target_week_start === p.week) &&
      (!p.category || row.vehicle_category_id === p.category),
  );
  const evaluations = new Map(
    p.evaluations.map((row) => [row.forecast_id, row]),
  );
  const selectedCategory =
    p.categories.find((row) => row.id === p.category)?.name ??
    "Choose a category";
  const matchingShortages = forecasts.filter(
    (row) => Number(evaluations.get(row.id)?.shortage_units ?? 0) > 0,
  ).length;
  const selectedHistory = p.history.filter(
    (row) =>
      (!p.week || row.target_week_start === p.week) &&
      row.vehicle_category_name === selectedCategory &&
      row.decision_state !== "Pending",
  );
  if (p.loading) return <DssScreenSkeleton screen="allocation" />;
  return (
    <div className="dss-allocation-screen">
      <section
        className="dss-forecast-toolbar dss-allocation-toolbar"
        aria-label="Allocation controls"
      >
        <label>
          Target week
          <select
            value={p.week}
            disabled={!p.weeks.length}
            onChange={(e) => p.onFilter(e.target.value, p.category)}
          >
            {!p.weeks.length ? (
              <option value="">No current forecast weeks</option>
            ) : null}
            {p.weeks.map((week) => (
              <option key={week} value={week}>
                {formatWeekRange(week, weekEndFromStart(week))}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vehicle category
          <select
            value={p.category}
            disabled={!p.categories.length}
            onChange={(e) => p.onFilter(p.week, e.target.value)}
          >
            {!p.categories.length ? (
              <option value="">No forecast categories</option>
            ) : null}
            {p.categories.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <div className="dss-allocation-toolbar-actions">
          <Btn onClick={p.onRefresh} disabled={p.refreshDisabled}>
            {p.busy ? "Working…" : "Refresh supply"}
          </Btn>
          <Btn onClick={p.onReload} disabled={p.loading || p.busy}>
            Reload saved analysis
          </Btn>
          <Btn
            variant="primary"
            onClick={p.onGenerate}
            disabled={!!p.generationBlock}
            aria-describedby="allocation-generation-help"
          >
            Generate recommendations
          </Btn>
        </div>
        <p id="allocation-generation-help" className="dss-allocation-scope">
          {p.generationBlock ??
            "Matching requires surplus in the same category and eligible vehicles."}{" "}
          Filters change the view; refresh and generation cover the current
          forecast run.
        </p>
      </section>
      {p.error ? (
        <div className="admin-decision-feedback is-error" role="alert">
          {p.error}{" "}
          <Btn onClick={p.onReload} disabled={p.loading || p.busy}>
            Reload analysis
          </Btn>
        </div>
      ) : null}
      <section
        className="admin-decision-panel"
        aria-labelledby="allocation-balance-heading"
        aria-busy={p.loading || p.busy}
      >
        <header className="admin-decision-panel-heading">
          <div>
            <h2 id="allocation-balance-heading">
              Branch balance · {selectedCategory}
            </h2>
            <p>
              Compare vehicle requirements with the saved projected supply for
              this week.
            </p>
          </div>
          <span className="dss-allocation-coverage">
            {p.evaluatedCount}/{p.forecastCount} current forecast positions
            evaluated
          </span>
        </header>
        {p.loading ? (
          <p className="admin-decision-empty" role="status">
            Loading supply analysis…
          </p>
        ) : !forecasts.length ? (
          <div className="admin-decision-empty">
            <strong>No current forecast for this selection</strong>
            <span>
              Review demand history and generate a current forecast before
              planning allocation.
            </span>
            <Btn onClick={p.onForecast}>
              Review Demand Forecast <ArrowRight size={14} />
            </Btn>
          </div>
        ) : (
          <div
            className="admin-decision-table-wrap admin-scroll-region"
            tabIndex={0}
            aria-label="Selected allocation branch balance"
          >
            <table className="admin-decision-data-table dss-allocation-balance">
              <thead>
                <tr>
                  <th scope="col">Branch</th>
                  <th scope="col">Required units</th>
                  <th scope="col">Projected supply</th>
                  <th scope="col">Shortage</th>
                  <th scope="col">Surplus</th>
                  <th scope="col">Balance / last checked</th>
                </tr>
              </thead>
              <tbody>
                {p.branches.map((branch) => {
                  const forecast = forecasts.find(
                    (row) => row.branch_id === branch.id,
                  );
                  const evaluation = forecast
                    ? evaluations.get(forecast.id)
                    : undefined;
                  const state = evaluation
                    ? supplyBalanceState(evaluation)
                    : null;
                  return (
                    <tr key={branch.id}>
                      <th scope="row">{branch.name}</th>
                      <td>
                        {p.formatQuantity(
                          evaluation?.required_units_snapshot ??
                            forecast?.required_vehicle_units,
                        )}
                      </td>
                      <td>{p.formatQuantity(evaluation?.projected_supply)}</td>
                      <td>{p.formatQuantity(evaluation?.shortage_units)}</td>
                      <td>{p.formatQuantity(evaluation?.surplus_units)}</td>
                      <td>
                        <span
                          className={`admin-decision-state is-${p.error ? "pending" : (state?.toLowerCase() ?? "pending")}`}
                        >
                          <i />
                          {p.error
                            ? "Check unavailable"
                            : (state ??
                              (forecast ? "Not evaluated" : "No forecast"))}
                        </span>
                        {evaluation ? (
                          <small>
                            {p.formatDateTime(evaluation.evaluated_at)}
                          </small>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <footer className="admin-decision-balance-note">
          Active vehicles, bookings, rentals, and maintenance affect readiness.
          A saved snapshot is not clearance to move a vehicle.
        </footer>
      </section>
      <div className="dss-allocation-layout">
        <div className="dss-allocation-register">
          <section
            className="admin-decision-panel"
            aria-labelledby="allocation-options-heading"
          >
            <header className="admin-decision-panel-heading">
              <div>
                <h2 id="allocation-options-heading">Recommendations</h2>
                <p>
                  {p.rows.length} current match{p.rows.length === 1 ? "" : "es"}{" "}
                  for this week and category.
                </p>
              </div>
              <label className="dss-allocation-status">
                Decision status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {["All", "Pending", "Approved", "Rejected"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </header>
            <nav
              className="dss-allocation-options"
              aria-label="Current transfer recommendations"
            >
              {p.loading || p.busy ? (
                <p className="admin-decision-empty" role="status">
                  Preparing transfer options…
                </p>
              ) : p.error ? (
                <div className="admin-decision-empty">
                  <strong>Analysis could not be verified</strong>
                  <span>
                    Reload the analysis before treating an empty list as no
                    transfer needed.
                  </span>
                </div>
              ) : !visible.length ? (
                <div className="admin-decision-empty">
                  <ArrowRightLeft aria-hidden="true" />
                  <strong>
                    {p.rows.length
                      ? "No recommendations with this status"
                      : matchingShortages
                        ? "Shortages remain without a current match"
                        : "No transfer match for this selection"}
                  </strong>
                  <span>
                    {p.rows.length
                      ? "Choose another decision status to review the saved matches."
                      : matchingShortages
                        ? "Review the shortage evidence below. Available surplus may be incompatible or have no eligible vehicle."
                        : "Review the balance above. An empty list does not authorize movement."}
                  </span>
                </div>
              ) : (
                <ul>
                  {visible.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        aria-pressed={row.id === p.selected?.id}
                        className={
                          row.id === p.selected?.id ? "is-selected" : ""
                        }
                        onClick={() => p.onSelect(row)}
                      >
                        <strong>
                          {row.source_branch_name}{" "}
                          <ArrowRight size={15} aria-hidden="true" />{" "}
                          {row.destination_branch_name}
                        </strong>
                        <span>
                          {row.recommended_transfer_units}{" "}
                          {row.vehicle_category_name} vehicle
                          {row.recommended_transfer_units === 1 ? "" : "s"} ·
                          Horizon {row.forecast_horizon}
                        </span>
                        <small>
                          {row.candidates.length} candidate
                          {row.candidates.length === 1 ? "" : "s"} eligible at
                          analysis time
                        </small>
                        <span
                          className={`admin-decision-recommendation-state is-${row.decision_state.toLowerCase()}`}
                        >
                          {row.decision_state}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </nav>
          </section>
          <section
            className="admin-decision-panel"
            aria-labelledby="allocation-unresolved-heading"
          >
            <header className="admin-decision-panel-heading">
              <div>
                <h2 id="allocation-unresolved-heading">Unresolved shortages</h2>
                <p>Approval alone does not change the saved supply balance.</p>
              </div>
            </header>
            {p.loading || p.error ? (
              <p className="admin-decision-empty">
                {p.loading
                  ? "Loading shortage evidence…"
                  : "Shortage evidence could not be verified."}
              </p>
            ) : p.gaps.length ? (
              <ul className="dss-allocation-gaps">
                {p.gaps.map((gap) => (
                  <li key={gap.evaluationId}>
                    <strong>
                      {p.branches.find((row) => row.id === gap.branchId)
                        ?.name ?? gap.branchId}{" "}
                      · {gap.unresolvedUnits} unmatched unit
                      {gap.unresolvedUnits === 1 ? "" : "s"}
                    </strong>
                    <p>{p.gapCopy(gap.reason)}</p>
                    <small>
                      Saved shortage {gap.shortageUnits}; generator matched{" "}
                      {gap.recommendedUnits}. Movement remains a separate
                      operational step.
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-decision-empty">
                {matchingShortages
                  ? "The supply balance still has shortages. No current unresolved-shortage explanation is saved for this selection; review or generate the current matching analysis."
                  : "The selected supply balance has no recorded shortage. Continue checking readiness as bookings change."}
              </p>
            )}
          </section>
          <details className="admin-decision-panel dss-allocation-history">
            <summary>
              Recorded decision history ({selectedHistory.length})
            </summary>
            <p>
              Saved decisions for this week and category, including older
              analysis batches. They do not replace current readiness checks.
            </p>
            <ul>
              {selectedHistory.map((row) => (
                <li key={row.id}>
                  <strong>
                    {row.source_branch_name} → {row.destination_branch_name}
                  </strong>
                  <span>
                    {row.decision_state}
                    {row.decision_state === "Approved"
                      ? ` · ${row.approved_transfer_units ?? "Unavailable"} permitted units`
                      : ""}
                  </span>
                  <small>
                    Recorded {p.formatDateTime(row.decided_at)} · prepared{" "}
                    {p.formatDateTime(row.created_at)}
                  </small>
                </li>
              ))}
            </ul>
            {!selectedHistory.length ? (
              <p>No recorded decisions for this selection.</p>
            ) : null}
          </details>
        </div>
        <section
          id="allocation-selected-review"
          tabIndex={-1}
          className="admin-decision-panel dss-allocation-review"
          aria-label="Selected transfer review"
          aria-busy={p.loading || p.busy}
        >
          <header className="admin-decision-panel-heading">
            <div>
              <h2>Recommendation review</h2>
              <p>
                Review evidence and record a decision before arranging movement
                in Fleet.
              </p>
            </div>
          </header>
          <div className="dss-allocation-review-body">
            {p.loading || p.error ? (
              <div className="admin-decision-empty">
                {p.loading
                  ? "Loading the current review…"
                  : "Resolve the analysis error before recording a decision."}
              </div>
            ) : displayed ? (
              p.review
            ) : (
              <div className="admin-decision-empty">
                <strong>Select a recommendation to review</strong>
                <span>
                  Its supply snapshots, candidate evidence, external advisories
                  and decision controls appear here.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
