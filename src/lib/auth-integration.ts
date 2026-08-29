export type AuthProvider = "google" | "facebook" | "apple";

export type CredentialLoginInput = {
  identifier: string;
  password: string;
};

export type CredentialLoginResult = {
  ok: boolean;
  message?: string;
};

export type SignupInput = {
  user_type: string;
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  account_status?: string;
};

export type SignupResult = {
  ok: boolean;
  message?: string;
};

const apiCredentialsEndpoint = import.meta.env.VITE_AUTH_CREDENTIALS_ENDPOINT as string | undefined;
const apiSignupEndpoint = import.meta.env.VITE_AUTH_SIGNUP_ENDPOINT as string | undefined;
const apiOAuthBase = (import.meta.env.VITE_AUTH_OAUTH_BASE as string | undefined) ?? "/api/auth";

export function hasApiCredentialLogin() {
  return Boolean(apiCredentialsEndpoint);
}

export function hasApiSignup() {
  return Boolean(apiSignupEndpoint);
}

export async function signInWithCredentialsApi({
  identifier,
  password,
}: CredentialLoginInput): Promise<CredentialLoginResult> {
  if (!apiCredentialsEndpoint) {
    return { ok: false, message: "API credential endpoint is not configured." };
  }

  const response = await fetch(apiCredentialsEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    let message = "Unable to sign in with credentials.";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = payload.message;
    } catch {
      // Keep generic message when response is not JSON.
    }
    return { ok: false, message };
  }

  return { ok: true };
}

export async function signUpWithCredentialsApi({
  user_type,
  full_name,
  email,
  phone_number,
  password,
  account_status = "Active",
}: SignupInput): Promise<SignupResult> {
  if (!apiSignupEndpoint) {
    return { ok: false, message: "API signup endpoint is not configured." };
  }

  const response = await fetch(apiSignupEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_type,
      full_name,
      email,
      phone_number,
      password,
      account_status,
    }),
  });

  if (!response.ok) {
    let message = "Unable to sign up right now.";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = payload.message;
    } catch {
      // Keep generic message when response is not JSON.
    }
    return { ok: false, message };
  }

  return { ok: true };
}

export function getProviderStartUrl(provider: AuthProvider) {
  return `${apiOAuthBase}/${provider}`;
}

export function continueWithProvider(provider: AuthProvider) {
  if (typeof window === "undefined") return;
  window.location.assign(getProviderStartUrl(provider));
}
