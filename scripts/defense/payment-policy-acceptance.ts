/** Exercise the real server role; all synthetic rows and optional grants roll back. */
import assert from "node:assert/strict";
import fs from "node:fs";
import postgres from "postgres";

const connection = new URL(
  fs.readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
);
if (!connection.password)
  connection.password = process.env.SUPABASE_DB_PASSWORD ?? "";
const sql = postgres(connection.toString(), {
  ssl: "require",
  max: 1,
  prepare: false,
});
const rollback = new Error("rollback_payment_policy_test");
try {
  await sql.begin(async (tx) => {
    if (process.argv.includes("--with-migration"))
      await tx.unsafe(
        fs.readFileSync(
          "supabase/migrations/20261005040000_payment_policy_proof_write_access.sql",
          "utf8",
        ),
      );
    const [customer] =
      await tx`select id from profiles where email='uat-c01@briah-uat.invalid' and account_status='Active'`;
    const [vehicle] =
      await tx`select id,branch_id from vehicles where is_active limit 1`;
    const [method] =
      await tx`select id from payment_methods where is_active limit 1`;
    const [booking] =
      await tx`insert into booking_requests(customer_id,requested_vehicle_id,pickup_branch_id,return_branch_id,pickup_at,return_at,purpose_of_use,pickup_delivery_option,pickup_location,dropoff_location,booking_status) values(${customer.id},${vehicle.id},${vehicle.branch_id},${vehicle.branch_id},now()+interval '60 days',now()+interval '63 days','SYNTHETIC ROLLBACK POLICY TEST','delivery','Synthetic delivery','Synthetic collection','Submitted') returning id`;
    await tx`insert into renter_requirement_sets(booking_id,customer_id,status) values(${booking.id},${customer.id},'Verified')`;
    await tx`insert into payments(booking_id,customer_id,status,required_amount) values(${booking.id},${customer.id},'Not Submitted',3550)`;
    await tx`set local role service_role`;
    const submit = () =>
      tx`select public.submit_payment_proof_with_policy_atomic(${booking.id},${customer.id},${method.id},3550,'SYNTHETIC-NO-TRANSACTION','rollback-proof.pdf','SYNTHETIC-payment-proof.pdf','application/pdf',2048,'2026-10-05.v1',true) as result`;
    await assert.rejects(
      tx.savepoint(submit),
      /payment_policy_acknowledgement_required/,
    );
    const [acceptance] =
      await tx`select public.acknowledge_booking_payment_policy(${booking.id},${customer.id},'2026-10-05.v1') as stamp`;
    const [{ result }] = await submit();
    assert.equal(result.payment.status, "Pending Verification");
    assert.equal(result.proof.policy_version, "2026-10-05.v1");
    assert.equal(
      new Date(result.proof.policy_acknowledged_at).toISOString(),
      acceptance.stamp.toISOString(),
    );
    assert.equal(result.proof.policy_snapshot.length, 4);
    await assert.rejects(tx.savepoint(submit), /not_submittable/);
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`update payment_proofs set policy_version='changed' where id=${result.proof.id}`,
      ),
      /payment_policy_acknowledgement_immutable/,
    );
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`update payment_proofs set original_filename='changed.pdf' where id=${result.proof.id}`,
      ),
      /permission denied/,
    );
    await tx`reset role`;
    const [privileges] =
      await tx`select has_column_privilege('authenticated','public.payment_proofs','policy_snapshot','UPDATE') as browser_write,has_function_privilege('authenticated','public.submit_payment_proof_with_policy_atomic(uuid,uuid,uuid,numeric,text,text,text,text,bigint,text,boolean)','EXECUTE') as browser_submit`;
    assert.equal(privileges.browser_write, false);
    assert.equal(privileges.browser_submit, false);
    console.log(
      "Passed: server-role submission, required acceptance, exact timestamp/snapshot, duplicate guard, immutable acceptance, limited columns, no browser write/RPC access. All test rows rolled back.",
    );
    throw rollback;
  });
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  await sql.end();
}
