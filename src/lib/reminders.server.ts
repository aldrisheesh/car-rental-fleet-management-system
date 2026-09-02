import type { SupabaseClient } from "@supabase/supabase-js";

import {
  processReminderSnapshot,
  type ReminderNotification,
  type ReminderSnapshot,
} from "./reminders.ts";
import type { Database } from "./supabase/database.types";
import { getSupabaseServerClient } from "./supabase/server";
import { processOperationalNotifications } from "./operational-notifications.server";

export async function processScheduledNotificationCycle(options?: {
  now?: Date;
  client?: SupabaseClient<Database>;
}) {
  const now = options?.now ?? new Date();
  const client = options?.client ?? getSupabaseServerClient();
  const [reminders, operational] = await Promise.all([
    processScheduledReminders({ now, client }),
    processOperationalNotifications({ now, client }),
  ]);
  return { ...reminders, operational };
}

export async function processScheduledReminders(options?: {
  now?: Date;
  client?: SupabaseClient<Database>;
}) {
  const now = options?.now ?? new Date();
  const client = options?.client ?? getSupabaseServerClient();
  const snapshot = await loadReminderSnapshot(client);

  return processReminderSnapshot(snapshot, now, {
    async insertMissing(notifications) {
      const rows = notifications.map(toNotificationRow);
      const result = await client
        .from("notifications")
        .upsert(rows, {
          onConflict: "recipient_id,event_key",
          ignoreDuplicates: true,
        })
        .select("id");
      if (result.error) throw new Error("reminder_notification_insert_failed");
      return result.data?.length ?? 0;
    },
  });
}

async function loadReminderSnapshot(
  client: SupabaseClient<Database>,
): Promise<ReminderSnapshot> {
  const [bookings, rentals, profiles] = await Promise.all([
    client
      .from("booking_requests")
      .select("id,customer_id,booking_status,pickup_at")
      .eq("booking_status", "Confirmed"),
    client
      .from("rental_transactions")
      .select(
        "id,booking_id,customer_id,scheduled_return_at,started_at,ended_at",
      ),
    client
      .from("profiles")
      .select("id,user_type,account_status")
      .eq("user_type", "Owner/Admin")
      .eq("account_status", "Active"),
  ]);
  if (bookings.error || rentals.error || profiles.error) {
    throw new Error("reminder_snapshot_load_failed");
  }

  return {
    bookings: (bookings.data ?? []).map((booking) => ({
      id: String(booking.id),
      customerId: String(booking.customer_id),
      bookingStatus: String(booking.booking_status),
      pickupAt: String(booking.pickup_at),
    })),
    rentals: (rentals.data ?? []).map((rental) => ({
      id: String(rental.id),
      bookingId: String(rental.booking_id),
      customerId: String(rental.customer_id),
      scheduledReturnAt: String(rental.scheduled_return_at),
      startedAt: rental.started_at == null ? null : String(rental.started_at),
      endedAt: rental.ended_at == null ? null : String(rental.ended_at),
    })),
    profiles: (profiles.data ?? []).map((profile) => ({
      id: profile.id,
      userType: profile.user_type,
      accountStatus: profile.account_status,
    })),
  };
}

function toNotificationRow(notification: ReminderNotification) {
  return {
    recipient_id: notification.recipientId,
    notification_type: notification.notificationType,
    title: notification.title,
    message: notification.message,
    related_entity_type: notification.relatedEntityType,
    related_entity_id: notification.relatedEntityId,
    event_key: notification.eventKey,
  };
}
