export type ApiMasterVehicle = {
  id: string;
  name: string;
  category_id: string;
  branch_id: string;
  license_plate: string | null;
  transmission: string | null;
  fuel_type: string | null;
  seat_capacity: number | null;
  daily_rate: number | null;
  reference_fuel_efficiency_km_per_liter: number | null;
  current_odometer_km: number | null;
  condition_blocks_rental_use: boolean;
  image_url: string | null;
  is_active: boolean;
  branch: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
};

export type VehicleMasterDataInput = {
  name: string;
  branchId: string;
  categoryId: string;
  licensePlate: string | null;
  transmission: string | null;
  seatCapacity: number | null;
  dailyRate: number | null;
  isActive: boolean;
  fuelType: string | null;
  referenceFuelEfficiency: number | null;
  imageUrl: string | null;
  currentOdometerKm: number | null;
  conditionBlocksRentalUse: boolean;
};

export function buildVehicleBranchUpdateInput(
  vehicle: ApiMasterVehicle,
  branchId: string,
): VehicleMasterDataInput {
  return {
    name: vehicle.name,
    branchId,
    categoryId: vehicle.category_id,
    licensePlate: vehicle.license_plate,
    transmission: vehicle.transmission,
    seatCapacity: vehicle.seat_capacity,
    dailyRate: vehicle.daily_rate,
    isActive: vehicle.is_active,
    fuelType: vehicle.fuel_type,
    referenceFuelEfficiency: vehicle.reference_fuel_efficiency_km_per_liter,
    imageUrl: vehicle.image_url,
    currentOdometerKm: vehicle.current_odometer_km,
    conditionBlocksRentalUse: vehicle.condition_blocks_rental_use,
  };
}

export async function fetchMasterData<T>(resource: string): Promise<T[]> {
  const response = await fetch(
    `/api/master-data?resource=${encodeURIComponent(resource)}`,
  );
  if (!response.ok) throw new Error("Unable to load master data.");
  return (await response.json()) as T[];
}

export async function saveMasterData<T>(
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("/api/master-data", {
    method: body.id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | T
    | { message?: string }
    | null;
  if (!response.ok)
    throw new Error(
      (payload as { message?: string } | null)?.message ??
        "Unable to save master data.",
    );
  return payload as T;
}
