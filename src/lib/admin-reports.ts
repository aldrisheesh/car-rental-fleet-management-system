import type { AppRole } from "./auth";
import {
  addDays,
  datesBetween,
  dayKey,
  localDate,
} from "./vehicle-analytics-intervals.ts";
import type { VehicleAnalyticsRow } from "./vehicle-analytics.server";

export const ALL_BRANCHES = "all";
export const MAX_REPORT_DAYS = 366;

export class ReportValidationError extends Error {}
export class ReportSourceError extends Error {}

export type ReportRange = {
  start: string;
  end: string;
  startInstant: string;
  endExclusiveInstant: string;
  days: string[];
};

export type ReportBranch = { id: string; name: string; isActive: boolean };
export type ReportCategory = { id: string; name: string; isActive: boolean };
export type ReportBookingSource = {
  id: string;
  status: string;
  createdAt: string;
  branchId: string | null;
};
export type ReportRentalSource = {
  id: string;
  vehicleId: string;
  branchId: string | null;
  startedAt: string;
  endedAt: string | null;
};
export type ReportMaintenanceSource = {
  id: string;
  vehicleId: string;
  branchId: string | null;
  status: "Open" | "Completed" | "Cancelled";
  blocksRentalUse: boolean;
  serviceStartedAt: string;
  completedAt: string | null;
  updatedAt: string;
};
export type ReportVehicleSource = {
  id: string;
  branchId: string | null;
  categoryId: string | null;
  createdAt: string;
};

export type AdminReportSources = {
  branches: ReportBranch[];
  categories: ReportCategory[];
  bookings: ReportBookingSource[];
  rentals: ReportRentalSource[];
  maintenance: ReportMaintenanceSource[];
  vehicles: ReportVehicleSource[];
  vehicleAnalytics: VehicleAnalyticsRow[];
};

export type UtilizationSummary = {
  averagePercent: number | null;
  availableVehicleCount: number;
  unavailableVehicleCount: number;
};

export type AdminReportsResponse = {
  role: "Owner/Admin" | "Operations Staff";
  range: { start: string; end: string };
  branchFilter: string;
  branches: ReportBranch[];
  summary: {
    bookingRequests: number;
    rentalsStarted: number;
    rentalsCompleted: number;
    fleetCount: number;
  };
  bookings: {
    requests: number;
    statusBreakdown: Array<{ status: string; count: number }>;
  };
  rentals: {
    started: number;
    completed: number;
    activeAtPeriodEnd: number;
  };
  utilization: UtilizationSummary & {
    rentalDays: number;
    idle: number;
    notIdle: number;
    unableToDetermineIdle: number;
    vehicles: VehicleAnalyticsRow[];
  };
  maintenance: {
    started: number;
    completed: number;
    cancelled: number;
    blockingWorkload: number;
  };
  branchesPerformance: Array<{
    branchId: string | null;
    name: string;
    bookingRequests: number;
    rentalStarts: number;
    fleetCount: number;
    utilization: UtilizationSummary;
    blockingMaintenance: number;
    idleVehicles: number;
    unableToDetermineIdle: number;
  }>;
  categoriesPerformance: Array<{
    categoryId: string | null;
    name: string;
    fleetCount: number;
    rentalDays: number;
    utilization: UtilizationSummary;
    idleVehicles: number;
    unableToDetermineIdle: number;
  }>;
};

function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) && dayKey(localDate(value)) === value
  );
}

export function validateReportRange(start: string, end: string): ReportRange {
  if (!validDate(start) || !validDate(end))
    throw new ReportValidationError("Dates must use valid YYYY-MM-DD values.");
  if (start > end)
    throw new ReportValidationError(
      "Start date must be on or before end date.",
    );
  const days = datesBetween(start, end);
  if (days.length > MAX_REPORT_DAYS)
    throw new ReportValidationError("Reporting range is limited to 366 days.");
  return {
    start,
    end,
    startInstant: localDate(start).toISOString(),
    endExclusiveInstant: localDate(addDays(end, 1)).toISOString(),
    days,
  };
}

export function defaultReportRange(now = new Date()) {
  const end = dayKey(now);
  return { start: addDays(end, -29), end };
}

export function assertCanonicalBranch(
  branchFilter: string,
  branches: ReportBranch[],
) {
  if (
    branchFilter !== ALL_BRANCHES &&
    !branches.some((branch) => branch.id === branchFilter)
  )
    throw new ReportValidationError("Branch filter is not a canonical branch.");
}

