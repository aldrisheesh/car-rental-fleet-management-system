import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CalendarRange,
  Car,
  Check,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { Btn, PageHeader } from "@/components/admin/ui";
import { notifications } from "@/data/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/notifications")({ component: NotificationsPage });

const filterCategories = [
  "All",
  "Booking",
  "Payment",
  "Maintenance",
  "Return",
  "Availability",
  "Verification",
] as const;
type FilterCategory = (typeof filterCategories)[number];
type Notification = (typeof notifications)[number];
type NotificationGroupId = "needsAction" | "operationalAlerts" | "updates";

const groupMeta: Record<
  NotificationGroupId,
  { title: string; description: string; icon: typeof Bell }
> = {
  needsAction: {
    title: "Needs action",
    description: "Items that require review or a decision.",
    icon: ArrowUpRight,
  },
  operationalAlerts: {
    title: "Operational alerts",
    description: "Potential issues impacting today's operations.",
    icon: AlertTriangle,
  },
  updates: {
    title: "Updates",
    description: "Informational updates and reminders.",
    icon: Bell,
  },
};

function groupForNotification(notification: Notification): NotificationGroupId {
  switch (notification.category) {
    case "Booking":
    case "Payment":
    case "Verification":
      return "needsAction";
    case "Return":
    case "Availability":
      return "operationalAlerts";
    case "Maintenance":
    default:
      return "updates";
  }
}

function actionLabelForCategory(category: Notification["category"]) {
  switch (category) {
    case "Booking":
      return "Review booking";
    case "Payment":
      return "View payment";
    case "Maintenance":
      return "View service";
    case "Return":
      return "View return";
    case "Availability":
      return "Manage fleet";
    case "Verification":
      return "Verify ID";
    default:
      return "Review";
  }
}

function routeForCategory(category: Notification["category"]) {
  switch (category) {
    case "Booking":
    case "Return":
      return "/admin/bookings";
    case "Payment":
      return "/admin/payments";
    case "Maintenance":
      return "/admin/maintenance";
    case "Availability":
      return "/admin/fleet";
    case "Verification":
      return "/admin/customers";
    default:
      return "/admin";
  }
}

function NotificationIcon({
  category,
  unread,
}: {
  category: Notification["category"];
  unread: boolean;
}) {
  const Icon =
    category === "Booking"
      ? CalendarRange
      : category === "Payment"
        ? CreditCard
        : category === "Maintenance"
          ? Wrench
          : category === "Return"
            ? RotateCcw
            : category === "Availability"
              ? Car
              : category === "Verification"
                ? ShieldCheck
                : Bell;

  return (
    <span
      className={cn(
        "grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground",
        unread && "border-yellow-400/30 bg-yellow-400/[0.06] text-yellow-200",
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function FilterChip({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors",
        selected
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <span className="font-medium">{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs",
          selected ? "bg-primary/15" : "bg-secondary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-soft",
        accent && "border-yellow-400/25 bg-yellow-400/[0.04]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("text-muted-foreground", accent && "text-yellow-200")}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function NotificationRow({
  notification,
  onAction,
}: {
  notification: Notification;
  onAction: (id: string) => void;
}) {
  const actionLabel = actionLabelForCategory(notification.category);

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card/70 p-4 transition-colors hover:bg-card",
        notification.unread && "border-l-4 border-l-yellow-400 bg-yellow-400/[0.04]",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <NotificationIcon category={notification.category} unread={notification.unread} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-medium text-foreground">{notification.title}</h3>
              {notification.unread && (
                <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-200">
                  Unread
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {notification.category} • {notification.when}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAction(notification.id)}
          className={cn(
            "shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary",
            !notification.unread && "text-muted-foreground hover:bg-card",
          )}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

function NotificationsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<FilterCategory>("All");
  const [items, setItems] = useState<Notification[]>(() => notifications.map((n) => ({ ...n })));

  const counts = useMemo(() => {
    const base: Record<FilterCategory, number> = {
      All: items.length,
      Booking: 0,
      Payment: 0,
      Maintenance: 0,
      Return: 0,
      Availability: 0,
      Verification: 0,
    };
    for (const item of items) base[item.category as Exclude<FilterCategory, "All">] += 1;
    return base;
  }, [items]);

  const filteredItems = useMemo(() => {
    return category === "All" ? items : items.filter((n) => n.category === category);
  }, [category, items]);

  const grouped = useMemo(() => {
    const groups: Record<NotificationGroupId, Notification[]> = {
      needsAction: [],
      operationalAlerts: [],
      updates: [],
    };

    for (const item of filteredItems) groups[groupForNotification(item)].push(item);

    for (const key of Object.keys(groups) as NotificationGroupId[]) {
      groups[key].sort((a, b) => Number(b.unread) - Number(a.unread));
    }

    return groups;
  }, [filteredItems]);

  const unreadCount = useMemo(() => items.filter((n) => n.unread).length, [items]);
  const needsActionCount = useMemo(
    () => items.filter((n) => groupForNotification(n) === "needsAction").length,
    [items],
  );
  const alertCount = useMemo(
    () => items.filter((n) => groupForNotification(n) === "operationalAlerts").length,
    [items],
  );
  const updateCount = useMemo(
    () => items.filter((n) => groupForNotification(n) === "updates").length,
    [items],
  );

  function markAllRead() {
    setItems((prev) => prev.map((n) => (n.unread ? { ...n, unread: false } : n)));
  }

  function clearArchive() {
    setItems((prev) => prev.filter((n) => n.unread));
  }

  function handleRowAction(id: string) {
    const notification = items.find((n) => n.id === id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    if (notification) {
      void navigate({ to: routeForCategory(notification.category) as never });
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Categorized operational alerts and reminders."
        actions={
          <>
            <Btn onClick={markAllRead} disabled={unreadCount === 0}>
              <Check className="h-4 w-4" /> Mark all read
            </Btn>
            <Btn
              variant="danger"
              onClick={clearArchive}
              disabled={items.length === 0 || items.every((n) => n.unread)}
              title={
                items.every((n) => n.unread)
                  ? "No archived (read) notifications to clear"
                  : undefined
              }
            >
              <Trash2 className="h-4 w-4" /> Clear archive
            </Btn>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Unread"
          value={String(unreadCount)}
          icon={<Bell className="h-4 w-4" />}
          accent
        />
        <SummaryCard
          label="Needs action"
          value={String(needsActionCount)}
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <SummaryCard
          label="Operational alerts"
          value={String(alertCount)}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <SummaryCard
          label="Updates"
          value={String(updateCount)}
          icon={<Bell className="h-4 w-4" />}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterCategories.map((c) => (
          <FilterChip
            key={c}
            label={c}
            count={counts[c]}
            selected={category === c}
            onClick={() => setCategory(c)}
          />
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="font-medium text-foreground">No notifications</p>
          <p className="mt-1 text-sm text-muted-foreground">Everything is quiet for this filter.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.keys(grouped) as NotificationGroupId[]).map((key) => {
            const groupItems = grouped[key];
            if (groupItems.length === 0) return null;
            const meta = groupMeta[key];
            const GroupIcon = meta.icon;

            return (
              <section key={key} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                      <GroupIcon className="h-4 w-4 text-muted-foreground" />
                      {meta.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{groupItems.length} items</div>
                </div>

                <div className="space-y-3">
                  {groupItems.map((n) => (
                    <NotificationRow key={n.id} notification={n} onAction={handleRowAction} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
