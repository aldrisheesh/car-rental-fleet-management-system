import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { evaluateMaintenanceReadiness } from "./maintenance-readiness.ts";
import {
  deriveOperationalConditions,
  parseLowAvailabilityThreshold,
  processOperationalNotificationSnapshot,
  PROVISIONAL_LOW_AVAILABILITY_THRESHOLD,
  type OperationalCondition,
  type OperationalConditionStore,
  type OperationalNotificationSnapshot,
  type OperationalProcessingSummary,
} from "./operational-notifications.ts";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/20260902023000_operational_notifications.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const serverImplementation = readFileSync(
  fileURLToPath(
    new URL("./operational-notifications.server.ts", import.meta.url),
  ),
  "utf8",
);
const evaluatorImplementation = readFileSync(
  fileURLToPath(new URL("./operational-notifications.ts", import.meta.url)),
  "utf8",
);
const reminderRoute = readFileSync(
  fileURLToPath(
    new URL("../routes/api.internal.reminders.ts", import.meta.url),
  ),
  "utf8",
);

const owner = {
  id: "owner",
  userType: "Owner/Admin",
  accountStatus: "Active",
};

function snapshot(
  overrides: Partial<OperationalNotificationSnapshot> = {},
): OperationalNotificationSnapshot {
  return {
    branches: [{ id: "branch-a", name: "Branch A", isActive: true }],
    vehicles: [
      { vehicleId: "vehicle-a", branchId: "branch-a", isActive: true },
    ],
    readiness: [
      {
        vehicleId: "vehicle-a",
        vehicleName: "Vehicle A",
        licensePlate: "AAA 111",
        maintenanceReady: true,
        reasons: [],
      },
    ],
    rentals: [],
    profiles: [owner],
    preferences: [],
    ...overrides,
  };
}

function readiness(
  vehicleId: string,
  vehicleName: string,
  vehicle: Parameters<typeof evaluateMaintenanceReadiness>[0],
  records: Parameters<typeof evaluateMaintenanceReadiness>[1],
) {
  return {
    vehicleId,
    vehicleName,
    licensePlate: `${vehicleId}-plate`,
    ...evaluateMaintenanceReadiness(vehicle, records, "2026-09-02"),
  };
}

const readyVehicle = {
  is_active: true,
  current_odometer_km: 50_000,
  condition_blocks_rental_use: false,
};

const completedTarget = (overrides: Record<string, unknown>) => ({
  status: "Completed",
  maintenance_type: "Oil Service",
  blocks_rental_use: false,
  next_service_odometer: null,
  next_service_date: null,
  completed_at: "2026-08-01T00:00:00Z",
  created_at: "2026-08-01T00:00:00Z",
  ...overrides,
});

test("threshold configuration uses the exact provisional default and rejects unsafe values", () => {
  assert.equal(PROVISIONAL_LOW_AVAILABILITY_THRESHOLD, 1);
  assert.equal(parseLowAvailabilityThreshold(undefined), 1);
  assert.equal(parseLowAvailabilityThreshold("3"), 3);
  for (const value of ["0", "-1", "1.5", "not-a-number"])
    assert.throws(
      () => parseLowAvailabilityThreshold(value),
      /invalid_low_availability_threshold/,
    );
});

test("canonical ready state emits no maintenance condition", () => {
  const conditions = deriveOperationalConditions(snapshot(), 1);
  assert.equal(
    conditions.some(
      (condition) => condition.conditionType === "maintenance_attention",
    ),
    false,
  );
});

