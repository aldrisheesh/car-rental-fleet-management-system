import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("assignment and confirmation reject maintenance-unready vehicles", async () => {
  const [migration, bookingApi] = await Promise.all([
    readFile(
      new URL(
        "../../supabase/migrations/20260917064844_enforce_maintenance_readiness_on_booking.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../routes/api.bookings.ts", import.meta.url), "utf8"),
  ]);
  assert.match(
    migration,
    /create or replace function public\.assign_booking_vehicle/,
  );
  assert.match(
    migration,
    /create or replace function public\.confirm_booking_atomic/,
  );
  assert.match(
    migration,
    /perform public\.assert_vehicle_rental_ready\(p_vehicle_id\)/,
  );
  assert.match(
    migration,
    /perform public\.assert_vehicle_rental_ready\(b\.assigned_vehicle_id\)/,
  );
  assert.match(migration, /vehicle_maintenance_unready/);
  assert.match(bookingApi, /Assigned vehicle is blocked by maintenance/);
});
