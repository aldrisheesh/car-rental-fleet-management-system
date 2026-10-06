import assert from "node:assert/strict";
import test from "node:test";
import {
  transferDecisionReason,
  TRANSFER_REVIEW_FACTORS,
  TRANSFER_DECLINE_REASONS,
} from "./allocation-decision-reason.ts";
import { validCategory } from "./booking-categories.ts";

test("all reviewed factors survive serialization through the existing reason contract", () => {
  const factors = TRANSFER_REVIEW_FACTORS.map(([key]) => key);
  const value = transferDecisionReason(
    "Approved",
    factors,
    "",
    "Checked with the team",
  );
  assert.equal(validCategory("allocation_review", value), true);
  for (const [, label] of TRANSFER_REVIEW_FACTORS)
    assert.ok(value.includes(label));
  assert.ok(value.includes("Checked with the team"));
});
test("approval needs reviewed factors but no decline reason", () => {
  assert.ok(transferDecisionReason("Approved", ["weather", "fuel"], "", ""));
  assert.equal(transferDecisionReason("Approved", [], "", ""), "");
  assert.equal(transferDecisionReason("Approved", ["invented"], "", ""), "");
});
test("declining requires a known reason and Other requires details", () => {
  assert.equal(transferDecisionReason("Rejected", ["route"], "", ""), "");
  assert.equal(
    transferDecisionReason("Rejected", ["route"], "Other reason", " "),
    "",
  );
  assert.ok(
    transferDecisionReason(
      "Rejected",
      ["route"],
      "Other reason",
      "Receiving staff unavailable",
    ),
  );
  for (const reason of TRANSFER_DECLINE_REASONS.filter(
    (r) => r !== "Other reason",
  )) {
    const value = transferDecisionReason(
      "Rejected",
      TRANSFER_REVIEW_FACTORS.map(([key]) => key),
      reason,
      "x".repeat(200),
    );
    assert.equal(validCategory("allocation_review", value), true, reason);
    assert.ok(value.includes(reason));
  }
});
