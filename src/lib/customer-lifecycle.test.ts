import assert from "node:assert/strict";
import test from "node:test";

import {
  bookingPath,
  type CustomerBooking,
  type RequirementsResponse,
} from "./customer-data.ts";
import {
  deriveCustomerLifecycle,
  paymentForBooking,
  type CustomerBookingComposition,
} from "./customer-lifecycle.ts";
import type { CustomerPayment } from "./payment-retrieval.ts";

function booking(overrides: Partial<CustomerBooking> = {}): CustomerBooking {
  return {
    id: "booking-1",
    booking_status: "Pending Review",
    pickup_at: "2026-10-01T09:00:00+08:00",
    return_at: "2026-10-03T09:00:00+08:00",
    requested_vehicle: null,
    assigned_vehicle: null,
    pickup_branch: null,
    return_branch: null,
    finder_context: null,
    rental: null,
    ...overrides,
  };
}

function requirements(
  status: RequirementsResponse["requirementSet"] extends infer Set
    ? Set extends { status: infer Status }
      ? Status
      : never
    : never,
): RequirementsResponse {
  return {
    requirementSet: {
      id: "requirements-1",
      booking_id: "booking-1",
      customer_id: "customer-1",
      status: status as "Not Submitted",
      submitted_at: null,
    },
    documents: [],
    review: null,
    requiredTypes: ["Government ID", "Driver's License"],
  };
}

function payment(
  status: CustomerPayment["status"],
  bookingId = "booking-1",
): CustomerPayment {
  return {
    id: `payment-${bookingId}`,
    booking_id: bookingId,
    status,
    required_amount: null,
  };
}

function composition(
  overrides: Partial<CustomerBookingComposition> = {},
): CustomerBookingComposition {
  return {
    booking: booking(),
    requirements: requirements("Not Submitted"),
    payment: null,
    paymentMethods: [],
    requirementsAvailable: true,
    paymentAvailable: true,
    requirementsError: null,
    paymentError: null,
    ...overrides,
  };
}

test("customer lifecycle distinguishes action-required and waiting states", () => {
  const requirementsNeeded = deriveCustomerLifecycle(
    composition({ requirements: requirements("Not Submitted") }),
  );
  assert.equal(requirementsNeeded.state, "requirements-needed");
  assert.equal(requirementsNeeded.actionRequired, true);
  assert.equal(requirementsNeeded.waiting, false);

  const requirementsWaiting = deriveCustomerLifecycle(
    composition({ requirements: requirements("Pending Review") }),
  );
  assert.equal(requirementsWaiting.state, "requirements-review");
  assert.equal(requirementsWaiting.actionRequired, false);
  assert.equal(requirementsWaiting.waiting, true);

  const paymentAction = deriveCustomerLifecycle(
    composition({
      requirements: requirements("Verified"),
      payment: null,
    }),
  );
  assert.equal(paymentAction.state, "payment-action");
  assert.equal(paymentAction.actionRequired, true);

  const paymentWaiting = deriveCustomerLifecycle(
    composition({
      requirements: requirements("Verified"),
      payment: payment("Pending Verification"),
    }),
  );
  assert.equal(paymentWaiting.state, "payment-review");
  assert.equal(paymentWaiting.waiting, true);
  assert.equal(paymentWaiting.actionRequired, false);

  const paymentResubmission = deriveCustomerLifecycle(
    composition({
      requirements: requirements("Verified"),
      payment: {
        ...payment("Needs Resubmission"),
        resubmission_reason: "The proof is not readable.",
      },
    }),
  );
  assert.equal(paymentResubmission.state, "payment-resubmission");
  assert.equal(paymentResubmission.actionRequired, true);
  assert.equal(paymentResubmission.reason, "The proof is not readable.");
});

test("payment composition is bound to the exact booking", () => {
  const otherBookingPayment = payment("Verified", "booking-2");
  assert.equal(paymentForBooking("booking-1", [otherBookingPayment]), null);

  const exactPayment = payment("Pending Verification", "booking-1");
  assert.equal(
    paymentForBooking("booking-1", [otherBookingPayment, exactPayment]),
    exactPayment,
  );
  assert.equal(bookingPath("booking-1"), "/bookings/booking-1");
  assert.equal(
    bookingPath("booking/with spaces"),
    "/bookings/booking%2Fwith%20spaces",
  );
});

test("rental lifecycle uses canonical confirmation, release, and return data", () => {
  const confirmed = deriveCustomerLifecycle(
    composition({
      booking: booking({ booking_status: "Confirmed" }),
      requirements: requirements("Verified"),
      payment: payment("Verified"),
    }),
  );
  assert.equal(confirmed.state, "confirmed");

  const active = deriveCustomerLifecycle(
    composition({
      booking: booking({
        booking_status: "Confirmed",
        rental: {
          id: "rental-1",
          booking_id: "booking-1",
          vehicle_id: "vehicle-1",
          scheduled_pickup_at: "2026-10-01T09:00:00+08:00",
          scheduled_return_at: "2026-10-03T09:00:00+08:00",
          started_at: "2026-10-01T09:05:00+08:00",
          ended_at: null,
        },
      }),
      requirements: requirements("Verified"),
      payment: payment("Verified"),
    }),
  );
  assert.equal(active.state, "active-rental");

  const returned = deriveCustomerLifecycle(
    composition({
      booking: booking({
        booking_status: "Confirmed",
        rental: {
          id: "rental-1",
          booking_id: "booking-1",
          vehicle_id: "vehicle-1",
          scheduled_pickup_at: "2026-10-01T09:00:00+08:00",
          scheduled_return_at: "2026-10-03T09:00:00+08:00",
          started_at: "2026-10-01T09:05:00+08:00",
          ended_at: "2026-10-03T08:50:00+08:00",
        },
      }),
      requirements: requirements("Verified"),
      payment: payment("Verified"),
    }),
  );
  assert.equal(returned.state, "returned");
  assert.equal(returned.statusLabel, "Return recorded");
  assert.doesNotMatch(
    `${returned.title} ${returned.statusLabel} ${returned.message}`,
    /\bcompleted\b|\bsettled\b|\bfully paid\b|final charges complete/i,
  );
});
