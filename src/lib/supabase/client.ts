import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

let browserClient: SupabaseClient<Database> | undefined;
const browserAuthStorageKeys = new Set<string>();

const browserAuthStorage = {
  getItem(key: string) {
    browserAuthStorageKeys.add(key);
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    browserAuthStorageKeys.add(key);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // The callback can still surface the failed session handoff.
    }
  },
  removeItem(key: string) {
    browserAuthStorageKeys.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage may be unavailable in privacy-restricted browser contexts.
    }
  },
};

/** Returns the browser-safe Supabase client using only the public anon key. */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const { url, anonKey } = getSupabasePublicEnv();
    browserClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The callback route explicitly exchanges the one-time PKCE code and
        // hands the resulting session to the existing httpOnly-cookie layer.
        detectSessionInUrl: false,
        flowType: "pkce",
        storage: browserAuthStorage,
      },
    });
  }
  return browserClient;
}

/**
 * Removes the temporary PKCE/session state without calling Supabase signOut.
 * The latter would revoke the same refresh token held by the server cookie.
 */
export function clearSupabaseBrowserAuthStorage() {
  for (const key of [...browserAuthStorageKeys]) {
    browserAuthStorage.removeItem(key);
  }
}