const instant = (value: string) => new Date(value).getTime();
const inRange = (value: string | null, range: ReportRange) =>
  value != null &&
  instant(value) >= instant(range.startInstant) &&
  instant(value) < instant(range.endExclusiveInstant);

function utilizationSummary(rows: VehicleAnalyticsRow[]): UtilizationSummary {
  const available = rows.filter((row) => row.utilizationPercent != null);
  return {
    averagePercent: available.length
      ? available.reduce((sum, row) => sum + (row.utilizationPercent ?? 0), 0) /
        available.length
      : null,
    availableVehicleCount: available.length,
    unavailableVehicleCount: rows.length - available.length,
  };
}

function maintenanceEnd(row: ReportMaintenanceSource) {
  if (row.status === "Completed") return row.completedAt;
  if (row.status === "Cancelled") return row.updatedAt;
  return null;
}

function overlapsRange(row: ReportMaintenanceSource, range: ReportRange) {
  const end = maintenanceEnd(row);
  return (
    instant(row.serviceStartedAt) < instant(range.endExclusiveInstant) &&
    (end == null || instant(end) > instant(range.startInstant))
  );
}

const unknownBranchName = "Unknown / unassigned branch";
const unknownCategoryName = "Unknown / unassigned category";

export function buildAdminReport(
  role: "Owner/Admin" | "Operations Staff",
  range: ReportRange,
  branchFilter: string,
  sources: AdminReportSources,
): AdminReportsResponse {
  const branchMatches = (branchId: string | null) =>
    branchFilter === ALL_BRANCHES || branchId === branchFilter;
  const bookings = sources.bookings.filter(
    (row) => branchMatches(row.branchId) && inRange(row.createdAt, range),
  );
  const rentals = sources.rentals.filter((row) => branchMatches(row.branchId));
  const vehicles = sources.vehicles.filter(
    (row) =>
      branchMatches(row.branchId) &&
      instant(row.createdAt) < instant(range.endExclusiveInstant),
  );
  const vehicleIds = new Set(vehicles.map((row) => row.id));
  const analytics = sources.vehicleAnalytics.filter((row) =>
    vehicleIds.has(row.vehicleId),
  );
  const maintenance = sources.maintenance.filter((row) =>
    branchMatches(row.branchId),
  );
  const rentalsStarted = rentals.filter((row) => inRange(row.startedAt, range));
  const rentalsCompleted = rentals.filter((row) => inRange(row.endedAt, range));
  const periodEnd = instant(range.endExclusiveInstant);
  const activeAtPeriodEnd = rentals.filter(
    (row) =>
      instant(row.startedAt) < periodEnd &&
      (row.endedAt == null || instant(row.endedAt) >= periodEnd),
  );
  const startedMaintenance = maintenance.filter((row) =>
    inRange(row.serviceStartedAt, range),
  );
  const completedMaintenance = maintenance.filter(
    (row) => row.status === "Completed" && inRange(row.completedAt, range),
  );
  // Cancelled has no dedicated timestamp. Its one-way Open -> Cancelled transition
  // makes updated_at the canonical transition instant.
  const cancelledMaintenance = maintenance.filter(
    (row) => row.status === "Cancelled" && inRange(row.updatedAt, range),
  );
  const blockingMaintenance = maintenance.filter(
    (row) => row.blocksRentalUse && overlapsRange(row, range),
  );
  const statuses = new Map<string, number>();
  for (const booking of bookings)
    statuses.set(booking.status, (statuses.get(booking.status) ?? 0) + 1);

  const branchGroups: Array<{ id: string | null; name: string }> =
    sources.branches
      .filter((branch) => branchMatches(branch.id))
      .map((branch) => ({ id: branch.id, name: branch.name }));
  const hasUnknownBranch = [
    ...bookings.map((row) => row.branchId),
    ...rentalsStarted.map((row) => row.branchId),
    ...vehicles.map((row) => row.branchId),
    ...blockingMaintenance.map((row) => row.branchId),
  ].some((id) => id == null);
  if (branchFilter === ALL_BRANCHES && hasUnknownBranch)
    branchGroups.push({ id: null, name: unknownBranchName });

  const categoryMap = new Map(
    sources.categories.map((row) => [row.id, row.name]),
  );
  const categoryIds = new Set(vehicles.map((row) => row.categoryId));
  const categoryGroups = [...categoryIds]
    .map((id) => ({
      id,
      name: id
        ? (categoryMap.get(id) ?? unknownCategoryName)
        : unknownCategoryName,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    role,
    range: { start: range.start, end: range.end },
    branchFilter,
    branches: sources.branches,
    summary: {
      bookingRequests: bookings.length,
      rentalsStarted: rentalsStarted.length,
      rentalsCompleted: rentalsCompleted.length,
      fleetCount: vehicles.length,
    },
    bookings: {
      requests: bookings.length,
      statusBreakdown: [...statuses]
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => a.status.localeCompare(b.status)),
    },
    rentals: {
      started: rentalsStarted.length,
      completed: rentalsCompleted.length,
      activeAtPeriodEnd: activeAtPeriodEnd.length,
    },
    utilization: {
      ...utilizationSummary(analytics),
      rentalDays: analytics.reduce((sum, row) => sum + row.rentalDays, 0),
      idle: analytics.filter((row) => row.idleClassification === "Idle").length,
      notIdle: analytics.filter((row) => row.idleClassification === "Not Idle")
        .length,
      unableToDetermineIdle: analytics.filter(
        (row) => row.idleClassification === "Unable to Determine",
      ).length,
      vehicles: analytics,
    },
    maintenance: {
      started: startedMaintenance.length,
      completed: completedMaintenance.length,
      cancelled: cancelledMaintenance.length,
      blockingWorkload: blockingMaintenance.length,
    },
    branchesPerformance: branchGroups.map((branch) => {
      const rows = analytics.filter((row) => row.branchId === branch.id);
      return {
        branchId: branch.id,
        name: branch.name,
        bookingRequests: bookings.filter((row) => row.branchId === branch.id)
          .length,
        rentalStarts: rentalsStarted.filter((row) => row.branchId === branch.id)
          .length,
        fleetCount: vehicles.filter((row) => row.branchId === branch.id).length,
        utilization: utilizationSummary(rows),
        blockingMaintenance: blockingMaintenance.filter(
          (row) => row.branchId === branch.id,
        ).length,
        idleVehicles: rows.filter((row) => row.idleClassification === "Idle")
          .length,
        unableToDetermineIdle: rows.filter(
          (row) => row.idleClassification === "Unable to Determine",
        ).length,
      };
    }),
    categoriesPerformance: categoryGroups.map((category) => {
      const ids = new Set(
        vehicles
          .filter((row) => row.categoryId === category.id)
          .map((row) => row.id),
      );
      const rows = analytics.filter((row) => ids.has(row.vehicleId));
      return {
        categoryId: category.id,
        name: category.name,
        fleetCount: ids.size,
        rentalDays: rows.reduce((sum, row) => sum + row.rentalDays, 0),
        utilization: utilizationSummary(rows),
        idleVehicles: rows.filter((row) => row.idleClassification === "Idle")
          .length,
        unableToDetermineIdle: rows.filter(
          (row) => row.idleClassification === "Unable to Determine",
        ).length,
      };
    }),
  };
}

export type AdminReportsHandlerDependencies = {
  getRole: () => Promise<AppRole | null>;
  loadReport: (
    role: "Owner/Admin" | "Operations Staff",
    range: ReportRange,
    branchFilter: string,
  ) => Promise<AdminReportsResponse>;
  now?: () => Date;
};

export async function handleAdminReportsRequest(
  request: Request,
  dependencies: AdminReportsHandlerDependencies,
) {
  try {
    const role = await dependencies.getRole();
    if (!role)
      return Response.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    if (role === "Customer/Renter")
      return Response.json({ message: "Forbidden." }, { status: 403 });
    const url = new URL(request.url);
    const defaults = defaultReportRange(dependencies.now?.() ?? new Date());
    const range = validateReportRange(
      url.searchParams.get("start") ?? defaults.start,
      url.searchParams.get("end") ?? defaults.end,
    );
    const branch = url.searchParams.get("branch") ?? ALL_BRANCHES;
    return Response.json(await dependencies.loadReport(role, range, branch));
  } catch (error) {
    if (error instanceof ReportValidationError)
      return Response.json({ message: error.message }, { status: 400 });
    if (error instanceof ReportSourceError)
      return Response.json(
        { message: "Unable to load reports." },
        { status: 503 },
      );
    if (error instanceof Error && error.message === "unauthenticated")
      return Response.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    return Response.json(
      { message: "Unable to load reports." },
      { status: 503 },
    );
  }
}
