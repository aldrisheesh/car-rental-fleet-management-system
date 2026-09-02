export type MaintenanceStatus = "Open" | "Completed" | "Cancelled";

export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  status: MaintenanceStatus;
  blocks_rental_use: boolean;
  service_started_at: string;
  completed_at: string | null;
  odometer_at_service: number | null;
  next_service_odometer: number | null;
  next_service_date: string | null;
  cost_php: number | null;
  remarks: string | null;
  created_at: string;
  vehicle: {
    id: string;
    name: string;
    license_plate: string;
  } | null;
};

export type MaintenanceDraft = {
  vehicleId: string;
  maintenanceType: string;
  description: string;
  blocksRentalUse: boolean;
  serviceStartedAt: string;
  odometerAtService: string;
  nextServiceOdometer: string;
  nextServiceDate: string;
  costPhp: string;
  remarks: string;
};

export type MaintenanceFinalDraft = Pick<
  MaintenanceDraft,
  | "odometerAtService"
  | "nextServiceOdometer"
  | "nextServiceDate"
  | "costPhp"
  | "remarks"
>;

export function maintenanceSummary(records: MaintenanceRecord[]) {
  const active = records.filter((record) => record.status === "Open");
  return {
    open: active.length,
    blocking: active.filter((record) => record.blocks_rental_use).length,
  };
}

export function isMaintenanceDraftValid(draft: MaintenanceDraft) {
  return Boolean(
    draft.vehicleId && draft.maintenanceType.trim() && draft.description.trim(),
  );
}

export function partitionMaintenanceRecords(records: MaintenanceRecord[]) {
  const newestFirst = (left: MaintenanceRecord, right: MaintenanceRecord) =>
    String(right.completed_at ?? right.created_at).localeCompare(
      String(left.completed_at ?? left.created_at),
    );
  return {
    active: records
      .filter((record) => record.status === "Open")
      .sort(
        (left, right) =>
          Number(right.blocks_rental_use) - Number(left.blocks_rental_use) ||
          String(right.service_started_at ?? right.created_at).localeCompare(
            String(left.service_started_at ?? left.created_at),
          ),
      ),
    history: records
      .filter(
        (record) =>
          record.status === "Completed" || record.status === "Cancelled",
      )
      .sort(newestFirst),
  };
}

function optionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

export function createMaintenancePayload(draft: MaintenanceDraft) {
  const odometerAtService = optionalNumber(draft.odometerAtService);
  const nextServiceOdometer = optionalNumber(draft.nextServiceOdometer);
  const costPhp = optionalNumber(draft.costPhp);
  return {
    vehicleId: draft.vehicleId,
    maintenanceType: draft.maintenanceType.trim(),
    description: draft.description.trim(),
    blocksRentalUse: draft.blocksRentalUse,
    ...(draft.serviceStartedAt
      ? { serviceStartedAt: new Date(draft.serviceStartedAt).toISOString() }
      : {}),
    ...(odometerAtService === undefined ? {} : { odometerAtService }),
    ...(nextServiceOdometer === undefined ? {} : { nextServiceOdometer }),
    ...(draft.nextServiceDate
      ? { nextServiceDate: draft.nextServiceDate }
      : {}),
    ...(costPhp === undefined ? {} : { costPhp }),
    ...(draft.remarks.trim() ? { remarks: draft.remarks.trim() } : {}),
  };
}

export function transitionMaintenancePayload(
  id: string,
  status: "Completed" | "Cancelled",
  draft: MaintenanceFinalDraft,
) {
  const odometerAtService = optionalNumber(draft.odometerAtService);
  const nextServiceOdometer = optionalNumber(draft.nextServiceOdometer);
  const costPhp = optionalNumber(draft.costPhp);
  return {
    id,
    status,
    ...(status === "Completed" && odometerAtService !== undefined
      ? { odometerAtService }
      : {}),
    ...(status === "Completed" && nextServiceOdometer !== undefined
      ? { nextServiceOdometer }
      : {}),
    ...(status === "Completed" && draft.nextServiceDate
      ? { nextServiceDate: draft.nextServiceDate }
      : {}),
    ...(status === "Completed" && costPhp !== undefined ? { costPhp } : {}),
    ...(draft.remarks.trim() ? { remarks: draft.remarks.trim() } : {}),
  };
}
