import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseServerEnv } from "./env.server";

/**
 * Trusted server-side client. This module must only be imported from server
 * handlers or other `*.server.ts` modules; its credential is never public.
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  const { url, serviceRoleKey } = getSupabaseServerEnv();
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