test("every material canonical maintenance reason emits one vehicle condition", () => {
  const cases = [
    readiness("blocking", "Blocking", readyVehicle, [
      { ...completedTarget({}), status: "Open", blocks_rental_use: true },
    ]),
    readiness("date", "Date due", readyVehicle, [
      completedTarget({ next_service_date: "2026-09-02" }),
    ]),
    readiness("odometer", "Odometer due", readyVehicle, [
      completedTarget({ next_service_odometer: 50_000 }),
    ]),
    readiness(
      "condition",
      "Condition blocked",
      { ...readyVehicle, condition_blocks_rental_use: true },
      [],
    ),
    readiness(
      "missing-odometer",
      "Missing odometer",
      { ...readyVehicle, current_odometer_km: null },
      [completedTarget({ next_service_odometer: 60_000 })],
    ),
  ];
  const input = snapshot({
    readiness: cases,
    vehicles: cases.map((item) => ({
      vehicleId: item.vehicleId,
      branchId: "branch-a",
      isActive: true,
    })),
  });
  const maintenance = deriveOperationalConditions(input, 1).filter(
    (condition) => condition.conditionType === "maintenance_attention",
  );
  assert.equal(maintenance.length, cases.length);
  assert.ok(
    maintenance.every((condition) => condition.relatedEntityType === "vehicle"),
  );
});

test("inactive alone is not material maintenance attention and non-blocking Open is ready", () => {
  const inactive = readiness(
    "inactive",
    "Inactive",
    { ...readyVehicle, is_active: false },
    [],
  );
  const nonBlocking = readiness("open", "Open", readyVehicle, [
    { ...completedTarget({}), status: "Open", blocks_rental_use: false },
  ]);
  const conditions = deriveOperationalConditions(
    snapshot({
      readiness: [inactive, nonBlocking],
      vehicles: [
        { vehicleId: "inactive", branchId: "branch-a", isActive: false },
        { vehicleId: "open", branchId: "branch-a", isActive: true },
      ],
    }),
    1,
  );
  assert.equal(
    conditions.some(
      (condition) => condition.conditionType === "maintenance_attention",
    ),
    false,
  );
});

test("branch availability reuses active, readiness, and physical-rental exclusions", () => {
  const vehicles = [
    { vehicleId: "available", branchId: "branch-a", isActive: true },
    { vehicleId: "inactive", branchId: "branch-a", isActive: false },
    { vehicleId: "rented", branchId: "branch-a", isActive: true },
    { vehicleId: "maintenance", branchId: "branch-a", isActive: true },
  ];
  const input = snapshot({
    vehicles,
    readiness: vehicles.map((vehicle) => ({
      vehicleId: vehicle.vehicleId,
      vehicleName: vehicle.vehicleId,
      licensePlate: vehicle.vehicleId,
      maintenanceReady: vehicle.vehicleId !== "maintenance",
      reasons:
        vehicle.vehicleId === "maintenance"
          ? (["Active blocking maintenance"] as const)
          : [],
    })),
    rentals: [
      { vehicle_id: "rented", started_at: "2026-09-01", ended_at: null },
    ],
  });
  assert.equal(
    deriveOperationalConditions(input, 1).some(
      (condition) => condition.conditionType === "low_availability",
    ),
    false,
  );
  const low = deriveOperationalConditions(input, 2).find(
    (condition) => condition.conditionType === "low_availability",
  );
  assert.match(low?.message ?? "", /Only 1 rentable vehicle is/);
  assert.match(evaluatorImplementation, /isVehicleAvailableNow/);
});

test("branch conditions are independent and do not assume two named branches", () => {
  const conditions = deriveOperationalConditions(
    snapshot({
      branches: [
        { id: "north", name: "North", isActive: true },
        { id: "south", name: "South", isActive: true },
        { id: "third", name: "Third Branch", isActive: true },
      ],
      vehicles: [
        { vehicleId: "north-1", branchId: "north", isActive: true },
        { vehicleId: "south-1", branchId: "south", isActive: true },
        { vehicleId: "south-2", branchId: "south", isActive: true },
      ],
      readiness: ["north-1", "south-1", "south-2"].map((vehicleId) => ({
        vehicleId,
        vehicleName: vehicleId,
        licensePlate: vehicleId,
        maintenanceReady: true,
        reasons: [],
      })),
    }),
    2,
  ).filter((condition) => condition.conditionType === "low_availability");
  assert.deepEqual(
    conditions.map((condition) => condition.relatedEntityId).sort(),
    ["north", "third"],
  );
});

