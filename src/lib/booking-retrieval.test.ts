import assert from "node:assert/strict";
import test from "node:test";
import {
  parseAdminBookingResponse,
  parseCustomerBookingResponse,
} from "./booking-retrieval.ts";

function response(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

test("customer booking retrieval accepts only the customer collection contract", async () => {
  assert.deepEqual(
    await parseCustomerBookingResponse(
      response([{ id: "booking-1", booking_status: "Submitted" }]),
    ),
    [{ id: "booking-1", booking_status: "Submitted" }],
  );
  await assert.rejects(
    parseCustomerBookingResponse(response({ bookings: [] })),
    /Unable to load booking requests/,
  );
});

test("admin booking retrieval accepts its collection and candidate vehicle contract", async () => {
  assert.deepEqual(
    await parseAdminBookingResponse(
      response({ bookings: [{ id: "booking-1" }], candidateVehicles: [] }),
    ),
    { bookings: [{ id: "booking-1" }], candidateVehicles: [] },
  );
  await assert.rejects(
    parseAdminBookingResponse(response({ bookings: [] })),
    /Unable to load booking requests/,
  );
});

test("booking retrieval preserves the API failure message instead of treating it as an empty collection", async () => {
  await assert.rejects(
    parseCustomerBookingResponse(
      response({ message: "Unable to load booking requests." }, false),
    ),
    /Unable to load booking requests/,
  );
  await assert.rejects(
    parseAdminBookingResponse(response(null, false)),
    /Unable to load booking requests/,
  );
});
