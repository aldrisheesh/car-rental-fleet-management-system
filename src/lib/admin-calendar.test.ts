import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildAdminCalendar,
  loadAdminCalendar,
  parseCalendarPeriod,
  type CalendarSources,
} from "./admin-calendar.ts";

const period = parseCalendarPeriod("2026-09");
const sources: CalendarSources = {
  bookings: [
    {
      id: "submitted",
      booking_status: "Submitted",
      pickup_at: "2026-09-02T17:30:00Z",
      return_at: "2026-09-04T17:30:00Z",
      requested_vehicle: { name: "Requested Vios" },
      assigned_vehicle: null,
    },
    {
      id: "confirmed",
      booking_status: "Confirmed",
      pickup_at: "2026-09-07T01:00:00Z",
      return_at: "2026-09-08T10:00:00Z",
      requested_vehicle: { name: "Requested Van" },
      assigned_vehicle: { name: "Assigned Hiace" },
    },
    {
      id: "released",
      booking_status: "Confirmed",
      pickup_at: "2026-09-10T01:00:00Z",
      return_at: "2026-09-12T10:00:00Z",
      requested_vehicle: { name: "Requested Car" },
      assigned_vehicle: { name: "Rental Innova" },
    },
    {
      id: "cancelled",
      booking_status: "Cancelled",
      pickup_at: "2026-09-20T01:00:00Z",
      return_at: "2026-09-21T10:00:00Z",
      requested_vehicle: { name: "Cancelled Car" },
      assigned_vehicle: null,
    },
  ],
  rentals: [
    {
      id: "rental-1",
      booking_id: "released",
      scheduled_pickup_at: "2026-09-10T02:00:00Z",
      scheduled_return_at: "2026-09-12T11:00:00Z",
      vehicle: { name: "Rental Innova" },
    },
  ],
  maintenance: [
    {
      id: "open-service",
      maintenance_type: "Brake inspection",
      status: "Open",
      service_started_at: "2026-09-14T23:00:00Z",
      next_service_date: null,
      vehicle: { name: "Service Rush" },
    },
    {
      id: "next-service",
      maintenance_type: "PMS",
      status: "Completed",
      service_started_at: "2026-08-01T01:00:00Z",
      next_service_date: "2026-09-18",
      vehicle: { name: "PMS Wigo" },
    },
    {
      id: "cancelled-service",
      maintenance_type: "Oil change",
      status: "Cancelled",
      service_started_at: "2026-09-19T01:00:00Z",
      next_service_date: "2026-09-20",
      vehicle: { name: "Cancelled Maintenance" },
    },
  ],
};

test("calendar period uses Manila month boundaries", () => {
  assert.deepEqual(period, {
    key: "2026-09",
    startDate: "2026-09-01",
    endDate: "2026-10-01",
    startInstant: "2026-08-31T16:00:00.000Z",
    endInstant: "2026-09-30T16:00:00.000Z",
  });
  assert.equal(parseCalendarPeriod("2026-12").endDate, "2027-01-01");
  assert.throws(() => parseCalendarPeriod("2026-13"), /invalid_period/);
  assert.throws(() => parseCalendarPeriod(null), /invalid_period/);
});

test("canonical bookings, rentals, and maintenance map to supported dates", () => {
  const result = buildAdminCalendar("Owner/Admin", period, sources);
  assert.deepEqual(
    result.events.map(({ date, kind, label }) => ({ date, kind, label })),
    [
      {
        date: "2026-09-03",
        kind: "reservation",
        label: "Requested Vios reservation",
      },
      {
        date: "2026-09-07",
        kind: "pickup",
        label: "Assigned Hiace pickup",
      },
      {
        date: "2026-09-08",
        kind: "return",
        label: "Assigned Hiace return",
      },
      {
        date: "2026-09-10",
        kind: "pickup",
        label: "Rental Innova pickup",
      },
      {
        date: "2026-09-12",
        kind: "return",
        label: "Rental Innova return",
      },
      {
        date: "2026-09-15",
        kind: "maintenance",
        label: "Service Rush · Brake inspection",
      },
      {
        date: "2026-09-18",
        kind: "maintenance",
        label: "PMS Wigo · PMS due",
      },
    ],
  );
  assert.equal(
    result.events.some((event) => event.label.includes("Cancelled")),
    false,
  );
  assert.equal(
    result.events.filter((event) => event.label.includes("Rental Innova"))
      .length,
    2,
  );
});

test("calendar filters events to the requested month and supports honest empty data", () => {
  assert.deepEqual(
    buildAdminCalendar(
      "Operations Staff",
      parseCalendarPeriod("2027-02"),
      sources,
    ),
    { period: "2027-02", role: "Operations Staff", events: [] },
  );
});

test("both internal roles are allowed and customer access is rejected before loading", async () => {
  assert.equal(
    buildAdminCalendar("Owner/Admin", period, sources).role,
    "Owner/Admin",
  );
  assert.equal(
    buildAdminCalendar("Operations Staff", period, sources).role,
    "Operations Staff",
  );
  let loaded = false;
  await assert.rejects(
    loadAdminCalendar("Customer/Renter", period, async () => {
      loaded = true;
      return sources;
    }),
    /forbidden/,
  );
  assert.equal(loaded, false);
});

test("calendar page has real loading, error, empty, and month-navigation states", async () => {
  const page = await readFile(
    new URL("../routes/admin.calendar.tsx", import.meta.url),
    "utf8",
  );
  const api = await readFile(
    new URL("../routes/api.admin-calendar.ts", import.meta.url),
    "utf8",
  );
  assert.match(page, /fetch\(\s*`\/api\/admin-calendar\?month=/);
  assert.match(page, /shiftMonth\(value, -1\)/);
  assert.match(page, /shiftMonth\(value, 1\)/);
  assert.match(page, /latestRequest\.current === request/);
  assert.match(page, /Loading calendar schedule/);
  assert.match(page, /Unable to load the calendar schedule/);
  assert.match(
    page,
    /No reservations, pickups, returns, or maintenance are scheduled/,
  );
  assert.match(page, /aria-label="Previous month"/);
  assert.match(page, /aria-label="Next month"/);
  assert.doesNotMatch(
    page,
    /May 2026|Toyota Vios pickup|Hiace PMS overdue|Bay 2|10:00 AM/,
  );
  assert.match(api, /principal\.role === "Customer\/Renter"/);
  assert.match(api, /status: 403/);
});
