import { SupabaseEnvError } from "./env.ts";

export type SupabaseServerEnv = {
  url: string;
  serviceRoleKey: string;
};

function requiredString(
  values: Record<string, unknown>,
  key: string,
  missing: string[],
) {
  const value = values[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    missing.push(key);
    return "";
  }
  return value.trim();
}

export function parseSupabaseServerEnv(
  values: Record<string, unknown>,
): SupabaseServerEnv {
  const missing: string[] = [];
  const url = requiredString(values, "SUPABASE_URL", missing);
  const serviceRoleKey = requiredString(
    values,
    "SUPABASE_SERVICE_ROLE_KEY",
    missing,
  );

  if (missing.length > 0) throw new SupabaseEnvError("server", missing);
  return { url, serviceRoleKey };
}

export function getSupabaseServerEnv(): SupabaseServerEnv {
  const nodeEnv = typeof process === "undefined" ? {} : process.env;
  return parseSupabaseServerEnv(nodeEnv);
}
