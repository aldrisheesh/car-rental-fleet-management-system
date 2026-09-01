import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  findVehicles,
  intervalsOverlap,
  validateFinderInput,
  type FinderCandidate,
  type VehicleFinderInput,
} from "./vehicle-finder.ts";

const categories = ["Economy", "Sedan", "SUV", "MPV", "Van", "Pickup"];
const request = (
  overrides: Partial<VehicleFinderInput> = {},
): VehicleFinderInput => ({
  requestedStart: "2026-09-10T00:00:00.000Z",
  requestedEnd: "2026-09-12T00:00:00.000Z",
  passengerCount: 5,
  maximumBudget: 10_000,
  preferredCategory: null,
  destination: null,
  ...overrides,
});
const vehicle = (
  overrides: Partial<FinderCandidate> = {},
): FinderCandidate => ({
  id: "vehicle-a",
  name: "Alpha Car",
  category: "Sedan",
  passengerCapacity: 5,
  baseRentalRate: 1_000,
  imageUrl: null,
  branchName: "Taft, Manila",
  transmission: "Automatic",
  fuelType: "Gasoline",
  isActive: true,
  maintenanceReady: true,
  bookingConflict: false,
  rentalConflict: false,
  ...overrides,
});

test("valid Finder input resolves canonical category and timestamps", () => {
  const result = validateFinderInput(
    {
      requestedStart: "2026-09-10T08:00",
      requestedEnd: "2026-09-12T08:00",
      passengerCount: 5,
      maximumBudget: 5000,
      preferredCategory: "suv",
      destination: " Baguio City ",
    },
    categories,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.preferredCategory, "SUV");
    assert.equal(result.value.destination, "Baguio City");
  }
});

test("invalid period is rejected", () => {
  const result = validateFinderInput(
    {
      requestedStart: "2026-09-12T08:00",
      requestedEnd: "2026-09-10T08:00",
      passengerCount: 5,
      maximumBudget: 5000,
    },
    categories,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.requestedEnd);
});

test("malformed and impossible rental timestamps are rejected", () => {
  const impossible = validateFinderInput(
    {
      requestedStart: "2026-02-30T08:00",
      requestedEnd: "2026-03-02T08:00",
      passengerCount: 5,
      maximumBudget: 5000,
    },
    categories,
  );
  const malformed = validateFinderInput(
    {
      requestedStart: "September 10",
      requestedEnd: "2026-09-12",
      passengerCount: 5,
      maximumBudget: 5000,
    },
    categories,
  );
  assert.equal(impossible.ok, false);
  assert.equal(malformed.ok, false);
});

test("invalid passenger count, budget, and preferred category are rejected", () => {
  const result = validateFinderInput(
    {
      requestedStart: "2026-09-10T08:00",
      requestedEnd: "2026-09-12T08:00",
      passengerCount: 1.5,
      maximumBudget: Number.POSITIVE_INFINITY,
      preferredCategory: "Motorcycle",
    },
    categories,
  );
  assert.equal(result.ok, false);
  if (!result.ok)
    assert.deepEqual(Object.keys(result.errors).sort(), [
      "maximumBudget",
      "passengerCount",
      "preferredCategory",
    ]);
});

test("half-open availability intervals allow touching boundaries", () => {
  assert.equal(
    intervalsOverlap(
      "2026-09-08T00:00:00Z",
      "2026-09-10T00:00:00Z",
      "2026-09-10T00:00:00Z",
      "2026-09-12T00:00:00Z",
    ),
    false,
  );
  assert.equal(
    intervalsOverlap(
      "2026-09-09T23:59:59Z",
      "2026-09-10T00:00:01Z",
      "2026-09-10T00:00:00Z",
      "2026-09-12T00:00:00Z",
    ),
    true,
  );
});

test("inactive and maintenance-not-ready vehicles are excluded", () => {
  const result = findVehicles(request(), [
    vehicle({ id: "inactive", isActive: false }),
    vehicle({ id: "maintenance", maintenanceReady: false }),
  ]);
  assert.deepEqual(result.recommendations, []);
});

test("booking and rental conflicts are independently excluded", () => {
  const result = findVehicles(request(), [
    vehicle({ id: "booking", bookingConflict: true }),
    vehicle({ id: "rental", rentalConflict: true }),
    vehicle({ id: "eligible", name: "Eligible" }),
  ]);
  assert.deepEqual(
    result.recommendations.map((item) => item.vehicleId),
    ["eligible"],
  );
});

test("unknown and insufficient capacity are excluded while exact capacity is eligible", () => {
  const result = findVehicles(request(), [
    vehicle({ id: "unknown", passengerCapacity: null }),
    vehicle({ id: "small", passengerCapacity: 4 }),
    vehicle({ id: "exact", passengerCapacity: 5 }),
  ]);
  assert.deepEqual(
    result.recommendations.map((item) => item.vehicleId),
    ["exact"],
  );
});

