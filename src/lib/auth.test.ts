import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_ROLES,
  canAccessAdminPath,
  hasRole,
  isAppRole,
  type AppPrincipal,
} from "./auth.ts";
import { readFile } from "node:fs/promises";

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
  assert.equal(canAccessAdminPath(staff, "/admin/notifications"), true);
  assert.equal(canAccessAdminPath(staff, "/admin/payments"), false);
  assert.equal(canAccessAdminPath(staff, "/admin/customers"), false);
  assert.equal(canAccessAdminPath(staff, "/admin/fleet"), false);
  assert.equal(canAccessAdminPath(staff, "/admin/reports"), true);
  assert.equal(canAccessAdminPath(customer, "/admin/bookings"), false);
});

test("admin sign-out waits for the shared credential session to clear", async () => {
  const [adminAuth, adminShell, header] = await Promise.all([
    readFile(new URL("./admin-auth.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../components/admin/AdminShell.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../components/site/Header.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(adminAuth, /export async function signOutAdmin\(\)\s*\{\s*await signOutWithCredentialsApi\(\)/);
  assert.match(adminShell, /async function handleSignOut\(\)[\s\S]*await signOutAdmin\(\)[\s\S]*navigate\(\{ to: "\/", replace: true \}\)/);
  assert.doesNotMatch(adminShell, /clearCustomerSession/);
  assert.match(header, /window\.addEventListener\(ADMIN_SESSION_CHANGED_EVENT, syncPrincipal\)/);
});

test("homepage authentication updates the shell in place and Google prompts for an account", async () => {
  const [dialog, header, authIntegration] = await Promise.all([
    readFile(
      new URL("../components/site/SignInDialog.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../components/site/Header.tsx", import.meta.url), "utf8"),
    readFile(new URL("./auth-integration.ts", import.meta.url), "utf8"),
  ]);
  assert.match(dialog, /onAuthenticated\?\.\(\);/);
  assert.match(dialog, /if \(destination === customerDestination\(\)\) return;/);
  assert.match(header, /onAuthenticated=\{\(\) => setPrincipal\(getClientPrincipal\(\)\)\}/);
  assert.match(authIntegration, /queryParams: \{ prompt: "select_account" \}/);
});
