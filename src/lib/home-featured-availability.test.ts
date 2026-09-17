import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("home featured cars use a bookable next-day availability window by default", async () => {
  const source = await readFile(
    new URL("../routes/index.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /dateTimeLocalForDate\(firstAvailableDate, "08:00"\)/);
  assert.doesNotMatch(source, /Date\.now\(\) \+ 5 \* 60 \* 1_000/);
});
