import type { AppRole } from "./auth.ts";
import { isVehicleAvailableNow } from "./admin-dashboard.ts";
import type {
  FleetMaintenanceReadinessItem,
  FleetMaintenanceReadinessVehicle,
} from "./maintenance-readiness.server.ts";
import type { MaintenanceReadinessReason } from "./maintenance-readiness.ts";
import { isActiveRental } from "./rental-projection.ts";

export const PROVISIONAL_LOW_AVAILABILITY_THRESHOLD = 1;

export type OperationalNotificationType =
  | "maintenance_attention"
  | "low_availability";

export type OperationalProfile = {
  id: string;
  userType: string;
  accountStatus: string;
};

export type OperationalNotificationPreference = {
  recipientId: string;
  maintenanceAttentionEnabled: boolean;
  lowAvailabilityEnabled: boolean;
};

export type OperationalBranch = {
  id: string;
  name: string;
  isActive: boolean;
};

export type OperationalRental = {
  vehicle_id: string;
  started_at: string | null;
  ended_at: string | null;
};

export type OperationalNotificationSnapshot = {
  branches: OperationalBranch[];
  vehicles: FleetMaintenanceReadinessVehicle[];
  readiness: FleetMaintenanceReadinessItem[];
  rentals: OperationalRental[];
  profiles: OperationalProfile[];
  preferences: OperationalNotificationPreference[];
};

export type OperationalCondition = {
  conditionType: OperationalNotificationType;
  relatedEntityType: "vehicle" | "branch";
  relatedEntityId: string;
  title: string;
  message: string;
  recipientIds: string[];
};

export type OperationalProcessingSummary = {
  activeConditionCount: number;
  activatedCount: number;
  resolvedCount: number;
  unchangedCount: number;
  createdNotificationCount: number;
};

export type OperationalConditionStore = {
  reconcile(
    conditions: OperationalCondition[],
  ): Promise<OperationalProcessingSummary>;
};

const MATERIAL_MAINTENANCE_REASONS = new Set<MaintenanceReadinessReason>([
  "Active blocking maintenance",
  "Preventive maintenance due by date",
  "Preventive maintenance due by odometer",
  "Vehicle condition blocks rental use",
  "Current odometer unavailable for recorded service target",
]);

export function parseLowAvailabilityThreshold(value: string | undefined) {
  if (value == null || value.trim() === "")
    return PROVISIONAL_LOW_AVAILABILITY_THRESHOLD;
  const threshold = Number(value);
  if (!Number.isSafeInteger(threshold) || threshold < 1)
    throw new Error("invalid_low_availability_threshold");
  return threshold;
}

export function canReceiveOperationalNotification(
  profile: OperationalProfile,
  notificationType: OperationalNotificationType,
  preference?: OperationalNotificationPreference,
) {
  if (profile.accountStatus !== "Active") return false;
  const role = profile.userType as AppRole;
  if (notificationType === "maintenance_attention")
    return (
      role === "Owner/Admin" &&
      preference?.maintenanceAttentionEnabled !== false
    );
  return (
    (role === "Owner/Admin" || role === "Operations Staff") &&
    preference?.lowAvailabilityEnabled !== false
  );
}

export function deriveOperationalConditions(
  snapshot: OperationalNotificationSnapshot,
  threshold: number,
): OperationalCondition[] {
  if (!Number.isSafeInteger(threshold) || threshold < 1)
    throw new Error("invalid_low_availability_threshold");

  const preferences = new Map(
    snapshot.preferences.map((preference) => [
      preference.recipientId,
      preference,
    ]),
  );
  const recipientIds = (notificationType: OperationalNotificationType) =>
    snapshot.profiles
      .filter((profile) =>
        canReceiveOperationalNotification(
          profile,
          notificationType,
          preferences.get(profile.id),
        ),
      )
      .map((profile) => profile.id)
      .sort();
  const maintenanceRecipientIds = recipientIds("maintenance_attention");
  const availabilityRecipientIds = recipientIds("low_availability");
  const conditions: OperationalCondition[] = [];

  for (const readiness of snapshot.readiness) {
    const reasons = readiness.reasons.filter((reason) =>
      MATERIAL_MAINTENANCE_REASONS.has(reason),
    );
    if (reasons.length === 0) continue;
    conditions.push({
      conditionType: "maintenance_attention",
      relatedEntityType: "vehicle",
      relatedEntityId: readiness.vehicleId,
      title: "Vehicle needs maintenance attention",
      message: `${readiness.vehicleName} requires maintenance attention before rental use: ${formatReasons(reasons)}.`,
      recipientIds: maintenanceRecipientIds,
    });
  }

  const activeRentalVehicleIds = new Set(
    snapshot.rentals.filter(isActiveRental).map((rental) => rental.vehicle_id),
  );
  const readinessByVehicle = new Map(
    snapshot.readiness.map((readiness) => [readiness.vehicleId, readiness]),
  );

  for (const branch of snapshot.branches.filter((item) => item.isActive)) {
    const availableCount = snapshot.vehicles.filter(
      (vehicle) =>
        vehicle.branchId === branch.id &&
        isVehicleAvailableNow(
          vehicle,
          readinessByVehicle.get(vehicle.vehicleId),
          activeRentalVehicleIds,
        ),
    ).length;
    if (availableCount >= threshold) continue;
    conditions.push({
      conditionType: "low_availability",
      relatedEntityType: "branch",
      relatedEntityId: branch.id,
      title: "Low vehicle availability",
      message: `Only ${availableCount} rentable ${availableCount === 1 ? "vehicle is" : "vehicles are"} currently available at ${branch.name}.`,
      recipientIds: availabilityRecipientIds,
    });
  }

  return conditions.sort((left, right) =>
    `${left.conditionType}:${left.relatedEntityId}`.localeCompare(
      `${right.conditionType}:${right.relatedEntityId}`,
    ),
  );
}

export async function processOperationalNotificationSnapshot(
  snapshot: OperationalNotificationSnapshot,
  threshold: number,
  store: OperationalConditionStore,
) {
  return store.reconcile(deriveOperationalConditions(snapshot, threshold));
}

function formatReasons(reasons: MaintenanceReadinessReason[]) {
  return reasons
    .map((reason) => reason[0].toLowerCase() + reason.slice(1))
    .join(", ");
}