test("roles and per-category preferences resolve exact operational recipients", () => {
  const input = snapshot({
    profiles: [
      owner,
      { id: "staff", userType: "Operations Staff", accountStatus: "Active" },
      { id: "customer", userType: "Customer/Renter", accountStatus: "Active" },
      { id: "inactive", userType: "Owner/Admin", accountStatus: "Inactive" },
      { id: "opted-out", userType: "Owner/Admin", accountStatus: "Active" },
    ],
    preferences: [
      {
        recipientId: "opted-out",
        maintenanceAttentionEnabled: false,
        lowAvailabilityEnabled: false,
      },
    ],
    readiness: [
      readiness("vehicle-a", "Vehicle A", readyVehicle, [
        completedTarget({ next_service_date: "2026-09-01" }),
      ]),
    ],
    vehicles: [],
  });
  const conditions = deriveOperationalConditions(input, 1);
  const maintenance = conditions.find(
    (condition) => condition.conditionType === "maintenance_attention",
  );
  const availability = conditions.find(
    (condition) => condition.conditionType === "low_availability",
  );
  assert.deepEqual(maintenance?.recipientIds, ["owner"]);
  assert.deepEqual(availability?.recipientIds, ["owner", "staff"]);
  assert.ok(
    conditions.every(
      (condition) => !condition.recipientIds.includes("customer"),
    ),
  );
});

test("condition lifecycle deduplicates, resolves, and permits recurrence", async () => {
  const store = new MemoryOperationalStore();
  const low = snapshot();
  const lower = snapshot({ vehicles: [] });
  const healthy = snapshot();

  const first = await processOperationalNotificationSnapshot(low, 2, store);
  assert.equal(first.createdNotificationCount, 1);
  assert.equal(store.notificationCount, 1);

  const repeat = await processOperationalNotificationSnapshot(lower, 2, store);
  assert.equal(repeat.createdNotificationCount, 0);
  assert.equal(repeat.unchangedCount, 1);
  assert.equal(store.notificationCount, 1);

  const recovered = await processOperationalNotificationSnapshot(
    healthy,
    1,
    store,
  );
  assert.equal(recovered.resolvedCount, 1);
  assert.equal(store.activeCount, 0);

  const recurred = await processOperationalNotificationSnapshot(
    lower,
    1,
    store,
  );
  assert.equal(recurred.createdNotificationCount, 1);
  assert.equal(store.notificationCount, 2);
});

test("maintenance condition deduplicates, resolves, and alerts after recurrence", async () => {
  const store = new MemoryOperationalStore();
  const attention = snapshot({
    branches: [],
    readiness: [
      readiness("vehicle-a", "Vehicle A", readyVehicle, [
        completedTarget({ next_service_date: "2026-09-01" }),
      ]),
    ],
  });
  const first = await processOperationalNotificationSnapshot(
    attention,
    1,
    store,
  );
  const repeat = await processOperationalNotificationSnapshot(
    attention,
    1,
    store,
  );
  const resolved = await processOperationalNotificationSnapshot(
    snapshot({ branches: [] }),
    1,
    store,
  );
  const recurred = await processOperationalNotificationSnapshot(
    attention,
    1,
    store,
  );
  assert.equal(first.createdNotificationCount, 1);
  assert.equal(repeat.createdNotificationCount, 0);
  assert.equal(resolved.resolvedCount, 1);
  assert.equal(recurred.createdNotificationCount, 1);
  assert.equal(store.notificationCount, 2);
});

test("failed reconciliation cannot turn an active condition healthy", async () => {
  const store = new MemoryOperationalStore();
  await processOperationalNotificationSnapshot(
    snapshot({ vehicles: [] }),
    1,
    store,
  );
  store.failNext = true;
  await assert.rejects(
    processOperationalNotificationSnapshot(snapshot(), 1, store),
    /reconciliation_failed/,
  );
  assert.equal(store.activeCount, 1);
  assert.equal(store.notificationCount, 1);
});

