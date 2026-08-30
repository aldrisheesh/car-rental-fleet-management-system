import type { AppPrincipal } from "./auth";

const VIEW_COOKIE = "briahs-auth-view";

export function getClientPrincipal(): AppPrincipal | null {
  if (typeof document === "undefined") return null;
  const encoded = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VIEW_COOKIE}=`))
    ?.slice(VIEW_COOKIE.length + 1);
  if (!encoded) return null;
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const principal = JSON.parse(
      atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")),
    ) as AppPrincipal;
    return principal.userId && principal.email !== undefined && principal.role
      ? principal
      : null;
  } catch {
    return null;
  }
}

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; status: number };

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
    const payload = (await response.json().catch(() => null)) as
      | T
      | { message?: string }
      | null;
    if (!response.ok) {
      return {
        ok: false,
        message:
          (payload as { message?: string } | null)?.message ??
          "Unable to complete the request.",
        status: response.status,
      };
    }
    return { ok: true, data: payload as T };
  } catch {
    return {
      ok: false,
      message: "Authentication service is unavailable. Please try again.",
      status: 0,
    };
  }
}

export function signIn(input: { email: string; password: string }) {
  return request<{ principal: AppPrincipal }>("/api/auth/sign-in", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function signUp(input: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}) {
  return request<{
    principal: AppPrincipal | null;
    requiresEmailConfirmation: boolean;
  }>("/api/auth/sign-up", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function signOut() {
  return request<Record<string, never>>("/api/auth/sign-out", {
    method: "POST",
    body: "{}",
  });
}

export const signOutWithCredentialsApi = signOut;

export function getSession() {
  return request<{ principal: AppPrincipal }>("/api/auth/session");
}

export function updateOwnProfile(input: {
  fullName: string;
  phoneNumber: string;
}) {
  return request<{ principal: AppPrincipal }>("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
