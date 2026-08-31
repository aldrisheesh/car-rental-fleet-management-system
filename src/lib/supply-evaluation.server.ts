export type SupplyVehicle = {
  id: string;
  branch_id: string;
  category_id: string;
  is_active: boolean;
  readiness?: { maintenanceReady: boolean; reasons: string[] };
  futureMaintenanceConflict?: boolean;
  bookingConflict?: boolean;
  rentalConflict?: boolean;
};

export type SupplyVehicleResult = {
  vehicle_id: string;
  eligible: boolean;
  booking_conflict: boolean;
  rental_conflict: boolean;
  future_maintenance_conflict: boolean;
  exclusion_reasons: string[];
};

/** Converts a canonical Manila calendar date boundary to its UTC instant. */
export function manilaDateBoundaryToInstant(date: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const [, year, month, day] = match;
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (calendar.toISOString().slice(0, 10) !== date) return null;
  const instant = new Date(calendar.getTime() - 8 * 60 * 60 * 1000);
  return instant.toISOString();
}

export function overlaps(start: string, end: string, weekStart: string, weekEnd: string) {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  const weekStartMs = Date.parse(weekStart);
  const weekEndMs = Date.parse(weekEnd);
  if (![startMs, endMs, weekStartMs, weekEndMs].every(Number.isFinite) || endMs <= startMs || weekEndMs <= weekStartMs) return false;
  return startMs < weekEndMs && endMs > weekStartMs;
}

export function evaluateSupplyVehicles(vehicles: SupplyVehicle[]) {
  const items: SupplyVehicleResult[] = vehicles.map((v) => {
    const reasons: string[] = [];
    if (!v.is_active) reasons.push("VehicleInactive");
    if (!v.readiness) reasons.push("ReadinessUnavailable");
    else if (!v.readiness.maintenanceReady) reasons.push("MaintenanceNotReady");
    if (v.futureMaintenanceConflict) reasons.push("MaintenanceDueDuringTargetWeek");
    if (v.bookingConflict) reasons.push("ConfirmedBookingConflict");
    if (v.rentalConflict) reasons.push("ActiveRental");
    const unique = [...new Set(reasons)];
    return { vehicle_id: v.id, eligible: unique.length === 0, booking_conflict: !!v.bookingConflict, rental_conflict: !!v.rentalConflict, future_maintenance_conflict: !!v.futureMaintenanceConflict, exclusion_reasons: unique };
  });
  return { items, projectedSupply: items.filter((x) => x.eligible).length };
}

export function calculateBalance(requiredUnits: number, projectedSupply: number) {
  const shortageUnits = Math.max(0, requiredUnits - projectedSupply);
  const surplusUnits = Math.max(0, projectedSupply - requiredUnits);
  return { shortageUnits, surplusUnits, balanceState: shortageUnits ? "Shortage" : surplusUnits ? "Surplus" : "Balanced" } as const;
}
