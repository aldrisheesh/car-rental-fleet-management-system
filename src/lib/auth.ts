export const APP_ROLES = [
  "Owner/Admin",
  "Operations Staff",
  "Customer/Renter",
] as const;

export type AppRole = (typeof APP_ROLES)[number];
export type AppAccountStatus = "Active";

export type AppPrincipal = {
  userId: string;
  email: string | null;
  fullName: string;
  phoneNumber: string | null;
  role: AppRole;
  accountStatus: string;
};

export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    (APP_ROLES as readonly string[]).includes(value)
  );
}

export function isActivePrincipal(
  principal: AppPrincipal | null,
): principal is AppPrincipal {
  return principal != null && principal.accountStatus === "Active";
}

export function hasRole(
  principal: AppPrincipal | null,
  role: AppRole,
): boolean {
  return isActivePrincipal(principal) && principal.role === role;
}

/** Coarse access map for the existing administrative route tree. */
export function canAccessAdminPath(
  principal: AppPrincipal | null,
  pathname: string,
): boolean {
  if (!isActivePrincipal(principal) || !pathname.startsWith("/admin")) {
    return false;
  }
  if (principal.role === "Owner/Admin") return true;
  if (principal.role !== "Operations Staff") return false;

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
