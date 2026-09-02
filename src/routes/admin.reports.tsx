import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarCheck, Car, RotateCcw, Wrench } from "lucide-react";
import {
  Btn,
  Card,
  CardHeader,
  KPI,
  PageHeader,
  TInput,
  TSelect,
  Toolbar,
} from "@/components/admin/ui";
import {
  ALL_BRANCHES,
  defaultReportRange,
  type AdminReportsResponse,
} from "@/lib/admin-reports";

type ReportSearch = { from?: string; to?: string; branch?: string };

export const Route = createFileRoute("/admin/reports")({
  validateSearch: (search: Record<string, unknown>): ReportSearch => ({
    from: typeof search.from === "string" ? search.from : undefined,
    to: typeof search.to === "string" ? search.to : undefined,
    branch: typeof search.branch === "string" ? search.branch : undefined,
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const defaults = useMemo(() => defaultReportRange(), []);
  const start = search.from ?? defaults.start;
  const end = search.to ?? defaults.end;
  const branch = search.branch ?? ALL_BRANCHES;
  const [report, setReport] = useState<AdminReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ start, end, branch });
    fetch(`/api/admin-reports?${query}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as
          | AdminReportsResponse
          | { message?: string }
          | null;
        if (!response.ok)
          throw new Error(
            body && "message" in body && body.message
              ? body.message
              : "Unable to load reports.",
          );
        return body as AdminReportsResponse;
      })
      .then(setReport)
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setReport(null);
        setError(
          cause instanceof Error ? cause.message : "Unable to load reports.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt, branch, end, start]);

  function updateFilters(next: Partial<ReportSearch>) {
    void navigate({
      to: "/admin/reports",
      search: {
        from: next.from ?? start,
        to: next.to ?? end,
        branch: next.branch ?? branch,
      },
    });
  }

  function changeDate(part: "from" | "to", value: string) {
    if (!value) return;
    let nextStart = part === "from" ? value : start;
    let nextEnd = part === "to" ? value : end;
    if (nextStart > nextEnd) {
      if (part === "from") nextEnd = nextStart;
      else nextStart = nextEnd;
    }
    updateFilters({ from: nextStart, to: nextEnd });
  }

  function reset() {
    const range = defaultReportRange();
    updateFilters({ from: range.start, to: range.end, branch: ALL_BRANCHES });
  }

  const branches = report?.branches ?? [];
  const branchLabel =
    branch === ALL_BRANCHES
      ? "All branches"
      : (branches.find((row) => row.id === branch)?.name ?? "Selected branch");

  return (
    <div>
      <PageHeader
        title="Reports & analytics"
        subtitle="Canonical booking, rental, vehicle, branch, category, and maintenance analytics."
      />
      <Toolbar>
        <div className="flex w-full flex-wrap items-end gap-3">
          <FilterField label="From">
            <TInput
              type="date"
              value={start}
              onChange={(event) => changeDate("from", event.target.value)}
            />
          </FilterField>
          <FilterField label="To">
            <TInput
              type="date"
              value={end}
              onChange={(event) => changeDate("to", event.target.value)}
            />
          </FilterField>
          <FilterField label="Branch">
            <TSelect
              className="min-w-52"
              value={branch}
              onChange={(event) =>
                updateFilters({ branch: event.target.value })
              }
            >
              <option value={ALL_BRANCHES}>All branches</option>
              {branches.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </TSelect>
          </FilterField>
          <Btn
            type="button"
            variant="ghost"
            onClick={reset}
            className="border border-primary/20 bg-primary/5 text-primary"
          >
            <RotateCcw className="h-4 w-4" /> Last 30 days
          </Btn>
          <span className="text-xs text-muted-foreground sm:ml-auto">
            {formatDate(start)} to {formatDate(end)} · {branchLabel}
          </span>
        </div>
      </Toolbar>
      {loading ? (
        <Card>
          <p className="p-6 text-sm text-muted-foreground">
            Loading canonical reports…
          </p>
        </Card>
      ) : error || !report ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 p-6">
            <p className="text-sm text-destructive">
              {error || "Unable to load reports."}
            </p>
            <Btn type="button" onClick={() => setAttempt((value) => value + 1)}>
              Retry
            </Btn>
          </div>
        </Card>
      ) : (
        <ReportSections report={report} />
      )}
    </div>
  );
}

function ReportSections({ report }: { report: AdminReportsResponse }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI
          accent
          label="Booking requests"
          value={String(report.summary.bookingRequests)}
          delta="Created in range"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KPI
          label="Rentals started"
          value={String(report.summary.rentalsStarted)}
          delta="Physical releases in range"
          icon={<Car className="h-4 w-4" />}
        />
        <KPI
          label="Rentals completed"
          value={String(report.summary.rentalsCompleted)}
          delta="Physical returns in range"
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <KPI
          label="Fleet count"
          value={String(report.summary.fleetCount)}
          delta="Recorded by period end"
          icon={<Car className="h-4 w-4" />}
        />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Booking activity"
            hint="Requests grouped by canonical status using booking created_at"
          />
          {report.bookings.requests === 0 ? (
            <Empty>No booking requests in the selected range.</Empty>
          ) : (
            <MetricRows
              rows={report.bookings.statusBreakdown.map((row) => [
                row.status,
                String(row.count),
              ])}
            />
          )}
        </Card>
        <Card>
          <CardHeader
            title="Rental activity"
            hint="Canonical rental transaction timestamps"
          />
          {report.rentals.started === 0 && report.rentals.completed === 0 ? (
            <Empty>
              No rental starts or completions in the selected range.
            </Empty>
          ) : null}
          <MetricRows
            rows={[
              ["Started in range", String(report.rentals.started)],
              ["Completed in range", String(report.rentals.completed)],
              [
                "Active at period end",
                String(report.rentals.activeAtPeriodEnd),
              ],
            ]}
          />
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader
          title="Vehicle utilization & idle"
          hint={`Rental days ÷ eligible operational days; ${report.utilization.availableVehicleCount} available, ${report.utilization.unavailableVehicleCount} unavailable`}
        />
        {report.utilization.vehicles.length === 0 ? (
          <Empty>No vehicles match this branch filter.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <Th>Vehicle</Th>
                  <Th>Branch / category</Th>
                  <Th>Rental days</Th>
                  <Th>Eligible days</Th>
                  <Th>Utilization</Th>
                  <Th>Readiness</Th>
                  <Th>Active rental</Th>
                  <Th>Idle</Th>
                </tr>
              </thead>
              <tbody>
                {report.utilization.vehicles.map((row) => (
                  <tr key={row.vehicleId} className="border-b border-border/60">
                    <Td>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.licensePlate ?? "No plate"}
                      </div>
                    </Td>
                    <Td>
                      {row.branch ?? "Unknown / unassigned"}
                      <div className="text-xs text-muted-foreground">
                        {row.category ?? "Unknown / unassigned"}
                      </div>
                    </Td>
                    <Td>{row.rentalDays}</Td>
                    <Td>{row.eligibleOperationalDays ?? "Unavailable"}</Td>
                    <Td>
                      {row.utilizationPercent == null ? (
                        <span>
                          Unavailable
                          <div className="text-xs text-muted-foreground">
                            Insufficient historical eligibility data
                          </div>
                        </span>
                      ) : (
                        formatPercent(row.utilizationPercent)
                      )}
                    </Td>
                    <Td>{row.maintenanceReady ? "Ready" : "Not ready"}</Td>
                    <Td>{row.activeRental ? "Yes" : "No"}</Td>
                    <Td>
                      {row.idleClassification}
                      {row.idleDays != null ? ` · ${row.idleDays}d` : ""}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <BranchPerformanceTable rows={report.branchesPerformance} />
        <PerformanceTable
          title="Category performance"
          rows={report.categoriesPerformance.map((row) => ({
            key: row.categoryId ?? "unknown",
            name: row.name,
            fleet: row.fleetCount,
            utilization: row.utilization,
            idle: row.idleVehicles,
          }))}
          firstMetric="Rental days"
          firstValues={report.categoriesPerformance.map(
            (row) => row.rentalDays,
          )}
        />
      </div>
      <Card className="mt-4">
        <CardHeader
          title="Maintenance workload"
          hint="Canonical maintenance lifecycle timestamps; no reconstructed overdue state"
        />
        {report.maintenance.started === 0 &&
        report.maintenance.completed === 0 &&
        report.maintenance.cancelled === 0 &&
        report.maintenance.blockingWorkload === 0 ? (
          <Empty>
            No maintenance activity or blocking workload in the selected range.
          </Empty>
        ) : null}
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <SmallMetric
            label="Started in range"
            value={report.maintenance.started}
          />
          <SmallMetric
            label="Completed in range"
            value={report.maintenance.completed}
          />
          <SmallMetric
            label="Cancelled in range"
            value={report.maintenance.cancelled}
          />
          <SmallMetric
            label="Blocking workload"
            value={report.maintenance.blockingWorkload}
            icon={<Wrench className="h-4 w-4" />}
          />
        </div>
      </Card>
    </>
  );
}

type PerformanceRow = {
  key: string;
  name: string;
  fleet: number;
  utilization: {
    averagePercent: number | null;
    availableVehicleCount: number;
    unavailableVehicleCount: number;
  };
  idle: number;
};

function BranchPerformanceTable({
  rows,
}: {
  rows: AdminReportsResponse["branchesPerformance"];
}) {
  return (
    <Card>
      <CardHeader
        title="Branch performance"
        hint="Canonical pickup and current vehicle-branch relationships; fleet recorded by period end"
      />
      {rows.length === 0 ? (
        <Empty>No canonical branches match this filter.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <Th>Name</Th>
                <Th>Booking requests</Th>
                <Th>Rental starts</Th>
                <Th>Fleet</Th>
                <Th>Avg utilization</Th>
                <Th>Blocking maintenance</Th>
                <Th>Idle</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.branchId ?? "unknown"}
                  className="border-b border-border/60"
                >
                  <Td className="font-medium">{row.name}</Td>
                  <Td>{row.bookingRequests}</Td>
                  <Td>{row.rentalStarts}</Td>
                  <Td>{row.fleetCount}</Td>
                  <Td>{formatUtilization(row.utilization)}</Td>
                  <Td>{row.blockingMaintenance}</Td>
                  <Td>{row.idleVehicles}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function PerformanceTable({
  title,
  rows,
  firstMetric,
  firstValues,
}: {
  title: string;
  rows: PerformanceRow[];
  firstMetric: string;
  firstValues: number[];
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        hint="Canonical relationships; unavailable utilization is excluded from averages"
      />
      {rows.length === 0 ? (
        <Empty>No canonical groups match this filter.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <Th>Name</Th>
                <Th>{firstMetric}</Th>
                <Th>Fleet</Th>
                <Th>Avg utilization</Th>
                <Th>Idle</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.key} className="border-b border-border/60">
                  <Td className="font-medium">{row.name}</Td>
                  <Td>{firstValues[index]}</Td>
                  <Td>{row.fleet}</Td>
                  <Td>{formatUtilization(row.utilization)}</Td>
                  <Td>{row.idle}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function MetricRows({ rows }: { rows: string[][] }) {
  return (
    <div className="space-y-2 p-5">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}
function SmallMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="p-5 text-sm text-muted-foreground">{children}</p>;
}
function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
function formatUtilization(value: PerformanceRow["utilization"]) {
  return value.averagePercent == null
    ? "Unavailable"
    : `${formatPercent(value.averagePercent)} (${value.availableVehicleCount} covered)`;
}
function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00+08:00`));
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
