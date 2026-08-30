export const CUSTOMER_SESSION_KEY = "briahs-customer-session";
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
  return createDefaultProfile(session);
}

/** @deprecated Profile persistence is server-backed; retained for callers during transition. */
export function setCustomerProfile(_profile: CustomerProfile) {}

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
