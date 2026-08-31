import test from "node:test";
import assert from "node:assert/strict";
import { calculateWma, extractWeeklyDemand } from "./forecasting.server.ts";

const booking = (week: string, status = "Confirmed") => ({ booking_status: status, pickup_branch_id: "b", pickup_at: `${week}T04:00:00Z`, requested_vehicle: { category: { id: "c" } } });

test("coverage is not inferred from an earliest historical booking", () => {
  const result = extractWeeklyDemand([booking("2026-01-05")], "2026-09-01T00:00:00+08:00", new Date("2026-09-15T00:00:00+08:00"));
  assert.equal(result.size, 0);
});

test("fully covered prospective zero weeks are retained", () => {
  const result = extractWeeklyDemand([booking("2026-09-07")], "2026-09-01T00:00:00+08:00", new Date("2026-09-29T00:00:00+08:00"));
  assert.deepEqual(result.get("b:c")?.map(x => x.demand), [1, 0, 0]);
});

test("partial tracking-start week is excluded and three consecutive observations are required", () => {
  const result = extractWeeklyDemand([booking("2026-09-07"), booking("2026-09-21")], "2026-09-03T00:00:00+08:00", new Date("2026-09-29T00:00:00+08:00"));
  assert.deepEqual(result.get("b:c")?.map(x => x.demand), [1, 0, 1]);
  assert.equal(calculateWma(result.get("b:c")!.slice(0, 2)), null);
  assert.ok(calculateWma(result.get("b:c")!));
});
