import { DssScreenSkeleton } from "./dss-loading";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CarFront,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
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
  refreshing: boolean;
  refreshError: string;
  loadedAt: string | null;
  range: { start: string; end: string };
  search: DssSearch;
  formatDateTime: (value: string | null | undefined) => string;
  onRefresh: () => void;
  onContext: (value: Partial<DssSearch>) => void;
  onAllocation: (row?: VehicleAnalyticsRow) => void;
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
  }).sort((a, b) => Number(b.rentalDays === 0) - Number(a.rentalDays === 0));
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
  const dateLabel = (date: string) =>
    new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00+08:00`));
  const period = `${dateLabel(p.range.start)} – ${dateLabel(p.range.end)}`;
  const noActivity = rows.filter((row) => row.rentalDays === 0).length;
  const unknownIdle = rows.filter(
    (row) => row.idleClassification === "Unable to Determine",
  ).length;
  const branchChoices = choices(p.rows, "branch"),
    categoryChoices = choices(p.rows, "category");
  const currentStatus = (row: VehicleAnalyticsRow) =>
    !row.isActive
      ? "Inactive"
      : row.activeRental
        ? "On rental"
        : !row.maintenanceReady
          ? "Needs maintenance"
          : "Rental ready";

  if (p.loading) return <DssScreenSkeleton screen="utilization" />;
  return (
    <div className="dss-utilization-screen dss-utilization-screen--reference">
      <section
        className="utilization-planning-controls"
        aria-label="Utilization controls"
      >
        <label>
          Branch
          <select
            value={branch}
            onChange={(e) => filter({ utilBranch: e.target.value })}
          >
            <option value="all">All branches</option>
            {branchChoices.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
            {branch !== "all" &&
            !branchChoices.some((row) => row.id === branch) ? (
              <option value={branch}>Branch unavailable</option>
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
            {categoryChoices.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
            {category !== "all" &&
            !categoryChoices.some((row) => row.id === category) ? (
              <option value={category}>Category unavailable</option>
            ) : null}
          </select>
        </label>
        <div className="utilization-period-control">
          <span>Reporting period</span>
          <details className="utilization-period-picker">
            <summary>
              {period}
              <CalendarDays size={18} aria-hidden="true" />
            </summary>
            <form onSubmit={applyPeriod} className="dss-utilization-period">
              <label>
                From
                <input
                  type="date"
                  value={start}
                  onInput={(e) => {
                    setStart(e.currentTarget.value);
                    setDateError("");
                  }}
                  max={dayKey(new Date())}
                  onChange={(e) => {
                    setStart(e.target.value);
                    setDateError("");
                  }}
                  aria-invalid={!!dateError}
                />
              </label>
              <label>
                Through
                <input
                  type="date"
                  value={end}
                  onInput={(e) => {
                    setEnd(e.currentTarget.value);
                    setDateError("");
                  }}
                  max={dayKey(new Date())}
                  onChange={(e) => {
                    setEnd(e.target.value);
                    setDateError("");
                  }}
                  aria-invalid={!!dateError}
                />
              </label>
              <Btn type="submit">Apply period</Btn>
              {dateError ? (
                <p role="alert" className="dss-utilization-error">
                  {dateError}
                </p>
              ) : null}
            </form>
          </details>
        </div>
        <div className="utilization-activity-through">
          <span>Activity through {dateLabel(p.range.end)}.</span>
          <Btn onClick={p.onRefresh} disabled={p.refreshing}>
            {p.refreshing ? "Updating activity…" : "Refresh activity"}
          </Btn>
        </div>
      </section>
      {p.refreshError ? (
        <p className="dss-utilization-error" role="status">
          {p.refreshError}
        </p>
      ) : null}
      {!p.error && rows.length ? (
        <section
          className={`utilization-activity-summary ${noActivity ? "needs-attention" : "is-covered"}`}
          aria-label="Rental activity summary"
        >
          {noActivity ? (
            <AlertCircle aria-hidden="true" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
          <div>
            <h2>
              {noActivity
                ? `${noActivity} vehicle${noActivity === 1 ? " has" : "s have"} had no recorded rental in this period.`
                : "All matching vehicles have recorded rental activity."}
            </h2>
            <p>
              {noActivity
                ? "Review condition and upcoming bookings before considering a transfer."
                : "Review recent activity alongside current condition and upcoming bookings."}
            </p>
          </div>
          <p className="utilization-summary-caution">
            No recent rental activity does not mean the vehicle is available.
          </p>
        </section>
      ) : null}
      <section
        className="admin-decision-panel"
        aria-labelledby="utilization-register-heading"
        aria-busy={p.loading}
      >
        <header className="admin-decision-panel-heading">
          <div>
            <h2 id="utilization-register-heading">
              Rental activity by vehicle
            </h2>
            <p>
              {rows.length} matching vehicle{rows.length === 1 ? "" : "s"} ·
              recent rental activity and current condition.
            </p>
          </div>
          <details className="utilization-table-filters">
            <summary>Search and filter vehicles</summary>
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
          </details>
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
                    <th scope="col">Vehicle</th>
                    <th scope="col">Branch</th>
                    <th scope="col">Rental activity in period</th>
                    <th scope="col">Last rental started</th>
                    <th scope="col">Current status</th>
                    <th scope="col">Action</th>
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
                      <td>{row.branch ?? "Unassigned"}</td>
                      <td>
                        {row.rentalDays === 0
                          ? "No recorded rentals"
                          : `${row.rentalDays} rental day${row.rentalDays === 1 ? "" : "s"}`}
                      </td>
                      <td>
                        {row.lastRentalStartedAt
                          ? dateLabel(dayKey(new Date(row.lastRentalStartedAt)))
                          : "No rental recorded"}
                      </td>
                      <td>
                        <span
                          className={`utilization-current-status ${!row.isActive || !row.maintenanceReady ? "needs-attention" : row.activeRental ? "on-rental" : "is-ready"}`}
                        >
                          {currentStatus(row)}
                        </span>
                      </td>
                      <td>
                        <Link
                          to="/admin/fleet"
                          search={{
                            ...p.search,
                            vehicle: row.vehicleId,
                            q: row.licensePlate ?? row.name,
                          }}
                          className="utilization-view-vehicle"
                          aria-label={`View vehicle ${row.name} ${row.licensePlate ?? ""}`}
                        >
                          View vehicle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="utilization-table-note">
              Current status is separate from rental activity. Check booking
              dates for availability.
            </p>
            {pages > 1 ? (
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
            ) : null}
          </>
        )}
      </section>
      <section className="utilization-next-step">
        <div>
          <h2>What to check next</h2>
          <p>
            Open the vehicle record to check maintenance and future
            reservations.
          </p>
        </div>
        <Btn
          variant="primary"
          onClick={() => p.onAllocation()}
          disabled={!!p.error || !p.rows.length}
        >
          Review fleet allocation <ArrowRight size={16} />
        </Btn>
      </section>
      <div className="utilization-supporting-details">
        <details className="utilization-method-disclosure">
          <summary>What do rental activity and idle mean?</summary>
          <div>
            <p>
              <strong>Rental days:</strong> Each day a vehicle was on an actual
              rental counts once, even for part of a day. A confirmed booking
              alone does not count.
            </p>
            <p>
              <strong>Utilization:</strong> Rental days ÷ days counted for use ×
              100. Inactive days and maintenance that prevents use without
              rental activity are excluded. Missing history or no days to count
              means the percentage is unavailable.
            </p>
            <p>
              <strong>Idle:</strong> At least 14 days since the last return or
              activation, with the vehicle currently ready for rental. No
              rentals in this period alone does not mean it is idle or ready to
              transfer.
            </p>
            <p>
              <strong>Last rental started:</strong> The most recent rental start
              on record, even if it was before this reporting period.
            </p>
            {unknownIdle ? (
              <p>
                {unknownIdle} matching vehicle
                {unknownIdle === 1 ? " needs" : "s need"} more recorded history
                before we can tell whether{" "}
                {unknownIdle === 1 ? "it is" : "they are"} idle.
              </p>
            ) : null}
            <small>
              {p.loadedAt ? `Loaded ${p.formatDateTime(p.loadedAt)}. ` : ""}
              Both start and end dates are included. Days use Philippine time.
            </small>
          </div>
        </details>
        {!p.loading && !p.error && selected ? (
          <details className="utilization-record-disclosure">
            <summary>View supporting rental records</summary>
            <div className="utilization-record-selector">
              <label>
                Vehicle
                <select
                  value={selected.vehicleId}
                  onChange={(e) => p.onContext({ vehicle: e.target.value })}
                >
                  {rows.map((row) => (
                    <option key={row.vehicleId} value={row.vehicleId}>
                      {row.name} · {row.licensePlate ?? row.vehicleId}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <section
              className="dss-utilization-inspector"
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
                  <Link
                    to="/admin/bookings"
                    search={{ q: selected.licensePlate ?? selected.name }}
                  >
                    Review bookings
                  </Link>
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
                        <dt>Past vehicle-status records</dt>
                        <dd>
                          {selected.coverage === "Complete"
                            ? "Complete"
                            : "Some records are missing"}
                        </dd>
                      </div>
                    </dl>
                    {utilizationUnavailableReason(selected) ? (
                      <p className="dss-utilization-coverage-warning">
                        {utilizationUnavailableReason(selected)}
                      </p>
                    ) : (
                      <p className="dss-utilization-formula">
                        {selected.rentalDays} ÷{" "}
                        {selected.eligibleOperationalDays} × 100 ={" "}
                        {percentage(selected)}
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
                        <dt>Idle count starts from</dt>
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
                    <p>
                      The count starts from the last return or activation used
                      by the system, not from when the rental started.
                    </p>
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
                      Utilization = rental days ÷ eligible operational days ×
                      100. Rental days count distinct Manila calendar dates
                      touched by actual rental transactions, including active
                      rentals up to the server evaluation time. Confirmed
                      bookings alone do not count.
                    </p>
                    <p>
                      Eligibility uses recorded active-state history and
                      blocking maintenance. Inactive days and
                      maintenance-unavailable days without rental activity are
                      excluded. If any reporting date lacks active-state
                      coverage, the full-period percentage stays unavailable.
                      Zero eligible days also produce an unavailable rate.
                    </p>
                    <p>
                      Idle days measure elapsed time since the later applicable
                      last physical rental return or current activation
                      baseline. They are not reporting-period eligible days
                      minus rental days. An idle flag requires current
                      eligibility and at least 14 consecutive days; a missing
                      baseline is not guessed.
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
                  An idle flag is a review signal. It does not authorize
                  movement or establish donor eligibility. Allocation checks
                  compatible demand and supply separately; verify current
                  bookings, maintenance and readiness in Fleet before making a
                  change.
                </p>
              </div>
            </section>
          </details>
        ) : null}
      </div>
    </div>
  );
}
