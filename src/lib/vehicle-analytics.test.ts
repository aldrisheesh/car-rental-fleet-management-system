import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countIntervalLocalDays,
  overlapsLocalDay,
} from "./vehicle-analytics.server.ts";

const d = (value: string) => new Date(value);

test("same-day rental counts one Manila calendar day", () => {
  assert.equal(
    countIntervalLocalDays(
      d("2026-09-01T10:00:00+08:00"),
      d("2026-09-01T18:00:00+08:00"),
      "2026-09-01",
      "2026-09-01",
    ),
    1,
  );
});

test("an interval ending at local midnight does not count the next day", () => {
  assert.equal(
    countIntervalLocalDays(
      d("2026-09-01T20:00:00+08:00"),
      d("2026-09-02T00:00:00+08:00"),
      "2026-09-01",
      "2026-09-02",
    ),
    1,
  );
});

test("cross-midnight rental counts both overlapped local days", () => {
  assert.equal(
    countIntervalLocalDays(
      d("2026-09-01T23:00:00+08:00"),
      d("2026-09-02T01:00:00+08:00"),
      "2026-09-01",
      "2026-09-02",
    ),
    2,
  );
});

test("maintenance completing at midnight does not block the next day", () => {
  assert.equal(
    overlapsLocalDay(
      d("2026-09-01T20:00:00+08:00"),
      d("2026-09-02T00:00:00+08:00"),
      "2026-09-02",
    ),
    false,
  );
});
