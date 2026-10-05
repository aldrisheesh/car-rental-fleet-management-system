/** Transactional checks: every fixture and schema change can be rolled back. */
import assert from "node:assert/strict";
import postgres from "postgres";
import fs from "node:fs";
const url = new URL(
  fs.readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
);
if (!url.password) url.password = process.env.SUPABASE_DB_PASSWORD ?? "";
const sql = postgres(url.toString(), {
  ssl: "require",
  max: 1,
  prepare: false,
});
const rollback = new Error("rollback_rehearsal");
const migrations = [
  "20261004142607_adviser_booking_categories_and_email.sql",
  "20261004143159_booking_date_change_requests.sql",
  "20261004144142_preserve_handover_on_approved_date_shift.sql",
];
try {
  await sql.begin(async (tx) => {
    if (process.argv.includes("--with-migrations"))
      for (const file of migrations)
        await tx.unsafe(fs.readFileSync(`supabase/migrations/${file}`, "utf8"));
    const [owner] =
      await tx`select id from profiles where user_type='Owner/Admin' and account_status='Active' limit 1`;
    const [customer] =
      await tx`select id from profiles where user_type='Customer/Renter' and account_status='Active' and email like '%.invalid' limit 1`;
    const [v] =
      await tx`insert into vehicles(name,category_id,branch_id,license_plate,is_active,daily_rate) select 'Rollback date change',category_id,branch_id,'QA-DATE-ROLLBACK',true,2000 from vehicles limit 1 returning *`;
    const [b] =
      await tx`insert into booking_requests(customer_id,requested_vehicle_id,pickup_branch_id,return_branch_id,pickup_at,return_at,purpose_of_use,destination,pickup_delivery_option,booking_status) values(${customer.id},${v.id},${v.branch_id},${v.branch_id},now()+interval '60 days',now()+interval '62 days','Family trip','Cavite — Tagaytay','pickup','Submitted') returning *`;
    assert.equal(b.category_codes.purpose, "purpose.family");
    assert.equal(b.category_codes.destination, "destination.cavite");
    await tx`update booking_requests set pickup_meeting_address='QA agreed meeting point',return_meeting_address='QA agreed return point',pickup_meeting_instructions='QA meet the team',return_meeting_instructions='QA return to the team' where id=${b.id}`;
    await tx`insert into booking_payment_quotes(booking_id,vehicle_id,daily_rate,pickup_at,return_at,billable_days,rental_subtotal,delivery_fee,total_amount,down_payment_amount,remaining_balance_amount,issued_by) values(${b.id},${v.id},2000,${b.pickup_at},${b.return_at},2,4000,0,4000,2000,2000,${owner.id})`;
    const [payment] =
      await tx`insert into payments (booking_id,customer_id,status,required_amount,submitted_amount,transaction_reference) values(${b.id},${customer.id},'Verified',2000,2000,'QA-ROLLBACK-NOT-A-TRANSACTION') returning *`;
    const [request] =
      await tx`select * from public.request_booking_date_change(${b.id},${customer.id},now()+interval '65 days','Travel plans changed')`;
    const [unchanged] =
      await tx`select pickup_at from booking_requests where id=${b.id}`;
    assert.equal(unchanged.pickup_at.toISOString(), b.pickup_at.toISOString());
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`select public.request_booking_date_change(${b.id},${owner.id},now()+interval '66 days','Travel plans changed')`,
      ),
      /forbidden/,
    );
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`select public.request_booking_date_change(${b.id},${customer.id},now()+interval '66 days','Travel plans changed')`,
      ),
      /duplicate key/,
    );
    const [conflict] =
      await tx`insert into booking_requests(customer_id,requested_vehicle_id,assigned_vehicle_id,pickup_branch_id,return_branch_id,pickup_at,return_at,purpose_of_use,pickup_delivery_option,booking_status) values(${customer.id},${v.id},${v.id},${v.branch_id},${v.branch_id},${request.requested_pickup_at},${request.requested_return_at},'Family trip','pickup','Confirmed') returning id`;
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`select public.review_booking_date_change(${request.id},${owner.id},'approve','')`,
      ),
      /vehicle_conflict/,
    );
    await tx`update booking_requests set booking_status='Cancelled' where id=${conflict.id}`;
    const [approved] =
      await tx`select * from public.review_booking_date_change(${request.id},${owner.id},'approve','')`;
    const [quote] =
      await tx`select total_amount,down_payment_amount,pickup_at from booking_payment_quotes where booking_id=${b.id}`;
    const [paymentAfter] =
      await tx`select * from payments where id=${payment.id}`;
    assert.deepEqual(paymentAfter, payment);
    assert.equal(Number(quote.total_amount), 4000);
    assert.equal(Number(quote.down_payment_amount), 2000);
    assert.equal(
      quote.pickup_at.toISOString(),
      request.requested_pickup_at.toISOString(),
    );
    assert.equal(Number(approved.quote_before.total_amount), 4000);
    assert.equal(approved.status, "Approved");
    const [after] = await tx`select * from booking_requests where id=${b.id}`;
    assert.equal(after.pickup_meeting_address, "QA agreed meeting point");
    assert.equal(
      after.pickup_at.toISOString(),
      request.requested_pickup_at.toISOString(),
    );
    assert.equal(after.return_at - after.pickup_at, b.return_at - b.pickup_at);
    const emails =
      await tx`select * from email_deliveries e join notifications n on n.id=e.notification_id where n.related_entity_id=${b.id} and e.email_type='date_change_approved'`;
    assert.equal(emails.length, 1);
    const [other] =
      await tx`insert into notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key) values(${customer.id},'booking_confirmed','Rollback scope','Rollback scope','booking',${conflict.id},'rollback-scoped-mail') returning id`;
    const claimed =
      await tx`select * from public.claim_booking_email_deliveries(${b.id},5,now()+interval '1 second')`;
    assert.ok(claimed.length > 0);
    assert.ok(claimed.every((e) => e.notification_id !== other.id));
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`select public.review_booking_date_change(${request.id},${owner.id},'approve','')`,
      ),
      /request_not_pending/,
    );
    console.log(
      "Passed: stable category persistence, original reservation retained, authorization, duplicate request guard, conflict rollback, approved date shift, unchanged duration and verified payment, email outbox creation, scoped claims, stale review protection.",
    );
    throw rollback;
  });
} catch (e) {
  if (e !== rollback) throw e;
} finally {
  await sql.end();
}
