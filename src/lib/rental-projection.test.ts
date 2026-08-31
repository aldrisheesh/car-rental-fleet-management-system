import assert from "node:assert/strict";
import test from "node:test";
import { projectCustomerRental } from "./rental-projection.ts";

test("customer rental projection excludes administrative release and return fields", () => {
  const projection = projectCustomerRental({
    id: "r", booking_id: "b", vehicle_id: "v", scheduled_pickup_at: "p", scheduled_return_at: "q", started_at: "s", ended_at: "e",
    released_by: "admin", returned_by: "admin", release_condition_summary: "internal", existing_damage_notes: "internal", return_condition_summary: "internal", observed_damage_notes: "internal", return_remarks: "internal", agreement_acknowledged: true,
  });
  assert.deepEqual(Object.keys(projection ?? {}).sort(), ["active", "booking_id", "ended_at", "id", "scheduled_pickup_at", "scheduled_return_at", "started_at", "vehicle_id"]);
});
