/** Live transfer guard checks; every fixture and move is rolled back. */
import postgres from "postgres";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const url = new URL(
  process.env.DEFENSE_DATABASE_URL ??
    readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
);
if (!url.password) url.password = process.env.SUPABASE_DB_PASSWORD ?? "";
if (!url.password) throw new Error("Database credentials unavailable.");
const sql = postgres(url.toString(), {
  ssl: "require",
  max: 1,
  prepare: false,
});
const passed: string[] = [];
const rollback = new Error("rehearsal_rollback");
try {
  await sql.begin(async (tx) => {
    const [actor] =
      await tx`select id from profiles where user_type='Owner/Admin' and account_status='Active' limit 1`;
    const branches =
      await tx`select id from branches where is_active order by id limit 2`;
    assert.equal(branches.length, 2);
    const [vehicle] =
      await tx`insert into vehicles(name,category_id,branch_id,license_plate,is_active,current_odometer_km) select 'QA rollback transfer', category_id, ${branches[0].id}, 'QA-ROLLBACK-TRANSFER', true, 100 from vehicles limit 1 returning id`;
    async function move(id: string, destination: string) {
      return tx`select reconcile_vehicle_location_atomic(${id}::uuid,${actor.id}::uuid,${destination}::uuid,true)`;
    }
    async function blocked(id: string, destination: string, reason: string) {
      await assert.rejects(
        tx.savepoint(() => move(id, destination)),
        (error: unknown) => error instanceof Error && error.message === reason,
      );
      passed.push(reason);
    }
    await move(vehicle.id, branches[1].id);
    const [moved] =
      await tx`select branch_id from vehicles where id=${vehicle.id}`;
    assert.equal(moved.branch_id, branches[1].id);
    passed.push("eligible vehicle moves successfully");
    const [maintenance] =
      await tx`insert into maintenance_records(vehicle_id,maintenance_type,description,status,service_started_at,blocks_rental_use,created_by,updated_by) values (${vehicle.id},'Corrective','Rollback guard rehearsal','In Progress',now(),true,${actor.id},${actor.id}) returning id`;
    await blocked(vehicle.id, branches[0].id, "vehicle_not_ready");
    await tx`update maintenance_records set status='Completed',completed_at=now(),next_service_odometer=50 where id=${maintenance.id}`;
    await blocked(vehicle.id, branches[0].id, "vehicle_not_ready");
    passed.push("overdue preventive target blocks movement");
    const [reserved] =
      await tx`select v.id,v.branch_id from vehicles v join booking_requests b on b.assigned_vehicle_id=v.id where b.booking_status='Confirmed' and not exists(select 1 from rental_transactions r where r.booking_id=b.id and r.ended_at is not null) and v.license_plate='DEV-VIOS-001' limit 1`;
    assert.ok(reserved, "Vios reservation scenario remains present");
    await blocked(
      reserved.id,
      branches.find((b) => b.id !== reserved.branch_id)!.id,
      "vehicle_reserved",
    );
    const [rental] =
      await tx`select v.id,v.branch_id from vehicles v join rental_transactions r on r.vehicle_id=v.id where r.started_at is not null and r.ended_at is null limit 1`;
    assert.ok(rental, "active rental scenario remains present");
    await blocked(
      rental.id,
      branches.find((b) => b.id !== rental.branch_id)!.id,
      "vehicle_on_rental",
    );
    throw rollback;
  });
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  await sql.end();
}
console.log(JSON.stringify({ passed, fixtureChanges: "rolled back" }, null, 2));
