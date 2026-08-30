import assert from "node:assert/strict";
import test from "node:test";
import { validateMasterDataInput } from "./master-data.ts";

test("master-data validation enforces stable vehicle references", () => {
  assert.equal(
    validateMasterDataInput("vehicles", {
      name: "",
      branchId: "b",
      categoryId: "c",
    }),
    "Vehicle name is required.",
  );
  assert.equal(
    validateMasterDataInput("vehicles", {
      name: "Test",
      branchId: "",
      categoryId: "c",
    }),
    "A valid branch is required.",
  );
  assert.equal(
    validateMasterDataInput("vehicles", {
      name: "Test",
      branchId: "b",
      categoryId: "c",
      seatCapacity: 0,
    }),
    "Seat capacity must be positive.",
  );
  assert.equal(
    validateMasterDataInput("vehicles", {
      name: "Test",
      branchId: "b",
      categoryId: "c",
      dailyRate: -1,
    }),
    "Daily rate must be non-negative.",
  );
  assert.equal(
    validateMasterDataInput("vehicles", {
      name: "Test",
      branchId: "b",
      categoryId: "c",
      referenceFuelEfficiency: 0,
    }),
    "Reference fuel efficiency must be positive.",
  );
  assert.equal(
    validateMasterDataInput("vehicles", {
      name: "Test",
      branchId: "b",
      categoryId: "c",
      seatCapacity: 5,
      dailyRate: 1000,
      referenceFuelEfficiency: 12,
    }),
    null,
  );
});
