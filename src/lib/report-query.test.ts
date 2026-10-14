import assert from "node:assert/strict";
import test from "node:test";
import {
  buildQueryReport,
  type ReportQuery,
  type ReportVehicle,
  type ReportEvent,
} from "./report-query.ts";
import { reportPeriod } from "./report-period.ts";
const vehicles: ReportVehicle[] = [
  {
    id: "sedan",
    name: "City",
    categoryId: "sedan-category",
    categoryName: "Sedan",
  },
  { id: "van", name: "Urvan", categoryId: "van-category", categoryName: "Van" },
];
const events: ReportEvent[] = [
  {
    id: "one",
    vehicleId: "sedan",
    branchId: "taft",
    purpose: "Family trip",
    destination: "Batangas",
  },
  {
    id: "two",
    vehicleId: "sedan",
    branchId: "rizal",
    purpose: "Business / work",
    destination: "Metro Manila",
  },
  {
    id: "three",
    vehicleId: "van",
    branchId: "taft",
    purpose: "Family trip",
    destination: "Batangas",
  },
];
const query: ReportQuery = {
  kind: "requests",
  start: "2026-10-01",
  end: "2026-10-14",
  branch: "all",
  vehicle: "",
  category: "",
  purpose: "",
  destination: "",
};
test("vehicle rankings distinguish request events from rental start events", () => {
  assert.equal(
    buildQueryReport(query, events, vehicles, [], "2026-10-14T00:00:00Z")
      .rows[0].count,
    2,
  );
  const rentals = buildQueryReport(
    { ...query, kind: "rentals" },
    events.slice(2),
    vehicles,
    [],
    "2026-10-14T00:00:00Z",
  );
  assert.equal(rentals.rows[0].label, "Urvan");
  assert.equal(rentals.total, 1);
});
test("branch, category, vehicle, purpose and destination are intersected", () => {
  const result = buildQueryReport(
    {
      ...query,
      branch: "taft",
      vehicle: "sedan",
      category: "sedan-category",
      purpose: "purpose.family",
      destination: "destination.batangas",
    },
    events,
    vehicles,
    [],
    "2026-10-14T00:00:00Z",
  );
  assert.equal(result.total, 1);
  assert.equal(result.rows[0].label, "City");
  assert.equal(
    buildQueryReport(
      { ...query, category: "van-category", vehicle: "sedan" },
      events,
      vehicles,
      [],
      "2026-10-14T00:00:00Z",
    ).total,
    0,
  );
});
test("grouped destinations count actual records without inferring free-text destinations", () => {
  const result = buildQueryReport(
    { ...query, kind: "destinations" },
    events,
    vehicles,
    [],
    "2026-10-14T00:00:00Z",
  );
  assert.equal(result.rows[0].label, "Batangas");
  assert.equal(result.rows[0].count, 2);
  const unknown = buildQueryReport(
    { ...query, kind: "destinations" },
    [{ ...events[0], destination: "Unknown trip" }],
    vehicles,
    [],
    "2026-10-14T00:00:00Z",
  );
  assert.equal(unknown.rows[0].label, "Not categorized");
});
test("monthly and quarterly presets honor Manila midnight, year rollover and leap February", () => {
  assert.deepEqual(
    reportPeriod("this-quarter", new Date("2026-09-30T16:00:00Z")),
    { start: "2026-10-01", end: "2026-10-01" },
  );
  assert.deepEqual(
    reportPeriod("last-quarter", new Date("2026-01-14T00:00:00Z")),
    { start: "2025-10-01", end: "2025-12-31" },
  );
  assert.deepEqual(
    reportPeriod("last-month", new Date("2024-03-14T00:00:00Z")),
    { start: "2024-02-01", end: "2024-02-29" },
  );
});

test("missing and uncategorized destinations remain separate groups", () => {
  const query: ReportQuery = {
    kind: "destinations",
    start: "2026-09-01",
    end: "2026-09-30",
    branch: "all",
    vehicle: "",
    category: "",
    purpose: "",
    destination: "",
  };
  const report = buildQueryReport(
    query,
    [
      { ...events[0], destination: null },
      { ...events[1], destination: "An older free-text trip" },
    ],
    vehicles,
    [],
    "2026-10-14T00:00:00Z",
  );
  assert.equal(
    report.rows.find((row) => row.label === "Not provided")?.count,
    1,
  );
  assert.equal(
    report.rows.find((row) => row.label === "Not categorized")?.count,
    1,
  );
});
