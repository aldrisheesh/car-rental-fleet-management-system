import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
/* eslint-disable @typescript-eslint/no-explicit-any -- focused fixture/request capture types. */

import {
  handleOperationalContextRequest,
  resolveOperationalContext,
  type OperationalContextRepository,
} from "./admin-operational-context.server.ts";
import type { TripContext } from "./external-context.server.ts";

const checkedAt = "2026-09-02T10:00:00.000Z";
const pickupAt = "2026-09-05T08:30:00.000Z";

const trip = (vehicleId?: string): TripContext => ({
  destinationGeocode: {
    status: "available",
    fallbackUsed: false,
    fetchedAt: checkedAt,
    providerUsed: "tomtom",
    data: { label: "Baguio", latitude: 16.4, longitude: 120.6 },
  },
  originGeocode: {
    status: "available",
    fallbackUsed: false,
    fetchedAt: checkedAt,
    providerUsed: "tomtom",
    data: { label: "Taft", latitude: 14.6, longitude: 121 },
  },
  route: {
    status: "available",
    fallbackUsed: false,
    fetchedAt: checkedAt,
    providerUsed: "tomtom",
    data: {
      distanceMeters: 120000,
      durationSeconds: 10800,
      trafficAware: true,
    },
  },
  weather: {
    status: "available",
    fallbackUsed: false,
    fetchedAt: checkedAt,
    providerUsed: "open_meteo",
    data: { targetTime: pickupAt, weatherCode: 61 },
  },
  trafficIncidents: {
    status: "available",
    fallbackUsed: false,
    fetchedAt: checkedAt,
    providerUsed: "tomtom",
    data: [],
  },
  ...(vehicleId === "vehicle-1"
    ? {
        fuelEstimate: {
          estimatedLiters: 10,
          label: "reference estimate" as const,
        },
      }
    : {}),
});

function repository(): OperationalContextRepository {
  return {
    async findBooking(id) {
      return id === "booking-1"
        ? {
            id,
            destination: "Baguio City",
            pickupAt,
            pickupBranchId: "branch-source",
            bookingStatus: "Submitted",
          }
        : id === "booking-missing-destination"
          ? {
              id,
              destination: null,
              pickupAt,
              pickupBranchId: "branch-source",
              bookingStatus: "Submitted",
            }
          : null;
    },
    async findBranch(id) {
      return id === "branch-source"
        ? { id, name: "Taft, Manila", address: "Taft Avenue, Manila" }
        : id === "branch-destination"
          ? { id, name: "Antipolo, Rizal", address: "Antipolo, Rizal" }
          : null;
    },
    async findBookingAssignmentCandidate(bookingId, vehicleId) {
      if (bookingId !== "booking-1" || vehicleId !== "vehicle-1") return null;
      return vehicleId === "vehicle-1"
        ? {
            id: vehicleId,
            name: "Toyota Innova",
            licensePlate: "ABC 123",
            referenceEfficiencyKmPerLiter: 12,
          }
        : null;
    },
    async findAllocation(id) {
      return id === "recommendation-1"
        ? {
            id,
            sourceBranchId: "branch-source",
            destinationBranchId: "branch-destination",
            recommendedTransferUnits: 2,
          }
        : null;
    },
    async findAllocationCandidates(id) {
      return id === "recommendation-1"
        ? [
            {
              id: "vehicle-1",
              name: "Toyota Innova",
              licensePlate: "ABC 123",
              candidateRank: 1,
              referenceEfficiencyKmPerLiter: 12,
            },
            {
              id: "vehicle-2",
              name: "Toyota Vios",
              licensePlate: "XYZ 456",
              candidateRank: 2,
              referenceEfficiencyKmPerLiter: 15,
            },
          ]
        : [];
    },
  };
}

const dependencies = (
  getTripContext = async (request: any) => trip(request.vehicleId),
) => ({
  repository: repository(),
  getTripContext,
  now: () => new Date(checkedAt),
});

test("booking assignment resolves canonical destination, branch, pickup target, and selected candidate fuel", async () => {
  let request: any;
  const result = await resolveOperationalContext(
    {
      kind: "booking_assignment",
      bookingId: "booking-1",
      vehicleId: "vehicle-1",
    },
    dependencies(async (value) => {
      request = value;
      return trip(value.vehicleId);
    }),
  );
  assert.equal(request.destination, "Baguio City");
  assert.equal(request.pickupBranchId, "branch-source");
  assert.equal(request.targetTime, pickupAt);
  assert.equal(result.origin.name, "Taft, Manila");
  assert.equal(result.referenceEfficiencyKmPerLiter, 12);
  assert.equal(result.estimatedFuelLiters, 10);
  assert.match(
    result.explanations.join(" "),
    /Rain may affect travel conditions/,
  );
});

test("booking with no destination is not applicable and never calls a provider", async () => {
  let calls = 0;
  const result = await resolveOperationalContext(
    { kind: "booking_assignment", bookingId: "booking-missing-destination" },
    dependencies(async () => {
      calls += 1;
      return trip();
    }),
  );
  assert.equal(result.status, "not_applicable");
  assert.equal(result.reason, "missing_destination");
  assert.equal(calls, 0);
});

