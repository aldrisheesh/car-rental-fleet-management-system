import assert from "node:assert/strict";
import test from "node:test";
import { calculateBalance, evaluateSupplyVehicles, overlaps } from "./supply-evaluation.server.ts";

test("VS015 uses half-open overlap boundaries", () => {
    assert.equal(overlaps("2026-09-07T00:00:00Z", "2026-09-14T00:00:00Z", "2026-09-14T00:00:00Z", "2026-09-21T00:00:00Z"), false);
    assert.equal(overlaps("2026-09-13T23:00:00Z", "2026-09-14T01:00:00Z", "2026-09-14T00:00:00Z", "2026-09-21T00:00:00Z"), true);
  });
test("VS015 counts vehicles once and preserves reasons", () => {
    const r = evaluateSupplyVehicles([{ id: "v1", branch_id: "b", category_id: "c", is_active: true, readiness: { maintenanceReady: false, reasons: [] }, bookingConflict: true, rentalConflict: true }]);
    assert.equal(r.projectedSupply, 0); assert.deepEqual(r.items[0].exclusion_reasons, ["MaintenanceNotReady", "ConfirmedBookingConflict", "ActiveRental"]);
  });
test("VS015 derives shortage, surplus, balanced", () => {
    assert.deepEqual(calculateBalance(5, 3), { shortageUnits: 2, surplusUnits: 0, balanceState: "Shortage" });
    assert.deepEqual(calculateBalance(3, 5), { shortageUnits: 0, surplusUnits: 2, balanceState: "Surplus" });
    assert.deepEqual(calculateBalance(3, 3), { shortageUnits: 0, surplusUnits: 0, balanceState: "Balanced" });
  });
