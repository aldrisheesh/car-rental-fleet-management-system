import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("admin queues keep their record review destinations coherent", async () => {
  const [bookings, requirements, payments] = await Promise.all([
    readFile(new URL("../routes/admin.bookings.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../routes/admin.requirements.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../routes/admin.payments.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(
    bookings,
    /\/admin\/bookings\/\$\{encodeURIComponent\(booking\.id\)\}/,
  );
  assert.match(
    requirements,
    /\/admin\/bookings\/\$\{encodeURIComponent\(set\.booking_id\)\}/,
  );
  for (const source of [bookings, requirements]) {
    assert.match(source, /useRouterState/);
    assert.match(source, /<Outlet \/>/);
  }
  assert.match(payments, /admin-payments-layout/);
});

test("the booking workflow shows the customer journey before rental operations", async () => {
  const [detail, lifecycle, migration] = await Promise.all([
    readFile(
      new URL("../routes/admin.bookings.$bookingId.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../routes/api.payments.ts", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../../supabase/migrations/20260917100916_single_gate_rental_request_workflow.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(detail, /Booking request/);
  assert.match(detail, /Requirements review/);
  assert.match(detail, /Review the customer’s submitted payment proof/);
  assert.match(detail, /currentLedgerStage/);
  assert.match(
    lifecycle,
    /Payment is available only after requirements are Verified/,
  );
  assert.match(migration, /alter column booking_status set default 'Draft'/);
  assert.match(
    migration,
    /create or replace function public\.submit_renter_requirements/,
  );
  assert.match(migration, /booking_status = 'Submitted'/);
  assert.match(migration, /booking_status = 'Draft'/);
});

test("secure review previews reserve a browser tab during the click gesture", async () => {
  const [requirements, payments] = await Promise.all([
    readFile(
      new URL("../routes/admin.requirements.$bookingId.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../routes/admin.payments.$paymentId.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  for (const source of [requirements, payments]) {
    assert.match(
      source,
      /const preview = window\.open\("about:blank", "_blank"\)/,
    );
    assert.match(source, /preview\.location\.replace\(body\.url\)/);
    assert.match(source, /Allow pop-ups to open this secure/);
    assert.doesNotMatch(source, /window\.open\(body\.url/);
  }
});
