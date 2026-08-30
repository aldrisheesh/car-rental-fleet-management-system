import assert from "node:assert/strict";
import test from "node:test";

import { SupabaseEnvError, parseSupabasePublicEnv } from "./env.ts";
import { parseSupabaseServerEnv } from "./env.server.ts";

test("public Supabase configuration requires both browser-safe values", () => {
  assert.deepEqual(
    parseSupabasePublicEnv({
      VITE_SUPABASE_URL: " https://example.supabase.co ",
      VITE_SUPABASE_ANON_KEY: "anon-key",
    }),
    { url: "https://example.supabase.co", anonKey: "anon-key" },
  );
});

test("server Supabase configuration rejects missing privileged credentials", () => {
  assert.throws(
    () =>
      parseSupabaseServerEnv({ SUPABASE_URL: "https://example.supabase.co" }),
    (error: unknown) =>
      error instanceof SupabaseEnvError &&
      error.missing.length === 1 &&
      error.missing[0] === "SUPABASE_SERVICE_ROLE_KEY",
  );
});
