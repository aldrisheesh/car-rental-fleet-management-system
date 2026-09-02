import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ALL_BRANCHES,
  assertCanonicalBranch,
  buildAdminReport,
  handleAdminReportsRequest,
  ReportSourceError,
  ReportValidationError,
  validateReportRange,
  type AdminReportSources,
  type AdminReportsResponse,
} from "./admin-reports.ts";
import type { VehicleAnalyticsRow } from "./vehicle-analytics.server.ts";

const completeVehicle = (
  vehicleId: string,
  branchId: string | null,
  categoryId: string | null,
  utilizationPercent: number | null,
  idleClassification: VehicleAnalyticsRow["idleClassification"] = "Not Idle",
): VehicleAnalyticsRow => ({
  vehicleId,
  name: vehicleId,
  licensePlate: null,
  branchId,
  branch: branchId,
  categoryId,
  category: categoryId,
  isActive: true,
  reportingStart: "2026-09-01",
  reportingEnd: "2026-09-01",
  coverage:
    utilizationPercent == null
      ? "Partial/Insufficient Historical Eligibility Data"
      : "Complete",
  rentalDays: utilizationPercent == null ? 0 : 1,
  eligibleOperationalDays: utilizationPercent == null ? null : 1,
  utilizationPercent,
  maintenanceReady: true,
  maintenanceReasons: [],
  activeRental: false,
  idleEligible: true,
  idleReference: null,
  idleDays: idleClassification === "Idle" ? 14 : null,
  idleClassification,
});

