import test from "node:test";
import assert from "node:assert/strict";
import { hasRescheduleConflict } from "./reschedule-availability.ts";
const day = 86400000;
const blocks = [
  { start: "2026-10-06T02:00:00Z", end: "2026-10-07T02:00:00Z" },
  { start: "2026-10-08T02:00:00Z", end: "2026-10-09T02:00:00Z" },
];

test("a free Wednesday cannot start a three-day rental across Thursday's booking", () => {
  assert.equal(
    hasRescheduleConflict(new Date("2026-10-07T02:00:00Z"), 3 * day, blocks),
    true,
  );
  assert.equal(
    hasRescheduleConflict(new Date("2026-10-07T02:00:00Z"), day, blocks),
    false,
  );
});
test("exact reservation boundaries allow adjacent rentals; partial overlaps do not", () => {
  assert.equal(
    hasRescheduleConflict(new Date("2026-10-05T02:00:00Z"), day, blocks),
    false,
  );
  assert.equal(
    hasRescheduleConflict(new Date("2026-10-05T02:00:01Z"), day, blocks),
    true,
  );
  assert.equal(
    hasRescheduleConflict(new Date("2026-10-09T02:00:00Z"), 3 * day, blocks),
    false,
  );
});
test("handover time changes re-evaluate the full interval", () => {
  assert.equal(
    hasRescheduleConflict(
      new Date("2026-10-07T01:30:00Z"),
      12 * 3600000,
      blocks,
    ),
    true,
  );
  assert.equal(
    hasRescheduleConflict(
      new Date("2026-10-07T02:00:00Z"),
      12 * 3600000,
      blocks,
    ),
    false,
  );
});
test("invalid or incomplete selections are unavailable", () => {
  assert.equal(hasRescheduleConflict(null, day, []), true);
  assert.equal(hasRescheduleConflict(new Date(), NaN, []), true);
});
