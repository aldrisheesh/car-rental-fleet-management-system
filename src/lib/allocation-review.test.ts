import assert from "node:assert/strict";
import test from "node:test";
import {
  canRecordTransferDecision,
  externalAdvisory,
  selectedContext,
} from "./allocation-review.ts";

test("external evidence cannot cross selections or refresh generations", () => {
  const old = { origin: "Antipolo", destination: "Taft" };
  assert.equal(selectedContext("transfer-b:0", "transfer-a:0", old), null);
  assert.equal(selectedContext("transfer-a:1", "transfer-a:0", old), null);
  assert.equal(selectedContext("", "", old), null);
  assert.equal(selectedContext("transfer-a:1", "transfer-a:1", old), old);
});

test("human acknowledgment cannot bypass loading, permission, or saved decision state", () => {
  const ready = {
    pending: true,
    busy: false,
    contextLoading: false,
    acknowledged: true,
    approvedUnits: 2,
    recommendedUnits: 3,
  };
  assert.equal(canRecordTransferDecision(ready, "Approved"), true);
  for (const blocked of [
    { busy: true },
    { contextLoading: true },
    { acknowledged: false },
    { pending: false },
  ]) {
    assert.equal(
      canRecordTransferDecision({ ...ready, ...blocked }, "Approved"),
      false,
    );
    assert.equal(
      canRecordTransferDecision({ ...ready, ...blocked }, "Rejected"),
      false,
    );
  }
  for (const approvedUnits of [0, -1, 1.5, 4, NaN, Infinity]) {
    assert.equal(
      canRecordTransferDecision({ ...ready, approvedUnits }, "Approved"),
      false,
    );
    assert.equal(
      canRecordTransferDecision({ ...ready, approvedUnits }, "Rejected"),
      true,
    );
  }
});

test("closure remains prominent when the route assessment is unavailable", () => {
  const result = externalAdvisory(
    [
      { name: "Road", value: "Closed/Impassable" },
      { name: "Route", value: "Unavailable" },
    ],
    true,
  );
  assert.equal(result.critical, true);
  assert.match(result.headline, /closure or blocked route/);
  assert.match(externalAdvisory([], false).headline, /incomplete/);
  assert.equal(
    externalAdvisory([{ name: "Weather", value: "Severe" }], true).critical,
    true,
  );
  assert.match(
    externalAdvisory([{ name: "Weather", value: "Normal" }], true).headline,
    /incomplete/,
  );
  assert.match(
    externalAdvisory([{ name: "Road", value: "Open" }], false).headline,
    /no reported advisory flags/,
  );
});
