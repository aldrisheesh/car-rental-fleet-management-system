/**
 * From the repository root:
 * DEFENSE_ROLLBACK_TESTS=1 node --env-file=.env.local scripts/defense/cancellation-rollback-checks.mjs
 * Requires linked-project DB access and the existing, explicitly synthetic UAT
 * fixtures. All mutations occur in a transaction that is always rolled back;
 * this never invokes the external email dispatcher or alters fixture payments.
 */
import fs from "node:fs";
import assert from "node:assert/strict";
import postgres from "postgres";
if (process.env.DEFENSE_ROLLBACK_TESTS !== "1")
  throw new Error(
    "Set DEFENSE_ROLLBACK_TESTS=1 to authorize rolled-back synthetic fixture checks.",
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
const [before] =
  await sql`select to_regclass('public.booking_cancellation_requests') as created`;
let checks = 0;
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
try {
  await sql.begin(async (tx) => {
    await tx.unsafe("set local lock_timeout='3s'");
    if (!before.created)
      await tx.unsafe(
        fs.readFileSync(
          "supabase/migrations/20261014002416_defense_customer_cancellation_requests.sql",
          "utf8",
        ),
      );
    await tx.unsafe(
      fs.readFileSync(
        "supabase/migrations/20261014014511_defense_cancellation_reason_integrity.sql",
        "utf8",
      ),
    );
    const [owner] =
      await tx`select id from public.profiles where user_type='Owner/Admin' and account_status='Active' limit 1`;
    const [booking] =
      await tx`select b.id,b.customer_id,b.booking_status from public.booking_requests b join public.profiles p on p.id=b.customer_id where b.id::text like 'd1000000-%' and p.email like '%@briah-uat.invalid' and b.booking_status='Confirmed' and not exists(select 1 from public.rental_transactions r where r.booking_id=b.id) order by b.id limit 1`;
    assert.ok(
      owner && booking,
      "A controlled synthetic confirmed fixture is required",
    );
    const [other] =
      await tx`select id from public.profiles where user_type='Customer/Renter' and account_status='Active' and id<>${booking.customer_id} limit 1`;
    assert.ok(other);
    const paymentsBefore =
      await tx`select id,status from public.payments where booking_id=${booking.id} order by id`;
    await tx.unsafe("set local role service_role");
    await rejects(
      tx,
      async (t) => {
        await t`select public.request_booking_cancellation_atomic(${booking.id},${other.id},'Customer requested cancellation')`;
      },
      "booking_not_found",
    );
    const [first] =
      await tx`select * from public.request_booking_cancellation_atomic(${booking.id},${booking.customer_id},'Customer requested cancellation')`;
    assert.equal(first.status, "Pending");
    checks++;
    await tx.savepoint(async (t) => {
      await t.unsafe("reset role");
      await rejects(
        t,
        async (s) => {
          await s`insert into public.rental_transactions(booking_id) values(${booking.id})`;
        },
        "pending_cancellation_requires_review",
      );
      await t.unsafe("set local role service_role");
    });
    const [duplicate] =
      await tx`select * from public.request_booking_cancellation_atomic(${booking.id},${booking.customer_id},'Customer requested cancellation')`;
    assert.equal(duplicate.id, first.id);
    checks++;
    const [stillReserved] =
      await tx`select booking_status from public.booking_requests where id=${booking.id}`;
    assert.equal(stillReserved.booking_status, "Confirmed");
    checks++;
    await tx.savepoint(async (t) => {
      await t.unsafe("set local role authenticated");
      await t`select set_config('request.jwt.claim.sub',${other.id},true)`;
      const rows =
        await t`select id from public.booking_cancellation_requests where booking_id=${booking.id}`;
      assert.equal(rows.length, 0);
      checks++;
      await t.unsafe("reset role");
      await t.unsafe("select set_config('request.jwt.claim.sub','',true)");
      await t.unsafe("set local role service_role");
    });
    await tx.savepoint(async (t) => {
      await t.unsafe("set local role authenticated");
      await t`select set_config('request.jwt.claim.sub',${booking.customer_id},true)`;
      const rows =
        await t`select id from public.booking_cancellation_requests where booking_id=${booking.id}`;
      assert.equal(rows.length, 1);
      checks++;
      await t.unsafe("reset role");
      await t.unsafe("select set_config('request.jwt.claim.sub','',true)");
      await t.unsafe("set local role service_role");
    });
    await rejects(
      tx,
      async (t) => {
        await t`select public.review_booking_cancellation_atomic(${first.id},${other.id},'approve','Checked accepted terms')`;
      },
      "forbidden",
    );
    const [declined] =
      await tx`select * from public.review_booking_cancellation_atomic(${first.id},${owner.id},'reject','Original reservation retained after review')`;
    assert.equal(declined.status, "Rejected");
    checks++;
    const [afterDecline] =
      await tx`select booking_status from public.booking_requests where id=${booking.id}`;
    assert.equal(afterDecline.booking_status, "Confirmed");
    checks++;
    const [second] =
      await tx`select * from public.request_booking_cancellation_atomic(${booking.id},${booking.customer_id},'Customer requested cancellation')`;
    const [approved] =
      await tx`select * from public.review_booking_cancellation_atomic(${second.id},${owner.id},'approve','Customer requested cancellation — accepted terms reviewed')`;
    assert.equal(approved.status, "Approved");
    checks++;
    const [cancelled] =
      await tx`select booking_status,resolution_reason,category_codes from public.booking_requests where id=${booking.id}`;
    assert.equal(cancelled.booking_status, "Cancelled");
    checks++;
    assert.equal(cancelled.resolution_reason, second.reason);
    checks++;
    assert.equal(cancelled.category_codes.resolution, second.reason_code);
    checks++;
    assert.equal(
      approved.review_reason,
      "Customer requested cancellation — accepted terms reviewed",
    );
    checks++;
    const paymentsAfter =
      await tx`select id,status from public.payments where booking_id=${booking.id} order by id`;
    assert.deepEqual(paymentsAfter, paymentsBefore);
    checks++;
    await rejects(
      tx,
      async (t) => {
        await t`select public.review_booking_cancellation_atomic(${second.id},${owner.id},'approve','Checked again')`;
      },
      "request_already_reviewed",
    );
    await tx.unsafe("reset role");
    await tx`update public.booking_requests set booking_status='Submitted',confirmed_at=null,confirmed_by=null,resolved_by=null,resolved_at=null,resolution_reason=null where id=${booking.id}`;
    await tx.unsafe("set local role service_role");
    const [paidRequest] =
      await tx`select * from public.request_booking_cancellation_atomic(${booking.id},${booking.customer_id},'Customer requested cancellation')`;
    const [paidDecision] =
      await tx`select * from public.review_booking_cancellation_atomic(${paidRequest.id},${owner.id},'approve','Original payment and accepted terms checked')`;
    const [paidCancelled] =
      await tx`select booking_status,category_codes from public.booking_requests where id=${booking.id}`;
    assert.equal(paidDecision.status, "Approved");
    assert.equal(paidCancelled.booking_status, "Cancelled");
    checks++;
    assert.equal(
      paidCancelled.category_codes.resolution,
      paidRequest.reason_code,
    );
    checks++;
    assert.deepEqual(
      await tx`select id,status from public.payments where booking_id=${booking.id} order by id`,
      paymentsBefore,
    );
    checks++;
    throw new Error("ROLLBACK_ONLY");
  });
} catch (e) {
  if (e.message !== "ROLLBACK_ONLY") {
    console.log("Acceptance failed:", e.code ?? "", e.message);
    process.exitCode = 1;
  }
} finally {
  const [r] =
    await sql`select to_regclass('public.booking_cancellation_requests') as created`;
  assert.equal(r.created, before.created);
  await sql.end();
}
if (!process.exitCode)
  console.log(
    `Passed ${checks} cancellation checks; all test mutations and migration objects rolled back.`,
  );
