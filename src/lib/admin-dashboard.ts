import type { AppRole } from "./auth";
import type {
  FleetMaintenanceReadinessItem,
  FleetMaintenanceReadinessVehicle,
} from "./maintenance-readiness.server";
import { isActiveRental } from "./rental-projection.ts";

export type DashboardBookingRecord = {
  id: string;
  booking_status: string;
  pickup_at: string;
  return_at: string;
  created_at: string;
  requested_vehicle: { name: string } | null;
  assigned_vehicle: { name: string } | null;
};

export type DashboardRentalRecord = {
  vehicle_id: string;
  started_at: string | null;
  ended_at: string | null;
};

export type DashboardSources = {
  bookings: DashboardBookingRecord[];
  rentals: DashboardRentalRecord[];
  readiness: FleetMaintenanceReadinessItem[];
  vehicles: FleetMaintenanceReadinessVehicle[];
};

export type AdminDashboardResponse = {
  generatedAt: string;
  role: "Owner/Admin" | "Operations Staff";
  operational: {
    submittedBookings: number;
    activeRentals: number;
    availableVehicles: number;
    readinessAttention: number;
  };
  recentBookings: Array<{
    id: string;
    status: string;
    pickupAt: string;
    returnAt: string;
    vehicleName: string | null;
  }>;
  readinessAttention: Array<{
    vehicleId: string;
    vehicleName: string;
    licensePlate: string;
    reasons: string[];
  }>;
};

/**
 * Current availability is the canonical current-state analytics definition:
 * the vehicle is active, maintenance-ready, and has no active physical rental.
 * Future booking-window availability remains the responsibility of Finder.
 */
export function isVehicleAvailableNow(
  vehicle: FleetMaintenanceReadinessVehicle,
  readiness: FleetMaintenanceReadinessItem | undefined,
  activeRentalVehicleIds: ReadonlySet<string>,
) {
  return (
    vehicle.isActive &&
    readiness?.maintenanceReady === true &&
    !activeRentalVehicleIds.has(vehicle.vehicleId)
  );
}

export function buildAdminDashboard(
  role: AppRole,
  sources: DashboardSources,
  generatedAt = new Date().toISOString(),
): AdminDashboardResponse {
  if (role === "Customer/Renter") throw new Error("forbidden");

  const activeRentals = sources.rentals.filter(isActiveRental);
  const activeRentalVehicleIds = new Set(
    activeRentals.map((rental) => rental.vehicle_id),
  );
  const readinessByVehicle = new Map(
    sources.readiness.map((item) => [item.vehicleId, item]),
  );
  const attention = sources.readiness.filter((item) => !item.maintenanceReady);

  return {
    generatedAt,
    role,
    operational: {
      submittedBookings: sources.bookings.filter(
        (booking) => booking.booking_status === "Submitted",
      ).length,
      activeRentals: activeRentals.length,
      availableVehicles: sources.vehicles.filter((vehicle) =>
        isVehicleAvailableNow(
          vehicle,
          readinessByVehicle.get(vehicle.vehicleId),
          activeRentalVehicleIds,
        ),
      ).length,
      readinessAttention: attention.length,
    },
    recentBookings: [...sources.bookings]
      .sort(
        (left, right) =>
          Date.parse(right.created_at) - Date.parse(left.created_at),
      )
      .slice(0, 6)
      .map((booking) => ({
        id: booking.id,
        status: booking.booking_status,
        pickupAt: booking.pickup_at,
        returnAt: booking.return_at,
        vehicleName:
          booking.assigned_vehicle?.name ??
          booking.requested_vehicle?.name ??
          null,
      })),
    readinessAttention: attention.map((item) => ({
      vehicleId: item.vehicleId,
      vehicleName: item.vehicleName,
      licensePlate: item.licensePlate,
      reasons: item.reasons,
    })),
  };
}

export async function loadAdminDashboard(
  role: AppRole,
  loadSources: () => Promise<DashboardSources>,
  generatedAt = new Date().toISOString(),
) {
  if (role === "Customer/Renter") throw new Error("forbidden");
  return buildAdminDashboard(role, await loadSources(), generatedAt);
}
