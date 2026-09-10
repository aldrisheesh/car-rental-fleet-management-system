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

test("branch management renders canonical state without prototype analytics", async () => {
  const source = await readFile(
    new URL("../routes/admin.branches.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /@\/data\/admin|branchPerformance|Active rentals|Fleet on-site|Demand score|Monthly revenue|MoM|Flagship|Suburban hub/,
  );
  assert.match(source, /fetchMasterData<BranchRecord>\("branches"\)/);
  assert.match(source, /fetchMasterData<ApiMasterVehicle>\("vehicles"\)/);
  assert.match(source, /buildAdminBranchRows\(branches, vehicles\)/);
  assert.match(source, /label="Assigned vehicles"/);
});
