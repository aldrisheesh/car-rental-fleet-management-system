import { DssScreenSkeleton } from "./dss-loading";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CarFront } from "lucide-react";
import { Btn } from "@/components/admin/ui";
import { dayKey } from "@/lib/vehicle-analytics-intervals";
import type { DssSearch } from "@/lib/dss-navigation";
import {
  filterUtilizationRows,
  reportingRangeError,
  utilizationUnavailableReason,
  idleExplanation,
  idleDaysForDisplay,
  type VehicleAnalyticsRow,
} from "@/lib/utilization-workspace";

type Props = {
  rows: VehicleAnalyticsRow[];
  loading: boolean;
  error: string;
  loadedAt: string | null;
  range: { start: string; end: string };
  search: DssSearch;
  formatDateTime: (value: string | null | undefined) => string;
  onRefresh: () => void;
  onContext: (value: Partial<DssSearch>) => void;
  onAllocation: (row: VehicleAnalyticsRow) => void;
};
const quantity = (value: number | string | null) =>
  value == null ? "Unavailable" : String(value);
const percentage = (row: VehicleAnalyticsRow) =>
  utilizationUnavailableReason(row)
    ? "Unavailable"
    : `${row.utilizationPercent!.toFixed(1)}%`;
const choices = (rows: VehicleAnalyticsRow[], kind: "branch" | "category") =>
  [
    ...new Map(
      rows.flatMap((row) => {
        const id = kind === "branch" ? row.branchId : row.categoryId;
        const name = kind === "branch" ? row.branch : row.category;
        return id
          ? [[id, { id, name: name ?? "Unnamed location/category" }] as const]
          : [];
      }),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

export function VehicleUtilizationScreen(p: Props) {
  const [start, setStart] = useState(p.range.start);
  const [end, setEnd] = useState(p.range.end);
  const [dateError, setDateError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState<number | null>(null);
  const branch = p.search.utilBranch ?? "all",
    category = p.search.utilCategory ?? "all";
  const rows = filterUtilizationRows(p.rows, {
    branch,
    category,
    status,
    query,
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const selectedIndex = rows.findIndex(
    (row) => row.vehicleId === p.search.vehicle,
  );
  const currentPage = Math.min(
    page ?? (selectedIndex < 0 ? 1 : Math.floor(selectedIndex / 10) + 1),
    pages,
  );
  const pageRows = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const selected =
    rows.find((row) => row.vehicleId === p.search.vehicle) ??
    pageRows[0] ??
    null;
  function filter(value: Partial<DssSearch>) {
    setPage(1);
    p.onContext({ ...value, vehicle: undefined });
  }
  function applyPeriod(e: React.FormEvent) {
    e.preventDefault();
    const error = reportingRangeError(start, end, dayKey(new Date()));
    setDateError(error);
    if (!error) {
      setPage(1);
      p.onContext({ start, end });
    }
  }
  const period = `${p.range.start} – ${p.range.end}`;
  if (p.loading) return <DssScreenSkeleton screen="utilization" />;
  return (
    <div className="dss-utilization-screen">
      <section
        className="dss-forecast-toolbar dss-utilization-toolbar"
        aria-label="Utilization controls"
      >
        <form onSubmit={applyPeriod} className="dss-utilization-period">
          <label>
            From
            <input
              type="date"
              value={start}
              onInput={(event) => {
                setStart(event.currentTarget.value);
                setDateError("");
              }}
              max={dayKey(new Date())}
              onChange={(e) => {
                setStart(e.target.value);
                setDateError("");
              }}
              aria-invalid={!!dateError}
              aria-describedby={
                dateError ? "utilization-date-error" : undefined
              }
            />
          </label>
          <label>
            Through
            <input
              type="date"
              value={end}
              onInput={(event) => {
                setEnd(event.currentTarget.value);
                setDateError("");
              }}
              max={dayKey(new Date())}
              onChange={(e) => {
                setEnd(e.target.value);
                setDateError("");
              }}
              aria-invalid={!!dateError}
              aria-describedby={
                dateError ? "utilization-date-error" : undefined
              }
            />
          </label>
          <Btn type="submit" disabled={p.loading}>
            Apply period
          </Btn>
        </form>
        <label>
          Location
          <select
            value={branch}
            onChange={(e) => filter({ utilBranch: e.target.value })}
          >
            <option value="all">All locations</option>
            {choices(p.rows, "branch").map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
            {branch !== "all" &&
            !choices(p.rows, "branch").some((row) => row.id === branch) ? (
              <option value={branch}>Location unavailable</option>
            ) : null}
          </select>
        </label>
        <label>
          Vehicle category
          <select
            value={category}
            onChange={(e) => filter({ utilCategory: e.target.value })}
          >
            <option value="all">All categories</option>
            {choices(p.rows, "category").map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
            {category !== "all" &&
            !choices(p.rows, "category").some((row) => row.id === category) ? (
              <option value={category}>Category unavailable</option>
            ) : null}
          </select>
        </label>
        <Btn variant="primary" onClick={p.onRefresh} disabled={p.loading}>
          {p.loading ? "Loading analysis…" : "Refresh analysis"}
        </Btn>
        <p className="dss-utilization-period-note">
          Reporting period: {period}, inclusive, Asia/Manila. Idle
          classification reflects current conditions, independently of this
          reporting period.
          {p.loadedAt && !p.loading
            ? ` Loaded ${p.formatDateTime(p.loadedAt)}.`
            : ""}
        </p>
        {dateError ? (
          <p
            id="utilization-date-error"
            role="alert"
            className="dss-utilization-error"
          >
            {dateError}
          </p>
        ) : null}
      </section>
      <section
        className="admin-decision-panel"
        aria-labelledby="utilization-register-heading"
        aria-busy={p.loading}
      >
        <header className="admin-decision-panel-heading">
          <div>
            <h2 id="utilization-register-heading">Vehicle utilization</h2>
            <p>
              {rows.length} matching vehicle{rows.length === 1 ? "" : "s"} ·
              rental activity and historical eligibility coverage.
            </p>
          </div>
          <div className="dss-utilization-filters">
            <label>
              Search vehicles
              <input
                type="search"
                placeholder="Name, plate or location"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label>
              Idle classification
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                {["All", "Idle", "Not Idle", "Unable to Determine"].map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </label>
          </div>
        </header>
        {p.loading ? (
          <p className="admin-decision-empty" role="status">
            Loading rental activity and coverage…
          </p>
        ) : p.error ? (
          <div className="admin-decision-empty is-error" role="alert">
            <strong>Vehicle analysis could not be loaded</strong>
            <span>{p.error}</span>
            <Btn onClick={p.onRefresh}>Retry analysis</Btn>
          </div>
        ) : !rows.length ? (
          <div className="admin-decision-empty">
            <CarFront aria-hidden="true" />
            <strong>
              {p.rows.length
                ? "No vehicles match these filters"
                : "No vehicle analysis is available"}
            </strong>
            <span>
              {p.rows.length
                ? "Clear the filters to review the available vehicles."
                : "Review vehicle records in Fleet, then refresh the analysis."}
            </span>
            {p.rows.length ? (
              <Btn
                onClick={() => {
                  setQuery("");
                  setStatus("All");
                  filter({ utilBranch: "all", utilCategory: "all" });
                }}
              >
                Clear filters
              </Btn>
            ) : (
              <Link to="/admin/fleet">Review Fleet</Link>
            )}
          </div>
        ) : (
          <>
            <div
              className="admin-decision-table-wrap admin-scroll-region"
              tabIndex={0}
              aria-label="Vehicle utilization comparison"
            >
              <table className="admin-decision-data-table dss-utilization-table">
                <thead>
                  <tr>
                    <th scope="col">Vehicle / plate</th>
                    <th scope="col">Location / category</th>
                    <th scope="col">Rental days</th>
                    <th scope="col">Eligible days</th>
                    <th scope="col">Utilization</th>
                    <th scope="col">Coverage</th>
                    <th scope="col">Idle days</th>
                    <th scope="col">Idle classification</th>
                    <th scope="col">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr
                      key={row.vehicleId}
                      className={
                        selected?.vehicleId === row.vehicleId
                          ? "is-selected"
                          : ""
                      }
                    >
                      <th scope="row">
                        <strong>{row.name}</strong>
                        <small>{row.licensePlate ?? "No plate recorded"}</small>
                      </th>
                      <td>
                        {row.branch ?? "Unassigned"}
                        <small>{row.category ?? "Uncategorized"}</small>
                      </td>
                      <td>{row.rentalDays}</td>
                      <td>{quantity(row.eligibleOperationalDays)}</td>
                      <td>{percentage(row)}</td>
                      <td>
                        {row.coverage === "Complete"
                          ? "Complete"
                          : "Insufficient history"}
                      </td>
                      <td>{quantity(idleDaysForDisplay(row))}</td>
                      <td>
                        <span
                          className={`admin-decision-state is-${row.idleClassification === "Idle" ? "shortage" : row.idleClassification === "Unable to Determine" ? "pending" : "balanced"}`}
                        >
                          <i />
                          {row.idleClassification}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-decision-text-link"
                          aria-pressed={selected?.vehicleId === row.vehicleId}
                          aria-label={`Review ${row.name} ${row.licensePlate ?? ""}`}
                          onClick={() => {
                            p.onContext({ vehicle: row.vehicleId });
                            requestAnimationFrame(() =>
                              document
                                .getElementById("utilization-selected-review")
                                ?.focus(),
                            );
                          }}
                        >
                          Review vehicle{" "}
                          <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="dss-utilization-pager">
              <span>
                {(currentPage - 1) * 10 + 1}–
                {Math.min(currentPage * 10, rows.length)} of {rows.length}{" "}
                vehicles
              </span>
              <div>
                <Btn
                  disabled={currentPage === 1}
                  onClick={() => {
                    setPage(currentPage - 1);
                    p.onContext({ vehicle: undefined });
                  }}
                >
                  Previous
                </Btn>
                <span>
                  Page {currentPage} of {pages}
                </span>
                <Btn
                  disabled={currentPage === pages}
                  onClick={() => {
                    setPage(currentPage + 1);
                    p.onContext({ vehicle: undefined });
                  }}
                >
                  Next
                </Btn>
              </div>
            </footer>
          </>
        )}
      </section>
      {!p.loading && !p.error && selected ? (
        <section
          className="admin-decision-panel dss-utilization-inspector"
          aria-label="Selected vehicle review"
          id="utilization-selected-review"
          tabIndex={-1}
        >
          <header className="admin-decision-panel-heading">
            <div>
              <h2>{selected.name}</h2>
              <p>
                {selected.licensePlate ?? "No plate recorded"} ·{" "}
                {selected.branch ?? "Unassigned location"} ·{" "}
                {selected.category ?? "Uncategorized"}
              </p>
            </div>
            <span
              className={`admin-decision-state is-${selected.idleClassification === "Idle" ? "shortage" : selected.idleClassification === "Unable to Determine" ? "pending" : "balanced"}`}
            >
              <i />
              {selected.idleClassification}
            </span>
          </header>
          <div className="dss-utilization-review-body">
            <nav
              className="dss-utilization-actions"
              aria-label="Selected vehicle actions"
            >
              <Link
                to="/admin/fleet"
                search={{
                  ...p.search,
                  vehicle: selected.vehicleId,
                  q: selected.licensePlate ?? selected.name,
                }}
              >
                Review vehicle in Fleet
              </Link>
              <a
                href={`/admin/bookings?q=${encodeURIComponent(selected.licensePlate ?? selected.name)}`}
              >
                Review bookings
              </a>
              <Link
                to="/admin/maintenance"
                search={{ vehicleId: selected.vehicleId }}
              >
                Review maintenance
              </Link>
              <Btn
                variant="primary"
                disabled={!selected.categoryId || !selected.branchId}
                onClick={() => p.onAllocation(selected)}
              >
                View allocation options
              </Btn>
            </nav>
            {!selected.categoryId || !selected.branchId ? (
              <p className="dss-utilization-muted">
                Assign a location and category in Fleet before reviewing
                matching allocation options.
              </p>
            ) : null}
            <div className="dss-utilization-evidence">
              <section aria-label="Utilization calculation">
                <h3>Rental activity and coverage</h3>
                <p>
                  {selected.reportingStart} – {selected.reportingEnd} ·
                  Asia/Manila
                </p>
                <dl>
                  <div>
                    <dt>Rental days</dt>
                    <dd>{selected.rentalDays}</dd>
                  </div>
                  <div>
                    <dt>Eligible operational days</dt>
                    <dd>{quantity(selected.eligibleOperationalDays)}</dd>
                  </div>
                  <div>
                    <dt>Utilization</dt>
                    <dd>{percentage(selected)}</dd>
                  </div>
                  <div>
                    <dt>Historical coverage</dt>
                    <dd>{selected.coverage}</dd>
                  </div>
                </dl>
                {utilizationUnavailableReason(selected) ? (
                  <p className="dss-utilization-coverage-warning">
                    {utilizationUnavailableReason(selected)}
                  </p>
                ) : (
                  <p className="dss-utilization-formula">
                    {selected.rentalDays} ÷ {selected.eligibleOperationalDays} ×
                    100 = {percentage(selected)}
                  </p>
                )}
              </section>
              <section aria-label="Idle and readiness evidence">
                <h3>Current idle and readiness evidence</h3>
                <dl>
                  <div>
                    <dt>Idle days</dt>
                    <dd>{quantity(idleDaysForDisplay(selected))}</dd>
                  </div>
                  <div>
                    <dt>Idle baseline</dt>
                    <dd>{p.formatDateTime(selected.idleReference)}</dd>
                  </div>
                  <div>
                    <dt>Vehicle active</dt>
                    <dd>{selected.isActive ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Active rental</dt>
                    <dd>{selected.activeRental ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Maintenance ready</dt>
                    <dd>{selected.maintenanceReady ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Idle eligible</dt>
                    <dd>{selected.idleEligible ? "Yes" : "No"}</dd>
                  </div>
                </dl>
                <p>{idleExplanation(selected)}</p>
                {selected.maintenanceReasons.length ? (
                  <ul>
                    {selected.maintenanceReasons.map((reason) => (
                      <li key={reason}>{reason.replaceAll("_", " ")}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            </div>
            <details className="dss-utilization-method">
              <summary>Calculation rules and data coverage</summary>
              <div>
                <p>
                  Utilization = rental days ÷ eligible operational days × 100.
                  Rental days count distinct Manila calendar dates touched by
                  actual rental transactions, including active rentals up to the
                  server evaluation time. Confirmed bookings alone do not count.
                </p>
                <p>
                  Eligibility uses recorded active-state history and blocking
                  maintenance. Inactive days and maintenance-unavailable days
                  without rental activity are excluded. If any reporting date
                  lacks active-state coverage, the full-period percentage stays
                  unavailable. Zero eligible days also produce an unavailable
                  rate.
                </p>
                <p>
                  Idle days measure elapsed time since the later applicable last
                  physical rental return or current activation baseline. They
                  are not reporting-period eligible days minus rental days. An
                  idle flag requires current eligibility and at least 14
                  consecutive days; a missing baseline is not guessed.
                </p>
                <p>
                  These analytics use recorded system activity. Synthetic
                  demonstration records establish functional behavior, not
                  measured client performance or real-world forecasting
                  accuracy.
                </p>
              </div>
            </details>
            <p className="dss-utilization-advisory">
              An idle flag is a review signal. It does not authorize movement or
              establish donor eligibility. Allocation checks compatible demand
              and supply separately; verify current bookings, maintenance and
              readiness in Fleet before making a change.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
