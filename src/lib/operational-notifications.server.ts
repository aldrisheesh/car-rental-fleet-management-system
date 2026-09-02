import type { SupabaseClient } from "@supabase/supabase-js";

import { calculateFleetMaintenanceSnapshot } from "./maintenance-readiness.server.ts";
import {
  parseLowAvailabilityThreshold,
  processOperationalNotificationSnapshot,
  type OperationalNotificationSnapshot,
  type OperationalProcessingSummary,
} from "./operational-notifications.ts";
import type { Database } from "./supabase/database.types";
import { getSupabaseServerClient } from "./supabase/server";

export async function processOperationalNotifications(options?: {
  now?: Date;
  threshold?: number;
  client?: SupabaseClient<Database>;
}) {
  const now = options?.now ?? new Date();
  const threshold =
    options?.threshold ??
    parseLowAvailabilityThreshold(process.env.LOW_AVAILABILITY_THRESHOLD);
  const client = options?.client ?? getSupabaseServerClient();
  const snapshot = await loadOperationalNotificationSnapshot(client, now);

  return processOperationalNotificationSnapshot(snapshot, threshold, {
    async reconcile(conditions) {
      const result = await client.rpc(
        "reconcile_operational_notification_conditions",
        { p_conditions: conditions },
      );
      if (result.error || !isProcessingSummary(result.data))
        throw new Error("operational_notification_reconciliation_failed");
      return result.data;
    },
  });
}

async function loadOperationalNotificationSnapshot(
  client: SupabaseClient<Database>,
  now: Date,
): Promise<OperationalNotificationSnapshot> {
  const [branches, rentals, profiles, preferences, fleet] = await Promise.all([
    client.from("branches").select("id,name,is_active"),
    client.from("rental_transactions").select("vehicle_id,started_at,ended_at"),
    client
      .from("profiles")
      .select("id,user_type,account_status")
      .eq("account_status", "Active"),
    client
      .from("notification_preferences")
      .select(
        "recipient_id,maintenance_attention_enabled,low_availability_enabled",
      ),
    calculateFleetMaintenanceSnapshot(client, now),
  ]);
  if (branches.error || rentals.error || profiles.error || preferences.error)
    throw new Error("operational_notification_snapshot_load_failed");

  return {
    branches: (branches.data ?? []).map((branch) => ({
      id: branch.id,
      name: branch.name,
      isActive: branch.is_active,
    })),
    rentals: rentals.data ?? [],
    profiles: (profiles.data ?? []).map((profile) => ({
      id: profile.id,
      userType: profile.user_type,
      accountStatus: profile.account_status,
    })),
    preferences: (preferences.data ?? []).map((preference) => ({
      recipientId: preference.recipient_id,
      maintenanceAttentionEnabled: preference.maintenance_attention_enabled,
      lowAvailabilityEnabled: preference.low_availability_enabled,
    })),
    readiness: fleet.readiness,
    vehicles: fleet.vehicles,
  };
}

function isProcessingSummary(
  value: unknown,
): value is OperationalProcessingSummary {
  if (value == null || typeof value !== "object") return false;
  const summary = value as Record<string, unknown>;
  return [
    "activeConditionCount",
    "activatedCount",
    "resolvedCount",
    "unchangedCount",
    "createdNotificationCount",
  ].every((key) => Number.isInteger(summary[key]));
}