const sources = (): AdminReportSources => ({
  branches: [
    { id: "b1", name: "North", isActive: true },
    { id: "b2", name: "South", isActive: true },
    { id: "b3", name: "New branch", isActive: true },
  ],
  categories: [
    { id: "c1", name: "Sedan", isActive: true },
    { id: "c2", name: "Van", isActive: true },
  ],
  bookings: [
    {
      id: "q1",
      status: "Submitted",
      createdAt: "2026-08-31T16:00:00.000Z",
      branchId: "b1",
    },
    {
      id: "q2",
      status: "Cancelled",
      createdAt: "2026-09-01T15:59:59.999Z",
      branchId: "b2",
    },
    {
      id: "q3",
      status: "Rejected",
      createdAt: "2026-08-31T15:59:59.999Z",
      branchId: "b1",
    },
    {
      id: "q4",
      status: "Confirmed",
      createdAt: "2026-09-01T16:00:00.000Z",
      branchId: "b3",
    },
  ],
  rentals: [
    {
      id: "r1",
      vehicleId: "v1",
      branchId: "b1",
      startedAt: "2026-08-31T16:00:00.000Z",
      endedAt: "2026-09-01T12:00:00.000Z",
    },
    {
      id: "r2",
      vehicleId: "v2",
      branchId: "b2",
      startedAt: "2026-08-01T00:00:00.000Z",
      endedAt: null,
    },
    {
      id: "r3",
      vehicleId: "v3",
      branchId: "b3",
      startedAt: "2026-09-01T16:00:00.000Z",
      endedAt: null,
    },
  ],
  maintenance: [
    {
      id: "m1",
      vehicleId: "v1",
      branchId: "b1",
      status: "Completed",
      blocksRentalUse: true,
      serviceStartedAt: "2026-08-31T16:00:00.000Z",
      completedAt: "2026-09-01T10:00:00.000Z",
      updatedAt: "2026-09-01T10:00:00.000Z",
    },
    {
      id: "m2",
      vehicleId: "v2",
      branchId: "b2",
      status: "Cancelled",
      blocksRentalUse: true,
      serviceStartedAt: "2026-08-01T00:00:00.000Z",
      completedAt: null,
      updatedAt: "2026-09-01T11:00:00.000Z",
    },
    {
      id: "m3",
      vehicleId: "v3",
      branchId: "b3",
      status: "Open",
      blocksRentalUse: false,
      serviceStartedAt: "2026-09-01T16:00:00.000Z",
      completedAt: null,
      updatedAt: "2026-09-01T16:00:00.000Z",
    },
  ],
  vehicles: [
    {
      id: "v1",
      branchId: "b1",
      categoryId: "c1",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "v2",
      branchId: "b2",
      categoryId: "c1",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "v3",
      branchId: "b3",
      categoryId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  vehicleAnalytics: [
    completeVehicle("v1", "b1", "c1", 100, "Idle"),
    completeVehicle("v2", "b2", "c1", null, "Unable to Determine"),
    completeVehicle("v3", "b3", null, 0),
  ],
});

test("report dates are valid, inclusive, Manila-bound, and limited to 366 days", () => {
  const sameDay = validateReportRange("2026-09-01", "2026-09-01");
  assert.equal(sameDay.days.length, 1);
  assert.equal(sameDay.startInstant, "2026-08-31T16:00:00.000Z");
  assert.equal(sameDay.endExclusiveInstant, "2026-09-01T16:00:00.000Z");
  assert.equal(
    validateReportRange("2024-01-01", "2024-12-31").days.length,
    366,
  );
  assert.throws(
    () => validateReportRange("2026-09-02", "2026-09-01"),
    ReportValidationError,
  );
  assert.throws(
    () => validateReportRange("2026-02-30", "2026-03-01"),
    ReportValidationError,
  );
  assert.throws(
    () => validateReportRange("09/01/2026", "2026-09-01"),
    ReportValidationError,
  );
  assert.throws(
    () => validateReportRange("2025-01-01", "2026-01-02"),
    ReportValidationError,
  );
});

test("booking requests use created_at boundaries, retain cancelled history, statuses, and branch grouping", () => {
  const report = buildAdminReport(
    "Owner/Admin",
    validateReportRange("2026-09-01", "2026-09-01"),
    ALL_BRANCHES,
    sources(),
  );
  assert.equal(report.bookings.requests, 2);
  assert.deepEqual(report.bookings.statusBreakdown, [
    { status: "Cancelled", count: 1 },
    { status: "Submitted", count: 1 },
  ]);
  assert.equal(
    report.branchesPerformance.find((row) => row.branchId === "b1")
      ?.bookingRequests,
    1,
  );
  assert.equal(
    report.branchesPerformance.find((row) => row.branchId === "b2")
      ?.bookingRequests,
    1,
  );
  assert.equal(report.branchesPerformance.length, 3);
});

test("rental metrics come from canonical start/end timestamps, not booking status", () => {
  const report = buildAdminReport(
    "Operations Staff",
    validateReportRange("2026-09-01", "2026-09-01"),
    ALL_BRANCHES,
    sources(),
  );
  assert.deepEqual(report.rentals, {
    started: 1,
    completed: 1,
    activeAtPeriodEnd: 1,
  });
  assert.equal(
    report.branchesPerformance.find((row) => row.branchId === "b1")
      ?.rentalStarts,
    1,
  );
});

test("complete utilization is averaged while partial coverage stays unavailable", () => {
  const report = buildAdminReport(
    "Owner/Admin",
    validateReportRange("2026-09-01", "2026-09-01"),
    ALL_BRANCHES,
    sources(),
  );
  assert.equal(report.utilization.averagePercent, 50);
  assert.equal(report.utilization.availableVehicleCount, 2);
  assert.equal(report.utilization.unavailableVehicleCount, 1);
  const b2 = report.branchesPerformance.find((row) => row.branchId === "b2");
  assert.equal(b2?.utilization.averagePercent, null);
  assert.equal(b2?.unableToDetermineIdle, 1);
});

test("maintenance uses started/completed/cancelled transitions and overlapping blocking workload without overdue", () => {
  const report = buildAdminReport(
    "Owner/Admin",
    validateReportRange("2026-09-01", "2026-09-01"),
    ALL_BRANCHES,
    sources(),
  );
  assert.deepEqual(report.maintenance, {
    started: 1,
    completed: 1,
    cancelled: 1,
    blockingWorkload: 2,
  });
  assert.equal("overdue" in report.maintenance, false);
});

test("specific branch and unknown category grouping use canonical identifiers", () => {
  const all = buildAdminReport(
    "Owner/Admin",
    validateReportRange("2026-09-01", "2026-09-01"),
    ALL_BRANCHES,
    sources(),
  );
  assert.equal(
    all.categoriesPerformance.find((row) => row.categoryId === null)?.name,
    "Unknown / unassigned category",
  );
  const one = buildAdminReport(
    "Owner/Admin",
    validateReportRange("2026-09-01", "2026-09-01"),
    "b2",
    sources(),
  );
  assert.deepEqual(
    one.branchesPerformance.map((row) => row.branchId),
    ["b2"],
  );
  assert.equal(one.summary.fleetCount, 1);
  assert.equal(one.bookings.requests, 1);
  assert.doesNotThrow(() =>
    assertCanonicalBranch(ALL_BRANCHES, sources().branches),
  );
  assert.doesNotThrow(() => assertCanonicalBranch("b3", sources().branches));
  assert.throws(
    () => assertCanonicalBranch("prototype-branch", sources().branches),
    ReportValidationError,
  );
});

test("unknown branch relationships remain explicit instead of disappearing", () => {
  const data = sources();
  data.vehicles.push({
    id: "v4",
    branchId: null,
    categoryId: "c2",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  data.vehicleAnalytics.push(
    completeVehicle("v4", null, "c2", null, "Unable to Determine"),
  );
  const report = buildAdminReport(
    "Operations Staff",
    validateReportRange("2026-09-01", "2026-09-01"),
    ALL_BRANCHES,
    data,
  );
  const unknown = report.branchesPerformance.find(
    (row) => row.branchId === null,
  );
  assert.equal(unknown?.name, "Unknown / unassigned branch");
  assert.equal(unknown?.fleetCount, 1);
  assert.equal(unknown?.utilization.averagePercent, null);
});

test("true zero data remains zero while unavailable utilization remains null", () => {
  const empty = sources();
  empty.bookings = [];
  empty.rentals = [];
  empty.maintenance = [];
  empty.vehicles = [];
  empty.vehicleAnalytics = [];
  const report = buildAdminReport(
    "Operations Staff",
    validateReportRange("2026-09-01", "2026-09-01"),
    ALL_BRANCHES,
    empty,
  );
  assert.equal(report.summary.bookingRequests, 0);
  assert.equal(report.utilization.averagePercent, null);
});

test("fleet counts only canonical vehicle records created by the period end", () => {
  const data = sources();
  data.vehicles.push({
    id: "future-vehicle",
    branchId: "b1",
    categoryId: "c1",
    createdAt: "2026-09-02T00:00:00.000Z",
  });
  data.vehicleAnalytics.push(
    completeVehicle("future-vehicle", "b1", "c1", 100),
  );
  const report = buildAdminReport(
    "Owner/Admin",
    validateReportRange("2026-09-01", "2026-09-01"),
    ALL_BRANCHES,
    data,
  );
  assert.equal(report.summary.fleetCount, 3);
  assert.equal(report.utilization.vehicles.length, 3);
});

test("report handler allows Owner/Admin and Staff, forbids Customer, and exposes no finance fields", async () => {
  const report = buildAdminReport(
    "Owner/Admin",
    validateReportRange("2026-09-01", "2026-09-01"),
    ALL_BRANCHES,
    sources(),
  );
  const call = (role: "Owner/Admin" | "Operations Staff" | "Customer/Renter") =>
    handleAdminReportsRequest(
      new Request(
        "http://test/api/admin-reports?start=2026-09-01&end=2026-09-01&branch=all",
      ),
      {
        getRole: async () => role,
        loadReport: async (allowedRole) => ({ ...report, role: allowedRole }),
      },
    );
  assert.equal((await call("Owner/Admin")).status, 200);
  const staffResponse = await call("Operations Staff");
  assert.equal(staffResponse.status, 200);
  const staff = (await staffResponse.json()) as AdminReportsResponse;
  assert.equal(staff.role, "Operations Staff");
  assert.equal("financial" in staff, false);
  assert.equal((await call("Customer/Renter")).status, 403);
});

test("invalid branch and source failure are errors, never zero reports", async () => {
  const request = new Request(
    "http://test/api/admin-reports?start=2026-09-01&end=2026-09-01&branch=invalid",
  );
  const invalid = await handleAdminReportsRequest(request, {
    getRole: async () => "Owner/Admin",
    loadReport: async () => {
      throw new ReportValidationError(
        "Branch filter is not a canonical branch.",
      );
    },
  });
  assert.equal(invalid.status, 400);
  const failed = await handleAdminReportsRequest(request, {
    getRole: async () => "Owner/Admin",
    loadReport: async () => {
      throw new ReportSourceError("database failed");
    },
  });
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { message: "Unable to load reports." });
});

test("Reports page has no prototype business-data or financial-report coupling", () => {
  const source = readFileSync(
    new URL("../routes/admin.reports.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /@\/data\/admin/);
  assert.doesNotMatch(source, /\bRevenue\b|Average Ticket|Revenue Trend/i);
});
