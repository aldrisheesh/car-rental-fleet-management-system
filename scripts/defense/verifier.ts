import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const EXPECTED_PROJECT_REF = "vkfacfjkwomhfvrieaza";
export const EXIT_OK = 0;
export const EXIT_DRIFT = 2;
export const EXIT_BLOCKED = 3;

type Primitive = string | number | boolean | null;

export type AccountSpec = {
  label: string;
  id: string;
  fullName: string;
  role: string;
  accountStatus: string;
  noChildWorkflow?: boolean;
};

export type BookingSpec = {
  label: string;
  id: string;
  customerId: string;
  status: string;
  pickupBranchId: string;
  returnBranchId: string;
  pickupAt: string;
  returnAt: string;
  requestedVehicleId: string;
  requestedVehicleKey: string;
  assignedVehicleId: string | null;
  assignedVehicleKey: string | null;
};

export type DocumentSpec = {
  id: string;
  type: string;
  version: number;
  isCurrent: boolean;
  storagePathSha256: string;
};

export type ReviewSpec = {
  id: string;
  reviewerId: string;
  resultingStatus: string;
  governmentIdDocumentId: string;
  governmentIdVersion: number;
  driversLicenseDocumentId: string;
  driversLicenseVersion: number;
};

export type RequirementSpec = {
  label: string;
  id: string;
  bookingId: string;
  customerId: string;
  status: string;
  documents: DocumentSpec[];
  reviews: ReviewSpec[];
};

export type ProofSpec = {
  id: string;
  version: number;
  isCurrent: boolean;
  storagePathSha256: string;
};

export type PaymentSpec = {
  label: string;
  id: string;
  bookingId: string;
  customerId: string;
  status: string;
  paymentMethodId: string;
  proof: ProofSpec;
};

export type RentalSpec = {
  label: string;
  id: string;
  bookingId: string;
  customerId: string;
  vehicleId: string;
  vehicleKey: string;
  state: "Active" | "Returned";
};

export type MaintenanceSpec = {
  label: string;
  id: string;
  vehicleId: string;
  vehicleKey: string;
  status: string;
  blocksRentalUse: boolean;
};

export type NotificationEvidenceSpec = {
  notificationType: string;
  relatedEntityType: string;
  entityRefs?: string[];
  entityIds?: string[];
  recipientRef: string;
  minimumCount?: number;
};

export type AuditEvidenceSpec = {
  action: string;
  entityType: string;
  entityRefs?: string[];
  entityId?: string;
  bookingRef?: string;
  actorRef?: string;
  actorRefMode?: "customer";
  minimumCount?: number;
};

export type DecisionRecordSpec = {
  id: string;
  [field: string]: unknown;
};

export type DefenseManifest = {
  schemaVersion: number;
  markdownManifest: string;
  markdownSha256: string;
  projectRef: string;
  sourceCommit: string;
  executionEvidenceCommit: string;
  coverage: { id: number; trackingStartedAt: string };
  expectedCounts: Record<string, number>;
  accounts: AccountSpec[];
  bookings: BookingSpec[];
  requirements: RequirementSpec[];
  payments: PaymentSpec[];
  rentals: RentalSpec[];
  maintenance: MaintenanceSpec[];
  notificationEvidence: NotificationEvidenceSpec[];
  auditEvidence: AuditEvidenceSpec[];
  decisionSupport: {
    forecastRuns: DecisionRecordSpec[];
    forecastInputs: DecisionRecordSpec[];
    forecasts: DecisionRecordSpec[];
    supplyEvaluations: DecisionRecordSpec[];
    supplyEvaluationVehicles: DecisionRecordSpec[];
    allocationBatches: DecisionRecordSpec[];
    allocationRecommendations: DecisionRecordSpec[];
    allocationCandidates: DecisionRecordSpec[];
  };
};

export type AuthSnapshotRow = {
  id: string;
  emailConfirmedAt: string | null;
};

export type ProfileSnapshotRow = {
  id: string;
  fullName: string | null;
  userType: string | null;
  accountStatus: string | null;
};

export type BookingSnapshotRow = {
  id: string;
  customerId: string | null;
  status: string | null;
  pickupBranchId: string | null;
  returnBranchId: string | null;
  pickupAt: string | null;
  returnAt: string | null;
  requestedVehicleId: string | null;
  assignedVehicleId: string | null;
};

export type RequirementSnapshotRow = {
  id: string;
  bookingId: string | null;
  customerId: string | null;
  status: string | null;
};

export type DocumentSnapshotRow = {
  id: string;
  requirementSetId: string | null;
  bookingId: string | null;
  customerId: string | null;
  type: string | null;
  version: number | null;
  isCurrent: boolean | null;
  storagePath: string | null;
  storagePathSha256?: string;
};

export type ReviewSnapshotRow = {
  id: string;
  requirementSetId: string | null;
  reviewerId: string | null;
  resultingStatus: string | null;
  governmentIdDocumentId: string | null;
  governmentIdVersion: number | null;
  driversLicenseDocumentId: string | null;
  driversLicenseVersion: number | null;
};

export type PaymentSnapshotRow = {
  id: string;
  bookingId: string | null;
  customerId: string | null;
  status: string | null;
  paymentMethodId: string | null;
};

export type ProofSnapshotRow = {
  id: string;
  paymentId: string | null;
  bookingId: string | null;
  customerId: string | null;
  version: number | null;
  isCurrent: boolean | null;
  storagePath: string | null;
  storagePathSha256?: string;
};

export type RentalSnapshotRow = {
  id: string;
  bookingId: string | null;
  customerId: string | null;
  vehicleId: string | null;
  endedAt: string | null;
};

export type MaintenanceSnapshotRow = {
  id: string;
  vehicleId: string | null;
  status: string | null;
  blocksRentalUse: boolean | null;
};

export type NotificationSnapshotRow = {
  id: string;
  recipientId: string | null;
  notificationType: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  eventKey: string | null;
};

export type AuditSnapshotRow = {
  id: string;
  actorType: string | null;
  actorUserId: string | null;
  action: string | null;
  entityType: string | null;
  entityId: string | null;
  bookingId: string | null;
};

export type StorageSnapshotRow = {
  bucket: "renter-requirements" | "payment-proofs";
  path: string;
  pathSha256?: string;
};

export type DefenseSnapshot = {
  authUsers: AuthSnapshotRow[];
  profiles: ProfileSnapshotRow[];
  bookings: BookingSnapshotRow[];
  requirements: RequirementSnapshotRow[];
  documents: DocumentSnapshotRow[];
  reviews: ReviewSnapshotRow[];
  payments: PaymentSnapshotRow[];
  proofs: ProofSnapshotRow[];
  rentals: RentalSnapshotRow[];
  maintenance: MaintenanceSnapshotRow[];
  notifications: NotificationSnapshotRow[];
  auditEvents: AuditSnapshotRow[];
  storageObjects: StorageSnapshotRow[];
  coverage: { id: number; trackingStartedAt: string | null }[];
  decisionSupport: DefenseManifest["decisionSupport"];
};

export type IssueKind =
  | "MISSING BASELINE RECORD"
  | "MODIFIED BASELINE RECORD"
  | "AMBIGUOUS / UNRESOLVED";

export type VerificationIssue = {
  kind: IssueKind;
  area: string;
  id?: string;
  message: string;
};

export type CheckResult = {
  label: string;
  pass: boolean;
  expectedBaseline: number;
  presentBaseline: number;
  issues: VerificationIssue[];
};

export type VerificationReport = {
  classification:
    | "DEFENSE BASELINE VERIFIED"
    | "DEFENSE BASELINE VERIFIED — UAT DATA PRESENT"
    | "DEFENSE BASELINE DRIFT DETECTED";
  baselineIntact: boolean;
  hasExtraUatData: boolean;
  checks: CheckResult[];
  extra: {
    accounts: number;
    profiles: number;
    bookings: number;
    requirementSets: number;
    requirementDocuments: number;
    requirementReviews: number;
    payments: number;
    paymentProofs: number;
    rentals: number;
    maintenance: number;
    storageObjects: number;
    notifications: number;
    auditEvents: number;
    decisionSupport: number;
  };
  issues: VerificationIssue[];
};

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export class ProjectGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectGuardError";
  }
}

