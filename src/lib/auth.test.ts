import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_ROLES,
  canAccessAdminPath,
  hasRole,
  isAppRole,
  type AppPrincipal,
} from "./auth.ts";

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

test("coarse admin route access follows the frozen role matrix", () => {
  const owner = { role: "Owner/Admin" } as AppPrincipal;
  const staff = { role: "Operations Staff" } as AppPrincipal;
  const customer = { role: "Customer/Renter" } as AppPrincipal;
  for (const principal of [owner, staff, customer]) {
    principal.accountStatus = "Active";
  }

  assert.equal(canAccessAdminPath(owner, "/admin"), true);
  assert.equal(canAccessAdminPath(owner, "/admin/payments"), true);
  assert.equal(canAccessAdminPath(staff, "/admin"), true);
  assert.equal(canAccessAdminPath(staff, "/admin/bookings"), true);
  assert.equal(canAccessAdminPath(staff, "/admin/calendar"), true);
  assert.equal(canAccessAdminPath(staff, "/admin/payments"), false);
  assert.equal(canAccessAdminPath(staff, "/admin/customers"), false);
  assert.equal(canAccessAdminPath(staff, "/admin/fleet"), false);
  assert.equal(canAccessAdminPath(staff, "/admin/reports"), true);
  assert.equal(canAccessAdminPath(customer, "/admin/bookings"), false);
});
