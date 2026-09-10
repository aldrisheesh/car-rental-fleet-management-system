import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  PageHeader,
  Badge,
  Btn,
} from "@/components/admin/ui";
import {
  OperationalContextPanel,
  type OperationalContextView,
} from "@/components/admin/operational-context-panel";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  buildForecastChart,
  forecastLabel,
  selectLatestForecasts,
  selectLatestSupplyEvaluations,
  supplyBalanceState,
  type CanonicalForecast,
  type CanonicalForecastRun,
  type CanonicalSupplyEvaluation,
} from "@/lib/admin-decisions";
import { addDays, dayKey } from "@/lib/vehicle-analytics-intervals";

export const Route = createFileRoute("/admin/decisions")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) return;
  },
  component: DecisionPage,
});

const goldGrid = "rgba(255,255,255,0.06)";
const forecastColors = [
  "oklch(0.84 0.16 92)",
  "oklch(0.72 0.15 210)",
  "oklch(0.72 0.14 150)",
  "oklch(0.75 0.14 35)",
  "oklch(0.72 0.12 300)",
];

type ForecastResponse = {
  runs: CanonicalForecastRun[];
  forecasts: CanonicalForecast[];
  mape: number | null;
};

type VehicleAnalyticsRow = {
  vehicleId: string;
  name: string;
  licensePlate: string | null;
  branch: string | null;
  reportingStart: string;
  reportingEnd: string;
  coverage: "Complete" | "Partial/Insufficient Historical Eligibility Data";
  rentalDays: number;
  eligibleOperationalDays: number | null;
  utilizationPercent: number | null;
  idleDays: number | null;
  idleClassification: "Idle" | "Not Idle" | "Unable to Determine";
};

type SupplyResponse = { evaluations: CanonicalSupplyEvaluation[] };
type VehicleAnalyticsResponse = { vehicles: VehicleAnalyticsRow[] };
type AllocationCandidateRow = {
  id: string;
  vehicle_id: string;
  vehicle_name_snapshot: string;
  license_plate_snapshot: string | null;
  candidate_rank: number;
  idle_days_snapshot: number | null;
};
type AllocationRow = {
  id: string;
  destination_branch_name: string;
  source_branch_name: string;
  vehicle_category_name: string;
  target_week_start: string;
  target_week_end: string;
  forecast_horizon: number;
  decision_state: "Pending" | "Approved" | "Rejected";
  destination_shortage_snapshot: number;
  source_surplus_snapshot: number;
  recommended_transfer_units: number;
  destination_required_units_snapshot: number;
  destination_projected_supply_snapshot: number;
  source_required_units_snapshot: number;
  source_projected_supply_snapshot: number;
  destination_evaluated_at: string | null;
  source_evaluated_at: string | null;
  candidates: AllocationCandidateRow[];
};

async function readApi<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      body && typeof body.message === "string"
        ? body.message
        : "Unable to load canonical decision-support data.",
    );
  }
  return body as T;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatQuantity(value: number | string | null | undefined) {
  if (value == null || value === "") return "Unavailable";
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "Unavailable";
}

function formatPercent(value: number | null) {
  return value == null || !Number.isFinite(value)
    ? "Unavailable"
    : `${value.toFixed(1)}%`;
}

function formatDay(value: string | null | undefined) {
  if (!value) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Unavailable";
}

