import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { isTrustedReminderInvocation } from "./reminder-invocation.server.ts";
import {
  deriveReminderNotifications,
  processReminderSnapshot,
  type ReminderNotification,
  type ReminderNotificationStore,
  type ReminderSnapshot,
} from "./reminders.ts";

const migrationPath = fileURLToPath(
  new URL(
    "../../supabase/migrations/20260902010000_scheduled_booking_rental_reminders.sql",
    import.meta.url,
  ),
);
const serverPath = fileURLToPath(
  new URL("./reminders.server.ts", import.meta.url),
);
const routePath = fileURLToPath(
  new URL("../routes/api.internal.reminders.ts", import.meta.url),
);
const migration = readFileSync(migrationPath, "utf8");
const serverImplementation = readFileSync(serverPath, "utf8");
const routeImplementation = readFileSync(routePath, "utf8");

const NOW = new Date("2026-09-05T02:00:00.000Z"); // 10:00 Asia/Manila

function snapshot(overrides: Partial<ReminderSnapshot> = {}): ReminderSnapshot {
  return {
    bookings: [],
    rentals: [],
    profiles: [
      { id: "admin-active", userType: "Owner/Admin", accountStatus: "Active" },
      {
        id: "admin-inactive",
        userType: "Owner/Admin",
        accountStatus: "Inactive",
      },
      {
        id: "staff-active",
        userType: "Operations Staff",
        accountStatus: "Active",
      },
    ],
    ...overrides,
  };
}

function booking(pickupAt: string, bookingStatus = "Confirmed") {
  return {
    id: "booking-1",
    customerId: "customer-1",
    bookingStatus,
    pickupAt,
  };
}

function rental(
  scheduledReturnAt: string,
  overrides: Partial<ReminderSnapshot["rentals"][number]> = {},
) {
  return {
    id: "rental-1",
    bookingId: "booking-1",
    customerId: "customer-1",
    scheduledReturnAt,
    startedAt: "2026-09-04T02:00:00.000Z",
    endedAt: null,
    ...overrides,
  };
}

function events(input: ReminderSnapshot, now = NOW) {
  return deriveReminderNotifications(input, now).notifications;
}

test("pickup is excluded outside 24h and included exactly/inside 24h or on a late valid run", () => {
  assert.equal(
    events(snapshot({ bookings: [booking("2026-09-06T02:00:00.001Z")] }))
      .length,
    0,
  );
  for (const pickupAt of [
    "2026-09-06T02:00:00.000Z",
    "2026-09-05T20:00:00.000Z",
    "2026-09-05T02:00:00.001Z",
  ]) {
    const due = events(snapshot({ bookings: [booking(pickupAt)] }));
    assert.deepEqual(due.map((event) => event.recipientId).sort(), [
      "admin-active",
      "customer-1",
    ]);
    assert.ok(
      due.every((event) => event.notificationType === "upcoming_pickup"),
    );
  }
});

test("pickup excludes passed, terminal/non-proceeding, and already-started bookings", () => {
  assert.equal(
    events(snapshot({ bookings: [booking(NOW.toISOString())] })).length,
    0,
  );
  for (const status of ["Submitted", "Rejected", "Cancelled"]) {
    assert.equal(
      events(
        snapshot({
          bookings: [booking("2026-09-05T10:00:00.000Z", status)],
        }),
      ).length,
      0,
    );
  }
  assert.equal(
    events(
      snapshot({
        bookings: [booking("2026-09-05T10:00:00.000Z")],
        rentals: [rental("2026-09-07T02:00:00.000Z")],
      }),
    ).filter((event) => event.notificationType === "upcoming_pickup").length,
    0,
  );
});

test("return is excluded outside 24h and included exactly/inside 24h or on a late valid run", () => {
  assert.equal(
    events(snapshot({ rentals: [rental("2026-09-06T02:00:00.001Z")] })).length,
    0,
  );
  for (const scheduledReturnAt of [
    "2026-09-06T02:00:00.000Z",
    "2026-09-05T20:00:00.000Z",
    "2026-09-05T02:00:00.001Z",
  ]) {
    const due = events(snapshot({ rentals: [rental(scheduledReturnAt)] }));
    assert.equal(due.length, 2);
    assert.ok(
      due.every((event) => event.notificationType === "upcoming_return"),
    );
  }
});

test("return excludes rentals that are not started or were physically returned early", () => {
  const scheduledReturnAt = "2026-09-05T20:00:00.000Z";
  assert.equal(
    events(
      snapshot({
        rentals: [rental(scheduledReturnAt, { startedAt: null })],
      }),
    ).length,
    0,
  );
  assert.equal(
    events(
      snapshot({
        rentals: [
          rental(scheduledReturnAt, {
            endedAt: "2026-09-05T01:00:00.000Z",
          }),
        ],
      }),
    ).length,
    0,
  );
});

test("overdue begins strictly after scheduled return and stops after physical return", () => {
  assert.equal(
    events(snapshot({ rentals: [rental(NOW.toISOString())] })).length,
    0,
  );
  const overdue = events(
    snapshot({ rentals: [rental("2026-09-05T01:59:59.999Z")] }),
  );
  assert.equal(overdue.length, 2);
  assert.ok(
    overdue.every((event) => event.notificationType === "rental_overdue"),
  );
  assert.equal(
    events(
      snapshot({
        rentals: [
          rental("2026-09-05T01:00:00.000Z", {
            endedAt: "2026-09-05T01:30:00.000Z",
          }),
        ],
      }),
    ).length,
    0,
  );
});

