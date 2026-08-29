import { createFileRoute, redirect } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Card, CardHeader, PageHeader, Badge, Btn } from "@/components/admin/ui";
import {
  Brain,
  AlertTriangle,
  ArrowRight,
  CloudRain,
  Fuel,
  Route as RouteIcon,
} from "lucide-react";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  getBranchAllocationRecommendations,
  type BranchAllocationRecommendation,
} from "@/lib/branch-allocation-context";

export const Route = createFileRoute("/admin/decisions")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: DecisionPage,
});

const goldGrid = "rgba(255,255,255,0.06)";

const forecast = [
  { d: "W-3", taftActual: 16, taftForecast: 17, antipoloActual: 9, antipoloForecast: 10 },
  { d: "W-2", taftActual: 18, taftForecast: 18, antipoloActual: 11, antipoloForecast: 11 },
  { d: "W-1", taftActual: 20, taftForecast: 19, antipoloActual: 12, antipoloForecast: 12 },
  { d: "W0", taftActual: 21, taftForecast: 22, antipoloActual: 13, antipoloForecast: 13 },
  { d: "W+1", taftActual: null, taftForecast: 23, antipoloActual: null, antipoloForecast: 14 },
  { d: "W+2", taftActual: null, taftForecast: 25, antipoloActual: null, antipoloForecast: 15 },
  { d: "W+3", taftActual: null, taftForecast: 24, antipoloActual: null, antipoloForecast: 15 },
];

const idleVehicles = [
  { name: "Toyota Hilux", plate: "NDA 6610", idle: 18, branch: "Taft" },
  { name: "Honda City", plate: "NEB 5582", idle: 14, branch: "Taft" },
  { name: "Toyota Avanza", plate: "NCB 1182", idle: 9, branch: "Antipolo" },
];

const utilRows = [
  { name: "Toyota Hiace", plate: "NDF 8821", branch: "Taft, Manila", util: 91, trend: "+8%" },
  { name: "Nissan Urvan", plate: "NDB 4410", branch: "Antipolo, Rizal", util: 87, trend: "+4%" },
  { name: "Toyota Vios", plate: "NEA 1284", branch: "Antipolo, Rizal", util: 84, trend: "+2%" },
  { name: "Ford Everest", plate: "NCA 7710", branch: "Taft, Manila", util: 79, trend: "-1%" },
  { name: "Toyota Wigo", plate: "AAJ 2231", branch: "Taft, Manila", util: 72, trend: "+3%" },
];

const radar = [
  { dim: "Seats", v: 90 },
  { dim: "Fuel eff.", v: 65 },
  { dim: "Availability", v: 80 },
  { dim: "Distance fit", v: 88 },
  { dim: "Condition", v: 92 },
];

