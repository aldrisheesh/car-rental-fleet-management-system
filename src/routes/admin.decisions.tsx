import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { VehicleUtilizationScreen } from "@/components/admin/vehicle-utilization-screen";
import {
  reportingRangeError,
  currentUtilizationFleet,
  type VehicleAnalyticsRow,
} from "@/lib/utilization-workspace";
import { FleetAllocationScreen } from "@/components/admin/fleet-allocation-screen";
import {
  allocationGenerationBlock,
  allocationContextIdentity,
  automaticAllocationKey,
  filterAllocationRows,
  filterAllocationGaps,
  selectAllocationId,
  type AllocationSummary,
} from "@/lib/allocation-workspace";
import { buildFocusedForecastChart } from "@/lib/forecast-chart";
import { DemandForecastScreen } from "@/components/admin/demand-forecast-screen";
import { dssView, parseDssSearch } from "@/lib/dss-navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
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
import {
  AllocationReview,
  type AllocationReviewContext,
} from "@/components/admin/allocation-review";
import { selectedContext, type AllocationRow } from "@/lib/allocation-review";
import { Badge, Btn } from "@/components/admin/ui";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  buildWmaCalculation,
  forecastLabel,
  selectActionableForecasts,
  selectLatestForecasts,
  selectLatestSupplyEvaluations,
  selectCurrentRecommendations,
  supplyBalanceState,
  type CanonicalForecast,
  type CanonicalForecastRun,
  type CanonicalSupplyEvaluation,
} from "@/lib/admin-decisions";
import { formatWeekRange, weekEndFromStart } from "@/lib/planning-week";
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
  validateSearch: parseDssSearch,
  component: DecisionPage,
});

type ForecastResponse = {
  runs: CanonicalForecastRun[];
  forecasts: CanonicalForecast[];
  mape: number | null;
  accuracy?: {
    overallMape: number | null;
    eligibleForecasts: number;
    excludedZeroActuals: number;
    series: Array<{
      branchId: string;
      categoryId: string;
      mape: number;
      sampleSize: number;
    }>;
  };
  finalizableForecasts?: number;
};

type SupplyResponse = { evaluations: CanonicalSupplyEvaluation[] };
type VehicleAnalyticsResponse = { vehicles: VehicleAnalyticsRow[] };
type AllocationResponse = {
  recommendations?: AllocationRow[];
  summary?: AllocationSummary;
};

