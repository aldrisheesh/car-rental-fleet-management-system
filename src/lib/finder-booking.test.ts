import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  finderBookingPrefill,
  finderContextForSubmission,
  finderProvenanceMatchesBooking,
  parseFinderBookingHandoff,
  revalidateFinderBookingBasis,
} from "./finder-booking.ts";
import type {
  VehicleFinderInput,
  VehicleRecommendation,
} from "./vehicle-finder.ts";

const search = {
  vehicle: "vehicle-a",
  finderStart: "2026-09-10T02:00:00.000Z",
  finderEnd: "2026-09-12T02:00:00.000Z",
  finderPassengers: "5",
  finderBudget: "5000",
  finderCategory: "SUV",
  finderDestination: "Baguio City",
  finderRank: "99",
};

const canonicalInput: VehicleFinderInput = {
  requestedStart: "2026-09-10T02:00:00.000Z",
  requestedEnd: "2026-09-12T02:00:00.000Z",
  passengerCount: 5,
  maximumBudget: 5_000,
  preferredCategory: "SUV",
  destination: "Baguio City",
};

const recommendation: VehicleRecommendation = {
  vehicleId: "vehicle-a",
  name: "Alpha",
  category: "SUV",
  passengerCapacity: 5,
  baseRentalRate: 1_000,
  estimatedTotalBaseRental: 2_000,
  imageUrl: null,
  branchName: null,
  transmission: null,
  fuelType: null,
  preferredCategoryMatch: true,
  rank: 2,
  reasons: [],
};

test("Finder handoff prefills the existing Booking fields in Manila time", () => {
  const handoff = parseFinderBookingHandoff(search);
  assert.ok(handoff);
  assert.deepEqual(finderBookingPrefill(handoff), {
    pickup: "2026-09-10T10:00",
    dropoff: "2026-09-12T10:00",
    passengerCount: "5",
    destination: "Baguio City",
  });
  assert.deepEqual(finderContextForSubmission(handoff), {
    selectedVehicleId: "vehicle-a",
    requestedStart: "2026-09-10T10:00",
    requestedEnd: "2026-09-12T10:00",
    passengerCount: 5,
    maximumBudget: 5_000,
    preferredCategory: "SUV",
    destination: "Baguio City",
    displayedRank: 99,
  });
});

test("ordinary vehicle navigation does not claim Finder provenance", () => {
  assert.equal(parseFinderBookingHandoff({ vehicle: "vehicle-a" }), null);
});

test("only material Finder basis changes invalidate client provenance", () => {
  const handoff = parseFinderBookingHandoff(search)!;
  const booking = {
    vehicleId: "vehicle-a",
    pickup: "2026-09-10T10:00",
    dropoff: "2026-09-12T10:00",
    passengerCount: "5",
    destination: "Baguio City",
  };
  assert.equal(finderProvenanceMatchesBooking(handoff, booking), true);
  assert.equal(
    finderProvenanceMatchesBooking(handoff, {
      ...booking,
      vehicleId: "vehicle-b",
    }),
    false,
  );
  assert.equal(
    finderProvenanceMatchesBooking(handoff, {
      ...booking,
      pickup: "2026-09-10T11:00",
    }),
    false,
  );
  assert.equal(
    finderProvenanceMatchesBooking(handoff, {
      ...booking,
      passengerCount: "6",
    }),
    false,
  );
  assert.equal(
    finderProvenanceMatchesBooking(handoff, {
      ...booking,
      destination: "Tagaytay",
    }),
    false,
  );

  const withoutDestination = parseFinderBookingHandoff({
    ...search,
    finderDestination: undefined,
  })!;
  assert.equal(
    finderProvenanceMatchesBooking(withoutDestination, {
      ...booking,
      destination: "An unrelated later destination",
    }),
    true,
  );
});

test("server revalidation derives rank from canonical recommendations and ignores displayed rank", () => {
  const result = revalidateFinderBookingBasis({
    selectedVehicleId: "vehicle-a",
    bookingVehicleId: "vehicle-a",
    bookingPickupAt: canonicalInput.requestedStart,
    bookingReturnAt: canonicalInput.requestedEnd,
    bookingPassengerCount: 5,
    bookingDestination: "Baguio City",
    canonicalInput,
    recommendations: [recommendation],
  });
  assert.deepEqual(result, { ok: true, recommendationRank: 2 });
});

test("server revalidation returns controlled mismatch and stale outcomes", () => {
  const common = {
    selectedVehicleId: "vehicle-a",
    bookingVehicleId: "vehicle-a",
    bookingPickupAt: canonicalInput.requestedStart,
    bookingReturnAt: canonicalInput.requestedEnd,
    bookingPassengerCount: 5,
    bookingDestination: "Baguio City",
    canonicalInput,
  };
  assert.deepEqual(
    revalidateFinderBookingBasis({
      ...common,
      bookingPassengerCount: 6,
      recommendations: [recommendation],
    }),
    { ok: false, reason: "MISMATCH" },
  );
  assert.deepEqual(
    revalidateFinderBookingBasis({ ...common, recommendations: [] }),
    { ok: false, reason: "STALE" },
  );
});

test("Finder selection uses the existing Booking route and canonical Finder server", async () => {
  const [vehiclesSource, bookingApiSource, finderApiSource] = await Promise.all(
    [
      readFile(new URL("../routes/vehicles.tsx", import.meta.url), "utf8"),
      readFile(new URL("../routes/api.bookings.ts", import.meta.url), "utf8"),
      readFile(
        new URL("../routes/api.vehicle-finder.ts", import.meta.url),
        "utf8",
      ),
    ],
  );
  assert.match(vehiclesSource, /bookingLabel="Continue to booking"/);
  assert.match(vehiclesSource, /finderStart:/);
  assert.match(bookingApiSource, /evaluateCanonicalVehicleFinder/);
  assert.match(finderApiSource, /evaluateCanonicalVehicleFinder/);
  assert.doesNotMatch(vehiclesSource, /finder-booking/);
});

test("migration creates booking and immutable 1:1 Finder context in one RPC", async () => {
  const migration = await readFile(
    new URL(
      "../../supabase/migrations/20260901100000_booking_finder_context.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /booking_id uuid primary key/);
  assert.match(migration, /before update or delete/);
  assert.match(
    migration,
    /create function public\.create_booking_with_finder_context[\s\S]*insert into public\.booking_requests[\s\S]*insert into public\.booking_finder_context/,
  );
});
