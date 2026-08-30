import { customers, users } from "@/data/admin";
import { getClientPrincipal, signOutWithCredentialsApi } from "./auth-client";

const ADMIN_SESSION_KEY = "briahs-admin-session";
const ADMIN_PROFILES_KEY = "briahs-admin-profiles";

export const ADMIN_SESSION_CHANGED_EVENT = "briahs-admin-session-changed";

export type AdminRole =
  | "Owner/Admin"
  | "Operations Staff"
  | "Business Owner"
  | "Staff";

const ROLE_MIGRATIONS: Record<string, AdminRole> = {
  "Administrator / Staff": "Staff",
};

const ADMIN_USERS = [
  {
    userId: "U-01",
    email: "owner@briahs.local",
    password: "owner123",
    name: "Karla Ignacio",
    role: "Business Owner",
  },
  {
    userId: "U-02",
    email: "staff@briahs.local",
    password: "staff123",
    name: "Mike Rivera",
    role: "Staff",
  },
] as const;

type AdminUser = (typeof ADMIN_USERS)[number];

export type AdminSession = {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  signedInAt: string;
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  streetAddress: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  postalCode: string;
};

export type AdminProfilesById = Record<string, AdminProfile>;

function hasBrowserStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function notifyAdminSessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
}

function emptyContactFields() {
  return {
    phone: "",
    streetAddress: "",
    barangay: "",
    cityMunicipality: "",
    province: "",
    postalCode: "",
  };
}

function createSeedProfiles(): AdminProfilesById {
  const credentialsByUserId = new Map(
    ADMIN_USERS.map((user) => [user.userId, user]),
  );
  const customersByEmail = new Map(
    customers.map((customer) => [customer.email, customer]),
  );

  return Object.fromEntries(
    users.map((user) => {
      const credential = credentialsByUserId.get(
        user.id as AdminUser["userId"],
      );
      const customer = customersByEmail.get(user.email);

      return [
        user.id,
        {
          id: user.id,
          name: user.name || credential?.name || "",
          email: user.email || credential?.email || "",
          ...emptyContactFields(),
          phone: customer?.phone ?? "",
        },
      ];
    }),
  );
}

function normalizeProfile(
  profile: Partial<AdminProfile>,
  fallback: AdminProfile,
): AdminProfile {
  return {
    id: String(profile.id || fallback.id),
    name: String(profile.name ?? fallback.name),
    email: String(profile.email ?? fallback.email),
    phone: String(profile.phone ?? fallback.phone),
    streetAddress: String(profile.streetAddress ?? fallback.streetAddress),
    barangay: String(profile.barangay ?? fallback.barangay),
    cityMunicipality: String(
      profile.cityMunicipality ?? fallback.cityMunicipality,
    ),
    province: String(profile.province ?? fallback.province),
    postalCode: String(profile.postalCode ?? fallback.postalCode),
  };
}

export function getAdminProfiles(): AdminProfilesById {
  const seedProfiles = createSeedProfiles();
  if (!hasBrowserStorage()) return seedProfiles;

  const rawProfiles = window.localStorage.getItem(ADMIN_PROFILES_KEY);
  if (!rawProfiles) {
    window.localStorage.setItem(
      ADMIN_PROFILES_KEY,
      JSON.stringify(seedProfiles),
    );
    return seedProfiles;
  }

  try {
    const storedProfiles = JSON.parse(rawProfiles) as Record<
      string,
      Partial<AdminProfile>
    >;
    const mergedProfiles = { ...seedProfiles };

    Object.entries(storedProfiles).forEach(([id, profile]) => {
      const fallback = seedProfiles[id] ?? {
        id,
        name: "",
        email: "",
        ...emptyContactFields(),
      };
      mergedProfiles[id] = normalizeProfile({ ...profile, id }, fallback);
    });

    window.localStorage.setItem(
      ADMIN_PROFILES_KEY,
      JSON.stringify(mergedProfiles),
    );
    return mergedProfiles;
  } catch {
    window.localStorage.setItem(
      ADMIN_PROFILES_KEY,
      JSON.stringify(seedProfiles),
    );
    return seedProfiles;
  }
}

export function getAdminProfile(userId: string): AdminProfile {
  const profiles = getAdminProfiles();
  return (
    profiles[userId] ?? {
      id: userId,
      name: "",
      email: "",
      ...emptyContactFields(),
    }
  );
}

export function setAdminProfile(profile: AdminProfile) {
  if (!hasBrowserStorage()) return profile;

  const profiles = getAdminProfiles();
  const fallback = profiles[profile.id] ?? {
    id: profile.id,
    name: "",
    email: "",
    ...emptyContactFields(),
  };
  const normalizedProfile = normalizeProfile(profile, fallback);
  const nextProfiles = {
    ...profiles,
    [normalizedProfile.id]: normalizedProfile,
  };

  window.localStorage.setItem(ADMIN_PROFILES_KEY, JSON.stringify(nextProfiles));
  return normalizedProfile;
}

export function setAdminSession(session: AdminSession) {
  void session;
}

export function signInAdmin(identifier: string, password: string) {
  void identifier;
  void password;
  return false;
}

export function getAdminSession(): AdminSession | null {
  const principal = getClientPrincipal();
  if (
    !principal ||
    (principal.role !== "Owner/Admin" && principal.role !== "Operations Staff")
  ) {
    return null;
  }
  return {
    userId: principal.userId,
    email: principal.email ?? "",
    name: principal.fullName,
    role: principal.role,
    signedInAt: new Date().toISOString(),
  };
}

export function isAdminSignedIn() {
  return getAdminSession() != null;
}

export function signOutAdmin() {
  void signOutWithCredentialsApi();
  if (hasBrowserStorage()) window.localStorage.removeItem(ADMIN_SESSION_KEY);
  notifyAdminSessionChanged();
}

export function isStaffRole(role: AdminRole | undefined | null) {
  return role === "Staff" || role === "Operations Staff";
}

export function canAccessPayments(role: AdminRole | undefined | null) {
  return role === "Business Owner" || role === "Owner/Admin";
}
