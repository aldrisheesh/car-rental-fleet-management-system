import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("operations queues use clear status and allocation-location language", async () => {
  const [fleet, bookings, payments, locations] = await Promise.all([
    readFile(new URL("../routes/admin.fleet.tsx", import.meta.url), "utf8"),
    readFile(new URL("../routes/admin.bookings.tsx", import.meta.url), "utf8"),
    readFile(new URL("../routes/admin.payments.tsx", import.meta.url), "utf8"),
    readFile(new URL("../routes/admin.branches.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(bookings, /All booking statuses/);
  assert.match(fleet, /label: "All vehicles", status: "All"/);
  assert.match(payments, /Filter payment queue/);
  assert.match(fleet, /Allocation location/);
  assert.match(bookings, /Location & service/);
  assert.match(locations, /Operational locations/);
  assert.match(locations, /Confirm a map pin for each location/);
});

test("mobile operations disclosures avoid nested interactive controls", async () => {
  const [fleet, maintenance] = await Promise.all([
    readFile(new URL("../routes/admin.fleet.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../routes/admin.maintenance.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(
    fleet,
    /function FleetDisclosure[\s\S]*?<summary[\s\S]*?<button[\s\S]*?<\/summary>/,
  );
  assert.match(fleet, /<summary\s+[\s\S]*?onClick=\{onSelect\}/);
  assert.match(
    maintenance,
    /aria-pressed=\{previewRecord\?\.id === record\.id\}/,
  );
  assert.doesNotMatch(
    maintenance,
    /<summary[\s\S]*?<button[\s\S]*?<\/summary>/,
  );
});
