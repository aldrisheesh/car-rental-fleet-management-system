import assert from "node:assert/strict";
import test from "node:test";

import { encodePrincipalForView } from "./auth-view.server.ts";

test("view-cookie payload reflects the canonical principal supplied by the server", () => {
  const encoded = encodePrincipalForView({
    userId: "user-1",
    email: "customer@example.test",
    fullName: "Updated Customer",
    phoneNumber: "+63 917 000 0000",
    role: "Customer/Renter",
    accountStatus: "Active",
  });

  assert.deepEqual(
    JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")),
    {
      userId: "user-1",
      email: "customer@example.test",
      fullName: "Updated Customer",
      phoneNumber: "+63 917 000 0000",
      role: "Customer/Renter",
      accountStatus: "Active",
    },
  );
});
