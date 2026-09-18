import { isActiveRental } from "./rental-projection.ts";

export const FLEET_STATUSES = [
  "Available",
  "Reserved",
  "Rented",
  "Maintenance",
  "Inactive",
] as const;

export type FleetStatus = (typeof FLEET_STATUSES)[number];

export type FleetOption = {
  id: string;
  name: string;
};

export type FleetCanonicalVehicle = {
  id: string;
  name: string;
  license_plate: string | null;
  transmission: string | null;
  seat_capacity: number | null;
  daily_rate: number | null;
  image_url: string | null;
  is_active: boolean;
  branch: FleetOption | null;
  category: FleetOption | null;
};

export type FleetCanonicalBooking = {
  assigned_vehicle_id: string | null;
  booking_status: string;
  pickup_at: string;
  return_at: string;
};

export type FleetCanonicalRental = {
  id: string;
  vehicle_id: string;
  started_at: string | null;
  ended_at: string | null;
  inspection_status?:
    | "Not required"
    | "Pending"
    | "Cleared"
    | "Maintenance scheduled";
  inspection_remarks?: string | null;
};

export type FleetCanonicalReadiness = {
  vehicleId: string;
  maintenanceReady: boolean;
  reasons: string[];
};

export type FleetSources = {
  vehicles: FleetCanonicalVehicle[];
  branches: FleetOption[];
  categories: FleetOption[];
  bookings: FleetCanonicalBooking[];
  rentals: FleetCanonicalRental[];
  readiness: FleetCanonicalReadiness[];
};

export type FleetVehicleRow = {
  id: string;
  name: string;
  plate: string | null;
  make: string;
  model: string;
  category: string | null;
  categoryId: string | null;
  transmission: string | null;
  seats: number | null;
  branch: string | null;
  branchId: string | null;
  pricePerDay: number | null;
  imageUrl: string | null;
  isActive: boolean;
  status: FleetStatus;
  maintenanceReady: boolean;
  readinessReasons: string[];
  pendingInspection: { rentalId: string; remarks: string | null } | null;
};

export type AdminFleetResponse = {
  generatedAt: string;
  vehicles: FleetVehicleRow[];
  branches: FleetOption[];
  categories: FleetOption[];
  operational: {
    totalVehicles: number;
    assignedBranches: number;
    availableVehicles: number;
    reservedVehicles: number;
    ongoingRentals: number;
    underMaintenance: number;
    readinessAttention: number;
    completedRentals: number;
  };
};

export function isCurrentConfirmedReservation(
  booking: FleetCanonicalBooking,
  now = new Date(),
) {
  if (booking.booking_status !== "Confirmed" || !booking.assigned_vehicle_id)
    return false;
  const pickup = Date.parse(booking.pickup_at);
  const returned = Date.parse(booking.return_at);
  const nowMs = now.getTime();
  return (
    Number.isFinite(pickup) &&
    Number.isFinite(returned) &&
    returned > pickup &&
    returned > nowMs
  );
}

export function getFleetVehicleStatus(
  vehicle: Pick<FleetCanonicalVehicle, "id" | "is_active">,
  readiness: FleetCanonicalReadiness | undefined,
  activeRentalVehicleIds: ReadonlySet<string>,
  reservedVehicleIds: ReadonlySet<string>,
  inspectionVehicleIds: ReadonlySet<string> = new Set(),
): FleetStatus {
  if (!vehicle.is_active) return "Inactive";
  if (activeRentalVehicleIds.has(vehicle.id)) return "Rented";
  if (inspectionVehicleIds.has(vehicle.id)) return "Maintenance";
  if (!readiness || !readiness.maintenanceReady) return "Maintenance";
  if (reservedVehicleIds.has(vehicle.id)) return "Reserved";
  return "Available";
}

export function buildAdminFleet(
  sources: FleetSources,
  generatedAt = new Date().toISOString(),
  now = new Date(),
): AdminFleetResponse {
  const readinessByVehicle = new Map(
    sources.readiness.map((item) => [item.vehicleId, item]),
  );
  const activeRentalVehicleIds = new Set(
    sources.rentals.filter(isActiveRental).map((rental) => rental.vehicle_id),
  );
  const reservedVehicleIds = new Set(
    sources.bookings
      .filter((booking) => isCurrentConfirmedReservation(booking, now))
      .map((booking) => booking.assigned_vehicle_id as string),
  );
  const inspectionByVehicle = new Map(
    sources.rentals
      .filter(
        (rental) =>
          rental.ended_at != null && rental.inspection_status === "Pending",
      )
      .sort((left, right) =>
        String(right.ended_at).localeCompare(String(left.ended_at)),
      )
      .map((rental) => [rental.vehicle_id, rental]),
  );

  const vehicles = sources.vehicles.map((vehicle) => {
    const readiness = readinessByVehicle.get(vehicle.id);
    const parts = vehicle.name.trim().split(/\s+/);
    return {
      id: vehicle.id,
      name: vehicle.name,
      plate: vehicle.license_plate,
      make: parts[0] ?? vehicle.name,
      model: parts.slice(1).join(" "),
      category: vehicle.category?.name ?? null,
      categoryId: vehicle.category?.id ?? null,
      transmission: vehicle.transmission,
      seats: vehicle.seat_capacity,
      branch: vehicle.branch?.name ?? null,
      branchId: vehicle.branch?.id ?? null,
      pricePerDay: vehicle.daily_rate,
      imageUrl: vehicle.image_url,
      isActive: vehicle.is_active,
      status: getFleetVehicleStatus(
        vehicle,
        readiness,
        activeRentalVehicleIds,
        reservedVehicleIds,
        new Set(inspectionByVehicle.keys()),
      ),
      maintenanceReady: readiness?.maintenanceReady ?? false,
      readinessReasons: readiness?.reasons ?? ["Readiness unavailable"],
      pendingInspection: inspectionByVehicle.has(vehicle.id)
        ? {
            rentalId: inspectionByVehicle.get(vehicle.id)!.id,
            remarks:
              inspectionByVehicle.get(vehicle.id)!.inspection_remarks ?? null,
          }
        : null,
    } satisfies FleetVehicleRow;
  });

  return {
    generatedAt,
    vehicles,
    branches: sources.branches,
    categories: sources.categories,
    operational: {
      totalVehicles: vehicles.length,
      assignedBranches: new Set(
        vehicles
          .map((vehicle) => vehicle.branchId)
          .filter((branchId): branchId is string => Boolean(branchId)),
      ).size,
      availableVehicles: vehicles.filter(
        (vehicle) => vehicle.status === "Available",
      ).length,
      reservedVehicles: vehicles.filter(
        (vehicle) => vehicle.status === "Reserved",
      ).length,
      ongoingRentals: vehicles.filter((vehicle) => vehicle.status === "Rented")
        .length,
      underMaintenance: vehicles.filter(
        (vehicle) => vehicle.status === "Maintenance",
      ).length,
      readinessAttention: vehicles.filter(
        (vehicle) => !vehicle.maintenanceReady,
      ).length,
      completedRentals: sources.rentals.filter(
        (rental) => rental.started_at != null && rental.ended_at != null,
      ).length,
    },
  };
}