test("overdue event keys use the Manila date across the UTC boundary", () => {
  const input = snapshot({
    rentals: [rental("2026-09-04T00:00:00.000Z")],
  });
  const beforeMidnight = events(input, new Date("2026-09-05T15:59:59.999Z"));
  const afterMidnight = events(input, new Date("2026-09-05T16:00:00.000Z"));
  assert.ok(
    beforeMidnight.every((event) => event.eventKey.endsWith(":2026-09-05")),
  );
  assert.ok(
    afterMidnight.every((event) => event.eventKey.endsWith(":2026-09-06")),
  );
});

test("recipient expansion keeps customer ownership and active Owner/Admin only", () => {
  const due = events(
    snapshot({ bookings: [booking("2026-09-05T10:00:00.000Z")] }),
  );
  assert.deepEqual(due.map((event) => event.recipientId).sort(), [
    "admin-active",
    "customer-1",
  ]);
  assert.equal(
    due.some((event) => event.recipientId === "admin-inactive"),
    false,
  );
  assert.equal(
    due.some((event) => event.recipientId === "staff-active"),
    false,
  );
  assert.equal(
    due.filter((event) => event.recipientId === "customer-1").length,
    1,
  );
});

test("same-day repeats and concurrent processors deduplicate; next Manila day recurs", async () => {
  const store = new MemoryNotificationStore();
  const input = snapshot({
    rentals: [rental("2026-09-04T00:00:00.000Z")],
  });
  const sameDay = new Date("2026-09-05T02:00:00.000Z");
  const [first, overlapping] = await Promise.all([
    processReminderSnapshot(input, sameDay, store),
    processReminderSnapshot(input, sameDay, store),
  ]);
  assert.equal(first.createdCount + overlapping.createdCount, 2);
  assert.equal(store.size, 2);

  const repeat = await processReminderSnapshot(input, sameDay, store);
  assert.equal(repeat.createdCount, 0);
  assert.equal(repeat.deduplicatedCount, 2);

  const nextDay = await processReminderSnapshot(
    input,
    new Date("2026-09-05T16:00:00.000Z"),
    store,
  );
  assert.equal(nextDay.createdCount, 2);
  assert.equal(store.size, 4);
});

test("processor derivation never mutates booking or rental lifecycle state", () => {
  const input = snapshot({
    bookings: [booking("2026-09-05T10:00:00.000Z")],
    rentals: [
      rental("2026-09-05T01:00:00.000Z", {
        bookingId: "booking-2",
      }),
    ],
  });
  const before = structuredClone(input);
  deriveReminderNotifications(input, NOW);
  assert.deepEqual(input, before);
  assert.doesNotMatch(serverImplementation, /\.update\(|\.delete\(|\.rpc\(/);
  assert.match(serverImplementation, /\.from\("notifications"\)\s*\.upsert\(/s);
});

test("overdue copy contains no fee and reminder implementation has no external delivery", () => {
  const overdue = events(
    snapshot({ rentals: [rental("2026-09-05T01:00:00.000Z")] }),
  );
  for (const event of overdue) {
    assert.doesNotMatch(event.message, /PHP|3,?000|late fee|penalty/i);
  }
  assert.doesNotMatch(
    `${serverImplementation}\n${routeImplementation}`,
    /brevo|smtp|sendgrid|twilio|react email|sms|push notification/i,
  );
});

test("migration extends VS019 and preserves uniqueness-backed conflict handling", () => {
  for (const type of ["upcoming_pickup", "upcoming_return", "rental_overdue"]) {
    assert.match(migration, new RegExp(`'${type}'`));
  }
  assert.match(migration, /related_entity_type in \([^)]*'rental'/s);
  assert.match(
    migration,
    /grant insert \([\s\S]*\) on public\.notifications to service_role/,
  );
  assert.match(serverImplementation, /onConflict: "recipient_id,event_key"/);
  assert.match(serverImplementation, /ignoreDuplicates: true/);
  assert.doesNotMatch(migration, /create table/i);
});

test("normal browser authentication cannot authorize reminder processing", () => {
  const expectedSecret = "trusted-reminder-secret";
  assert.equal(
    isTrustedReminderInvocation(
      new Request("https://example.test/api/internal/reminders", {
        headers: { cookie: "briahs-auth-access=user-token" },
      }),
      expectedSecret,
    ),
    false,
  );
  assert.equal(
    isTrustedReminderInvocation(
      new Request("https://example.test/api/internal/reminders", {
        headers: { authorization: "Bearer wrong-secret" },
      }),
      expectedSecret,
    ),
    false,
  );
  assert.equal(
    isTrustedReminderInvocation(
      new Request("https://example.test/api/internal/reminders", {
        headers: { authorization: `Bearer ${expectedSecret}` },
      }),
      expectedSecret,
    ),
    true,
  );
  assert.doesNotMatch(routeImplementation, /requirePrincipal|requireRole/);
  assert.doesNotMatch(routeImplementation, /request\.json|searchParams/);
});

class MemoryNotificationStore implements ReminderNotificationStore {
  private readonly eventKeys = new Set<string>();

  get size() {
    return this.eventKeys.size;
  }

  async insertMissing(notifications: ReminderNotification[]) {
    let created = 0;
    for (const notification of notifications) {
      const key = `${notification.recipientId}:${notification.eventKey}`;
      if (this.eventKeys.has(key)) continue;
      this.eventKeys.add(key);
      created += 1;
    }
    return created;
  }
}
