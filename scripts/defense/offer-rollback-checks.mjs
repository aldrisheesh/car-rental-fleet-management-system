/**
 * From the repository root:
 * DEFENSE_ROLLBACK_TESTS=1 node --env-file=.env.local scripts/defense/offer-rollback-checks.mjs
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
  await sql`select to_regclass('public.booking_resolution_offers') as created`;
let checks = 0;
async function reject(tx, fn, message) {
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
      for (const file of [
        "20261014002416_defense_customer_cancellation_requests.sql",
        "20261014004452_defense_booking_resolution_offers.sql",
      ])
        await tx.unsafe(fs.readFileSync("supabase/migrations/" + file, "utf8"));
    await tx.unsafe(
      fs.readFileSync(
        "supabase/migrations/20261014011257_defense_offer_quote_notification_guard.sql",
        "utf8",
      ),
    );
    const [owner] =
      await tx`select id from public.profiles where user_type='Owner/Admin' and account_status='Active' limit 1`;
    const fixtures =
      await tx`select b.id,b.customer_id,b.pickup_at,b.return_at,b.assigned_vehicle_id,b.requested_vehicle_id,b.pickup_branch_id from public.booking_requests b join public.profiles p on p.id=b.customer_id where b.id::text like 'd1000000-%' and p.email like '%@briah-uat.invalid' and b.booking_status='Confirmed' and exists(select 1 from public.payments where booking_id=b.id and status='Verified') and not exists(select 1 from public.rental_transactions r where r.booking_id=b.id) and not exists(select 1 from public.booking_date_change_requests d where d.booking_id=b.id and d.status='Pending') order by b.id`;
    assert.ok(
      owner && fixtures.length,
      "Controlled synthetic fixture required",
    );
    const booking = fixtures[0];
    const [other] =
      await tx`select id from public.profiles where user_type='Customer/Renter' and account_status='Active' and id<>${booking.customer_id} limit 1`;
    // A same-car date alternative retains category, seats, branch and pricing.
    const proposed = "2027-11-15T03:00:00.000Z";
    const quoteBefore =
      await tx`select daily_rate,billable_days,rental_subtotal,delivery_fee,total_amount,down_payment_amount from public.booking_payment_quotes where booking_id=${booking.id}`;
    const paymentsBefore =
      await tx`select id,status from public.payments where booking_id=${booking.id} order by id`;
    await tx.unsafe("set local role service_role");
    await reject(
      tx,
      async (t) => {
        await t`select * from public.create_booking_resolution_offer(${booking.id},${other.id},${booking.assigned_vehicle_id},${proposed}::timestamptz,'Saved price date alternative')`;
      },
      "forbidden",
    );
    const [offer] =
      await tx`select * from public.create_booking_resolution_offer(${booking.id},${owner.id},${booking.assigned_vehicle_id},${proposed}::timestamptz,'Saved price date alternative')`;
    assert.equal(offer.status, "Pending");
    checks++;
    const [unchanged] =
      await tx`select pickup_at from public.booking_requests where id=${booking.id}`;
    assert.equal(
      unchanged.pickup_at.toISOString(),
      booking.pickup_at.toISOString(),
    );
    checks++;
    await reject(
      tx,
      async (t) => {
        await t`select * from public.respond_booking_resolution_offer(${offer.id},${other.id},'accept')`;
      },
      "forbidden",
    );
    await tx.savepoint(async (t) => {
      await t.unsafe("reset role");
      await t.unsafe("set local role authenticated");
      await t`select set_config('request.jwt.claim.sub',${other.id},true)`;
      assert.equal(
        (
          await t`select id from public.booking_resolution_offers where booking_id=${booking.id}`
        ).length,
        0,
      );
      checks++;
      await t.unsafe("reset role");
      await t.unsafe("select set_config('request.jwt.claim.sub','',true)");
      await t.unsafe("set local role service_role");
    });
    await tx
      .savepoint(async (t) => {
        await t.unsafe("reset role");
        await t`update public.booking_payment_quotes set quote_version=quote_version+1 where booking_id=${booking.id}`;
        await t.unsafe("set local role service_role");
        await reject(
          t,
          async (s) => {
            await s`select * from public.respond_booking_resolution_offer(${offer.id},${booking.customer_id},'accept')`;
          },
          "quote_changed",
        );
        throw new Error("ROLLBACK_CASE");
      })
      .catch((e) => {
        if (e.message !== "ROLLBACK_CASE") throw e;
      });
    await tx
      .savepoint(async (t) => {
        await t.unsafe("reset role");
        await t`update public.vehicles set is_active=false where id=${booking.assigned_vehicle_id}`;
        await t.unsafe("set local role service_role");
        await reject(
          t,
          async (s) => {
            await s`select * from public.respond_booking_resolution_offer(${offer.id},${booking.customer_id},'accept')`;
          },
          "vehicle_unavailable",
        );
        throw new Error("ROLLBACK_CASE");
      })
      .catch((e) => {
        if (e.message !== "ROLLBACK_CASE") throw e;
      });
    await tx.savepoint(async (t) => {
      await t.unsafe("reset role");
      await t.unsafe("set local role authenticated");
      await t`select set_config('request.jwt.claim.sub',${booking.customer_id},true)`;
      assert.equal(
        (
          await t`select id from public.booking_resolution_offers where booking_id=${booking.id}`
        ).length,
        1,
      );
      checks++;
      await reject(
        t,
        async (s) => {
          await s`select * from public.respond_booking_resolution_offer(${offer.id},${booking.customer_id},'accept')`;
        },
        "permission denied for function respond_booking_resolution_offer",
      );
      await t.unsafe("reset role");
      await t.unsafe("select set_config('request.jwt.claim.sub','',true)");
      await t.unsafe("set local role service_role");
    });
    await tx
      .savepoint(async (t) => {
        await t.unsafe("reset role");
        const [competitor] =
          await t`select b.id from public.booking_requests b join public.profiles p on p.id=b.customer_id where b.id::text like 'd1000000-%' and p.email like '%@briah-uat.invalid' and b.id<>${booking.id} and b.booking_status='Confirmed' and not exists(select 1 from public.rental_transactions where booking_id=b.id) limit 1`;
        assert.ok(competitor, "Controlled competitor fixture required");
        await t`update public.booking_requests set assigned_vehicle_id=${booking.assigned_vehicle_id},pickup_at=${offer.proposed_pickup_at},return_at=${offer.proposed_return_at} where id=${competitor.id}`;
        await t.unsafe("set local role service_role");
        await reject(
          t,
          async (s) => {
            await s`select * from public.respond_booking_resolution_offer(${offer.id},${booking.customer_id},'accept')`;
          },
          "vehicle_conflict",
        );
        const [still] =
          await t`select status from public.booking_resolution_offers where id=${offer.id}`;
        assert.equal(still.status, "Pending");
        checks++;
        throw new Error("ROLLBACK_CASE");
      })
      .catch((e) => {
        if (e.message !== "ROLLBACK_CASE") throw e;
      });
    const [accepted] =
      await tx`select * from public.respond_booking_resolution_offer(${offer.id},${booking.customer_id},'accept')`;
    assert.equal(accepted.status, "Accepted");
    checks++;
    const [after] =
      await tx`select booking_status,pickup_at,return_at from public.booking_requests where id=${booking.id}`;
    assert.equal(after.booking_status, "Confirmed");
    assert.equal(after.pickup_at.toISOString(), proposed);
    assert.equal(
      after.return_at - after.pickup_at,
      booking.return_at - booking.pickup_at,
    );
    checks++;
    assert.deepEqual(
      await tx`select daily_rate,billable_days,rental_subtotal,delivery_fee,total_amount,down_payment_amount from public.booking_payment_quotes where booking_id=${booking.id}`,
      quoteBefore,
    );
    checks++;
    assert.deepEqual(
      await tx`select id,status from public.payments where booking_id=${booking.id} order by id`,
      paymentsBefore,
    );
    checks++;
    await reject(
      tx,
      async (t) => {
        await t`select * from public.respond_booking_resolution_offer(${offer.id},${booking.customer_id},'accept')`;
      },
      "offer_not_pending",
    );
    const [second] =
      await tx`select * from public.create_booking_resolution_offer(${booking.id},${owner.id},${booking.assigned_vehicle_id},'2027-12-15T03:00:00Z'::timestamptz,'Another saved price date option')`;
    const [declined] =
      await tx`select * from public.respond_booking_resolution_offer(${second.id},${booking.customer_id},'decline')`;
    assert.equal(declined.status, "Declined");
    checks++;
    const [afterDecline] =
      await tx`select pickup_at from public.booking_requests where id=${booking.id}`;
    assert.equal(afterDecline.pickup_at.toISOString(), proposed);
    checks++;
    const [third] =
      await tx`select * from public.create_booking_resolution_offer(${booking.id},${owner.id},${booking.assigned_vehicle_id},'2027-12-15T03:00:00Z'::timestamptz,'Another saved price date option')`;
    const [withdrawn] =
      await tx`select * from public.respond_booking_resolution_offer(${third.id},${owner.id},'withdraw')`;
    assert.equal(withdrawn.status, "Withdrawn");
    checks++;
    const [afterWithdraw] =
      await tx`select pickup_at from public.booking_requests where id=${booking.id}`;
    assert.equal(afterWithdraw.pickup_at.toISOString(), proposed);
    checks++;
    await tx.unsafe("reset role");
    await tx`update public.booking_requests set booking_status='Submitted',confirmed_at=null,confirmed_by=null where id=${booking.id}`;
    await tx.unsafe("set local role service_role");
    const [paidOffer] =
      await tx`select * from public.create_booking_resolution_offer(${booking.id},${owner.id},${booking.assigned_vehicle_id},'2028-01-15T03:00:00Z'::timestamptz,'Paid request resolution at the original price')`;
    const [paidAccepted] =
      await tx`select * from public.respond_booking_resolution_offer(${paidOffer.id},${booking.customer_id},'accept')`;
    assert.equal(paidAccepted.status, "Accepted");
    checks++;
    const [paidBooking] =
      await tx`select booking_status,confirmation_exception_code from public.booking_requests where id=${booking.id}`;
    assert.equal(paidBooking.booking_status, "Confirmed");
    assert.equal(paidBooking.confirmation_exception_code, null);
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
    await sql`select to_regclass('public.booking_resolution_offers') as created`;
  assert.equal(r.created, before.created);
  await sql.end();
}
if (!process.exitCode)
  console.log(
    `Passed ${checks} alternative offer checks; all changes rolled back.`,
  );
