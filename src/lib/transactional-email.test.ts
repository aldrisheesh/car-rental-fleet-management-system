import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  BrevoEmailProvider,
  readBrevoEmailConfig,
} from "./brevo-email-provider.server.ts";
import {
  EmailProviderError,
  type EmailMessage,
  type EmailProvider,
} from "./email-provider.ts";
import {
  buildTransactionalEmail,
  normalizeAppBaseUrl,
} from "./email-templates.ts";
import {
  EMAIL_ELIGIBLE_NOTIFICATION_TYPES,
  isEmailEligibleNotificationType,
  processEmailDeliveries,
  type ClaimedEmailDelivery,
  type EmailDeliveryStore,
} from "./transactional-email.ts";
import type { NotificationType } from "./notifications.ts";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/20260902024000_transactional_email_delivery.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const domainImplementation = readFileSync(
  fileURLToPath(new URL("./transactional-email.ts", import.meta.url)),
  "utf8",
);
const brevoImplementation = readFileSync(
  fileURLToPath(new URL("./brevo-email-provider.server.ts", import.meta.url)),
  "utf8",
);
const notificationApi = readFileSync(
  fileURLToPath(new URL("../routes/api.notifications.ts", import.meta.url)),
  "utf8",
);
const scheduledProcessor = readFileSync(
  fileURLToPath(new URL("./reminders.server.ts", import.meta.url)),
  "utf8",
);

const ELIGIBLE = [
  "requirements_needs_resubmission",
  "requirements_verified",
  "payment_needs_resubmission",
  "payment_verified",
  "booking_confirmed",
  "upcoming_pickup",
  "upcoming_return",
  "rental_overdue",
] as const;
const EXCLUDED = [
  "new_booking_request",
  "requirements_submitted",
  "payment_proof_submitted",
  "maintenance_attention",
  "low_availability",
] as const;

test("email eligibility is the exact approved customer transactional baseline", () => {
  assert.deepEqual(EMAIL_ELIGIBLE_NOTIFICATION_TYPES, ELIGIBLE);
  for (const type of ELIGIBLE)
    assert.equal(isEmailEligibleNotificationType(type), true);
  for (const type of EXCLUDED)
    assert.equal(
      isEmailEligibleNotificationType(type as NotificationType),
      false,
    );
  for (const type of EXCLUDED)
    assert.doesNotMatch(emailTypeCheckBody(migration), new RegExp(`'${type}'`));
});

test("outbox trigger respects the independent default-enabled email preference", () => {
  assert.match(
    migration,
    /email_notifications_enabled boolean not null default true/,
  );
  assert.match(
    migration,
    /coalesce\(preference\.email_notifications_enabled, true\)/,
  );
  assert.match(migration, /profile\.user_type = 'Customer\/Renter'/);
  assert.match(notificationApi, /action === "updateEmailPreference"/);
  assert.match(
    notificationApi,
    /typeof body\.emailNotificationsEnabled !== "boolean"/,
  );
});

test("outbox is database-idempotent and concurrent claims skip locked rows", () => {
  assert.match(migration, /delivery_key text not null unique/);
  assert.match(migration, /unique \(notification_id\)/);
  assert.match(
    migration,
    /'email:notification:' \|\| new\.id::text \|\| ':recipient:' \|\| new\.recipient_id::text/,
  );
  assert.match(migration, /on conflict \(delivery_key\) do nothing/);
  assert.match(migration, /for update skip locked/);
});

test("notification trigger isolates outbox defects from canonical mutations", () => {
  assert.match(
    migration,
    /begin[\s\S]*insert into public\.email_deliveries[\s\S]*exception when others then\s+null;/,
  );
  assert.doesNotMatch(
    domainImplementation,
    /booking_requests|payments|renter_requirement/,
  );
});

test("successful delivery uses the provider interface and records safe state", async () => {
  const store = new MemoryStore([delivery()]);
  const provider = new RecordingProvider();
  const summary = await processEmailDeliveries({
    store,
    provider,
    now: new Date("2026-09-02T04:00:00.000Z"),
    appBaseUrl: "https://rental.example/app",
  });
  assert.deepEqual(summary, {
    claimedCount: 1,
    sentCount: 1,
    retryScheduledCount: 0,
    failedCount: 0,
    skippedCount: 0,
  });
  assert.equal(provider.messages[0]?.to, "customer@example.com");
  assert.equal(store.state.status, "Sent");
  assert.equal(store.state.providerMessageId, "provider-message-1");
  assert.equal(store.claimed[0]?.attemptCount, 1);
  assert.doesNotMatch(
    domainImplementation,
    /api\.brevo\.com|api-key|messageId/,
  );
});

