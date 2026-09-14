import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { evaluateMaintenanceReadiness } from "./maintenance-readiness.ts";
import {
  buildVehicleBranchUpdateInput,
  saveMasterData,
  type ApiMasterVehicle,
} from "./master-data-client.ts";

const canonicalVehicle: ApiMasterVehicle = {
  id: "vehicle-17",
  name: "Toyota Fortuner",
  category_id: "category-suv",
  branch_id: "branch-a",
  license_plate: null,
  transmission: "Automatic",
  fuel_type: "Diesel",
  seat_capacity: 7,
  daily_rate: 4321,
  reference_fuel_efficiency_km_per_liter: 13.4,
  current_odometer_km: 81234,
  condition_blocks_rental_use: true,
  image_url: "https://cdn.example.test/fortuner-custom.jpg",
  is_active: true,
  branch: { id: "branch-a", name: "Branch A" },
  category: { id: "category-suv", name: "SUV" },
};

const maintenanceTarget = [
  {
    status: "Completed",
    maintenance_type: "Oil Service",
    next_service_odometer: 90000,
    next_service_date: null,
    completed_at: "2026-08-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    blocks_rental_use: false,
  },
];

test("branch reassignment preserves the complete canonical vehicle input", () => {
  const input = buildVehicleBranchUpdateInput(canonicalVehicle, "branch-b");

  assert.deepEqual(input, {
    name: "Toyota Fortuner",
    branchId: "branch-b",
    categoryId: "category-suv",
    licensePlate: null,
    transmission: "Automatic",
    seatCapacity: 7,
    dailyRate: 4321,
    isActive: true,
    fuelType: "Diesel",
    referenceFuelEfficiency: 13.4,
    imageUrl: "https://cdn.example.test/fortuner-custom.jpg",
    currentOdometerKm: 81234,
    conditionBlocksRentalUse: true,
  });
});

test("branch reassignment preserves readiness inputs and derived readiness", () => {
  const input = buildVehicleBranchUpdateInput(canonicalVehicle, "branch-b");
  const before = evaluateMaintenanceReadiness(
    {
      is_active: canonicalVehicle.is_active,
      current_odometer_km: canonicalVehicle.current_odometer_km,
      condition_blocks_rental_use: canonicalVehicle.condition_blocks_rental_use,
    },
    maintenanceTarget,
    "2026-09-14",
  );
  const after = evaluateMaintenanceReadiness(
    {
      is_active: input.isActive,
      current_odometer_km: input.currentOdometerKm,
      condition_blocks_rental_use: input.conditionBlocksRentalUse,
    },
    maintenanceTarget,
    "2026-09-14",
  );

  assert.equal(input.currentOdometerKm, 81234);
  assert.equal(input.conditionBlocksRentalUse, true);
  assert.deepEqual(after, before);
  assert.deepEqual(after, {
    maintenanceReady: false,
    reasons: ["Vehicle condition blocks rental use"],
  });
});

test("the write uses PATCH with the exact selected vehicle and preserved input", async () => {
  let request: RequestInit | undefined;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    request = init;
    return new Response(JSON.stringify({ id: canonicalVehicle.id }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    await saveMasterData({
      resource: "vehicles",
      id: canonicalVehicle.id,
      input: buildVehicleBranchUpdateInput(canonicalVehicle, "branch-b"),
    });
  } finally {
    globalThis.fetch = previousFetch;
  }

  assert.equal(request?.method, "PATCH");
  assert.deepEqual(JSON.parse(String(request?.body)), {
    resource: "vehicles",
    id: "vehicle-17",
    input: buildVehicleBranchUpdateInput(canonicalVehicle, "branch-b"),
  });
});

test("Fleet resolves the canonical vehicle by the selected row ID", async () => {
  const source = await readFile(
    new URL("../routes/admin.fleet.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /fetchMasterData<ApiMasterVehicle>\("vehicles"\)/);
  assert.match(source, /candidate\.id === vehicle\.id/);
  assert.match(source, /id: vehicle\.id/);
  assert.match(
    source,
    /buildVehicleBranchUpdateInput\(canonicalVehicle, branchId\)/,
  );
});
