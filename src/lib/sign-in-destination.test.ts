import assert from "node:assert/strict";
import test from "node:test";
import { completeSignIn, signInDestination } from "./sign-in-destination.ts";

for (const role of ["Owner/Admin", "Operations Staff"]) {
  test(`${role} navigates directly without triggering catalog dismissal`, () => {
    const visits: string[] = [];
    completeSignIn({
      destination: signInDestination(role, "/vehicles"),
      navigate: (target) => visits.push(target),
      onAuthenticated: () => visits.push("refresh public page"),
      onClose: () => visits.push("/vehicles"),
    });
    assert.deepEqual(visits, ["/admin"]);
  });
}

test("customer booking context survives redirect without a catalog detour", () => {
  const visits: string[] = [];
  const destination = signInDestination(
    "Customer/Renter",
    "/booking?vehicle=car-1",
  );
  completeSignIn({
    destination,
    navigate: (target) => visits.push(target),
    onClose: () => visits.push("/vehicles"),
  });
  assert.deepEqual(visits, ["/booking?vehicle=car-1"]);
});

test("in-place customer sign-in updates the header and dismisses once", () => {
  const events: string[] = [];
  completeSignIn({
    destination: null,
    navigate: (target) => events.push(target),
    onAuthenticated: () => events.push("authenticated"),
    onClose: () => events.push("close"),
  });
  assert.deepEqual(events, ["authenticated", "close"]);
});