test("uniqueness and transaction locking protect concurrent processing", async () => {
  const store = new MemoryOperationalStore();
  const low = snapshot({ vehicles: [] });
  const summaries = await Promise.all([
    processOperationalNotificationSnapshot(low, 1, store),
    processOperationalNotificationSnapshot(low, 1, store),
  ]);
  assert.equal(
    summaries.reduce(
      (count, summary) => count + summary.createdNotificationCount,
      0,
    ),
    1,
  );
  assert.match(migration, /primary key \(condition_type, related_entity_id\)/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /on conflict \(recipient_id, event_key\) do nothing/);
});

test("migration and recurring route enforce canonical types, preferences, and server trigger", () => {
  for (const value of [
    "maintenance_attention",
    "low_availability",
    "vehicle",
    "branch",
  ])
    assert.match(migration, new RegExp(`'${value}'`));
  assert.match(migration, /create table public\.notification_preferences/);
  assert.match(migration, /recipient_id = auth\.uid\(\)/);
  assert.match(migration, /profile\.user_type = 'Owner\/Admin'/);
  assert.match(
    migration,
    /profile\.user_type in \('Owner\/Admin', 'Operations Staff'\)/,
  );
  assert.match(
    migration,
    /coalesce\(preference\.maintenance_attention_enabled, true\)/,
  );
  assert.match(
    migration,
    /coalesce\(preference\.low_availability_enabled, true\)/,
  );
  assert.match(reminderRoute, /processScheduledNotificationCycle/);
  assert.doesNotMatch(
    `${serverImplementation}\n${reminderRoute}`,
    /brevo|smtp|sendgrid|twilio|react email/i,
  );
});

class MemoryOperationalStore implements OperationalConditionStore {
  private readonly states = new Map<
    string,
    { active: boolean; occurrence: number }
  >();
  private readonly eventKeys = new Set<string>();
  private queue = Promise.resolve();
  failNext = false;

  get notificationCount() {
    return this.eventKeys.size;
  }

  get activeCount() {
    return [...this.states.values()].filter((state) => state.active).length;
  }

  async reconcile(conditions: OperationalCondition[]) {
    let release = () => {};
    const previous = this.queue;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      if (this.failNext) {
        this.failNext = false;
        throw new Error("reconciliation_failed");
      }
      return this.reconcileLocked(conditions);
    } finally {
      release();
    }
  }

  private reconcileLocked(
    conditions: OperationalCondition[],
  ): OperationalProcessingSummary {
    const incoming = new Set(
      conditions.map(
        (condition) =>
          `${condition.conditionType}:${condition.relatedEntityId}`,
      ),
    );
    let resolvedCount = 0;
    for (const [key, state] of this.states) {
      if (state.active && !incoming.has(key)) {
        state.active = false;
        resolvedCount += 1;
      }
    }

    let activatedCount = 0;
    let unchangedCount = 0;
    let createdNotificationCount = 0;
    for (const condition of conditions) {
      const key = `${condition.conditionType}:${condition.relatedEntityId}`;
      const state = this.states.get(key);
      if (state?.active) {
        unchangedCount += 1;
        continue;
      }
      const occurrence = (state?.occurrence ?? 0) + 1;
      this.states.set(key, { active: true, occurrence });
      activatedCount += 1;
      for (const recipientId of condition.recipientIds) {
        const eventKey = `${recipientId}:${key}:${occurrence}`;
        if (this.eventKeys.has(eventKey)) continue;
        this.eventKeys.add(eventKey);
        createdNotificationCount += 1;
      }
    }
    return {
      activeConditionCount: conditions.length,
      activatedCount,
      resolvedCount,
      unchangedCount,
      createdNotificationCount,
    };
  }
}
