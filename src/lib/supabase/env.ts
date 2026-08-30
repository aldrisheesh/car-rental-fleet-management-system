export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export class SupabaseEnvError extends Error {
  readonly missing: readonly string[];

  constructor(scope: string, missing: readonly string[]) {
    super(
      `Supabase ${scope} environment is incomplete. Missing: ${missing.join(", ")}`,
    );
    this.name = "SupabaseEnvError";
    this.missing = missing;
  }
}

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

export function parseSupabasePublicEnv(
  values: Record<string, unknown>,
): SupabasePublicEnv {
  const missing: string[] = [];
  const url = requiredString(values, "VITE_SUPABASE_URL", missing);
  const anonKey = requiredString(values, "VITE_SUPABASE_ANON_KEY", missing);

  if (missing.length > 0) throw new SupabaseEnvError("browser", missing);
  return { url, anonKey };
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return parseSupabasePublicEnv(import.meta.env as Record<string, unknown>);
}
