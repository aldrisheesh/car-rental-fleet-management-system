import assert from "node:assert/strict";
import test from "node:test";
import {
  bookingReference,
  bookingReferenceLabel,
} from "./booking-reference.ts";
import { signInDestination } from "./sign-in-destination.ts";
import {
  notificationEntityBindings,
  notificationReference,
  notificationRoute,
  type CanonicalNotification,
} from "./notifications.ts";

const bookingA = "c1000000-0000-0000-0000-000000000002";
const bookingB = "c1000000-0000-0000-0000-000000000003";
const event: CanonicalNotification = {
  id: "event-1",
  notificationType: "payment_verified",
  relatedEntityType: "payment",
  relatedEntityId: "payment-1",
  title: "Payment verified",
  message: "Recorded event",
  createdAt: "2026-10-01T01:00:00Z",
  readAt: null,
};

test("display references distinguish seeded IDs with a common prefix and preserve meaningful short IDs", () => {
  assert.notEqual(bookingReference(bookingA), bookingReference(bookingB));
  assert.equal(
    bookingReferenceLabel(bookingA),
    `Booking ${bookingReference(bookingA)}`,
  );
  assert.equal(bookingReference(" booking-1 "), "#BOOKING-1");
  assert.equal(bookingReference(""), "Reference unavailable");
});
test("staff sign-in ignores an owner-only requested destination", () => {
  assert.equal(
    signInDestination("Operations Staff", "/", "/admin/payments"),
    "/admin",
  );
  assert.equal(
    signInDestination("Owner/Admin", "/", "/admin/payments"),
    "/admin/payments",
  );
  assert.equal(
    signInDestination("Customer/Renter", "/customer", "/admin"),
    "/customer",
  );
});
test("notification projections discard invalid binding rows without inventing booking context", () => {
  assert.deepEqual(
    notificationEntityBindings([
      { id: "p1", booking_id: bookingA },
      null,
      { id: "p2", booking_id: null },
      { id: 3, booking_id: bookingB },
    ]),
    [{ id: "p1", booking_id: bookingA }],
  );
  assert.deepEqual(notificationEntityBindings(null), []);
});
test("staff payment events open their permitted booking; owners retain payment review", () => {
  const bindings = [{ notificationId: event.id, bookingId: bookingA }];
  assert.equal(
    notificationRoute(event, "admin", [], bindings, true),
    `/admin/bookings/${bookingA}`,
  );
  assert.equal(
    notificationRoute(event, "admin", [], bindings),
    "/admin/payments/payment-1",
  );
  assert.equal(
    notificationRoute(event, "admin", [], [], true),
    "/admin/bookings",
  );
  assert.equal(
    notificationReference(event, [], bindings),
    bookingReferenceLabel(bookingA),
  );
  assert.equal(
    notificationReference(event, [
      { bookingId: bookingA, paymentId: "payment-1" },
    ]),
    bookingReferenceLabel(bookingA),
  );
  assert.equal(notificationReference(event), "Payment #PAYMENT-1");
});
