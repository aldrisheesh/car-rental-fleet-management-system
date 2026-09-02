import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { projectNotification } from "@/lib/notifications";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const errorResponse = (message: string, status: number) =>
  Response.json({ message }, { status });

export const Route = createFileRoute("/api/notifications")({
  server: { handlers: { GET: readNotifications, POST: markNotificationRead } },
});

async function readNotifications() {
  try {
    const principal = await requirePrincipal();
    const client = getSupabaseServerClient();
    const [items, unread, preference] = await Promise.all([
      client
        .from("notifications")
        .select(
          "id,notification_type,title,message,related_entity_type,related_entity_id,created_at,read_at",
        )
        .eq("recipient_id", principal.userId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
      client
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", principal.userId)
        .is("read_at", null),
      client
        .from("notification_preferences")
        .select("email_notifications_enabled")
        .eq("recipient_id", principal.userId)
        .maybeSingle(),
    ]);

    if (items.error || unread.error || preference.error) {
      return errorResponse("Unable to load notifications.", 503);
    }

    return Response.json({
      notifications: (items.data ?? []).map(projectNotification),
      unreadCount: unread.count ?? 0,
      emailNotificationsEnabled:
        preference.data?.email_notifications_enabled ?? true,
    });
  } catch {
    return errorResponse("Authentication required.", 401);
  }
}

async function markNotificationRead({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (body?.action === "updateEmailPreference") {
      if (typeof body.emailNotificationsEnabled !== "boolean")
        return errorResponse("Invalid notification preference.", 400);
      const client = getSupabaseServerClient();
      const updated = await client
        .from("notification_preferences")
        .upsert(
          {
            recipient_id: principal.userId,
            email_notifications_enabled: body.emailNotificationsEnabled,
          },
          { onConflict: "recipient_id" },
        )
        .select("email_notifications_enabled")
        .single();
      if (updated.error)
        return errorResponse("Unable to update notification preference.", 503);
      return Response.json({
        emailNotificationsEnabled: updated.data.email_notifications_enabled,
      });
    }

    const notificationId =
      typeof body?.notificationId === "string" ? body.notificationId : "";
    if (body?.action !== "markRead" || !isUuid(notificationId)) {
      return errorResponse("Invalid notification action.", 400);
    }

    const client = getSupabaseServerClient();
    const existing = await client
      .from("notifications")
      .select("id,read_at")
      .eq("id", notificationId)
      .eq("recipient_id", principal.userId)
      .maybeSingle();
    if (existing.error)
      return errorResponse("Unable to mark notification read.", 503);
    if (!existing.data) return errorResponse("Notification not found.", 404);
    if (existing.data.read_at) {
      return Response.json({ notificationId, readAt: existing.data.read_at });
    }

    const readAt = new Date().toISOString();
    const updated = await client
      .from("notifications")
      .update({ read_at: readAt })
      .eq("id", notificationId)
      .eq("recipient_id", principal.userId)
      .is("read_at", null)
      .select("id,read_at")
      .maybeSingle();
    if (updated.error)
      return errorResponse("Unable to mark notification read.", 503);
    if (!updated.data) {
      const retry = await client
        .from("notifications")
        .select("read_at")
        .eq("id", notificationId)
        .eq("recipient_id", principal.userId)
        .maybeSingle();
      if (!retry.data?.read_at)
        return errorResponse("Unable to mark notification read.", 409);
      return Response.json({ notificationId, readAt: retry.data.read_at });
    }
    return Response.json({ notificationId, readAt: updated.data.read_at });
  } catch {
    return errorResponse("Authentication required.", 401);
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
