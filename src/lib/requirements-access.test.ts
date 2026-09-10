import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessRenterRequirementDocument,
  canReviewRenterRequirements,
  isPaymentEligibleRequirementStatus,
} from "./requirements-access.ts";

test("only Owner/Admin can record renter-requirement reviews", () => {
  assert.equal(canReviewRenterRequirements("Owner/Admin"), true);
  assert.equal(canReviewRenterRequirements("Operations Staff"), false);
  assert.equal(canReviewRenterRequirements("Customer/Renter"), false);
});

test("private requirement documents are limited to Owner/Admin or their customer", () => {
  assert.equal(
    canAccessRenterRequirementDocument(
      { role: "Owner/Admin", userId: "owner" },
      "customer-a",
    ),
    true,
  );
  assert.equal(
    canAccessRenterRequirementDocument(
      { role: "Customer/Renter", userId: "customer-a" },
      "customer-a",
    ),
    true,
  );
  assert.equal(
    canAccessRenterRequirementDocument(
      { role: "Customer/Renter", userId: "customer-b" },
      "customer-a",
    ),
    false,
  );
  assert.equal(
    canAccessRenterRequirementDocument(
      { role: "Operations Staff", userId: "staff" },
      "customer-a",
    ),
    false,
  );
});

test("payment eligibility keeps the canonical Verified-only requirement gate", () => {
  for (const status of [
    null,
    undefined,
    "Not Submitted",
    "Pending Review",
    "Needs Resubmission",
  ])
    assert.equal(isPaymentEligibleRequirementStatus(status), false);
  assert.equal(isPaymentEligibleRequirementStatus("Verified"), true);
});
