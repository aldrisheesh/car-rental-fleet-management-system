import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildAdminFleet,
  getFleetVehicleStatus,
  isCurrentConfirmedReservation,
  type FleetCanonicalBooking,
  type FleetCanonicalReadiness,
  type FleetCanonicalRental,
  type FleetCanonicalVehicle,
} from "./admin-fleet.ts";

const now = new Date("2026-09-10T04:00:00.000Z");

function vehicle(
  id: string,
  overrides: Partial<FleetCanonicalVehicle> = {},
): FleetCanonicalVehicle {
  return {
    id,
    name: id,
    license_plate: `${id}-PLATE`,
    transmission: "Automatic",
    seat_capacity: 5,
    daily_rate: 1000,
    is_active: true,
    branch: { id: "branch-1", name: "Canonical Branch" },
    category: { id: "category-1", name: "Canonical Category" },
    ...overrides,
  };
}

function readiness(
  vehicleId: string,
  overrides: Partial<FleetCanonicalReadiness> = {},
): FleetCanonicalReadiness {
  return {
    vehicleId,
    maintenanceReady: true,
    reasons: [],
    ...overrides,
  };
}

function booking(
  assigned_vehicle_id: string,
  overrides: Partial<FleetCanonicalBooking> = {},
): FleetCanonicalBooking {
  return {
    assigned_vehicle_id,
    booking_status: "Confirmed",
    pickup_at: "2026-09-10T03:00:00.000Z",
    return_at: "2026-09-10T08:00:00.000Z",
    ...overrides,
  };
}

function rental(
  vehicle_id: string,
  overrides: Partial<FleetCanonicalRental> = {},
): FleetCanonicalRental {
  return {
    vehicle_id,
    started_at: "2026-09-10T03:00:00.000Z",
    ended_at: null,
    ...overrides,
  };
}

test("active rentals are never presented as Available", () => {
  assert.equal(
    getFleetVehicleStatus(
      vehicle("rented"),
      readiness("rented"),
      new Set(["rented"]),
      new Set(),
    ),
    "Rented",
  );
});

test("maintenance readiness attention is never presented as Available", () => {
  assert.equal(
    getFleetVehicleStatus(
      vehicle("maintenance"),
      readiness("maintenance", {
        maintenanceReady: false,
        reasons: ["Active blocking maintenance"],
      }),
      new Set(),
      new Set(),
    ),
    "Maintenance",
  );
});

test("only a current confirmed assignment is Reserved", () => {
  assert.equal(isCurrentConfirmedReservation(booking("reserved"), now), true);
  assert.equal(
    isCurrentConfirmedReservation(
      booking("expired", {
        pickup_at: "2026-09-08T03:00:00.000Z",
        return_at: "2026-09-09T08:00:00.000Z",
      }),
      now,
    ),
    false,
  );
  assert.equal(
    isCurrentConfirmedReservation(
      booking("submitted", { booking_status: "Submitted" }),
      now,
    ),
    false,
  );
});

test("Fleet totals, readiness, and completed rentals use canonical sources", () => {
  const result = buildAdminFleet(
    {
      vehicles: [
        vehicle("available"),
        vehicle("reserved"),
        vehicle("rented"),
        vehicle("maintenance"),
        vehicle("inactive", { is_active: false }),
      ],
      branches: [{ id: "branch-1", name: "Canonical Branch" }],
      categories: [{ id: "category-1", name: "Canonical Category" }],
      bookings: [booking("reserved")],
      rentals: [
        rental("rented"),
        rental("returned", {
          started_at: "2026-09-01T03:00:00.000Z",
          ended_at: "2026-09-02T08:00:00.000Z",
        }),
      ],
      readiness: [
        readiness("available"),
        readiness("reserved"),
        readiness("rented"),
        readiness("maintenance", {
          maintenanceReady: false,
          reasons: ["Active blocking maintenance"],
        }),
        readiness("inactive", {
          maintenanceReady: false,
          reasons: ["Vehicle inactive"],
        }),
      ],
    },
    now.toISOString(),
    now,
  );

  assert.equal(result.operational.totalVehicles, 5);
  assert.equal(result.operational.availableVehicles, 1);
  assert.equal(result.operational.reservedVehicles, 1);
  assert.equal(result.operational.ongoingRentals, 1);
  assert.equal(result.operational.readinessAttention, 2);
  assert.equal(result.operational.completedRentals, 1);
  assert.equal(
    result.vehicles.find((item) => item.id === "maintenance")?.status,
    "Maintenance",
  );
  assert.equal(
    result.vehicles.find((item) => item.id === "inactive")?.status,
    "Inactive",
  );
});

test("Fleet page does not use prototype fleet, booking, or unsupported fields", async () => {
  const page = await readFile(
    new URL("../routes/admin.fleet.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    page,
    /@\/data\/admin|56 total vehicles|condition: "Good"/,
  );
  assert.doesNotMatch(page, /chassisNumber|Color|Chassis No\.|Condition/);
  assert.match(page, /fetch\("\/api\/admin-fleet"/);
  assert.match(page, /Canonical returns/);
});