async function readApi<T>(input: RequestInfo | URL, init?: RequestInit) {
  // Bound read waits; mutations retain their server-side idempotent workflow.
  const timeout =
    !init?.method || init.method === "GET" ? AbortSignal.timeout(30_000) : null;
  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    signal: timeout
      ? init?.signal
        ? AbortSignal.any([init.signal, timeout])
        : timeout
      : init?.signal,
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

function formatDecimal(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function unresolvedShortageCopy(
  reason: AllocationSummary["unresolvedShortages"][number]["reason"],
) {
  if (reason === "NoCompatibleSurplus")
    return "No other branch has surplus in the same category, week, and forecast horizon.";
  if (reason === "NoEligibleCandidates")
    return "A compatible surplus exists, but every candidate is blocked by a booking, rental, maintenance, or inactive state.";
  if (reason === "InsufficientEligibleCandidates")
    return "Some units can be covered, but too few eligible vehicles remain for the full shortage.";
  return "Compatible capacity was already committed to a higher-priority shortage in this recommendation batch.";
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
    behavior:
      document.documentElement.dataset.inputModality === "keyboard" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    block: "start",
  });
  target.focus({ preventScroll: true });
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
  const location = useRouterState({
    select: (state) => state.resolvedLocation ?? state.location,
  });
  const view = dssView(location.pathname, location.hash);
  const isForecast = view === "forecast";
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  function openAllocation(row?: CanonicalForecast) {
    if (row) {
      setSelectedBranchId(row.branch_id);
      setSelectedCategoryId(row.vehicle_category_id);
      setBalanceWeek(row.target_week_start);
    }
    void navigate({
      to: "/admin/decisions/allocation",
      search: {
        branch: row?.branch_id ?? selectedBranchId,
        category: row?.vehicle_category_id ?? selectedCategoryId,
        week: row?.target_week_start ?? balanceWeek,
        recommendation: row ? undefined : search.recommendation,
      },
    });
  }

  const session = getAdminSession();
  const staffView = isStaffRole(session?.role);
  const analyticsRange = useMemo(() => {
    const today = dayKey(new Date());
    if (
      search.start &&
      search.end &&
      !reportingRangeError(search.start, search.end, today)
    )
      return { start: search.start, end: search.end };
    return { start: addDays(today, -29), end: today };
  }, [search.start, search.end]);

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
  const [vehicleRefreshing, setVehicleRefreshing] = useState(false);
  const [vehicleRefreshError, setVehicleRefreshError] = useState("");
  const vehicleSnapshotRange = useRef<string | null>(null);
  const [vehicleLoadedAt, setVehicleLoadedAt] = useState<string | null>(null);
  const [vehicleRefreshVersion, setVehicleRefreshVersion] = useState(0);
  const [supportVersion, setSupportVersion] = useState(0);
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>([]);
  const [allocationSummary, setAllocationSummary] =
    useState<AllocationSummary | null>(null);
  const [allocationReloadVersion, setAllocationReloadVersion] = useState(0);
  const [allocationLoading, setAllocationLoading] = useState(true);
  const [allocationError, setAllocationError] = useState("");
  const [allocationBusy, setAllocationBusy] = useState(false);
  const [contextRecommendationId, setContextRecommendationId] = useState(
    search.recommendation ?? "",
  );
  const [allocationContext, setAllocationContext] =
    useState<AllocationReviewContext | null>(null);
  const [allocationContextId, setAllocationContextId] = useState("");
  const [allocationContextLoading, setAllocationContextLoading] =
    useState(false);
  const [allocationContextError, setAllocationContextError] = useState("");
  const [allocationContextVersion, setAllocationContextVersion] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState(
    search.branch ?? "all",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    search.category ?? "",
  );
  const [balanceWeek, setBalanceWeek] = useState(search.week ?? "");
  useEffect(() => {
    setSelectedBranchId(search.branch ?? "all");
    setSelectedCategoryId(search.category ?? "");
    // An omitted URL week keeps the resolved selection instead of reopening
    // the allocation filters to every week while the select displays one.
    setBalanceWeek((current) => search.week ?? current);
  }, [search.branch, search.category, search.week]);
  function chooseBranch(branch: string) {
    setSelectedBranchId(branch);
    void navigate({
      to: isForecast ? "/admin/decisions/forecast" : "/admin/decisions",
      search: (previous) => ({
        ...previous,
        branch,
        category: selectedCategoryId || undefined,
      }),
      replace: true,
    });
  }
  function chooseCategory(category: string) {
    setSelectedCategoryId(category);
    void navigate({
      to: isForecast ? "/admin/decisions/forecast" : "/admin/decisions",
      search: (previous) => ({
        ...previous,
        branch: selectedBranchId,
        category,
      }),
      replace: true,
    });
  }

  const synchronizedSupplyRuns = useRef(new Set<string>());
  const requestedForecast = useRef(false);
  const generatedAllocationRuns = useRef(new Set<string>());
  const hasForecastSnapshot = useRef(false);
  const hasSupplySnapshot = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const initialForecastLoad = !hasForecastSnapshot.current;
    if (initialForecastLoad) setForecastLoading(true);
    if (!hasSupplySnapshot.current) setSupplyLoading(true);

    setForecastError("");
    setSupplyError("");

    void readApi<ForecastResponse>("/api/forecasts", {
      signal: controller.signal,
    })
      .then((body) => {
        if (controller.signal.aborted) return;
        setForecastData(body);
        hasForecastSnapshot.current = true;
        setForecastError("");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (!hasForecastSnapshot.current) setForecastData(null);
        setForecastError(
          errorMessage(error, "Unable to load canonical forecasts."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted && initialForecastLoad)
          setForecastLoading(false);
      });

    void readApi<SupplyResponse>("/api/supply-evaluations", {
      signal: controller.signal,
    })
      .then((body) => {
        if (controller.signal.aborted) return;
        hasSupplySnapshot.current = true;
        setSupplyEvaluations(body.evaluations ?? []);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setSupplyEvaluations([]);
        setSupplyError(
          errorMessage(error, "Unable to load canonical supply evaluations."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setSupplyLoading(false);
      });

    return () => controller.abort();
  }, [supportVersion]);

  useEffect(() => {
    if (view !== "utilization" && view !== "overview") return;
    const controller = new AbortController();
    const rangeKey = `${analyticsRange.start}:${analyticsRange.end}`;
    const hasCurrentSnapshot = vehicleSnapshotRange.current === rangeKey;
    setVehicleLoading(!hasCurrentSnapshot);
    setVehicleRefreshing(true);
    setVehicleRefreshError("");
    setVehicleError("");
    readApi<VehicleAnalyticsResponse>(
      `/api/vehicle-analytics?start=${analyticsRange.start}&end=${analyticsRange.end}`,
      { signal: controller.signal },
    )
      .then((body) => {
        if (controller.signal.aborted) return;
        setVehicleAnalytics(currentUtilizationFleet(body.vehicles ?? []));
        vehicleSnapshotRange.current = rangeKey;
        setVehicleLoadedAt(new Date().toISOString());
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (hasCurrentSnapshot) {
          setVehicleRefreshError(
            "Activity could not be updated. Showing the last successful results; try Refresh activity again.",
          );
        } else {
          setVehicleAnalytics([]);
          setVehicleError(
            errorMessage(error, "Unable to load vehicle analytics."),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setVehicleLoading(false);
          setVehicleRefreshing(false);
        }
      });
    return () => controller.abort();
  }, [
    analyticsRange.start,
    analyticsRange.end,
    vehicleRefreshVersion,
    supportVersion,
    view,
  ]);

  useEffect(() => {
    let active = true;
    setAllocationLoading(true);
    setAllocationError("");
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
      })
      .finally(() => {
        if (active) setAllocationLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allocationReloadVersion]);

  useEffect(() => {
    if (staffView || !contextRecommendationId) {
      setAllocationContext(null);
      setAllocationContextError("");
      setAllocationContextLoading(false);
      return;
    }
    const controller = new AbortController();
    setAllocationContext(null);
    setAllocationContextId("");
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
        if (controller.signal.aborted) return;
        setAllocationContextId(
          `${contextRecommendationId}:${allocationContextVersion}`,
        );
        setAllocationContext(body);
        setAllocationContextLoading(false);
      })
      .catch((error) => {
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        )
          return;
        setAllocationContext(null);
        setAllocationContextId(
          `${contextRecommendationId}:${allocationContextVersion}`,
        );
        setAllocationContextError(
          "Operational context could not be verified. Retry the check or acknowledge the missing evidence before recording a decision.",
        );
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

  async function finalizeForecasts() {
    setForecastBusy(true);
    setForecastError("");
    setForecastNotice("");
    try {
      const body = await readApi<{ finalized: number }>("/api/forecasts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "finalize" }),
      });
      setForecastNotice(
        body.finalized
          ? `${body.finalized} completed forecast${body.finalized === 1 ? " was" : "s were"} finalized against actual demand.`
          : "No completed forecasts were waiting for finalization.",
      );
      setSupportVersion((version) => version + 1);
    } catch (error) {
      setForecastError(
        errorMessage(error, "Unable to finalize completed forecasts."),
      );
    } finally {
      setForecastBusy(false);
    }
  }

  async function evaluateSupply(
    forecastIds: string[],
    idempotencyKey: string = crypto.randomUUID(),
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
    idempotencyKey: string = crypto.randomUUID(),
  ): Promise<boolean> {
    setAllocationBusy(true);
    setAllocationError("");
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
    reason?: string,
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
            reason,
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
  const actionableForecastRows = selectActionableForecasts(
    forecastRows,
    dayKey(new Date()),
  );
  const forecastById = new Map(
    (forecastData?.forecasts ?? []).map((forecast) => [forecast.id, forecast]),
  );
  const supplyRows = selectLatestSupplyEvaluations(supplyEvaluations);
  const supplyByForecastId = new Map(
    supplyRows.map((evaluation) => [evaluation.forecast_id, evaluation]),
  );
  const latestForecastIds = new Set(
    actionableForecastRows.map((row) => row.id),
  );
  const currentSupplyRows = supplyRows.filter((evaluation) =>
    latestForecastIds.has(evaluation.forecast_id),
  );
  const evaluatedForecastIds = new Set(
    supplyRows.map((evaluation) => evaluation.forecast_id),
  );
  const unevaluatedForecasts = actionableForecastRows.filter(
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

  const allocationSnapshotIdentity = allocationContextIdentity(
    latestRun?.id ?? "",
    currentSupplyRows.map((row) => row.id),
  );

  const currentAllocationRows = selectCurrentRecommendations(
    allocationRows,
    currentSupplyRows,
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
  const allocationReviewRows =
    view === "allocation"
      ? filterAllocationRows(
          currentAllocationRows,
          actionableForecastRows,
          currentSupplyRows,
          balanceWeek,
          selectedCategoryId,
        )
      : currentAllocationRows;
  const selectedRecommendation =
    allocationReviewRows.find((row) => row.id === contextRecommendationId) ??
    null;

  function selectRecommendation(row: AllocationRow) {
    setContextRecommendationId(row.id);
    setBalanceWeek(row.target_week_start);
    const evaluation = supplyRows.find(
      (item) => item.id === row.destination_supply_evaluation_id,
    );
    const forecast = evaluation
      ? forecastById.get(evaluation.forecast_id)
      : undefined;
    if (forecast) {
      setSelectedBranchId(forecast.branch_id);
      setSelectedCategoryId(forecast.vehicle_category_id);
    }
    void navigate({
      to:
        view === "allocation"
          ? "/admin/decisions/allocation"
          : "/admin/decisions",
      search: (previous) => ({
        ...previous,
        branch: forecast?.branch_id ?? selectedBranchId,
        category: forecast?.vehicle_category_id ?? selectedCategoryId,
        week: row.target_week_start,
        recommendation: row.id,
      }),
      replace: true,
      resetScroll: false,
    });
  }
  const reviewContext = selectedContext(
    `${contextRecommendationId}:${allocationContextVersion}`,
    allocationContextId,
    allocationContext,
  );
  const reviewContextLoading =
    !!selectedRecommendation &&
    (allocationContextLoading ||
      allocationContextId !==
        `${contextRecommendationId}:${allocationContextVersion}`);

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
    ...new Set(actionableForecastRows.map((row) => row.target_week_start)),
  ];
  const focusedForecastRows = forecastRows.filter(
    (row) =>
      row.vehicle_category_id === selectedCategoryId &&
      (selectedBranchId === "all" || row.branch_id === selectedBranchId),
  );
  const focusedForecast = buildFocusedForecastChart(
    focusedForecastRows,
    forecastData?.forecasts ?? [],
    forecastData?.runs ?? [],
  );
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
  const focusedWmaForecast =
    focusedForecastRows.find((row) => row.target_week_start === balanceWeek) ??
    focusedForecastRows[0];
  const focusedWmaCalculation = focusedWmaForecast
    ? buildWmaCalculation(focusedWmaForecast)
    : null;
  const visibleSupplyForecasts = actionableForecastRows.filter(
    (row) => !balanceWeek || row.target_week_start === balanceWeek,
  );
  const supplyWeekSummaries = weekOptions.map((week) => {
    const rows = actionableForecastRows.filter(
      (row) => row.target_week_start === week,
    );
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
      current && forecastRows.some((row) => row.vehicle_category_id === current)
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
      view === "allocation" &&
      forecastRows.some((row) => row.vehicle_category_id === selectedCategoryId)
    )
      return;
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
  }, [selectedBranchId, selectedCategoryId, forecastData, view]);

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
      actionableForecastRows.length ||
      requestedForecast.current
    )
      return;
    requestedForecast.current = true;
    void generateForecast();
  }, [actionableForecastRows.length, forecastBusy, forecastLoading, staffView]);

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
    );
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
      allocationLoading ||
      allocationBusy ||
      !latestRun ||
      unevaluatedForecasts.length ||
      !shortageEvaluations.length ||
      !surplusEvaluations.length ||
      currentAllocationRows.length ||
      pendingAllocations.length ||
      generatedAllocationRuns.current.has(allocationSnapshotIdentity)
    )
      return;
    // One automatic attempt per exact supply snapshot. Failures remain visible
    // until the admin retries; clearing the guard would create a request loop.
    generatedAllocationRuns.current.add(allocationSnapshotIdentity);
    void automaticAllocationKey(allocationSnapshotIdentity).then(
      generateAllocations,
    );
  }, [
    allocationSnapshotIdentity,
    allocationBusy,
    allocationLoading,
    currentAllocationRows.length,
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
      selectAllocationId(allocationReviewRows, search.recommendation, current),
    );
  }, [allocationReviewRows, search.recommendation]);

  const allCategories = [
    ...new Map(
      forecastRows.map((row) => [
        row.vehicle_category_id,
        row.category?.name ?? row.vehicle_category_id,
      ]),
    ),
  ].map(([id, name]) => ({ id, name }));
  const decisionTrace = [
    {
      label: "Demand history",
      detail: focusedWmaCalculation
        ? `${focusedWmaCalculation.terms.length} complete weekly observations loaded`
        : "Select a forecast series to inspect its history",
    },
    {
      label: "WMA forecast",
      detail: focusedWmaCalculation
        ? `0.20 / 0.30 / 0.50 → ${formatDecimal(focusedWmaCalculation.forecastDemand)} demand, ${focusedWmaCalculation.requiredVehicles} required`
        : "Waiting for a current forecast",
    },
    {
      label: "Supply readiness",
      detail: currentSupplyRows.length
        ? `${currentSupplyRows.length} current branch/category snapshots`
        : "Waiting for current supply snapshots",
    },
    {
      label: "Fleet matching",
      detail: allocationSummary
        ? `${allocationSummary.generatedRecommendations} recommendation${allocationSummary.generatedRecommendations === 1 ? "" : "s"}; ${allocationSummary.unresolvedShortages.length} unresolved position${allocationSummary.unresolvedShortages.length === 1 ? "" : "s"}`
        : "Waiting for allocation evidence",
    },
    {
      label: "External context",
      detail: selectedRecommendation
        ? reviewContextLoading
          ? "Checking current weather, road, route, and fuel context"
          : reviewContext
            ? `${reviewContext.status.replaceAll("_", " ")} review-time context`
            : "Select or refresh the recommendation context"
        : "Available when a transfer recommendation is reviewed",
    },
    {
      label: "Human decision",
      detail: selectedRecommendation
        ? `${selectedRecommendation.decision_state}; no vehicle branch changes automatically`
        : "No recommendation currently requires a decision",
    },
  ];

  const forecastChart = (
    <>
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
        <div className="forecast-plot">
          <div className="forecast-plot-key">
            <span>Rental demand</span>
            <div>
              <span>
                <i />
                Recorded
              </span>
              <span>
                <i className="is-predicted" />
                Forecast
              </span>
            </div>
          </div>
          <div className="forecast-plot-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                accessibilityLayer
                data={focusedForecastChart}
                margin={{ top: 20, right: 32, bottom: 12, left: 8 }}
              >
                <CartesianGrid
                  stroke="#e6ebe7"
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="d"
                  tickFormatter={formatChartDay}
                  tick={{ fill: "#52635f", fontSize: 12 }}
                  axisLine={{ stroke: "#d7e0db" }}
                  tickLine={false}
                  tickMargin={12}
                  padding={{ left: 12, right: 12 }}
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fill: "#52635f", fontSize: 12 }}
                  tickFormatter={formatQuantity}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tickMargin={10}
                  domain={[0, (maximum: number) => Math.max(1, maximum * 1.2)]}
                  tickCount={5}
                  allowDecimals
                />
                <Tooltip
                  cursor={{ stroke: "#97b4a8", strokeDasharray: "3 5" }}
                  content={({ active, label }) => {
                    if (!active) return null;
                    const point = focusedForecastChart.find(
                      (item) => item.d === String(label),
                    );
                    if (!point) return null;
                    return (
                      <div className="forecast-plot-tooltip">
                        <strong>
                          Week of {formatWeekRange(point.d, point.weekEnd)}
                        </strong>
                        {focusedForecastSeries.map((series) => (
                          <div key={series.branchId} style={{ marginTop: 10 }}>
                            <strong style={{ color: series.color }}>
                              {series.label}
                            </strong>
                            <div>
                              Actual demand:{" "}
                              {Number.isFinite(point[series.actualKey])
                                ? formatQuantity(
                                    Number(point[series.actualKey]),
                                  )
                                : "Not available yet"}
                            </div>
                            <div>
                              Forecast:{" "}
                              {Number.isFinite(point[series.forecastKey])
                                ? formatQuantity(
                                    Number(point[series.forecastKey]),
                                  )
                                : "No saved forecast available"}
                            </div>
                            {point[`kind-${series.branchId}`] ? (
                              <div>{point[`kind-${series.branchId}`]}</div>
                            ) : null}
                            {point[`generated-${series.branchId}`] ? (
                              <div>
                                Saved{" "}
                                {formatDateTime(
                                  String(point[`generated-${series.branchId}`]),
                                )}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                {focusedForecastStart ? (
                  <ReferenceArea
                    x1={focusedForecastStart}
                    x2={focusedForecastChart.at(-1)?.d}
                    fill="#eef5f1"
                    fillOpacity={0.8}
                    strokeOpacity={0}
                  />
                ) : null}
                {focusedForecastStart ? (
                  <ReferenceLine
                    x={focusedForecastStart}
                    stroke="#a4beb1"
                    strokeDasharray="3 5"
                  />
                ) : null}
                {balanceWeek &&
                balanceWeek !== focusedForecastStart &&
                focusedForecastRows.some(
                  (row) => row.target_week_start === balanceWeek,
                ) ? (
                  <ReferenceLine
                    x={balanceWeek}
                    stroke="#52635f"
                    strokeDasharray="2 5"
                  />
                ) : null}
                {focusedForecastSeries.flatMap((series) => [
                  <Line
                    key={`${series.branchId}-connector`}
                    type="linear"
                    dataKey={series.connectorKey}
                    stroke={series.color}
                    strokeWidth={2}
                    strokeDasharray="7 6"
                    dot={false}
                    activeDot={false}
                    tooltipType="none"
                    legendType="none"
                    connectNulls={false}
                    isAnimationActive={false}
                  />,
                  <Line
                    key={`${series.branchId}-actual`}
                    type="linear"
                    dataKey={series.actualKey}
                    name={`${series.label} — actual weekly demand`}
                    stroke={series.color}
                    strokeWidth={2.5}
                    dot={{
                      r: 4,
                      fill: series.color,
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />,
                  <Line
                    key={`${series.branchId}-forecast`}
                    type="linear"
                    dataKey={series.forecastKey}
                    name={`${series.label} — weekly WMA forecast`}
                    stroke={series.color}
                    strokeWidth={2.5}
                    strokeDasharray="7 6"
                    dot={{
                      r: 4,
                      fill: "#fff",
                      stroke: series.color,
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#fff",
                      stroke: series.color,
                      strokeWidth: 2,
                    }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />,
                ])}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
  const forecastCalculation =
    focusedWmaForecast && focusedWmaCalculation ? (
      <section
        className="admin-decision-calculation"
        aria-labelledby="forecast-calculation-heading"
      >
        <header>
          <div>
            <span>Calculation example</span>
            <h3 id="forecast-calculation-heading">
              {forecastLabel(focusedWmaForecast)}
            </h3>
          </div>
          <small>
            Planning week{" "}
            {formatWeekRange(
              focusedWmaForecast.target_week_start,
              focusedWmaForecast.target_week_end,
            )}
          </small>
        </header>
        <div className="admin-decision-calculation-table" role="table">
          <div className="is-heading" role="row">
            <span role="columnheader">Week used</span>
            <span role="columnheader">Rental demand</span>
            <span role="columnheader">Importance</span>
            <span role="columnheader">Added to estimate</span>
          </div>
          {focusedWmaCalculation.terms.map((term) => (
            <div
              role="row"
              key={`${term.sourceType}-${term.sourceWeekStart}-${term.weight}`}
            >
              <span role="cell">
                {formatDay(term.sourceWeekStart)} ·{" "}
                {term.sourceType === "Actual" ? "Recorded" : "Estimated"}
              </span>
              <strong role="cell">{formatDecimal(term.sourceValue)}</strong>
              <strong role="cell">{formatDecimal(term.weight * 100)}%</strong>
              <strong role="cell">
                {formatDecimal(term.weightedContribution)}
              </strong>
            </div>
          ))}
        </div>
        <div className="admin-decision-calculation-result">
          <code>
            {focusedWmaCalculation.terms
              .map(
                (term) =>
                  `${formatDecimal(term.weight)} × ${formatDecimal(term.sourceValue)}`,
              )
              .join(" + ")}
            {` = ${formatDecimal(focusedWmaCalculation.forecastDemand)}`}
          </code>
          <p>
            Estimated rental demand:{" "}
            {formatDecimal(focusedWmaCalculation.forecastDemand)}. Rounded up,
            plan for{" "}
            <strong>
              {focusedWmaCalculation.requiredVehicles}{" "}
              {focusedWmaCalculation.requiredVehicles === 1
                ? "vehicle"
                : "vehicles"}
            </strong>
            .
          </p>
          <small>
            This is a weekly planning estimate. Review bookings before arranging
            a vehicle transfer.
          </small>
        </div>
      </section>
    ) : null;

  const transferReview = selectedRecommendation ? (
    <AllocationReview
      key={selectedRecommendation.id}
      recommendation={selectedRecommendation}
      context={reviewContext}
      contextLoading={reviewContextLoading}
      contextKey={`${contextRecommendationId}:${allocationContextVersion}`}
      contextError={
        allocationContextId ===
        `${contextRecommendationId}:${allocationContextVersion}`
          ? allocationContextError
          : ""
      }
      busy={allocationBusy || allocationLoading || supplyBusy || supplyLoading}
      readOnly={staffView}
      onRefreshContext={() =>
        setAllocationContextVersion((version) => version + 1)
      }
      onDecision={decideAllocation}
      reviewSearch={{
        branch: selectedBranchId,
        category: selectedCategoryId,
        week: balanceWeek,
        recommendation: selectedRecommendation.id,
      }}
    />
  ) : null;

  const allocationErrorMessage =
    forecastError || supplyError || allocationError;
  const allocationLoadingState =
    forecastLoading || supplyLoading || allocationLoading;
  const allocationBusyState = forecastBusy || supplyBusy || allocationBusy;
  const allocationBlock = allocationGenerationBlock({
    loading: allocationLoadingState,
    busy: allocationBusyState,
    readOnly: staffView,
    error: !!allocationErrorMessage,
    forecasts: actionableForecastRows.length,
    unevaluated: unevaluatedForecasts.length,
    shortages: shortageEvaluations.length,
    surpluses: surplusEvaluations.length,
  });
  function chooseAllocationFilters(week: string, category: string) {
    setBalanceWeek(week);
    setSelectedCategoryId(category);
    void navigate({
      to: "/admin/decisions/allocation",
      search: (previous) => ({
        ...previous,
        week,
        category,
        recommendation: undefined,
      }),
      replace: true,
    });
  }

  return (
    <div className={`admin-decision-workspace dss-view-${view}`}>
      <header className="admin-decision-heading">
        <div>
          <h1>
            {isForecast
              ? "Demand Forecast"
              : view === "allocation"
                ? "Fleet Allocation"
                : view === "utilization"
                  ? "Vehicle Utilization"
                  : "Decision support"}
          </h1>
          <p>
            {isForecast
              ? "Estimate rental demand and plan vehicle needs."
              : view === "allocation"
                ? "See which branches need vehicles and review possible transfers."
                : view === "utilization"
                  ? "Review rental activity and vehicles needing attention."
                  : "Forecast demand, identify shortages, and review fleet moves."}
          </p>
        </div>
        <div className="admin-decision-advisory" role="note">
          <Info aria-hidden="true" />
          <span>
            <strong>Advisory only</strong> — every recommendation requires human
            review.
          </span>
        </div>
      </header>

      {isForecast ? (
        <DemandForecastScreen
          week={balanceWeek}
          onWeek={(week) => {
            setBalanceWeek(week);
            void navigate({
              to: "/admin/decisions/forecast",
              search: (previous) => ({ ...previous, week }),
              replace: true,
            });
          }}
          branch={selectedBranchId}
          category={selectedCategoryId}
          branches={branchOptions}
          categories={categoryOptions}
          rows={focusedForecastRows}
          runs={forecastData?.runs ?? []}
          latestRunId={latestRun?.id}
          loading={forecastLoading}
          busy={forecastBusy}
          error={forecastError}
          notice={forecastNotice}
          mape={forecastData?.mape ?? null}
          eligible={forecastData?.accuracy?.eligibleForecasts}
          excluded={forecastData?.accuracy?.excludedZeroActuals}
          finalizable={forecastData?.finalizableForecasts ?? 0}
          chart={forecastChart}
          calculation={forecastCalculation}
          legend={
            <>
              <strong>{focusedForecastLabel}</strong>
              {focusedForecastSeries.map((series) => (
                <span key={series.branchId}>
                  <i style={{ background: series.color }} />
                  {series.label}
                </span>
              ))}
              <small>
                Historical forecasts use saved horizon-1 values. Missing values
                remain blank. The dashed connector links the last actual to the
                latest outlook.
                {focusedForecast.hasSimulatedHistory
                  ? " Historical forecasts in this demo are simulated."
                  : ""}
              </small>
              {focusedForecastStart && focusedForecastEnd ? (
                <small>
                  Shaded area: latest outlook ·{" "}
                  {formatWeekRange(focusedForecastStart, focusedForecastEnd)}
                  {balanceWeek
                    ? ` · Selected week: ${formatChartDay(balanceWeek)}`
                    : ""}
                </small>
              ) : null}
            </>
          }
          formatDateTime={formatDateTime}
          formatQuantity={formatQuantity}
          onBranch={chooseBranch}
          onCategory={chooseCategory}
          onGenerate={() => void generateForecast()}
          onFinalize={() => void finalizeForecasts()}
          onReload={() => setSupportVersion((version) => version + 1)}
          onAllocation={openAllocation}
        />
      ) : null}
      {view === "allocation" ? (
        <FleetAllocationScreen
          week={balanceWeek}
          category={selectedCategoryId}
          weeks={weekOptions}
          categories={allCategories}
          branches={branchOptions}
          forecasts={actionableForecastRows}
          evaluations={currentSupplyRows}
          rows={allocationReviewRows}
          history={allocationRows}
          selected={selectedRecommendation}
          gaps={filterAllocationGaps(
            allocationSummary?.unresolvedShortages ?? [],
            currentSupplyRows,
            balanceWeek,
            selectedCategoryId,
          )}
          review={transferReview}
          loading={allocationLoadingState}
          busy={allocationBusyState}
          error={allocationErrorMessage}
          generationBlock={allocationBlock}
          forecastCount={actionableForecastRows.length}
          evaluatedCount={currentSupplyRows.length}
          refreshDisabled={
            staffView ||
            allocationLoadingState ||
            allocationBusyState ||
            !actionableForecastRows.length ||
            !!forecastError
          }
          formatQuantity={formatQuantity}
          formatDateTime={formatDateTime}
          gapCopy={unresolvedShortageCopy}
          onFilter={chooseAllocationFilters}
          onSelect={selectRecommendation}
          onRefresh={() =>
            void evaluateSupply(actionableForecastRows.map((row) => row.id))
          }
          onReload={() => {
            setSupportVersion((version) => version + 1);
            setAllocationReloadVersion((version) => version + 1);
          }}
          onGenerate={() => {
            if (!allocationBlock) void generateAllocations();
          }}
          onForecast={() =>
            void navigate({ to: "/admin/decisions/forecast", search: true })
          }
        />
      ) : null}
      {view === "utilization" ? (
        <VehicleUtilizationScreen
          key={`${analyticsRange.start}:${analyticsRange.end}`}
          rows={vehicleAnalytics}
          loading={
            vehicleLoading ||
            vehicleAnalytics.some(
              (row) =>
                row.reportingStart !== analyticsRange.start ||
                row.reportingEnd !== analyticsRange.end,
            )
          }
          error={vehicleError}
          refreshing={vehicleRefreshing}
          refreshError={vehicleRefreshError}
          loadedAt={vehicleLoadedAt}
          range={analyticsRange}
          search={search}
          formatDateTime={formatDateTime}
          onRefresh={() => setVehicleRefreshVersion((value) => value + 1)}
          onContext={(context) => {
            void navigate({
              to: "/admin/decisions/utilization",
              search: (previous) => ({ ...previous, ...context }),
              replace: true,
              resetScroll: false,
            });
          }}
          onAllocation={(row) => {
            void navigate({
              to: "/admin/decisions/allocation",
              search: {
                branch: row?.branchId ?? search.utilBranch ?? "all",
                category:
                  row?.categoryId ??
                  (search.utilCategory === "all"
                    ? undefined
                    : search.utilCategory),
                week: balanceWeek,
                recommendation: undefined,
              },
            });
          }}
        />
      ) : null}
      {view === "overview" ? (
        <>
          <section
            className="admin-decision-trace"
            aria-labelledby="decision-trace-heading"
          >
            <header>
              <strong id="decision-trace-heading">
                Auditable decision trace
              </strong>
              <span>
                The forecast figures describe the selected chart series. Each
                transfer has its own saved supply snapshots in the review below.
              </span>
            </header>
            <ol>
              {decisionTrace.map((stage, index) => (
                <li key={stage.label}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>
                    <strong>{stage.label}</strong>
                    <small>{stage.detail}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

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
                  {!staffView ? (
                    <Btn
                      variant="default"
                      disabled={forecastBusy}
                      onClick={() => void generateForecast()}
                    >
                      {forecastBusy ? "Working…" : "Generate new forecast"}
                    </Btn>
                  ) : null}
                  <label>
                    <span>Branch</span>
                    <select
                      value={selectedBranchId}
                      onChange={(event) =>
                        setSelectedBranchId(event.target.value)
                      }
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

              <div className="admin-decision-chart">{forecastChart}</div>
              {forecastCalculation}
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
                    Forecast horizon:{" "}
                    {formatWeekRange(focusedForecastStart, focusedForecastEnd)}
                  </small>
                ) : null}
                {forecastData?.mape == null ? (
                  <small>
                    Accuracy becomes available after actual demand is finalized.
                  </small>
                ) : (
                  <small>
                    Finalized horizon-1 MAPE: {formatPercent(forecastData.mape)}{" "}
                    · {forecastData.accuracy?.eligibleForecasts ?? 0} eligible
                    observation
                    {forecastData.accuracy?.eligibleForecasts === 1 ? "" : "s"}
                  </small>
                )}
                {!staffView && (forecastData?.finalizableForecasts ?? 0) > 0 ? (
                  <Btn
                    variant="default"
                    disabled={forecastBusy}
                    onClick={() => void finalizeForecasts()}
                  >
                    Finalize {forecastData?.finalizableForecasts} completed
                  </Btn>
                ) : null}
              </footer>
              <details className="admin-transfer-evidence admin-forecast-accuracy">
                <summary>Forecast accuracy scope and exclusions</summary>
                <p>
                  MAPE uses finalized horizon-1 forecasts with nonzero actual
                  weekly demand across all eligible branch/category series,
                  rather than only the chart selection. It does not measure
                  transfer quality or verify real-world accuracy from synthetic
                  records.
                </p>
                <p>
                  {forecastData?.accuracy?.eligibleForecasts ?? "Unavailable"}{" "}
                  eligible observations;{" "}
                  {forecastData?.accuracy?.excludedZeroActuals ?? "Unavailable"}{" "}
                  zero-actual observations excluded. Later recursive horizons
                  and unfinished weeks are not included in this horizon-1
                  metric.
                </p>
              </details>
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
                    actionLabel={
                      forecastBusy ? "Generating…" : "Generate forecast"
                    }
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
                      selectRecommendation(row);
                      window.setTimeout(
                        () => scrollToSection("selected-transfer-review"),
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
                !allocationLoading &&
                !allocationError &&
                shortageEvaluations.length &&
                surplusEvaluations.length ? (
                  <DecisionBriefItem
                    tone="attention"
                    icon={ArrowRightLeft}
                    title="Generate transfer recommendations"
                    detail={`${shortageEvaluations.length} shortage${shortageEvaluations.length === 1 ? "" : "s"} and ${surplusEvaluations.length} surplus position${surplusEvaluations.length === 1 ? "" : "s"} are ready to compare.`}
                    basis="The generator only pairs matching categories and eligible vehicles."
                    actionLabel={
                      allocationBusy
                        ? "Generating…"
                        : "Generate recommendations"
                    }
                    disabled={allocationBusy || allocationLoading || staffView}
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
              {forecastNotice || forecastError || allocationError ? (
                <div
                  className={`admin-decision-brief-feedback ${forecastError || allocationError ? "is-error" : ""}`}
                  role={forecastError || allocationError ? "alert" : "status"}
                  aria-live="polite"
                >
                  {forecastError || allocationError || forecastNotice}
                </div>
              ) : null}
            </aside>
          </div>
        </>
      ) : null}
      {view === "overview" ? (
        <>
          <section
            id="branch-balance"
            tabIndex={-1}
            className="admin-decision-panel admin-decision-balance"
            aria-labelledby="branch-balance-heading"
          >
            <header className="admin-decision-panel-heading">
              <div>
                <h2 id="branch-balance-heading">Branch balance</h2>
                <p>
                  Required and projected vehicles for the selected target week.
                </p>
              </div>
              <div className="admin-decision-balance-controls">
                <div
                  className="admin-decision-legend"
                  aria-label="Balance states"
                >
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
                    onChange={(event) => {
                      setBalanceWeek(event.target.value);
                      void navigate({
                        search: (previous) => ({
                          ...previous,
                          week: event.target.value,
                        }),
                        replace: true,
                      });
                    }}
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
        </>
      ) : null}
      {view === "overview" ? (
        <>
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
                  Canonical idle classifications and the lowest utilization
                  values from the selected reporting period.
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
                          <small>
                            {row.licensePlate ?? "No plate recorded"}
                          </small>
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
        </>
      ) : null}
      {view === "overview" ? (
        <>
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
              <div className="flex flex-wrap items-center gap-2">
                <Badge>
                  {supplyLoading || supplyBusy
                    ? "Synchronizing…"
                    : `${currentSupplyRows.length}/${actionableForecastRows.length} ready`}
                </Badge>
                {!staffView && actionableForecastRows.length ? (
                  <Btn
                    variant="default"
                    disabled={supplyBusy || forecastBusy}
                    onClick={() =>
                      void evaluateSupply(
                        actionableForecastRows.map((forecast) => forecast.id),
                      )
                    }
                  >
                    {supplyBusy ? "Evaluating…" : "Refresh supply"}
                  </Btn>
                ) : null}
              </div>
            </header>
            {supplyError ? (
              <p className="admin-decision-feedback is-error" role="alert">
                {supplyError}
              </p>
            ) : null}
            <div className="admin-decision-supply-summary" aria-live="polite">
              {supplyWeekSummaries.map((summary) => {
                const isReady = summary.evaluated === summary.total;
                const hasImbalance =
                  summary.shortageCount || summary.surplusCount;
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
                <p>
                  Review one saved match at a time. Generating recommendations
                  creates a new analysis batch; it does not move vehicles.
                </p>
              </div>
              {!staffView ? (
                <div className="flex flex-wrap gap-2">
                  <Btn
                    disabled={allocationLoading || allocationBusy || supplyBusy}
                    onClick={() => {
                      setSupportVersion((version) => version + 1);
                      setAllocationReloadVersion((version) => version + 1);
                    }}
                  >
                    Reload saved analysis
                  </Btn>
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
                      : "Generate recommendations"}
                  </Btn>
                </div>
              ) : (
                <Badge>Read only</Badge>
              )}
            </header>
            <p className="admin-transfer-coverage">
              Analysis coverage: {currentSupplyRows.length} evaluated
              branch/category/week positions; {unevaluatedForecasts.length}{" "}
              awaiting supply evaluation. {currentAllocationRows.length} current
              recommendations. Forecast, supply, and vehicle data reload every
              minute. Use Reload saved analysis for recommendations; generation
              creates new results.
            </p>
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
                {allocationLoading ||
                supplyLoading ||
                forecastLoading ||
                allocationBusy ? (
                  <div className="admin-decision-empty" role="status">
                    <strong>Preparing transfer options…</strong>
                    <span>
                      Loading saved analysis and checking supply coverage.
                    </span>
                  </div>
                ) : allocationError || supplyError || forecastError ? (
                  <div className="admin-decision-empty">
                    <strong>Transfer analysis could not be verified</strong>
                    <span>
                      Resolve the analysis error above before treating an empty
                      list as no transfer needed.
                    </span>
                    <Btn
                      onClick={() => {
                        setSupportVersion((version) => version + 1);
                        setAllocationReloadVersion((version) => version + 1);
                      }}
                    >
                      Reload analysis
                    </Btn>
                  </div>
                ) : !currentAllocationRows.length ? (
                  <div className="admin-decision-empty">
                    <ArrowRightLeft aria-hidden="true" />
                    <strong>
                      {supplyBusy || unevaluatedForecasts.length
                        ? "Preparing transfer options"
                        : shortageEvaluations.length &&
                            !surplusEvaluations.length
                          ? "No matching surplus is available"
                          : surplusEvaluations.length &&
                              !shortageEvaluations.length
                            ? "No branch needs a transfer"
                            : allocationSummary?.unresolvedShortages.some(
                                  (gap) => gap.reason === "NoCompatibleSurplus",
                                )
                              ? "No compatible donor is available"
                              : allocationSummary?.generatedRecommendations ===
                                  0
                                ? "No eligible transfer match was found"
                                : shortageEvaluations.length
                                  ? "Shortages remain without a saved transfer match"
                                  : "No transfer is needed"}
                    </strong>
                    <span>
                      {supplyBusy || unevaluatedForecasts.length
                        ? "The latest forecast run is being checked automatically before transfer options are shown."
                        : shortageEvaluations.length &&
                            !surplusEvaluations.length
                          ? "The current run has a shortage, but no matching branch/category surplus to move."
                          : surplusEvaluations.length &&
                              !shortageEvaluations.length
                            ? "The current run has spare capacity, but no matching shortage to resolve."
                            : allocationSummary?.unresolvedShortages.some(
                                  (gap) => gap.reason === "NoCompatibleSurplus",
                                )
                              ? "Available surpluses do not match this shortage's category, target week, and forecast horizon."
                              : allocationSummary?.generatedRecommendations ===
                                  0
                                ? "Compatible surplus exists, but current bookings, rentals, maintenance, or inactive state leave no eligible vehicle to transfer."
                                : shortageEvaluations.length
                                  ? "Review the shortage evidence or generate recommendations. An empty match list does not resolve the shortage."
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
                      aria-pressed={contextRecommendationId === row.id}
                      onClick={() => selectRecommendation(row)}
                    >
                      <span>
                        <strong>
                          {row.destination_branch_name} ←{" "}
                          {row.source_branch_name}
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

              <div
                id="selected-transfer-review"
                tabIndex={-1}
                className="admin-decision-transfer-detail"
                aria-label="Selected transfer review"
              >
                {selectedRecommendation ? (
                  transferReview
                ) : (
                  <div className="admin-decision-empty">
                    <CircleDot aria-hidden="true" />
                    <strong>
                      {allocationLoading || supplyLoading
                        ? "Loading recommendations…"
                        : "Select a recommendation to review"}
                    </strong>
                    <span>
                      Its route, target week, advisory evidence, and decision
                      controls will appear here.
                    </span>
                  </div>
                )}
              </div>
            </div>
            {allocationSummary?.unresolvedShortages.length ? (
              <details
                className="admin-decision-unresolved"
                aria-label="Unresolved shortage explanations"
              >
                <summary>
                  <strong>Unresolved shortage evidence</strong>
                  <span>
                    {allocationSummary.unresolvedShortages.length} position
                    {allocationSummary.unresolvedShortages.length === 1
                      ? ""
                      : "s"}{" "}
                    still need an operational response
                  </span>
                </summary>
                <ul>
                  {allocationSummary.unresolvedShortages.map((gap) => {
                    const evaluation = supplyRows.find(
                      (row) => row.id === gap.evaluationId,
                    );
                    const forecast = evaluation
                      ? forecastById.get(evaluation.forecast_id)
                      : undefined;
                    return (
                      <li key={gap.evaluationId}>
                        <div>
                          <strong>
                            {forecast?.branch?.name ?? gap.branchId} ·{" "}
                            {forecast?.category?.name ?? gap.categoryId}
                          </strong>
                          <span>
                            {formatWeekRange(
                              gap.targetWeekStart,
                              gap.targetWeekEnd,
                            )}{" "}
                            · {gap.unresolvedUnits} of {gap.shortageUnits} unit
                            {gap.shortageUnits === 1 ? "" : "s"} unresolved
                          </span>
                        </div>
                        <p>{unresolvedShortageCopy(gap.reason)}</p>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ) : null}
          </section>
        </>
      ) : null}
      <Outlet />
    </div>
  );
}
