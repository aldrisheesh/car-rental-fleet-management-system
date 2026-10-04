import assert from "node:assert/strict";
import test from "node:test";
import { bookingStage } from "./booking-stage.ts";
import type { AdminBooking } from "./admin-presentations";

const base: AdminBooking = {
  id: "test",
  pickup_at: "2026-01-01",
  return_at: "2026-01-02",
  booking_status: "Submitted",
  requirement_status: "Verified",
  payment_status: "Verified",
};
test("confirmation requires both document and payment verification", () => {
  assert.equal(bookingStage(base).label, "Ready to confirm");
  assert.equal(
    bookingStage({ ...base, requirement_status: "Pending Review" }).label,
    "Document review",
  );
  assert.equal(
    bookingStage({ ...base, payment_status: "Pending Verification" }).label,
    "Payment review",
  );
  assert.notEqual(
    bookingStage({ ...base, payment_status: undefined }).label,
    "Ready to confirm",
  );
});
test("confirmed and past dates do not imply active rental", () => {
  assert.equal(
    bookingStage({ ...base, booking_status: "Confirmed" }).label,
    "Confirmed",
  );
});
test("actual rental timestamps determine active and returned states", () => {
  const rental = {
    id: "r",
    scheduled_pickup_at: base.pickup_at,
    scheduled_return_at: base.return_at,
    started_at: "2026-01-01",
    ended_at: null,
  };
  assert.equal(
    bookingStage({ ...base, booking_status: "Confirmed", rental }).label,
    "Active rental",
  );
  assert.equal(
    bookingStage({
      ...base,
      booking_status: "Confirmed",
      rental: { ...rental, ended_at: "2026-01-02" },
    }).label,
    "Returned",
  );
  assert.equal(
    bookingStage({ ...base, booking_status: "Cancelled", rental }).label,
    "Review needed",
  );
});
test("closed and draft requests cannot be presented as ready to confirm", () => {
  for (const booking_status of ["Draft", "Rejected", "Cancelled"])
    assert.equal(
      bookingStage({ ...base, booking_status }).label,
      booking_status,
    );
});
test("correction and missing evidence remain explicit", () => {
  assert.equal(
    bookingStage({ ...base, requirement_status: "Needs Resubmission" }).label,
    "Awaiting documents",
  );
  assert.equal(
    bookingStage({ ...base, payment_status: "Needs Resubmission" }).label,
    "Awaiting payment",
  );
  assert.equal(
    bookingStage({ ...base, requirement_status: undefined }).label,
    "Status unavailable",
  );
  assert.equal(
    bookingStage({ ...base, booking_status: "unexpected" }).label,
    "Review needed",
  );
});
