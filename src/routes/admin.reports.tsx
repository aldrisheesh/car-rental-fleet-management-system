import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { BarChart3, Car, RotateCcw, TrendingUp, Wallet } from "lucide-react";
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
import { bookings, branches, fleet, maintenance, peso } from "@/data/admin";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";

const goldGrid = "rgba(255,255,255,0.06)";
const DAY_MS = 24 * 60 * 60 * 1000;
const utilizationStatuses = new Set(["Confirmed", "Ongoing", "Completed"]);

const branchOptions = [
  { value: "both", label: "Both branches" },
  { value: "taft", label: "Taft, Manila" },
  { value: "antipolo", label: "Antipolo, Rizal" },
] as const;

const branchConfig = {
  taft: {
    label: branches[0],
    color: "oklch(0.84 0.16 92)",
  },
  antipolo: {
    label: branches[1],
    color: "oklch(0.55 0.05 260)",
  },
} as const;

type ReportBranch = (typeof branchOptions)[number]["value"];
type BranchKey = Exclude<ReportBranch, "both">;
type DateRange = { from: string; to: string };
type ReportSearch = {
  from?: string;
  to?: string;
  branch?: ReportBranch;
};

export const Route = createFileRoute("/admin/reports")({
  validateSearch: (search: Record<string, unknown>): ReportSearch => ({
    from: isDateValue(search.from) ? search.from : undefined,
    to: isDateValue(search.to) ? search.to : undefined,
    branch: isReportBranch(search.branch) ? search.branch : undefined,
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const session = getAdminSession();
  const staffView = isStaffRole(session?.role);
  const branch = search.branch ?? "both";
  const range = normalizeRange(search.from, search.to);
  const selectedBranches = branch === "both" ? (["taft", "antipolo"] as BranchKey[]) : [branch];

  const report = buildReport(range, selectedBranches);

  function updateFilters(next: Partial<ReportSearch>) {
    const nextRange = normalizeRange(next.from ?? range.from, next.to ?? range.to);

    void navigate({
      to: "/admin/reports",
      search: {
        from: nextRange.from,
        to: nextRange.to,
        branch: next.branch ?? branch,
      },
    });
  }

  function handleDateChange(part: keyof DateRange, value: string) {
    if (!isDateValue(value)) return;

    let nextFrom = part === "from" ? value : range.from;
    let nextTo = part === "to" ? value : range.to;

    if (dateValueToUtc(nextFrom) > dateValueToUtc(nextTo)) {
      if (part === "from") nextTo = nextFrom;
      else nextFrom = nextTo;
    }

    updateFilters({ from: nextFrom, to: nextTo });
  }

  function resetYtd() {
    updateFilters({ ...getYtdRange(), branch: "both" });
  }

  const title = staffView ? "Operational reports" : "Reports & analytics";
  const subtitle = staffView
    ? "Bookings, utilization, and service workload filtered by date and branch."
    : "Executive view of revenue, utilization, and branch performance.";

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      <Toolbar>
        <div className="flex w-full flex-wrap items-end gap-3">
          <FilterField label="From" className="w-full sm:w-auto">
            <TInput
              type="date"
              value={range.from}
              onChange={(event) => handleDateChange("from", event.target.value)}
              className="min-w-40"
            />
          </FilterField>
          <FilterField label="To" className="w-full sm:w-auto">
            <TInput
              type="date"
              value={range.to}
              onChange={(event) => handleDateChange("to", event.target.value)}
              className="min-w-40"
            />
          </FilterField>
          <FilterField label="Branch" className="w-full sm:w-auto">
            <TSelect
              value={branch}
              onChange={(event) => updateFilters({ branch: event.target.value as ReportBranch })}
              className="min-w-52"
            >
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TSelect>
          </FilterField>
          <Btn
            type="button"
            variant="ghost"
            onClick={resetYtd}
            className="border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" /> YTD
          </Btn>
          <span className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-md border border-border bg-background px-3 text-left text-xs font-medium leading-5 text-muted-foreground sm:ml-auto">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="min-w-0">
              {formatDateRange(range)} - {branchLabel(branch)}
            </span>
          </span>
        </div>
      </Toolbar>

      {staffView ? (
        <StaffReports report={report} branch={branch} />
      ) : (
        <OwnerReports report={report} branch={branch} />
      )}
    </div>
  );
}

function OwnerReports({ report, branch }: { report: ReportData; branch: ReportBranch }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI
          accent
          label="Revenue"
          value={peso(Math.round(report.revenue))}
          delta={report.periodLabel}
          icon={<Wallet className="h-4 w-4" />}
        />
        <KPI
          label="Bookings"
          value={report.bookings.toLocaleString()}
          delta="Non-cancelled"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KPI
          label="Avg utilization"
          value={formatPercent(report.utilization)}
          delta={`${report.rentableFleet} rentable vehicles`}
          icon={<Car className="h-4 w-4" />}
        />
        <KPI
          label="Avg ticket"
          value={peso(Math.round(report.avgTicket))}
          delta={`${report.revenueBookings} paid rentals`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <RevenueTrendCard report={report} />
        <UtilizationCard value={report.utilization} hint={branchLabel(branch)} />
      </div>

      <div className={`mt-4 grid gap-4 ${branch === "both" ? "xl:grid-cols-2" : ""}`}>
        {branch === "both" ? <BranchComparisonCard report={report} /> : null}
        <TopCategoriesCard report={report} />
      </div>
    </>
  );
}

function StaffReports({ report, branch }: { report: ReportData; branch: ReportBranch }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI
          accent
          label="Total bookings"
          value={report.bookings.toLocaleString()}
          delta="Non-cancelled"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KPI
          label="Active rentals"
          value={report.activeRentals.toLocaleString()}
          delta="Ongoing in range"
          icon={<Car className="h-4 w-4" />}
        />
        <KPI
          label="Available vehicles"
          value={report.availableVehicles.toLocaleString()}
          delta={`of ${report.rentableFleet} rentable`}
          icon={<Car className="h-4 w-4" />}
        />
        <KPI
          label="Maintenance tasks"
          value={report.maintenanceTotal.toLocaleString()}
          delta={`${report.overdueMaintenance} overdue`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <BookingTrendCard report={report} />
        <UtilizationCard value={report.utilization} hint={branchLabel(branch)} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {branch === "both" ? (
          <BranchComparisonCard report={report} hideRevenue />
        ) : (
          <TopCategoriesCard report={report} />
        )}
        <MaintenanceWorkloadCard report={report} />
      </div>
    </>
  );
}

function RevenueTrendCard({ report }: { report: ReportData }) {
  const activeKeys = report.selectedBranches;

  return (
    <Card>
      <CardHeader title="Revenue trend" hint="Paid valid rentals in selected range" />
      <div className="h-72 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={report.revenueTrend}>
            <CartesianGrid stroke={goldGrid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
              axisLine={{ stroke: goldGrid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
              tickFormatter={compactPeso}
              axisLine={{ stroke: goldGrid }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => [
                typeof value === "number" ? peso(Math.round(value)) : value,
                branchLabel(name),
              ]}
              contentStyle={chartTooltipStyle}
            />
            {activeKeys.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={branchConfig[key].color}
                strokeWidth={2.5}
                dot={{ fill: branchConfig[key].color, r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function BookingTrendCard({ report }: { report: ReportData }) {
  return (
    <Card>
      <CardHeader title="Booking volume" hint="Non-cancelled bookings by branch" />
      <div className="h-72 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={report.bookingTrend} barCategoryGap={14}>
            <CartesianGrid stroke={goldGrid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
              axisLine={{ stroke: goldGrid }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
              axisLine={{ stroke: goldGrid }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => [value, branchLabel(name)]}
              contentStyle={chartTooltipStyle}
            />
            {report.selectedBranches.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                name={key}
                fill={branchConfig[key].color}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function UtilizationCard({ value, hint }: { value: number; hint: string }) {
  const percent = Math.round(value);

  return (
    <Card>
      <CardHeader title="Overall utilization" hint={hint} />
      <div className="grid h-72 place-items-center p-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%"
            outerRadius="100%"
            data={[{ name: "Utilization", value: percent, fill: "oklch(0.84 0.16 92)" }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: "oklch(0.28 0.025 260)" }}
              dataKey="value"
              cornerRadius={20}
            />
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 32, fontWeight: 600 }}
            >
              {percent}%
            </text>
            <text
              x="50%"
              y="60%"
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 11 }}
            >
              Active rental days
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function BranchComparisonCard({
  report,
  hideRevenue = false,
}: {
  report: ReportData;
  hideRevenue?: boolean;
}) {
  const rows = [
    hideRevenue
      ? null
      : {
          metric: "Revenue",
          taft: peso(Math.round(report.branchMetrics.taft.revenue)),
          antipolo: peso(Math.round(report.branchMetrics.antipolo.revenue)),
        },
    {
      metric: "Demand share",
      taft: formatPercent(report.branchMetrics.taft.demandShare),
      antipolo: formatPercent(report.branchMetrics.antipolo.demandShare),
    },
    {
      metric: "Utilization",
      taft: formatPercent(report.branchMetrics.taft.utilization),
      antipolo: formatPercent(report.branchMetrics.antipolo.utilization),
    },
    {
      metric: "Bookings",
      taft: report.branchMetrics.taft.bookings.toLocaleString(),
      antipolo: report.branchMetrics.antipolo.bookings.toLocaleString(),
    },
  ].filter(Boolean) as Array<{ metric: string; taft: string; antipolo: string }>;

  return (
    <Card>
      <CardHeader title="Branch comparison" hint="Side-by-side selected period performance" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <Th>Metric</Th>
              <Th>Taft, Manila</Th>
              <Th>Antipolo, Rizal</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} className="border-b border-border/60">
                <Td className="text-muted-foreground">{row.metric}</Td>
                <Td className="font-medium">{row.taft}</Td>
                <Td className="font-medium">{row.antipolo}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TopCategoriesCard({ report }: { report: ReportData }) {
  return (
    <Card>
      <CardHeader title="Top performing categories" hint="Utilization rate" />
      <div className="space-y-3 p-5">
        {report.categoryUtilization.length > 0 ? (
          report.categoryUtilization.map((item, index) => (
            <div key={item.category} className="flex items-center gap-4">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 font-display text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium">{item.category}</span>
                  <span className="text-muted-foreground">{formatPercent(item.utilization)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, item.utilization)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No rentable vehicles match this branch filter.
          </p>
        )}
      </div>
    </Card>
  );
}

function MaintenanceWorkloadCard({ report }: { report: ReportData }) {
  const rows = Object.entries(report.maintenanceCounts);

  return (
    <Card>
      <CardHeader title="Maintenance workload" hint="Due in selected range" />
      <div className="space-y-3 p-5 text-sm">
        {rows.length > 0 ? (
          rows.map(([status, count]) => (
            <div
              key={status}
              className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2"
            >
              <span className="text-muted-foreground">{status}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No maintenance tasks due in this range.</p>
        )}
      </div>
    </Card>
  );
}

function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

type ReportData = {
  selectedBranches: BranchKey[];
  periodLabel: string;
  revenue: number;
  revenueBookings: number;
  bookings: number;
  avgTicket: number;
  utilization: number;
  activeRentals: number;
  availableVehicles: number;
  rentableFleet: number;
  maintenanceTotal: number;
  overdueMaintenance: number;
  maintenanceCounts: Record<string, number>;
  revenueTrend: TrendRow[];
  bookingTrend: TrendRow[];
  categoryUtilization: Array<{ category: string; utilization: number }>;
  branchMetrics: Record<BranchKey, BranchMetrics>;
};

type TrendRow = {
  label: string;
  taft: number;
  antipolo: number;
};

type BranchMetrics = {
  bookings: number;
  demandShare: number;
  revenue: number;
  revenueBookings: number;
  utilization: number;
  activeRentals: number;
  availableVehicles: number;
  rentableFleet: number;
};

type BookingWithOverlap = {
  branch: BranchKey;
  plate: string;
  status: string;
  payment: string;
  amount: number;
  start: number;
  end: number;
  totalDays: number;
  overlapDays: number;
};

function buildReport(range: DateRange, selectedBranches: BranchKey[]): ReportData {
  const rangeStart = dateValueToUtc(range.from);
  const rangeEnd = dateValueToUtc(range.to) + DAY_MS;
  const rangeDays = Math.max(1, Math.round((rangeEnd - rangeStart) / DAY_MS));
  const selectedSet = new Set(selectedBranches);
  const selectedBookings = getOverlappingBookings(rangeStart, rangeEnd).filter((booking) =>
    selectedSet.has(booking.branch),
  );
  const nonCancelledBookings = selectedBookings.filter((booking) => booking.status !== "Cancelled");
  const paidValidBookings = nonCancelledBookings.filter((booking) => booking.payment === "Paid");
  const utilizationBookings = nonCancelledBookings.filter((booking) =>
    utilizationStatuses.has(booking.status),
  );
  const selectedFleet = fleet.filter((vehicle) => {
    const key = branchKeyForName(vehicle.branch);
    return key ? selectedSet.has(key) : false;
  });
  const rentableFleet = selectedFleet.filter((vehicle) => vehicle.status !== "Inactive");
  const fleetByPlate = new Map(fleet.map((vehicle) => [vehicle.plate, vehicle]));
  const usedDays = utilizationBookings.reduce((sum, booking) => {
    const vehicle = fleetByPlate.get(booking.plate);
    if (!vehicle || vehicle.status === "Inactive") return sum;
    return sum + booking.overlapDays;
  }, 0);
  const capacityDays = rentableFleet.length * rangeDays;
  const revenue = paidValidBookings.reduce(
    (sum, booking) => sum + booking.amount * (booking.overlapDays / booking.totalDays),
    0,
  );
  const maintenanceRows = maintenance.filter((item) => {
    const key = branchKeyForName(item.branch);
    const due = dateValueToUtc(item.due);
    return key ? selectedSet.has(key) && due >= rangeStart && due < rangeEnd : false;
  });
  const maintenanceCounts = maintenanceRows.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});
  const branchMetrics = buildBranchMetrics(rangeStart, rangeEnd, rangeDays);

  return {
    selectedBranches,
    periodLabel: formatDateRange(range),
    revenue,
    revenueBookings: paidValidBookings.length,
    bookings: nonCancelledBookings.length,
    avgTicket: paidValidBookings.length ? revenue / paidValidBookings.length : 0,
    utilization: percent(usedDays, capacityDays),
    activeRentals: nonCancelledBookings.filter((booking) => booking.status === "Ongoing").length,
    availableVehicles: selectedFleet.filter((vehicle) => vehicle.status === "Available").length,
    rentableFleet: rentableFleet.length,
    maintenanceTotal: maintenanceRows.length,
    overdueMaintenance: maintenanceCounts.Overdue ?? 0,
    maintenanceCounts,
    revenueTrend: buildRevenueTrend(rangeStart, rangeEnd, selectedBranches),
    bookingTrend: buildBookingTrend(rangeStart, rangeEnd, selectedBranches),
    categoryUtilization: buildCategoryUtilization(
      rangeDays,
      selectedFleet,
      utilizationBookings,
      fleetByPlate,
    ),
    branchMetrics,
  };
}

function buildBranchMetrics(
  rangeStart: number,
  rangeEnd: number,
  rangeDays: number,
): Record<BranchKey, BranchMetrics> {
  const allBookings = getOverlappingBookings(rangeStart, rangeEnd).filter(
    (booking) => booking.status !== "Cancelled",
  );
  const demandTotal = allBookings.length;

  return (["taft", "antipolo"] as BranchKey[]).reduce(
    (acc, key) => {
      const branchBookings = allBookings.filter((booking) => booking.branch === key);
      const paidValidBookings = branchBookings.filter((booking) => booking.payment === "Paid");
      const branchFleet = fleet.filter((vehicle) => vehicle.branch === branchConfig[key].label);
      const rentableFleet = branchFleet.filter((vehicle) => vehicle.status !== "Inactive");
      const fleetByPlate = new Map(fleet.map((vehicle) => [vehicle.plate, vehicle]));
      const usedDays = branchBookings
        .filter((booking) => utilizationStatuses.has(booking.status))
        .reduce((sum, booking) => {
          const vehicle = fleetByPlate.get(booking.plate);
          if (!vehicle || vehicle.status === "Inactive") return sum;
          return sum + booking.overlapDays;
        }, 0);
      const revenue = paidValidBookings.reduce(
        (sum, booking) => sum + booking.amount * (booking.overlapDays / booking.totalDays),
        0,
      );

      acc[key] = {
        bookings: branchBookings.length,
        demandShare: demandTotal ? (branchBookings.length / demandTotal) * 100 : 0,
        revenue,
        revenueBookings: paidValidBookings.length,
        utilization: percent(usedDays, rentableFleet.length * rangeDays),
        activeRentals: branchBookings.filter((booking) => booking.status === "Ongoing").length,
        availableVehicles: branchFleet.filter((vehicle) => vehicle.status === "Available").length,
        rentableFleet: rentableFleet.length,
      };

      return acc;
    },
    {} as Record<BranchKey, BranchMetrics>,
  );
}

function buildRevenueTrend(
  rangeStart: number,
  rangeEnd: number,
  selectedBranches: BranchKey[],
): TrendRow[] {
  const selectedSet = new Set(selectedBranches);
  const rows = buildMonthlyBuckets(rangeStart, rangeEnd);
  const paidValidBookings = getOverlappingBookings(rangeStart, rangeEnd).filter(
    (booking) =>
      selectedSet.has(booking.branch) &&
      booking.status !== "Cancelled" &&
      booking.payment === "Paid",
  );

  rows.forEach((row) => {
    const bucketStart = rowStart(row);
    const bucketEnd = rowEnd(row);

    paidValidBookings.forEach((booking) => {
      const overlapDays = overlapDayCount(booking.start, booking.end, bucketStart, bucketEnd);
      if (!overlapDays) return;
      row[booking.branch] += booking.amount * (overlapDays / booking.totalDays);
    });
  });

  return rows.map(({ start: _start, end: _end, ...row }) => ({
    label: row.label,
    taft: Math.round(row.taft),
    antipolo: Math.round(row.antipolo),
  }));
}

function buildBookingTrend(
  rangeStart: number,
  rangeEnd: number,
  selectedBranches: BranchKey[],
): TrendRow[] {
  const selectedSet = new Set(selectedBranches);
  const rows = buildMonthlyBuckets(rangeStart, rangeEnd);
  const demandBookings = getOverlappingBookings(rangeStart, rangeEnd).filter(
    (booking) => selectedSet.has(booking.branch) && booking.status !== "Cancelled",
  );

  rows.forEach((row) => {
    const bucketStart = rowStart(row);
    const bucketEnd = rowEnd(row);

    demandBookings.forEach((booking) => {
      if (overlapDayCount(booking.start, booking.end, bucketStart, bucketEnd))
        row[booking.branch] += 1;
    });
  });

  return rows.map(({ start: _start, end: _end, ...row }) => row);
}

function buildCategoryUtilization(
  rangeDays: number,
  selectedFleet: typeof fleet,
  utilizationBookings: BookingWithOverlap[],
  fleetByPlate: Map<string, (typeof fleet)[number]>,
) {
  const capacityByCategory = selectedFleet.reduce<Record<string, number>>((acc, vehicle) => {
    if (vehicle.status === "Inactive") return acc;
    acc[vehicle.category] = (acc[vehicle.category] ?? 0) + rangeDays;
    return acc;
  }, {});
  const usedByCategory = utilizationBookings.reduce<Record<string, number>>((acc, booking) => {
    const vehicle = fleetByPlate.get(booking.plate);
    if (!vehicle || vehicle.status === "Inactive") return acc;
    acc[vehicle.category] = (acc[vehicle.category] ?? 0) + booking.overlapDays;
    return acc;
  }, {});

  return Object.entries(capacityByCategory)
    .map(([category, capacity]) => ({
      category,
      utilization: percent(usedByCategory[category] ?? 0, capacity),
    }))
    .sort((a, b) => b.utilization - a.utilization);
}

function getOverlappingBookings(rangeStart: number, rangeEnd: number): BookingWithOverlap[] {
  return bookings
    .map((booking) => {
      const branch = branchKeyForName(booking.branch);
      if (!branch) return null;

      const start = dateValueToUtc(booking.from);
      const rawEnd = dateValueToUtc(booking.to);
      const end = rawEnd > start ? rawEnd : start + DAY_MS;
      const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
      const overlapDays = overlapDayCount(start, end, rangeStart, rangeEnd);

      if (!overlapDays) return null;

      return {
        branch,
        plate: booking.plate,
        status: booking.status,
        payment: booking.payment,
        amount: booking.amount,
        start,
        end,
        totalDays,
        overlapDays,
      };
    })
    .filter((booking): booking is BookingWithOverlap => Boolean(booking));
}

type BucketRow = TrendRow & {
  start: number;
  end: number;
};

function buildMonthlyBuckets(rangeStart: number, rangeEnd: number): BucketRow[] {
  const startDate = new Date(rangeStart);
  let cursor = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1);
  const rows: BucketRow[] = [];

  while (cursor < rangeEnd) {
    const cursorDate = new Date(cursor);
    const next = Date.UTC(cursorDate.getUTCFullYear(), cursorDate.getUTCMonth() + 1, 1);
    rows.push({
      label: formatMonth(cursor),
      start: Math.max(cursor, rangeStart),
      end: Math.min(next, rangeEnd),
      taft: 0,
      antipolo: 0,
    });
    cursor = next;
  }

  return rows;
}

function rowStart(row: BucketRow) {
  return row.start;
}

function rowEnd(row: BucketRow) {
  return row.end;
}

function overlapDayCount(start: number, end: number, rangeStart: number, rangeEnd: number) {
  const overlapStart = Math.max(start, rangeStart);
  const overlapEnd = Math.min(end, rangeEnd);
  return Math.max(0, Math.round((overlapEnd - overlapStart) / DAY_MS));
}

function normalizeRange(from: string | undefined, to: string | undefined): DateRange {
  const fallback = getYtdRange();

  if (!isDateValue(from) || !isDateValue(to)) return fallback;
  if (dateValueToUtc(from) > dateValueToUtc(to)) return fallback;

  return { from, to };
}

function getYtdRange(): DateRange {
  const today = new Date();
  const year = today.getFullYear();

  return {
    from: `${year}-01-01`,
    to: inputDateFromDate(today),
  };
}

function inputDateFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateValue(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isReportBranch(value: unknown): value is ReportBranch {
  return typeof value === "string" && branchOptions.some((option) => option.value === value);
}

function dateValueToUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function branchKeyForName(value: string): BranchKey | null {
  if (value === branchConfig.taft.label) return "taft";
  if (value === branchConfig.antipolo.label) return "antipolo";
  return null;
}

function branchLabel(value: unknown) {
  if (value === "taft") return branchConfig.taft.label;
  if (value === "antipolo") return branchConfig.antipolo.label;
  return "Both branches";
}

function formatDateRange(range: DateRange) {
  return `${formatDate(range.from)} to ${formatDate(range.to)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateValueToUtc(value)));
}

function formatMonth(value: number) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function compactPeso(value: number) {
  return `PHP ${new Intl.NumberFormat("en-PH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

const chartTooltipStyle = {
  background: "oklch(0.23 0.03 260)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
};

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-semibold ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