function DecisionPage() {
  const navigate = useNavigate();
  const [allocationRows, setAllocationRows] = useState<BranchAllocationRecommendation[]>([]);

  useEffect(() => {
    let active = true;
    void getBranchAllocationRecommendations()
      .then((rows) => {
        if (!active) return;
        setAllocationRows(rows);
      })
      .catch(() => {
        if (!active) return;
        setAllocationRows([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Decision support"
        subtitle="Operational intelligence for forecasting, allocation, and vehicle selection."
      />

      <Card className="mb-4">
        <CardHeader
          title="Demand forecasting"
          hint="Weighted moving average • next 3 weeks"
          right={<Badge>High confidence</Badge>}
        />
        <div className="h-72 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="dgold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.84 0.16 92)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.84 0.16 92)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dcyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.15 210)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="oklch(0.72 0.15 210)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="taftActual"
                name="Taft actual demand"
                stroke="oklch(0.94 0.1 92)"
                strokeWidth={2}
                fill="transparent"
              />
              <Area
                type="monotone"
                dataKey="taftForecast"
                name="Taft forecast demand"
                stroke="oklch(0.84 0.16 92)"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                fill="url(#dgold)"
              />
              <Area
                type="monotone"
                dataKey="antipoloActual"
                name="Antipolo actual demand"
                stroke="oklch(0.84 0.1 210)"
                strokeWidth={2}
                fill="transparent"
              />
              <Area
                type="monotone"
                dataKey="antipoloForecast"
                name="Antipolo forecast demand"
                strokeDasharray="4 4"
                stroke="oklch(0.72 0.15 210)"
                strokeWidth={2.5}
                fill="url(#dcyan)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Vehicle utilization" hint="Top performers (last 30 days)" />
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Plate</th>
                <th className="px-4 py-3 text-left">Branch</th>
                <th className="px-4 py-3 text-right">Utilization</th>
                <th className="px-4 py-3 text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {utilRows.map((r) => (
                <tr key={r.plate} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.plate}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.branch}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="ml-auto flex w-32 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full bg-primary" style={{ width: `${r.util}%` }} />
                      </div>
                      <span className="w-9 text-right text-xs">{r.util}%</span>
                    </div>
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-xs ${r.trend.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {r.trend}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader
            title="Idle vehicle detection"
            hint="Underused fleet to reactivate"
            right={<AlertTriangle className="h-4 w-4 text-amber-400" />}
          />
          <ul className="divide-y divide-border">
            {idleVehicles.map((v) => (
              <li key={v.plate} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.plate} • {v.branch}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-semibold text-amber-400">{v.idle}d</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    idle
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Branch demand analysis" />
          <div className="space-y-4 p-5">
            {[
              { name: "Taft, Manila", high: true, score: 78, bookings: 412, share: "62%" },
              { name: "Antipolo, Rizal", high: false, score: 62, bookings: 248, share: "38%" },
            ].map((b) => (
              <div key={b.name} className="rounded-lg border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.bookings} bookings • {b.share} share
                    </div>
                  </div>
                  <Badge>{b.high ? "High demand" : "Steady"}</Badge>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full ${b.high ? "bg-primary" : "bg-muted-foreground/60"}`}
                    style={{ width: `${b.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Vehicle recommendation"
            hint="For trip: 6 pax, Manila ? Baguio (250 km)"
            right={<Brain className="h-4 w-4 text-primary" />}
          />
          <div className="grid gap-4 p-5 md:grid-cols-[1fr_1.2fr]">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radar}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="dim"
                  tick={{ fill: "oklch(0.72 0.015 250)", fontSize: 10 }}
                />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  dataKey="v"
                  stroke="oklch(0.84 0.16 92)"
                  fill="oklch(0.84 0.16 92)"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Top match
              </div>
              <div className="mt-1 font-display text-xl font-semibold">Toyota Innova</div>
              <div className="text-xs text-muted-foreground">ABM 9921 • Taft, Manila</div>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <li>• 8 seats — fits 6 pax with luggage</li>
                <li>• Diesel, 12 km/L — efficient for 250 km</li>
                <li>• Available May 26 ? 30</li>
                <li>• Excellent condition (last service 2 wks)</li>
              </ul>
              <Btn variant="primary" className="mt-4">
                Recommend vehicle <ArrowRight className="h-4 w-4" />
              </Btn>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader
            title="Branch allocation recommendation"
            hint="Weather, road condition, and fuel-adjusted recommendations."
          />
          <ul className="divide-y divide-border text-sm">
            {allocationRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-medium">{row.unit}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.from} ? {row.to}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {row.reason} • score {row.urgencyScore}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-sky-300">
                        <CloudRain className="h-3 w-3" />
                        Weather +{row.breakdown.weather}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-violet-300">
                        <RouteIcon className="h-3 w-3" />
                        Road condition +{row.breakdown.traffic}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                        <Fuel className="h-3 w-3" />
                        Fuel {row.breakdown.fuel >= 0 ? "+" : ""}
                        {row.breakdown.fuel}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      Updated{" "}
                      {new Date(row.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      row.confidence === "High"
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                        : row.confidence === "Medium"
                          ? "border-orange-400/30 bg-orange-500/10 text-orange-300"
                          : "border-red-400/30 bg-red-500/10 text-red-300"
                    }
                  >
                    {row.confidence} confidence
                  </Badge>
                  <Btn
                    variant="primary"
                    className="h-6 rounded-full px-2.5 text-[11px] font-medium"
                    onClick={() => navigate({ to: "/admin/fleet" })}
                  >
                    Approve transfer
                  </Btn>
                </div>
              </li>
            ))}
            {allocationRows.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">
                No allocation recommendations available right now.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Context-aware insights"
            hint="Weather, road condition & fuel context"
          />
          <ul className="divide-y divide-border text-sm">
            <Insight
              icon={<CloudRain className="h-4 w-4" />}
              title="Typhoon advisory Signal 1 • Rizal"
              body="Recommend SUVs for Antipolo bookings May 27–29. Defer self-drive issuances to AT vehicles only."
            />
            <Insight
              icon={<RouteIcon className="h-4 w-4" />}
              title="NLEX road condition advisory"
              body="Reported lane repairs and rough patches near Valenzuela. Assign higher-clearance units and allow extra inspection time before Baguio trips."
            />
            <Insight
              icon={<Fuel className="h-4 w-4" />}
              title="Diesel rollback +?0.85/L"
              body="Adjust van pricing band by +?150/day to preserve margin starting June 1."
            />
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Insight({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex gap-3 px-5 py-4">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
        {icon}
      </span>
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</div>
      </div>
    </li>
  );
}
