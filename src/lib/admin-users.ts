import { isAppRole, type AppRole } from "./auth.ts";

export const ADMIN_USER_PROFILE_COLUMNS =
  "id, email, full_name, phone_number, street_address, barangay, city_municipality, province, postal_code, user_type, account_status, created_at";

export type CanonicalAdminProfile = {
  id: string;
  email: string | null;
  full_name: string;
  phone_number: string | null;
  street_address: string | null;
  barangay: string | null;
  city_municipality: string | null;
  province: string | null;
  postal_code: string | null;
  user_type: string;
  account_status: string;
  created_at: string;
};

export type AdminUserAccount = {
  id: string;
  email: string | null;
  fullName: string;
  phoneNumber: string | null;
  streetAddress: string | null;
  barangay: string | null;
  cityMunicipality: string | null;
  province: string | null;
  postalCode: string | null;
  role: AppRole;
  accountStatus: string;
  createdAt: string;
};

export type AdminUsersResponse = {
  accounts: AdminUserAccount[];
};

export type AdminUserRoleResponse = {
  account: AdminUserAccount;
};

export function parseAdminUserRole(value: unknown): AppRole | null {
  return isAppRole(value) ? value : null;
}

export function canManageApplicationUsers(role: unknown) {
  return role === "Owner/Admin";
}

export function toAdminUserAccount(
  profile: CanonicalAdminProfile,
): AdminUserAccount | null {
  const role = parseAdminUserRole(profile.user_type);
  if (!role) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phoneNumber: profile.phone_number,
    streetAddress: profile.street_address,
    barangay: profile.barangay,
    cityMunicipality: profile.city_municipality,
    province: profile.province,
    postalCode: profile.postal_code,
    role,
    accountStatus: profile.account_status,
    createdAt: profile.created_at,
  };
}
