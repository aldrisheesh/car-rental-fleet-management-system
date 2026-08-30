import type { AppPrincipal } from "./auth";

export type AuthProvider = "google" | "facebook" | "apple";
export type CredentialLoginInput = { identifier: string; password: string };
export type CredentialLoginResult = {
  ok: boolean;
  message?: string;
  principal?: AppPrincipal;
};
export type SignupInput = {
  user_type?: string;
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  account_status?: string;
};
export type SignupResult = {
  ok: boolean;
  message?: string;
  principal?: AppPrincipal | null;
  requiresEmailConfirmation?: boolean;
};

export function hasApiCredentialLogin() {
  return true;
}

export function hasApiSignup() {
  return true;
}

export async function signInWithCredentialsApi({
  identifier,
  password,
}: CredentialLoginInput) {
  try {
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: identifier, password }),
    });
    const payload = (await response.json().catch(() => null)) as {
      principal?: AppPrincipal;
      message?: string;
    } | null;
    if (!response.ok)
      return {
        ok: false,
        message: payload?.message ?? "Invalid email or password.",
      };
    return { ok: true, principal: payload?.principal };
  } catch {
    return {
      ok: false,
      message: "Authentication service is unavailable. Please try again.",
    };
  }
}

export async function signUpWithCredentialsApi({
  full_name,
  email,
  phone_number,
  password,
}: SignupInput) {
  try {
    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        fullName: full_name,
        email,
        phoneNumber: phone_number,
        password,
      }),
    });
    const payload = (await response.json().catch(() => null)) as {
      principal?: AppPrincipal | null;
      requiresEmailConfirmation?: boolean;
      message?: string;
    } | null;
    if (!response.ok)
      return {
        ok: false,
        message: payload?.message ?? "Unable to create account.",
      };
    return {
      ok: true,
      principal: payload?.principal,
      requiresEmailConfirmation: payload?.requiresEmailConfirmation,
    };
  } catch {
    return {
      ok: false,
      message: "Authentication service is unavailable. Please try again.",
    };
  }
}

export async function signOutWithCredentialsApi() {
  await fetch("/api/auth/sign-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: "{}",
  }).catch(() => undefined);
}

export function getProviderStartUrl(_provider: AuthProvider) {
  return "/sign-in";
}

export function continueWithProvider(_provider: AuthProvider) {
  // Social/OAuth authentication is intentionally out of scope for VS002.
}
