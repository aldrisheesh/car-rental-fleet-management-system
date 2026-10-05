import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBalance,
  evaluateSupplyVehicles,
  hasFutureMaintenanceConflict,
  overlaps,
  manilaDateBoundaryToInstant,
} from "./supply-evaluation.server.ts";

const weekStart = manilaDateBoundaryToInstant("2026-09-07")!;
const weekEnd = manilaDateBoundaryToInstant("2026-09-14")!;

test("VS015 converts Manila week boundaries to instants", () => {
  assert.equal(weekStart, "2026-09-06T16:00:00.000Z");
  assert.equal(weekEnd, "2026-09-13T16:00:00.000Z");
});

test("VS015 uses half-open overlap boundaries", () => {
  assert.equal(
    overlaps(
      "2026-09-06T15:59:59Z",
      "2026-09-06T16:00:00Z",
      weekStart,
      weekEnd,
    ),
    false,
  );
  assert.equal(
    overlaps(
      "2026-09-06T16:00:00Z",
      "2026-09-06T17:00:00Z",
      weekStart,
      weekEnd,
    ),
    true,
  );
  assert.equal(
    overlaps(
      "2026-09-13T15:00:00Z",
      "2026-09-13T16:00:00Z",
      weekStart,
      weekEnd,
    ),
    true,
  );
  assert.equal(
    overlaps(
      "2026-09-13T16:00:00Z",
      "2026-09-13T17:00:00Z",
      weekStart,
      weekEnd,
    ),
    false,
  );
  assert.equal(
    overlaps("not-a-date", "2026-09-08T00:00:00Z", weekStart, weekEnd),
    false,
  );
});
test("VS015 counts vehicles once and preserves reasons", () => {
  const r = evaluateSupplyVehicles([
    {
      id: "v1",
      branch_id: "b",
      category_id: "c",
      is_active: true,
      readiness: { maintenanceReady: false, reasons: [] },
      bookingConflict: true,
      rentalConflict: true,
    },
  ]);
  assert.equal(r.projectedSupply, 0);
  assert.deepEqual(r.items[0].exclusion_reasons, [
    "MaintenanceNotReady",
    "ConfirmedBookingConflict",
    "ActiveRental",
  ]);
});
test("VS015 derives shortage, surplus, balanced", () => {
  assert.deepEqual(calculateBalance(5, 3), {
    shortageUnits: 2,
    surplusUnits: 0,
    balanceState: "Shortage",
  });
  assert.deepEqual(calculateBalance(3, 5), {
    shortageUnits: 0,
    surplusUnits: 2,
    balanceState: "Surplus",
  });
  assert.deepEqual(calculateBalance(3, 3), {
    shortageUnits: 0,
    surplusUnits: 0,
    balanceState: "Balanced",
  });
});

test("maintenance due before the half-open target week ends blocks supply", () => {
  assert.equal(
    hasFutureMaintenanceConflict(
      [{ next_service_date: "2026-10-04" }],
      "2026-10-05",
    ),
    true,
  );
  assert.equal(
    hasFutureMaintenanceConflict(
      [{ next_service_date: "2026-10-05" }],
      "2026-10-05",
    ),
    false,
  );
});

test("a returned rental frees its scheduled booking while unfinished reservations still block", async () => {
  const { hasOutstandingBookingConflict } =
    await import("./supply-evaluation.server.ts");
  const bookings = [
    {
      id: "early-return",
      pickup_at: "2026-10-05T02:00:00Z",
      return_at: "2026-10-10T02:00:00Z",
    },
  ];
  const start = "2026-10-04T16:00:00Z",
    end = "2026-10-11T16:00:00Z";
  assert.equal(
    hasOutstandingBookingConflict(
      bookings,
      [{ booking_id: "early-return", ended_at: "2026-10-04T12:00:00Z" }],
      start,
      end,
    ),
    false,
  );
  assert.equal(
    hasOutstandingBookingConflict(
      bookings,
      [{ booking_id: "early-return", ended_at: null }],
      start,
      end,
    ),
    true,
  );
  assert.equal(hasOutstandingBookingConflict(bookings, [], start, end), true);
});
