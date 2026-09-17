import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeFile = new URL("../routes/bookings.$bookingId.tsx", import.meta.url);

test("requirement uploads can be previewed without a separate review screen", async () => {
  const source = await readFile(routeFile, "utf8");

  assert.match(source, /window\.open\("about:blank", "_blank"\)/);
  assert.match(source, /preview\.location\.replace\(body\.url\)/);
  assert.match(source, /Preview document/);
  assert.match(source, /Submit requirements for verification/);
  assert.doesNotMatch(source, /Review documents/);
});
