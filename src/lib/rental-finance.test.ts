import test from "node:test";
import assert from "node:assert/strict";
import { depositRefund, releaseDayReached } from "./rental-finance.ts";

test("release follows Manila calendar days, including UTC boundary", () => {
  assert.equal(
    releaseDayReached(
      "2026-10-05T10:00:00+08:00",
      new Date("2026-10-04T15:59:59Z"),
    ),
    false,
  );
  assert.equal(
    releaseDayReached(
      "2026-10-05T10:00:00+08:00",
      new Date("2026-10-04T16:00:00Z"),
    ),
    true,
  );
  assert.equal(releaseDayReached("invalid"), false);
});
test("deposit refund validates finite, exact-cent deductions within the deposit", () => {
  assert.equal(depositRefund(3000, "0"), 3000);
  assert.equal(depositRefund(3000, "500"), 2500);
  assert.equal(depositRefund(3000, "3000"), 0);
  assert.equal(depositRefund(3000, "0.29"), 2999.71);
  for (const value of ["", "-1", "3000.01", "NaN", "Infinity", "0.001"])
    assert.equal(depositRefund(3000, value), null);
});
