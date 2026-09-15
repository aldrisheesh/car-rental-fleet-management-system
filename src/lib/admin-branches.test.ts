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

test("branch deactivation requires exact-entity confirmation on both controls", async () => {
  const source = await readFile(
    new URL("../routes/admin.branches.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /function requestBranchToggle\([\s\S]*?branch: BranchRecord,[\s\S]*?trigger: HTMLButtonElement,[\s\S]*?\)[\s\S]*?if \(branch\.is_active\) \{[\s\S]*?deactivationTriggerRef\.current = trigger;[\s\S]*?setDeactivationBranch\(branch\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?void toggleBranch\(branch\);/,
  );
  assert.match(
    source,
    /<BranchRow[\s\S]*?onToggle=\{\(trigger\) =>[\s\S]*?requestBranchToggle\(row\.record, trigger\)/,
  );
  assert.match(
    source,
    /<BranchDisclosure[\s\S]*?onToggle=\{\(trigger\) =>[\s\S]*?requestBranchToggle\(row\.record, trigger\)/,
  );
  assert.match(source, /<AlertDialog\s+open=\{Boolean\(deactivationBranch\)\}/);
  assert.match(
    source,
    /<AlertDialogTitle[^>]*>[\s\S]*?Deactivate \{deactivationBranch\?\.name\}\?[\s\S]*?<\/AlertDialogTitle>/,
  );
  assert.match(
    source,
    /This branch will become inactive\.\s+Existing historical records\s+remain unchanged\./,
  );
  assert.match(
    source,
    /<AlertDialogCancel[\s\S]*?>\s*Cancel\s*<\/AlertDialogCancel>/,
  );
  assert.match(
    source,
    /<AlertDialogAction[\s\S]*?event\.preventDefault\(\);[\s\S]*?confirmBranchDeactivation\(\)/,
  );
  assert.match(
    source,
    /onCloseAutoFocus=\{\(event\) => \{[\s\S]*?deactivationTriggerRef\.current[\s\S]*?trigger\.focus\(\)/,
  );
  const cancelSection = source.match(
    /<AlertDialogCancel[\s\S]*?<\/AlertDialogCancel>/,
  )?.[0];
  assert.ok(cancelSection);
  assert.doesNotMatch(cancelSection, /toggleBranch|saveMasterData/);
  assert.match(
    source,
    /const branch = deactivationBranch;[\s\S]*?if \(!branch \|\| deactivationSubmissionRef\.current\) return;[\s\S]*?toggleBranch\(branch\)/,
  );
});

test("branch activation stays canonical and branch changes never use DELETE", async () => {
  const source = await readFile(
    new URL("../routes/admin.branches.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /isActive: !branch\.is_active/);
  assert.match(source, /id: branch\.id/);
  assert.doesNotMatch(source, /method:\s*["']DELETE["']/);
  assert.doesNotMatch(source, /fetch\([^)]*,\s*\{[\s\S]*?DELETE/);
});
