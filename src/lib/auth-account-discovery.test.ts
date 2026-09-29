import assert from "node:assert/strict";
import test from "node:test";

import { getAccountNextStep } from "./auth-account-discovery.ts";

test("active canonical profiles proceed to credential sign-in regardless of role", () => {
  assert.equal(getAccountNextStep({ accountStatus: "Active" }), "sign-in");
});

test("inactive canonical profiles remain unavailable", () => {
  assert.equal(
    getAccountNextStep({ accountStatus: "Inactive" }),
    "unavailable",
  );
  assert.equal(getAccountNextStep(null), "sign-up");
});
