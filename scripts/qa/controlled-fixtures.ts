import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import process from "node:process";
import { createClient, type User } from "@supabase/supabase-js";
import postgres, { type Sql } from "postgres";
import {
  AUTH_SPECS,
  CANONICAL_BRANCHES,
  CUSTOMER_SPECS,
  FIXTURE_OWNER,
  FIXTURE_VERSION,
  OPERATOR_SPEC,
  UNEXPECTED_BRANCH_NAME,
  VEHICLES,
  buildFixtureDataset,
  fixtureAuthMetadata,
  isOwnedAuthUser,
  planRecords,
  sameFingerprint,
  type FixtureAuthIdentity,
  type FixtureDataset,
  type FixtureRecord,
} from "./fixture-inventory.ts";

type Target = "local" | "staging" | "production";
type Arguments = {
  apply: boolean;
  cleanup: boolean;
  includeAuthUsers: boolean;
  confirmProduction: boolean;
  anchorDate?: string;
};

const TABLE_ORDER = [
  "booking_requests",
  "renter_requirement_sets",
  "renter_requirement_documents",
  "renter_requirement_reviews",
  "payments",
  "payment_proofs",
  "rental_transactions",
  "maintenance_records",
] as const;

export const SIDE_EFFECT_TRIGGERS = [
  ["booking_requests", "booking_requests_notify_created"],
  ["booking_requests", "booking_requests_audit_lifecycle"],
  ["renter_requirement_reviews", "renter_requirement_reviews_notify_result"],
  ["rental_transactions", "rental_transactions_audit_lifecycle"],
  ["maintenance_records", "maintenance_records_audit_lifecycle"],
] as const;

function usage() {
  return `Controlled Briah QA fixtures (dry-run by default)

Usage:
  npm run qa:fixtures -- [--anchor-date=YYYY-MM-DD]
  npm run qa:fixtures -- --apply --include-auth-users [--confirm-production-fixtures]
  npm run qa:fixtures -- --cleanup [--apply] [--confirm-production-fixtures]

Writes never occur without --apply. Creating missing Auth identities additionally
requires --include-auth-users. Production writes additionally require
--confirm-production-fixtures.`;
}