test("over-budget is excluded and exact-budget is eligible", () => {
  const result = findVehicles(request({ maximumBudget: 2_000 }), [
    vehicle({ id: "exact", baseRentalRate: 1_000 }),
    vehicle({ id: "over", baseRentalRate: 1_000.01 }),
  ]);
  assert.deepEqual(
    result.recommendations.map((item) => item.vehicleId),
    ["exact"],
  );
  assert.equal(result.recommendations[0]?.estimatedTotalBaseRental, 2_000);
});

test("a base-rental total that cannot be represented safely is excluded", () => {
  const result = findVehicles(request({ maximumBudget: Number.MAX_VALUE }), [
    vehicle({ baseRentalRate: Number.MAX_VALUE }),
  ]);
  assert.deepEqual(result.recommendations, []);
});

test("preferred category ranks first but alternatives remain eligible", () => {
  const result = findVehicles(request({ preferredCategory: "SUV" }), [
    vehicle({ id: "sedan", name: "A Sedan", category: "Sedan" }),
    vehicle({ id: "suv", name: "Z SUV", category: "SUV" }),
  ]);
  assert.deepEqual(
    result.recommendations.map((item) => item.vehicleId),
    ["suv", "sedan"],
  );
  assert.equal(result.recommendations[1]?.preferredCategoryMatch, false);
});

test("capacity closeness ranks before lower total cost", () => {
  const result = findVehicles(request(), [
    vehicle({
      id: "larger-cheaper",
      passengerCapacity: 7,
      baseRentalRate: 500,
    }),
    vehicle({
      id: "exact-costlier",
      passengerCapacity: 5,
      baseRentalRate: 1_000,
    }),
  ]);
  assert.deepEqual(
    result.recommendations.map((item) => item.vehicleId),
    ["exact-costlier", "larger-cheaper"],
  );
});

test("lower total base rental ranks equal-capacity vehicles", () => {
  const result = findVehicles(request(), [
    vehicle({ id: "costlier", name: "A", baseRentalRate: 1_200 }),
    vehicle({ id: "cheaper", name: "Z", baseRentalRate: 1_000 }),
  ]);
  assert.deepEqual(
    result.recommendations.map((item) => item.vehicleId),
    ["cheaper", "costlier"],
  );
});

test("name then canonical id provide a deterministic final tie-break", () => {
  const result = findVehicles(request(), [
    vehicle({ id: "b", name: "Same" }),
    vehicle({ id: "z", name: "Zulu" }),
    vehicle({ id: "a", name: "Same" }),
  ]);
  assert.deepEqual(
    result.recommendations.map((item) => item.vehicleId),
    ["a", "b", "z"],
  );
});

test("destination has no ranking or eligibility effect", () => {
  const candidates = [
    vehicle({ id: "b", name: "Beta" }),
    vehicle({ id: "a", name: "Alpha" }),
  ];
  const withoutDestination = findVehicles(request(), candidates);
  const withDestination = findVehicles(
    request({ destination: "Baguio City" }),
    candidates,
  );
  assert.deepEqual(withDestination, withoutDestination);
});

test("customer result is allowlisted and contains no score or internal records", () => {
  const item = findVehicles(request(), [vehicle()]).recommendations[0]!;
  assert.deepEqual(Object.keys(item).sort(), [
    "baseRentalRate",
    "branchName",
    "category",
    "estimatedTotalBaseRental",
    "fuelType",
    "imageUrl",
    "name",
    "passengerCapacity",
    "preferredCategoryMatch",
    "rank",
    "reasons",
    "transmission",
    "vehicleId",
  ]);
  assert.equal("score" in item, false);
  assert.equal(JSON.stringify(item).includes("maintenance_records"), false);
});

test("no-match response is controlled and never returns an ineligible fallback", () => {
  const result = findVehicles(request({ maximumBudget: 100 }), [vehicle()]);
  assert.deepEqual(result.recommendations, []);
  assert.equal(result.noMatch?.code, "NO_ELIGIBLE_VEHICLES");
  assert.deepEqual(result.noMatch?.factors, ["BUDGET"]);
});

test("Browse route preserves ordinary filters and Finder reset", async () => {
  const source = await readFile(
    new URL("../routes/vehicles.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /<FilterGroup[\s\S]*label="Type"/);
  assert.match(source, /<FilterGroup[\s\S]*label="Branch"/);
  assert.match(source, /Browse all vehicles/);
  assert.doesNotMatch(
    source,
    /setCat\("All"\);\s*setBranch\("All branches"\);\s*setFinder/,
  );
});
