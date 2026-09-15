import test from "node:test";
import assert from "node:assert/strict";

import { isMyBookingsPath } from "./customer-navigation.ts";

test("marks customer booking list and per-booking routes as My Bookings paths", () => {
  assert.equal(isMyBookingsPath("/customer"), true);
  assert.equal(isMyBookingsPath("/customer/profile"), true);
  assert.equal(isMyBookingsPath("/bookings/booking-123"), true);
  assert.equal(isMyBookingsPath("/bookings/booking-123/"), true);
});

test("does not mark unrelated customer routes as My Bookings paths", () => {
  assert.equal(isMyBookingsPath("/"), false);
  assert.equal(isMyBookingsPath("/vehicles"), false);
  assert.equal(isMyBookingsPath("/contact"), false);
});
