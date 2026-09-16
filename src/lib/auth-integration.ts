import type { AppPrincipal } from "./auth";
import { getSupabaseBrowserClient } from "./supabase/client";

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
export type AccountDiscoveryResult =
  | { ok: true; next: "sign-in" | "sign-up" | "unavailable" }
  | { ok: false; message: string };

export function hasApiCredentialLogin() {
  return true;
}

export function hasApiSignup() {
  return true;
}

export async function discoverAccountByEmail(
  email: string,
): Promise<AccountDiscoveryResult> {
  try {
    const response = await fetch("/api/auth/account-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email }),
    });
    const payload = (await response.json().catch(() => null)) as {
      next?: "sign-in" | "sign-up" | "unavailable";
      message?: string;
    } | null;
    if (!response.ok || !payload?.next) {
      return {
        ok: false,
        message:
          payload?.message ??
          "We could not check this email. Please try again.",
      };
    }
    return { ok: true, next: payload.next };
  } catch {
    return {
      ok: false,
      message: "We could not check this email. Please try again.",
    };
  }
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

export function getProviderStartUrl(provider: AuthProvider, next?: string) {
  if (provider !== "google" || typeof window === "undefined") return "/sign-in";

  const callback = new URL("/auth/callback", window.location.origin);
  if (next?.startsWith("/") && !next.startsWith("//")) {
    callback.searchParams.set("next", next);
  }
  return callback.toString();
}

export async function continueWithProvider(
  provider: AuthProvider,
  next?: string,
) {
  if (provider !== "google") {
    return { ok: false, message: "This sign-in provider is not available." };
  }

  const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getProviderStartUrl(provider, next) },
  });

  return error
    ? {
        ok: false,
        message: "Unable to start Google sign-in. Please try again.",
      }
    : { ok: true };
}
