import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { summarizeAuditEvent } from "./audit.ts";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/20260902020000_canonical_audit_trail.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const privilegeHardening = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/20260902021000_audit_service_role_privilege_hardening.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const auditRoute = readFileSync(
  fileURLToPath(new URL("../routes/api.audit-events.ts", import.meta.url)),
  "utf8",
);

const actions = [
  "booking.created",
  "booking.vehicle_assigned",
  "booking.confirmed",
  "requirements.submitted",
  "requirements.resubmitted",
  "requirements.needs_resubmission",
  "requirements.verified",
  "payment.submitted",
  "payment.resubmitted",
  "payment.needs_resubmission",
  "payment.verified",
  "rental.released",
  "rental.returned",
  "maintenance.created",
  "maintenance.completed",
  "maintenance.cancelled",
] as const;

test("VS021 migration freezes the complete implemented semantic event matrix", () => {
  for (const action of actions)
    assert.match(migration, new RegExp(`'${action.replace(".", "\\.")}'`));
  assert.doesNotMatch(migration, /booking\.(rejected|cancelled)/);
});

test("lifecycle events originate from narrow atomic table boundaries", () => {
  for (const table of [
    "booking_requests",
    "renter_requirement_sets",
    "payments",
    "rental_transactions",
    "maintenance_records",
  ]) {
    assert.match(
      migration,
      new RegExp(`after (?:insert or update|update) on public\\.${table}`),
    );
  }
  assert.match(
    migration,
    /old\.status = 'Not Submitted' and new\.status = 'Pending Review'/,
  );
  assert.match(
    migration,
    /old\.status = 'Needs Resubmission' and new\.status = 'Pending Review'/,
  );
  assert.match(
    migration,
    /old\.status in \('Not Submitted', 'Needs Resubmission'\)/,
  );
  assert.match(
    migration,
    /old\.booking_status = 'Submitted' and new\.booking_status = 'Confirmed'/,
  );
  assert.match(
    migration,
    /old\.ended_at is null and new\.ended_at is not null/,
  );
  assert.match(
    migration,
    /old\.status = 'Open' and new\.status in \('Completed', 'Cancelled'\)/,
  );
});

test("booking creation is audited once per canonical insert without Finder coupling", () => {
  assert.match(migration, /if tg_op = 'INSERT' then[\s\S]*?'booking\.created'/);
  assert.equal((migration.match(/'booking\.created'/g) ?? []).length, 2);
  assert.doesNotMatch(
    migration,
    /booking_finder_context|finder_baseline|recommendation_rank/,
  );
});

test("failed lifecycle transitions cannot leave an audit event", () => {
  assert.doesNotMatch(migration, /before (insert|update).*audit_lifecycle/i);
  assert.match(migration, /after insert or update on public\.booking_requests/);
  assert.match(migration, /after update on public\.payments/);
  assert.match(
    migration,
    /after insert or update on public\.rental_transactions/,
  );
});

test("audit persistence is append-only and inaccessible for arbitrary client writes", () => {
  assert.match(migration, /audit_events_actor_integrity/);
  assert.match(migration, /actor_type = 'User' and actor_user_id is not null/);
  assert.match(migration, /actor_type = 'System' and actor_user_id is null/);
  assert.match(
    migration,
    /revoke all on public\.audit_events from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /revoke insert, update, delete on public\.audit_events from service_role/,
  );
  assert.match(migration, /before update or delete on public\.audit_events/);
  assert.match(migration, /audit_events_append_only/);
  assert.match(
    migration,
    /revoke all on function public\.append_user_audit_event[\s\S]*service_role/,
  );
  assert.match(
    privilegeHardening,
    /revoke all on public\.audit_events from service_role/,
  );
  assert.match(
    privilegeHardening,
    /grant select on public\.audit_events to service_role/,
  );
});

test("only an active Owner/Admin can read through RLS and the server endpoint", () => {
  assert.match(migration, /profile\.user_type = 'Owner\/Admin'/);
  assert.match(migration, /profile\.account_status = 'Active'/);
  assert.match(auditRoute, /requireRole\("Owner\/Admin"\)/);
  assert.match(auditRoute, /\.order\("occurred_at", \{ ascending: false \}\)/);
  assert.match(
    auditRoute,
    /boundedInteger\(url\.searchParams\.get\("limit"\), 25, 1, 100\)/,
  );
  assert.doesNotMatch(auditRoute, /POST:|PATCH:|DELETE:/);
});

test("safe summaries ignore prohibited immutable metadata values", () => {
  const secretValues = [
    "private/proof.png",
    "license-123",
    "id-456",
    "reference-789",
    "account-000",
    "internal note",
  ];
  const summary = summarizeAuditEvent({
    action: "payment.verified",
    metadata: {
      previous_status: "Pending Verification",
      new_status: "Verified",
      proof_path: secretValues[0],
      license_number: secretValues[1],
      id_number: secretValues[2],
      reference_number: secretValues[3],
      account_number: secretValues[4],
      reviewer_notes: secretValues[5],
    },
  });
  assert.equal(
    summary,
    "Payment status changed: Pending Verification → Verified.",
  );
  for (const value of secretValues)
    assert.doesNotMatch(summary, new RegExp(value));
  for (const key of [
    "proof_path",
    "storage_path",
    "license_number",
    "id_number",
    "reference_number",
    "account_number",
    "reviewer_notes",
  ]) {
    assert.doesNotMatch(migration, new RegExp(`'${key}'`));
  }
});

test("excluded notification, reminder, and intelligence domains remain unaudited", () => {
  assert.doesNotMatch(
    migration,
    /notification|reminder|forecast|utilization|mape|supply|allocation/i,
  );
});
