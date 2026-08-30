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
