import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateMaintenanceReadiness,
  selectAuthoritativePreventiveTargets,
} from "./maintenance-readiness.ts";

const record = (overrides: Record<string, unknown>) => ({
  status: "Completed",
  maintenance_type: "Oil Service",
  next_service_odometer: null,
  next_service_date: null,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

test("newer completed target supersedes old mileage target", () => {
  const targets = selectAuthoritativePreventiveTargets([
    record({
      next_service_odometer: 50000,
      created_at: "2026-01-01T00:00:00Z",
    }),
    record({
      next_service_odometer: 60000,
      created_at: "2026-02-01T00:00:00Z",
    }),
  ]);
  assert.deepEqual(
    targets.map((item) => item.next_service_odometer),
    [60000],
  );
});

test("latest completed target remains authoritative until reached", () => {
  const targets = selectAuthoritativePreventiveTargets([
    record({ next_service_odometer: 60000 }),
  ]);
  assert.equal(Number(targets[0]?.next_service_odometer) <= 60000, true);
});

test("cancelled target is never authoritative", () => {
  const targets = selectAuthoritativePreventiveTargets([
    record({ status: "Cancelled", next_service_odometer: 50000 }),
  ]);
  assert.equal(targets.length, 0);
});

test("completion chronology outranks creation chronology", () => {
  const targets = selectAuthoritativePreventiveTargets([
    record({
      next_service_odometer: 50000,
      created_at: "2026-01-01T00:00:00Z",
      completed_at: "2026-03-01T00:00:00Z",
    }),
    record({
      next_service_odometer: 60000,
      created_at: "2026-02-01T00:00:00Z",
      completed_at: "2026-02-15T00:00:00Z",
    }),
  ]);
  assert.deepEqual(
    targets.map((item) => item.next_service_odometer),
    [50000],
  );
});

test("canonical readiness reports every deterministic blocking reason", () => {
  const readiness = evaluateMaintenanceReadiness(
    {
      is_active: false,
      current_odometer_km: 60_000,
      condition_blocks_rental_use: true,
    },
    [
      record({ status: "Open", blocks_rental_use: true }),
      record({
        next_service_date: "2026-08-31",
        next_service_odometer: 59_000,
      }),
    ],
    "2026-09-02",
  );

  assert.equal(readiness.maintenanceReady, false);
  assert.deepEqual(readiness.reasons, [
    "Vehicle inactive",
    "Active blocking maintenance",
    "Preventive maintenance due by date",
    "Preventive maintenance due by odometer",
    "Vehicle condition blocks rental use",
  ]);
});

test("readiness identifies an unavailable odometer without inventing a score", () => {
  const readiness = evaluateMaintenanceReadiness(
    {
      is_active: true,
      current_odometer_km: null,
      condition_blocks_rental_use: false,
    },
    [record({ next_service_odometer: 59_000 })],
    "2026-09-02",
  );
  assert.deepEqual(readiness, {
    maintenanceReady: false,
    reasons: ["Current odometer unavailable for recorded service target"],
  });
});

test("cancelled blocking records do not block readiness", () => {
  const readiness = evaluateMaintenanceReadiness(
    {
      is_active: true,
      current_odometer_km: 10_000,
      condition_blocks_rental_use: false,
    },
    [record({ status: "Cancelled", blocks_rental_use: true })],
    "2026-09-02",
  );
  assert.deepEqual(readiness, { maintenanceReady: true, reasons: [] });
});
