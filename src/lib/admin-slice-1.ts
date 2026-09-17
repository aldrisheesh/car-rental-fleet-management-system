export type AdminSliceRole = "Owner/Admin" | "Operations Staff";

export function canAccessAdminSlice1Path(
  role: AdminSliceRole,
  pathname: string,
) {
  if (role === "Owner/Admin") return pathname.startsWith("/admin");
  return (
    pathname === "/admin" ||
    pathname === "/admin/bookings" ||
    pathname.startsWith("/admin/bookings/") ||
    pathname === "/admin/calendar" ||
    pathname.startsWith("/admin/calendar/") ||
    pathname === "/admin/notifications" ||
    pathname === "/admin/reports" ||
    pathname.startsWith("/admin/reports/")
  );
}

export type BookingActionFacts = {
  role: AdminSliceRole;
  bookingStatus: string;
  assignedVehicle: boolean;
  assignedAt: boolean;
  confirmedAt: boolean;
  requirementsStatus: string;
  paymentStatus: string;
  hasRental: boolean;
  rentalActive: boolean;
  selectedVehicle: boolean;
  selectedVehicleConflict: boolean;
};

export function bookingActionAvailability(facts: BookingActionFacts) {
  if (facts.role !== "Owner/Admin") {
    return { assign: false, confirm: false, release: false, return: false };
  }
  return {
    assign:
      facts.bookingStatus === "Submitted" &&
      facts.selectedVehicle &&
      !facts.selectedVehicleConflict &&
      facts.requirementsStatus === "Verified" &&
      facts.paymentStatus === "Verified",
    confirm:
      facts.bookingStatus === "Submitted" &&
      facts.assignedVehicle &&
      facts.assignedAt &&
      facts.requirementsStatus === "Verified" &&
      facts.paymentStatus === "Verified",
    release:
      facts.bookingStatus === "Confirmed" &&
      facts.assignedVehicle &&
      facts.confirmedAt &&
      !facts.hasRental,
    return: facts.rentalActive,
  };
}

export function dashboardCompositionState(
  baseLoaded: boolean,
  failedSourceCount: number,
) {
  if (!baseLoaded) return "unavailable" as const;
  if (failedSourceCount > 0) return "partial" as const;
  return "complete" as const;
}

export function preserveRequiredAmount(
  value: number | string | null | undefined,
) {
  return value == null || value === "" ? null : value;
}
