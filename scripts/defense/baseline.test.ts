import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBaseline,
  validateDataset,
  validDate,
  TABLES,
} from "./baseline-data.ts";
import { parseArgs, verifyRows, digest } from "./baseline.ts";
const categories = ["Economy", "Sedan", "SUV", "MPV", "Van", "Pickup"].map(
  (name, i) => ({ id: `c${i}`, name }),
);
const plates = [
  "WIGO",
  "MIRA",
  "VIOS",
  "CITY",
  "RUSH",
  "EVST",
  "AVAN",
  "INNO",
  "URVN",
  "HIAC",
  "RANG",
  "HILX",
];
const source = {
  profiles: [
    { id: "admin", user_type: "Owner/Admin", account_status: "Active" },
    { id: "customer", user_type: "Customer/Renter", account_status: "Active" },
  ],
  branches: [
    { id: "taft", name: "Taft, Manila" },
    { id: "antipolo", name: "Antipolo, Rizal" },
  ],
  vehicle_categories: categories,
  payment_methods: [{ id: "method", is_active: true, label: "Synthetic bank" }],
  vehicles: plates.map((p, i) => ({
    id: `v${i}`,
    license_plate: `DEV-${p}-001`,
    name: p,
    category_id: `c${Math.floor(i / 2)}`,
    branch_id: "taft",
    daily_rate: 1500,
    seat_capacity: 5,
  })),
};
for (const day of ["2026-09-29", "2026-10-06"])
  test(`consistent reproducible baseline ${day}`, () => {
    const a = buildBaseline(source, day),
      b = buildBaseline(source, day);
    assert.equal(digest(a), digest(b));
    assert.equal(a.expected.sedan.forecast, 1.3);
    assert.equal(a.expected.sedan.transfer, 2);
    assert.deepEqual(a.expected.sedan.candidates, [
      "DEV-VIOS-001",
      "DEV-CITY-001",
    ]);
    assert.ok(a.expected.futureThrough! > "2026-11-01");
    assert.equal(
      a.data.rental_transactions.filter((r) => !r.ended_at).length,
      1,
    );
    assert.equal(
      a.data.forecasts.filter(
        (f) => f.run_id === a.data.forecast_runs.at(-1)!.id,
      ).length,
      36,
    );
    assert.equal(
      a.data.renter_requirement_documents.length,
      a.data.renter_requirement_sets.filter((s) => s.status !== "Not Submitted")
        .length * 4,
    );
  });
test("conflicting confirmed bookings fail validation", () => {
  const a = buildBaseline(source, "2026-10-06");
  a.data.booking_requests.push({
    ...a.data.booking_requests[0],
    id: "collision",
  });
  assert.throws(() => validateDataset(a.data, "2026-10-06"), /Overlapping/);
});
test("drift detects new test rows and ignores row order", () => {
  const a = buildBaseline(source, "2026-10-06").data,
    b = structuredClone(a);
  for (const t of TABLES) b[t].reverse();
  assert.deepEqual(verifyRows(a, b), []);
  b.booking_requests.push({ ...b.booking_requests[0], id: "new" });
  assert.deepEqual(verifyRows(a, b), ["booking_requests"]);
});
test("safe defaults and invalid input", () => {
  assert.equal(parseArgs(["reset"]).apply, false);
  assert.throws(() => parseArgs(["oops"]));
  assert.throws(() => validDate("2026-02-31"));
});
