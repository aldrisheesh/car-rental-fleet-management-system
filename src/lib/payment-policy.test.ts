import assert from "node:assert/strict";
import test from "node:test";
import {
  hasCurrentPaymentPolicyAcknowledgement,
  PAYMENT_POLICY_VERSION,
} from "./payment-policy.ts";

test("requires explicit acknowledgement of the current policy", () => {
  const form = new FormData();
  assert.equal(hasCurrentPaymentPolicyAcknowledgement(form), false);
  form.set("policyVersion", PAYMENT_POLICY_VERSION);
  form.set("policyAcknowledged", "false");
  assert.equal(hasCurrentPaymentPolicyAcknowledgement(form), false);
  form.set("policyAcknowledged", "true");
  assert.equal(hasCurrentPaymentPolicyAcknowledgement(form), true);
  form.set("policyVersion", "outdated");
  assert.equal(hasCurrentPaymentPolicyAcknowledgement(form), false);
  form.delete("policyVersion");
  assert.equal(hasCurrentPaymentPolicyAcknowledgement(form), false);
});
