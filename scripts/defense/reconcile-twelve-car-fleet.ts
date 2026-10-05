/** Reconcile the authorized synthetic baseline to twelve active fleet vehicles.
 * Archived fixtures and historical decisions remain intact. Default is rollback. */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import postgres from "postgres";
import { PROJECT } from "./baseline-data.ts";
const url = new URL(
  process.env.DEFENSE_DATABASE_URL ??
    readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
);
assert.ok(
  url.hostname === `db.${PROJECT}.supabase.co` ||
    decodeURIComponent(url.username) === `postgres.${PROJECT}`,
);
url.password ||= process.env.SUPABASE_DB_PASSWORD ?? "";
assert.ok(url.password);
const sql = postgres(url.toString(), {
  ssl: "require",
  max: 1,
  prepare: false,
});
const apply = process.argv.includes("--apply");
const rollback = new Error("verified_rollback");
const originalPlates = [
  "DEV-AVAN-001",
  "DEV-CITY-001",
  "DEV-EVST-001",
  "DEV-HIAC-001",
  "DEV-HILX-001",
  "DEV-INNO-001",
  "DEV-MIRA-001",
  "DEV-RANG-001",
  "DEV-RUSH-001",
  "DEV-URVN-001",
  "DEV-VIOS-001",
  "DEV-WIGO-001",
];
const retiredPlates = [
  "DEV-VIOS-002",
  "DSS-UAT-MPV-01",
  "DSS-UAT-MPV-02",
  "DEMO-DSS-001",
  "DEMO-DSS-002",
  "DEMO-DSS-003",
  "DEMO-DSS-004",
  "DEMO-DSS-005",
];
const reassignIds = [
  "f9efb55c-9a05-4b0b-a0a7-9f4582274d46",
  "74c26194-c231-4e6e-a80a-70366774a88a",
  "63c16bf1-73da-4e39-a65d-dbdcd008ec16",
  "cdef676e-2eaa-4ec4-a086-2df74d099a4b",
  "40e21fff-7d37-44df-aacc-886ee7310731",
  "fc9b8fb7-5b65-462c-a61f-e0ba2673131c",
  "c3e54e78-6066-4a42-aa31-9d49d28d7392",
];
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('synthetic-defense-baseline'))`;
    await tx`lock table vehicles,booking_requests,booking_payment_quotes,maintenance_records in share row exclusive mode`;
    const fleet = await tx`select * from vehicles order by license_plate`;
    assert.equal(fleet.length, 20, "Unexpected fleet drift");
    assert.equal(
      fleet.filter((v) => originalPlates.includes(v.license_plate)).length,
      12,
    );
    const byPlate = (p: string) => {
      const v = fleet.find((v) => v.license_plate === p);
      assert.ok(v);
      return v;
    };
    const city = byPlate("DEV-CITY-001"),
      vios = byPlate("DEV-VIOS-001"),
      mira = byPlate("DEV-MIRA-001"),
      everest = byPlate("DEV-EVST-001");
    const [owner] =
      await tx`select id from profiles where user_type='Owner/Admin' and account_status='Active' order by id limit 1`;
    const [anti] =
      await tx`select id from branches where name='Antipolo, Rizal'`;
    const beforeBookings =
      await tx`select id,booking_status from booking_requests order by id`;
    const beforeCounts =
      await tx`select (select count(*)::int from payments) payments,(select count(*)::int from payment_proofs) proofs,(select count(*)::int from rental_transactions) rentals,(select count(*)::int from booking_date_change_requests) reschedules`;
    assert.equal(beforeBookings.length, 299, "Unexpected booking drift");
    const retiredIds = fleet
      .filter((v) => retiredPlates.includes(v.license_plate))
      .map((v) => v.id);
    const [activeHistory] =
      await tx`select count(*)::int n from rental_transactions where vehicle_id in ${tx(retiredIds)} and started_at is not null and ended_at is null`;
    assert.equal(activeHistory.n, 0);
    for (const plate of retiredPlates)
      await tx`update vehicles set is_active=false where license_plate=${plate} and is_active=true`;
    // Seven seed-only future requests are reassigned to the canonical Vios. Space
    // them a week apart in May/June, preserving duration and agreed quote amounts.
    const updated = [];
    for (const [i, id] of reassignIds.entries()) {
      const [b] = await tx`select * from booking_requests where id=${id}`;
      assert.ok(b && b.booking_status === "Confirmed");
      assert.ok([city.id, vios.id].includes(b.assigned_vehicle_id));
      const [r] =
        await tx`select count(*)::int n from rental_transactions where booking_id=${id}`;
      const [change] =
        await tx`select count(*)::int n from booking_date_change_requests where booking_id=${id}`;
      assert.equal(r.n, 0);
      assert.equal(change.n, 0);
      const date = new Date(Date.UTC(2027, 4, 3 + i * 7));
      const oldStart = new Date(b.pickup_at),
        oldEnd = new Date(b.return_at);
      date.setUTCHours(
        oldStart.getUTCHours(),
        oldStart.getUTCMinutes(),
        oldStart.getUTCSeconds(),
        oldStart.getUTCMilliseconds(),
      );
      const pickup = date.toISOString(),
        returned = new Date(
          date.getTime() + oldEnd.getTime() - oldStart.getTime(),
        ).toISOString();
      const [conflict] =
        await tx`select count(*)::int n from booking_requests where id<>${id} and assigned_vehicle_id=${vios.id} and booking_status='Confirmed' and pickup_at<${returned}::timestamptz and return_at>${pickup}::timestamptz`;
      assert.equal(conflict.n, 0, "Vios scheduling conflict");
      await tx`update booking_requests set assigned_vehicle_id=${vios.id},pickup_at=${pickup},return_at=${returned},substitution_acknowledged=true,assignment_note='SYNTHETIC twelve-car baseline: same-category Vios substitute; agreed quote retained; demo schedule moved to avoid overlap.',assigned_by=${owner.id} where id=${id}`;
      if (b.pickup_delivery_option === "pickup") {
        await tx`update booking_requests set pickup_meeting_address=coalesce(nullif(pickup_meeting_address,''),(select address from branches where id=pickup_branch_id)),return_meeting_address=coalesce(nullif(return_meeting_address,''),(select address from branches where id=return_branch_id)),pickup_meeting_instructions=coalesce(nullif(pickup_meeting_instructions,''),'SYNTHETIC demo: meet the team at the saved address at the scheduled pickup time with license and ID.'),return_meeting_instructions=coalesce(nullif(return_meeting_instructions,''),'SYNTHETIC demo: contact the team before returning to the saved address at the scheduled return time for inspection.') where id=${id}`;
      }
      await tx`update booking_payment_quotes set vehicle_id=${vios.id},pickup_at=${pickup},return_at=${returned} where booking_id=${id}`;
      updated.push({ id, vehicle: "DEV-VIOS-001", pickup, returned });
    }
    // Earlier frontend rehearsal returned this seed rental on Oct 4 although
    // its scheduled dates still pointed at Oct 15. Align the synthetic schedule
    // with that completed rental, preserving the original two-day quote.
    const returnedId = "f41bb865-bf2c-4977-9af1-744b5a951c50";
    const [returnedRental] =
      await tx`select * from rental_transactions where booking_id=${returnedId}`;
    assert.ok(
      returnedRental?.ended_at && returnedRental.vehicle_id === vios.id,
    );
    const returnedPickup = new Date(returnedRental.started_at).toISOString();
    const returnedDropoff = new Date(
      Date.parse(returnedPickup) + 2 * 86400000,
    ).toISOString();
    // Historical fixture repair only: table lock prevents concurrent writes,
    // and this single trigger is restored before transaction commit/rollback.
    await tx`alter table booking_requests disable trigger booking_requests_enforce_one_day_lead_time`;
    await tx`update booking_requests set pickup_at=${returnedPickup},return_at=${returnedDropoff},pickup_meeting_address=coalesce(nullif(pickup_meeting_address,''),(select address from branches where id=pickup_branch_id)),return_meeting_address=coalesce(nullif(return_meeting_address,''),(select address from branches where id=return_branch_id)),pickup_meeting_instructions=coalesce(nullif(pickup_meeting_instructions,''),'SYNTHETIC demo: meet the team at the saved address at the scheduled time.'),return_meeting_instructions=coalesce(nullif(return_meeting_instructions,''),'SYNTHETIC demo: return to the saved address for inspection at the scheduled time.') where id=${returnedId}`;
    await tx`alter table booking_requests enable trigger booking_requests_enforce_one_day_lead_time`;
    await tx`update rental_transactions set scheduled_pickup_at=${returnedPickup},scheduled_return_at=${returnedDropoff} where booking_id=${returnedId}`;
    await tx`update booking_payment_quotes set pickup_at=${returnedPickup},return_at=${returnedDropoff} where booking_id=${returnedId}`;
    // Keep the blocking-maintenance test on an original SUV, freeing the existing
    // Mirage rather than manufacturing new donor cars.
    const marker =
      "SYNTHETIC twelve-car baseline: blocking brake inspection on original Everest.";
    const [already] =
      await tx`select id from maintenance_records where description=${marker}`;
    if (!already) {
      const blocked =
        await tx`select id from maintenance_records where vehicle_id=${mira.id} and status='In Progress' and blocks_rental_use`;
      assert.equal(blocked.length, 1);
      await tx`update maintenance_records set vehicle_id=${everest.id},odometer_at_service=${everest.current_odometer_km},description=${marker},updated_by=${owner.id} where id=${blocked[0].id}`;
    }
    await tx`update vehicles set branch_id=${anti.id} where id=${mira.id} and branch_id<>${anti.id}`;
    // This date limits the donor to the first two weeks, guaranteeing that its
    // one-unit recommendation demonstrates partial coverage of a two-unit gap.
    const serviceId = "e4000000-0000-4000-8000-000000000001";
    await tx`update maintenance_records set status='In Progress',service_started_at=now(),updated_by=${owner.id} where id=${serviceId} and status='Scheduled'`;
    await tx`insert into maintenance_records(id,vehicle_id,maintenance_type,description,status,service_started_at,completed_at,odometer_at_service,next_service_date,blocks_rental_use,created_by,updated_by) values(${serviceId},${mira.id},'Preventive','SYNTHETIC twelve-car baseline: completed inspection; next Mirage service due October 19 limits later-week transfer availability.','Completed',now(),now(),${mira.current_odometer_km},'2026-10-19',false,${owner.id},${owner.id}) on conflict(id) do update set status='Completed',description=excluded.description,service_started_at=excluded.service_started_at,completed_at=excluded.completed_at,odometer_at_service=excluded.odometer_at_service,scheduled_for=null,next_service_date=excluded.next_service_date`;
    const after =
      await tx`select license_plate from vehicles where is_active order by license_plate`;
    assert.deepEqual(
      after.map((v) => v.license_plate),
      [...originalPlates].sort(),
    );
    assert.deepEqual(
      await tx`select id,booking_status from booking_requests order by id`,
      beforeBookings,
    );
    assert.deepEqual(
      await tx`select (select count(*)::int from payments) payments,(select count(*)::int from payment_proofs) proofs,(select count(*)::int from rental_transactions) rentals,(select count(*)::int from booking_date_change_requests) reschedules`,
      beforeCounts,
    );
    const [remaining] =
      await tx`select count(*)::int n from booking_requests b where b.assigned_vehicle_id=${city.id} and b.booking_status='Confirmed' and not exists(select 1 from rental_transactions r where r.booking_id=b.id and r.ended_at is not null)`;
    assert.equal(remaining.n, 0, "City still has unfinished reservation");
    const report = {
      mode: apply ? "applied" : "rollback rehearsal",
      activeFleet: after.map((v) => v.license_plate),
      retiredFixtures: retiredPlates,
      updatedSeedBookings: updated,
      alignedReturnedBooking: returnedId,
      blockingMaintenanceVehicle: "DEV-EVST-001",
      partialDonor: "DEV-MIRA-001",
      fullDonor: "DEV-CITY-001",
      preservedCounts: beforeCounts[0],
      bookingsPreserved: beforeBookings.length,
    };
    mkdirSync("output/fleet-reconciliation-2026-10-05", { recursive: true });
    writeFileSync(
      `output/fleet-reconciliation-2026-10-05/${apply ? "applied" : "rehearsal"}.json`,
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report, null, 2));
    if (!apply) throw rollback;
  });
} catch (e) {
  if (e !== rollback) throw e;
} finally {
  await sql.end();
}
