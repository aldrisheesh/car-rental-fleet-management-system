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

test("same key and same manual request returns one canonical booking", async () => {
  const [bookingSource, migration] = await Promise.all([
    readFile(new URL("../routes/api.bookings.ts", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../../supabase/migrations/20260901101000_booking_creation_idempotency.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(bookingSource, /create_booking_idempotent/);
  assert.doesNotMatch(bookingSource, /from\("booking_requests"\)\.insert/);
  assert.match(migration, /primary key \(customer_id, idempotency_key\)/);
  assert.match(
    migration,
    /pg_advisory_xact_lock[\s\S]*if found then[\s\S]*return v_booking;[\s\S]*insert into public\.booking_requests/,
  );
});

test("same key and same Finder request creates one booking and one context", async () => {
  const [migration, originalMigration, bookingSource] = await Promise.all(
    [
      "20260901101000_booking_creation_idempotency.sql",
      "20260901100000_booking_finder_context.sql",
    ]
      .map((file) =>
        readFile(
          new URL(`../../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      )
      .concat(
        readFile(new URL("../routes/api.bookings.ts", import.meta.url), "utf8"),
      ),
  );
  assert.match(
    migration,
    /if p_has_finder_context then[\s\S]*insert into public\.booking_finder_context/,
  );
  assert.match(migration, /booking_id uuid not null unique/);
  assert.match(originalMigration, /booking_id uuid primary key/);
  assert.ok(
    bookingSource.indexOf("lookup_booking_creation_idempotency") <
      bookingSource.indexOf("evaluateCanonicalVehicleFinder(finderContext"),
  );
});

test("trusted fingerprint binds the material manual and Finder request", async () => {
  const source = await readFile(
    new URL("../routes/api.bookings.ts", import.meta.url),
    "utf8",
  );
  const fingerprintStart = source.indexOf("bookingCreationFingerprint({");
  const fingerprintInput = source.slice(
    fingerprintStart,
    source.indexOf("const client = getSupabaseServerClient();", fingerprintStart),
  );
  for (const field of [
    "customerId",
    "requestedVehicleId",
    "pickupBranchId",
    "returnBranchId",
    "pickupAt",
    "returnAt",
    "destination",
    "purpose",
    "option",
    "pickupLocation",
    "dropoffLocation",
    "seats",
    "selectedVehicleId",
    "requestedStart",
    "requestedEnd",
    "passengerCount",
    "maximumBudget",
    "preferredCategory",
  ])
    assert.match(fingerprintInput, new RegExp(`\\b${field}\\b`));
  assert.match(source, /createHash\("sha256"\)/);
});

test("same key with materially different request is a controlled mismatch", async () => {
  const [bookingSource, migration] = await Promise.all([
    readFile(new URL("../routes/api.bookings.ts", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../../supabase/migrations/20260901101000_booking_creation_idempotency.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(migration, /raise exception 'idempotency_request_mismatch'/);
  assert.match(bookingSource, /idempotency_request_mismatch/);
  assert.match(bookingSource, /different booking details[\s\S]*409/);
});

test("Booking reuses a key for retries and rotates it for a changed payload", async () => {
  const source = await readFile(
    new URL("../routes/booking.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /submissionAttemptRef = useRef/);
  assert.match(
    source,
    /submissionAttemptRef\.current\.payload !== serializedPayload[\s\S]*crypto\.randomUUID\(\)/,
  );
  assert.match(source, /idempotencyKey: submissionAttemptRef\.current\.key/);
});

test("a new customer-scoped key may create a later intentional booking", async () => {
  const migration = await readFile(
    new URL(
      "../../supabase/migrations/20260901101000_booking_creation_idempotency.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /primary key \(customer_id, idempotency_key\)/);
  assert.doesNotMatch(migration, /unique \(customer_id, request_fingerprint\)/);
});
