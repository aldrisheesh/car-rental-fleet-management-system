import test from "node:test";
import assert from "node:assert/strict";
import { selectAuthoritativePreventiveTargets } from "./maintenance-readiness.ts";

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
