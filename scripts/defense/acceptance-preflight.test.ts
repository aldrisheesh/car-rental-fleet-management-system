import assert from "node:assert/strict";
import test from "node:test";
import { assertCleanBaselinePreview } from "./acceptance-preflight.ts";

const clean = {
  dryRun: true,
  referenceDate: "2026-10-03",
  differences: [],
  resetTables: ["booking_requests"],
};

test("acceptance requires a successfully validated, matching baseline", () => {
  assert.deepEqual(assertCleanBaselinePreview(clean), {
    referenceDate: "2026-10-03",
  });
  for (const input of [
    null,
    {},
    { ...clean, dryRun: false },
    { ...clean, differences: null },
    { ...clean, resetTables: [] },
  ])
    assert.throws(
      () => assertCleanBaselinePreview(input),
      /no acceptance writes/,
    );
});

test("acceptance refuses current records added or edited after the baseline", () => {
  assert.throws(
    () =>
      assertCleanBaselinePreview({
        ...clean,
        differences: ["booking_requests", "payments"],
      }),
    /2 table\(s\).*no writes were made/,
  );
});
