import { createClient } from "@supabase/supabase-js";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

import { hasRole, isAppRole, type AppPrincipal, type AppRole } from "./auth";
import type { Database } from "./supabase/database.types";
import { getSupabasePublicEnv } from "./supabase/env";

const ACCESS_COOKIE = "briahs-auth-access";
const REFRESH_COOKIE = "briahs-auth-refresh";
const VIEW_COOKIE = "briahs-auth-view";

function getAuthClient(accessToken?: string) {
  const { url, anonKey } = getSupabasePublicEnv();
  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    ...(accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : {}),
  });
}

function isSecureCookie() {
  return (
    typeof process !== "undefined" && process.env.NODE_ENV === "production"
  );
}

function encodePrincipal(principal: AppPrincipal) {
  return Buffer.from(JSON.stringify(principal)).toString("base64url");
}

export function setAuthSession(
  session: { access_token: string; refresh_token: string },
  principal: AppPrincipal,
) {
  const shared = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureCookie(),
    path: "/",
  };
  setCookie(ACCESS_COOKIE, session.access_token, {
    ...shared,
    maxAge: 60 * 60,
  });
  setCookie(REFRESH_COOKIE, session.refresh_token, {
    ...shared,
    maxAge: 60 * 60 * 24 * 14,
  });
  setCookie(VIEW_COOKIE, encodePrincipal(principal), {
    httpOnly: false,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export function clearAuthSession() {
  const options = {
    path: "/",
    sameSite: "lax" as const,
    secure: isSecureCookie(),
  };
  deleteCookie(ACCESS_COOKIE, options);
  deleteCookie(REFRESH_COOKIE, options);
  deleteCookie(VIEW_COOKIE, options);
}

export async function resolvePrincipalForAccessToken(
  accessToken: string,
): Promise<AppPrincipal | null> {
  const client = getAuthClient(accessToken);
  const { data: userData, error: userError } =
    await client.auth.getUser(accessToken);
  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, email, full_name, phone_number, user_type, account_status")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile || !isAppRole(profile.user_type)) return null;

  return {
    userId: profile.id,
    email: profile.email ?? userData.user.email ?? null,
    fullName: profile.full_name,
    phoneNumber: profile.phone_number,
    role: profile.user_type,
    accountStatus: profile.account_status,
  };
}

export async function getCurrentPrincipal(): Promise<AppPrincipal | null> {
  const accessToken = getCookie(ACCESS_COOKIE);
  if (accessToken) {
    const principal = await resolvePrincipalForAccessToken(accessToken);
    if (principal) return principal;
  }

  const refreshToken = getCookie(REFRESH_COOKIE);
  if (!refreshToken) return null;

  const client = getAuthClient();
  const { data, error } = await client.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session) {
    clearAuthSession();
    return null;
  }

  const principal = await resolvePrincipalForAccessToken(
    data.session.access_token,
  );
  if (!principal) {
    clearAuthSession();
    return null;
  }

  setAuthSession(data.session, principal);
  return principal;
}

export async function requirePrincipal(): Promise<AppPrincipal> {
  const principal = await getCurrentPrincipal();
  if (!principal || principal.accountStatus !== "Active") {
    throw new AuthBoundaryError("unauthenticated");
  }
  return principal;
}

export async function requireRole(role: AppRole): Promise<AppPrincipal> {
  const principal = await requirePrincipal();
  if (!hasRole(principal, role)) throw new AuthBoundaryError("forbidden");
  return principal;
}

export class AuthBoundaryError extends Error {
  constructor(readonly reason: "unauthenticated" | "forbidden") {
    super(reason);
    this.name = "AuthBoundaryError";
  }
}

export function getServerAuthClient(accessToken?: string) {
  return getAuthClient(accessToken);
}
