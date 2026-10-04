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

test("calendar varies weekdays, handover times, durations and weekly volume", () => {
  const { data } = buildBaseline(source, "2026-10-04");
  const historical = data.booking_requests.filter(
    (b) => b.pickup_at < "2026-09-28",
  );
  const local = (timestamp: string) =>
    new Date(Date.parse(timestamp) + 8 * 3600000);
  assert.equal(
    new Set(historical.map((b) => local(b.pickup_at).getUTCDay())).size,
    7,
  );
  assert.ok(
    new Set(historical.map((b) => local(b.pickup_at).getUTCHours())).size >= 5,
  );
  assert.ok(
    new Set(
      historical.map((b) => Date.parse(b.return_at) - Date.parse(b.pickup_at)),
    ).size >= 4,
  );
  const october = data.booking_requests.filter((b) =>
    local(b.pickup_at).toISOString().startsWith("2026-10"),
  );
  assert.ok(
    new Set(october.map((b) => local(b.pickup_at).getUTCDay())).size >= 6,
  );
  for (const b of data.booking_requests) {
    assert.ok(b.created_at < b.pickup_at);
    assert.ok(b.pickup_at < b.return_at);
    if (b.pickup_at > "2026-10-04T00:00:00Z") {
      assert.ok(
        !data.rental_transactions.some(
          (r) => r.booking_id === b.id && r.ended_at,
        ),
      );
    }
  }
  const weeks = new Map<string, number>();
  for (const b of historical) {
    const d = local(b.pickup_at);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const key = d.toISOString().slice(0, 10);
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }
  assert.ok(new Set(weeks.values()).size >= 3);
});

test("all vehicle history uses a non-decreasing odometer", () => {
  const { data } = buildBaseline(source, "2026-10-04");
  for (const v of data.vehicles) {
    const rentals = data.rental_transactions
      .filter((r) => r.vehicle_id === v.id)
      .sort((a, b) => a.started_at.localeCompare(b.started_at));
    for (let i = 1; i < rentals.length; i++)
      assert.ok(
        rentals[i].release_odometer >=
          (rentals[i - 1].return_odometer ?? rentals[i - 1].release_odometer),
      );
  }
});

test("October 4 handovers and December bookings respect all service slots", () => {
  const { data } = buildBaseline(source, "2026-10-04");
  const localDate = (value: string) =>
    new Date(Date.parse(value) + 8 * 3600000).toISOString().slice(0, 10);
  const confirmed = data.booking_requests.filter(
    (b) => b.booking_status === "Confirmed",
  );
  assert.equal(
    confirmed.filter((b) => localDate(b.pickup_at) === "2026-10-04").length,
    2,
  );
  assert.ok(confirmed.some((b) => localDate(b.pickup_at) >= "2026-12-25"));
  assert.ok(confirmed.every((b) => localDate(b.return_at) <= "2026-12-31"));
  for (const month of ["2026-10", "2026-11", "2026-12"])
    assert.ok(
      data.maintenance_records.some(
        (m) =>
          m.status === "Scheduled" &&
          localDate(m.scheduled_for).startsWith(month),
      ),
    );
  for (const request of data.booking_requests.filter(
    (b) => b.booking_status === "Submitted",
  ))
    assert.ok(
      !confirmed.some(
        (b) =>
          b.assigned_vehicle_id === request.requested_vehicle_id &&
          b.pickup_at < request.return_at &&
          b.return_at > request.pickup_at,
      ),
    );
  const service = data.maintenance_records.find(
    (m) => m.status === "Scheduled",
  )!;
  const b = confirmed.find(
    (b) => b.assigned_vehicle_id === service.vehicle_id,
  )!;
  b.pickup_at = service.scheduled_for;
  b.return_at = new Date(
    Date.parse(service.scheduled_for) + 3600000,
  ).toISOString();
  assert.throws(() => validateDataset(data, "2026-10-04"), /maintenance/);
});

test("pickup and delivery service mix has coherent addresses, fees and payment totals", () => {
  const { data } = buildBaseline(source, "2026-10-04");
  const delivery = data.booking_requests.filter(
    (b) => b.pickup_delivery_option === "delivery",
  );
  const pickups = data.booking_requests.filter(
    (b) => b.pickup_delivery_option === "pickup",
  );
  assert.ok(delivery.length > 0 && pickups.length > 0);
  assert.ok(delivery.some((b) => b.pickup_location !== b.dropoff_location));
  for (const b of data.booking_requests) {
    const q = data.booking_payment_quotes.find((q) => q.booking_id === b.id)!;
    const p = data.payments.find((p) => p.booking_id === b.id)!;
    assert.equal(q.total_amount, q.rental_subtotal + q.delivery_fee);
    assert.equal(
      q.down_payment_amount + q.remaining_balance_amount,
      q.total_amount,
    );
    assert.equal(p.required_amount, q.down_payment_amount);
    if (b.pickup_delivery_option === "delivery") {
      assert.ok(b.pickup_location?.startsWith("SYNTHETIC:"));
      assert.ok(b.dropoff_location?.startsWith("SYNTHETIC:"));
      assert.ok(q.delivery_fee > 0);
    } else {
      assert.equal(b.pickup_location, null);
      assert.equal(b.dropoff_location, null);
      assert.equal(q.delivery_fee, 0);
    }
  }
  delivery[0].pickup_location = null;
  assert.throws(() => validateDataset(data, "2026-10-04"), /addresses/);
});

test("future requests have varied creation dates instead of vehicle-grouped timestamp ties", () => {
  const { data } = buildBaseline(source, "2026-10-04");
  const future = data.booking_requests.filter(
    (b) => b.pickup_at > "2026-10-04",
  );
  assert.ok(new Set(future.map((b) => b.created_at.slice(0, 10))).size >= 15);
  assert.equal(new Set(future.map((b) => b.created_at)).size, future.length);
  const recent = [...data.booking_requests]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);
  assert.ok(
    recent.every(
      (b) => b.booking_status === "Submitted" || b.booking_status === "Draft",
    ),
  );
  for (const b of future)
    assert.ok(b.created_at < b.pickup_at && b.created_at < "2026-10-04");
});

test("pickup baseline quotes and rentals require complete handover arrangements", () => {
  const { data } = buildBaseline(source, "2026-10-04");
  const pickup = data.booking_requests.find(
    (b) =>
      b.pickup_delivery_option === "pickup" && b.booking_status === "Confirmed",
  )!;
  const fields = [
    "pickup_meeting_address",
    "pickup_meeting_instructions",
    "return_meeting_address",
    "return_meeting_instructions",
  ];
  for (const field of fields) {
    assert.ok(pickup[field]?.trim());
    const saved = pickup[field];
    pickup[field] = "  ";
    assert.throws(
      () => validateDataset(data, "2026-10-04"),
      /missing handover arrangements/,
    );
    pickup[field] = saved;
  }
  validateDataset(data, "2026-10-04");
});
