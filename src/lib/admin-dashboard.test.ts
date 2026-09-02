import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildAdminDashboard,
  loadAdminDashboard,
  type DashboardSources,
} from "./admin-dashboard.ts";

const sources: DashboardSources = {
  bookings: [
    {
      id: "submitted",
      booking_status: "Submitted",
      pickup_at: "2026-09-05T01:00:00Z",
      return_at: "2026-09-06T01:00:00Z",
      created_at: "2026-09-02T03:00:00Z",
      requested_vehicle: { name: "Requested car" },
      assigned_vehicle: null,
    },
    {
      id: "confirmed",
      booking_status: "Confirmed",
      pickup_at: "2026-09-07T01:00:00Z",
      return_at: "2026-09-08T01:00:00Z",
      created_at: "2026-09-02T02:00:00Z",
      requested_vehicle: { name: "Requested van" },
      assigned_vehicle: { name: "Assigned van" },
    },
    {
      id: "cancelled",
      booking_status: "Cancelled",
      pickup_at: "2026-08-01T01:00:00Z",
      return_at: "2026-08-02T01:00:00Z",
      created_at: "2026-09-02T01:00:00Z",
      requested_vehicle: null,
      assigned_vehicle: null,
    },
  ],
  rentals: [
    {
      vehicle_id: "active-rental",
      started_at: "2026-09-01T01:00:00Z",
      ended_at: null,
    },
    {
      vehicle_id: "ended-rental",
      started_at: "2026-08-01T01:00:00Z",
      ended_at: "2026-08-02T01:00:00Z",
    },
    { vehicle_id: "not-started", started_at: null, ended_at: null },
  ],
  vehicles: [
    { vehicleId: "available", branchId: "branch-1", isActive: true },
    { vehicleId: "inactive", branchId: "branch-1", isActive: false },
    { vehicleId: "active-rental", branchId: "branch-1", isActive: true },
    { vehicleId: "maintenance", branchId: "branch-1", isActive: true },
  ],
  readiness: [
    {
      vehicleId: "available",
      vehicleName: "Available",
      licensePlate: "AAA 111",
      maintenanceReady: true,
      reasons: [],
    },
    {
      vehicleId: "inactive",
      vehicleName: "Inactive",
      licensePlate: "BBB 222",
      maintenanceReady: false,
      reasons: ["Vehicle inactive"],
    },
    {
      vehicleId: "active-rental",
      vehicleName: "Rented",
      licensePlate: "CCC 333",
      maintenanceReady: true,
      reasons: [],
    },
    {
      vehicleId: "maintenance",
      vehicleName: "Maintenance",
      licensePlate: "DDD 444",
      maintenanceReady: false,
      reasons: ["Active blocking maintenance"],
    },
  ],
};

test("canonical operational KPIs use lifecycle and readiness definitions", () => {
  const dashboard = buildAdminDashboard(
    "Owner/Admin",
    sources,
    "2026-09-02T04:00:00Z",
  );
  assert.deepEqual(dashboard.operational, {
    submittedBookings: 1,
    activeRentals: 1,
    availableVehicles: 1,
    readinessAttention: 2,
  });
  assert.deepEqual(
    dashboard.recentBookings.map((booking) => booking.id),
    ["submitted", "confirmed", "cancelled"],
  );
  assert.equal(dashboard.recentBookings[1]?.vehicleName, "Assigned van");
});

test("Owner/Admin and Operations Staff receive operational-only role-specific responses", () => {
  const owner = buildAdminDashboard("Owner/Admin", sources);
  const staff = buildAdminDashboard("Operations Staff", sources);
  assert.equal(owner.role, "Owner/Admin");
  assert.equal(staff.role, "Operations Staff");
  assert.deepEqual(owner.operational, staff.operational);
  assert.equal("financial" in owner, false);
  assert.equal("financial" in staff, false);
  assert.throws(
    () => buildAdminDashboard("Customer/Renter", sources),
    /forbidden/,
  );
});

test("source failure rejects instead of becoming a zero snapshot", async () => {
  await assert.rejects(
    loadAdminDashboard("Owner/Admin", async () => {
      throw new Error("database unavailable");
    }),
    /database unavailable/,
  );
  let called = false;
  await assert.rejects(
    loadAdminDashboard("Customer/Renter", async () => {
      called = true;
      return sources;
    }),
    /forbidden/,
  );
  assert.equal(called, false);
});

test("dashboard removes prototype widgets and implements honest load states", async () => {
  const page = await readFile(
    new URL("../routes/admin.index.tsx", import.meta.url),
    "utf8",
  );
  const api = await readFile(
    new URL("../routes/api.admin-dashboard.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    page,
    /@\/data\/admin|recharts|revenueTrend|bookingVolume|branchDemand|fleetUtilization/,
  );
  assert.doesNotMatch(
    page,
    /Systems healthy|Export report|MoM|YoY|Recent activity|Revenue|Pending payments/,
  );
  assert.match(page, /fetch\("\/api\/admin-dashboard"/);
  assert.match(page, /Loading operational dashboard/);
  assert.match(page, /Unable to load the operational dashboard/);
  assert.match(page, /Retry/);
  assert.match(page, /No booking records yet/);
  assert.match(page, /No vehicles currently require readiness attention/);
  assert.match(api, /principal\.role === "Customer\/Renter"/);
  assert.match(api, /status: 403/);
});
