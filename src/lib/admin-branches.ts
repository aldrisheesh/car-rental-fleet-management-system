export type CanonicalBranchRecord = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
};

export type CanonicalVehicleAssignment = {
  branch_id: string | null;
};

export type AdminBranchRow = {
  record: CanonicalBranchRecord;
  assignedVehicleCount: number;
};

export function buildAdminBranchRows(
  branches: CanonicalBranchRecord[],
  vehicles: CanonicalVehicleAssignment[],
): AdminBranchRow[] {
  const assignedVehicleCounts = new Map<string, number>();
  for (const vehicle of vehicles) {
    if (vehicle.branch_id == null) continue;
    assignedVehicleCounts.set(
      vehicle.branch_id,
      (assignedVehicleCounts.get(vehicle.branch_id) ?? 0) + 1,
    );
  }

  return branches.map((record) => ({
    record,
    assignedVehicleCount: assignedVehicleCounts.get(record.id) ?? 0,
  }));
}
