import test from "node:test";
import assert from "node:assert/strict";
import {
  BOOKING_CATEGORIES,
  categoryValue,
  splitCategory,
  validCategory,
} from "./booking-categories.ts";
test("stable categories round trip with notes without confusing similar text", () => {
  for (const domain of Object.keys(BOOKING_CATEGORIES) as Array<
    keyof typeof BOOKING_CATEGORIES
  >)
    for (const [code] of BOOKING_CATEGORIES[domain]) {
      const value = categoryValue(domain, code, "Recorded details");
      assert.equal(splitCategory(domain, value).code, code);
      assert.equal(splitCategory(domain, value).details, "Recorded details");
      assert.equal(validCategory(domain, value), true);
    }
  assert.equal(validCategory("purpose", "Family trip unrelated words"), false);
  assert.equal(validCategory("purpose", "Other purpose"), false);
  assert.equal(validCategory("purpose", "Other purpose — "), false);
  assert.equal(validCategory("destination", null, true), true);
  assert.equal(splitCategory("purpose", "SYNTHETIC / Family visit").code, "");
});
test("reschedule declines require a relevant category and details for Other", () => {
  assert.equal(
    validCategory(
      "reschedule_decline",
      "Vehicle unavailable for the new dates",
    ),
    true,
  );
  assert.equal(
    validCategory(
      "reschedule_decline",
      "Driver does not meet rental requirements",
    ),
    false,
  );
  assert.equal(
    validCategory("reschedule_decline", "Other reschedule decline reason"),
    false,
  );
  assert.equal(
    validCategory(
      "reschedule_decline",
      "Other reschedule decline reason — Customer requested dates outside operating availability",
    ),
    true,
  );
  assert.equal(
    validCategory("booking_rejection", "Vehicle unavailable for the new dates"),
    false,
  );
});
