import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("home uses the catalog and requires explicit bookable dates for Finder", async () => {
  const source = await readFile(
    new URL("../routes/index.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /fetchJson<CustomerVehicle\[\]>\("\/api\/vehicles"\)/);
  assert.match(source, /date\.setDate\(date\.getDate\(\) \+ 1\)/);
  assert.match(source, /pickupDate >= firstAvailableDate/);
  assert.match(source, /returnDate >= firstAvailableDate/);
  assert.doesNotMatch(source, /Date\.now\(\) \+ 5 \* 60 \* 1_000/);
});
