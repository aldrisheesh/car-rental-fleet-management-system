/** Fill missing reference efficiencies only in the protected synthetic fleet. */
import postgres from "postgres";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { PROJECT } from "./baseline-data.ts";

const fixture = JSON.parse(
  readFileSync(new URL("./fuel-reference-data.json", import.meta.url), "utf8"),
);
const url = new URL(
  process.env.DEFENSE_DATABASE_URL ??
    readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
);
assert.ok(
  url.hostname === `db.${PROJECT}.supabase.co` ||
    decodeURIComponent(url.username) === `postgres.${PROJECT}`,
);
if (!url.password) url.password = process.env.SUPABASE_DB_PASSWORD ?? "";
assert.ok(url.password, "Database credentials required");
const sql = postgres(url.toString(), {
  ssl: "require",
  max: 1,
  prepare: false,
});
const apply = process.argv.includes("--apply");
try {
  const result = await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('synthetic-defense-baseline'))`;
    const plates = Object.keys(fixture.vehicles);
    const before =
      await tx`select id,name,license_plate,is_active,reference_fuel_efficiency_km_per_liter from vehicles where license_plate in ${sql(plates)} order by license_plate for update`;
    assert.equal(before.length, 12);
    assert.ok(before.every((v) => v.is_active));
    const changes = before
      .filter((v) => v.reference_fuel_efficiency_km_per_liter == null)
      .map((v) => ({
        id: v.id,
        plate: v.license_plate,
        kmPerLiter: fixture.vehicles[v.license_plate],
      }));
    assert.ok(
      changes.every((v) => Number.isFinite(v.kmPerLiter) && v.kmPerLiter > 0),
    );
    if (apply && changes.length) {
      mkdirSync("backup-artifacts/defense", { recursive: true });
      writeFileSync(
        `backup-artifacts/defense/before-fuel-reference-${Date.now()}.json`,
        JSON.stringify({ purpose: fixture.purpose, before }, null, 2),
      );
      for (const v of changes) {
        const updated =
          await tx`update vehicles set reference_fuel_efficiency_km_per_liter=${v.kmPerLiter} where id=${v.id} and reference_fuel_efficiency_km_per_liter is null returning id`;
        assert.equal(updated.length, 1);
      }
    }
    const after =
      await tx`select license_plate,reference_fuel_efficiency_km_per_liter from vehicles where license_plate in ${sql(plates)} order by license_plate`;
    if (apply)
      assert.ok(
        after.every(
          (v) => Number(v.reference_fuel_efficiency_km_per_liter) > 0,
        ),
      );
    return {
      mode: apply ? "applied" : "preview",
      purpose: fixture.purpose,
      changes,
      after,
    };
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await sql.end();
}
