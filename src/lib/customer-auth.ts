export const CUSTOMER_SESSION_KEY = "briahs-customer-session";
export const CUSTOMER_PROFILE_KEY = "briahs-customer-profile";
import { getClientPrincipal, signOutWithCredentialsApi } from "./auth-client";

export type CustomerSession = {
  name: string;
  email: string;
  phone?: string;
  streetAddress?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  postalCode?: string;
  user_type: "Customer/Renter";
  signedInAt: string;
};

export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  streetAddress: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  postalCode: string;
  updatedAt: string;
};

function hasBrowserStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export function setCustomerSession(session: CustomerSession) {
  void session;
}

export function getCustomerSession(): CustomerSession | null {
  const principal = getClientPrincipal();
  if (
    !principal ||
    principal.role !== "Customer/Renter" ||
    principal.accountStatus !== "Active"
  ) {
    return null;
  }
  return {
    name: principal.fullName,
    email: principal.email ?? "",
    phone: principal.phoneNumber ?? "",
    user_type: "Customer/Renter",
    signedInAt: new Date().toISOString(),
  };
}

export function clearCustomerSession() {
  void signOutWithCredentialsApi();
  if (hasBrowserStorage()) window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

export function getCustomerProfile(session: CustomerSession): CustomerProfile {
  if (!hasBrowserStorage()) return createDefaultProfile(session);

  const rawProfile = window.localStorage.getItem(CUSTOMER_PROFILE_KEY);
  if (!rawProfile) return createDefaultProfile(session);

  try {
    const profile = JSON.parse(rawProfile) as Partial<CustomerProfile>;
    if (
      profile.email &&
      profile.email.toLowerCase() !== session.email.toLowerCase()
    ) {
      return createDefaultProfile(session);
    }

    return {
      name: profile.name || session.name,
      email: profile.email || session.email,
      phone: profile.phone || session.phone || "",
      streetAddress: profile.streetAddress || session.streetAddress || "",
      barangay: profile.barangay || session.barangay || "",
      cityMunicipality:
        profile.cityMunicipality || session.cityMunicipality || "",
      province: profile.province || session.province || "",
      postalCode: profile.postalCode || session.postalCode || "",
      updatedAt: profile.updatedAt || "",
    };
  } catch {
    window.localStorage.removeItem(CUSTOMER_PROFILE_KEY);
    return createDefaultProfile(session);
  }
}

export function setCustomerProfile(profile: CustomerProfile) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
}

function createDefaultProfile(session: CustomerSession): CustomerProfile {
  return {
    name: session.name,
    email: session.email,
    phone: session.phone || "",
    streetAddress: session.streetAddress || "",
    barangay: session.barangay || "",
    cityMunicipality: session.cityMunicipality || "",
    province: session.province || "",
    postalCode: session.postalCode || "",
    updatedAt: "",
  };
}
