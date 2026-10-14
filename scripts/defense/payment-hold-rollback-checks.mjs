/** Approved policy checks on synthetic UAT fixtures; every mutation is rolled back. */
import fs from "node:fs";
import assert from "node:assert/strict";
import postgres from "postgres";
if (process.env.DEFENSE_ROLLBACK_TESTS !== "1")
  throw Error(
    "Set DEFENSE_ROLLBACK_TESTS=1 for rollback-only synthetic tests.",
  );
const url = new URL(
  fs.readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
);
url.password = process.env.SUPABASE_DB_PASSWORD;
const sql = postgres(url.toString(), {
  ssl: "require",
  max: 1,
  onnotice: () => {},
});
let checks = 0;
const migration = "supabase/migrations/20261014025132_payment_hold_policy.sql";
async function rejects(tx, fn, message) {
  let caught = false;
  try {
    await tx.savepoint(fn);
  } catch (e) {
    assert.equal(e.message, message);
    caught = true;
  }
  assert.ok(caught);
  checks++;
}
async function rollbackCase(tx, fn) {
  try {
    await tx.savepoint(async (t) => {
      await fn(t);
      throw Error("ROLLBACK_CASE");
    });
  } catch (e) {
    if (e.message !== "ROLLBACK_CASE") throw e;
  }
}
try {
  await sql.begin(async (tx) => {
    await tx.unsafe("set local lock_timeout='3s'");
    const [installed] =
      await tx`select to_regclass('public.booking_payment_holds') name`;
    if (!installed.name) await tx.unsafe(fs.readFileSync(migration, "utf8"));
    await tx.unsafe(
      fs.readFileSync(
        "supabase/migrations/20261014031608_payment_hold_paid_schedule_guard.sql",
        "utf8",
      ),
    );
    await tx.unsafe(
      "update briah_private.payment_hold_configuration set enabled=true",
    );
    const [owner] =
      await tx`select id from public.profiles where user_type='Owner/Admin' and account_status='Active' limit 1`;
    const fixtures =
      await tx`select b.* from public.booking_requests b join public.profiles p on p.id=b.customer_id where b.id::text like 'd1000000-%' and p.email like '%@briah-uat.invalid' and b.booking_status='Confirmed' and exists(select 1 from public.booking_payment_quotes where booking_id=b.id) and not exists(select 1 from public.rental_transactions where booking_id=b.id) order by b.id limit 2`;
    assert.equal(
      fixtures.length,
      2,
      "Two controlled synthetic fixtures are required",
    );
    const [b, competitor] = fixtures;
    const vehicle = b.requested_vehicle_id;
    // Only controlled UAT rows are prepared. Neither external email delivery nor production accounts are mutated.
    for (const row of fixtures) {
      await tx`update public.booking_requests set booking_status='Submitted',requested_vehicle_id=${vehicle},assigned_vehicle_id=null,assigned_at=null,pickup_at='2027-11-15T03:00Z',return_at='2027-11-18T03:00Z',pickup_meeting_address='Controlled QA pickup',return_meeting_address='Controlled QA return',pickup_meeting_instructions='Controlled QA pickup',return_meeting_instructions='Controlled QA return' where id=${row.id}`;
      await tx`update public.payments set status='Not Submitted',submitted_amount=null,submitted_at=null,reviewed_at=null where booking_id=${row.id}`;
    }
    await tx`update public.booking_requests set pickup_meeting_address='Controlled QA pickup',return_meeting_address='Controlled QA return',pickup_meeting_instructions='Controlled QA pickup',return_meeting_instructions='Controlled QA return' where id in (${b.id},${competitor.id})`;
    const [method] =
      await tx`select id from public.payment_methods where is_active limit 1`;
    assert.ok(method);
    await tx.unsafe("set local role service_role");
    await rejects(
      tx,
      (t) =>
        t`select public.issue_booking_payment_quote_with_hold(${b.id},0,${b.customer_id},null)`,
      "forbidden",
    );
    await rollbackCase(tx, async (t) => {
      await t.unsafe("reset role");
      await t`update public.booking_requests set pickup_at=((clock_timestamp() at time zone 'Asia/Manila')::date+1+time '08:00') at time zone 'Asia/Manila',return_at=((clock_timestamp() at time zone 'Asia/Manila')::date+4+time '08:00') at time zone 'Asia/Manila' where id=${b.id}`;
      await t`update public.booking_requests set pickup_meeting_address='Controlled QA pickup',return_meeting_address='Controlled QA return',pickup_meeting_instructions='Controlled QA pickup',return_meeting_instructions='Controlled QA return' where id=${b.id}`;
      const [urgentVehicle] =
        await t`select v.id from public.vehicles v where v.is_active and not v.condition_blocks_rental_use
        and not exists(select 1 from public.rental_transactions r where r.vehicle_id=v.id and (r.ended_at is null or r.inspection_status='Pending'))
        and not exists(select 1 from public.maintenance_records m where m.vehicle_id=v.id and (m.status in ('In Progress','Overdue') or (m.status='Scheduled' and m.blocks_rental_use) or (m.status='Completed' and (m.next_service_date<=current_date+4 or m.next_service_odometer<=coalesce(v.current_odometer_km,999999999)))))
        and not exists(select 1 from public.booking_requests x where x.id<>${b.id} and x.booking_status='Confirmed' and x.assigned_vehicle_id=v.id and x.pickup_at<(select return_at from public.booking_requests where id=${b.id}) and x.return_at>(select pickup_at from public.booking_requests where id=${b.id})) limit 1`;
      assert.ok(
        urgentVehicle,
        "An available vehicle is required for the controlled urgent quote test",
      );
      await t`update public.booking_requests set requested_vehicle_id=${urgentVehicle.id} where id=${b.id}`;
      await t.unsafe("set local role service_role");
      await rejects(
        t,
        (s) =>
          s`select public.issue_booking_payment_quote_with_hold(${b.id},0,${owner.id},null)`,
        "urgent_payment_deadline_required",
      );
      await rejects(
        t,
        (s) =>
          s`select public.issue_booking_payment_quote_with_hold(${b.id},0,${owner.id},clock_timestamp()+interval '2 days')`,
        "invalid_payment_deadline",
      );
      await t`select public.issue_booking_payment_quote_with_hold(${b.id},0,${owner.id},clock_timestamp()+interval '1 hour')`;
      const [urgent] =
        await t`select deadline_at,opened_at from public.booking_payment_holds where booking_id=${b.id}`;
      assert.ok(
        Math.abs((urgent.deadline_at - urgent.opened_at) / 3600000 - 1) < 0.01,
      );
      checks++;
    });
    await rejects(
      tx,
      (t) =>
        t`select public.issue_booking_payment_quote_with_hold(${b.id},0,${owner.id},clock_timestamp()+interval '30 hours')`,
      "custom_deadline_only_for_urgent_booking",
    );
    const [quote] =
      await tx`select * from public.issue_booking_payment_quote_with_hold(${b.id},0,${owner.id},null)`;
    checks++;
    const [hold] =
      await tx`select * from public.booking_payment_holds where booking_id=${b.id}`;
    assert.equal(hold.state, "AwaitingPayment");
    assert.ok(
      Math.abs((hold.deadline_at - hold.opened_at) / 3600000 - 24) < 0.01,
    );
    checks += 2;
    await rejects(
      tx,
      (t) =>
        t`select public.issue_booking_payment_quote_with_hold(${competitor.id},0,${owner.id},null)`,
      "vehicle_conflict",
    );
    await rejects(
      tx,
      (t) =>
        t`select public.assign_booking_vehicle(${competitor.id},${vehicle},${owner.id})`,
      "vehicle_conflict",
    );
    await rollbackCase(tx, async (t) => {
      await t.unsafe("reset role");
      await rejects(
        t,
        (s) =>
          s`update public.booking_requests set booking_status='Confirmed',assigned_vehicle_id=${vehicle} where id=${competitor.id}`,
        "vehicle_conflict",
      );
      await t.unsafe("set local role service_role");
    });
    await rollbackCase(tx, async (t) => {
      await t.unsafe("reset role");
      await t`update public.booking_payment_holds set opened_at=clock_timestamp()-interval '30 hours',deadline_at=clock_timestamp()-interval '6 hours' where booking_id=${b.id}`;
      await t.unsafe("set local role service_role");
      await rejects(
        t,
        (s) =>
          s`select public.submit_payment_proof_atomic(${b.id},${b.customer_id},${method.id},${quote.down_payment_amount},'ROLLBACK-ONLY','qa/hold-proof.png','hold-proof.png','image/png',100)`,
        "payment_hold_expired",
      );
      await t`select public.process_booking_payment_holds()`;
      const [expired] =
        await t`select state from public.booking_payment_holds where booking_id=${b.id}`;
      assert.equal(expired.state, "Expired");
      checks++;
      const [preserved] =
        await t`select booking_status from public.booking_requests where id=${b.id}`;
      assert.equal(preserved.booking_status, "Submitted");
      checks++;
      await t`select public.issue_booking_payment_quote_with_hold(${competitor.id},0,${owner.id},null)`;
      await rejects(
        t,
        (s) =>
          s`select public.extend_booking_payment_hold(${b.id},${owner.id},clock_timestamp()+interval '30 hours','Renew expired hold')`,
        "vehicle_conflict",
      );
    });
    await rejects(
      tx,
      (t) =>
        t`select public.extend_booking_payment_hold(${b.id},${owner.id},clock_timestamp()+interval '30 hours','')`,
      "reason_required",
    );
    await rejects(
      tx,
      (t) =>
        t`select public.extend_booking_payment_hold(${b.id},${b.customer_id},clock_timestamp()+interval '30 hours','Customer cannot extend')`,
      "forbidden",
    );
    const [extended] =
      await tx`select * from public.extend_booking_payment_hold(${b.id},${owner.id},clock_timestamp()+interval '30 hours','Owner approved extra time')`;
    assert.equal(extended.state, "AwaitingPayment");
    checks++;
    const [unchanged] =
      await tx`select total_amount,down_payment_amount from public.booking_payment_quotes where booking_id=${b.id}`;
    assert.equal(unchanged.total_amount, quote.total_amount);
    assert.equal(unchanged.down_payment_amount, quote.down_payment_amount);
    checks += 2;
    await rollbackCase(tx, async (t) => {
      await t.unsafe("reset role");
      await t`update public.booking_payment_holds set opened_at=clock_timestamp()-interval '23 hours',deadline_at=clock_timestamp()+interval '1 hour' where booking_id=${b.id}`;
      await t.unsafe("set local role service_role");
      await t`select public.process_booking_payment_holds()`;
      await t`select public.process_booking_payment_holds()`;
      const [count] =
        await t`select count(*)::integer n from public.notifications where event_key=${"hold:" + b.id + ":" + extended.generation + ":2h"}`;
      assert.equal(count.n, 1);
      checks++;
      const [email] =
        await t`select count(*)::integer n from public.email_deliveries e join public.notifications n on n.id=e.notification_id where n.event_key=${"hold:" + b.id + ":" + extended.generation + ":2h"}`;
      assert.equal(email.n, 1);
      checks++;
    });
    const [submitted] =
      await tx`select public.submit_payment_proof_atomic(${b.id},${b.customer_id},${method.id},${quote.down_payment_amount},'ROLLBACK-ONLY','qa/hold-proof.png','hold-proof.png','image/png',100) result`;
    checks++;
    await rollbackCase(tx, async (t) => {
      await t`select public.assign_booking_vehicle(${b.id},${vehicle},${owner.id})`;
      const [assigned] =
        await t`select assigned_vehicle_id from public.booking_requests where id=${b.id}`;
      assert.equal(assigned.assigned_vehicle_id, vehicle);
      checks++;
    });
    await rollbackCase(tx, async (t) => {
      await t.unsafe("reset role");
      await t`update public.payments set status='Verified',reviewed_by=${owner.id},reviewed_at=clock_timestamp() where id=${submitted.result.payment.id}`;
      await t`update public.booking_requests set pickup_at='2027-12-15T03:00Z',return_at='2027-12-18T03:00Z' where id=${b.id}`;
      const [moved] =
        await t`select pickup_at,return_at,state from public.booking_payment_holds where booking_id=${b.id}`;
      assert.equal(moved.state, "Verified");
      assert.equal(moved.pickup_at.toISOString(), "2027-12-15T03:00:00.000Z");
      checks += 2;
      await t`update public.booking_requests set pickup_at='2027-12-15T03:00Z',return_at='2027-12-18T03:00Z' where id=${competitor.id}`;
      await t`update public.booking_requests set pickup_meeting_address='Controlled QA pickup',return_meeting_address='Controlled QA return',pickup_meeting_instructions='Controlled QA pickup',return_meeting_instructions='Controlled QA return' where id=${competitor.id}`;
      await t.unsafe("set local role service_role");
      await rejects(
        t,
        (s) =>
          s`select public.issue_booking_payment_quote_with_hold(${competitor.id},0,${owner.id},null)`,
        "vehicle_conflict",
      );
    });
    const [review] =
      await tx`select state from public.booking_payment_holds where booking_id=${b.id}`;
    assert.equal(review.state, "Review");
    checks++;
    await rollbackCase(tx, async (t) => {
      await t.unsafe("reset role");
      await t`update public.booking_payment_holds set opened_at=clock_timestamp()-interval '30 hours',deadline_at=clock_timestamp()-interval '6 hours',review_due_at=clock_timestamp()-interval '1 hour' where booking_id=${b.id}`;
      await t.unsafe("set local role service_role");
      await t`select public.process_booking_payment_holds()`;
      await t`select public.process_booking_payment_holds()`;
      const [protectedHold] =
        await t`select state from public.booking_payment_holds where booking_id=${b.id}`;
      assert.equal(protectedHold.state, "Review");
      checks++;
      const [escalation] =
        await t`select count(*)::integer n from public.notifications where recipient_id=${owner.id} and event_key=${"hold-review-overdue:" + b.id + ":" + extended.generation}`;
      assert.equal(escalation.n, 1);
      checks++;
      await rejects(
        t,
        (s) =>
          s`select public.issue_booking_payment_quote_with_hold(${competitor.id},0,${owner.id},null)`,
        "vehicle_conflict",
      );
    });
    const { payment, proof } = submitted.result;
    await rollbackCase(tx, async (t) => {
      await t`select public.review_payment_atomic(${payment.id},${owner.id},'verify',${proof.version},${quote.down_payment_amount},'ROLLBACK-ONLY',null)`;
      const [confirmed] =
        await t`select booking_status from public.booking_requests where id=${b.id}`;
      assert.equal(confirmed.booking_status, "Confirmed");
      checks++;
      const [complete] =
        await t`select state from public.booking_payment_holds where booking_id=${b.id}`;
      assert.equal(complete.state, "Completed");
      checks++;
    });
    await tx`select public.review_payment_atomic(${payment.id},${owner.id},'resubmit',${proof.version},${quote.down_payment_amount},'ROLLBACK-ONLY','Payment proof is unclear or unreadable')`;
    const [correction] =
      await tx`select * from public.booking_payment_holds where booking_id=${b.id}`;
    assert.equal(correction.state, "Correction");
    assert.equal(correction.correction_count, 1);
    checks += 2;
    const [resub] =
      await tx`select public.submit_payment_proof_atomic(${b.id},${b.customer_id},${method.id},${quote.down_payment_amount},'ROLLBACK-CORRECTION','qa/correction.png','correction.png','image/png',100) result`;
    await tx`select public.review_payment_atomic(${payment.id},${owner.id},'resubmit',${resub.result.proof.version},${quote.down_payment_amount},'ROLLBACK-CORRECTION','Payment proof is unclear or unreadable')`;
    const [repeat] =
      await tx`select state from public.booking_payment_holds where booking_id=${b.id}`;
    assert.equal(repeat.state, "Expired");
    checks++;
    await rejects(
      tx,
      (t) =>
        t`select public.submit_payment_proof_atomic(${b.id},${b.customer_id},${method.id},${quote.down_payment_amount},'REPEATED','qa/repeated.png','repeated.png','image/png',100)`,
      "payment_hold_expired",
    );
    await tx.unsafe("reset role");
    await tx.unsafe("set local role authenticated");
    await rejects(
      tx,
      (t) =>
        t`select public.extend_booking_payment_hold(${b.id},${owner.id},clock_timestamp()+interval '30 hours','Browser bypass')`,
      "permission denied for function extend_booking_payment_hold",
    );
    await rejects(
      tx,
      (t) => t`select * from public.booking_payment_holds`,
      "permission denied for table booking_payment_holds",
    );
    await tx.unsafe("reset role");
    const [business] =
      await tx`select briah_private.hold_business_deadline('2026-10-14T09:00Z',6) due`;
    assert.equal(business.due.toISOString(), "2026-10-15T05:00:00.000Z");
    checks++;
    throw Error("ROLLBACK_ONLY");
  });
} catch (e) {
  if (e.message !== "ROLLBACK_ONLY") throw e;
} finally {
  await sql.end();
}
console.log(JSON.stringify({ checks, rolledBack: true }));
