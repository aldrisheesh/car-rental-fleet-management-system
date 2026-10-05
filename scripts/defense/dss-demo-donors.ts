/** Add explicitly synthetic donors; preserve all existing operational records. */
import postgres from "postgres";
import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { PROJECT } from "./baseline-data.ts";
assert.ok(
  !existsSync("output/fleet-reconciliation-2026-10-05/applied.json"),
  "This fixture builder is retired. Use the twelve-car reconciliation and latest baseline capture instead.",
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
const rollback = new Error("verified_rollback");
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('synthetic-defense-baseline'))`;
    const [owner] =
      await tx`select id from profiles where user_type='Owner/Admin' and account_status='Active' order by id limit 1`;
    const [branch] =
      await tx`select id from branches where name='Antipolo, Rizal' and is_active`;
    const [category] =
      await tx`select id from vehicle_categories where name='Economy'`;
    assert.ok(
      owner && branch && category,
      "Canonical demo configuration required",
    );
    for (const [suffix, blocked] of [
      ["001", false],
      ["002", true],
      ["003", false],
      ["004", false],
      ["005", false],
    ] as const) {
      const plate = `DEMO-DSS-${suffix}`;
      const id = `e3000000-0000-4000-8000-000000000${suffix}`;
      const [existing] =
        await tx`select id from vehicles where license_plate=${plate}`;
      if (existing) {
        assert.equal(existing.id, id);
        continue;
      }
      await tx`insert into vehicles(id,name,category_id,branch_id,license_plate,is_active,current_odometer_km,reference_fuel_efficiency_km_per_liter,daily_rate,seat_capacity,transmission,fuel_type,condition_blocks_rental_use)
    values(${id},${blocked ? "Toyota Wigo — SYNTHETIC maintenance example" : "Toyota Wigo — SYNTHETIC transfer donor"},${category.id},${branch.id},${plate},true,100,16,1500,5,'Automatic','Gasoline',false)`;
      // The activation event is normally supplied by the vehicle trigger; avoid duplicate history.
      const [event] =
        await tx`select id from vehicle_operational_state_events where vehicle_id=${id}`;
      if (!event)
        await tx`insert into vehicle_operational_state_events(vehicle_id,is_active,effective_at,recorded_by,source) values(${id},true,now(),${owner.id},'synthetic_defense_fixture')`;
      if (blocked)
        await tx`insert into maintenance_records(vehicle_id,maintenance_type,description,status,service_started_at,blocks_rental_use,created_by,updated_by) values(${id},'Corrective','SYNTHETIC DEFENSE CASE — maintenance excludes this donor from transfer recommendations. Not a real service record.','In Progress',now(),true,${owner.id},${owner.id})`;
    }
    const donors =
      await tx`select v.license_plate,v.branch_id,v.reference_fuel_efficiency_km_per_liter,count(m.id) filter(where m.status='In Progress' and m.blocks_rental_use)::int as blocking_maintenance from vehicles v left join maintenance_records m on m.vehicle_id=v.id where v.license_plate like 'DEMO-DSS-%' group by v.id order by v.license_plate`;
    assert.equal(donors.length, 5);
    assert.equal(donors[0].blocking_maintenance, 0);
    assert.equal(donors[1].blocking_maintenance, 1);
    assert.equal(donors[2].blocking_maintenance, 0);
    assert.equal(donors[3].blocking_maintenance, 0);
    assert.equal(donors[4].blocking_maintenance, 0);
    console.log(
      JSON.stringify(
        { donors, mode: apply ? "apply" : "transactional rehearsal" },
        null,
        2,
      ),
    );
    if (!apply) throw rollback;
  });
} catch (e) {
  if (e !== rollback) throw e;
} finally {
  await sql.end();
}
