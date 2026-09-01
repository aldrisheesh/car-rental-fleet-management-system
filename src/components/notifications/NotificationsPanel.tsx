import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarRange,
  Check,
  CreditCard,
  FileCheck2,
  RotateCcw,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  isUnread,
  NOTIFICATIONS_CHANGED_EVENT,
  type CanonicalNotification,
  type NotificationsResponse,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

type NotificationsPanelProps = {
  audience: "admin" | "customer";
  compact?: boolean;
};

export function NotificationsPanel({
  audience,
  compact = false,
}: NotificationsPanelProps) {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications", {
        credentials: "same-origin",
      });
      const body = (await response
        .json()
        .catch(() => null)) as NotificationsResponse | null;
      if (!response.ok || !body)
        throw new Error("Unable to load notifications.");
      setData(body);
    } catch {
      setError("Notifications could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groupedCounts = useMemo(() => {
    const counts = { booking: 0, requirements: 0, payment: 0, rental: 0 };
    for (const item of data?.notifications ?? [])
      counts[item.relatedEntityType] += 1;
    return counts;
  }, [data]);

  async function markRead(notification: CanonicalNotification) {
    if (!isUnread(notification) || markingId) return;
    setMarkingId(notification.id);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "markRead",
          notificationId: notification.id,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        readAt?: string;
      } | null;
      if (!response.ok || !body?.readAt)
        throw new Error("Unable to mark notification read.");
      setData((current) =>
        current
          ? {
              unreadCount: Math.max(0, current.unreadCount - 1),
              notifications: current.notifications.map((item) =>
                item.id === notification.id
                  ? { ...item, readAt: body.readAt ?? item.readAt }
                  : item,
              ),
            }
          : current,
      );
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
    } catch {
      setError("The notification could not be marked read. Please try again.");
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <section
      className={cn(
        "space-y-5",
        compact && "rounded-2xl border border-border bg-card p-5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Notifications
            </h2>
            {!loading && data && data.unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {data.unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Booking, rental, requirement, and payment updates for your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />{" "}
          Refresh
        </button>
      </div>

      {!loading && data && data.notifications.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-3 py-1">
            Bookings {groupedCounts.booking}
          </span>
          <span className="rounded-full border border-border px-3 py-1">
            Requirements {groupedCounts.requirements}
          </span>
          <span className="rounded-full border border-border px-3 py-1">
            Payments {groupedCounts.payment}
          </span>
          <span className="rounded-full border border-border px-3 py-1">
            Rentals {groupedCounts.rental}
          </span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Loading notifications…
        </div>
      ) : error && !data ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 text-sm font-semibold text-primary"
          >
            Try again
          </button>
        </div>
      ) : data?.notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="font-medium text-foreground">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            New account updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {data?.notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              audience={audience}
              marking={markingId === notification.id}
              onMarkRead={markRead}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NotificationRow({
  notification,
  audience,
  marking,
  onMarkRead,
}: {
  notification: CanonicalNotification;
  audience: "admin" | "customer";
  marking: boolean;
  onMarkRead: (notification: CanonicalNotification) => Promise<void>;
}) {
  const unread = isUnread(notification);
  const Icon =
    notification.notificationType === "rental_overdue"
      ? TriangleAlert
      : notification.relatedEntityType === "rental"
        ? RotateCcw
        : notification.relatedEntityType === "payment"
          ? CreditCard
          : notification.relatedEntityType === "requirements"
            ? FileCheck2
            : CalendarRange;
  const destination = relatedRoute(notification, audience);

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card/70 p-4",
        unread && "border-l-4 border-l-primary bg-primary/[0.04]",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-foreground">
                {notification.title}
              </h3>
              {unread && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  Unread
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {notification.message}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatEntity(notification.relatedEntityType)} ·{" "}
              {formatCreatedAt(notification.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {unread && (
            <button
              type="button"
              disabled={marking}
              onClick={() => void onMarkRead(notification)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />{" "}
              {marking ? "Saving…" : "Mark read"}
            </button>
          )}
          <Link
            to={destination as never}
            className="inline-flex min-h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

function relatedRoute(
  notification: CanonicalNotification,
  audience: "admin" | "customer",
) {
  if (audience === "customer")
    return notification.relatedEntityType === "payment"
      ? "/payment-details"
      : "/customer";
  return notification.relatedEntityType === "payment"
    ? "/admin/payments"
    : "/admin/bookings";
}

function formatEntity(entity: CanonicalNotification["relatedEntityType"]) {
  return entity === "requirements"
    ? "Requirements"
    : entity[0].toUpperCase() + entity.slice(1);
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleString();
}
