import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  CarFront,
  CheckCircle2,
  CircleDot,
  Info,
} from "lucide-react";
import { Badge, Btn } from "@/components/admin/ui";
import {
  OperationalContextPanel,
  type OperationalContextView,
} from "@/components/admin/operational-context-panel";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
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
    if (!session) throw redirect({ to: "/sign-in" });
    // Some decision-support GET handlers currently accept Staff. The frozen
    // UI boundary remains Owner/Admin-only until that architecture conflict is
    // resolved; this route does not broaden access.
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: DecisionPage,
});

const decisionGrid = "rgba(24,35,33,0.12)";

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
type AllocationSummary = {
  evaluatedPositions: number;
  shortagePositions: number;
  surplusPositions: number;
  generatedRecommendations: number;
};
type AllocationResponse = {
  recommendations?: AllocationRow[];
  summary?: AllocationSummary;
};
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
  return value
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }).format(new Date(value))
    : "Unavailable";
}

function formatChartDay(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
  target.focus({ preventScroll: true });
}

function weekEndFromStart(day: string) {
  const value = new Date(`${day}T00:00:00+08:00`);
  value.setUTCDate(value.getUTCDate() + 7);
  return value.toISOString().slice(0, 10);
}

function formatWeekRange(start: string, end: string) {
  const inclusiveEnd = new Date(`${end}T00:00:00+08:00`);
  inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() - 1);
  return `${formatDay(start)} – ${formatDay(inclusiveEnd.toISOString().slice(0, 10))}`;
}

type ForecastChartPoint = {
  d: string;
  weekEnd: string;
  [key: string]: string | number | undefined;
};

type ForecastChartSeries = {
  branchId: string;
  label: string;
  actualKey: string;
  forecastKey: string;
  color: string;
};

function buildFocusedForecastChart(rows: CanonicalForecast[]) {
  const points = new Map<string, ForecastChartPoint>();
  const branches = [
    ...new Map(
      rows.map((row) => [
        row.branch_id,
        row.branch?.name ?? row.branch_id,
      ]),
    ),
  ];
  const isMultiBranch = branches.length > 1;
  // Teal and violet remain distinct for common color-vision differences and
  // make branch comparisons legible at a glance.
  const palette = ["#007c70", "#6650a4", "#b54708", "#0f6cbd"];
  const series: ForecastChartSeries[] = branches.map(([branchId, label], index) => ({
    branchId,
    label,
    actualKey: isMultiBranch ? `actual-${branchId}` : "actual",
    forecastKey: isMultiBranch ? `forecast-${branchId}` : "forecast",
    color: palette[index % palette.length],
  }));
  const seriesByBranchId = new Map(
    series.map((item) => [item.branchId, item]),
  );
  const actualsByWeek = new Map<string, Map<string, number>>();

  for (const forecast of rows) {
    for (const input of forecast.inputs ?? []) {
      if (input.source_type === "Forecast") continue;
      const numeric = Number(input.source_value);
      if (!Number.isFinite(numeric)) continue;
      const weeklyActuals = actualsByWeek.get(input.source_week_start) ?? new Map();
      weeklyActuals.set(forecast.branch_id, numeric);
      actualsByWeek.set(input.source_week_start, weeklyActuals);
    }
  }
  for (const [weekStart, branchActuals] of actualsByWeek) {
    const point: ForecastChartPoint = {
      d: weekStart,
      weekEnd: weekEndFromStart(weekStart),
    };
    for (const [branchId, demand] of branchActuals) {
      const branchSeries = seriesByBranchId.get(branchId);
      if (branchSeries) point[branchSeries.actualKey] = demand;
    }
    points.set(weekStart, point);
  }

  for (const forecast of rows) {
    const branchSeries = seriesByBranchId.get(forecast.branch_id);
    const numeric = Number(forecast.forecasted_demand);
    if (branchSeries && Number.isFinite(numeric)) {
      const existing = points.get(forecast.target_week_start);
      points.set(forecast.target_week_start, {
        ...(existing ?? {
          d: forecast.target_week_start,
          weekEnd: forecast.target_week_end,
        }),
        [branchSeries.forecastKey]: numeric,
        weekEnd: forecast.target_week_end,
      });
    }
  }

  // Each forecast is a separate dashed series. Seed it with the latest
  // observed demand so the handoff from actuals to the first WMA value is a
  // continuous visual path instead of an unexplained gap.
  const sortedPoints = [...points.values()].sort((left, right) =>
    left.d.localeCompare(right.d),
  );
  for (const branchSeries of series) {
    const firstForecastIndex = sortedPoints.findIndex(
      (point) => Number.isFinite(point[branchSeries.forecastKey]),
    );
    if (firstForecastIndex < 1) continue;
    for (let index = firstForecastIndex - 1; index >= 0; index -= 1) {
      const observed = sortedPoints[index][branchSeries.actualKey];
      if (!Number.isFinite(observed)) continue;
      sortedPoints[index][branchSeries.forecastKey] = observed;
      break;
    }
  }

  return {
    points: sortedPoints,
    series,
  };
}

