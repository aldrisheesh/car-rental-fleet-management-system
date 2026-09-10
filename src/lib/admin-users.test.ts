import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { APP_ROLES } from "./auth.ts";
import {
  canManageApplicationUsers,
  parseAdminUserRole,
  toAdminUserAccount,
} from "./admin-users.ts";

test("admin user roles use the canonical application vocabulary", () => {
  assert.deepEqual(
    [...APP_ROLES],
    ["Owner/Admin", "Operations Staff", "Customer/Renter"],
  );
  assert.equal(parseAdminUserRole("Owner/Admin"), "Owner/Admin");
  assert.equal(parseAdminUserRole("Operations Staff"), "Operations Staff");
  assert.equal(parseAdminUserRole("Customer/Renter"), "Customer/Renter");
});

test("prototype role labels cannot be presented as application roles", () => {
  assert.equal(parseAdminUserRole("Business Owner"), null);
  assert.equal(parseAdminUserRole("Staff"), null);
  assert.equal(parseAdminUserRole("Customers / Renters"), null);
  assert.equal(parseAdminUserRole("not-a-role"), null);
});

test("only Owner/Admin can manage application users", () => {
  assert.equal(canManageApplicationUsers("Owner/Admin"), true);
  assert.equal(canManageApplicationUsers("Operations Staff"), false);
  assert.equal(canManageApplicationUsers("Customer/Renter"), false);
  assert.equal(canManageApplicationUsers(undefined), false);
});

test("canonical profile rows map to the account read model", () => {
  assert.deepEqual(
    toAdminUserAccount({
      id: "00000000-0000-4000-8000-000000000001",
      email: "qa@example.test",
      full_name: "QA Owner",
      phone_number: "+63 900 000 0000",
      street_address: "1 Main St",
      barangay: "Barangay 1",
      city_municipality: "Manila",
      province: "Metro Manila",
      postal_code: "1000",
      user_type: "Owner/Admin",
      account_status: "Active",
      created_at: "2026-09-10T00:00:00.000Z",
    }),
    {
      id: "00000000-0000-4000-8000-000000000001",
      email: "qa@example.test",
      fullName: "QA Owner",
      phoneNumber: "+63 900 000 0000",
      streetAddress: "1 Main St",
      barangay: "Barangay 1",
      cityMunicipality: "Manila",
      province: "Metro Manila",
      postalCode: "1000",
      role: "Owner/Admin",
      accountStatus: "Active",
      createdAt: "2026-09-10T00:00:00.000Z",
    },
  );
  assert.equal(
    toAdminUserAccount({
      id: "00000000-0000-4000-8000-000000000002",
      email: "legacy@example.test",
      full_name: "Legacy",
      phone_number: null,
      street_address: null,
      barangay: null,
      city_municipality: null,
      province: null,
      postal_code: null,
      user_type: "Business Owner",
      account_status: "Active",
      created_at: "2026-09-10T00:00:00.000Z",
    }),
    null,
  );
});

test("the users route uses a trusted Owner/Admin boundary and no prototype controls", () => {
  const apiSource = readFileSync(
    new URL("../routes/api.admin-users.ts", import.meta.url),
    "utf8",
  );
  const pageSource = readFileSync(
    new URL("../routes/admin.users.tsx", import.meta.url),
    "utf8",
  );

  assert.match(apiSource, /await requireRole\("Owner\/Admin"\)/);
  assert.match(apiSource, /getSupabaseServerClient/);
  assert.match(apiSource, /\.from\("profiles"\)/);
  assert.match(apiSource, /\.update\(\{ user_type: role \}\)/);
  assert.doesNotMatch(
    pageSource,
    /@\/data\/admin|roleOverrides|setAdminProfile/,
  );
  assert.doesNotMatch(pageSource, /Edit profile/);
});
