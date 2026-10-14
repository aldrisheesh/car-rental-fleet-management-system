import { buildTransactionalEmail } from "./email-templates.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  paymentHoldAllowsProof,
  paymentHoldExpired,
  formatPaymentDeadline,
  type PaymentHold,
} from "./payment-hold.ts";
const hold: PaymentHold = {
  booking_id: "b",
  state: "AwaitingPayment",
  opened_at: "2026-10-14T00:00Z",
  deadline_at: "2026-10-15T00:00Z",
  review_due_at: null,
  generation: 1,
  correction_count: 0,
};
test("deadline closes proof submission at the exact boundary", () => {
  assert.ok(
    paymentHoldAllowsProof(hold, Date.parse("2026-10-14T23:59:59.999Z")),
  );
  assert.ok(!paymentHoldAllowsProof(hold, Date.parse(hold.deadline_at)));
  assert.ok(paymentHoldExpired(hold, Date.parse(hold.deadline_at)));
});
test("review and verification are protected beyond the original deadline", () => {
  for (const state of ["Review", "Verified"] as const) {
    assert.ok(
      !paymentHoldExpired({ ...hold, state }, Date.parse("2026-11-01T00:00Z")),
    );
    assert.ok(!paymentHoldAllowsProof({ ...hold, state }));
  }
});
test("legacy quotes have no invented deadline", () =>
  assert.ok(paymentHoldAllowsProof(null)));
test("correction window and explicit expiry use the same server-derived deadline", () => {
  assert.ok(
    paymentHoldAllowsProof(
      { ...hold, state: "Correction" },
      Date.parse(hold.opened_at),
    ),
  );
  assert.ok(
    !paymentHoldAllowsProof(
      { ...hold, state: "Expired" },
      Date.parse(hold.opened_at),
    ),
  );
});
test("visible deadline identifies the Manila timezone", () =>
  assert.match(formatPaymentDeadline(hold.deadline_at), /Manila time/));

test("owner review escalation links to the owner booking screen", () => {
  const message = buildTransactionalEmail({
    emailType: "payment_review_overdue",
    appBaseUrl: "https://briahcarrental.site",
    bookingId: "d1000000-0000-4000-8000-000000000005",
  });
  assert.match(
    message.text,
    /https:\/\/briahcarrental.site\/admin\/bookings\/d1000000/,
  );
});
