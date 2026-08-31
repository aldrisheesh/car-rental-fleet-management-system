import test from "node:test";
import assert from "node:assert/strict";
import { calculateWma, extractWeeklyDemand, trustworthyCoverageWeekStart, isoDay } from "./forecasting.server.ts";

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
test("canonical pair with covered all-zero weeks is forecastable", () => {
  const r = extractWeeklyDemand([], "2026-09-07T00:00:00+08:00", new Date("2026-09-29T00:00:00+08:00"), [{ branchId: "b", categoryId: "c" }]);
  assert.deepEqual(r.get("b:c")?.map(x => x.demand), [0, 0, 0]);
  assert.deepEqual(calculateWma(r.get("b:c")!)?.forecasts, [0, 0, 0]);
});
test("coverage begins only at exact Manila Monday midnight", () => {
  assert.equal(isoDay(trustworthyCoverageWeekStart("2026-09-07T00:00:00+08:00")), "2026-09-07");
  assert.equal(isoDay(trustworthyCoverageWeekStart("2026-09-07T00:00:01+08:00")), "2026-09-14");
  assert.equal(isoDay(trustworthyCoverageWeekStart("2026-09-07T00:15:00+08:00")), "2026-09-14");
  assert.equal(isoDay(trustworthyCoverageWeekStart("2026-09-08T00:00:00+08:00")), "2026-09-14");
});