function DecisionBriefItem({
  tone,
  icon: Icon,
  title,
  detail,
  basis,
  actionLabel,
  onAction,
  disabled = false,
}: {
  tone: "attention" | "info" | "neutral" | "success";
  icon: typeof CircleDot;
  title: string;
  detail: string;
  basis: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <li className={`admin-decision-brief-item is-${tone}`}>
      <Icon aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
        <small>{basis}</small>
      </div>
      <Btn
        variant={tone === "attention" ? "primary" : "default"}
        disabled={disabled}
        onClick={onAction}
      >
        {actionLabel}
      </Btn>
    </li>
  );
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
  const [supplyBusy, setSupplyBusy] = useState(false);
  const [vehicleAnalytics, setVehicleAnalytics] = useState<
    VehicleAnalyticsRow[]
  >([]);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleError, setVehicleError] = useState("");
  const [supportVersion, setSupportVersion] = useState(0);
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>([]);
  const [allocationSummary, setAllocationSummary] =
    useState<AllocationSummary | null>(null);
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
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [balanceWeek, setBalanceWeek] = useState("");
  const [approvedUnits, setApprovedUnits] = useState(1);
  const synchronizedSupplyRuns = useRef(new Set<string>());
  const requestedForecast = useRef(false);
  const generatedAllocationRuns = useRef(new Set<string>());
  const hasForecastSnapshot = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const initialForecastLoad = !hasForecastSnapshot.current;
    if (initialForecastLoad) setForecastLoading(true);
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
        hasForecastSnapshot.current = true;
        setForecastError("");
      } else {
        if (!hasForecastSnapshot.current) setForecastData(null);
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
      if (initialForecastLoad) setForecastLoading(false);
      setSupplyLoading(false);
      setVehicleLoading(false);
    });

    return () => controller.abort();
  }, [analyticsRange.end, analyticsRange.start, supportVersion]);

  useEffect(() => {
    let active = true;
    readApi<AllocationResponse>("/api/allocation-recommendations")
      .then((body) => {
        if (!active) return;
        const rows = body.recommendations ?? [];
        setAllocationRows(rows);
        setAllocationSummary(body.summary ?? null);
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

  async function evaluateSupply(
    forecastIds: string[],
    idempotencyKey = crypto.randomUUID(),
  ): Promise<boolean> {
    if (!forecastIds.length) return true;
    setSupplyBusy(true);
    setSupplyError("");
    try {
      await readApi("/api/supply-evaluations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          forecastIds,
          idempotencyKey,
        }),
      });
      setSupportVersion((version) => version + 1);
      return true;
    } catch (error) {
      setSupplyError(
        errorMessage(error, "Unable to evaluate canonical supply."),
      );
      return false;
    } finally {
      setSupplyBusy(false);
    }
  }

  async function generateAllocations(
    idempotencyKey = crypto.randomUUID(),
  ): Promise<boolean> {
    setAllocationBusy(true);
    try {
      const body = await readApi<AllocationResponse>(
        "/api/allocation-recommendations",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idempotencyKey }),
        },
      );
      const rows = body.recommendations ?? [];
      setAllocationRows(rows);
      setAllocationSummary(body.summary ?? null);
      setContextRecommendationId(rows[0]?.id ?? "");
      setAllocationContext(null);
      setAllocationContextError("");
      setAllocationContextLoading(false);
      setAllocationContextVersion((version) => version + 1);
      setAllocationError("");
      return true;
    } catch (error) {
      setAllocationError(
        errorMessage(error, "Unable to generate recommendations."),
      );
      return false;
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
  const forecastById = new Map(
    (forecastData?.forecasts ?? []).map((forecast) => [forecast.id, forecast]),
  );
  const supplyRows = selectLatestSupplyEvaluations(supplyEvaluations);
  const supplyByForecastId = new Map(
    supplyRows.map((evaluation) => [evaluation.forecast_id, evaluation]),
  );
  const latestForecastIds = new Set(forecastRows.map((row) => row.id));
  const currentSupplyRows = supplyRows.filter((evaluation) =>
    latestForecastIds.has(evaluation.forecast_id),
  );
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
  const latestRun = [...(forecastData?.runs ?? [])]
    .sort(
      (left, right) =>
        Date.parse(right.generated_at) - Date.parse(left.generated_at),
    )
    .find((run) => forecastRows.some((forecast) => forecast.run_id === run.id));

  const currentAllocationRows = allocationRows.filter((row) =>
    forecastRows.some(
      (forecast) =>
        forecast.branch?.name === row.destination_branch_name &&
        forecast.category?.name === row.vehicle_category_name &&
        forecast.target_week_start === row.target_week_start &&
        Number(forecast.horizon) === Number(row.forecast_horizon),
    ),
  );
  const pendingAllocations = currentAllocationRows.filter(
    (row) => row.decision_state === "Pending",
  );
  const shortageEvaluations = currentSupplyRows.filter(
    (row) => Number(row.shortage_units) > 0,
  );
  const surplusEvaluations = currentSupplyRows.filter(
    (row) => Number(row.surplus_units) > 0,
  );
  const selectedRecommendation =
    currentAllocationRows.find((row) => row.id === contextRecommendationId) ??
    currentAllocationRows[0] ??
    null;

  const branchOptions = [
    ...new Map(
      forecastRows.map((row) => [
        row.branch_id,
        row.branch?.name ?? row.branch_id,
      ]),
    ),
  ].map(([id, name]) => ({ id, name }));
  const categoryOptions = [
    ...new Map(
      forecastRows
        .filter(
          (row) =>
            !selectedBranchId ||
            selectedBranchId === "all" ||
            row.branch_id === selectedBranchId,
        )
        .map((row) => [
          row.vehicle_category_id,
          row.category?.name ?? row.vehicle_category_id,
        ]),
    ),
  ].map(([id, name]) => ({ id, name }));
  const weekOptions = [
    ...new Set(forecastRows.map((row) => row.target_week_start)),
  ];
  const focusedForecastRows = forecastRows.filter(
    (row) =>
      row.vehicle_category_id === selectedCategoryId &&
      (selectedBranchId === "all" || row.branch_id === selectedBranchId),
  );
  const focusedForecast = buildFocusedForecastChart(focusedForecastRows);
  const focusedForecastChart = focusedForecast.points;
  const focusedForecastSeries = focusedForecast.series;
  const focusedForecastLabel = focusedForecastRows[0]
    ? selectedBranchId === "all"
      ? `All branches · ${focusedForecastRows[0].category?.name ?? focusedForecastRows[0].vehicle_category_id}`
      : forecastLabel(focusedForecastRows[0])
    : "Choose a branch and category";
  const focusedForecastStart =
    focusedForecastRows[0]?.target_week_start ?? null;
  const focusedForecastEnd = focusedForecastRows.length
    ? [...focusedForecastRows].sort((left, right) =>
        right.target_week_end.localeCompare(left.target_week_end),
      )[0]?.target_week_end
    : null;
  const visibleSupplyForecasts = forecastRows.filter(
    (row) => !balanceWeek || row.target_week_start === balanceWeek,
  );
  const supplyWeekSummaries = weekOptions.map((week) => {
    const rows = forecastRows.filter((row) => row.target_week_start === week);
    const evaluations = rows.flatMap((row) => {
      const evaluation = supplyByForecastId.get(row.id);
      return evaluation ? [evaluation] : [];
    });
    const shortageCount = evaluations.filter(
      (evaluation) => Number(evaluation.shortage_units) > 0,
    ).length;
    const surplusCount = evaluations.filter(
      (evaluation) => Number(evaluation.surplus_units) > 0,
    ).length;
    return {
      week,
      total: rows.length,
      evaluated: evaluations.length,
      shortageCount,
      surplusCount,
      completedAt: evaluations.reduce<string | null>(
        (latest, evaluation) =>
          !latest || evaluation.evaluated_at > latest
            ? evaluation.evaluated_at
            : latest,
        null,
      ),
    };
  });
  const vehicleAttentionRows = [...utilizationRows]
    .sort((left, right) => {
      const leftIdle = left.idleClassification === "Idle" ? 0 : 1;
      const rightIdle = right.idleClassification === "Idle" ? 0 : 1;
      if (leftIdle !== rightIdle) return leftIdle - rightIdle;
      const leftUse = left.utilizationPercent ?? Number.POSITIVE_INFINITY;
      const rightUse = right.utilizationPercent ?? Number.POSITIVE_INFINITY;
      return leftUse - rightUse || left.name.localeCompare(right.name);
    })
    .slice(0, 6);

  useEffect(() => {
    if (!forecastRows.length) return;
    const recommendation = pendingAllocations[0] ?? allocationRows[0];
    const recommendationForecast = recommendation
      ? forecastRows.find(
          (row) =>
            row.branch?.name === recommendation.destination_branch_name &&
            row.category?.name === recommendation.vehicle_category_name &&
            row.target_week_start === recommendation.target_week_start,
        )
      : undefined;
    const shortageForecast = shortageEvaluations.length
      ? forecastById.get(shortageEvaluations[0].forecast_id)
      : undefined;
    const preferred =
      recommendationForecast ?? shortageForecast ?? forecastRows[0];

    setSelectedBranchId((current) =>
      current === "all" ||
      (current && forecastRows.some((row) => row.branch_id === current))
        ? current
        : "all",
    );
    setSelectedCategoryId((current) =>
      current &&
      forecastRows.some(
        (row) =>
          row.vehicle_category_id === current,
      )
        ? current
        : preferred.vehicle_category_id,
    );
    setBalanceWeek((current) =>
      current && weekOptions.includes(current)
        ? current
        : preferred.target_week_start,
    );
  }, [forecastData, allocationRows, supplyEvaluations]);

  useEffect(() => {
    if (!selectedBranchId || !forecastRows.length) return;
    if (
      forecastRows.some(
        (row) =>
          row.vehicle_category_id === selectedCategoryId &&
          (selectedBranchId === "all" || row.branch_id === selectedBranchId),
      )
    )
      return;
    const first = forecastRows.find(
      (row) => selectedBranchId === "all" || row.branch_id === selectedBranchId,
    );
    setSelectedCategoryId(first?.vehicle_category_id ?? "");
  }, [selectedBranchId, selectedCategoryId, forecastData]);

  useEffect(() => {
    const interval = window.setInterval(
      () => setSupportVersion((version) => version + 1),
      60_000,
    );
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      staffView ||
      forecastLoading ||
      forecastBusy ||
      forecastRows.length ||
      requestedForecast.current
    )
      return;
    requestedForecast.current = true;
    void generateForecast();
  }, [forecastBusy, forecastLoading, forecastRows.length, staffView]);

  useEffect(() => {
    if (
      staffView ||
      forecastLoading ||
      supplyLoading ||
      supplyBusy ||
      !latestRun ||
      !unevaluatedForecasts.length ||
      synchronizedSupplyRuns.current.has(latestRun.id)
    )
      return;
    synchronizedSupplyRuns.current.add(latestRun.id);
    void evaluateSupply(
      unevaluatedForecasts.map((forecast) => forecast.id),
      `automatic-supply-${latestRun.id}`,
    ).then((succeeded) => {
      if (!succeeded) synchronizedSupplyRuns.current.delete(latestRun.id);
    });
  }, [
    forecastLoading,
    latestRun?.id,
    staffView,
    supplyBusy,
    supplyLoading,
    unevaluatedForecasts.length,
  ]);

  useEffect(() => {
    if (
      staffView ||
      supplyLoading ||
      supplyBusy ||
      allocationBusy ||
      !latestRun ||
      unevaluatedForecasts.length ||
      !shortageEvaluations.length ||
      !surplusEvaluations.length ||
      pendingAllocations.length ||
      generatedAllocationRuns.current.has(latestRun.id)
    )
      return;
    generatedAllocationRuns.current.add(latestRun.id);
    void generateAllocations(`automatic-allocation-${latestRun.id}`).then(
      (succeeded) => {
        if (!succeeded) generatedAllocationRuns.current.delete(latestRun.id);
      },
    );
  }, [
    allocationBusy,
    latestRun?.id,
    pendingAllocations.length,
    shortageEvaluations.length,
    staffView,
    supplyBusy,
    supplyLoading,
    surplusEvaluations.length,
    unevaluatedForecasts.length,
  ]);

  useEffect(() => {
    setContextRecommendationId((current) =>
      current && currentAllocationRows.some((row) => row.id === current)
        ? current
        : (currentAllocationRows[0]?.id ?? ""),
    );
  }, [currentAllocationRows]);

  useEffect(() => {
    if (!selectedRecommendation) return;
    setApprovedUnits(selectedRecommendation.recommended_transfer_units);
  }, [selectedRecommendation?.id]);

  const allCategories = [
    ...new Map(
      forecastRows.map((row) => [
        row.vehicle_category_id,
        row.category?.name ?? row.vehicle_category_id,
      ]),
    ),
  ].map(([id, name]) => ({ id, name }));

  return (
    <div className="admin-decision-workspace">
      <header className="admin-decision-heading">
        <div>
          <h1>Decision support</h1>
          <p>Forecast demand, identify shortages, and review fleet moves.</p>
        </div>
        <div className="admin-decision-advisory" role="note">
          <Info aria-hidden="true" />
          <span>
            <strong>Advisory only</strong> — every recommendation requires human
            review.
          </span>
        </div>
      </header>

      <div className="admin-decision-overview">
        <section
          className="admin-decision-panel admin-decision-forecast"
          aria-labelledby="decision-demand-heading"
        >
          <header className="admin-decision-panel-heading">
            <div>
              <h2 id="decision-demand-heading">Demand outlook</h2>
              <p>
                3-week WMA outlook
                {latestRun
                  ? ` · updated ${formatDateTime(latestRun.generated_at)}`
                  : " · no persisted run"}
              </p>
            </div>
            <div className="admin-decision-forecast-filters">
              <label>
                <span>Branch</span>
                <select
                  value={selectedBranchId}
                  onChange={(event) => setSelectedBranchId(event.target.value)}
                  disabled={!branchOptions.length}
                >
                  <option value="all">All branches</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Category</span>
                <select
                  value={selectedCategoryId}
                  onChange={(event) =>
                    setSelectedCategoryId(event.target.value)
                  }
                  disabled={!categoryOptions.length}
                >
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </header>

          <div className="admin-decision-chart">
            {forecastLoading && !forecastData ? (
              <div className="admin-decision-chart-state" role="status">
                Loading demand forecast…
              </div>
            ) : forecastError && !forecastData ? (
              <div className="admin-decision-chart-state is-error" role="alert">
                {forecastError} Refresh the page or generate a new forecast.
              </div>
            ) : !focusedForecastChart.length ? (
              <div className="admin-decision-chart-state">
                <BarChart3 aria-hidden="true" />
                <strong>No forecast values available</strong>
                <span>
                  Generate a WMA forecast after sufficient booking history is
                  recorded.
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={focusedForecastChart}
                  margin={{ top: 12, right: 18, bottom: 14, left: 0 }}
                >
                  <CartesianGrid stroke={decisionGrid} vertical={false} />
                  <XAxis
                    dataKey="d"
                    tickFormatter={formatChartDay}
                    tick={{ fill: "#52635f", fontSize: 11 }}
                    axisLine={{ stroke: decisionGrid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#52635f", fontSize: 11 }}
                    axisLine={{ stroke: decisionGrid }}
                    tickLine={false}
                    width={32}
                    allowDecimals
                  />
                  <Tooltip
                    labelFormatter={(label) => {
                      const point = focusedForecastChart.find(
                        (item) => item.d === String(label),
                      );
                      return `Week of ${formatWeekRange(
                        String(label),
                        point?.weekEnd ?? weekEndFromStart(String(label)),
                      )}`;
                    }}
                    formatter={(value, name) => [
                      formatQuantity(value as number),
                      String(name),
                    ]}
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #d8d5cc",
                      borderRadius: 10,
                      color: "#182321",
                      fontSize: 12,
                    }}
                  />
                  {focusedForecastStart ? (
                    <ReferenceLine
                      x={focusedForecastStart}
                      stroke="#2e647b"
                      strokeDasharray="3 4"
                      label={{
                        value: "Forecast begins",
                        fill: "#2e647b",
                        fontSize: 11,
                        position: "insideTopRight",
                      }}
                    />
                  ) : null}
                  {focusedForecastSeries.flatMap((series) => [
                    <Line
                      key={`${series.branchId}-actual`}
                      type="linear"
                      dataKey={series.actualKey}
                      name={`${series.label} — actual weekly demand`}
                      stroke={series.color}
                      strokeWidth={3}
                      dot={{ r: 3.5, fill: series.color }}
                      connectNulls
                      isAnimationActive={false}
                    />,
                    <Line
                      key={`${series.branchId}-forecast`}
                      type="linear"
                      dataKey={series.forecastKey}
                      name={`${series.label} — weekly WMA forecast`}
                      stroke={series.color}
                      strokeWidth={3}
                      strokeDasharray="7 6"
                      dot={{ r: 3.5, fill: series.color }}
                      connectNulls
                      isAnimationActive={false}
                    />,
                  ])}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <footer className="admin-decision-chart-footer">
            <strong>{focusedForecastLabel}</strong>
            {focusedForecastSeries.map((series) => (
              <span key={series.branchId}>
                <i style={{ background: series.color }} /> {series.label} —
                actual solid, forecast dashed
              </span>
            ))}
            {focusedForecastStart && focusedForecastEnd ? (
              <small>
                Forecast horizon: {formatWeekRange(
                  focusedForecastStart,
                  focusedForecastEnd,
                )}
              </small>
            ) : null}
            {forecastData?.mape == null ? (
              <small>
                Accuracy becomes available after actual demand is finalized.
              </small>
            ) : (
              <small>
                Latest finalized MAPE: {formatPercent(forecastData.mape)}
              </small>
            )}
          </footer>
        </section>

        <aside
          className="admin-decision-panel admin-decision-brief"
          aria-labelledby="decision-brief-heading"
        >
          <header className="admin-decision-panel-heading">
            <div>
              <h2 id="decision-brief-heading">Decision brief</h2>
              <p>Actions supported by the latest persisted records.</p>
            </div>
          </header>
          <ol>
            {!forecastLoading && !forecastRows.length ? (
              <DecisionBriefItem
                tone="info"
                icon={BarChart3}
                title="Generate the demand forecast"
                detail="No persisted WMA forecast is available for the next 3 weeks."
                basis="A forecast is required before supply can be evaluated."
                actionLabel={forecastBusy ? "Generating…" : "Generate forecast"}
                disabled={forecastBusy || staffView}
                onAction={() => void generateForecast()}
              />
            ) : null}

            {pendingAllocations.slice(0, 3).map((row) => (
              <DecisionBriefItem
                key={row.id}
                tone="attention"
                icon={ArrowRightLeft}
                title={`Review transfer of ${row.recommended_transfer_units} ${row.vehicle_category_name}`}
                detail={`${row.destination_branch_name} needs ${row.destination_shortage_snapshot}; ${row.source_branch_name} has ${row.source_surplus_snapshot} surplus.`}
                basis={`Target week ${formatDay(row.target_week_start)} · ${row.candidates.length} eligible candidate${row.candidates.length === 1 ? "" : "s"}`}
                actionLabel="Review transfer"
                onAction={() => {
                  setContextRecommendationId(row.id);
                  window.setTimeout(
                    () => scrollToSection("transfer-review"),
                    0,
                  );
                }}
              />
            ))}

            {unevaluatedForecasts.length ? (
              <DecisionBriefItem
                tone="info"
                icon={CircleDot}
                title={`Evaluate ${unevaluatedForecasts.length} supply gap${unevaluatedForecasts.length === 1 ? "" : "s"}`}
                detail="These branch and category forecasts do not have a current supply snapshot."
                basis="Supply evaluation checks availability, commitments, and maintenance readiness."
                actionLabel="Review supply gaps"
                onAction={() => scrollToSection("supply-analysis")}
              />
            ) : null}

            {!pendingAllocations.length &&
            shortageEvaluations.length &&
            surplusEvaluations.length ? (
              <DecisionBriefItem
                tone="attention"
                icon={ArrowRightLeft}
                title="Generate transfer recommendations"
                detail={`${shortageEvaluations.length} shortage${shortageEvaluations.length === 1 ? "" : "s"} and ${surplusEvaluations.length} surplus position${surplusEvaluations.length === 1 ? "" : "s"} are ready to compare.`}
                basis="The generator only pairs matching categories and eligible vehicles."
                actionLabel={
                  allocationBusy ? "Generating…" : "Generate recommendations"
                }
                disabled={allocationBusy || staffView}
                onAction={() => void generateAllocations()}
              />
            ) : null}

            {idleRows.length ? (
              <DecisionBriefItem
                tone="neutral"
                icon={CarFront}
                title={`Review ${idleRows.length} idle vehicle${idleRows.length === 1 ? "" : "s"}`}
                detail="Canonical vehicle analysis classified these vehicles as idle in the current reporting period."
                basis={`${formatDay(analyticsRange.start)} – ${formatDay(analyticsRange.end)}`}
                actionLabel="Review vehicles"
                onAction={() => scrollToSection("vehicle-attention")}
              />
            ) : null}

            {forecastRows.length &&
            !pendingAllocations.length &&
            !unevaluatedForecasts.length &&
            !shortageEvaluations.length &&
            !idleRows.length ? (
              <DecisionBriefItem
                tone="success"
                icon={CheckCircle2}
                title="No decisions need attention"
                detail="The latest forecasts and supply evaluations show no unresolved shortage or idle-vehicle signal."
                basis="Continue monitoring as new bookings and fleet activity are recorded."
                actionLabel="Review analysis"
                onAction={() => scrollToSection("branch-balance")}
              />
            ) : null}
          </ol>
          {forecastNotice || allocationError ? (
            <div
              className={`admin-decision-brief-feedback ${allocationError ? "is-error" : ""}`}
              role={allocationError ? "alert" : "status"}
              aria-live="polite"
            >
              {allocationError || forecastNotice}
            </div>
          ) : null}
        </aside>
      </div>

      <section
        id="branch-balance"
        tabIndex={-1}
        className="admin-decision-panel admin-decision-balance"
        aria-labelledby="branch-balance-heading"
      >
        <header className="admin-decision-panel-heading">
          <div>
            <h2 id="branch-balance-heading">Branch balance</h2>
            <p>Required and projected vehicles for the selected target week.</p>
          </div>
          <div className="admin-decision-balance-controls">
            <div className="admin-decision-legend" aria-label="Balance states">
              <span>
                <i className="is-shortage" /> Shortage
              </span>
              <span>
                <i className="is-balanced" /> Balanced
              </span>
              <span>
                <i className="is-surplus" /> Surplus
              </span>
              <span>
                <i className="is-pending" /> Not evaluated
              </span>
            </div>
            <label>
              <span className="sr-only">Target week</span>
              <select
                value={balanceWeek}
                onChange={(event) => setBalanceWeek(event.target.value)}
                disabled={!weekOptions.length}
                aria-label="Target week"
              >
                {weekOptions.map((week) => (
                  <option key={week} value={week}>
                    Week of {formatChartDay(week)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <div className="admin-decision-table-wrap admin-scroll-region">
          <table className="admin-decision-balance-table">
            <thead>
              <tr>
                <th scope="col">Branch</th>
                {allCategories.map((category) => (
                  <th key={category.id} scope="col">
                    {category.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branchOptions.map((branch) => (
                <tr key={branch.id}>
                  <th scope="row">{branch.name}</th>
                  {allCategories.map((category) => {
                    const forecast = visibleSupplyForecasts.find(
                      (row) =>
                        row.branch_id === branch.id &&
                        row.vehicle_category_id === category.id,
                    );
                    const evaluation = forecast
                      ? supplyByForecastId.get(forecast.id)
                      : undefined;
                    const state = evaluation
                      ? supplyBalanceState(evaluation).toLowerCase()
                      : "pending";
                    return (
                      <td key={category.id} className={`is-${state}`}>
                        {forecast ? (
                          <>
                            <strong>
                              {evaluation
                                ? `${formatQuantity(evaluation.required_units_snapshot)} / ${formatQuantity(evaluation.projected_supply)}`
                                : `${formatQuantity(forecast.required_vehicle_units)} / —`}
                            </strong>
                            <span>
                              <i />
                              {evaluation
                                ? supplyBalanceState(evaluation)
                                : "Not evaluated"}
                            </span>
                          </>
                        ) : (
                          <span>No forecast</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="admin-decision-balance-note">
          Values show required / projected vehicles from the latest supply
          snapshot for this forecast run.
        </footer>
      </section>

      <section
        id="vehicle-attention"
        tabIndex={-1}
        className="admin-decision-panel admin-decision-vehicles"
        aria-labelledby="vehicle-attention-heading"
      >
        <header className="admin-decision-panel-heading">
          <div>
            <h2 id="vehicle-attention-heading">Vehicle attention</h2>
            <p>
              Canonical idle classifications and the lowest utilization values
              from the last 30 days.
            </p>
          </div>
          <Link to="/admin/fleet" className="admin-decision-text-link">
            Open fleet <ArrowRight aria-hidden="true" />
          </Link>
        </header>
        {vehicleLoading ? (
          <p className="admin-decision-empty" role="status">
            Loading vehicle analysis…
          </p>
        ) : vehicleError ? (
          <p className="admin-decision-empty is-error" role="alert">
            {vehicleError} Refresh the page to try again.
          </p>
        ) : !vehicleAttentionRows.length ? (
          <p className="admin-decision-empty">
            No vehicle analysis is available.
          </p>
        ) : (
          <div className="admin-decision-table-wrap admin-scroll-region">
            <table className="admin-decision-data-table">
              <thead>
                <tr>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Branch</th>
                  <th scope="col">Utilization</th>
                  <th scope="col">Canonical state</th>
                  <th scope="col">Next review</th>
                </tr>
              </thead>
              <tbody>
                {vehicleAttentionRows.map((row) => (
                  <tr key={row.vehicleId}>
                    <td>
                      <strong>{row.name}</strong>
                      <small>{row.licensePlate ?? "No plate recorded"}</small>
                    </td>
                    <td>{row.branch ?? "Unknown / unassigned"}</td>
                    <td className="is-numeric">
                      {formatPercent(row.utilizationPercent)}
                    </td>
                    <td>
                      <span
                        className={`admin-decision-state is-${row.idleClassification === "Idle" ? "shortage" : row.idleClassification === "Unable to Determine" ? "pending" : "balanced"}`}
                      >
                        <i /> {row.idleClassification}
                      </span>
                    </td>
                    <td>
                      {row.idleClassification === "Idle"
                        ? "Compare with branch demand"
                        : row.utilizationPercent == null
                          ? "Review historical coverage"
                          : "Monitor utilization"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        id="supply-analysis"
        tabIndex={-1}
        className="admin-decision-panel admin-decision-supply"
        aria-labelledby="supply-analysis-heading"
        aria-busy={supplyLoading}
      >
        <header className="admin-decision-panel-heading">
          <div>
            <h2 id="supply-analysis-heading">Supply analysis</h2>
            <p>
              Automatic readiness snapshots account for active vehicles,
              confirmed bookings, rentals, and maintenance.
            </p>
          </div>
          <Badge>
            {supplyLoading || supplyBusy
              ? "Synchronizing…"
              : `${currentSupplyRows.length}/${forecastRows.length} ready`}
          </Badge>
        </header>
        {supplyError ? (
          <p className="admin-decision-feedback is-error" role="alert">
            {supplyError}
          </p>
        ) : null}
        <div className="admin-decision-supply-summary" aria-live="polite">
          {supplyWeekSummaries.map((summary) => {
            const isReady = summary.evaluated === summary.total;
            const hasImbalance = summary.shortageCount || summary.surplusCount;
            return (
              <article key={summary.week}>
                <div>
                  <strong>{formatDay(summary.week)}</strong>
                  <span>
                    {summary.total} forecast position
                    {summary.total === 1 ? "" : "s"}
                  </span>
                </div>
                <div>
                  <span
                    className={`admin-decision-state is-${isReady ? (hasImbalance ? "shortage" : "balanced") : "pending"}`}
                  >
                    <i />
                    {isReady
                      ? hasImbalance
                        ? `${summary.shortageCount} shortage · ${summary.surplusCount} surplus`
                        : "Balanced or covered"
                      : `${summary.evaluated}/${summary.total} snapshots ready`}
                  </span>
                  <small>
                    {summary.completedAt
                      ? `Last checked ${formatDateTime(summary.completedAt)}`
                      : "Preparing the first readiness snapshot"}
                  </small>
                </div>
                <Btn
                  variant="default"
                  onClick={() => {
                    setBalanceWeek(summary.week);
                    window.setTimeout(
                      () => scrollToSection("branch-balance"),
                      0,
                    );
                  }}
                >
                  View balance
                </Btn>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="transfer-review"
        tabIndex={-1}
        className="admin-decision-panel admin-decision-transfers"
        aria-labelledby="transfer-review-heading"
      >
        <header className="admin-decision-panel-heading">
          <div>
            <h2 id="transfer-review-heading">Transfer recommendations</h2>
            <p>Shortage and surplus matches that require Owner/Admin review.</p>
          </div>
          {!staffView ? (
            <Btn
              variant="primary"
              disabled={
                allocationBusy ||
                supplyBusy ||
                !!unevaluatedForecasts.length ||
                !shortageEvaluations.length ||
                !surplusEvaluations.length
              }
              onClick={() => void generateAllocations()}
            >
              {allocationBusy
                ? "Preparing recommendations…"
                : "Refresh recommendations"}
            </Btn>
          ) : (
            <Badge>Read only</Badge>
          )}
        </header>
        {allocationError ? (
          <p className="admin-decision-feedback is-error" role="alert">
            {allocationError}
          </p>
        ) : null}
        <div className="admin-decision-transfer-layout">
          <nav
            aria-label="Transfer recommendations"
            className="admin-decision-transfer-list"
          >
            {!currentAllocationRows.length ? (
              <div className="admin-decision-empty">
                <ArrowRightLeft aria-hidden="true" />
                <strong>
                  {supplyBusy || unevaluatedForecasts.length
                    ? "Preparing transfer options"
                    : shortageEvaluations.length && !surplusEvaluations.length
                      ? "No matching surplus is available"
                      : surplusEvaluations.length && !shortageEvaluations.length
                        ? "No branch needs a transfer"
                        : allocationSummary?.generatedRecommendations === 0
                          ? "No eligible transfer match was found"
                          : "No transfer is needed"}
                </strong>
                <span>
                  {supplyBusy || unevaluatedForecasts.length
                    ? "The latest forecast run is being checked automatically before transfer options are shown."
                    : shortageEvaluations.length && !surplusEvaluations.length
                      ? "The current run has a shortage, but no matching branch/category surplus to move."
                      : surplusEvaluations.length && !shortageEvaluations.length
                        ? "The current run has spare capacity, but no matching shortage to resolve."
                        : allocationSummary?.generatedRecommendations === 0
                          ? "Current supply snapshots found no eligible vehicles that can be safely transferred."
                          : "The current supply snapshots have no unresolved branch imbalance."}
                </span>
              </div>
            ) : (
              currentAllocationRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={
                    contextRecommendationId === row.id ? "is-selected" : ""
                  }
                  onClick={() => setContextRecommendationId(row.id)}
                >
                  <span>
                    <strong>
                      {row.destination_branch_name} ← {row.source_branch_name}
                    </strong>
                    <small>
                      {row.vehicle_category_name} ·{" "}
                      {formatDay(row.target_week_start)}
                    </small>
                  </span>
                  <span
                    className={`admin-decision-recommendation-state is-${row.decision_state.toLowerCase()}`}
                  >
                    {row.decision_state}
                  </span>
                </button>
              ))
            )}
          </nav>

          <div className="admin-decision-transfer-detail">
            {selectedRecommendation ? (
              <>
                <div className="admin-decision-transfer-title">
                  <div>
                    <span>
                      <ArrowRightLeft aria-hidden="true" />
                    </span>
                    <div>
                      <h3>
                        Transfer{" "}
                        {selectedRecommendation.recommended_transfer_units}{" "}
                        {selectedRecommendation.vehicle_category_name} to{" "}
                        {selectedRecommendation.destination_branch_name}
                      </h3>
                      <p>
                        {selectedRecommendation.source_branch_name} →{" "}
                        {selectedRecommendation.destination_branch_name}
                      </p>
                    </div>
                  </div>
                  <Badge>{selectedRecommendation.decision_state}</Badge>
                </div>

                <dl className="admin-decision-transfer-evidence">
                  <div>
                    <dt>Destination shortage</dt>
                    <dd>
                      {selectedRecommendation.destination_shortage_snapshot}
                    </dd>
                  </div>
                  <div>
                    <dt>Source surplus</dt>
                    <dd>{selectedRecommendation.source_surplus_snapshot}</dd>
                  </div>
                  <div>
                    <dt>Recommended quantity</dt>
                    <dd>{selectedRecommendation.recommended_transfer_units}</dd>
                  </div>
                  <div>
                    <dt>Target week</dt>
                    <dd>
                      {formatDay(selectedRecommendation.target_week_start)}
                    </dd>
                  </div>
                </dl>

                <div className="admin-decision-candidates">
                  <h4>Eligible candidates</h4>
                  {selectedRecommendation.candidates.length ? (
                    <ol>
                      {selectedRecommendation.candidates.map((candidate) => (
                        <li key={candidate.id}>
                          <span>{candidate.candidate_rank}</span>
                          <div>
                            <strong>{candidate.vehicle_name_snapshot}</strong>
                            <small>
                              {candidate.license_plate_snapshot ??
                                "No plate recorded"}
                            </small>
                          </div>
                          <small>
                            {candidate.idle_days_snapshot == null
                              ? "Idle days unavailable"
                              : `${candidate.idle_days_snapshot} days idle`}
                          </small>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>No eligible candidate vehicles were persisted.</p>
                  )}
                </div>

                {!staffView ? (
                  <OperationalContextPanel
                    title="Current route context"
                    context={allocationContext}
                    loading={allocationContextLoading}
                    error={allocationContextError}
                    embedded
                    advisoryNote="Current review-time context is supplementary and is not part of the original allocation score."
                  />
                ) : null}

                {!staffView &&
                selectedRecommendation.decision_state === "Pending" ? (
                  <div className="admin-decision-review-actions">
                    <label>
                      <span>Approved quantity</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={selectedRecommendation.recommended_transfer_units}
                        value={approvedUnits}
                        onChange={(event) =>
                          setApprovedUnits(Number(event.target.value))
                        }
                      />
                    </label>
                    <Btn
                      variant="primary"
                      disabled={
                        allocationBusy ||
                        !Number.isInteger(approvedUnits) ||
                        approvedUnits < 1 ||
                        approvedUnits >
                          selectedRecommendation.recommended_transfer_units
                      }
                      onClick={() =>
                        void decideAllocation(
                          selectedRecommendation.id,
                          "Approved",
                          approvedUnits,
                        )
                      }
                    >
                      Approve {approvedUnits || ""}
                    </Btn>
                    <Btn
                      variant="danger"
                      disabled={allocationBusy}
                      onClick={() =>
                        void decideAllocation(
                          selectedRecommendation.id,
                          "Rejected",
                        )
                      }
                    >
                      Reject recommendation
                    </Btn>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="admin-decision-empty">
                <CircleDot aria-hidden="true" />
                <strong>Select a recommendation to review</strong>
                <span>
                  Its evidence, candidates, route context, and decision controls
                  will appear here.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
