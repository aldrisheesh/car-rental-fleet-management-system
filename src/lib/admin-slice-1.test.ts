import assert from "node:assert/strict";
import test from "node:test";
import {
  bookingActionAvailability,
  canAccessAdminSlice1Path,
  dashboardCompositionState,
  preserveRequiredAmount,
} from "./admin-slice-1.ts";
import {
  currentPaymentProof,
  exactAdminEntity,
  paymentAmountPresentation,
  requirementReviewGate,
} from "./admin-presentations.ts";

test("Owner/Admin and Operations Staff action mapping remains role-safe", () => {
  const facts = {
    role: "Owner/Admin" as const,
    bookingStatus: "Submitted",
    assignedVehicle: true,
    assignedAt: true,
    confirmedAt: false,
    requirementsStatus: "Verified",
    paymentStatus: "Verified",
    hasRental: false,
    rentalActive: false,
    selectedVehicle: true,
    selectedVehicleConflict: false,
  };
  assert.deepEqual(bookingActionAvailability(facts), {
    assign: true,
    confirm: true,
    release: false,
    return: false,
  });
  assert.deepEqual(
    bookingActionAvailability({ ...facts, role: "Operations Staff" }),
    { assign: false, confirm: false, release: false, return: false },
  );
  assert.equal(
    canAccessAdminSlice1Path("Owner/Admin", "/admin/payments"),
    true,
  );
  assert.equal(
    canAccessAdminSlice1Path("Operations Staff", "/admin/payments"),
    false,
  );
  assert.equal(
    canAccessAdminSlice1Path("Operations Staff", "/admin/bookings/booking-1"),
    true,
  );
});

test("exact entity binding does not fall back to a different booking or payment", () => {
  const records = [{ id: "booking-1" }, { id: "booking-2" }];
  assert.deepEqual(exactAdminEntity(records, "booking-2"), { id: "booking-2" });
  assert.equal(exactAdminEntity(records, "missing"), null);
});

test("requirements review gates follow the canonical outcomes", () => {
  assert.deepEqual(
    requirementReviewGate({
      governmentIdOutcome: "Accepted",
      driversLicenseOutcome: "Accepted",
      identityConsistency: "Consistent",
      ltoOutcome: "Clear",
    }),
    { canVerify: true, canResubmit: false },
  );
  assert.deepEqual(
    requirementReviewGate({
      governmentIdOutcome: "Needs Replacement",
      driversLicenseOutcome: "Accepted",
      identityConsistency: "Concern",
      ltoOutcome: "Unavailable",
    }),
    { canVerify: false, canResubmit: true },
  );
});

test("nullable required_amount is preserved instead of calculated", () => {
  assert.equal(preserveRequiredAmount(null), null);
  assert.equal(preserveRequiredAmount(undefined), null);
  assert.equal(preserveRequiredAmount(1250), 1250);
  assert.equal(paymentAmountPresentation(null), null);
  assert.match(paymentAmountPresentation("1250") ?? "", /1,250/);
  assert.equal(
    currentPaymentProof({
      id: "payment-1",
      booking_id: "booking-1",
      status: "Pending Verification",
      payment_proofs: [],
    }),
    null,
  );
});

test("dashboard source failures remain explicitly partial", () => {
  assert.equal(dashboardCompositionState(true, 0), "complete");
  assert.equal(dashboardCompositionState(true, 2), "partial");
  assert.equal(dashboardCompositionState(false, 0), "unavailable");
});
