import test from "node:test";
import assert from "node:assert/strict";
import { isHandoverTime } from "./handover-times.ts";
test("online rescheduling follows the same handover slots as browsing", () => {
  for (const clock of ["08:00", "10:00", "18:00"])
    assert.equal(isHandoverTime(`2026-10-06T${clock}`), true);
  for (const clock of ["07:00", "18:30", "02:48", "10:30", "24:00"])
    assert.equal(isHandoverTime(`2026-10-06T${clock}`), false);
});
