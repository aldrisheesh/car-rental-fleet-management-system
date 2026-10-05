import assert from "node:assert/strict";
import test from "node:test";
import { hasUnfinishedConfirmedReservation } from "./fleet-transfer-eligibility.ts";
test("unfinished confirmed reservations block persistent branch moves even outside the target week", () => {
  const bookings = [
    { id: "future", assigned_vehicle_id: "v", booking_status: "Confirmed" },
  ];
  assert.equal(hasUnfinishedConfirmedReservation("v", bookings, []), true);
  assert.equal(
    hasUnfinishedConfirmedReservation("v", bookings, [
      { booking_id: "future", ended_at: null },
    ]),
    true,
  );
  assert.equal(
    hasUnfinishedConfirmedReservation("v", bookings, [
      { booking_id: "other", ended_at: "2026-09-01" },
    ]),
    true,
  );
  assert.equal(
    hasUnfinishedConfirmedReservation("v", bookings, [
      { booking_id: "future", ended_at: "2026-09-01" },
    ]),
    false,
  );
  assert.equal(
    hasUnfinishedConfirmedReservation("different", bookings, []),
    false,
  );
  assert.equal(
    hasUnfinishedConfirmedReservation(
      "v",
      [{ ...bookings[0], booking_status: "Submitted" }],
      [],
    ),
    false,
  );
});