export class ReadVerificationError extends Error {
  readonly area: string;

  constructor(area: string) {
    super(`Read access failed for ${area}.`);
    this.name = "ReadVerificationError";
    this.area = area;
  }
}

type ReadTableResult = {
  data: Record<string, unknown>[] | null;
  error: unknown;
};

type ReadSupabaseClient = {
  from(table: string): {
    select(columns: string): Promise<ReadTableResult>;
  };
  auth: {
    admin: {
      listUsers(options: { page: number; perPage: number }): Promise<{
        data: { users: Array<Record<string, unknown>> };
        error: unknown;
      }>;
    };
  };
  storage: {
    from(bucket: string): {
      list(
        folder: string,
        options: {
          limit: number;
          offset: number;
          sortBy: { column: string; order: "asc" | "desc" };
        },
      ): Promise<{
        data: Array<{ name: string; id?: string | null }> | null;
        error: unknown;
      }>;
    };
  };
};

const TABLE_SELECTS = {
  profiles: "id,full_name,user_type,account_status",
  bookings:
    "id,customer_id,pickup_branch_id,return_branch_id,pickup_at,return_at,requested_vehicle_id,assigned_vehicle_id,booking_status",
  requirements: "id,booking_id,customer_id,status",
  documents:
    "id,requirement_set_id,booking_id,customer_id,requirement_type,version,is_current,storage_path",
  reviews:
    "id,requirement_set_id,reviewer_id,resulting_status,government_id_document_id,government_id_version,drivers_license_document_id,drivers_license_version",
  payments: "id,booking_id,customer_id,status,payment_method_id",
  proofs:
    "id,payment_id,booking_id,customer_id,version,is_current,storage_path",
  rentals: "id,booking_id,customer_id,vehicle_id,ended_at",
  maintenance: "id,vehicle_id,status,blocks_rental_use",
  notifications:
    "id,recipient_id,notification_type,related_entity_type,related_entity_id,event_key",
  auditEvents:
    "id,actor_type,actor_user_id,action,entity_type,entity_id,booking_id",
  coverage: "id,tracking_started_at",
  forecastRuns:
    "id,generated_at,generated_by,method,idempotency_key,coverage_start",
  forecastInputs:
    "id,forecast_id,source_type,source_week_start,source_value,input_order,weight,weighted_contribution",
  forecasts:
    "id,run_id,branch_id,vehicle_category_id,horizon,target_week_start,target_week_end,forecasted_demand,required_vehicle_units,actual_demand,ape",
  supplyEvaluations:
    "id,forecast_id,evaluated_at,evaluated_by,idempotency_key,required_units_snapshot,projected_supply,shortage_units,surplus_units,data_quality_state",
  supplyEvaluationVehicles:
    "id,evaluation_id,vehicle_id,eligible,booking_conflict,rental_conflict,future_maintenance_conflict,exclusion_reasons",
  allocationBatches:
    "id,generated_by,generated_at,idempotency_key,generation_context_fingerprint",
  allocationRecommendations:
    "id,batch_id,source_supply_evaluation_id,destination_supply_evaluation_id,source_branch_id,destination_branch_id,vehicle_category_id,forecast_horizon,target_week_start,target_week_end,source_required_units_snapshot,source_projected_supply_snapshot,source_surplus_snapshot,destination_required_units_snapshot,destination_projected_supply_snapshot,destination_shortage_snapshot,recommended_transfer_units,decision_state",
  allocationCandidates:
    "id,recommendation_id,vehicle_id,vehicle_name_snapshot,candidate_rank,revalidation_state",
} as const;

const DECISION_TABLES = [
  "forecastRuns",
  "forecastInputs",
  "forecasts",
  "supplyEvaluations",
  "supplyEvaluationVehicles",
  "allocationBatches",
  "allocationRecommendations",
  "allocationCandidates",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "")
    throw new ManifestError(`Manifest field ${field} is invalid.`);
  return value;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string"
    ? value
    : value == null
      ? null
      : String(value);
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number"
    ? value
    : value == null
      ? null
      : Number(value);
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean"
    ? value
    : value == null
      ? null
      : Boolean(value);
}

function mapRow<T extends Record<string, unknown>>(
  rows: Record<string, unknown>[],
  mapper: (row: Record<string, unknown>) => T,
): T[] {
  return rows.map(mapper);
}

async function readTable(
  client: ReadSupabaseClient,
  table: string,
  columns: string,
): Promise<Record<string, unknown>[]> {
  const result = await client.from(table).select(columns);
  if (result.error || !Array.isArray(result.data))
    throw new ReadVerificationError(table);
  return result.data;
}

