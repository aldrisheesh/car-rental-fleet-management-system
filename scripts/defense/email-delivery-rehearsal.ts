/** Explicit-recipient rehearsal: DB fixture/outbox changes roll back; real emails remain. */
import fs from "node:fs";
import postgres from "postgres";
import {
  BrevoEmailProvider,
  readBrevoEmailConfig,
} from "../../src/lib/brevo-email-provider.server.ts";
import { processEmailDeliveries } from "../../src/lib/transactional-email.ts";
const recipient = process.argv[2];
if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))
  throw Error("An explicitly authorized test recipient is required.");
const config = readBrevoEmailConfig();
if (!config.configured) throw Error("Brevo configuration missing.");
const u = new URL(fs.readFileSync("supabase/.temp/pooler-url", "utf8").trim());
if (!u.password) u.password = process.env.SUPABASE_DB_PASSWORD ?? "";
const sql = postgres(u.toString(), { ssl: "require", max: 1, prepare: false });
const rollback = new Error("controlled_rehearsal_rollback");
const evidence: {
  test: boolean;
  recipient: string;
  startedAt: string;
  messages: { subject: string; providerMessageId: string }[];
  recipientOverrideForControlledTest?: boolean;
  summary?: Awaited<ReturnType<typeof processEmailDeliveries>>;
  outbox?: unknown;
  error?: string;
  databaseFixturesRolledBack?: boolean;
} = {
  test: true,
  recipient,
  startedAt: new Date().toISOString(),
  messages: [],
};
try {
  await sql.begin(async (tx) => {
    const [customer] =
      await tx`select id from profiles where user_type='Customer/Renter' and account_status='Active' and email like '%.invalid' limit 1`;
    if (!customer) throw Error("No synthetic customer available.");
    // Explicit test-only recipient override; no real profile identity is changed.
    evidence.recipientOverrideForControlledTest = true;
    await tx`insert into notification_preferences(recipient_id,email_notifications_enabled) values(${customer.id},true) on conflict(recipient_id) do update set email_notifications_enabled=true`;
    const [b] =
      await tx`insert into booking_requests(customer_id,requested_vehicle_id,pickup_branch_id,return_branch_id,pickup_at,return_at,purpose_of_use,pickup_delivery_option,booking_status) select ${customer.id},id,branch_id,branch_id,now()+interval '80 days',now()+interval '82 days','Family trip','pickup','Submitted' from vehicles limit 1 returning id`;
    for (const type of [
      "requirements_needs_resubmission",
      "quote_issued",
      "booking_confirmed",
    ])
      await tx`insert into notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key) values(${customer.id},${type},'[TEST] Controlled email rehearsal','This is a delivery test, not an actual reservation.','booking',${b.id},${"email-rehearsal:" + b.id + ":" + type})`;
    const provider = new BrevoEmailProvider(config.config);
    const summary = await processEmailDeliveries({
      now: new Date(),
      appBaseUrl: process.env.APP_BASE_URL,
      limit: 5,
      provider: {
        async send(message) {
          const result = await provider.send({
            ...message,
            subject: "[TEST — no actual booking] " + message.subject,
            text:
              "Controlled email delivery rehearsal. No actual reservation or payment is involved.\n\n" +
              message.text,
            html:
              "<p><strong>Controlled email delivery rehearsal. No actual reservation or payment is involved.</strong></p>" +
              message.html,
          });
          evidence.messages.push({
            subject: message.subject,
            providerMessageId: result.providerMessageId,
          });
          return result;
        },
      },
      store: {
        async claim(limit, now) {
          const rows =
            await tx`select * from public.claim_booking_email_deliveries(${b.id},${limit},${now.toISOString()}::timestamptz)`;
          return rows.map((row) => ({
            id: row.id,
            recipientUserId: row.recipient_user_id,
            notificationId: row.notification_id,
            emailType: row.email_type,
            attemptCount: row.attempt_count,
            recipientEmail: recipient,
            recipientName: row.recipient_name,
            emailNotificationsEnabled: row.email_notifications_enabled,
            scheduledAt: row.scheduled_at,
          }));
        },
        async markSent(id, messageId, now) {
          await tx`update email_deliveries set status='Sent',provider_message_id=${messageId},sent_at=${now.toISOString()}::timestamptz where id=${id}`;
        },
        async markSkipped(id, code) {
          await tx`update email_deliveries set status='Skipped',last_error_code=${code} where id=${id}`;
        },
        async markFailed(id, code, next) {
          await tx`update email_deliveries set status='Failed',last_error_code=${code},next_attempt_at=${next?.toISOString() ?? null}::timestamptz where id=${id}`;
        },
      },
    });
    evidence.summary = summary;
    if (summary.sentCount !== 3)
      throw Error(
        "Not all three controlled emails were accepted; see evidence.",
      );
    evidence.outbox =
      await tx`select email_type,status,attempt_count,provider_message_id from email_deliveries e join notifications n on n.id=e.notification_id where n.related_entity_id=${b.id}`;
    throw rollback;
  });
} catch (error) {
  if (error !== rollback) {
    evidence.error =
      error instanceof Error ? error.message : "Rehearsal failed";
    throw error;
  }
} finally {
  await sql.end();
  evidence.databaseFixturesRolledBack = true;
  fs.mkdirSync("output/email-delivery-rehearsal", { recursive: true });
  fs.writeFileSync(
    "output/email-delivery-rehearsal/evidence.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(
    JSON.stringify({
      test: true,
      summary: evidence.summary,
      error: evidence.error,
      fixturesRolledBack: true,
    }),
  );
}