export function parseArguments(argv: string[]): Arguments {
  const known = new Set([
    "--apply",
    "--cleanup",
    "--include-auth-users",
    "--confirm-production-fixtures",
    "--help",
  ]);
  for (const argument of argv) {
    if (!known.has(argument) && !argument.startsWith("--anchor-date=")) {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  const anchor = argv
    .find((argument) => argument.startsWith("--anchor-date="))
    ?.split("=", 2)[1];
  if (anchor && !/^\d{4}-\d{2}-\d{2}$/.test(anchor))
    throw new Error("--anchor-date must use YYYY-MM-DD.");
  return {
    apply: argv.includes("--apply"),
    cleanup: argv.includes("--cleanup"),
    includeAuthUsers: argv.includes("--include-auth-users"),
    confirmProduction: argv.includes("--confirm-production-fixtures"),
    anchorDate: anchor,
  };
}

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function validateEnvironment(args: Arguments) {
  const targetValue = requiredEnvironment("QA_FIXTURE_TARGET");
  if (!["local", "staging", "production"].includes(targetValue)) {
    throw new Error("QA_FIXTURE_TARGET must be local, staging, or production.");
  }
  const target = targetValue as Target;
  assertWriteSafety(target, args.apply, args.confirmProduction);
  const supabaseUrl = requiredEnvironment("SUPABASE_URL");
  const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const databaseUrl = requiredEnvironment("QA_FIXTURE_DATABASE_URL");
  assertTargetAgreement(supabaseUrl, databaseUrl, target !== "local");
  return { target, supabaseUrl, serviceRoleKey, databaseUrl };
}

export function assertWriteSafety(
  target: Target,
  apply: boolean,
  confirmProduction: boolean,
) {
  if (apply && target === "production" && !confirmProduction) {
    throw new Error("Production writes require --confirm-production-fixtures.");
  }
}

export function extractProjectRef(supabaseUrl: string, databaseUrl: string) {
  const apiHost = new URL(supabaseUrl).hostname;
  const apiRef = apiHost.endsWith(".supabase.co")
    ? apiHost.split(".")[0]
    : null;
  const database = new URL(databaseUrl);
  const directMatch = database.hostname.match(
    /^db\.([a-z0-9]+)\.supabase\.co$/i,
  );
  const poolerMatch = decodeURIComponent(database.username).match(
    /^postgres\.([a-z0-9]+)$/i,
  );
  return { apiRef, databaseRef: directMatch?.[1] ?? poolerMatch?.[1] ?? null };
}

export function assertTargetAgreement(
  supabaseUrl: string,
  databaseUrl: string,
  requireProjectRef = false,
) {
  const { apiRef, databaseRef } = extractProjectRef(supabaseUrl, databaseUrl);
  if (requireProjectRef && (!apiRef || !databaseRef)) {
    throw new Error(
      "The remote fixture target cannot be identified from both Supabase URLs.",
    );
  }
  if (
    (apiRef || databaseRef) &&
    (!apiRef || !databaseRef || apiRef !== databaseRef)
  ) {
    throw new Error(
      "SUPABASE_URL and QA_FIXTURE_DATABASE_URL do not identify the same Supabase project.",
    );
  }
}

function todayInManila() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function listAllUsers(client: ReturnType<typeof createClient>) {
  const users: User[] = [];
  for (let page = 1; ; page += 1) {
    const result = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error)
      throw new Error(`Unable to inspect Auth users: ${result.error.message}`);
    users.push(...result.data.users);
    if (result.data.users.length < 1000) break;
  }
  return users;
}

function inspectAuth(users: User[]) {
  const ownedByLabel = new Map<string, User>();
  for (const spec of AUTH_SPECS) {
    const byEmail = users.filter(
      (user) => user.email?.toLowerCase() === spec.email,
    );
    const byLabel = users.filter(
      (user) =>
        user.app_metadata?.qa_fixture_owner === FIXTURE_OWNER &&
        user.app_metadata?.qa_fixture_id === spec.label,
    );
    if (byEmail.length > 1 || byLabel.length > 1)
      throw new Error(`Duplicate Auth identity detected for ${spec.label}.`);
    const candidate = byEmail[0] ?? byLabel[0];
    if (!candidate) continue;
    if (!isOwnedAuthUser(candidate, spec))
      throw new Error(
        `Unknown Auth user collides with ${spec.label}/${spec.email}.`,
      );
    ownedByLabel.set(spec.label, candidate);
  }
  return ownedByLabel;
}

function resolveAnchor(args: Arguments, ownedUsers: Map<string, User>) {
  const stored = [...ownedUsers.values()]
    .map((user) => user.app_metadata?.qa_fixture_anchor_date)
    .filter((value): value is string => typeof value === "string");
  if (new Set(stored).size > 1)
    throw new Error(
      "Owned Auth users contain inconsistent fixture anchor dates.",
    );
  const requested =
    args.anchorDate ?? process.env.QA_FIXTURE_ANCHOR_DATE?.trim();
  if (requested && !/^\d{4}-\d{2}-\d{2}$/.test(requested))
    throw new Error("QA_FIXTURE_ANCHOR_DATE must use YYYY-MM-DD.");
  if (stored[0] && requested && stored[0] !== requested) {
    throw new Error(
      `Requested anchor date ${requested} conflicts with owned fixture anchor ${stored[0]}.`,
    );
  }
  return stored[0] ?? requested ?? todayInManila();
}

async function createMissingAuthUsers(
  client: ReturnType<typeof createClient>,
  ownedUsers: Map<string, User>,
  anchorDate: string,
) {
  const password = process.env.QA_FIXTURE_CUSTOMER_PASSWORD;
  for (const spec of AUTH_SPECS) {
    if (ownedUsers.has(spec.label)) continue;
    const attributes: Record<string, unknown> = {
      email: spec.email,
      email_confirm: true,
      app_metadata: fixtureAuthMetadata(spec.label, anchorDate),
      user_metadata: {
        full_name: spec.fullName,
        qa_fixture_notice: "SYNTHETIC QA/DEMO IDENTITY ONLY",
      },
    };
    if (password && spec.role === "Customer/Renter")
      attributes.password = password;
    const result = await client.auth.admin.createUser(attributes);
    if (result.error || !result.data.user) {
      throw new Error(
        `Unable to create ${spec.label}: ${result.error?.message ?? "no user returned"}`,
      );
    }
    process.stdout.write(`CREATED auth.users ${spec.label} (${spec.email})\n`);
  }
}

function identitiesFrom(ownedUsers: Map<string, User>): FixtureAuthIdentity[] {
  return AUTH_SPECS.map((spec) => {
    const user = ownedUsers.get(spec.label);
    if (!user) throw new Error(`Missing Auth fixture identity ${spec.label}.`);
    return { ...spec, userId: user.id };
  });
}

function placeholderIdentities(): FixtureAuthIdentity[] {
  return AUTH_SPECS.map((spec, index) => ({
    ...spec,
    userId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  }));
}

async function loadReferences(sql: Sql) {
  const branchRows = await sql<
    Record<string, unknown>[]
  >`select id, name, is_active from public.branches order by name`;
  const branchMap: Record<string, string> = {};
  for (const name of CANONICAL_BRANCHES) {
    const matches = branchRows.filter((row) => row.name === name);
    if (matches.length !== 1 || matches[0].is_active !== true)
      throw new Error(
        `Required active canonical branch is missing or duplicated: ${name}.`,
      );
    branchMap[name] = String(matches[0].id);
  }
  const unexpected = branchRows.filter(
    (row) => !CANONICAL_BRANCHES.includes(row.name as never),
  );

  const vehicleRows = await sql<Record<string, unknown>[]>`
    select id, name, license_plate, branch_id, is_active from public.vehicles
    where license_plate in ${sql(VEHICLES.map(([plate]) => plate))}
  `;
  const vehicleMap: Record<string, { id: string; branchId: string }> = {};
  for (const [plate, expectedName, branchName] of VEHICLES) {
    const matches = vehicleRows.filter((row) => row.license_plate === plate);
    if (
      matches.length !== 1 ||
      matches[0].name !== expectedName ||
      matches[0].branch_id !== branchMap[branchName] ||
      matches[0].is_active !== true
    )
      throw new Error(
        `Required canonical DEV vehicle is missing, inactive, duplicated, or changed: ${plate}.`,
      );
    vehicleMap[plate] = {
      id: String(matches[0].id),
      branchId: String(matches[0].branch_id),
    };
  }
  const methods = await sql<Record<string, unknown>[]>`
    select id, label, is_demo, is_active from public.payment_methods where code = 'demo-bank-transfer'
  `;
  if (
    methods.length !== 1 ||
    methods[0].label !== "Demo bank/e-wallet" ||
    !methods[0].is_demo ||
    !methods[0].is_active
  ) {
    throw new Error(
      "Required active demo payment method is missing or changed.",
    );
  }
  return {
    branches: branchMap,
    vehicles: vehicleMap,
    paymentMethodId: String(methods[0].id),
    unexpectedBranches: unexpected,
  };
}

async function readExistingRecords(sql: Sql, records: FixtureRecord[]) {
  const existing: Record<string, Record<string, unknown>> = {};
  for (const table of ["profiles", ...TABLE_ORDER]) {
    const ids = records
      .filter((record) => record.table === table)
      .map((record) => String(record.row.id));
    if (!ids.length) continue;
    const rows = await sql<
      Record<string, unknown>[]
    >`select * from ${sql(table)} where id in ${sql(ids)}`;
    for (const row of rows) existing[String(row.id)] = row;
  }
  return existing;
}

function validateProfiles(
  dataset: FixtureDataset,
  existing: Record<string, Record<string, unknown>>,
) {
  for (const record of dataset.records.filter(
    (candidate) => candidate.table === "profiles",
  )) {
    const row = existing[String(record.row.id)];
    if (!row)
      throw new Error(`Auth trigger did not create profile ${record.label}.`);
    const fields =
      record.label === OPERATOR_SPEC.label
        ? record.fingerprint.filter((field) => field !== "user_type")
        : record.fingerprint;
    if (
      !fields.every(
        (field) => String(row[field] ?? "") === String(record.row[field] ?? ""),
      )
    ) {
      throw new Error(
        `Unknown or modified profile collides with ${record.label}.`,
      );
    }
    if (
      record.label === OPERATOR_SPEC.label &&
      !["Customer/Renter", "Owner/Admin"].includes(String(row.user_type))
    ) {
      throw new Error(`${record.label} has an unexpected role.`);
    }
  }
}

function hash(body: Uint8Array) {
  return createHash("sha256").update(body).digest("hex");
}

async function planArtifacts(
  client: ReturnType<typeof createClient>,
  dataset: FixtureDataset,
) {
  const result: Array<{
    action: "create" | "skip" | "collision";
    artifact: FixtureDataset["artifacts"][number];
  }> = [];
  for (const artifact of dataset.artifacts) {
    const slash = artifact.path.lastIndexOf("/");
    const directory = artifact.path.slice(0, slash);
    const filename = artifact.path.slice(slash + 1);
    const listing = await client.storage
      .from(artifact.bucket)
      .list(directory, { limit: 100, search: filename });
    if (listing.error)
      throw new Error(
        `Unable to inspect ${artifact.bucket}/${artifact.path}: ${listing.error.message}`,
      );
    if (!listing.data.some((item) => item.name === filename)) {
      result.push({ action: "create", artifact });
      continue;
    }
    const download = await client.storage
      .from(artifact.bucket)
      .download(artifact.path);
    if (download.error || !download.data)
      throw new Error(`Unable to validate owned artifact ${artifact.path}.`);
    const bytes = new Uint8Array(await download.data.arrayBuffer());
    result.push({
      action: hash(bytes) === hash(artifact.body) ? "skip" : "collision",
      artifact,
    });
  }
  return result;
}

function printReferenceReport(
  references: Awaited<ReturnType<typeof loadReferences>>,
) {
  process.stdout.write(
    `Validated ${CANONICAL_BRANCHES.length} canonical branches and ${VEHICLES.length} DEV-* vehicles.\n`,
  );
  for (const branch of references.unexpectedBranches) {
    const label =
      branch.name === UNEXPECTED_BRANCH_NAME
        ? "known unexpected synthetic residue"
        : "unexpected branch";
    process.stdout.write(
      `REPORT ONLY ${label}: ${String(branch.name)} (${String(branch.id)}); never modified by this tool.\n`,
    );
  }
}

function printApplyPlan(
  dataset: FixtureDataset,
  recordPlan: ReturnType<typeof planRecords>,
  artifactPlan: Awaited<ReturnType<typeof planArtifacts>>,
  operatorNeedsRole: boolean,
) {
  process.stdout.write(
    `Fixture anchor: ${dataset.anchorDate} (Asia/Manila calendar basis)\n`,
  );
  if (operatorNeedsRole)
    process.stdout.write(
      `UPDATE profiles ${OPERATOR_SPEC.label}: owned non-login fixture operator role -> Owner/Admin\n`,
    );
  for (const item of recordPlan.filter(
    (item) => item.record.table !== "profiles",
  )) {
    process.stdout.write(
      `${item.action.toUpperCase()} ${item.record.table} ${item.record.label} (${String(item.record.row.id)})\n`,
    );
  }
  for (const item of artifactPlan) {
    process.stdout.write(
      `${item.action.toUpperCase()} storage ${item.artifact.label} (${item.artifact.bucket}/${item.artifact.path})\n`,
    );
  }
}

function assertNoCollisions(
  recordPlan: ReturnType<typeof planRecords>,
  artifactPlan: Awaited<ReturnType<typeof planArtifacts>>,
) {
  const collisions = [
    ...recordPlan
      .filter((item) => item.action === "collision")
      .map((item) => `${item.record.table}:${item.record.label}`),
    ...artifactPlan
      .filter((item) => item.action === "collision")
      .map((item) => `storage:${item.artifact.label}`),
  ];
  if (collisions.length)
    throw new Error(
      `Fixture ownership collision(s): ${collisions.join(", ")}. No writes performed.`,
    );
}

async function insertMissingRecords(sql: Sql, dataset: FixtureDataset) {
  await sql.begin(async (transaction) => {
    await transaction`select pg_advisory_xact_lock(hashtextextended(${FIXTURE_OWNER}, 0))`;
    const existing = await readExistingRecords(transaction, dataset.records);
    validateProfiles(dataset, existing);
    const plans = planRecords(
      dataset.records.filter((record) => record.table !== "profiles"),
      existing,
    );
    const collisions = plans.filter((plan) => plan.action === "collision");
    if (collisions.length)
      throw new Error(
        `Concurrent fixture collision: ${collisions.map((item) => item.record.label).join(", ")}.`,
      );
    for (const [table, trigger] of SIDE_EFFECT_TRIGGERS) {
      await transaction.unsafe(
        `alter table public.${table} disable trigger ${trigger}`,
      );
    }
    const operator = dataset.records.find(
      (record) => record.label === OPERATOR_SPEC.label,
    );
    assert(operator);
    await transaction`
      update public.profiles set user_type = 'Owner/Admin'
      where id = ${String(operator.row.id)} and email = ${String(operator.row.email)}
    `;
    for (const table of TABLE_ORDER) {
      const rows = plans
        .filter(
          (plan) => plan.action === "create" && plan.record.table === table,
        )
        .map((plan) => plan.record.row);
      if (rows.length)
        await transaction`insert into ${transaction(table)} ${transaction(rows)}`;
    }
    for (const [table, trigger] of SIDE_EFFECT_TRIGGERS) {
      await transaction.unsafe(
        `alter table public.${table} enable trigger ${trigger}`,
      );
    }
  });
}

async function uploadMissingArtifacts(
  client: ReturnType<typeof createClient>,
  plans: Awaited<ReturnType<typeof planArtifacts>>,
) {
  for (const { action, artifact } of plans) {
    if (action !== "create") continue;
    const result = await client.storage
      .from(artifact.bucket)
      .upload(artifact.path, artifact.body, {
        contentType: artifact.mimeType,
        upsert: false,
      });
    if (result.error)
      throw new Error(
        `Unable to upload ${artifact.label}: ${result.error.message}`,
      );
  }
}

async function applyFixtures(
  sql: Sql,
  client: ReturnType<typeof createClient>,
  dataset: FixtureDataset,
  recordPlan: ReturnType<typeof planRecords>,
  artifactPlan: Awaited<ReturnType<typeof planArtifacts>>,
) {
  await uploadMissingArtifacts(client, artifactPlan);
  await insertMissingRecords(sql, dataset);
  process.stdout.write(
    "APPLY COMPLETE: synthetic QA fixture records are present. No audit events or notifications were seeded.\n",
  );
  const postExisting = await readExistingRecords(sql, dataset.records);
  const postPlan = planRecords(dataset.records, postExisting);
  if (postPlan.some((item) => item.action !== "skip"))
    throw new Error("Post-apply idempotency validation failed.");
  assert(
    recordPlan.every(
      (item) => item.action === "create" || item.action === "skip",
    ),
  );
}

async function readCleanupDependencies(sql: Sql, dataset: FixtureDataset) {
  const entityIds = [
    ...dataset.ids.bookings,
    ...dataset.ids.requirements,
    ...dataset.ids.payments,
    ...dataset.ids.rentals,
    ...dataset.ids.maintenance,
  ];
  const audit = await sql<Record<string, unknown>[]>`
    select id, entity_id, booking_id from public.audit_events
    where booking_id in ${sql(dataset.ids.bookings)} or entity_id in ${sql(entityIds)}
  `;
  if (audit.length) {
    throw new Error(
      "Cleanup refused: append-only audit events reference fixture IDs. Manual Lead review is required.",
    );
  }
  const notifications = await sql<Record<string, unknown>[]>`
    select id, related_entity_id, event_key from public.notifications where related_entity_id in ${sql(entityIds)}
  `;
  for (const notification of notifications) {
    if (
      !String(notification.event_key).includes(
        String(notification.related_entity_id),
      )
    ) {
      throw new Error(
        `Cleanup refused: notification ${String(notification.id)} is not positively fixture-owned.`,
      );
    }
  }
  const notificationIds = notifications.map((row) => String(row.id));
  const emailDeliveries = notificationIds.length
    ? await sql<
        Record<string, unknown>[]
      >`select id, notification_id from public.email_deliveries where notification_id in ${sql(notificationIds)}`
    : [];
  const finder = await sql<
    Record<string, unknown>[]
  >`select booking_id from public.booking_finder_context where booking_id in ${sql(dataset.ids.bookings)}`;
  const idempotency = await sql<
    Record<string, unknown>[]
  >`select booking_id from public.booking_creation_idempotency where booking_id in ${sql(dataset.ids.bookings)}`;
  return {
    notifications,
    notificationIds,
    emailDeliveries,
    finder,
    idempotency,
  };
}

async function assertNoUnknownIdentityReferences(
  sql: Sql,
  dataset: FixtureDataset,
  identityIds: string[],
  allowedNotificationIds: string[],
) {
  const recordsByTable = Object.fromEntries(
    [
      "renter_requirement_documents",
      "renter_requirement_reviews",
      "payment_proofs",
    ].map((table) => [
      table,
      dataset.records
        .filter((record) => record.table === table)
        .map((record) => String(record.row.id)),
    ]),
  );
  const references = await sql<{ source: string; id: string }[]>`
    select 'booking_requests' source, id::text from public.booking_requests
      where (customer_id in ${sql(identityIds)} or assigned_by in ${sql(identityIds)} or confirmed_by in ${sql(identityIds)})
        and id not in ${sql(dataset.ids.bookings)}
    union all select 'renter_requirement_sets', id::text from public.renter_requirement_sets
      where customer_id in ${sql(identityIds)} and id not in ${sql(dataset.ids.requirements)}
    union all select 'renter_requirement_documents', id::text from public.renter_requirement_documents
      where customer_id in ${sql(identityIds)} and id not in ${sql(recordsByTable.renter_requirement_documents)}
    union all select 'renter_requirement_reviews', id::text from public.renter_requirement_reviews
      where reviewer_id in ${sql(identityIds)} and id not in ${sql(recordsByTable.renter_requirement_reviews)}
    union all select 'payments', id::text from public.payments
      where (customer_id in ${sql(identityIds)} or reviewed_by in ${sql(identityIds)}) and id not in ${sql(dataset.ids.payments)}
    union all select 'payment_proofs', id::text from public.payment_proofs
      where customer_id in ${sql(identityIds)} and id not in ${sql(recordsByTable.payment_proofs)}
    union all select 'rental_transactions', id::text from public.rental_transactions
      where (customer_id in ${sql(identityIds)} or released_by in ${sql(identityIds)} or returned_by in ${sql(identityIds)})
        and id not in ${sql(dataset.ids.rentals)}
    union all select 'maintenance_records', id::text from public.maintenance_records
      where (created_by in ${sql(identityIds)} or updated_by in ${sql(identityIds)}) and id not in ${sql(dataset.ids.maintenance)}
    union all select 'audit_events', id::text from public.audit_events where actor_user_id in ${sql(identityIds)}
    union all select 'forecast_runs', id::text from public.forecast_runs where generated_by in ${sql(identityIds)}
    union all select 'supply_evaluations', id::text from public.supply_evaluations where evaluated_by in ${sql(identityIds)}
    union all select 'allocation_recommendation_batches', id::text from public.allocation_recommendation_batches where generated_by in ${sql(identityIds)}
    union all select 'allocation_recommendations', id::text from public.allocation_recommendations where decided_by in ${sql(identityIds)}
    union all select 'backup_runs', id::text from public.backup_runs where created_by in ${sql(identityIds)}
    union all select 'vehicle_operational_state_events', id::text from public.vehicle_operational_state_events where recorded_by in ${sql(identityIds)}
    ${
      allowedNotificationIds.length
        ? sql`union all select 'notifications', id::text from public.notifications where recipient_id in ${sql(identityIds)} and id not in ${sql(allowedNotificationIds)}`
        : sql`union all select 'notifications', id::text from public.notifications where recipient_id in ${sql(identityIds)}`
    }
  `;
  if (references.length) {
    const sample = references
      .slice(0, 5)
      .map((row) => `${row.source}:${row.id}`)
      .join(", ");
    throw new Error(
      `Cleanup refused: owned Auth identities are referenced by non-inventory records (${sample}${references.length > 5 ? ", ..." : ""}).`,
    );
  }
}

function printCleanupPlan(
  dataset: FixtureDataset,
  recordPlan: ReturnType<typeof planRecords>,
  artifacts: Awaited<ReturnType<typeof planArtifacts>>,
  dependencies: Awaited<ReturnType<typeof readCleanupDependencies>>,
  ownedUsers: Map<string, User>,
) {
  for (const item of recordPlan
    .filter(
      (item) => item.action === "skip" && item.record.table !== "profiles",
    )
    .reverse()) {
    process.stdout.write(
      `REMOVE ${item.record.table} ${item.record.label} (${String(item.record.row.id)})\n`,
    );
  }
  for (const artifact of artifacts.filter((item) => item.action === "skip")) {
    process.stdout.write(
      `REMOVE storage ${artifact.artifact.label} (${artifact.artifact.bucket}/${artifact.artifact.path})\n`,
    );
  }
  process.stdout.write(
    `REMOVE generated dependencies: ${dependencies.emailDeliveries.length} email deliveries, ${dependencies.notifications.length} notifications, ${dependencies.finder.length} finder contexts, ${dependencies.idempotency.length} idempotency bindings.\n`,
  );
  for (const spec of AUTH_SPECS)
    if (ownedUsers.has(spec.label))
      process.stdout.write(`REMOVE auth.users ${spec.label} (${spec.email})\n`);
  process.stdout.write(
    `Cleanup owns ${dataset.records.length} possible database rows and ${dataset.artifacts.length} possible artifacts; missing items are skipped.\n`,
  );
}

async function deleteOwnedDatabaseRows(
  sql: Sql,
  dataset: FixtureDataset,
  _dependencies: Awaited<ReturnType<typeof readCleanupDependencies>>,
) {
  await sql.begin(async (transaction) => {
    await transaction`select pg_advisory_xact_lock(hashtextextended(${FIXTURE_OWNER}, 0))`;
    const dependencies = await readCleanupDependencies(transaction, dataset);
    const identityIds = dataset.records
      .filter((record) => record.table === "profiles")
      .map((record) => String(record.row.id));
    await assertNoUnknownIdentityReferences(
      transaction,
      dataset,
      identityIds,
      dependencies.notificationIds,
    );
    const existing = await readExistingRecords(transaction, dataset.records);
    validateProfiles(dataset, existing);
    const plans = planRecords(
      dataset.records.filter((record) => record.table !== "profiles"),
      existing,
    );
    const collisions = plans.filter((item) => item.action === "collision");
    if (collisions.length)
      throw new Error(
        `Cleanup collision(s): ${collisions.map((item) => item.record.label).join(", ")}.`,
      );
    if (dependencies.emailDeliveries.length)
      await transaction`delete from public.email_deliveries where id in ${transaction(dependencies.emailDeliveries.map((row) => String(row.id)))}`;
    if (dependencies.notificationIds.length)
      await transaction`delete from public.notifications where id in ${transaction(dependencies.notificationIds)}`;
    if (dependencies.finder.length) {
      await transaction.unsafe(
        "alter table public.booking_finder_context disable trigger booking_finder_context_immutable",
      );
      await transaction`delete from public.booking_finder_context where booking_id in ${transaction(dataset.ids.bookings)}`;
      await transaction.unsafe(
        "alter table public.booking_finder_context enable trigger booking_finder_context_immutable",
      );
    }
    if (dependencies.idempotency.length)
      await transaction`delete from public.booking_creation_idempotency where booking_id in ${transaction(dataset.ids.bookings)}`;
    const deleteOrder = [...TABLE_ORDER].reverse();
    for (const table of deleteOrder) {
      const ids = plans
        .filter((item) => item.action === "skip" && item.record.table === table)
        .map((item) => String(item.record.row.id));
      if (ids.length)
        await transaction`delete from ${transaction(table)} where id in ${transaction(ids)}`;
    }
  });
}

async function cleanupFixtures(
  sql: Sql,
  client: ReturnType<typeof createClient>,
  dataset: FixtureDataset,
  artifactPlan: Awaited<ReturnType<typeof planArtifacts>>,
  dependencies: Awaited<ReturnType<typeof readCleanupDependencies>>,
  ownedUsers: Map<string, User>,
) {
  await deleteOwnedDatabaseRows(sql, dataset, dependencies);
  for (const bucket of ["renter-requirements", "payment-proofs"] as const) {
    const paths = artifactPlan
      .filter(
        (item) => item.action === "skip" && item.artifact.bucket === bucket,
      )
      .map((item) => item.artifact.path);
    if (!paths.length) continue;
    const removal = await client.storage.from(bucket).remove(paths);
    if (removal.error)
      throw new Error(
        `Unable to remove fixture artifacts from ${bucket}: ${removal.error.message}`,
      );
  }
  for (const spec of [...AUTH_SPECS].reverse()) {
    const user = ownedUsers.get(spec.label);
    if (!user) continue;
    const result = await client.auth.admin.deleteUser(user.id);
    if (result.error)
      throw new Error(
        `Unable to remove ${spec.label}: ${result.error.message}`,
      );
  }
  process.stdout.write(
    "CLEANUP COMPLETE: positively owned fixture records, artifacts, and Auth users were removed.\n",
  );
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  if (process.argv.includes("--help")) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const environment = validateEnvironment(args);
  const client = createClient(
    environment.supabaseUrl,
    environment.serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  const sql = postgres(environment.databaseUrl, {
    max: 1,
    prepare: false,
    ssl: environment.target === "local" ? false : "require",
  });
  try {
    process.stdout.write(
      `${args.apply ? "WRITE" : "DRY-RUN"} ${args.cleanup ? "cleanup" : "create"} target=${environment.target}\n`,
    );
    const references = await loadReferences(sql);
    printReferenceReport(references);
    let users = await listAllUsers(client);
    let ownedUsers = inspectAuth(users);
    const anchorDate = resolveAnchor(args, ownedUsers);
    const missingAuth = AUTH_SPECS.filter(
      (spec) => !ownedUsers.has(spec.label),
    );
    const placeholderDataset = buildFixtureDataset({
      anchorDate,
      identities: placeholderIdentities(),
      branches: references.branches,
      vehicles: references.vehicles,
      paymentMethodId: references.paymentMethodId,
    });
    if (missingAuth.length) {
      const residue = await readExistingRecords(
        sql,
        placeholderDataset.records.filter(
          (record) => record.table !== "profiles",
        ),
      );
      if (Object.keys(residue).length) {
        throw new Error(
          "Deterministic fixture record IDs exist without a complete owned Auth inventory; refusing ambiguous operation.",
        );
      }
    }
    if (args.cleanup && missingAuth.length && ownedUsers.size > 0) {
      throw new Error(
        "Cleanup found a partial Auth fixture inventory; refusing ambiguous database cleanup. Restore or review the owned Auth inventory first.",
      );
    }
    if (args.cleanup && ownedUsers.size === 0) {
      process.stdout.write(
        "No owned Auth inventory exists. Nothing to clean; no writes performed.\n",
      );
      return;
    }
    if (!args.cleanup) {
      for (const spec of missingAuth)
        process.stdout.write(
          `CREATE auth.users ${spec.label} (${spec.email})\n`,
        );
    }
    if (!args.cleanup && args.apply && missingAuth.length) {
      if (!args.includeAuthUsers)
        throw new Error(
          "Missing Auth fixtures require --include-auth-users; no Auth users were created.",
        );
      await createMissingAuthUsers(client, ownedUsers, anchorDate);
      users = await listAllUsers(client);
      ownedUsers = inspectAuth(users);
    }
    if (missingAuth.length && !args.apply) {
      for (const record of placeholderDataset.records.filter(
        (item) => item.table !== "profiles",
      )) {
        process.stdout.write(
          `CREATE ${record.table} ${record.label} (${String(record.row.id)})\n`,
        );
      }
      for (const artifact of placeholderDataset.artifacts) {
        process.stdout.write(
          `CREATE storage ${artifact.label} (${artifact.bucket}/<allocated-owned-auth-id>/qa-fixtures/${FIXTURE_OWNER}/...)\n`,
        );
      }
      process.stdout.write(
        "Dry-run stopped before row collision checks because required owned Auth IDs do not yet exist. No writes performed.\n",
      );
      return;
    }
    const dataset = buildFixtureDataset({
      anchorDate,
      identities: identitiesFrom(ownedUsers),
      branches: references.branches,
      vehicles: references.vehicles,
      paymentMethodId: references.paymentMethodId,
    });
    const existing = await readExistingRecords(sql, dataset.records);
    validateProfiles(dataset, existing);
    const recordPlan = planRecords(
      dataset.records.filter((record) => record.table !== "profiles"),
      existing,
    );
    const artifactPlan = await planArtifacts(client, dataset);
    assertNoCollisions(recordPlan, artifactPlan);
    const operator = existing[ownedUsers.get(OPERATOR_SPEC.label)!.id];
    const operatorNeedsRole = operator.user_type !== "Owner/Admin";

    if (args.cleanup) {
      const dependencies = await readCleanupDependencies(sql, dataset);
      await assertNoUnknownIdentityReferences(
        sql,
        dataset,
        [...ownedUsers.values()].map((user) => user.id),
        dependencies.notificationIds,
      );
      printCleanupPlan(
        dataset,
        recordPlan,
        artifactPlan,
        dependencies,
        ownedUsers,
      );
      if (!args.apply) {
        process.stdout.write("DRY-RUN COMPLETE: no writes performed.\n");
        return;
      }
      await cleanupFixtures(
        sql,
        client,
        dataset,
        artifactPlan,
        dependencies,
        ownedUsers,
      );
      return;
    }

    printApplyPlan(dataset, recordPlan, artifactPlan, operatorNeedsRole);
    if (!args.apply) {
      process.stdout.write("DRY-RUN COMPLETE: no writes performed.\n");
      return;
    }
    await applyFixtures(sql, client, dataset, recordPlan, artifactPlan);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`QA fixture tool refused to continue: ${message}\n`);
    process.exitCode = 1;
  });
}
