import assert from "node:assert/strict";
import test from "node:test";
import { parseCustomerPaymentResponse } from "./payment-retrieval.ts";

function response(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

test("customer payment retrieval accepts persisted payment states", async () => {
  const payment = {
    id: "payment-1",
    booking_id: "booking-1",
    status: "Verified",
    payment_method_label: "Demo bank/e-wallet",
    submitted_amount: 1500,
    transaction_reference: "QA-PAY-001-NOT-A-TRANSACTION",
  };

  assert.deepEqual(
    await parseCustomerPaymentResponse(response({ payments: [payment] })),
    [payment],
  );
  assert.deepEqual(
    await parseCustomerPaymentResponse(response({ payments: [] })),
    [],
  );
});

test("customer payment retrieval rejects non-canonical payment states", async () => {
  await assert.rejects(
    parseCustomerPaymentResponse(
      response({
        payments: [
          { id: "payment-1", booking_id: "booking-1", status: "Invalid" },
        ],
      }),
    ),
    /Unable to load payment status/,
  );
});

test("customer payment retrieval preserves API failures", async () => {
  await assert.rejects(
    parseCustomerPaymentResponse(
      response({ message: "Unable to load payments." }, false),
    ),
    /Unable to load payments/,
  );
});
