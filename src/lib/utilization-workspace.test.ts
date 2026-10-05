import assert from "node:assert/strict";
import test from "node:test";
import {
  reportingRangeError,
  filterUtilizationRows,
  utilizationUnavailableReason,
  idleExplanation,
  currentUtilizationFleet,
  type VehicleAnalyticsRow,
} from "./utilization-workspace.ts";
const vehicle = (
  overrides: Partial<VehicleAnalyticsRow> = {},
): VehicleAnalyticsRow => ({
  vehicleId: "a",
  name: "Vios",
  licensePlate: "PLATE-1",
  branchId: "taft",
  branch: "Taft",
  categoryId: "sedan",
  category: "Sedan",
  isActive: true,
  reportingStart: "2026-09-05",
  reportingEnd: "2026-10-04",
  coverage: "Complete",
  rentalDays: 0,
  eligibleOperationalDays: 30,
  utilizationPercent: 0,
  maintenanceReady: true,
  maintenanceReasons: [],
  activeRental: false,
  idleEligible: true,
  idleReference: "2026-09-01T00:00:00Z",
  idleDays: 33,
  idleClassification: "Idle",
  ...overrides,
});
test("current fleet utilization excludes retired fixtures without dropping active maintenance or rental cases", () => {
  const rows = [
    vehicle({ vehicleId: "archived", isActive: false, rentalDays: 3 }),
    vehicle({ vehicleId: "maintenance", maintenanceReady: false }),
    vehicle({ vehicleId: "on-rental", activeRental: true }),
    vehicle({ vehicleId: "ready" }),
  ];
  assert.deepEqual(
    currentUtilizationFleet(rows).map((row) => row.vehicleId),
    ["maintenance", "on-rental", "ready"],
  );
  assert.equal(rows.length, 4);
});
test("reporting dates reject normalized invalid dates, future activity, reversals and overlong periods", () => {
  for (const [start, end] of [
    ["2026-02-30", "2026-10-04"],
    ["2026-10-05", "2026-10-04"],
    ["2026-10-04", "2026-10-05"],
    ["2025-01-01", "2026-10-04"],
    ["", "2026-10-04"],
  ])
    assert.ok(reportingRangeError(start, end, "2026-10-04"));
  assert.equal(
    reportingRangeError("2026-10-04", "2026-10-04", "2026-10-04"),
    "",
  );
  assert.equal(
    reportingRangeError("2025-10-04", "2026-10-04", "2026-10-04"),
    "",
  );
});
test("utilization filters use canonical IDs and retain unavailable rows instead of inventing rates", () => {
  const rows = [
    vehicle(),
    vehicle({
      vehicleId: "b",
      branchId: "rizal",
      categoryId: "suv",
      name: "Rush",
      idleClassification: "Unable to Determine",
      utilizationPercent: null,
    }),
    vehicle({
      vehicleId: "c",
      name: "Corolla",
      idleClassification: "Not Idle",
      utilizationPercent: 20,
    }),
  ];
  const all = { branch: "all", category: "all", status: "All", query: "" };
  assert.deepEqual(
    filterUtilizationRows(rows, all).map((row) => row.vehicleId),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    filterUtilizationRows(rows, {
      ...all,
      branch: "rizal",
      category: "suv",
      status: "Unable to Determine",
    }).map((row) => row.vehicleId),
    ["b"],
  );
  assert.equal(
    filterUtilizationRows(rows, { ...all, query: "plate-1", category: "sedan" })
      .length,
    2,
  );
  assert.deepEqual(
    filterUtilizationRows(rows, { ...all, branch: "stale-id" }),
    [],
  );
});
test("incomplete eligibility coverage and zero denominators never imply measured full-period utilization", () => {
  assert.equal(utilizationUnavailableReason(vehicle()), "");
  assert.match(
    utilizationUnavailableReason(
      vehicle({
        coverage: "Partial/Insufficient Historical Eligibility Data",
        utilizationPercent: 50,
      }),
    ),
    /incomplete/,
  );
  assert.match(
    utilizationUnavailableReason(
      vehicle({ eligibleOperationalDays: 0, utilizationPercent: null }),
    ),
    /No eligible/,
  );
  assert.match(
    utilizationUnavailableReason(
      vehicle({ eligibleOperationalDays: null, utilizationPercent: null }),
    ),
    /unavailable/,
  );
});
test("idle explanations distinguish blockers and missing baselines from the actual idle threshold", () => {
  assert.match(idleExplanation(vehicle()), /14 consecutive/);
  assert.match(
    idleExplanation(
      vehicle({ activeRental: true, idleClassification: "Not Idle" }),
    ),
    /active rental/,
  );
  assert.match(idleExplanation(vehicle({ isActive: false })), /inactive/);
  assert.match(
    idleExplanation(vehicle({ maintenanceReady: false })),
    /not eligible/,
  );
  assert.match(
    idleExplanation(
      vehicle({
        idleReference: null,
        idleDays: null,
        idleClassification: "Unable to Determine",
      }),
    ),
    /cannot tell/,
  );
  assert.match(
    idleExplanation(vehicle({ idleDays: 5, idleClassification: "Not Idle" })),
    /Fewer than 14 days/,
  );
});

test("idle duration is not presented as applicable to a vehicle that fails current eligibility", async () => {
  const { idleDaysForDisplay } = await import("./utilization-workspace.ts");
  assert.equal(idleDaysForDisplay(vehicle()), 33);
  assert.equal(
    idleDaysForDisplay(vehicle({ idleEligible: false, activeRental: true })),
    "Not applicable",
  );
  assert.equal(
    idleDaysForDisplay(
      vehicle({ idleEligible: false, maintenanceReady: false }),
    ),
    "Not applicable",
  );
  assert.equal(idleDaysForDisplay(vehicle({ idleDays: null })), null);
});
