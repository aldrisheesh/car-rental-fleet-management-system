import assert from "node:assert/strict";
import test from "node:test";
import { BOOKING_READ_SELECT } from "./booking-reads.ts";

test("booking reads use the customer relationship explicitly", () => {
  assert.match(
    BOOKING_READ_SELECT,
    /customer:profiles!booking_requests_customer_id_fkey\(/,
  );
  assert.doesNotMatch(BOOKING_READ_SELECT, /customer:profiles\(/);
});
