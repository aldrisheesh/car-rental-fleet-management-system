import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AUTH_SPECS,
  CANONICAL_BRANCHES,
  HISTORICAL_AUTH_SPECS,
  HISTORICAL_FIXTURE_OWNER,
  HISTORICAL_OPERATOR_SPEC,
  VEHICLES,
  buildHistoricalFixtureDataset,
  buildFixtureDataset,
  fixtureAuthMetadata,
  historicalFixtureWeekStarts,
  isOwnedAuthUser,
  planRecords,
  validateFixtureDataset,
  type FixtureAuthIdentity,
} from "./fixture-inventory.ts";
import {
  calculateWma,
  extractWeeklyDemand,
} from "../../src/lib/forecasting.server.ts";
import {
  assertTargetAgreement,
  assertHistoricalCoverage,
  assertWriteSafety,
  planHistoricalCoverage,
  planHistoricalCoverageRestore,
  parseArguments,
  SIDE_EFFECT_TRIGGERS,
  SYNTHETIC_FORECAST_COVERAGE_FLAG,
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

function historicalDataset() {
  const identities: FixtureAuthIdentity[] = HISTORICAL_AUTH_SPECS.map(
    (spec, index) => ({
      ...spec,
      userId: uuid(index + 1),
    }),
  );
  const branches = Object.fromEntries(
    CANONICAL_BRANCHES.map((name, index) => [name, uuid(100 + index)]),
  );
  const vehicles = Object.fromEntries(
    VEHICLES.map(([plate, _name, branch], index) => [
      plate,
      { id: uuid(200 + index), branchId: branches[branch] },
    ]),
  );
  return buildHistoricalFixtureDataset({
    anchorDate: "2026-09-10",
    identities,
    branches,
    vehicles,
  });
}

test("CLI is dry-run by default and each write gate is explicit", () => {
  assert.deepEqual(parseArguments([]), {
    mode: "standard",
    apply: false,
    cleanup: false,
    includeAuthUsers: false,
    confirmProduction: false,
    confirmSyntheticForecastCoverage: false,
    anchorDate: undefined,
  });
  assert.deepEqual(parseArguments(["--cleanup"]), {
    mode: "standard",
    apply: false,
    cleanup: true,
    includeAuthUsers: false,
    confirmProduction: false,
    confirmSyntheticForecastCoverage: false,
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
  assert.equal(parseArguments(["--historical"]).mode, "historical");
  assert.equal(parseArguments(["--mode=historical"]).mode, "historical");
  assert.equal(
    parseArguments(["--historical", SYNTHETIC_FORECAST_COVERAGE_FLAG])
      .confirmSyntheticForecastCoverage,
    true,
  );
  assert.throws(
    () => parseArguments(["--historical", "--mode=standard"]),
    /conflicts/,
  );
  assert.throws(
    () => parseArguments([SYNTHETIC_FORECAST_COVERAGE_FLAG]),
    /valid only with --historical/,
  );
  assert.throws(
    () => parseArguments(["--mode=standard", SYNTHETIC_FORECAST_COVERAGE_FLAG]),
    /valid only with --historical/,
  );
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

test("historical inventory is deterministic, separate, and bounded", () => {
  const fixture = historicalDataset();
  const count = (table: string) =>
    fixture.records.filter((record) => record.table === table).length;
  assert.equal(fixture.definition.owner, HISTORICAL_FIXTURE_OWNER);
  assert.equal(
    fixture.definition.operatorSpec.label,
    HISTORICAL_OPERATOR_SPEC.label,
  );
  assert.equal(count("profiles"), 9);
  assert.equal(count("booking_requests"), 81);
  assert.equal(count("rental_transactions"), 75);
  assert.equal(count("maintenance_records"), 3);
  assert.equal(count("vehicle_operational_state_events"), 12);
  assert.equal(fixture.artifacts.length, 0);
  assert.equal(fixture.ids.requirements.length, 0);
  assert.equal(fixture.ids.payments.length, 0);
  assert(
    fixture.records.every((record) => record.label.startsWith("QA-HIST-")),
  );
  assert(
    fixture.records.every(
      (record) =>
        ![
          "forecast_runs",
          "forecasts",
          "forecast_inputs",
          "supply_evaluations",
          "supply_evaluation_vehicles",
          "allocation_recommendation_batches",
          "allocation_recommendations",
          "allocation_recommendation_candidates",
        ].includes(record.table),
    ),
  );
  assert.deepEqual(
    fixture.historical?.weekStarts,
    historicalFixtureWeekStarts("2026-09-10"),
  );
  assert.deepEqual(fixture.historical?.dateRange, {
    start: "2026-06-29",
    end: "2026-09-06",
  });
});

test("historical inventory supplies complete canonical demand history for WMA", () => {
  const fixture = historicalDataset();
  const branchIds = Object.fromEntries(
    CANONICAL_BRANCHES.map((name, index) => [name, uuid(100 + index)]),
  );
  const categoryByVehicleId = Object.fromEntries(
    VEHICLES.map(([_plate, _name, _branch, category], index) => [
      uuid(200 + index),
      category,
    ]),
  );
  const rows = fixture.records
    .filter((record) => record.table === "booking_requests")
    .map((record) => ({
      ...record.row,
      requested_vehicle: {
        category: {
          id: categoryByVehicleId[String(record.row.requested_vehicle_id)],
        },
      },
    }));
  const pairs = CANONICAL_BRANCHES.flatMap((branch) =>
    ["Economy", "Sedan", "SUV", "MPV", "Van", "Pickup"].map((category) => ({
      branchId: branchIds[branch],
      categoryId: category,
    })),
  );
  const actual = extractWeeklyDemand(
    rows,
    "2026-06-29T00:00:00+08:00",
    new Date("2026-09-10T00:00:00+08:00"),
    pairs,
  );
  const taftEconomy = actual.get(`${branchIds["Taft, Manila"]}:Economy`)!;
  const taftSedan = actual.get(`${branchIds["Taft, Manila"]}:Sedan`)!;
  const antipoloSedan = actual.get(`${branchIds["Antipolo, Rizal"]}:Sedan`)!;
  assert.equal(actual.size, 12);
  assert.equal(taftEconomy.length, 10);
  assert.deepEqual(
    taftEconomy.slice(-3).map((week) => week.demand),
    [3, 2, 3],
  );
  assert.deepEqual(
    taftSedan.slice(-3).map((week) => week.demand),
    [1, 2, 1],
  );
  assert.deepEqual(
    antipoloSedan.map((week) => week.demand),
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  );
  assert.equal(calculateWma(taftEconomy)?.forecasts[0], 2.7);
  assert.equal(calculateWma(taftSedan)?.forecasts[0], 1.3);
  assert.equal(calculateWma(antipoloSedan)?.forecasts[0], 0);
  assert.deepEqual(
    fixture.historical?.supplyComparisons.find(
      (comparison) => comparison.pair === "Taft, Manila · Economy",
    ),
    {
      pair: "Taft, Manila · Economy",
      firstWmaForecast: 2.7,
      requiredUnits: 3,
      referenceSupply: 2,
      balance: "Shortage",
    },
  );
  assert(
    fixture.historical?.nonZeroForecastPairs.includes("Taft, Manila · Economy"),
  );
  assert(
    fixture.historical?.scenarios.shortage.includes("Taft, Manila · Economy"),
  );
  assert(
    fixture.historical?.scenarios.surplus.includes("Antipolo, Rizal · Sedan"),
  );
  assert(
    fixture.historical?.scenarios.balanced.includes("Antipolo, Rizal · SUV"),
  );
});

function coverageReferences(trackingStartedAt: string) {
  return {
    branches: {},
    vehicles: {},
    paymentMethodId: "payment-method",
    demandCoverageStart: trackingStartedAt,
    demandCoverageState: {
      rowExists: true,
      trackingStartedAt,
    },
    unexpectedBranches: [],
  } as Parameters<typeof assertHistoricalCoverage>[1];
}

test("historical apply keeps the default insufficient-coverage refusal", () => {
  const fixture = historicalDataset();
  const references = coverageReferences("2026-09-01T02:42:18.555Z");
  assert.throws(
    () => assertHistoricalCoverage(fixture, references),
    new RegExp(SYNTHETIC_FORECAST_COVERAGE_FLAG),
  );
});

test("synthetic coverage authorization uses the exact historical window start", () => {
  const fixture = historicalDataset();
  const references = coverageReferences("2026-09-01T02:42:18.555Z");
  const plan = assertHistoricalCoverage(fixture, references, true);
  assert.equal(plan?.action, "update");
  assert.equal(plan?.proposedTrackingStartedAt, "2026-06-29T00:00:00+08:00");
  assert.deepEqual(plan?.snapshot.previous, {
    rowExists: true,
    trackingStartedAt: "2026-09-01T02:42:18.555Z",
  });
});

test("historical coverage apply is idempotent and cleanup restores the exact prior state", () => {
  const initial = {
    rowExists: true,
    trackingStartedAt: "2026-09-01T02:42:18.555Z",
  };
  const first = planHistoricalCoverage(initial, "2026-06-29", true);
  assert.equal(first.action, "update");
  if (first.action !== "update") return;
  const applied = {
    rowExists: true,
    trackingStartedAt: new Date(first.proposedTrackingStartedAt).toISOString(),
  };
  const repeated = planHistoricalCoverage(
    applied,
    "2026-06-29",
    true,
    first.snapshot,
  );
  assert.equal(repeated.action, "already-owned");
  const restore = planHistoricalCoverageRestore(
    applied,
    first.snapshot,
    "2026-06-29",
  );
  assert.equal(restore.action, "restore");
  assert.deepEqual(
    restore.action === "restore" ? restore.snapshot.previous : null,
    initial,
  );
});

test("historical cleanup refuses mismatched or unowned synthetic coverage", () => {
  const first = planHistoricalCoverage(
    { rowExists: true, trackingStartedAt: "2026-09-01T02:42:18.555Z" },
    "2026-06-29",
    true,
  );
  assert.equal(first.action, "update");
  if (first.action !== "update") return;
  assert.throws(
    () =>
      planHistoricalCoverageRestore(
        {
          rowExists: true,
          trackingStartedAt: "2026-06-30T00:00:00.000Z",
        },
        first.snapshot,
        "2026-06-29",
      ),
    /no longer matches|changed after restoration/,
  );
  assert.throws(
    () =>
      planHistoricalCoverageRestore(
        {
          rowExists: true,
          trackingStartedAt: "2026-06-28T16:00:00.000Z",
        },
        undefined,
        "2026-06-29",
      ),
    /ownership cannot be proven/,
  );
});

test("historical ownership and cleanup inventory are independent from standard QA", () => {
  const fixture = historicalDataset();
  const booking = fixture.records.find(
    (record) => record.label === "QA-HIST-BOOK-001",
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
        purpose_of_use: "uncontrolled operational row",
      },
    })[0].action,
    "collision",
  );
  assert.equal(fixture.ids.operationalStateEvents.length, 12);
  assert(
    fixture.records
      .filter((record) => record.table === "vehicle_operational_state_events")
      .every((record) =>
        fixture.ids.operationalStateEvents.includes(String(record.row.id)),
      ),
  );
  const metadata = fixtureAuthMetadata(
    HISTORICAL_OPERATOR_SPEC.label,
    fixture.anchorDate,
    fixture.definition,
  );
  assert.equal(
    isOwnedAuthUser(
      { email: HISTORICAL_OPERATOR_SPEC.email, app_metadata: metadata },
      HISTORICAL_OPERATOR_SPEC,
      fixture.definition,
    ),
    true,
  );
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
