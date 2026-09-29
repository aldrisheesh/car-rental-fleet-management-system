import assert from "node:assert/strict";
import test from "node:test";

import {
  canEstablishOAuthSession,
  oauthDestinationForPrincipal,
  safeOAuthDestination,
} from "./auth-oauth.ts";
import type { AppPrincipal } from "./auth.ts";

const customer: AppPrincipal = {
  userId: "google-user",
  email: "google-user@example.test",
  fullName: "Google User",
  phoneNumber: null,
  role: "Customer/Renter",
  accountStatus: "Active",
};

test("OAuth sessions only establish for active canonical profiles", () => {
  assert.equal(canEstablishOAuthSession(customer), true);
  assert.equal(
    canEstablishOAuthSession({ ...customer, accountStatus: "Inactive" }),
    false,
  );
});

test("OAuth redirects keep customers internal and deny unsafe targets", () => {
  assert.equal(
    safeOAuthDestination("/booking?vehicle=car-1", "/customer"),
    "/booking?vehicle=car-1",
  );
  assert.equal(
    safeOAuthDestination("https://malicious.example", "/customer"),
    "/customer",
  );
  assert.equal(
    safeOAuthDestination("/api/auth/session", "/customer"),
    "/customer",
  );
  assert.equal(
    oauthDestinationForPrincipal(customer, "/customer/profile"),
    "/customer/profile",
  );
  assert.equal(oauthDestinationForPrincipal(customer, "/admin"), "/customer");
});

test("OAuth never upgrades staff or admins from provider metadata", () => {
  const admin = { ...customer, role: "Owner/Admin" as const };
  const staff = { ...customer, role: "Operations Staff" as const };
  assert.equal(oauthDestinationForPrincipal(admin, "/customer"), "/admin");
  assert.equal(oauthDestinationForPrincipal(staff, "/customer"), "/admin");
});
