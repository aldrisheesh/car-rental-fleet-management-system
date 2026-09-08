import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AUTH_SPECS,
  CANONICAL_BRANCHES,
  VEHICLES,
  buildFixtureDataset,
  fixtureAuthMetadata,
  isOwnedAuthUser,
  planRecords,
  validateFixtureDataset,
  type FixtureAuthIdentity,
} from "./fixture-inventory.ts";
import {
  assertTargetAgreement,
  assertWriteSafety,
  parseArguments,
  SIDE_EFFECT_TRIGGERS,
} from "./controlled-fixtures.ts";

function uuid(number: number) {
  return `10000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
}

function dataset() {
  const identities: FixtureAuthIdentity[] = AUTH_SPECS.map((spec, index) => ({
    ...spec,
    userId: uuid(index + 1),
  }));
  const branches = Object.fromEntries(
    CANONICAL_BRANCHES.map((name, index) => [name, uuid(100 + index)]),
  );
  const vehicles = Object.fromEntries(
    VEHICLES.map(([plate, _name, branch], index) => [
      plate,
      { id: uuid(200 + index), branchId: branches[branch] },
    ]),
  );
  return buildFixtureDataset({
    anchorDate: "2026-09-08",
    identities,
    branches,
    vehicles,
    paymentMethodId: uuid(300),
  });
}

test("CLI is dry-run by default and each write gate is explicit", () => {
  assert.deepEqual(parseArguments([]), {
    apply: false,
    cleanup: false,
    includeAuthUsers: false,
    confirmProduction: false,
    anchorDate: undefined,
  });
  assert.deepEqual(parseArguments(["--cleanup"]), {
    apply: false,
    cleanup: true,
    includeAuthUsers: false,
    confirmProduction: false,
    anchorDate: undefined,
  });
  const write = parseArguments([
    "--apply",
    "--include-auth-users",
    "--confirm-production-fixtures",
  ]);
  assert.equal(write.apply, true);
  assert.equal(write.includeAuthUsers, true);
  assert.equal(write.confirmProduction, true);
  assert.throws(() => parseArguments(["--force"]), /Unknown argument/);
});

test("the moderate dataset has bounded canonical coverage", () => {
  const fixture = dataset();
  const count = (table: string) =>
    fixture.records.filter((record) => record.table === table).length;
  assert.equal(count("profiles"), 11);
  assert.equal(count("booking_requests"), 22);
  assert.equal(count("renter_requirement_sets"), 10);
  assert.equal(count("renter_requirement_documents"), 18);
  assert.equal(count("renter_requirement_reviews"), 8);
  assert.equal(count("payments"), 7);
  assert.equal(count("payment_proofs"), 7);
  assert.equal(count("rental_transactions"), 5);
  assert.equal(count("maintenance_records"), 5);
  assert.equal(fixture.artifacts.length, 25);

  const maintenance = fixture.records.filter(
    (record) => record.table === "maintenance_records",
  );
  assert.deepEqual(
    new Set(maintenance.map((record) => record.row.status)),
    new Set(["Completed", "Cancelled"]),
  );
  assert(maintenance.every((record) => record.row.blocks_rental_use === false));
  assert(fixture.records.every((record) => !record.label.startsWith("DEV-")));
  assert(
    fixture.records.every(
      (record) =>
        ![
          "audit_events",
          "notifications",
          "forecast_runs",
          "forecasts",
          "supply_evaluations",
          "allocation_recommendations",
        ].includes(record.table),
    ),
  );
  assert(
    fixture.artifacts.every((artifact) =>
      new TextDecoder().decode(artifact.body).includes("NOT A REAL"),
    ),
  );

  const bookings = new Map(
    fixture.records
      .filter((record) => record.table === "booking_requests")
      .map((record) => [record.row.id, record.row]),
  );
  const requirements = new Map(
    fixture.records
      .filter((record) => record.table === "renter_requirement_sets")
      .map((record) => [record.row.booking_id, record.row]),
  );
  const payments = new Map(
    fixture.records
      .filter((record) => record.table === "payments")
      .map((record) => [record.row.booking_id, record.row]),
  );
  for (const booking of bookings.values()) {
    if (booking.booking_status === "Confirmed") {
      assert.equal(requirements.get(booking.id)?.status, "Verified");
      assert.equal(payments.get(booking.id)?.status, "Verified");
      assert(booking.assigned_vehicle_id);
    }
  }
  for (const payment of payments.values()) {
    assert.equal(requirements.get(payment.booking_id)?.status, "Verified");
    assert.notEqual(
      bookings.get(payment.booking_id)?.booking_status,
      "Rejected",
    );
    assert.notEqual(
      bookings.get(payment.booking_id)?.booking_status,
      "Cancelled",
    );
  }
});

test("duplicate fixture identifiers and artifact paths are rejected", () => {
  const fixture = dataset();
  const duplicate = {
    ...fixture,
    records: [...fixture.records, fixture.records[0]],
  };
  assert.throws(
    () => validateFixtureDataset(duplicate),
    /Duplicate fixture identifiers/,
  );
});

test("idempotency skips owned rows and rejects an unknown collision", () => {
  const fixture = dataset();
  const booking = fixture.records.find(
    (record) => record.label === "QA-BOOK-001",
  )!;
  assert.equal(
    planRecords([booking], { [String(booking.row.id)]: { ...booking.row } })[0]
      .action,
    "skip",
  );
  assert.equal(
    planRecords([booking], {
      [String(booking.row.id)]: {
        ...booking.row,
        purpose_of_use: "legitimate operational booking",
      },
    })[0].action,
    "collision",
  );
  assert.equal(planRecords([booking], {})[0].action, "create");
});

test("Auth ownership requires both exact synthetic email and metadata", () => {
  const spec = AUTH_SPECS[1];
  const metadata = fixtureAuthMetadata(spec.label, "2026-09-08");
  assert.equal(
    isOwnedAuthUser({ email: spec.email, app_metadata: metadata }, spec),
    true,
  );
  assert.equal(
    isOwnedAuthUser({ email: spec.email, app_metadata: {} }, spec),
    false,
  );
  assert.equal(
    isOwnedAuthUser(
      { email: "person@example.com", app_metadata: metadata },
      spec,
    ),
    false,
  );
});

test("API and database credentials must identify the same Supabase project", () => {
  assert.doesNotThrow(() =>
    assertTargetAgreement(
      "https://abc123.supabase.co",
      "postgresql://postgres.abc123:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
    ),
  );
  assert.throws(
    () =>
      assertTargetAgreement(
        "https://abc123.supabase.co",
        "postgresql://postgres.xyz789:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
      ),
    /do not identify the same Supabase project/,
  );
  assert.throws(
    () =>
      assertTargetAgreement(
        "https://api.example.test",
        "postgresql://user:secret@database.example.test/postgres",
        true,
      ),
    /cannot be identified/,
  );
});

test("production apply requires its second acknowledgement", () => {
  assert.doesNotThrow(() => assertWriteSafety("production", false, false));
  assert.doesNotThrow(() => assertWriteSafety("staging", true, false));
  assert.doesNotThrow(() => assertWriteSafety("production", true, true));
  assert.throws(
    () => assertWriteSafety("production", true, false),
    /--confirm-production-fixtures/,
  );
});

test("apply suppresses only the named insert side-effect triggers", () => {
  assert.deepEqual(SIDE_EFFECT_TRIGGERS, [
    ["booking_requests", "booking_requests_notify_created"],
    ["booking_requests", "booking_requests_audit_lifecycle"],
    ["renter_requirement_reviews", "renter_requirement_reviews_notify_result"],
    ["rental_transactions", "rental_transactions_audit_lifecycle"],
    ["maintenance_records", "maintenance_records_audit_lifecycle"],
  ]);
  const source = readFileSync(
    new URL("./controlled-fixtures.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /disable trigger (all|user)/i);
  assert.doesNotMatch(source, /briah-car-rental\.vercel\.app/);
});
