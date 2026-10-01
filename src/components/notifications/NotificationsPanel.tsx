import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Car,
  CalendarRange,
  ChevronRight,
  Check,
  CreditCard,
  FileCheck2,
  Mail,
  RotateCcw,
  RefreshCw,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  isUnread,
  NOTIFICATIONS_CHANGED_EVENT,
  notificationRoute,
  type CanonicalNotification,
  type CustomerNotificationBinding,
  type NotificationsResponse,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

type NotificationsPanelProps = {
  audience: "admin" | "customer";
  compact?: boolean;
  showHeading?: boolean;
  customerBindings?: readonly CustomerNotificationBinding[];
};

export function NotificationsPanel({
  audience,
  compact = false,
  showHeading = true,
  customerBindings = [],
}: NotificationsPanelProps) {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [savingEmailPreference, setSavingEmailPreference] = useState(false);

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
    const counts: Record<CanonicalNotification["relatedEntityType"], number> = {
      booking: 0,
      requirements: 0,
      payment: 0,
      rental: 0,
      vehicle: 0,
      branch: 0,
      backup_run: 0,
    };
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
              ...current,
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

  async function updateEmailPreference(enabled: boolean) {
    if (!data || savingEmailPreference) return;
    const previous = data.emailNotificationsEnabled;
    setSavingEmailPreference(true);
    setError(null);
    setData({ ...data, emailNotificationsEnabled: enabled });
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "updateEmailPreference",
          emailNotificationsEnabled: enabled,
        }),
      });
      if (!response.ok) throw new Error("Unable to update email preference.");
    } catch {
      setData((current) =>
        current ? { ...current, emailNotificationsEnabled: previous } : current,
      );
      setError("The email preference could not be updated. Please try again.");
    } finally {
      setSavingEmailPreference(false);
    }
  }

  if (audience === "customer") {
    return (
      <CustomerNotificationInbox
        data={data}
        loading={loading}
        error={error}
        markingId={markingId}
        customerBindings={customerBindings}
        savingEmailPreference={savingEmailPreference}
        groupedCounts={groupedCounts}
        onRefresh={load}
        onMarkRead={markRead}
        onUpdateEmailPreference={updateEmailPreference}
      />
    );
  }

  return (
    <section
      className={cn(
        "space-y-5",
        compact && "rounded-2xl border border-border bg-card p-5",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap gap-3",
          showHeading ? "items-start justify-between" : "justify-end",
        )}
      >
        {showHeading ? (
          <div>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
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
              {audience === "admin"
                ? "Booking, rental, payment, maintenance, and fleet updates for your account."
                : "Booking, rental, requirement, and payment updates for your account."}
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-4 w-4", loading && "animate-spin")}
            aria-hidden="true"
          />
          {showHeading ? "Refresh" : "Refresh notifications"}
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
          {audience === "admin" && (
            <>
              <span className="rounded-full border border-border px-3 py-1">
                Maintenance {groupedCounts.vehicle}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                Fleet {groupedCounts.branch}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                Backup {groupedCounts.backup_run}
              </span>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Loading notifications…
        </div>
      ) : error && !data ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
          role="alert"
          aria-live="polite"
        >
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
              customerBindings={customerBindings}
              adminBindings={data.adminBindings ?? []}
              marking={markingId === notification.id}
              onMarkRead={markRead}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type CustomerNotificationCategory =
  | "all"
  | "booking"
  | "requirements"
  | "payment"
  | "rental";

function CustomerNotificationInbox({
  data,
  loading,
  error,
  markingId,
  customerBindings,
  savingEmailPreference,
  groupedCounts,
  onRefresh,
  onMarkRead,
  onUpdateEmailPreference,
}: {
  data: NotificationsResponse | null;
  loading: boolean;
  error: string | null;
  markingId: string | null;
  customerBindings: readonly CustomerNotificationBinding[];
  savingEmailPreference: boolean;
  groupedCounts: Record<CanonicalNotification["relatedEntityType"], number>;
  onRefresh: () => Promise<void>;
  onMarkRead: (notification: CanonicalNotification) => Promise<void>;
  onUpdateEmailPreference: (enabled: boolean) => Promise<void>;
}) {
  const [filter, setFilter] = useState<CustomerNotificationCategory>("all");
  const notifications = data?.notifications ?? [];
  const resolvedCustomerBindings = data?.customerBindings ?? customerBindings;
  const visibleNotifications = notifications.filter((notification) =>
    filter === "all" ? true : notification.relatedEntityType === filter,
  );
  const unreadCount = data?.unreadCount ?? 0;
  const filters: Array<{
    id: CustomerNotificationCategory;
    label: string;
    icon: typeof Bell;
    count: number;
  }> = [
    { id: "all", label: "All activity", icon: Bell, count: notifications.length },
    { id: "booking", label: "Bookings", icon: CalendarRange, count: groupedCounts.booking },
    {
      id: "requirements",
      label: "Requirements",
      icon: FileCheck2,
      count: groupedCounts.requirements,
    },
    { id: "payment", label: "Payments", icon: CreditCard, count: groupedCounts.payment },
    { id: "rental", label: "Your rental", icon: Car, count: groupedCounts.rental },
  ];

  return (
    <section className="customer-notification-inbox" aria-label="Notifications">
      <aside className="customer-notification-inbox-rail">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : "You’re all caught up"}</p>
        </div>

        <nav aria-label="Notification categories" className="customer-notification-filters">
          {filters.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              className={cn(filter === id && "is-active")}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <strong>{count}</strong>
            </button>
          ))}
        </nav>

        <div className="customer-notification-email-preference">
          <Mail aria-hidden="true" />
          <div>
            <div className="customer-notification-email-preference-heading">
              <label htmlFor="transactional-email-notifications">
                Email preferences
              </label>
              <input
                id="transactional-email-notifications"
                type="checkbox"
                role="switch"
                checked={data?.emailNotificationsEnabled ?? false}
                disabled={!data || savingEmailPreference}
                onChange={(event) =>
                  void onUpdateEmailPreference(event.target.checked)
                }
              />
            </div>
            <p>Receive important booking and rental updates by email.</p>
          </div>
        </div>
      </aside>

      <div className="customer-notification-inbox-feed">
        <header className="customer-notification-inbox-heading">
          <div>
            <h2>Your updates</h2>
            <p>Important details about your bookings and rentals.</p>
          </div>
          <button type="button" onClick={() => void onRefresh()} disabled={loading}>
            <RefreshCw className={cn(loading && "is-spinning")} aria-hidden="true" />
            Refresh
          </button>
        </header>

        {loading ? (
          <CustomerNotificationSkeleton />
        ) : error && !data ? (
          <div className="customer-notification-message" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void onRefresh()}>
              Try again
            </button>
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="customer-notification-message">
            <p>{filter === "all" ? "No notifications yet" : `No ${filter} updates`}</p>
            <span>New account updates will appear here.</span>
          </div>
        ) : (
          <div className="customer-notification-list">
            {error ? <p className="customer-notification-error">{error}</p> : null}
            {visibleNotifications.map((notification) => (
              <CustomerNotificationRow
                key={notification.id}
                notification={notification}
                customerBindings={resolvedCustomerBindings}
                marking={markingId === notification.id}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CustomerNotificationRow({
  notification,
  customerBindings,
  marking,
  onMarkRead,
}: {
  notification: CanonicalNotification;
  customerBindings: readonly CustomerNotificationBinding[];
  marking: boolean;
  onMarkRead: (notification: CanonicalNotification) => Promise<void>;
}) {
  const unread = isUnread(notification);
  const presentation = customerNotificationPresentation(notification);
  const destination = notificationRoute(notification, "customer", customerBindings);
  const Icon = presentation.icon;

  return (
    <article className={cn("customer-notification-row", `is-${presentation.tone}`, unread && "is-unread")}>
      <span className="customer-notification-unread" aria-hidden="true" />
      <span className="customer-notification-icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="customer-notification-copy">
        <div>
          <h3>{notification.title}</h3>
          {unread ? <span>Unread</span> : null}
        </div>
        <p>{notification.message}</p>
        <time dateTime={notification.createdAt}>
          {formatEntity(notification.relatedEntityType)} · {formatCreatedAt(notification.createdAt)}
        </time>
      </div>
      <div className="customer-notification-actions">
        {unread ? (
          <button
            type="button"
            disabled={marking}
            onClick={() => void onMarkRead(notification)}
          >
            <Check aria-hidden="true" /> {marking ? "Saving" : "Mark read"}
          </button>
        ) : null}
        <Link to={destination as never}>
          View details <ChevronRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function customerNotificationPresentation(notification: CanonicalNotification) {
  if (
    notification.notificationType === "requirements_needs_resubmission" ||
    notification.notificationType === "payment_needs_resubmission"
  )
    return { tone: "attention", icon: FileCheck2 };
  if (notification.relatedEntityType === "payment")
    return { tone: "payment", icon: CreditCard };
  if (notification.relatedEntityType === "requirements")
    return { tone: "requirements", icon: FileCheck2 };
  if (notification.relatedEntityType === "rental")
    return { tone: "rental", icon: RotateCcw };
  return { tone: "booking", icon: CalendarRange };
}

function CustomerNotificationSkeleton() {
  return (
    <div className="customer-notification-skeleton" aria-label="Loading notifications">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index}>
          <i />
          <span>
            <i />
            <i />
            <i />
          </span>
          <i />
        </div>
      ))}
    </div>
  );
}

function NotificationRow({
  notification,
  audience,
  customerBindings,
  adminBindings,
  marking,
  onMarkRead,
}: {
  notification: CanonicalNotification;
  audience: "admin" | "customer";
  customerBindings: readonly CustomerNotificationBinding[];
  adminBindings: NonNullable<NotificationsResponse["adminBindings"]>;
  marking: boolean;
  onMarkRead: (notification: CanonicalNotification) => Promise<void>;
}) {
  const unread = isUnread(notification);
  const Icon =
    notification.notificationType === "backup_attention"
      ? TriangleAlert
      : notification.notificationType === "maintenance_attention"
        ? Wrench
        : notification.notificationType === "low_availability"
          ? Car
          : notification.notificationType === "rental_overdue"
            ? TriangleAlert
            : notification.relatedEntityType === "rental"
              ? RotateCcw
              : notification.relatedEntityType === "payment"
                ? CreditCard
                : notification.relatedEntityType === "requirements"
                  ? FileCheck2
                  : CalendarRange;
  const destination = notificationRoute(
    notification,
    audience,
    customerBindings,
    adminBindings,
  );

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
            <Icon className="h-4 w-4" aria-hidden="true" />
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
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />{" "}
              {marking ? "Saving…" : "Mark read"}
            </button>
          )}
          <Link
            to={destination as never}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

function formatEntity(entity: CanonicalNotification["relatedEntityType"]) {
  return entity === "backup_run"
    ? "Backup run"
    : entity === "requirements"
      ? "Requirements"
      : entity[0].toUpperCase() + entity.slice(1);
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
