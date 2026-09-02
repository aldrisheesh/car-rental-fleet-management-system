import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  isUnread,
  notificationRoute,
  projectNotification,
} from "./notifications.ts";

const migrationPath = fileURLToPath(
  new URL(
    "../../supabase/migrations/20260902000000_canonical_in_app_notifications.sql",
    import.meta.url,
  ),
);
const apiPath = fileURLToPath(
  new URL("../routes/api.notifications.ts", import.meta.url),
);
const migration = readFileSync(migrationPath, "utf8");
const api = readFileSync(apiPath, "utf8");

const operationalMigration = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/20260902023000_operational_notifications.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

test("notification projection exposes only UI-safe fields", () => {
  const providerRow = {
    id: "notification-1",
    recipient_id: "private-recipient",
    notification_type: "payment_verified",
    title: "Payment verified",
    message: "Your payment was verified.",
    related_entity_type: "payment",
    related_entity_id: "payment-1",
    event_key: "private-event-key",
    created_at: "2026-09-02T01:00:00.000Z",
    read_at: null,
    storage_path: "private/path",
  };
  const projected = projectNotification(providerRow);

  assert.equal(isUnread(projected), true);
  assert.equal("recipientId" in projected, false);
  assert.equal("eventKey" in projected, false);
  assert.equal("storagePath" in projected, false);
});

test("persistence enforces recipient event uniqueness, own-read RLS, and immutable content", () => {
  assert.match(migration, /unique \(recipient_id, event_key\)/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /using \(recipient_id = auth\.uid\(\)\)/);
  assert.match(
    migration,
    /revoke all on public\.notifications from anon, authenticated/,
  );
  assert.doesNotMatch(
    migration,
    /grant (insert|update|delete).*notifications to authenticated/i,
  );
  assert.match(migration, /notification_content_immutable/);
});

test("VS019 event matrix is wired only to canonical transitions", () => {
  for (const notificationType of [
    "requirements_needs_resubmission",
    "requirements_verified",
    "payment_needs_resubmission",
    "payment_verified",
    "booking_confirmed",
    "new_booking_request",
    "requirements_submitted",
    "payment_proof_submitted",
  ]) {
    assert.match(migration, new RegExp(`'${notificationType}'`));
  }
  assert.doesNotMatch(migration, /booking_(rejected|cancelled)/);
  assert.match(migration, /profile\.user_type = 'Owner\/Admin'/);
  assert.match(migration, /profile\.account_status = 'Active'/);
});

test("retry deduplication and later submission cycles use stable persisted identities", () => {
  assert.match(migration, /booking-created:' \|\| new\.id/);
  assert.match(migration, /requirements-review:' \|\| new\.id/);
  assert.match(migration, /payment-proof-submitted:' \|\| v_proof_id/);
  assert.match(
    migration,
    /on conflict \(recipient_id, event_key\) do nothing/g,
  );
  assert.match(
    migration,
    /old\.status in \('Not Submitted', 'Needs Resubmission'\)/,
  );
});

test("transition notifications are transaction-local and payment proof submission is atomic", () => {
  assert.match(migration, /after insert on public\.booking_requests/);
  assert.match(migration, /after insert on public\.renter_requirement_reviews/);
  assert.match(migration, /after update on public\.renter_requirement_sets/);
  assert.match(migration, /after update on public\.payments/);
  assert.match(
    migration,
    /create function public\.submit_payment_proof_atomic/,
  );
});

test("notification API scopes every read/update to the principal and returns newest first", () => {
  const recipientFilters =
    api.match(/\.eq\("recipient_id", principal\.userId\)/g) ?? [];
  assert.ok(recipientFilters.length >= 4);
  assert.match(api, /\.order\("created_at", \{ ascending: false \}\)/);
  assert.match(api, /\.is\("read_at", null\)/);
  assert.doesNotMatch(api, /\.insert\(/);
  assert.doesNotMatch(api, /\.delete\(/);
});

test("operational types project and route without changing existing destinations", () => {
  const base = {
    id: "notification-operational",
    title: "Operational attention",
    message: "Review current operations.",
    created_at: "2026-09-02T01:00:00.000Z",
    read_at: null,
  };
  const maintenance = projectNotification({
    ...base,
    notification_type: "maintenance_attention",
    related_entity_type: "vehicle",
    related_entity_id: "vehicle-1",
  });
  const availability = projectNotification({
    ...base,
    notification_type: "low_availability",
    related_entity_type: "branch",
    related_entity_id: "branch-1",
  });
  assert.equal(maintenance.notificationType, "maintenance_attention");
  assert.equal(availability.notificationType, "low_availability");
  assert.equal(notificationRoute(maintenance, "admin"), "/admin/maintenance");
  assert.equal(notificationRoute(availability, "admin"), "/admin");

  const payment = projectNotification({
    ...base,
    notification_type: "payment_verified",
    related_entity_type: "payment",
    related_entity_id: "payment-1",
  });
  const booking = projectNotification({
    ...base,
    notification_type: "booking_confirmed",
    related_entity_type: "booking",
    related_entity_id: "booking-1",
  });
  assert.equal(notificationRoute(payment, "admin"), "/admin/payments");
  assert.equal(notificationRoute(booking, "admin"), "/admin/bookings");
  assert.equal(notificationRoute(payment, "customer"), "/payment-details");
  assert.equal(notificationRoute(booking, "customer"), "/customer");
  assert.match(operationalMigration, /'maintenance_attention'/);
  assert.match(operationalMigration, /'low_availability'/);
});

test("VS019 contains no external delivery, scheduler, or audit implementation", () => {
  const implementation = `${migration}\n${api}`;
  assert.doesNotMatch(implementation, /brevo|smtp|sendgrid|twilio/i);
  assert.doesNotMatch(implementation, /cron|scheduler|audit_log/i);
});