async function listStorageBucket(
  client: ReadSupabaseClient,
  bucket: "renter-requirements" | "payment-proofs",
): Promise<StorageSnapshotRow[]> {
  const result: StorageSnapshotRow[] = [];
  const visit = async (folder: string, depth: number): Promise<void> => {
    if (depth > 32) throw new ReadVerificationError(`Storage ${bucket}`);
    let offset = 0;
    for (;;) {
      const listing = await client.storage.from(bucket).list(folder, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (listing.error || !Array.isArray(listing.data))
        throw new ReadVerificationError(`Storage ${bucket}`);
      for (const entry of listing.data) {
        const path = folder ? `${folder}/${entry.name}` : entry.name;
        if (typeof entry.id === "string" && entry.id.length > 0)
          result.push({ bucket, path });
        else await visit(path, depth + 1);
      }
      if (listing.data.length < 1000) break;
      offset += listing.data.length;
    }
  };
  await visit("", 0);
  return result;
}

export async function readDefenseSnapshot(
  client: ReadSupabaseClient,
): Promise<DefenseSnapshot> {
  const [
    authUsers,
    profiles,
    bookings,
    requirements,
    documents,
    reviews,
    payments,
    proofs,
    rentals,
    maintenance,
    notifications,
    auditEvents,
    coverage,
    ...decisionRows
  ] = await Promise.all([
    listAuthUsers(client),
    readTable(client, "profiles", TABLE_SELECTS.profiles),
    readTable(client, "booking_requests", TABLE_SELECTS.bookings),
    readTable(client, "renter_requirement_sets", TABLE_SELECTS.requirements),
    readTable(client, "renter_requirement_documents", TABLE_SELECTS.documents),
    readTable(client, "renter_requirement_reviews", TABLE_SELECTS.reviews),
    readTable(client, "payments", TABLE_SELECTS.payments),
    readTable(client, "payment_proofs", TABLE_SELECTS.proofs),
    readTable(client, "rental_transactions", TABLE_SELECTS.rentals),
    readTable(client, "maintenance_records", TABLE_SELECTS.maintenance),
    readTable(client, "notifications", TABLE_SELECTS.notifications),
    readTable(client, "audit_events", TABLE_SELECTS.auditEvents),
    readTable(client, "forecast_demand_coverage", TABLE_SELECTS.coverage),
    ...DECISION_TABLES.map((key) =>
      readTable(client, keyToTableName(key), TABLE_SELECTS[key]),
    ),
    listStorageBucket(client, "renter-requirements"),
    listStorageBucket(client, "payment-proofs"),
  ]);

  const decisionSupport = Object.fromEntries(
    DECISION_TABLES.map((key, index) => [
      key,
      normalizeDecisionRows(decisionRows[index]),
    ]),
  ) as DefenseManifest["decisionSupport"];
  const storageObjects = [
    ...(decisionRows[DECISION_TABLES.length] as StorageSnapshotRow[]),
    ...(decisionRows[DECISION_TABLES.length + 1] as StorageSnapshotRow[]),
  ];

  return {
    authUsers,
    profiles: mapRow(profiles, (row) => ({
      id: String(row.id),
      fullName: stringOrNull(row.full_name),
      userType: stringOrNull(row.user_type),
      accountStatus: stringOrNull(row.account_status),
    })),
    bookings: mapRow(bookings, (row) => ({
      id: String(row.id),
      customerId: stringOrNull(row.customer_id),
      status: stringOrNull(row.booking_status),
      pickupBranchId: stringOrNull(row.pickup_branch_id),
      returnBranchId: stringOrNull(row.return_branch_id),
      pickupAt: stringOrNull(row.pickup_at),
      returnAt: stringOrNull(row.return_at),
      requestedVehicleId: stringOrNull(row.requested_vehicle_id),
      assignedVehicleId: stringOrNull(row.assigned_vehicle_id),
    })),
    requirements: mapRow(requirements, (row) => ({
      id: String(row.id),
      bookingId: stringOrNull(row.booking_id),
      customerId: stringOrNull(row.customer_id),
      status: stringOrNull(row.status),
    })),
    documents: mapRow(documents, (row) => ({
      id: String(row.id),
      requirementSetId: stringOrNull(row.requirement_set_id),
      bookingId: stringOrNull(row.booking_id),
      customerId: stringOrNull(row.customer_id),
      type: stringOrNull(row.requirement_type),
      version: numberOrNull(row.version),
      isCurrent: booleanOrNull(row.is_current),
      storagePath: stringOrNull(row.storage_path),
    })),
    reviews: mapRow(reviews, (row) => ({
      id: String(row.id),
      requirementSetId: stringOrNull(row.requirement_set_id),
      reviewerId: stringOrNull(row.reviewer_id),
      resultingStatus: stringOrNull(row.resulting_status),
      governmentIdDocumentId: stringOrNull(row.government_id_document_id),
      governmentIdVersion: numberOrNull(row.government_id_version),
      driversLicenseDocumentId: stringOrNull(row.drivers_license_document_id),
      driversLicenseVersion: numberOrNull(row.drivers_license_version),
    })),
    payments: mapRow(payments, (row) => ({
      id: String(row.id),
      bookingId: stringOrNull(row.booking_id),
      customerId: stringOrNull(row.customer_id),
      status: stringOrNull(row.status),
      paymentMethodId: stringOrNull(row.payment_method_id),
    })),
    proofs: mapRow(proofs, (row) => ({
      id: String(row.id),
      paymentId: stringOrNull(row.payment_id),
      bookingId: stringOrNull(row.booking_id),
      customerId: stringOrNull(row.customer_id),
      version: numberOrNull(row.version),
      isCurrent: booleanOrNull(row.is_current),
      storagePath: stringOrNull(row.storage_path),
    })),
    rentals: mapRow(rentals, (row) => ({
      id: String(row.id),
      bookingId: stringOrNull(row.booking_id),
      customerId: stringOrNull(row.customer_id),
      vehicleId: stringOrNull(row.vehicle_id),
      endedAt: stringOrNull(row.ended_at),
    })),
    maintenance: mapRow(maintenance, (row) => ({
      id: String(row.id),
      vehicleId: stringOrNull(row.vehicle_id),
      status: stringOrNull(row.status),
      blocksRentalUse: booleanOrNull(row.blocks_rental_use),
    })),
    notifications: mapRow(notifications, (row) => ({
      id: String(row.id),
      recipientId: stringOrNull(row.recipient_id),
      notificationType: stringOrNull(row.notification_type),
      relatedEntityType: stringOrNull(row.related_entity_type),
      relatedEntityId: stringOrNull(row.related_entity_id),
      eventKey: stringOrNull(row.event_key),
    })),
    auditEvents: mapRow(auditEvents, (row) => ({
      id: String(row.id),
      actorType: stringOrNull(row.actor_type),
      actorUserId: stringOrNull(row.actor_user_id),
      action: stringOrNull(row.action),
      entityType: stringOrNull(row.entity_type),
      entityId: stringOrNull(row.entity_id),
      bookingId: stringOrNull(row.booking_id),
    })),
    storageObjects,
    coverage: mapRow(coverage, (row) => ({
      id: Number(row.id),
      trackingStartedAt: stringOrNull(row.tracking_started_at),
    })),
    decisionSupport,
  };
}

async function listAuthUsers(
  client: ReadSupabaseClient,
): Promise<AuthSnapshotRow[]> {
  const users: AuthSnapshotRow[] = [];
  for (let page = 1; ; page += 1) {
    const result = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error || !result.data || !Array.isArray(result.data.users))
      throw new ReadVerificationError("Auth users");
    for (const user of result.data.users) {
      if (typeof user.id !== "string")
        throw new ReadVerificationError("Auth users");
      users.push({
        id: user.id,
        emailConfirmedAt: stringOrNull(user.email_confirmed_at),
      });
    }
    if (result.data.users.length < 1000) break;
  }
  return users;
}

function keyToTableName(key: (typeof DECISION_TABLES)[number]): string {
  return {
    forecastRuns: "forecast_runs",
    forecastInputs: "forecast_inputs",
    forecasts: "forecasts",
    supplyEvaluations: "supply_evaluations",
    supplyEvaluationVehicles: "supply_evaluation_vehicles",
    allocationBatches: "allocation_recommendation_batches",
    allocationRecommendations: "allocation_recommendations",
    allocationCandidates: "allocation_recommendation_candidates",
  }[key];
}

function normalizeDecisionRows(
  rows: Record<string, unknown>[],
): DecisionRecordSpec[] {
  return rows.map((row) => {
    const mapped: DecisionRecordSpec = { id: String(row.id) };
    for (const [key, value] of Object.entries(row)) {
      if (key === "id") continue;
      mapped[snakeToCamel(key)] = value as
        | Primitive
        | Record<string, unknown>
        | Primitive[];
    }
    return mapped;
  });
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (isRecord(value)) return Object.values(value).flatMap(allStrings);
  return [];
}

function hasDuplicate(values: string[]): string | null {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}

function idsOf<T extends { id: string }>(rows: T[]): string[] {
  return rows.map((row) => row.id);
}

function ensureUniqueIds(label: string, rows: Array<{ id: string }>): void {
  const duplicate = hasDuplicate(idsOf(rows));
  if (duplicate)
    throw new ManifestError(`${label} contains duplicate ID ${duplicate}.`);
}

function countNotificationEvidence(manifest: DefenseManifest): number {
  return manifest.notificationEvidence.reduce(
    (total, evidence) =>
      total +
      (evidence.minimumCount ?? 1) *
        (evidence.entityRefs?.length ?? evidence.entityIds?.length ?? 0),
    0,
  );
}

function countAuditEvidence(manifest: DefenseManifest): number {
  return manifest.auditEvidence.reduce(
    (total, evidence) =>
      total +
      (evidence.minimumCount ?? 1) *
        (evidence.entityRefs?.length ?? (evidence.entityId ? 1 : 0)),
    0,
  );
}

function flattenDocuments(manifest: DefenseManifest): DocumentSpec[] {
  return manifest.requirements.flatMap((requirement) => requirement.documents);
}

function documentVerificationSpecs(manifest: DefenseManifest) {
  return manifest.requirements.flatMap((requirement) =>
    requirement.documents.map((document) => ({
      ...document,
      requirementSetId: requirement.id,
      bookingId: requirement.bookingId,
      customerId: requirement.customerId,
    })),
  );
}

function reviewVerificationSpecs(manifest: DefenseManifest) {
  return manifest.requirements.flatMap((requirement) =>
    requirement.reviews.map((review) => ({
      ...review,
      requirementSetId: requirement.id,
    })),
  );
}

function proofVerificationSpecs(manifest: DefenseManifest) {
  return manifest.payments.map((payment) => ({
    ...payment.proof,
    paymentId: payment.id,
    bookingId: payment.bookingId,
    customerId: payment.customerId,
  }));
}

function flattenReviews(manifest: DefenseManifest): ReviewSpec[] {
  return manifest.requirements.flatMap((requirement) => requirement.reviews);
}

