import test from "node:test";
import assert from "node:assert/strict";
import { addToRange } from "react-day-picker";
import {
  calculateRentalDays,
  formatRentalDuration,
  selectedRentalPeriod,
} from "./rental-duration.ts";

test("a future same-date 12-hour rental can be selected without a minimum night", () => {
  const date = new Date(2026, 9, 12);
  const range = addToRange(date, undefined, 0);
  const period = selectedRentalPeriod(range?.from, range?.to, "08:00", "20:00");
  assert.ok(period);
  assert.equal(period.start.toISOString(), "2026-10-12T00:00:00.000Z");
  assert.equal(formatRentalDuration(period.start, period.end), "12 hours");
  // Preserve the provisional estimator without presenting it as duration/billing.
  assert.equal(calculateRentalDays(period.start, period.end), 1);
});

test("duration distinguishes 24h, 36h and partial hours from rounded estimate days", () => {
  const start = new Date("2026-10-12T00:00:00Z");
  for (const [minutes, label] of [
    [1440, "1 day"],
    [2160, "1 day 12 hours"],
    [1501, "1 day 1 hour 1 minute"],
  ] as const) {
    assert.equal(
      formatRentalDuration(start, new Date(+start + minutes * 60_000)),
      label,
    );
  }
});

test("picker rejects equal, reversed, missing and malformed times", () => {
  const date = new Date(2026, 9, 12);
  for (const times of [
    ["08:00", "08:00"],
    ["20:00", "08:00"],
    ["", "20:00"],
    ["08:00", "24:00"],
    ["08:60", "20:00"],
  ]) {
    assert.equal(selectedRentalPeriod(date, date, times[0], times[1]), null);
  }
  assert.equal(selectedRentalPeriod(date, undefined, "08:00", "20:00"), null);
  assert.throws(
    () => formatRentalDuration(date, date),
    /invalid_rental_period/,
  );
  assert.throws(
    () => formatRentalDuration(new Date("invalid"), date),
    /invalid_rental_period/,
  );
});

test("Manila duration is independent of overnight browser-local clock changes", () => {
  const period = selectedRentalPeriod(
    new Date(2026, 10, 1),
    new Date(2026, 10, 2),
    "08:00",
    "08:00",
  );
  assert.ok(period);
  assert.equal(formatRentalDuration(period.start, period.end), "1 day");
});
