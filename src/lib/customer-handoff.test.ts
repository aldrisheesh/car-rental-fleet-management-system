import assert from "node:assert/strict";
import test from "node:test";

import { resolvedReturnLocation } from "./customer-handoff.ts";

test("same-location return defaults to the delivery address", () => {
  assert.equal(
    resolvedReturnLocation({
      deliveryAddress: "  101 Coast Road, Manila  ",
      alternateReturnAddress: "",
      sameReturnLocation: true,
    }),
    "101 Coast Road, Manila",
  );
});

test("changing delivery keeps a same-location return synchronized", () => {
  assert.equal(
    resolvedReturnLocation({
      deliveryAddress: "44 Sunset Avenue, Rizal",
      alternateReturnAddress: "Old return address",
      sameReturnLocation: true,
    }),
    "44 Sunset Avenue, Rizal",
  );
});

test("an alternate return address is used when same-location is disabled", () => {
  assert.equal(
    resolvedReturnLocation({
      deliveryAddress: "101 Coast Road, Manila",
      alternateReturnAddress: "  8 Airport Road, Pasay  ",
      sameReturnLocation: false,
    }),
    "8 Airport Road, Pasay",
  );
});

test("reenabling same-location ignores stale alternate return data", () => {
  assert.equal(
    resolvedReturnLocation({
      deliveryAddress: "101 Coast Road, Manila",
      alternateReturnAddress: "Stale alternate location",
      sameReturnLocation: true,
    }),
    "101 Coast Road, Manila",
  );
});
