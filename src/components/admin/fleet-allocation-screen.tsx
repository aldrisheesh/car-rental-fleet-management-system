import { DssScreenSkeleton } from "./dss-loading";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Btn } from "@/components/admin/ui";
import {
  supplyBalanceState,
  type CanonicalForecast,
  type CanonicalSupplyEvaluation,
} from "@/lib/admin-decisions";
import type { AllocationRow } from "@/lib/allocation-review";
import {
  allocationDecisionCoverage,
  type AllocationGap,
} from "@/lib/allocation-workspace";
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
  const [openedId, setOpenedId] = useState<string | null>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const visible = p.rows.filter(
    (row) => status === "All" || row.decision_state === status,
  );
  const showReview =
    !!openedId &&
    p.selected?.id === openedId &&
    visible.some((row) => row.id === openedId);
  useEffect(() => {
    if (showReview) {
      reviewRef.current?.focus({ preventScroll: true });
      reviewRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [showReview, openedId]);
  const forecasts = p.forecasts.filter(
    (row) =>
      (!p.week || row.target_week_start === p.week) &&
      (!p.category || row.vehicle_category_id === p.category),
  );
  const evaluations = new Map(
    p.evaluations.map((row) => [row.forecast_id, row]),
  );
  const selectedCategory =
    p.categories.find((row) => row.id === p.category)?.name ?? "vehicle";
  const categoryCopy =
    selectedCategory.length <= 3
      ? selectedCategory
      : selectedCategory.toLowerCase();
  const branchName = (id: string) =>
    p.branches.find((row) => row.id === id)?.name ?? "Branch";
  const shortName = (id: string) => branchName(id).split(",")[0];
  const checkedCount = forecasts.filter((row) =>
    evaluations.has(row.id),
  ).length;
  const fullyChecked =
    forecasts.length > 0 && checkedCount === forecasts.length;
  const shortages = forecasts.flatMap((forecast) => {
    const evaluation = evaluations.get(forecast.id);
    if (!evaluation || Number(evaluation.shortage_units) <= 0) return [];
    return [
      {
        forecast,
        evaluation,
        gap: p.gaps.find((gap) => gap.evaluationId === evaluation.id),
        coverage: allocationDecisionCoverage(
          evaluation.id,
          Number(evaluation.shortage_units),
          p.rows,
        ),
      },
    ];
  });
  const shortageUnits = shortages.reduce(
    (sum, row) => sum + Number(row.evaluation.shortage_units),
    0,
  );
  const proposedUnits = shortages.reduce(
    (sum, row) =>
      sum +
      Math.min(Number(row.evaluation.shortage_units), row.coverage.pending),
    0,
  );
  const approvedUnits = shortages.reduce(
    (sum, row) =>
      sum +
      Math.min(Number(row.evaluation.shortage_units), row.coverage.approved),
    0,
  );
  const latestCheck = forecasts
    .map((row) => evaluations.get(row.id)?.evaluated_at)
    .filter((date): date is string => !!date)
    .sort()
    .at(-1);
  const selectedHistory = p.history.filter(
    (row) =>
      (!p.week || row.target_week_start === p.week) &&
      row.vehicle_category_name === selectedCategory &&
      row.decision_state !== "Pending",
  );
  const equalNeeds =
    shortages.length > 1 &&
    shortages.every(
      (row) =>
        Number(row.evaluation.shortage_units) ===
        Number(shortages[0].evaluation.shortage_units),
    );
  const needsCopy =
    shortages.length === 1
      ? `${shortName(shortages[0].forecast.branch_id)} may need ${shortages[0].evaluation.shortage_units} more ${categoryCopy} vehicle${Number(shortages[0].evaluation.shortage_units) === 1 ? "" : "s"}.`
      : equalNeeds
        ? `${shortages.map((row) => shortName(row.forecast.branch_id)).join(" and ")} may each need ${shortages[0].evaluation.shortage_units} more ${categoryCopy} vehicle${Number(shortages[0].evaluation.shortage_units) === 1 ? "" : "s"}.`
        : `${shortages.length} branches may need ${shortageUnits} more ${categoryCopy} vehicles in total.`;
  const headline = p.error
    ? "Availability could not be checked."
    : !forecasts.length
      ? "Start with a demand forecast."
      : !fullyChecked
        ? "Update availability before planning a transfer."
        : shortageUnits
          ? needsCopy
          : "The saved plan has enough vehicles.";
  const explanation = p.error
    ? "Reload the saved analysis to try again."
    : !forecasts.length
      ? "No demand estimate is saved for this week and category."
      : !fullyChecked
        ? `${checkedCount} of ${forecasts.length} branch forecasts have been checked.`
        : proposedUnits
          ? `${proposedUnits} vehicle${proposedUnits === 1 ? " is" : "s are"} proposed for transfer. ${Math.max(0, shortageUnits - proposedUnits)} more would still be needed after the proposed transfers.`
          : approvedUnits
            ? `${approvedUnits} vehicle${approvedUnits === 1 ? " has" : "s have"} been approved for transfer. Arrange movement in Fleet, then update availability.`
            : shortageUnits
              ? "No suitable transfer is saved yet. Review the reason below and check vehicle schedules."
              : "No transfer is needed for this estimate. Update availability as bookings change.";
  const nextSteps: Record<AllocationGap["reason"], string> = {
    NoCompatibleSurplus:
      "No other branch had spare vehicles in this category. Check upcoming returns and rental dates for another option.",
    NoEligibleCandidates:
      "Spare capacity was found, but no vehicle passed the transfer checks. Review bookings and vehicle readiness.",
    InsufficientEligibleCandidates:
      "The suitable transfer vehicles cannot cover the full need. Check upcoming returns for the remaining vehicles.",
    NoRemainingCapacity:
      "The spare capacity was matched to other branch needs. Review those transfers before arranging another option.",
  };
  if (p.loading) return <DssScreenSkeleton screen="allocation" />;
  return (
    <div className="dss-allocation-screen dss-allocation-screen--reference">
      <section
        className="allocation-planning-controls"
        aria-label="Allocation controls"
      >
        <label>
          Planning week
          <select
            value={p.week}
            disabled={!p.weeks.length || p.busy}
            onChange={(event) => {
              setOpenedId(null);
              p.onFilter(event.target.value, p.category);
            }}
          >
            {!p.weeks.length ? (
              <option value="">No forecast weeks</option>
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
            disabled={!p.categories.length || p.busy}
            onChange={(event) => {
              setOpenedId(null);
              p.onFilter(p.week, event.target.value);
            }}
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
        <div className="allocation-update">
          <Btn onClick={p.onRefresh} disabled={p.refreshDisabled}>
            {p.busy ? "Updating…" : "Update availability"}
          </Btn>
          <small>
            {latestCheck
              ? `Latest check ${p.formatDateTime(latestCheck)}`
              : "Availability not checked"}
          </small>
        </div>
      </section>
      {p.error ? (
        <div className="admin-decision-feedback is-error" role="alert">
          {p.error}{" "}
          <Btn onClick={p.onReload} disabled={p.busy}>
            Reload analysis
          </Btn>
        </div>
      ) : null}
      <section
        className="allocation-overview"
        aria-labelledby="allocation-balance-heading"
        aria-busy={p.busy}
      >
        <div
          className={`allocation-planning-result ${shortageUnits || !fullyChecked || p.error ? "needs-attention" : "is-covered"}`}
        >
          {shortageUnits || !fullyChecked || p.error ? (
            <AlertCircle aria-hidden="true" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
          <div>
            <h2>{headline}</h2>
            <p>{explanation}</p>
            <small>
              Weekly planning estimate. Check rental dates before arranging a
              vehicle.
            </small>
          </div>
        </div>
        <h2 id="allocation-balance-heading">Branch availability</h2>
        {!forecasts.length ? (
          <div className="allocation-inline-empty">
            <p>
              Generate a demand forecast before comparing branch availability.
            </p>
            <Btn onClick={p.onForecast}>
              Review Demand Forecast <ArrowRight size={14} />
            </Btn>
          </div>
        ) : (
          <div
            className="allocation-availability-scroll admin-scroll-region"
            tabIndex={0}
            aria-label="Branch availability table"
          >
            <table className="allocation-availability-table">
              <thead>
                <tr>
                  <th scope="col">Branch</th>
                  <th scope="col">Vehicles to plan for</th>
                  <th scope="col">Available for planning</th>
                  <th scope="col">Result</th>
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
                      <td>
                        <span
                          className={`allocation-balance-result is-${p.error ? "pending" : (state?.toLowerCase() ?? "pending")}`}
                        >
                          <i aria-hidden="true" />
                          {p.error
                            ? "Check unavailable"
                            : !evaluation
                              ? forecast
                                ? "Not checked"
                                : "No forecast"
                              : Number(evaluation.shortage_units) > 0
                                ? `Needs ${p.formatQuantity(evaluation.shortage_units)} more`
                                : Number(evaluation.surplus_units) > 0
                                  ? `${p.formatQuantity(evaluation.surplus_units)} spare`
                                  : "Enough vehicles"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <details className="allocation-disclosure">
          <summary>How availability is counted</summary>
          <div>
            <p>
              Vehicles to plan for are rounded weekly demand, not the number of
              simultaneous rentals. Available vehicles exclude confirmed
              bookings during the week, active rentals and blocking maintenance.
            </p>
            <p>
              Transfers must use the same vehicle category and pass booking and
              readiness checks. Updating availability and finding transfers
              cover all weeks and categories in the current forecast.
            </p>
            <ul>
              {forecasts.map((row) => (
                <li key={row.id}>
                  {branchName(row.branch_id)}:{" "}
                  {evaluations.get(row.id)?.evaluated_at
                    ? `checked ${p.formatDateTime(evaluations.get(row.id)?.evaluated_at)}`
                    : "not checked"}
                </li>
              ))}
            </ul>
            <Btn onClick={p.onReload} disabled={p.busy}>
              Reload saved analysis
            </Btn>
          </div>
        </details>
      </section>
      <section
        className="allocation-transfer-section"
        aria-labelledby="allocation-options-heading"
      >
        <header className="allocation-section-heading">
          <h2 id="allocation-options-heading">
            Suggested transfer{p.rows.length === 1 ? "" : "s"}
          </h2>
          <Btn
            onClick={p.onGenerate}
            disabled={!!p.generationBlock || p.busy}
            aria-describedby="allocation-generation-help"
          >
            {p.busy ? "Working…" : "Find transfer options"}
          </Btn>
        </header>
        <p id="allocation-generation-help" className="allocation-inline-empty">
          {fullyChecked &&
          !shortageUnits &&
          p.generationBlock &&
          !p.error &&
          !p.busy
            ? "No transfer is needed for the selected week and category."
            : (p.generationBlock ??
              "Find transfer options checks spare vehicles against branch needs.")}
          {p.generationBlock &&
          shortageUnits > 0 &&
          fullyChecked &&
          !p.error &&
          !p.busy
            ? " Review upcoming returns and bookings. Update availability after those records change."
            : ""}
        </p>
        {p.rows.length ? (
          <label className="allocation-decision-filter">
            Show decisions{" "}
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setOpenedId(null);
              }}
            >
              {["All", "Pending", "Approved", "Rejected"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        ) : null}
        {p.busy ? (
          <p className="allocation-inline-empty" role="status">
            Updating the saved transfer analysis…
          </p>
        ) : p.error ? (
          <p className="allocation-inline-empty">
            Reload the analysis before reviewing transfers.
          </p>
        ) : visible.length ? (
          <ul className="allocation-transfer-list">
            {visible.map((row) => (
              <li key={row.id}>
                <strong>
                  {row.source_branch_name.split(",")[0]}{" "}
                  <ArrowRight size={18} aria-hidden="true" />{" "}
                  {row.destination_branch_name.split(",")[0]}
                </strong>
                <span>
                  {row.recommended_transfer_units}{" "}
                  {row.vehicle_category_name.length <= 3
                    ? row.vehicle_category_name
                    : row.vehicle_category_name.toLowerCase()}{" "}
                  vehicle{row.recommended_transfer_units === 1 ? "" : "s"}
                </span>
                <div>
                  <b
                    className={`allocation-transfer-status is-${row.decision_state.toLowerCase()}`}
                  >
                    {row.decision_state === "Pending"
                      ? "Awaiting review"
                      : row.decision_state}
                  </b>
                  <p>
                    {row.decision_state === "Approved"
                      ? `${row.approved_transfer_units ?? "Unrecorded"} approved. Arrange movement separately in Fleet.`
                      : row.decision_state === "Rejected"
                        ? "This transfer will not be used."
                        : `${row.candidates.length} vehicle${row.candidates.length === 1 ? " passed" : "s passed"} the saved transfer checks.`}
                  </p>
                </div>
                <Btn
                  variant="primary"
                  disabled={p.busy}
                  aria-expanded={showReview && openedId === row.id}
                  aria-controls="allocation-selected-review"
                  onClick={() => {
                    setOpenedId(row.id);
                    p.onSelect(row);
                  }}
                >
                  Review transfer
                </Btn>
              </li>
            ))}
          </ul>
        ) : (
          <div className="allocation-inline-empty">
            <strong>
              {p.rows.length
                ? "No transfers with this decision status."
                : shortageUnits
                  ? "No suitable transfer saved for this selection."
                  : fullyChecked
                    ? "No transfer needed for this estimate."
                    : "Check branch availability first."}
            </strong>
            {!p.rows.length && shortageUnits ? (
              <p>
                Another branch may not have spare vehicles, or its vehicles may
                not pass the transfer checks.
              </p>
            ) : null}
          </div>
        )}
        {shortages.length && !p.error ? (
          <div className="allocation-remaining-needs">
            {shortages.map(({ forecast, evaluation, gap, coverage }) => {
              const remaining = Math.max(
                0,
                Number(evaluation.shortage_units) -
                  coverage.pending -
                  coverage.approved,
              );
              return (
                <div key={evaluation.id}>
                  <Info size={19} aria-hidden="true" />
                  <div>
                    <strong>
                      {remaining > 0
                        ? `${shortName(forecast.branch_id)} still needs ${remaining} more vehicle${remaining === 1 ? "" : "s"} beyond the proposed or approved transfers.`
                        : `${shortName(forecast.branch_id)} has transfers proposed or approved for the estimated need.`}
                    </strong>
                    <p>
                      {gap
                        ? nextSteps[gap.reason]
                        : coverage.approved
                          ? "Arrange approved movements in Fleet, then update availability."
                          : coverage.pending
                            ? "Review the transfer before arranging any movement."
                            : "Find transfer options to check whether another branch can help."}
                    </p>
                    <details className="allocation-shortage-evidence">
                      <summary>View saved shortage analysis</summary>
                      <p>
                        Pending: {coverage.pending} · Approved:{" "}
                        {coverage.approved} · Rejected: {coverage.rejected}.
                        These are decisions, not completed transfers.
                      </p>
                      {gap ? (
                        <p>
                          {p.gapCopy(gap.reason)} {gap.unresolvedUnits} could
                          not be matched when the analysis was saved.
                        </p>
                      ) : null}
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <details className="allocation-disclosure allocation-analysis-controls">
          <summary>Analysis options</summary>
          <div>
            <p>
              This action covers all weeks and categories in the current
              forecast.
            </p>
          </div>
        </details>
        <details className="allocation-disclosure">
          <summary>
            Previous transfer decisions ({selectedHistory.length})
          </summary>
          <div>
            <p>
              Saved decisions for this week and category, including older
              analyses.
            </p>
            {selectedHistory.length ? (
              <ul className="allocation-history-list">
                {selectedHistory.map((row) => (
                  <li key={row.id}>
                    <strong>
                      {row.source_branch_name} → {row.destination_branch_name}
                    </strong>
                    <span>
                      {row.decision_state}
                      {row.decision_state === "Approved"
                        ? ` · ${row.approved_transfer_units ?? "Unrecorded"} vehicle${row.approved_transfer_units === 1 ? "" : "s"} approved`
                        : ""}
                    </span>
                    <small>Recorded {p.formatDateTime(row.decided_at)}</small>
                    <details className="allocation-history-details">
                      <summary>View decision details</summary>
                      <div>
                        <p>
                          <strong>Planning week:</strong>{" "}
                          {formatWeekRange(
                            row.target_week_start,
                            row.target_week_end,
                          )}
                        </p>
                        <p>
                          <strong>Recorded reason:</strong>{" "}
                          {row.decision_reason || "No reason recorded."}
                        </p>
                        <p>
                          {row.decision_state === "Approved"
                            ? "Approval records a quantity, not a completed vehicle move. Check the vehicle's current branch in Fleet before arranging movement."
                            : "This recommendation was rejected. No movement is recorded by this decision."}
                        </p>
                        <h3>Candidate vehicles in the saved recommendation</h3>
                        <p>
                          These candidates were checked when the analysis was
                          saved. This list does not identify a vehicle as moved
                          or individually approved.
                        </p>
                        {row.candidates.length ? (
                          <ul>
                            {row.candidates.map((candidate) => (
                              <li key={candidate.id}>
                                <strong>
                                  {candidate.vehicle_name_snapshot}
                                </strong>
                                <span>
                                  {candidate.license_plate_snapshot ??
                                    "No plate recorded"}
                                </span>
                                <Link
                                  to="/admin/fleet"
                                  search={{
                                    week: p.week,
                                    category: p.category,
                                    recommendation: row.id,
                                    q:
                                      candidate.license_plate_snapshot ??
                                      candidate.vehicle_name_snapshot,
                                  }}
                                >
                                  Review vehicle in Fleet
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No candidate vehicles were recorded.</p>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No previous decisions for this selection.</p>
            )}
          </div>
        </details>
      </section>
      {showReview ? (
        <section
          ref={reviewRef}
          id="allocation-selected-review"
          tabIndex={-1}
          className="admin-decision-panel dss-allocation-review allocation-open-review"
          aria-label="Selected transfer review"
          aria-busy={p.busy}
        >
          <header className="allocation-section-heading">
            <div>
              <h2>Review transfer</h2>
              <p>Check the vehicles and route before recording a decision.</p>
            </div>
            <Btn onClick={() => setOpenedId(null)}>Close review</Btn>
          </header>
          <div className="dss-allocation-review-body">
            {p.error ? (
              <p>Resolve the analysis error before recording a decision.</p>
            ) : (
              p.review
            )}
          </div>
        </section>
      ) : null}
      <footer className="allocation-page-note">
        Approval records a decision. Move vehicles separately in Fleet.{" "}
        <span>Availability is a saved estimate.</span>
      </footer>
    </div>
  );
}
