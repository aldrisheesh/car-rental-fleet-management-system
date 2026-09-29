import assert from "node:assert/strict";
import test from "node:test";

import {
  formatPhilippineMobile,
  isValidPhilippineMobile,
  toPhilippineMobileE164,
} from "./phone.ts";

test("formats Philippine mobile numbers with a +63 prefix UI", () => {
  assert.equal(formatPhilippineMobile("0917-555-0142"), "917 555 0142");
  assert.equal(formatPhilippineMobile("+63 917 555 0142"), "917 555 0142");
});

test("accepts only a complete Philippine mobile number", () => {
  assert.equal(isValidPhilippineMobile("917 555 0142"), true);
  assert.equal(isValidPhilippineMobile("817 555 0142"), false);
  assert.equal(toPhilippineMobileE164("0917 555 0142"), "+639175550142");
  assert.equal(toPhilippineMobileE164("917 555"), null);
});
