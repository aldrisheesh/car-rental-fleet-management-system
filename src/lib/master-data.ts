export type MasterDataResource = "branches" | "categories" | "vehicles";

export function isMasterDataResource(
  value: unknown,
): value is MasterDataResource {
  return value === "branches" || value === "categories" || value === "vehicles";
}

export function cleanOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned || null;
}

export function validateMasterDataInput(
  resource: MasterDataResource,
  input: Record<string, unknown>,
): string | null {
  if (resource === "branches" || resource === "categories") {
    if (typeof input.name !== "string" || !input.name.trim())
      return "Name is required.";
    return null;
  }
  if (typeof input.name !== "string" || !input.name.trim())
    return "Vehicle name is required.";
  if (typeof input.branchId !== "string" || !input.branchId)
    return "A valid branch is required.";
  if (typeof input.categoryId !== "string" || !input.categoryId)
    return "A valid category is required.";
  if (input.licensePlate != null && typeof input.licensePlate !== "string")
    return "License plate is invalid.";
  if (
    input.seatCapacity != null &&
    input.seatCapacity !== "" &&
    (!Number.isInteger(Number(input.seatCapacity)) ||
      Number(input.seatCapacity) <= 0)
  )
    return "Seat capacity must be positive.";
  if (
    input.dailyRate != null &&
    input.dailyRate !== "" &&
    (!Number.isFinite(Number(input.dailyRate)) || Number(input.dailyRate) < 0)
  )
    return "Daily rate must be non-negative.";
  if (
    input.referenceFuelEfficiency != null &&
    input.referenceFuelEfficiency !== "" &&
    (!Number.isFinite(Number(input.referenceFuelEfficiency)) ||
      Number(input.referenceFuelEfficiency) <= 0)
  )
    return "Reference fuel efficiency must be positive.";
  return null;
}
