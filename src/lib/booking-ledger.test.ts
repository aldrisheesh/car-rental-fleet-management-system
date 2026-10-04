import test from "node:test";
import assert from "node:assert/strict";
import { currentLedgerStage } from "./booking-ledger.ts";
import type { AdminBooking } from "./admin-presentations.ts";
const stage = (
  status: string,
  rental: unknown = null,
  requirements = "Verified",
  payment = "Verified",
) =>
  currentLedgerStage({
    booking: { booking_status: status, rental } as AdminBooking,
    requirementStatus: requirements,
    paymentStatus: payment,
  });
test("active and returned rentals belong to return, while confirmed bookings await release", () => {
  assert.equal(stage("Confirmed"), 5);
  assert.equal(stage("Confirmed", { started_at: "2026-10-04T01:00:00Z" }), 6);
  assert.equal(
    stage("Confirmed", {
      started_at: "2026-10-04T01:00:00Z",
      ended_at: "2026-10-05T01:00:00Z",
    }),
    6,
  );
});
test("review steps and terminal records do not imply a release action", () => {
  assert.equal(stage("Draft", null, "Not Submitted", "Not Submitted"), 1);
  assert.equal(stage("Submitted", null, "Pending Review", "Not Submitted"), 2);
  assert.equal(stage("Submitted"), 4);
  assert.equal(stage("Rejected"), 0);
  assert.equal(stage("Cancelled"), 0);
});

test("quote preparation precedes payment and remains gated by requirements", () => {
  const booking = { booking_status: "Submitted", rental: null } as AdminBooking;
  assert.equal(
    currentLedgerStage({
      booking,
      requirementStatus: "Verified",
      paymentStatus: "Not Submitted",
      quoteIssued: false,
    }),
    3,
  );
  assert.equal(
    currentLedgerStage({
      booking,
      requirementStatus: "Verified",
      paymentStatus: "Not Submitted",
      quoteIssued: true,
    }),
    4,
  );
  assert.equal(
    currentLedgerStage({
      booking,
      requirementStatus: "Pending Review",
      paymentStatus: "Not Submitted",
      quoteIssued: true,
    }),
    2,
  );
});