function DecisionPage() {
  const session = getAdminSession();
  const staffView = isStaffRole(session?.role);
  const analyticsRange = useMemo(() => {
    const end = dayKey(new Date());
    return { start: addDays(end, -29), end };
  }, []);

  const [forecastData, setForecastData] = useState<ForecastResponse | null>(
    null,
  );
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState("");
  const [forecastBusy, setForecastBusy] = useState(false);
  const [forecastNotice, setForecastNotice] = useState("");
  const [supplyEvaluations, setSupplyEvaluations] = useState<
    CanonicalSupplyEvaluation[]
  >([]);
  const [supplyLoading, setSupplyLoading] = useState(true);
  const [supplyError, setSupplyError] = useState("");
  const [supplyBusyForecastId, setSupplyBusyForecastId] = useState("");
  const [vehicleAnalytics, setVehicleAnalytics] = useState<
    VehicleAnalyticsRow[]
  >([]);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleError, setVehicleError] = useState("");
  const [supportVersion, setSupportVersion] = useState(0);
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>([]);
  const [allocationError, setAllocationError] = useState("");
  const [allocationBusy, setAllocationBusy] = useState(false);
  const [contextRecommendationId, setContextRecommendationId] = useState("");
  const [allocationContext, setAllocationContext] = useState<
    | (OperationalContextView & {
        recommendation?: {
          recommendedTransferUnits: number;
          candidates: Array<{
            vehicleId: string;
            candidateRank: number;
            referenceEfficiencyKmPerLiter: number | null;
            estimatedFuelLiters: number | null;
          }>;
        };
      })
    | null
  >(null);
  const [allocationContextLoading, setAllocationContextLoading] =
    useState(false);
  const [allocationContextError, setAllocationContextError] = useState("");
  const [allocationContextVersion, setAllocationContextVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setForecastLoading(true);
    setSupplyLoading(true);
    setVehicleLoading(true);
    setForecastError("");
    setSupplyError("");
    setVehicleError("");

    Promise.allSettled([
      readApi<ForecastResponse>("/api/forecasts", {
        signal: controller.signal,
      }),
      readApi<SupplyResponse>("/api/supply-evaluations", {
        signal: controller.signal,
      }),
      readApi<VehicleAnalyticsResponse>(
        `/api/vehicle-analytics?start=${analyticsRange.start}&end=${analyticsRange.end}`,
        { signal: controller.signal },
      ),
    ]).then(([forecastResult, supplyResult, vehicleResult]) => {
      if (controller.signal.aborted) return;
      if (forecastResult.status === "fulfilled") {
        setForecastData(forecastResult.value);
      } else {
        setForecastData(null);
        setForecastError(
          errorMessage(
            forecastResult.reason,
            "Unable to load canonical forecasts.",
          ),
        );
      }
      if (supplyResult.status === "fulfilled") {
        setSupplyEvaluations(supplyResult.value.evaluations ?? []);
      } else {
        setSupplyEvaluations([]);
        setSupplyError(
          errorMessage(
            supplyResult.reason,
            "Unable to load canonical supply evaluations.",
          ),
        );
      }
      if (vehicleResult.status === "fulfilled") {
        setVehicleAnalytics(vehicleResult.value.vehicles ?? []);
      } else {
        setVehicleAnalytics([]);
        setVehicleError(
          errorMessage(
            vehicleResult.reason,
            "Unable to load canonical vehicle analytics.",
          ),
        );
      }
      setForecastLoading(false);
      setSupplyLoading(false);
      setVehicleLoading(false);
    });

    return () => controller.abort();
  }, [analyticsRange.end, analyticsRange.start, supportVersion]);

  useEffect(() => {
    let active = true;
    readApi<{ recommendations?: AllocationRow[] }>(
      "/api/allocation-recommendations",
    )
      .then((body) => {
        if (!active) return;
        const rows = body.recommendations ?? [];
        setAllocationRows(rows);
        setContextRecommendationId((current) =>
          current && rows.some((row) => row.id === current)
            ? current
            : (rows[0]?.id ?? ""),
        );
        setAllocationError("");
      })
      .catch((error) => {
        if (active)
          setAllocationError(
            errorMessage(error, "Unable to load recommendations."),
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (staffView || !contextRecommendationId) {
      setAllocationContext(null);
      setAllocationContextError("");
      setAllocationContextLoading(false);
      return;
    }
    const controller = new AbortController();
    setAllocationContextLoading(true);
    setAllocationContextError("");
    readApi<typeof allocationContext>("/api/operational-context", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "allocation_review",
        recommendationId: contextRecommendationId,
      }),
      signal: controller.signal,
    })
      .then((body) => {
        setAllocationContext(body);
        setAllocationContextLoading(false);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setAllocationContext(null);
        setAllocationContextError("Operational context could not be verified.");
        setAllocationContextLoading(false);
      });
    return () => controller.abort();
  }, [contextRecommendationId, staffView, allocationContextVersion]);

  async function generateForecast() {
    setForecastBusy(true);
    setForecastError("");
    setForecastNotice("");
    try {
      const body = await readApi<{ insufficientPairs?: unknown[] }>(
        "/api/forecasts",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
        },
      );
      const insufficientCount = body.insufficientPairs?.length ?? 0;
      setForecastNotice(
        insufficientCount
          ? `Canonical WMA generation found insufficient demand history for ${insufficientCount} configured branch/category pair${insufficientCount === 1 ? "" : "s"}.`
          : "Canonical WMA forecast generated.",
      );
      setSupportVersion((version) => version + 1);
    } catch (error) {
      setForecastError(
        errorMessage(error, "Unable to generate the canonical forecast."),
      );
    } finally {
      setForecastBusy(false);
    }
  }

  async function evaluateSupply(forecastId: string) {
    setSupplyBusyForecastId(forecastId);
    setSupplyError("");
    try {
      await readApi("/api/supply-evaluations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          forecastId,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setSupportVersion((version) => version + 1);
    } catch (error) {
      setSupplyError(
        errorMessage(error, "Unable to evaluate canonical supply."),
      );
    } finally {
      setSupplyBusyForecastId("");
    }
  }

  async function generateAllocations() {
    setAllocationBusy(true);
    try {
      const body = await readApi<{ recommendations?: AllocationRow[] }>(
        "/api/allocation-recommendations",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
        },
      );
      const rows = body.recommendations ?? [];
      setAllocationRows(rows);
      setContextRecommendationId(rows[0]?.id ?? "");
      setAllocationContext(null);
      setAllocationContextError("");
      setAllocationContextLoading(false);
      setAllocationContextVersion((version) => version + 1);
      setAllocationError("");
    } catch (error) {
      setAllocationError(
        errorMessage(error, "Unable to generate recommendations."),
      );
    } finally {
      setAllocationBusy(false);
    }
  }

  async function decideAllocation(
    recommendationId: string,
    state: "Approved" | "Rejected",
    approvedTransferUnits?: number,
  ) {
    setAllocationBusy(true);
    try {
      const body = await readApi<{ recommendation?: AllocationRow }>(
        "/api/allocation-recommendations",
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            recommendationId,
            state,
            approvedTransferUnits,
          }),
        },
      );
      setAllocationRows((rows) =>
        rows.map((row) =>
          row.id === recommendationId
            ? { ...row, ...body.recommendation }
            : row,
        ),
      );
      setAllocationError("");
    } catch (error) {
      setAllocationError(errorMessage(error, "Unable to record decision."));
    } finally {
      setAllocationBusy(false);
    }
  }

  const forecastRows = selectLatestForecasts(
    forecastData?.runs ?? [],
    forecastData?.forecasts ?? [],
  );
  const forecastChart = buildForecastChart(forecastRows);
  const forecastById = new Map(
    (forecastData?.forecasts ?? []).map((forecast) => [forecast.id, forecast]),
  );
  const supplyRows = selectLatestSupplyEvaluations(supplyEvaluations);
  const evaluatedForecastIds = new Set(
    supplyRows.map((evaluation) => evaluation.forecast_id),
  );
  const unevaluatedForecasts = forecastRows.filter(
    (forecast) => !evaluatedForecastIds.has(forecast.id),
  );
  const utilizationRows = [...vehicleAnalytics].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const idleRows = utilizationRows.filter(
    (row) => row.idleClassification === "Idle",
  );
  const allIdleUnavailable =
    utilizationRows.length > 0 &&
    utilizationRows.every(
      (row) => row.idleClassification === "Unable to Determine",
    );
  const latestRun = [...(forecastData?.runs ?? [])]
    .sort(
      (left, right) =>
        Date.parse(right.generated_at) - Date.parse(left.generated_at),
    )
    .find((run) => forecastRows.some((forecast) => forecast.run_id === run.id));

  return (
    <div>
      <PageHeader
        title="Decision support"
        subtitle="Canonical WMA forecasts, projected supply, allocation recommendations, and vehicle analysis."
      />

      <Card className="mb-4">
        <CardHeader
          title="Demand forecasting"
          hint="Persisted WMA output · next 3 weeks"
          right={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge>
                {forecastRows.length ? "Canonical WMA" : "Unavailable"}
              </Badge>
              {!staffView ? (
                <Btn
                  variant="primary"
                  disabled={forecastBusy}
                  onClick={() => void generateForecast()}
                >
                  {forecastBusy ? "Generating…" : "Generate WMA forecast"}
                </Btn>
              ) : (
                <Badge>Read only</Badge>
              )}
            </div>
          }
        />
        {forecastNotice ? (
          <p className="px-5 pt-4 text-sm text-muted-foreground">
            {forecastNotice}
          </p>
        ) : null}
        {forecastLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Loading canonical forecasts…
          </p>
        ) : forecastError ? (
          <p className="p-6 text-sm text-destructive" role="alert">
            {forecastError}
          </p>
        ) : !forecastRows.length ? (
          <p className="p-6 text-sm text-muted-foreground">
            No canonical forecast values are available in the latest WMA run.
            Sufficient covered demand history is required before forecast values
            can be persisted.
          </p>
        ) : (
          <>
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecastChart.data}
                  margin={{ left: 4, right: 12 }}
                >
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
                    allowDecimals={false}
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
                  {forecastChart.series.map((series, index) => (
                    <Area
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      name={series.name}
                      stroke={forecastColors[index % forecastColors.length]}
                      strokeWidth={2.5}
                      fill="transparent"
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left">Branch · category</th>
                    <th className="px-5 py-3 text-left">Target week</th>
                    <th className="px-5 py-3 text-right">Forecast demand</th>
                    <th className="px-5 py-3 text-right">Required vehicles</th>
                    <th className="px-5 py-3 text-right">Actual demand</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastRows.map((forecast) => (
                    <tr key={forecast.id} className="border-b border-border/60">
                      <td className="px-5 py-3 font-medium">
                        {forecastLabel(forecast)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDay(forecast.target_week_start)} –{" "}
                        {formatDay(forecast.target_week_end)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {formatQuantity(forecast.forecasted_demand)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {formatQuantity(forecast.required_vehicle_units)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {forecast.actual_demand == null
                          ? "Not finalized"
                          : formatQuantity(forecast.actual_demand)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11px] text-muted-foreground">
              Latest persisted run:{" "}
              {latestRun
                ? formatDateTime(latestRun.generated_at)
                : "Unavailable"}{" "}
              · values are read from canonical forecast records.
            </p>
          </>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Vehicle utilization"
            hint={`Canonical analysis · ${analyticsRange.start} to ${analyticsRange.end}`}
          />
          {vehicleLoading ? (
            <p className="p-6 text-sm text-muted-foreground">
              Loading canonical vehicle analysis…
            </p>
          ) : vehicleError ? (
            <p className="p-6 text-sm text-destructive" role="alert">
              {vehicleError}
            </p>
          ) : !utilizationRows.length ? (
            <p className="p-6 text-sm text-muted-foreground">
              No canonical vehicle analysis is available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left">Vehicle</th>
                    <th className="px-4 py-3 text-left">Plate</th>
                    <th className="px-4 py-3 text-left">Branch</th>
                    <th className="px-4 py-3 text-right">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {utilizationRows.map((row) => (
                    <tr
                      key={row.vehicleId}
                      className="border-b border-border/60"
                    >
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.licensePlate ?? "No plate"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.branch ?? "Unknown / unassigned"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.utilizationPercent == null ? (
                          <span>
                            Unavailable
                            <div className="text-xs text-muted-foreground">
                              Insufficient historical eligibility data
                            </div>
                          </span>
                        ) : (
                          <div className="ml-auto flex w-32 items-center justify-end gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${Math.min(100, Math.max(0, row.utilizationPercent))}%`,
                                }}
                              />
                            </div>
                            <span className="w-12 text-right text-xs">
                              {formatPercent(row.utilizationPercent)}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Idle vehicle detection"
            hint="Canonical VS013 idle classification"
            right={
              idleRows.length ? (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              ) : null
            }
          />
          {vehicleLoading ? (
            <p className="p-6 text-sm text-muted-foreground">
              Loading canonical idle analysis…
            </p>
          ) : vehicleError ? (
            <p className="p-6 text-sm text-destructive" role="alert">
              {vehicleError}
            </p>
          ) : !utilizationRows.length ? (
            <p className="p-6 text-sm text-muted-foreground">
              No canonical idle analysis is available.
            </p>
          ) : allIdleUnavailable ? (
            <p className="p-6 text-sm text-muted-foreground">
              Idle status is unavailable because canonical vehicle history is
              insufficient.
            </p>
          ) : !idleRows.length ? (
            <p className="p-6 text-sm text-muted-foreground">
              No vehicles are classified as idle by the canonical analysis.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {idleRows.map((row) => (
                <li
                  key={row.vehicleId}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.licensePlate ?? "No plate"} ·{" "}
                      {row.branch ?? "Unknown / unassigned"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-xl font-semibold text-amber-400">
                      {row.idleDays == null
                        ? "Unavailable"
                        : `${row.idleDays}d`}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      idle
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Projected supply"
            hint="Canonical VS015 snapshots linked to persisted forecasts"
          />
          {supplyError ? (
            <p className="px-5 pt-4 text-sm text-destructive" role="alert">
              {supplyError}
            </p>
          ) : null}
          {supplyLoading ? (
            <p className="p-6 text-sm text-muted-foreground">
              Loading canonical supply evaluations…
            </p>
          ) : !supplyRows.length && !forecastRows.length ? (
            <p className="p-6 text-sm text-muted-foreground">
              No canonical projected-supply evaluations are available yet. A
              persisted forecast with sufficient demand history is required
              first.
            </p>
          ) : !supplyRows.length ? (
            <p className="p-6 text-sm text-muted-foreground">
              No canonical supply snapshot exists for the persisted forecasts
              yet.
              {!staffView
                ? " Evaluate a forecast to persist its VS015 supply state."
                : " Owner/Admin can evaluate a persisted forecast."}
            </p>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {supplyRows.map((evaluation) => {
                  const forecast = forecastById.get(evaluation.forecast_id);
                  return (
                    <li key={evaluation.id} className="space-y-2 px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">
                            {forecast
                              ? forecastLabel(forecast)
                              : "Forecast record unavailable"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {forecast
                              ? `${formatDay(forecast.target_week_start)} – ${formatDay(forecast.target_week_end)} · Horizon ${forecast.horizon}`
                              : `Forecast ${evaluation.forecast_id}`}
                          </div>
                        </div>
                        <Badge>{supplyBalanceState(evaluation)}</Badge>
                      </div>
                      <div className="grid gap-2 text-xs sm:grid-cols-3">
                        <span>
                          Required:{" "}
                          <strong>
                            {formatQuantity(evaluation.required_units_snapshot)}
                          </strong>
                        </span>
                        <span>
                          Projected supply:{" "}
                          <strong>
                            {formatQuantity(evaluation.projected_supply)}
                          </strong>
                        </span>
                        <span>
                          Shortage / surplus:{" "}
                          <strong>
                            {formatQuantity(evaluation.shortage_units)} /{" "}
                            {formatQuantity(evaluation.surplus_units)}
                          </strong>
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Evaluated {formatDateTime(evaluation.evaluated_at)}
                        {evaluation.data_quality_state
                          ? ` · ${evaluation.data_quality_state}`
                          : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
              {!staffView && unevaluatedForecasts.length ? (
                <div className="border-t border-border p-5">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Persisted forecasts without a supply snapshot
                  </p>
                  <div className="space-y-2">
                    {unevaluatedForecasts.map((forecast) => (
                      <div
                        key={forecast.id}
                        className="flex flex-wrap items-center justify-between gap-3 text-sm"
                      >
                        <span>
                          {forecastLabel(forecast)} ·{" "}
                          {formatDay(forecast.target_week_start)}
                        </span>
                        <Btn
                          variant="ghost"
                          disabled={supplyBusyForecastId === forecast.id}
                          onClick={() => void evaluateSupply(forecast.id)}
                        >
                          {supplyBusyForecastId === forecast.id
                            ? "Evaluating…"
                            : "Evaluate supply"}
                        </Btn>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Card>

        {!staffView ? (
          <OperationalContextPanel
            title="Current route context for transfer review"
            context={allocationContext}
            loading={allocationContextLoading}
            error={allocationContextError}
            advisoryNote="Current operational context — not part of the original allocation score/snapshot. Select a recommendation to review its source-to-destination route."
          />
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader
            title="Branch allocation recommendations"
            hint="Canonical VS015 shortage/surplus · advisory only"
            right={
              !staffView ? (
                <Btn
                  variant="primary"
                  disabled={allocationBusy}
                  onClick={() => void generateAllocations()}
                >
                  {allocationBusy ? "Working…" : "Generate recommendations"}
                </Btn>
              ) : (
                <Badge>Read only</Badge>
              )
            }
          />
          {allocationError ? (
            <p className="px-5 py-3 text-sm text-destructive">
              {allocationError}
            </p>
          ) : null}
          {!allocationRows.length && !allocationError ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No persisted recommendations. Generate from the latest VS015
              evaluations.
            </p>
          ) : null}
          <ul className="divide-y divide-border text-sm">
            {allocationRows.map((row) => (
              <li key={row.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {row.destination_branch_name} ← {row.source_branch_name} ·{" "}
                      {row.vehicle_category_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Week {row.target_week_start} to {row.target_week_end} ·
                      Horizon {row.forecast_horizon}
                    </div>
                  </div>
                  <Badge>{row.decision_state}</Badge>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-3">
                  <span>
                    Destination shortage:{" "}
                    <strong>{row.destination_shortage_snapshot}</strong>
                  </span>
                  <span>
                    Source surplus:{" "}
                    <strong>{row.source_surplus_snapshot}</strong>
                  </span>
                  <span>
                    Recommended:{" "}
                    <strong>{row.recommended_transfer_units}</strong>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required/supply: destination{" "}
                  {row.destination_required_units_snapshot}/
                  {row.destination_projected_supply_snapshot}; source{" "}
                  {row.source_required_units_snapshot}/
                  {row.source_projected_supply_snapshot}. Quantity is
                  min(remaining shortage, remaining surplus, eligible
                  candidates).
                </p>
                <p className="text-[11px] text-muted-foreground">
                  VS015 evaluated: destination{" "}
                  {row.destination_evaluated_at
                    ? new Date(row.destination_evaluated_at).toLocaleString()
                    : "unknown"}
                  ; source{" "}
                  {row.source_evaluated_at
                    ? new Date(row.source_evaluated_at).toLocaleString()
                    : "unknown"}
                </p>
                <div className="space-y-1">
                  {(row.candidates ?? []).map((candidate) => {
                    const fuel =
                      allocationContext?.recommendation &&
                      contextRecommendationId === row.id
                        ? allocationContext.recommendation.candidates.find(
                            (item) => item.vehicleId === candidate.vehicle_id,
                          )
                        : undefined;
                    return (
                      <div
                        key={candidate.id}
                        className="flex justify-between gap-3 text-xs"
                      >
                        <span>
                          #{candidate.candidate_rank}{" "}
                          {candidate.vehicle_name_snapshot} ·{" "}
                          {candidate.license_plate_snapshot ?? "No plate"}
                        </span>
                        <span>
                          {fuel
                            ? `${fuel.referenceEfficiencyKmPerLiter == null ? "Efficiency unavailable" : `${fuel.referenceEfficiencyKmPerLiter.toFixed(1)} km/L`} · ${fuel.estimatedFuelLiters == null ? "Fuel unavailable" : `${fuel.estimatedFuelLiters.toFixed(1)} L`}`
                            : candidate.idle_days_snapshot == null
                              ? "Idle unknown"
                              : `${candidate.idle_days_snapshot}d idle`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {!staffView ? (
                  <Btn
                    variant="ghost"
                    disabled={
                      allocationContextLoading &&
                      contextRecommendationId === row.id
                    }
                    onClick={() => setContextRecommendationId(row.id)}
                  >
                    {contextRecommendationId === row.id
                      ? "Reviewing current context"
                      : "Review current route context"}
                  </Btn>
                ) : null}
                {!staffView && row.decision_state === "Pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <Btn
                      disabled={allocationBusy}
                      variant="primary"
                      onClick={() =>
                        void decideAllocation(
                          row.id,
                          "Approved",
                          row.recommended_transfer_units,
                        )
                      }
                    >
                      Approve full ({row.recommended_transfer_units})
                    </Btn>
                    <Btn
                      disabled={allocationBusy}
                      variant="ghost"
                      onClick={() => {
                        const value = window.prompt(
                          `Approve a positive quantity up to ${row.recommended_transfer_units}`,
                          String(row.recommended_transfer_units),
                        );
                        const units = Number(value);
                        if (Number.isInteger(units) && units > 0)
                          void decideAllocation(row.id, "Approved", units);
                      }}
                    >
                      Approve lower quantity
                    </Btn>
                    <Btn
                      disabled={allocationBusy}
                      variant="danger"
                      onClick={() => void decideAllocation(row.id, "Rejected")}
                    >
                      Reject
                    </Btn>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
