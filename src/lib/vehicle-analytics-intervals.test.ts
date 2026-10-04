import assert from "node:assert/strict";
import test from "node:test";
import { formatWeekRange, weekEndFromStart } from "./planning-week.ts";
import { addDays, dayKey } from "./vehicle-analytics-intervals.ts";

test("Manila forecast week arithmetic preserves exclusive and inclusive boundaries", () => {
  const originalTimezone = process.env.TZ;
  try {
    for (const timezone of ["Asia/Manila", "UTC", "America/Los_Angeles"]) {
      process.env.TZ = timezone;
      assert.equal(weekEndFromStart("2026-09-28"), "2026-10-05");
      assert.equal(
        formatWeekRange("2026-09-28", "2026-10-05", "en-PH"),
        "Sep 28, 2026 – Oct 4, 2026",
      );
      assert.equal(
        formatWeekRange("2026-10-05", "2026-10-12", "en-PH"),
        "Oct 5, 2026 – Oct 11, 2026",
      );
      assert.equal(addDays("2026-10-05", -1), "2026-10-04");
      assert.equal(addDays("2026-10-05", 7), "2026-10-12");
      assert.equal(addDays("2026-10-12", -1), "2026-10-11");
      assert.equal(addDays("2026-12-28", 7), "2027-01-04");
      assert.equal(addDays("2024-02-26", 7), "2024-03-04");
      assert.equal(addDays("2024-03-01", -1), "2024-02-29");
      assert.equal(dayKey(new Date("2026-10-04T16:00:00Z")), "2026-10-05");
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
