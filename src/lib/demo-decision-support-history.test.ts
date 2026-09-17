import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("decision-support fixture is controlled, varied, and safe to rerun", async () => {
  const migration = await readFile(
    new URL(
      "../../supabase/migrations/20260917071523_seed_realistic_decision_support_history.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /Demo decision-support fixture/);
  assert.match(migration, /generate_series\(1, 26\)/);
  assert.match(migration, /peak_every_weeks/);
  assert.match(migration, /rental_transactions/);
  assert.match(migration, /vehicle_operational_state_events/);
  assert.match(migration, /where not exists \(/);
  assert.doesNotMatch(migration, /\bdelete\s+from\b/i);
  assert.doesNotMatch(migration, /\btruncate\b/i);
});