test("booking rejects nonexistent, inactive, and active out-of-scope assignment candidates", async () => {
  await assert.rejects(
    () =>
      resolveOperationalContext(
        { kind: "booking_assignment", bookingId: "missing" },
        dependencies(),
      ),
    /Submitted booking not found/,
  );
  await assert.rejects(
    () =>
      resolveOperationalContext(
        {
          kind: "booking_assignment",
          bookingId: "booking-1",
          vehicleId: "active-conflicting-vehicle",
        },
        dependencies(),
      ),
    /not a booking assignment candidate/,
  );
  await assert.rejects(
    () =>
      resolveOperationalContext(
        {
          kind: "booking_assignment",
          bookingId: "booking-1",
          vehicleId: "inactive-vehicle",
        },
        dependencies(),
      ),
    /not a booking assignment candidate/,
  );
  await assert.rejects(
    () =>
      resolveOperationalContext(
        {
          kind: "booking_assignment",
          bookingId: "booking-1",
          vehicleId: "missing-vehicle",
        },
        dependencies(),
      ),
    /not a booking assignment candidate/,
  );
});

test("provider failure returns safe unavailable booking context without changing workflow data", async () => {
  const result = await resolveOperationalContext(
    { kind: "booking_assignment", bookingId: "booking-1" },
    dependencies(async () => {
      throw new Error("provider secret");
    }),
  );
  assert.equal(result.status, "unavailable");
  assert.equal(result.context?.weather.classification, "Unavailable");
  assert.deepEqual(await repository().findBooking("booking-1"), {
    id: "booking-1",
    destination: "Baguio City",
    pickupAt,
    pickupBranchId: "branch-source",
    bookingStatus: "Submitted",
  });
});

test("allocation uses canonical branches and current review time while preserving units and rank", async () => {
  let request: any;
  const result = await resolveOperationalContext(
    { kind: "allocation_review", recommendationId: "recommendation-1" },
    dependencies(async (value) => {
      request = value;
      return trip();
    }),
  );
  assert.equal(request.pickupBranchId, "branch-source");
  assert.equal(request.destination, "Antipolo, Rizal");
  assert.equal(request.targetTime, checkedAt);
  assert.equal(result.timeSemantics, "current_review");
  assert.equal(result.recommendation?.recommendedTransferUnits, 2);
  assert.deepEqual(
    result.recommendation?.candidates.map(
      (candidate) => candidate.candidateRank,
    ),
    [1, 2],
  );
  assert.deepEqual(
    result.recommendation?.candidates.map(
      (candidate) => candidate.estimatedFuelLiters,
    ),
    [10, 8],
  );
});

test("allocation rejects invalid recommendations and out-of-scope candidates", async () => {
  await assert.rejects(
    () =>
      resolveOperationalContext(
        { kind: "allocation_review", recommendationId: "missing" },
        dependencies(),
      ),
    /Allocation recommendation not found/,
  );
  await assert.rejects(
    () =>
      resolveOperationalContext(
        {
          kind: "allocation_candidate",
          recommendationId: "recommendation-1",
          vehicleId: "not-a-candidate",
        },
        dependencies(),
      ),
    /not an allocation candidate/,
  );
});

test("allocation provider failure remains advisory and safe", async () => {
  const result = await resolveOperationalContext(
    { kind: "allocation_review", recommendationId: "recommendation-1" },
    dependencies(async () => {
      throw new Error("provider failure");
    }),
  );
  assert.equal(result.status, "unavailable");
  assert.equal(result.recommendation?.recommendedTransferUnits, 2);
  assert.deepEqual(
    result.recommendation?.candidates.map(
      (candidate) => candidate.candidateRank,
    ),
    [1, 2],
  );
});

test("operational context endpoint permits only Owner/Admin", async () => {
  const call = (role: string) =>
    handleOperationalContextRequest(
      new Request("http://localhost/api/operational-context", {
        method: "POST",
        body: JSON.stringify({
          kind: "booking_assignment",
          bookingId: "booking-1",
        }),
      }),
      { ...dependencies(), getPrincipal: async () => ({ role }) },
    );
  assert.equal((await call("Owner/Admin")).status, 200);
  assert.equal((await call("Customer/Renter")).status, 403);
  assert.equal((await call("Operations Staff")).status, 403);
  const unauthenticated = await handleOperationalContextRequest(
    new Request("http://localhost/api/operational-context", {
      method: "POST",
      body: JSON.stringify({
        kind: "booking_assignment",
        bookingId: "booking-1",
      }),
    }),
    {
      ...dependencies(),
      getPrincipal: async () => {
        throw new Error("unauthenticated");
      },
    },
  );
  assert.equal(unauthenticated.status, 401);
});

test("Admin UI contains advisory booking and current allocation context without the obsolete recommendation", async () => {
  const [bookings, decisions] = await Promise.all([
    readFile(new URL("../routes/admin.bookings.tsx", import.meta.url), "utf8"),
    readFile(new URL("../routes/admin.decisions.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(bookings, /OperationalContextPanel/);
  assert.match(bookings, /getAdminSession/);
  assert.match(bookings, /staffView \|\| !selected\?\.id/);
  assert.match(
    bookings,
    /!staffView && selected\?\.booking_status === "Submitted"/,
  );
  assert.match(bookings, /vehicleId/);
  assert.match(decisions, /Current route context for transfer review/);
  assert.match(
    decisions,
    /not part of the original allocation score\/snapshot/,
  );
  assert.doesNotMatch(decisions, /Vehicle recommendation/);
  assert.doesNotMatch(decisions, /RadarChart/);
  assert.match(
    decisions,
    /setContextRecommendationId\(rows\[0\]\?\.id \?\? ""\)/,
  );
  assert.match(decisions, /setAllocationContext\(null\)/);
  assert.match(decisions, /allocationContextVersion/);
});
