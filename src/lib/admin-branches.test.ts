import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildAdminBranchRows } from "./admin-branches.ts";

test("branch vehicle counts use canonical branch assignments", () => {
  const rows = buildAdminBranchRows(
    [
      {
        id: "branch-1",
        name: "Canonical One",
        address: null,
        is_active: true,
      },
      {
        id: "branch-2",
        name: "Canonical Two",
        address: "Canonical address",
        is_active: false,
      },
    ],
    [
      { branch_id: "branch-1" },
      { branch_id: "branch-1" },
      { branch_id: "branch-2" },
      { branch_id: null },
    ],
  );

  assert.deepEqual(
    rows.map((row) => [row.record.id, row.assignedVehicleCount]),
    [
      ["branch-1", 2],
      ["branch-2", 1],
    ],
  );
});

test("location editor retains canonical counts and excludes prototype analytics", async () => {
  const source = await readFile(
    new URL("../routes/admin.branches.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /@\/data\/admin|branchPerformance|Active rentals|Fleet on-site|Demand score|Monthly revenue|MoM|Flagship|Suburban hub/,
  );
  assert.match(source, /fetchMasterData<Branch>\("branches"\)/);
  assert.match(source, /fetchMasterData<ApiMasterVehicle>\("vehicles"\)/);
  assert.match(source, /buildAdminBranchRows\(branches, vehicles\)/);
  assert.match(source, /assignedVehicleCount/);
  assert.match(source, /AddressAutocomplete/);
  assert.match(source, /id="location-address"/);
  assert.match(source, /Find address/);
  assert.doesNotMatch(source, /Matched address/);
  assert.doesNotMatch(source, /DssLocationConfirmation/);
});

test("both inactive selection and quiet action pass through entity confirmation", async () => {
  const source = await readFile(
    new URL("../routes/admin.branches.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /branch\.is_active && !active && !create/);
  assert.match(source, /onClick=\{\(\) => setDeactivate\(true\)\}/);
  assert.match(source, /Deactivate \{branch\.name\}\?/);
  assert.match(source, /Historical records remain\s+unchanged/);
  assert.match(source, /void save\(true\)/);
  assert.match(source, /Discard unsaved changes/);
});

test("activation and editing use one server save and never delete a location", async () => {
  const source = await readFile(
    new URL("../routes/admin.branches.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /action: "save"/);
  assert.match(source, /branchId: branch\.id/);
  assert.match(source, /isActive: forceInactive \? false : active/);
  assert.doesNotMatch(source, /method:\s*["']DELETE["']/);
});
