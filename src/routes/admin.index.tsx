import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarRange,
  Car,
  CheckCircle2,
  CreditCard,
  Wallet,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Activity as ActivityIcon,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Badge, Card, CardHeader, KPI, PageHeader } from "@/components/admin/ui";
import {
  activity,
  alerts,
  bookingVolume,
  branchDemand,
  fleetUtilization,
  kpis,
  peso,
  revenueTrend,
  bookings,
} from "@/data/admin";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/")({
  component: DashboardOverview,
});

const goldGrid = "rgba(255,255,255,0.06)";

function DashboardOverview() {
  const session = getAdminSession();
  const staffView = isStaffRole(session?.role);

  return (
    <div>
      <PageHeader
        title={staffView ? "Staff operations dashboard" : "Operations overview"}
        subtitle={
          staffView
            ? "Operational view for reservations, fleet, and customer coordination."
            : "Live snapshot across Taft and Antipolo branches."
        }
        actions={
          <>
            <span className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Systems healthy
            </span>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <ArrowUpRight className="h-4 w-4" /> Export report
            </button>
          </>
        }
      />

      <div
        className={`grid grid-cols-2 gap-4 lg:grid-cols-3 ${staffView ? "xl:grid-cols-4" : "xl:grid-cols-6"}`}
      >
        <KPI
          label="Total bookings"
          value={kpis.totalBookings.toLocaleString()}
          delta="+8.4% MoM"
          icon={<CalendarRange className="h-4 w-4" />}
          accent
        />
        <KPI
          label="Active rentals"
          value={String(kpis.activeRentals)}
          delta="+3 today"
          icon={<Car className="h-4 w-4" />}
        />
        <KPI
          label="Available vehicles"
          value={String(kpis.availableVehicles)}
          delta="of 56 fleet"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        {!staffView ? (
          <KPI
            label="Monthly revenue"
            value={peso(kpis.monthlyRevenue)}
            delta="+12.1% MoM"
            icon={<Wallet className="h-4 w-4" />}
          />
        ) : null}
        {!staffView ? (
          <KPI
            label="Pending payments"
            value={peso(kpis.pendingPayments)}
            delta="6 invoices"
            icon={<CreditCard className="h-4 w-4" />}
          />
        ) : null}
        <KPI
          label="In maintenance"
          value={String(kpis.maintenance)}
          delta="1 overdue"
          icon={<Wrench className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        {!staffView ? (
          <Card>
            <CardHeader
              title="Revenue trend"
              hint="Last 12 months - PHP thousands"
              right={
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  <TrendingUp className="h-3.5 w-3.5" /> +18.6% YoY
                </span>
              }
            />
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.84 0.16 92)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.84 0.16 92)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={goldGrid} vertical={false} />
                  <XAxis
                    dataKey="m"
                    tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
                    axisLine={{ stroke: goldGrid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
                    axisLine={{ stroke: goldGrid }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.23 0.03 260)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="oklch(0.84 0.16 92)"
                    strokeWidth={2}
                    fill="url(#gold)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Booking trend" hint="By branch - last 7 days" />
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingVolume} barCategoryGap={14}>
                  <CartesianGrid stroke={goldGrid} vertical={false} />
                  <XAxis
                    dataKey="d"
                    tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
                    axisLine={{ stroke: goldGrid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
                    axisLine={{ stroke: goldGrid }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.23 0.03 260)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="taft" stackId="a" fill="oklch(0.84 0.16 92)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="antipolo" stackId="a" fill="oklch(0.55 0.05 260)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Branch demand" hint="Bookings share this month" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={branchDemand} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  <Cell fill="oklch(0.84 0.16 92)" />
                  <Cell fill="oklch(0.45 0.05 260)" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.23 0.03 260)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "oklch(0.72 0.015 250)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="Booking volume" hint="By branch - last 7 days" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingVolume} barCategoryGap={14}>
                <CartesianGrid stroke={goldGrid} vertical={false} />
                <XAxis
                  dataKey="d"
                  tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
                  axisLine={{ stroke: goldGrid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 11 }}
                  axisLine={{ stroke: goldGrid }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.23 0.03 260)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="taft" stackId="a" fill="oklch(0.84 0.16 92)" radius={[0, 0, 0, 0]} />
                <Bar
                  dataKey="antipolo"
                  stackId="a"
                  fill="oklch(0.55 0.05 260)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Fleet utilization" hint="% of available time rented" />
          <div className="space-y-3 p-5">
            {fleetUtilization.map((fleetUtilizationItem) => (
              <div key={fleetUtilizationItem.cat}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{fleetUtilizationItem.cat}</span>
                  <span className="text-muted-foreground">{fleetUtilizationItem.util}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                    style={{ width: `${fleetUtilizationItem.util}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Operational alerts" right={<Bell className="h-4 w-4 text-primary" />} />
          <ul className="divide-y divide-border">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className={`mt-0.5 grid h-7 w-7 place-items-center rounded-md ${
                    alert.kind === "danger"
                      ? "bg-rose-500/15 text-rose-400"
                      : alert.kind === "warning"
                        ? "bg-amber-500/15 text-amber-400"
                        : alert.kind === "success"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-sky-500/15 text-sky-400"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{alert.title}</div>
                  <div className="text-xs text-muted-foreground">{alert.meta}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Recent activity" right={<ActivityIcon className="h-4 w-4 text-primary" />} />
          <ul className="divide-y divide-border">
            {activity.map((activityItem) => (
              <li key={activityItem.id} className="flex items-start gap-3 px-5 py-3.5 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <span className="font-medium">{activityItem.who}</span>{" "}
                  <span className="text-muted-foreground">{activityItem.what}</span>
                  <div className="text-xs text-muted-foreground">{activityItem.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Latest bookings" />
          <div className="divide-y divide-border">
            {bookings.slice(0, 6).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{booking.customer}</div>
                  <div className="text-xs text-muted-foreground">
                    {booking.id} - {booking.vehicle}
                  </div>
                </div>
                <Badge>{booking.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