test("missing provider configuration is terminal for delivery but not a startup error", async () => {
  const store = new MemoryStore([delivery()]);
  const summary = await processEmailDeliveries({
    store,
    provider: null,
    now: new Date("2026-09-02T04:00:00.000Z"),
  });
  assert.equal(summary.failedCount, 1);
  assert.equal(store.state.status, "Failed");
  assert.equal(store.state.errorCode, "ConfigurationError");
  assert.equal(store.state.nextAttemptAt, null);
});

test("canonical missing recipient and opt-out are terminal without provider calls", async () => {
  for (const item of [
    delivery({ recipientEmail: null }),
    delivery({ emailNotificationsEnabled: false }),
  ]) {
    const store = new MemoryStore([item]);
    const provider = new RecordingProvider();
    const summary = await processEmailDeliveries({
      store,
      provider,
      now: new Date("2026-09-02T04:00:00.000Z"),
    });
    assert.equal(summary.skippedCount, 1);
    assert.equal(store.state.status, "Skipped");
    assert.equal(provider.messages.length, 0);
  }
  assert.doesNotMatch(notificationApi, /toEmail|recipientEmail|customerEmail/);
});

test("transient provider failure retries with bounded backoff and later succeeds", async () => {
  const store = new MemoryStore([delivery()]);
  const provider = new RecordingProvider([
    new EmailProviderError("RateLimited", true),
  ]);
  const first = await processEmailDeliveries({
    store,
    provider,
    now: new Date("2026-09-02T04:00:00.000Z"),
  });
  assert.equal(first.retryScheduledCount, 1);
  assert.equal(
    store.state.nextAttemptAt?.toISOString(),
    "2026-09-02T04:01:00.000Z",
  );

  store.requeue(delivery({ attemptCount: 2 }));
  const second = await processEmailDeliveries({
    store,
    provider,
    now: new Date("2026-09-02T04:01:00.000Z"),
  });
  assert.equal(second.sentCount, 1);
  assert.equal(store.state.status, "Sent");
});

test("permanent and exhausted failures do not retry forever", async () => {
  for (const [error, attemptCount] of [
    [new EmailProviderError("RecipientInvalid", false), 1],
    [new EmailProviderError("NetworkError", true), 4],
  ] as const) {
    const store = new MemoryStore([delivery({ attemptCount })]);
    const result = await processEmailDeliveries({
      store,
      provider: new RecordingProvider([error]),
      now: new Date("2026-09-02T04:00:00.000Z"),
    });
    assert.equal(result.failedCount, 1);
    assert.equal(store.state.nextAttemptAt, null);
  }
  assert.match(migration, /attempt_count between 0 and 4/);
});

