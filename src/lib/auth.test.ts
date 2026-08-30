import assert from "node:assert/strict";
import test from "node:test";
import { APP_ROLES, hasRole, isAppRole, type AppPrincipal } from "./auth.ts";

test("application roles are canonical and closed", () => {
  assert.deepEqual(APP_ROLES, [
    "Owner/Admin",
    "Operations Staff",
    "Customer/Renter",
  ]);
  assert.equal(isAppRole("Customer/Renter"), true);
  assert.equal(isAppRole("Customers / Renters"), false);
  assert.equal(isAppRole("owner"), false);
});

test("role checks do not accept arbitrary role values", () => {
  const principal: AppPrincipal = {
    userId: "user-1",
    email: "customer@example.test",
    fullName: "Test Customer",
    phoneNumber: null,
    role: "Customer/Renter" as const,
    accountStatus: "Active",
  };
  assert.equal(hasRole(principal, "Customer/Renter"), true);
  assert.equal(hasRole(principal, "Owner/Admin"), false);
});
