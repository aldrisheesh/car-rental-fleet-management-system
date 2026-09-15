import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function routeSource(name: string) {
  return readFile(new URL(`../routes/${name}`, import.meta.url), "utf8");
}

test("Slice 2 management routes keep Owner/Admin-only boundaries", async () => {
  const sources = await Promise.all([
    routeSource("admin.fleet.tsx"),
    routeSource("admin.maintenance.tsx"),
    routeSource("admin.branches.tsx"),
    routeSource("admin.users.tsx"),
    routeSource("admin.activity.tsx"),
  ]);

  for (const source of sources) {
    assert.match(source, /getAdminSession/);
    assert.match(source, /isStaffRole/);
    assert.match(source, /redirect\(\{ to: "\/admin" \}\)/);
  }
});

test("fleet and maintenance project canonical state without persisted readiness", async () => {
  const [fleet, maintenance] = await Promise.all([
    routeSource("admin.fleet.tsx"),
    routeSource("admin.maintenance.tsx"),
  ]);

  assert.match(fleet, /fetch\("\/api\/admin-fleet"/);
  assert.match(fleet, /Ready — derived/);
  assert.match(fleet, /Canonical returns/);
  assert.doesNotMatch(fleet, /setReady|readyState|statusOverrides/);
  assert.match(maintenance, /fetch\("\/api\/maintenance"/);
  assert.match(maintenance, /method: "POST"/);
  assert.match(maintenance, /method: "PATCH"/);
  assert.doesNotMatch(maintenance, /method: "DELETE"/);
});

test("branches, users, reports, decision support, and audit stay within accepted contracts", async () => {
  const [branches, users, reports, decisions, audit] = await Promise.all([
    routeSource("admin.branches.tsx"),
    routeSource("admin.users.tsx"),
    routeSource("admin.reports.tsx"),
    routeSource("admin.decisions.tsx"),
    routeSource("admin.activity.tsx"),
  ]);

  assert.match(branches, /fetchMasterData<BranchRecord>\("branches"\)/);
  assert.match(branches, /fetchMasterData<ApiMasterVehicle>\("vehicles"\)/);
  assert.match(branches, /buildAdminBranchRows\(branches, vehicles\)/);
  assert.match(branches, /label="Assigned vehicles"/);
  assert.doesNotMatch(branches, /monthly revenue|staffing capacity|geofenc/i);

  assert.match(users, /APP_ROLES/);
  assert.match(users, /method: "PATCH"/);
  assert.doesNotMatch(
    users,
    /create user|delete user|Edit profile|setAdminProfile/i,
  );

  assert.match(reports, /\/api\/admin-reports/);
  assert.match(reports, /Apply/);
  assert.match(reports, /Reset/);
  assert.doesNotMatch(reports, /revenue|profit|export controls/i);

  assert.match(decisions, /\/api\/forecasts/);
  assert.match(decisions, /\/api\/supply-evaluations/);
  assert.match(decisions, /\/api\/vehicle-analytics/);
  assert.match(decisions, /\/api\/allocation-recommendations/);
  assert.match(decisions, /advisory/i);
  assert.doesNotMatch(decisions, /High confidence|Toyota Hilux|NDA 6610/);

  assert.match(audit, /\/api\/audit-events/);
  assert.match(audit, /summarizeAuditEvent/);
  assert.match(audit, /Apply/);
  assert.match(audit, /Clear/);
  assert.doesNotMatch(audit, /method: "(PATCH|DELETE)"/);
});