function flattenProofs(manifest: DefenseManifest): ProofSpec[] {
  return manifest.payments.map((payment) => payment.proof);
}

function validateExpectedCounts(manifest: DefenseManifest): void {
  const expected = manifest.expectedCounts;
  const actual = {
    accounts: manifest.accounts.length,
    profiles: manifest.accounts.length,
    bookings: manifest.bookings.length,
    requirements: manifest.requirements.length,
    requirementDocuments: flattenDocuments(manifest).length,
    requirementReviews: flattenReviews(manifest).length,
    payments: manifest.payments.length,
    paymentProofs: flattenProofs(manifest).length,
    rentals: manifest.rentals.length,
    maintenance: manifest.maintenance.length,
    storageObjects:
      flattenDocuments(manifest).length + flattenProofs(manifest).length,
    notificationEvidence: countNotificationEvidence(manifest),
    auditEvidence: countAuditEvidence(manifest),
    forecastRuns: manifest.decisionSupport.forecastRuns.length,
    forecastInputs: manifest.decisionSupport.forecastInputs.length,
    forecasts: manifest.decisionSupport.forecasts.length,
    supplyEvaluations: manifest.decisionSupport.supplyEvaluations.length,
    supplyEvaluationVehicles:
      manifest.decisionSupport.supplyEvaluationVehicles.length,
    allocationBatches: manifest.decisionSupport.allocationBatches.length,
    allocationRecommendations:
      manifest.decisionSupport.allocationRecommendations.length,
    allocationCandidates: manifest.decisionSupport.allocationCandidates.length,
  };
  for (const [key, value] of Object.entries(actual)) {
    if (expected[key] !== value)
      throw new ManifestError(
        `Manifest expectedCounts.${key} does not match its records.`,
      );
  }
}

function validateManifestShape(
  value: unknown,
): asserts value is DefenseManifest {
  if (!isRecord(value)) throw new ManifestError("Manifest root is invalid.");
  if (value.schemaVersion !== 1)
    throw new ManifestError("Unsupported manifest schema version.");
  if (value.projectRef !== EXPECTED_PROJECT_REF)
    throw new ManifestError(
      "Manifest project ref is not the authorized project.",
    );
  if (
    value.markdownManifest !==
    "frontend-stabilization/DEFENSE-DATASET-MANIFEST.md"
  )
    throw new ManifestError(
      "Manifest Markdown source is not the approved file.",
    );
  if (
    typeof value.markdownSha256 !== "string" ||
    !/^[0-9a-f]{64}$/i.test(value.markdownSha256)
  )
    throw new ManifestError("Manifest Markdown digest is invalid.");
  for (const field of [
    "markdownManifest",
    "markdownSha256",
    "projectRef",
    "sourceCommit",
    "executionEvidenceCommit",
  ])
    requiredString(value[field], field);
  if (!isRecord(value.coverage))
    throw new ManifestError("Manifest coverage is invalid.");
  if (!isRecord(value.expectedCounts))
    throw new ManifestError("Manifest expectedCounts is invalid.");
  for (const count of Object.values(value.expectedCounts)) {
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0)
      throw new ManifestError(
        "Manifest expectedCounts contains an invalid value.",
      );
  }
  for (const field of [
    "accounts",
    "bookings",
    "requirements",
    "payments",
    "rentals",
    "maintenance",
    "notificationEvidence",
    "auditEvidence",
    "decisionSupport",
  ]) {
    if (
      !(field in value) ||
      (!Array.isArray(value[field]) && field !== "decisionSupport")
    )
      throw new ManifestError(`Manifest ${field} is invalid.`);
  }
  if (!isRecord(value.decisionSupport))
    throw new ManifestError("Manifest decisionSupport is invalid.");
  for (const key of DECISION_TABLES) {
    if (!Array.isArray(value.decisionSupport[key]))
      throw new ManifestError(`Manifest decisionSupport.${key} is invalid.`);
  }
  for (const account of value.accounts) {
    if (!isRecord(account))
      throw new ManifestError("Manifest account is invalid.");
    for (const field of ["label", "id", "fullName", "role", "accountStatus"])
      requiredString(account[field], `accounts.${field}`);
  }
  for (const collection of [
    value.bookings,
    value.requirements,
    value.payments,
    value.rentals,
    value.maintenance,
  ]) {
    for (const record of collection) {
      if (
        !isRecord(record) ||
        typeof record.id !== "string" ||
        typeof record.label !== "string"
      )
        throw new ManifestError("Manifest baseline record is invalid.");
    }
  }
  for (const booking of value.bookings) {
    requiredString(booking.pickupAt, "bookings.pickupAt");
    requiredString(booking.returnAt, "bookings.returnAt");
    if (
      !Number.isFinite(Date.parse(booking.pickupAt)) ||
      !Number.isFinite(Date.parse(booking.returnAt))
    )
      throw new ManifestError("Manifest booking schedule is invalid.");
  }
  const secretLike = allStrings(value).find((text) =>
    /(service[_-]?role|password|secret[_-]?key|access[_-]?token|api[_-]?key)/i.test(
      text,
    ),
  );
  if (secretLike)
    throw new ManifestError("Manifest contains a secret-like value.");
  for (const rows of [
    value.accounts,
    value.bookings,
    value.requirements,
    value.payments,
    value.rentals,
    value.maintenance,
    flattenDocuments(value),
    flattenReviews(value),
    flattenProofs(value),
  ])
    ensureUniqueIds("Manifest records", rows);
  validateExpectedCounts(value);

  const accountLabels = new Set(value.accounts.map((account) => account.label));
  const bookingLabels = new Set(value.bookings.map((booking) => booking.label));
  const requirementLabels = new Set(
    value.requirements.map((requirement) => requirement.label),
  );
  const paymentLabels = new Set(value.payments.map((payment) => payment.label));
  const rentalLabels = new Set(value.rentals.map((rental) => rental.label));
  const maintenanceLabels = new Set(
    value.maintenance.map((record) => record.label),
  );
  const checkRef = (ref: string, allowed: Set<string>, field: string) => {
    if (!allowed.has(ref))
      throw new ManifestError(
        `Manifest ${field} references unknown label ${ref}.`,
      );
  };
  for (const booking of value.bookings)
    checkRef(booking.label, accountLabels, "booking label");
  for (const requirement of value.requirements) {
    checkRef(requirement.label, accountLabels, "requirement label");
    if (!value.bookings.some((booking) => booking.id === requirement.bookingId))
      throw new ManifestError(
        `Requirement ${requirement.label} references an unknown booking.`,
      );
  }
  for (const payment of value.payments) {
    checkRef(payment.label, accountLabels, "payment label");
    if (!value.bookings.some((booking) => booking.id === payment.bookingId))
      throw new ManifestError(
        `Payment ${payment.label} references an unknown booking.`,
      );
  }
  for (const rental of value.rentals)
    checkRef(rental.label, accountLabels, "rental label");
  for (const record of value.maintenance)
    checkRef(record.label, new Set(["M01", "M02", "M03"]), "maintenance label");
  for (const evidence of value.notificationEvidence) {
    if (evidence.entityRefs) {
      const allowed =
        evidence.relatedEntityType === "booking"
          ? bookingLabels
          : evidence.relatedEntityType === "requirements"
            ? requirementLabels
            : evidence.relatedEntityType === "payment"
              ? paymentLabels
              : evidence.relatedEntityType === "rental"
                ? rentalLabels
                : new Set<string>();
      for (const ref of evidence.entityRefs)
        checkRef(ref, allowed, "notification evidence");
    }
    checkRef(evidence.recipientRef, accountLabels, "notification recipient");
  }
  for (const evidence of value.auditEvidence) {
    if (evidence.entityRefs) {
      const allowed =
        evidence.entityType === "booking"
          ? bookingLabels
          : evidence.entityType === "requirements"
            ? requirementLabels
            : evidence.entityType === "payment"
              ? paymentLabels
              : evidence.entityType === "rental"
                ? rentalLabels
                : maintenanceLabels;
      for (const ref of evidence.entityRefs)
        checkRef(ref, allowed, "audit evidence");
    }
    if (evidence.actorRef && evidence.actorRef !== "A01")
      checkRef(evidence.actorRef, accountLabels, "audit actor");
    if (evidence.bookingRef)
      checkRef(evidence.bookingRef, bookingLabels, "audit booking");
  }
}

