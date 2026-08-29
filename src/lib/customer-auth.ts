export const CUSTOMER_SESSION_KEY = "briahs-customer-session";
export const CUSTOMER_PROFILE_KEY = "briahs-customer-profile";

export type CustomerSession = {
  name: string;
  email: string;
  phone?: string;
  streetAddress?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  postalCode?: string;
  user_type: "Customers / Renters";
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
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function setCustomerSession(session: CustomerSession) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
}

export function getCustomerSession(): CustomerSession | null {
  if (!hasBrowserStorage()) return null;

  const rawSession = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as Partial<CustomerSession>;
    if (!session.name || !session.email || session.user_type !== "Customers / Renters") {
      return null;
    }
    return {
      name: session.name,
      email: session.email,
      phone: typeof session.phone === "string" ? session.phone : "",
      streetAddress: typeof session.streetAddress === "string" ? session.streetAddress : "",
      barangay: typeof session.barangay === "string" ? session.barangay : "",
      cityMunicipality:
        typeof session.cityMunicipality === "string" ? session.cityMunicipality : "",
      province: typeof session.province === "string" ? session.province : "",
      postalCode: typeof session.postalCode === "string" ? session.postalCode : "",
      user_type: "Customers / Renters",
      signedInAt: session.signedInAt || new Date().toISOString(),
    };
  } catch {
    window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
    return null;
  }
}

export function clearCustomerSession() {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

export function getCustomerProfile(session: CustomerSession): CustomerProfile {
  if (!hasBrowserStorage()) return createDefaultProfile(session);

  const rawProfile = window.localStorage.getItem(CUSTOMER_PROFILE_KEY);
  if (!rawProfile) return createDefaultProfile(session);

  try {
    const profile = JSON.parse(rawProfile) as Partial<CustomerProfile>;
    if (profile.email && profile.email.toLowerCase() !== session.email.toLowerCase()) {
      return createDefaultProfile(session);
    }

    return {
      name: profile.name || session.name,
      email: profile.email || session.email,
      phone: profile.phone || session.phone || "",
      streetAddress: profile.streetAddress || session.streetAddress || "",
      barangay: profile.barangay || session.barangay || "",
      cityMunicipality: profile.cityMunicipality || session.cityMunicipality || "",
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
