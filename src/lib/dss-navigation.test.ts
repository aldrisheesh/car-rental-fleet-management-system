import assert from "node:assert/strict";
import test from "node:test";
import { dssView, parseDssSearch } from "./dss-navigation.ts";

test("DSS screen routing retains legacy evidence anchors", () => {
  assert.equal(dssView("/admin/decisions", ""), "forecast");
  assert.equal(dssView("/admin/decisions", "admin-main"), "forecast");
  assert.equal(dssView("/admin/decisions", "#admin-main"), "forecast");
  assert.equal(dssView("/admin/decisions", "transfer-review"), "overview");
  assert.equal(dssView("/admin/decisions", "vehicle-attention"), "overview");
  assert.equal(dssView("/admin/decisions/allocation", ""), "allocation");
  assert.equal(dssView("/admin/decisions/utilization", ""), "utilization");
  assert.equal(dssView("/admin/decisions/forecast", ""), "forecast");
});

test("DSS links retain only valid supported review context", () => {
  assert.deepEqual(
    parseDssSearch({
      branch: "taft",
      category: "sedan",
      week: "2026-10-05",
      unrelated: "ignored",
    }),
    { branch: "taft", category: "sedan", week: "2026-10-05" },
  );
  assert.deepEqual(
    parseDssSearch({ branch: [], category: " ", week: "Monday" }),
    {},
  );
  assert.deepEqual(
    parseDssSearch({ branch: "x".repeat(101), category: 3 }),
    {},
  );
});

test("utilization review context is retained independently of forecast filters", () => {
  assert.deepEqual(
    parseDssSearch({
      branch: "taft",
      category: "sedan",
      start: "2026-09-05",
      end: "2026-10-04",
      vehicle: "v1",
      utilBranch: "rizal",
      utilCategory: "van",
      unsupported: true,
    }),
    {
      branch: "taft",
      category: "sedan",
      start: "2026-09-05",
      end: "2026-10-04",
      vehicle: "v1",
      utilBranch: "rizal",
      utilCategory: "van",
    },
  );
});