test("templates escape names, use safe optional links, and avoid prohibited claims", () => {
  for (const emailType of ELIGIBLE) {
    const template = buildTransactionalEmail({
      emailType,
      recipientName: '<Customer & "Friend">',
      scheduledAt: "2026-09-05T02:00:00.000Z",
      appBaseUrl: "https://rental.example/base?untrusted=1#fragment",
    });
    assert.match(template.subject, /\S/);
    assert.match(template.text, /Briah's Car Rental/);
    assert.match(template.html, /&lt;Customer &amp; &quot;Friend&quot;&gt;/);
    assert.doesNotMatch(template.html, /<Customer/);
    assert.doesNotMatch(
      `${template.subject}\n${template.text}\n${template.html}`,
      /payment settled|PHP\s*3,?000|late fee|document contents|payment proof image/i,
    );
  }
  assert.equal(normalizeAppBaseUrl("javascript:alert(1)"), null);
  assert.equal(
    normalizeAppBaseUrl("https://rental.example/base?x=1#y"),
    "https://rental.example/base",
  );
  assert.doesNotMatch(
    buildTransactionalEmail({ emailType: "booking_confirmed" }).html,
    /href=/,
  );
});

test("Brevo adapter is isolated, server-configured, and safely classifies responses", async () => {
  assert.deepEqual(readBrevoEmailConfig({}), {
    configured: false,
    missing: ["BREVO_API_KEY", "BREVO_SENDER_EMAIL"],
  });
  assert.match(
    brevoImplementation,
    /https:\/\/api\.brevo\.com\/v3\/smtp\/email/,
  );
  assert.doesNotMatch(brevoImplementation, /VITE_BREVO/);

  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const provider = new BrevoEmailProvider(
    {
      apiKey: "secret",
      senderEmail: "sender@example.com",
      senderName: "Sender",
    },
    (async (url, init) => {
      requests.push({ url: String(url), init });
      return new Response(JSON.stringify({ messageId: "safe-id" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
  );
  const result = await provider.send({
    to: "recipient@example.com",
    subject: "Subject",
    text: "Text",
    html: "<p>Text</p>",
  });
  assert.equal(result.providerMessageId, "safe-id");
  assert.equal(requests.length, 1);
  assert.equal(
    (requests[0]?.init?.headers as Record<string, string>)["api-key"],
    "secret",
  );

  const limited = new BrevoEmailProvider(
    {
      apiKey: "secret",
      senderEmail: "sender@example.com",
      senderName: "Sender",
    },
    (async () => new Response(null, { status: 429 })) as typeof fetch,
  );
  await assert.rejects(
    limited.send({ to: "x@example.com", subject: "x", text: "x", html: "x" }),
    (error: unknown) =>
      error instanceof EmailProviderError &&
      error.code === "RateLimited" &&
      error.retryable,
  );
});

test("the trusted reminder processor sends only after canonical generation and isolates queue failure", () => {
  const generation = scheduledProcessor.indexOf("await Promise.all");
  const email = scheduledProcessor.indexOf(
    "await processTransactionalEmailQueue",
  );
  assert.ok(generation >= 0 && email > generation);
  assert.match(
    scheduledProcessor,
    /try \{[\s\S]*processTransactionalEmailQueue[\s\S]*\} catch \{[\s\S]*processingFailed: true/,
  );
});

function emailTypeCheckBody(sql: string) {
  return sql.match(/email_type text[\s\S]*?\)\),/)?.[0] ?? "";
}

function delivery(
  overrides: Partial<ClaimedEmailDelivery> = {},
): ClaimedEmailDelivery {
  return {
    id: "delivery-1",
    recipientUserId: "user-1",
    notificationId: "notification-1",
    emailType: "payment_verified",
    attemptCount: 1,
    recipientEmail: "Customer@Example.com",
    recipientName: "Customer",
    emailNotificationsEnabled: true,
    scheduledAt: null,
    ...overrides,
  };
}

class RecordingProvider implements EmailProvider {
  readonly messages: EmailMessage[] = [];
  private readonly failures: Error[];

  constructor(failures: Error[] = []) {
    this.failures = failures;
  }

  async send(message: EmailMessage) {
    this.messages.push(message);
    const failure = this.failures.shift();
    if (failure) throw failure;
    return { providerMessageId: "provider-message-1" };
  }
}

class MemoryStore implements EmailDeliveryStore {
  claimed: ClaimedEmailDelivery[] = [];
  state: {
    status: string;
    providerMessageId: string | null;
    errorCode: string | null;
    nextAttemptAt: Date | null;
  } = {
    status: "Pending",
    providerMessageId: null,
    errorCode: null,
    nextAttemptAt: null,
  };

  private queue: ClaimedEmailDelivery[];

  constructor(queue: ClaimedEmailDelivery[]) {
    this.queue = queue;
  }

  requeue(item: ClaimedEmailDelivery) {
    this.queue = [item];
    this.state.status = "Pending";
  }

  async claim() {
    this.claimed = this.queue;
    this.queue = [];
    return this.claimed;
  }

  async markSent(_id: string, providerMessageId: string | null) {
    this.state = {
      status: "Sent",
      providerMessageId,
      errorCode: null,
      nextAttemptAt: null,
    };
  }

  async markSkipped(
    _id: string,
    code: "RecipientUnavailable" | "PreferenceDisabled",
  ) {
    this.state = {
      status: "Skipped",
      providerMessageId: null,
      errorCode: code,
      nextAttemptAt: null,
    };
  }

  async markFailed(_id: string, code: string, nextAttemptAt: Date | null) {
    this.state = {
      status: "Failed",
      providerMessageId: null,
      errorCode: code,
      nextAttemptAt,
    };
  }
}
