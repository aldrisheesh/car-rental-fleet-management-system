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

export function overlaps(start: string, end: string, weekStart: string, weekEnd: string) {
  return start < weekEnd && end > weekStart;
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