export function validateManifest(
  value: unknown,
): asserts value is DefenseManifest {
  validateManifestShape(value);
}

export function loadManifest(
  manifestPath = resolve(process.cwd(), "scripts/defense/manifest.json"),
): DefenseManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    throw new ManifestError(
      "Unable to load the machine-readable Defense Dataset Manifest.",
    );
  }
  validateManifestShape(parsed);
  const markdownPath = resolve(process.cwd(), parsed.markdownManifest);
  let markdownDigest: string;
  try {
    markdownDigest = createHash("sha256")
      .update(readFileSync(markdownPath))
      .digest("hex");
  } catch {
    throw new ManifestError(
      "Unable to read the approved Markdown Defense Dataset Manifest.",
    );
  }
  if (markdownDigest !== parsed.markdownSha256)
    throw new ManifestError(
      "Markdown manifest and machine-readable manifest do not match.",
    );
  return parsed;
}

export function projectRefFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const suffix = ".supabase.co";
    if (url.protocol !== "https:" || !url.hostname.endsWith(suffix))
      return null;
    const ref = url.hostname.slice(0, -suffix.length);
    return /^[a-z0-9]+$/.test(ref) ? ref : null;
  } catch {
    return null;
  }
}

export function assertExactProjectRef(
  url: string,
  expected = EXPECTED_PROJECT_REF,
): void {
  const actual = projectRefFromUrl(url);
  if (actual !== expected)
    throw new ProjectGuardError(
      "Configured Supabase project identity is not authorized.",
    );
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sameValue(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (actual == null || expected == null) return false;
  if (typeof actual === "string" && typeof expected === "string") {
    const actualDate = Date.parse(actual);
    const expectedDate = Date.parse(expected);
    if (Number.isFinite(actualDate) && Number.isFinite(expectedDate))
      return actualDate === expectedDate;
  }
  return false;
}

function recordIndex<T extends { id: string }>(
  rows: T[],
  area: string,
  issues: VerificationIssue[],
): Map<string, T> {
  const index = new Map<string, T>();
  for (const row of rows) {
    if (!row.id) {
      issues.push({
        kind: "AMBIGUOUS / UNRESOLVED",
        area,
        message: `${area}: a row has no stable ID.`,
      });
      continue;
    }
    if (index.has(row.id)) {
      issues.push({
        kind: "AMBIGUOUS / UNRESOLVED",
        area,
        id: row.id,
        message: `${area}: duplicate row ID.`,
      });
      continue;
    }
    index.set(row.id, row);
  }
  return index;
}

function compareRecords<T extends { id: string }, E extends { id: string }>(
  area: string,
  expected: E[],
  actual: T[],
  fields: Array<[keyof E, keyof T]>,
  issues: VerificationIssue[],
): { present: number; extra: number } {
  const index = recordIndex(actual, area, issues);
  let present = 0;
  for (const expectedRow of expected) {
    const actualRow = index.get(expectedRow.id);
    if (!actualRow) {
      issues.push({
        kind: "MISSING BASELINE RECORD",
        area,
        id: expectedRow.id,
        message: `${area}: baseline record is missing.`,
      });
      continue;
    }
    present += 1;
    const changed = fields.filter(
      ([expectedField, actualField]) =>
        !sameValue(actualRow[actualField], expectedRow[expectedField]),
    );
    if (changed.length) {
      issues.push({
        kind: "MODIFIED BASELINE RECORD",
        area,
        id: expectedRow.id,
        message: `${area}: baseline record differs in ${changed.map(([field]) => String(field)).join(", ")}.`,
      });
    }
  }
  const expectedIds = new Set(expected.map((row) => row.id));
  const extra = actual.filter(
    (row) => row.id && !expectedIds.has(row.id),
  ).length;
  return { present, extra };
}

function checkResult(
  label: string,
  expectedBaseline: number,
  presentBaseline: number,
  issues: VerificationIssue[],
): CheckResult {
  return {
    label,
    pass: issues.length === 0,
    expectedBaseline,
    presentBaseline,
    issues,
  };
}

function addIssues(
  target: VerificationIssue[],
  source: VerificationIssue[],
): void {
  target.push(...source);
}

function accountId(manifest: DefenseManifest, label: string): string {
  const account = manifest.accounts.find((item) => item.label === label);
  if (!account) throw new ManifestError(`Unknown account label ${label}.`);
  return account.id;
}

function bookingByLabel(manifest: DefenseManifest, label: string): BookingSpec {
  const booking = manifest.bookings.find((item) => item.label === label);
  if (!booking) throw new ManifestError(`Unknown booking label ${label}.`);
  return booking;
}

function requirementByLabel(
  manifest: DefenseManifest,
  label: string,
): RequirementSpec {
  const requirement = manifest.requirements.find(
    (item) => item.label === label,
  );
  if (!requirement)
    throw new ManifestError(`Unknown requirement label ${label}.`);
  return requirement;
}

function paymentByLabel(manifest: DefenseManifest, label: string): PaymentSpec {
  const payment = manifest.payments.find((item) => item.label === label);
  if (!payment) throw new ManifestError(`Unknown payment label ${label}.`);
  return payment;
}

function rentalByLabel(manifest: DefenseManifest, label: string): RentalSpec {
  const rental = manifest.rentals.find((item) => item.label === label);
  if (!rental) throw new ManifestError(`Unknown rental label ${label}.`);
  return rental;
}

function maintenanceByLabel(
  manifest: DefenseManifest,
  label: string,
): MaintenanceSpec {
  const record = manifest.maintenance.find((item) => item.label === label);
  if (!record) throw new ManifestError(`Unknown maintenance label ${label}.`);
  return record;
}

function relatedEntityId(
  manifest: DefenseManifest,
  entityType: string,
  label: string,
): string {
  if (entityType === "booking") return bookingByLabel(manifest, label).id;
  if (entityType === "requirements")
    return requirementByLabel(manifest, label).id;
  if (entityType === "payment") return paymentByLabel(manifest, label).id;
  if (entityType === "rental") return rentalByLabel(manifest, label).id;
  if (entityType === "maintenance")
    return maintenanceByLabel(manifest, label).id;
  throw new ManifestError(`Unsupported evidence entity type ${entityType}.`);
}

function bookingIdForEntity(
  manifest: DefenseManifest,
  entityType: string,
  label: string,
): string | null {
  if (entityType === "booking") return bookingByLabel(manifest, label).id;
  if (entityType === "requirements")
    return requirementByLabel(manifest, label).bookingId;
  if (entityType === "payment")
    return paymentByLabel(manifest, label).bookingId;
  if (entityType === "rental") return rentalByLabel(manifest, label).bookingId;
  return null;
}

function customerIdForEntity(
  manifest: DefenseManifest,
  entityType: string,
  label: string,
): string | null {
  if (entityType === "booking")
    return bookingByLabel(manifest, label).customerId;
  if (entityType === "requirements")
    return requirementByLabel(manifest, label).customerId;
  if (entityType === "payment")
    return paymentByLabel(manifest, label).customerId;
  if (entityType === "rental") return rentalByLabel(manifest, label).customerId;
  return null;
}

function actualRequiredNotificationCount(
  rows: NotificationSnapshotRow[],
  evidence: NotificationEvidenceSpec,
  entityId: string,
  recipientId: string,
): number {
  return rows.filter(
    (row) =>
      row.recipientId === recipientId &&
      row.notificationType === evidence.notificationType &&
      row.relatedEntityType === evidence.relatedEntityType &&
      row.relatedEntityId === entityId,
  ).length;
}

function verifyNotifications(
  manifest: DefenseManifest,
  snapshot: DefenseSnapshot,
  issues: VerificationIssue[],
): number {
  let expected = 0;
  for (const evidence of manifest.notificationEvidence) {
    const minimumCount = evidence.minimumCount ?? 1;
    const entityIds =
      evidence.entityIds ??
      (evidence.entityRefs ?? []).map((label) =>
        relatedEntityId(manifest, evidence.relatedEntityType, label),
      );
    const recipientId = accountId(manifest, evidence.recipientRef);
    for (const entityId of entityIds) {
      expected += minimumCount;
      const count = actualRequiredNotificationCount(
        snapshot.notifications,
        evidence,
        entityId,
        recipientId,
      );
      if (count < minimumCount)
        issues.push({
          kind: "MISSING BASELINE RECORD",
          area: "Notifications",
          id: entityId,
          message: `Notifications: required baseline evidence is missing for ${evidence.notificationType}.`,
        });
    }
  }
  return expected;
}

function auditEvidenceRows(manifest: DefenseManifest): Array<{
  action: string;
  entityType: string;
  entityId: string;
  bookingId: string | null;
  actorUserId: string;
  minimumCount: number;
}> {
  const expected: Array<{
    action: string;
    entityType: string;
    entityId: string;
    bookingId: string | null;
    actorUserId: string;
    minimumCount: number;
  }> = [];
  for (const evidence of manifest.auditEvidence) {
    const labels = evidence.entityRefs ?? (evidence.entityId ? [null] : []);
    for (const label of labels) {
      const entityId =
        evidence.entityId ??
        relatedEntityId(manifest, evidence.entityType, label as string);
      const bookingId = evidence.bookingRef
        ? bookingByLabel(manifest, evidence.bookingRef).id
        : label
          ? bookingIdForEntity(manifest, evidence.entityType, label)
          : null;
      const actorUserId =
        evidence.actorRefMode === "customer"
          ? accountId(
              manifest,
              customerLabelForEntity(
                manifest,
                evidence.entityType,
                label as string,
              ),
            )
          : accountId(manifest, evidence.actorRef ?? "A01");
      expected.push({
        action: evidence.action,
        entityType: evidence.entityType,
        entityId,
        bookingId,
        actorUserId,
        minimumCount: evidence.minimumCount ?? 1,
      });
    }
  }
  return expected;
}

function customerLabelForEntity(
  manifest: DefenseManifest,
  entityType: string,
  label: string,
): string {
  const customerId = customerIdForEntity(manifest, entityType, label);
  const account = manifest.accounts.find((item) => item.id === customerId);
  if (!account)
    throw new ManifestError(`No customer account for ${entityType} ${label}.`);
  return account.label;
}

function verifyAudit(
  manifest: DefenseManifest,
  snapshot: DefenseSnapshot,
  issues: VerificationIssue[],
): number {
  const expected = auditEvidenceRows(manifest);
  for (const evidence of expected) {
    const count = snapshot.auditEvents.filter(
      (row) =>
        row.actorType === "User" &&
        row.actorUserId === evidence.actorUserId &&
        row.action === evidence.action &&
        row.entityType === evidence.entityType &&
        row.entityId === evidence.entityId &&
        row.bookingId === evidence.bookingId,
    ).length;
    if (count < evidence.minimumCount)
      issues.push({
        kind: "MISSING BASELINE RECORD",
        area: "Audit",
        id: evidence.entityId,
        message: `Audit: required baseline event ${evidence.action} is missing.`,
      });
  }
  return expected.reduce((total, evidence) => total + evidence.minimumCount, 0);
}

export function requiredNotificationEvidenceRows(
  manifest: DefenseManifest,
): NotificationSnapshotRow[] {
  const rows: NotificationSnapshotRow[] = [];
  let sequence = 1;
  for (const evidence of manifest.notificationEvidence) {
    const entityIds =
      evidence.entityIds ??
      (evidence.entityRefs ?? []).map((label) =>
        relatedEntityId(manifest, evidence.relatedEntityType, label),
      );
    const recipientId = accountId(manifest, evidence.recipientRef);
    for (const entityId of entityIds) {
      for (let count = 0; count < (evidence.minimumCount ?? 1); count += 1) {
        rows.push({
          id: `synthetic-notification-${String(sequence++).padStart(3, "0")}`,
          recipientId,
          notificationType: evidence.notificationType,
          relatedEntityType: evidence.relatedEntityType,
          relatedEntityId: entityId,
          eventKey: null,
        });
      }
    }
  }
  return rows;
}

export function requiredAuditEvidenceRows(
  manifest: DefenseManifest,
): AuditSnapshotRow[] {
  let sequence = 1;
  return auditEvidenceRows(manifest).flatMap((evidence) =>
    Array.from({ length: evidence.minimumCount }, () => ({
      id: `synthetic-audit-${String(sequence++).padStart(3, "0")}`,
      actorType: "User",
      actorUserId: evidence.actorUserId,
      action: evidence.action,
      entityType: evidence.entityType,
      entityId: evidence.entityId,
      bookingId: evidence.bookingId,
    })),
  );
}

function verifyStorage(
  manifest: DefenseManifest,
  snapshot: DefenseSnapshot,
  issues: VerificationIssue[],
): { expected: number; present: number; extra: number } {
  const expectedObjects = [
    ...flattenDocuments(manifest).map((document) => ({
      bucket: "renter-requirements" as const,
      hash: document.storagePathSha256,
      id: document.id,
    })),
    ...flattenProofs(manifest).map((proof) => ({
      bucket: "payment-proofs" as const,
      hash: proof.storagePathSha256,
      id: proof.id,
    })),
  ];
  const actualObjects = snapshot.storageObjects.map((object) => ({
    ...object,
    hash: object.pathSha256 ?? sha256(object.path),
  }));
  const expectedKeys = new Set(
    expectedObjects.map((object) => `${object.bucket}:${object.hash}`),
  );
  const actualKeys = new Set(
    actualObjects.map((object) => `${object.bucket}:${object.hash}`),
  );
  let present = 0;
  for (const object of expectedObjects) {
    if (actualKeys.has(`${object.bucket}:${object.hash}`)) present += 1;
    else
      issues.push({
        kind: "MISSING BASELINE RECORD",
        area: "Storage",
        id: object.id,
        message:
          "Storage: baseline object is missing or its private path changed.",
      });
  }
  return {
    expected: expectedObjects.length,
    present,
    extra: actualObjects.filter(
      (object) => !expectedKeys.has(`${object.bucket}:${object.hash}`),
    ).length,
  };
}

function verifyCoverage(
  manifest: DefenseManifest,
  snapshot: DefenseSnapshot,
  issues: VerificationIssue[],
): CheckResult {
  const expected = snapshot.coverage.filter(
    (row) => row.id === manifest.coverage.id,
  );
  if (expected.length === 0)
    issues.push({
      kind: "MISSING BASELINE RECORD",
      area: "Forecast coverage",
      id: String(manifest.coverage.id),
      message: "Forecast coverage singleton is missing.",
    });
  else if (
    !sameValue(
      expected[0].trackingStartedAt,
      manifest.coverage.trackingStartedAt,
    )
  )
    issues.push({
      kind: "MODIFIED BASELINE RECORD",
      area: "Forecast coverage",
      id: String(manifest.coverage.id),
      message: "Forecast coverage tracking start changed.",
    });
  return checkResult("Forecast coverage", 1, expected.length, issues);
}

function verifyDecisionSupport(
  manifest: DefenseManifest,
  snapshot: DefenseSnapshot,
  issues: VerificationIssue[],
): { check: CheckResult; extra: number } {
  const fields: Array<keyof DefenseManifest["decisionSupport"]> = [
    ...DECISION_TABLES,
  ];
  let expectedCount = 0;
  let presentCount = 0;
  let extra = 0;
  for (const key of fields) {
    const areaIssues: VerificationIssue[] = [];
    const expectedRows = manifest.decisionSupport[key];
    const actualRows = snapshot.decisionSupport[key];
    const compare = compareRecords(
      `Decision Support ${key}`,
      expectedRows,
      actualRows,
      Object.keys(expectedRows[0] ?? {})
        .filter((field) => field !== "id")
        .map((field) => [field, field]),
      areaIssues,
    );
    expectedCount += expectedRows.length;
    presentCount += compare.present;
    extra += compare.extra;
    addIssues(issues, areaIssues);
  }
  return {
    check: checkResult(
      "Decision Support (time-gated)",
      expectedCount,
      presentCount,
      issues.filter((issue) => issue.area.startsWith("Decision Support")),
    ),
    extra,
  };
}

export function verifyDefenseSnapshot(
  manifest: DefenseManifest,
  snapshot: DefenseSnapshot,
): VerificationReport {
  validateManifestShape(manifest);
  const issues: VerificationIssue[] = [];
  const checks: CheckResult[] = [];
  const extra = {
    accounts: 0,
    profiles: 0,
    bookings: 0,
    requirementSets: 0,
    requirementDocuments: 0,
    requirementReviews: 0,
    payments: 0,
    paymentProofs: 0,
    rentals: 0,
    maintenance: 0,
    storageObjects: 0,
    notifications: 0,
    auditEvents: 0,
    decisionSupport: 0,
  };

  const accountIssues: VerificationIssue[] = [];
  const profileCompare = compareRecords(
    "Accounts",
    manifest.accounts,
    snapshot.profiles,
    [
      ["id", "id"],
      ["fullName", "fullName"],
      ["role", "userType"],
      ["accountStatus", "accountStatus"],
    ],
    accountIssues,
  );
  const authIndex = recordIndex(
    snapshot.authUsers,
    "Auth accounts",
    accountIssues,
  );
  for (const account of manifest.accounts) {
    const authUser = authIndex.get(account.id);
    if (!authUser)
      accountIssues.push({
        kind: "MISSING BASELINE RECORD",
        area: "Accounts",
        id: account.id,
        message: "Auth account is missing.",
      });
    else if (!authUser.emailConfirmedAt)
      accountIssues.push({
        kind: "MODIFIED BASELINE RECORD",
        area: "Accounts",
        id: account.id,
        message: "Auth account is not confirmed.",
      });
  }
  const registeredOnlyIds = new Set(
    manifest.accounts
      .filter((account) => account.noChildWorkflow)
      .map((account) => account.id),
  );
  const registeredOnlyChildRows = [
    ...snapshot.bookings.map((row) => row.customerId),
    ...snapshot.requirements.map((row) => row.customerId),
    ...snapshot.documents.map((row) => row.customerId),
    ...snapshot.payments.map((row) => row.customerId),
    ...snapshot.proofs.map((row) => row.customerId),
    ...snapshot.rentals.map((row) => row.customerId),
  ];
  for (const accountId of registeredOnlyIds) {
    if (registeredOnlyChildRows.includes(accountId))
      accountIssues.push({
        kind: "MODIFIED BASELINE RECORD",
        area: "Accounts",
        id: accountId,
        message: "Registered-only baseline account has child workflow data.",
      });
  }
  extra.accounts = snapshot.authUsers.filter(
    (row) => !manifest.accounts.some((account) => account.id === row.id),
  ).length;
  extra.profiles = profileCompare.extra;
  checks.push(
    checkResult(
      "Accounts / Profiles",
      manifest.accounts.length,
      profileCompare.present,
      accountIssues,
    ),
  );
  addIssues(issues, accountIssues);

  const bookingIssues: VerificationIssue[] = [];
  const bookingCompare = compareRecords(
    "Bookings",
    manifest.bookings,
    snapshot.bookings,
    [
      ["id", "id"],
      ["customerId", "customerId"],
      ["status", "status"],
      ["pickupBranchId", "pickupBranchId"],
      ["returnBranchId", "returnBranchId"],
      ["pickupAt", "pickupAt"],
      ["returnAt", "returnAt"],
      ["requestedVehicleId", "requestedVehicleId"],
      ["assignedVehicleId", "assignedVehicleId"],
    ],
    bookingIssues,
  );
  extra.bookings = bookingCompare.extra;
  checks.push(
    checkResult(
      "Bookings",
      manifest.bookings.length,
      bookingCompare.present,
      bookingIssues,
    ),
  );
  addIssues(issues, bookingIssues);

  const requirementIssues: VerificationIssue[] = [];
  const requirementCompare = compareRecords(
    "Requirements",
    manifest.requirements,
    snapshot.requirements,
    [
      ["id", "id"],
      ["bookingId", "bookingId"],
      ["customerId", "customerId"],
      ["status", "status"],
    ],
    requirementIssues,
  );
  const documents = documentVerificationSpecs(manifest);
  const reviews = reviewVerificationSpecs(manifest);
  const documentCompare = compareRecords(
    "Requirement documents",
    documents,
    snapshot.documents,
    [
      ["id", "id"],
      ["requirementSetId", "requirementSetId"],
      ["bookingId", "bookingId"],
      ["customerId", "customerId"],
      ["type", "type"],
      ["version", "version"],
      ["isCurrent", "isCurrent"],
    ],
    requirementIssues,
  );
  for (const expectedDocument of documents) {
    const actualDocument = snapshot.documents.find(
      (document) => document.id === expectedDocument.id,
    );
    if (
      actualDocument &&
      (actualDocument.storagePathSha256 ??
        (actualDocument.storagePath
          ? sha256(actualDocument.storagePath)
          : null)) !== expectedDocument.storagePathSha256
    )
      requirementIssues.push({
        kind: "MODIFIED BASELINE RECORD",
        area: "Requirement documents",
        id: expectedDocument.id,
        message: "Requirement document private path fingerprint changed.",
      });
  }
  const reviewCompare = compareRecords(
    "Requirement reviews",
    reviews,
    snapshot.reviews,
    [
      ["id", "id"],
      ["requirementSetId", "requirementSetId"],
      ["reviewerId", "reviewerId"],
      ["resultingStatus", "resultingStatus"],
      ["governmentIdDocumentId", "governmentIdDocumentId"],
      ["governmentIdVersion", "governmentIdVersion"],
      ["driversLicenseDocumentId", "driversLicenseDocumentId"],
      ["driversLicenseVersion", "driversLicenseVersion"],
    ],
    requirementIssues,
  );
  extra.requirementSets = requirementCompare.extra;
  extra.requirementDocuments = documentCompare.extra;
  extra.requirementReviews = reviewCompare.extra;
  checks.push(
    checkResult(
      "Requirements",
      manifest.requirements.length,
      requirementCompare.present,
      requirementIssues,
    ),
  );
  addIssues(issues, requirementIssues);

  const paymentIssues: VerificationIssue[] = [];
  const paymentCompare = compareRecords(
    "Payments",
    manifest.payments,
    snapshot.payments,
    [
      ["id", "id"],
      ["bookingId", "bookingId"],
      ["customerId", "customerId"],
      ["status", "status"],
      ["paymentMethodId", "paymentMethodId"],
    ],
    paymentIssues,
  );
  const proofs = proofVerificationSpecs(manifest);
  const proofCompare = compareRecords(
    "Payment proofs",
    proofs,
    snapshot.proofs,
    [
      ["id", "id"],
      ["paymentId", "paymentId"],
      ["bookingId", "bookingId"],
      ["customerId", "customerId"],
      ["version", "version"],
      ["isCurrent", "isCurrent"],
    ],
    paymentIssues,
  );
  for (const expectedProof of proofs) {
    const actualProof = snapshot.proofs.find(
      (proof) => proof.id === expectedProof.id,
    );
    if (
      actualProof &&
      (actualProof.storagePathSha256 ??
        (actualProof.storagePath ? sha256(actualProof.storagePath) : null)) !==
        expectedProof.storagePathSha256
    )
      paymentIssues.push({
        kind: "MODIFIED BASELINE RECORD",
        area: "Payment proofs",
        id: expectedProof.id,
        message: "Payment proof private path fingerprint changed.",
      });
  }
  extra.payments = paymentCompare.extra;
  extra.paymentProofs = proofCompare.extra;
  checks.push(
    checkResult(
      "Payments",
      manifest.payments.length,
      paymentCompare.present,
      paymentIssues,
    ),
  );
  addIssues(issues, paymentIssues);

  const rentalIssues: VerificationIssue[] = [];
  const rentalCompare = compareRecords(
    "Rentals",
    manifest.rentals,
    snapshot.rentals,
    [
      ["id", "id"],
      ["bookingId", "bookingId"],
      ["customerId", "customerId"],
      ["vehicleId", "vehicleId"],
    ],
    rentalIssues,
  );
  for (const expectedRental of manifest.rentals) {
    const actualRental = snapshot.rentals.find(
      (rental) => rental.id === expectedRental.id,
    );
    const expectedActive = expectedRental.state === "Active";
    if (actualRental && (actualRental.endedAt == null) !== expectedActive)
      rentalIssues.push({
        kind: "MODIFIED BASELINE RECORD",
        area: "Rentals",
        id: expectedRental.id,
        message: "Rental active/returned state changed.",
      });
  }
  extra.rentals = rentalCompare.extra;
  checks.push(
    checkResult(
      "Rentals",
      manifest.rentals.length,
      rentalCompare.present,
      rentalIssues,
    ),
  );
  addIssues(issues, rentalIssues);

  const maintenanceIssues: VerificationIssue[] = [];
  const maintenanceCompare = compareRecords(
    "Maintenance",
    manifest.maintenance,
    snapshot.maintenance,
    [
      ["id", "id"],
      ["vehicleId", "vehicleId"],
      ["status", "status"],
      ["blocksRentalUse", "blocksRentalUse"],
    ],
    maintenanceIssues,
  );
  extra.maintenance = maintenanceCompare.extra;
  checks.push(
    checkResult(
      "Maintenance",
      manifest.maintenance.length,
      maintenanceCompare.present,
      maintenanceIssues,
    ),
  );
  addIssues(issues, maintenanceIssues);

  const storageIssues: VerificationIssue[] = [];
  const storage = verifyStorage(manifest, snapshot, storageIssues);
  extra.storageObjects = storage.extra;
  checks.push(
    checkResult("Storage", storage.expected, storage.present, storageIssues),
  );
  addIssues(issues, storageIssues);

  const notificationIssues: VerificationIssue[] = [];
  const notificationExpected = verifyNotifications(
    manifest,
    snapshot,
    notificationIssues,
  );
  extra.notifications = Math.max(
    0,
    snapshot.notifications.length - notificationExpected,
  );
  checks.push(
    checkResult(
      "Notifications baseline evidence",
      notificationExpected,
      notificationExpected - notificationIssues.length,
      notificationIssues,
    ),
  );
  addIssues(issues, notificationIssues);

  const auditIssues: VerificationIssue[] = [];
  const auditExpected = verifyAudit(manifest, snapshot, auditIssues);
  extra.auditEvents = Math.max(0, snapshot.auditEvents.length - auditExpected);
  checks.push(
    checkResult(
      "Audit baseline evidence",
      auditExpected,
      auditExpected - auditIssues.length,
      auditIssues,
    ),
  );
  addIssues(issues, auditIssues);

  const coverageIssues: VerificationIssue[] = [];
  checks.push(verifyCoverage(manifest, snapshot, coverageIssues));
  addIssues(issues, coverageIssues);

  const decisionIssues: VerificationIssue[] = [];
  const decisionResult = verifyDecisionSupport(
    manifest,
    snapshot,
    decisionIssues,
  );
  extra.decisionSupport = decisionResult.extra;
  checks.push(decisionResult.check);
  addIssues(issues, decisionIssues);

  const baselineIntact = issues.length === 0;
  const hasExtraUatData = Object.entries(extra)
    .filter(([key]) => !["notifications", "auditEvents"].includes(key))
    .some(([, count]) => count > 0);
  return {
    classification: !baselineIntact
      ? "DEFENSE BASELINE DRIFT DETECTED"
      : hasExtraUatData
        ? "DEFENSE BASELINE VERIFIED — UAT DATA PRESENT"
        : "DEFENSE BASELINE VERIFIED",
    baselineIntact,
    hasExtraUatData,
    checks,
    extra,
    issues,
  };
}

function statusFor(check: CheckResult): string {
  return check.pass ? "PASS" : "FAIL";
}

export function formatReport(
  projectRef: string,
  report: VerificationReport,
): string {
  const find = (label: string) =>
    report.checks.find((check) => check.label === label);
  const lines = [
    "Defense Dataset Verification",
    `Project: ${projectRef}`,
    `Baseline accounts: ${statusFor(find("Accounts / Profiles")!)}`,
    `Bookings: ${statusFor(find("Bookings")!)}`,
    `Requirements: ${statusFor(find("Requirements")!)}`,
    `Payments: ${statusFor(find("Payments")!)}`,
    `Rentals: ${statusFor(find("Rentals")!)}`,
    `Maintenance: ${statusFor(find("Maintenance")!)}`,
    `Storage: ${statusFor(find("Storage")!)}`,
    `Notifications baseline evidence: ${statusFor(find("Notifications baseline evidence")!)}`,
    `Audit baseline evidence: ${statusFor(find("Audit baseline evidence")!)}`,
    `Decision Support (time-gated): ${statusFor(find("Decision Support (time-gated)")!)}`,
    `Extra UAT accounts: ${report.extra.accounts}`,
    `Extra UAT profiles: ${report.extra.profiles}`,
    `Extra UAT bookings: ${report.extra.bookings}`,
    `Extra UAT requirement sets: ${report.extra.requirementSets}`,
    `Extra UAT payments: ${report.extra.payments}`,
    `Extra UAT rentals: ${report.extra.rentals}`,
    `Extra UAT maintenance: ${report.extra.maintenance}`,
    `Extra UAT Storage objects: ${report.extra.storageObjects}`,
    `Additional notifications allowed: ${report.extra.notifications}`,
    `Additional audit events allowed: ${report.extra.auditEvents}`,
    `Additional Decision Support rows: ${report.extra.decisionSupport}`,
    "",
    "Result:",
    report.classification,
  ];
  if (report.issues.length) {
    lines.push("", "Drift details:");
    for (const issue of report.issues.slice(0, 20))
      lines.push(
        `- ${issue.kind}: ${issue.area}${issue.id ? ` (${issue.id})` : ""}`,
      );
    if (report.issues.length > 20)
      lines.push(
        `- ${report.issues.length - 20} additional issue(s) not shown.`,
      );
  }
  return `${lines.join("\n")}\n`;
}

function configuredEnvironment(): { url: string; serviceRoleKey: string } {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey)
    throw new ProjectGuardError(
      "Required Supabase environment is unavailable.",
    );
  return { url, serviceRoleKey };
}

export async function runVerification(): Promise<number> {
  try {
    const manifest = loadManifest();
    const config = configuredEnvironment();
    assertExactProjectRef(config.url, manifest.projectRef);
    const client = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }) as unknown as ReadSupabaseClient;
    const snapshot = await readDefenseSnapshot(client);
    const report = verifyDefenseSnapshot(manifest, snapshot);
    process.stdout.write(formatReport(manifest.projectRef, report));
    return report.baselineIntact ? EXIT_OK : EXIT_DRIFT;
  } catch (error) {
    const message =
      error instanceof ManifestError ||
      error instanceof ProjectGuardError ||
      error instanceof ReadVerificationError
        ? error.message
        : "Verification could not complete safely.";
    process.stderr.write(
      `Defense Dataset Verification\nResult:\nVERIFICATION BLOCKED\nReason: ${message}\n`,
    );
    return EXIT_BLOCKED;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = await runVerification();
}
