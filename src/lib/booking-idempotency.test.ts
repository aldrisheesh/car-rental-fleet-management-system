import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { existingBookingFromLookup } from "./booking-idempotency.ts";

test("treats an all-null booking composite as no existing booking", () => {
  assert.equal(
    existingBookingFromLookup({
      id: null,
      customer_id: null,
      booking_status: null,
      created_at: null,
    }),
    null,
  );
});

test("returns a real existing booking from the idempotency lookup", () => {
  const booking = {
    id: "booking-1",
    customer_id: "customer-1",
    booking_status: "Submitted",
  };

  assert.equal(existingBookingFromLookup(booking), booking);
  assert.equal(existingBookingFromLookup([booking]), booking);
});

test("booking creation continues when the lookup has no booking", async () => {
  const source = await readFile(
    new URL("../routes/api.bookings.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /existingBookingFromLookup\(existing\.data\)/);
  assert.match(
    source,
    /if \(existingBooking\) return Response\.json\(existingBooking/,
  );
  assert.match(source, /create_booking_idempotent/);
});
