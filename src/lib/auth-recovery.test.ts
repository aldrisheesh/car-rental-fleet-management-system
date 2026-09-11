import assert from "node:assert/strict";
import test from "node:test";

import { getUnauthorizedRecoveryDestination } from "./auth-recovery.ts";

test("unauthenticated customer dashboard recovery returns home", () => {
  assert.equal(getUnauthorizedRecoveryDestination("/customer", false), "/");
});

test("unauthenticated maintenance recovery returns home", () => {
  assert.equal(
    getUnauthorizedRecoveryDestination("/admin/maintenance", false),
    "/",
  );
});

test("other unauthenticated customer-area recovery keeps sign-in routing", () => {
  assert.equal(
    getUnauthorizedRecoveryDestination("/customer/profile", false),
    "/sign-in",
  );
});

test("authenticated unauthorized requests recover home", () => {
  assert.equal(getUnauthorizedRecoveryDestination("/customer", true), "/");
});
