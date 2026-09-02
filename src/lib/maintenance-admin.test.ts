import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createMaintenancePayload,
  isMaintenanceDraftValid,
  maintenanceSummary,
  partitionMaintenanceRecords,
  transitionMaintenancePayload,
  type MaintenanceDraft,
  type MaintenanceRecord,
} from "./maintenance-admin.ts";

const draft: MaintenanceDraft = {
  vehicleId: "vehicle-1",
  maintenanceType: " Brake Service ",
  description: " Replace pads ",
  blocksRentalUse: true,
  serviceStartedAt: "2026-09-02T10:30",
  odometerAtService: "42000.5",
  nextServiceOdometer: "50000",
  nextServiceDate: "2027-01-15",
  costPhp: "3500.25",
  remarks: " Workshop bay 2 ",
};

function record(
  status: MaintenanceRecord["status"],
  overrides: Partial<MaintenanceRecord> = {},
): MaintenanceRecord {
  return {
    id: `${status}-${String(overrides.blocks_rental_use ?? false)}`,
    vehicle_id: "vehicle-1",
    maintenance_type: "Brake Service",
    description: "Replace pads",
    status,
    blocks_rental_use: false,
    service_started_at: "2026-09-01T00:00:00Z",
    completed_at: status === "Completed" ? "2026-09-02T00:00:00Z" : null,
    odometer_at_service: null,
    next_service_odometer: null,
    next_service_date: null,
    cost_php: null,
    remarks: null,
    created_at: "2026-09-01T00:00:00Z",
    vehicle: {
      id: "vehicle-1",
      name: "Toyota Innova",
      license_plate: "ABC 1234",
    },
    ...overrides,
  };
}

test("create requires vehicle, maintenance type, and description", () => {
  assert.equal(isMaintenanceDraftValid(draft), true);
  assert.equal(isMaintenanceDraftValid({ ...draft, vehicleId: "" }), false);
  assert.equal(
    isMaintenanceDraftValid({ ...draft, maintenanceType: " " }),
    false,
  );
  assert.equal(isMaintenanceDraftValid({ ...draft, description: " " }), false);
});

test("create serializes only canonical fields and leaves status implicit Open", () => {
  const payload = createMaintenancePayload(draft);
  assert.deepEqual(payload, {
    vehicleId: "vehicle-1",
    maintenanceType: "Brake Service",
    description: "Replace pads",
    blocksRentalUse: true,
    serviceStartedAt: new Date("2026-09-02T10:30").toISOString(),
    odometerAtService: 42000.5,
    nextServiceOdometer: 50000,
    nextServiceDate: "2027-01-15",
    costPhp: 3500.25,
    remarks: "Workshop bay 2",
  });
  assert.equal("status" in payload, false);
  assert.equal("recorded_by" in payload, false);
  assert.equal("performed_by" in payload, false);
});

test("summary and sections use canonical lifecycle values", () => {
  const records = [
    record("Open"),
    record("Open", { id: "blocking", blocks_rental_use: true }),
    record("Completed"),
    record("Cancelled"),
  ];
  assert.deepEqual(maintenanceSummary(records), { open: 2, blocking: 1 });
  const partitioned = partitionMaintenanceRecords(records);
  assert.equal(partitioned.active.length, 2);
  assert.equal(partitioned.active[0]?.id, "blocking");
  assert.deepEqual(partitioned.history.map((item) => item.status).sort(), [
    "Cancelled",
    "Completed",
  ]);
});

test("completion sends supported final values while cancellation is non-destructive", () => {
  assert.deepEqual(
    transitionMaintenancePayload("record-1", "Completed", draft),
    {
      id: "record-1",
      status: "Completed",
      odometerAtService: 42000.5,
      nextServiceOdometer: 50000,
      nextServiceDate: "2027-01-15",
      costPhp: 3500.25,
      remarks: "Workshop bay 2",
    },
  );
  assert.deepEqual(
    transitionMaintenancePayload("record-1", "Cancelled", draft),
    { id: "record-1", status: "Cancelled", remarks: "Workshop bay 2" },
  );
});

test("Admin Maintenance source is canonical and exposes honest states", async () => {
  const page = await readFile(
    new URL("../routes/admin.maintenance.tsx", import.meta.url),
    "utf8",
  );
  const dialog = await readFile(
    new URL("../components/admin/MaintenanceRecordDialog.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(page, /@\/data\/admin/);
  assert.doesNotMatch(page, /recharts|Fleet downtime|statusOverrides/);
  assert.match(page, /fetch\("\/api\/maintenance"\)/);
  assert.match(page, /fetch\("\/api\/vehicles"\)/);
  assert.match(page, /readiness=summary/);
  assert.match(page, /Loading maintenance data/);
  assert.match(page, /Unable to load maintenance records/);
  assert.match(page, /No maintenance records yet/);
  assert.match(page, /No active maintenance/);
  assert.match(page, /No maintenance history/);
  assert.match(page, /active rental/);
  assert.match(page, /setMutationError/);
  assert.ok((page.match(/await loadCanonicalData\(\)/g) ?? []).length >= 2);
  assert.equal((page.match(/setRecords\(/g) ?? []).length, 1);
  assert.doesNotMatch(page, /method: "DELETE"/);
  assert.doesNotMatch(dialog, /Maintenance Status|Recorded By|Performed By/);
});

test("readiness summary remains Owner/Admin-only at the API boundary", async () => {
  const api = await readFile(
    new URL("../routes/api.maintenance.ts", import.meta.url),
    "utf8",
  );
  assert.match(api, /readiness"\) === "summary"/);
  assert.match(api, /principal\.role !== "Owner\/Admin"/);
  assert.match(api, /calculateFleetMaintenanceReadiness/);
});
