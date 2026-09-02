import { createFileRoute } from "@tanstack/react-router";
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
} from "recharts";
import { Card, CardHeader, PageHeader, Badge, Btn } from "@/components/admin/ui";
import { AlertTriangle } from "lucide-react";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import { OperationalContextPanel, type OperationalContextView } from "@/components/admin/operational-context-panel";

export const Route = createFileRoute("/admin/decisions")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) return;
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

function DecisionPage() {
  const session = getAdminSession();
  const staffView = isStaffRole(session?.role);
  const [allocationRows, setAllocationRows] = useState<any[]>([]);
  const [allocationError, setAllocationError] = useState("");
  const [allocationBusy, setAllocationBusy] = useState(false);
  const [contextRecommendationId, setContextRecommendationId] = useState("");
  const [allocationContext, setAllocationContext] = useState<(OperationalContextView & { recommendation?: { recommendedTransferUnits: number; candidates: Array<{ vehicleId: string; candidateRank: number; referenceEfficiencyKmPerLiter: number | null; estimatedFuelLiters: number | null }> } }) | null>(null);
  const [allocationContextLoading, setAllocationContextLoading] = useState(false);
  const [allocationContextError, setAllocationContextError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/allocation-recommendations", { credentials: "same-origin" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Unable to load recommendations."); return body; })
      .then((body) => { if (active) { const rows = body.recommendations ?? []; setAllocationRows(rows); setContextRecommendationId((current) => current && rows.some((row: any) => row.id === current) ? current : (rows[0]?.id ?? "")); setAllocationError(""); } })
      .catch((error) => { if (active) setAllocationError(error instanceof Error ? error.message : "Unable to load recommendations."); });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (staffView || !contextRecommendationId) { setAllocationContext(null); setAllocationContextError(""); setAllocationContextLoading(false); return; }
    const controller = new AbortController();
    setAllocationContextLoading(true); setAllocationContextError("");
    fetch("/api/operational-context", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "allocation_review", recommendationId: contextRecommendationId }), signal: controller.signal })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Operational context could not be loaded."); return body; })
      .then((body) => { setAllocationContext(body); setAllocationContextLoading(false); })
      .catch((error) => { if (error instanceof DOMException && error.name === "AbortError") return; setAllocationContext(null); setAllocationContextError("Operational context could not be verified."); setAllocationContextLoading(false); });
    return () => controller.abort();
  }, [contextRecommendationId, staffView]);

  async function generateAllocations() {
    setAllocationBusy(true);
    try {
      const response = await fetch("/api/allocation-recommendations", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Unable to generate recommendations.");
      setAllocationRows(body.recommendations ?? []); setAllocationError("");
    } catch (error) { setAllocationError(error instanceof Error ? error.message : "Unable to generate recommendations."); }
    finally { setAllocationBusy(false); }
  }

  async function decideAllocation(recommendationId: string, state: "Approved" | "Rejected", approvedTransferUnits?: number) {
    setAllocationBusy(true);
    try {
      const response = await fetch("/api/allocation-recommendations", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ recommendationId, state, approvedTransferUnits }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Unable to record decision.");
      setAllocationRows((rows) => rows.map((row) => row.id === recommendationId ? { ...row, ...body.recommendation } : row)); setAllocationError("");
    } catch (error) { setAllocationError(error instanceof Error ? error.message : "Unable to record decision."); }
    finally { setAllocationBusy(false); }
  }

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

        {!staffView ? <OperationalContextPanel title="Current route context for transfer review" context={allocationContext} loading={allocationContextLoading} error={allocationContextError} advisoryNote="Current operational context — not part of the original allocation score/snapshot. Select a recommendation to review its source-to-destination route." /> : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Branch allocation recommendations" hint="Canonical VS015 shortage/surplus · advisory only" right={!staffView ? <Btn variant="primary" disabled={allocationBusy} onClick={generateAllocations}>{allocationBusy ? "Working…" : "Generate recommendations"}</Btn> : <Badge>Read only</Badge>} />
          {allocationError ? <p className="px-5 py-3 text-sm text-destructive">{allocationError}</p> : null}
          {!allocationRows.length && !allocationError ? <p className="px-5 py-6 text-sm text-muted-foreground">No persisted recommendations. Generate from the latest VS015 evaluations.</p> : null}
          <ul className="divide-y divide-border text-sm">{allocationRows.map((row) => <li key={row.id} className="space-y-3 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-medium">{row.destination_branch_name} ← {row.source_branch_name} · {row.vehicle_category_name}</div><div className="text-xs text-muted-foreground">Week {row.target_week_start} to {row.target_week_end} · Horizon {row.forecast_horizon}</div></div><Badge>{row.decision_state}</Badge></div>
            <div className="grid gap-2 text-xs sm:grid-cols-3"><span>Destination shortage: <strong>{row.destination_shortage_snapshot}</strong></span><span>Source surplus: <strong>{row.source_surplus_snapshot}</strong></span><span>Recommended: <strong>{row.recommended_transfer_units}</strong></span></div>
            <p className="text-xs text-muted-foreground">Required/supply: destination {row.destination_required_units_snapshot}/{row.destination_projected_supply_snapshot}; source {row.source_required_units_snapshot}/{row.source_projected_supply_snapshot}. Quantity is min(remaining shortage, remaining surplus, eligible candidates).</p>
            <p className="text-[11px] text-muted-foreground">VS015 evaluated: destination {row.destination_evaluated_at ? new Date(row.destination_evaluated_at).toLocaleString() : "unknown"}; source {row.source_evaluated_at ? new Date(row.source_evaluated_at).toLocaleString() : "unknown"}</p>
            <div className="space-y-1">{(row.candidates ?? []).map((candidate: any) => { const fuel = allocationContext?.recommendation && contextRecommendationId === row.id ? allocationContext.recommendation.candidates.find((item) => item.vehicleId === candidate.vehicle_id) : undefined; return <div key={candidate.id} className="flex justify-between gap-3 text-xs"><span>#{candidate.candidate_rank} {candidate.vehicle_name_snapshot} · {candidate.license_plate_snapshot ?? "No plate"}</span><span>{fuel ? `${fuel.referenceEfficiencyKmPerLiter == null ? "Efficiency unavailable" : `${fuel.referenceEfficiencyKmPerLiter.toFixed(1)} km/L`} · ${fuel.estimatedFuelLiters == null ? "Fuel unavailable" : `${fuel.estimatedFuelLiters.toFixed(1)} L`}` : (candidate.idle_days_snapshot == null ? "Idle unknown" : `${candidate.idle_days_snapshot}d idle`)}</span></div>; })}</div>
            {!staffView ? <Btn variant="ghost" disabled={allocationContextLoading && contextRecommendationId === row.id} onClick={() => setContextRecommendationId(row.id)}>{contextRecommendationId === row.id ? "Reviewing current context" : "Review current route context"}</Btn> : null}
            {!staffView && row.decision_state === "Pending" ? <div className="flex flex-wrap gap-2"><Btn disabled={allocationBusy} variant="primary" onClick={() => decideAllocation(row.id, "Approved", row.recommended_transfer_units)}>Approve full ({row.recommended_transfer_units})</Btn><Btn disabled={allocationBusy} variant="ghost" onClick={() => { const value = window.prompt(`Approve a positive quantity up to ${row.recommended_transfer_units}`, String(row.recommended_transfer_units)); const units = Number(value); if (Number.isInteger(units) && units > 0) void decideAllocation(row.id, "Approved", units); }}>Approve lower quantity</Btn><Btn disabled={allocationBusy} variant="danger" onClick={() => decideAllocation(row.id, "Rejected")}>Reject</Btn></div> : null}
          </li>)}</ul>
        </Card>

      </div>
    </div>
  );
}
