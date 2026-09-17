import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  Brain,
  CalendarDays,
  Car,
  CircleAlert,
  Clock3,
  CreditCard,
  FileText,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
} from "@/components/admin/ui";
import type {
  AdminCalendarResponse,
  CalendarEvent,
} from "@/lib/admin-calendar";
import type { AdminDashboardResponse } from "@/lib/admin-dashboard";
import {
  bookingReference,
  currentManilaDate,
  currentManilaMonth,
  formatAdminDate,
  formatAdminDateTime,
  type AdminBooking,
  type AdminPayment,
  type AdminRequirementSet,
} from "@/lib/admin-presentations";
import type { NotificationsResponse } from "@/lib/notifications";
import { parseAdminBookingResponse } from "@/lib/booking-retrieval";

export const Route = createFileRoute("/admin/")({
  component: DashboardOverview,
});

type DashboardSources = {
  base: AdminDashboardResponse;
  bookings: AdminBooking[] | null;
  requirements: AdminRequirementSet[] | null;
  payments: AdminPayment[] | null;
  calendar: CalendarEvent[] | null;
  notifications: NotificationsResponse["notifications"] | null;
  failures: string[];
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardSources };

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin" });
  return readJsonResponse<T>(response);
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | T
    | { message?: string }
    | null;
  if (!response.ok) {
    throw new Error(
      body && typeof body === "object" && "message" in body && body.message
        ? body.message
        : "The source did not respond successfully.",
    );
  }
  return body as T;
}

async function readBookings() {
  const response = await fetch("/api/bookings", { credentials: "same-origin" });
  return parseAdminBookingResponse(response, { allowStaffResponse: true });
}

function todayEvents(events: CalendarEvent[] | null) {
  return events?.filter((event) => event.date === currentManilaDate()) ?? [];
}

function eventBookingId(event: CalendarEvent) {
  const parts = event.id.split(":");
  return parts[0] === "booking" ? parts[1] : undefined;
}

function DashboardOverview() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const loadDashboard = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const baseResponse = await fetch("/api/admin-dashboard", {
        credentials: "same-origin",
      });
      const base = await readJsonResponse<AdminDashboardResponse>(baseResponse);
      const isStaff = base.role === "Operations Staff";
      const failures: string[] = [];
      const sources: DashboardSources = {
        base,
        bookings: null,
        requirements: null,
        payments: null,
        calendar: null,
        notifications: null,
        failures,
      };

      const jobs: Array<{
        label: string;
        load: () => Promise<unknown>;
        assign: (value: unknown) => void;
      }> = [
        {
          label: "bookings",
          load: readBookings,
          assign: (value) => {
            sources.bookings =
              value && typeof value === "object" && "bookings" in value
                ? (value.bookings as AdminBooking[])
                : [];
          },
        },
        {
          label: "calendar",
          load: () =>
            readJson<AdminCalendarResponse>(
              `/api/admin-calendar?month=${encodeURIComponent(currentManilaMonth())}`,
            ),
          assign: (value) => {
            sources.calendar = (value as AdminCalendarResponse).events;
          },
        },
        {
          label: "notifications",
          load: () => readJson<NotificationsResponse>("/api/notifications"),
          assign: (value) => {
            sources.notifications = (
              value as NotificationsResponse
            ).notifications;
          },
        },
      ];

      if (!isStaff) {
        jobs.push(
          {
            label: "requirements",
            load: () =>
              readJson<{ requirementSets: AdminRequirementSet[] }>(
                "/api/requirements",
              ),
            assign: (value) => {
              sources.requirements = (
                value as { requirementSets: AdminRequirementSet[] }
              ).requirementSets;
            },
          },
          {
            label: "payments",
            load: () => readJson<{ payments: AdminPayment[] }>("/api/payments"),
            assign: (value) => {
              sources.payments = (
                value as { payments: AdminPayment[] }
              ).payments;
            },
          },
        );
      }

      const results = await Promise.allSettled(jobs.map((job) => job.load()));
      results.forEach((result, index) => {
        const job = jobs[index];
        if (!job) return;
        if (result.status === "fulfilled") job.assign(result.value);
        else
          failures.push(
            `${job.label}: ${result.reason instanceof Error ? result.reason.message : "unavailable"}`,
          );
      });
      setState({ status: "ready", data: sources });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load the operational dashboard.",
      });
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (state.status === "loading") {
    return (
      <div>
        <PageHeader
          title="Operations dashboard"
          subtitle="Loading operational dashboard…"
        />
        <Card>
          <CardHeader title="Needs attention" />
          <LoadingRows count={4} />
        </Card>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div>
        <PageHeader
          title="Operations dashboard"
          subtitle="What needs your attention now."
        />
        <Card>
          <ErrorState
            message={state.message}
            onRetry={() => void loadDashboard()}
          />
        </Card>
      </div>
    );
  }

  return (
    <DashboardContent data={state.data} onRetry={() => void loadDashboard()} />
  );
}

function DashboardContent({
  data,
  onRetry,
}: {
  data: DashboardSources;
  onRetry: () => void;
}) {
  const staffView = data.base.role === "Operations Staff";
  const events = todayEvents(data.calendar);
  const pickups = events.filter((event) => event.kind === "pickup");
  const returns = events.filter((event) => event.kind === "return");
  const pendingRequirements =
    data.requirements?.filter((set) => set.status === "Pending Review") ?? [];
  const pendingPayments =
    data.payments?.filter(
      (payment) => payment.status === "Pending Verification",
    ) ?? [];
  const lowAvailability =
    data.notifications?.filter(
      (notification) => notification.notificationType === "low_availability",
    ) ?? [];
  const recentNotifications = data.notifications?.slice(0, 4) ?? [];
  const bookingsById = useMemo(
    () =>
      new Map((data.bookings ?? []).map((booking) => [booking.id, booking])),
    [data.bookings],
  );

  return (
    <div>
      <PageHeader
        title={
          staffView ? "Staff operations dashboard" : "Operations dashboard"
        }
        subtitle="What needs your attention now."
      />

      {data.failures.length > 0 ? (
        <div
          className="mb-5 flex items-start gap-3 rounded-lg border border-[#d6e3ed] bg-[#f2f8fc] px-4 py-3 text-sm text-[#2e647b]"
          role="status"
          aria-live="polite"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">
              Some dashboard sources are unavailable.
            </p>
            <p className="mt-0.5 text-[#526c7b]">
              Supported regions remain visible. Retry to refresh the missing
              source{data.failures.length === 1 ? "" : "s"}.
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto shrink-0 font-semibold underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!staffView ? (
        <DecisionSupportHighlight
          submittedBookings={data.base.operational.submittedBookings}
          readinessAttention={data.base.operational.readinessAttention}
          availableVehicles={data.base.operational.availableVehicles}
        />
      ) : null}

      <Card>
        <CardHeader
          title="Needs attention"
          right={
            <Link
              to="/admin/bookings"
              className="touch-target inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-[#0d322e]"
            >
              View bookings
            </Link>
          }
        />
        <div className="divide-y divide-border">
          {staffView ? (
            <>
              <AttentionRow
                icon={<UserRound />}
                label="Submitted requests"
                detail="New rental requests awaiting operational review."
                count={data.base.operational.submittedBookings}
                href="/admin/bookings?status=Submitted"
                action="Open bookings"
              />
              <AttentionRow
                icon={<CalendarDays />}
                label="Deliveries & returns today"
                detail={
                  data.calendar == null
                    ? "Today’s schedule is unavailable."
                    : "Today’s delivery and return schedule."
                }
                count={data.calendar == null ? "—" : events.length}
                href="/admin/calendar"
                action="Open calendar"
              />
              <AttentionRow
                icon={<CircleAlert />}
                label="Low availability notice"
                detail={
                  data.notifications == null
                    ? "Notification source is unavailable."
                    : lowAvailability.length > 0
                      ? "A role-eligible availability notice needs review."
                      : "No low availability notice is currently recorded."
                }
                count={
                  data.notifications == null ? "—" : lowAvailability.length
                }
                href="/admin/notifications"
                action="Open notifications"
              />
            </>
          ) : (
            <>
              <AttentionRow
                icon={<FileText />}
                label="Requirements review"
                detail={
                  data.requirements == null
                    ? "Requirement review source is unavailable."
                    : "Customer requests with documents awaiting manual review."
                }
                count={
                  data.requirements == null ? "—" : pendingRequirements.length
                }
                href="/admin/requirements"
                action="Open queue"
              />
              <AttentionRow
                icon={<CreditCard />}
                label="Payment verification"
                detail={
                  data.payments == null
                    ? "Payment review source is unavailable."
                    : "Submitted payments awaiting manual verification."
                }
                count={data.payments == null ? "—" : pendingPayments.length}
                href="/admin/payments"
                action="Open queue"
              />
              <AttentionRow
                icon={<UserRound />}
                label="Submitted requests"
                detail="New rental requests awaiting assignment or confirmation."
                count={data.base.operational.submittedBookings}
                href="/admin/bookings?status=Submitted"
                action="Open bookings"
              />
              <AttentionRow
                icon={<Wrench />}
                label="Fleet readiness"
                detail="Vehicles requiring canonical maintenance or inspection attention."
                count={data.base.operational.readinessAttention}
                href="/admin/maintenance"
                action="Open readiness"
              />
            </>
          )}
        </div>
      </Card>

      {staffView ? (
        <StaffDashboardLower
          events={events}
          base={data.base}
          bookings={data.bookings}
          bookingsById={bookingsById}
        />
      ) : (
        <OwnerDashboardLower
          pickups={pickups}
          returns={returns}
          base={data.base}
          bookings={data.bookings}
          recentNotifications={recentNotifications}
          bookingsById={bookingsById}
          calendarAvailable={data.calendar != null}
        />
      )}
    </div>
  );
}

function DecisionSupportHighlight({
  submittedBookings,
  readinessAttention,
  availableVehicles,
}: {
  submittedBookings: number;
  readinessAttention: number;
  availableVehicles: number;
}) {
  const recommendations = [
    {
      label: "Review incoming demand",
      detail:
        submittedBookings > 0
          ? `${submittedBookings} submitted request${submittedBookings === 1 ? "" : "s"} can inform the next allocation decision.`
          : "No submitted requests are awaiting operational review.",
      value: submittedBookings,
    },
    {
      label: "Validate fleet readiness",
      detail:
        readinessAttention > 0
          ? `${readinessAttention} vehicle${readinessAttention === 1 ? " requires" : "s require"} readiness attention before supply decisions.`
          : "The current fleet has no readiness attention recorded.",
      value: readinessAttention,
    },
    {
      label: "Assess available supply",
      detail: `${availableVehicles} vehicle${availableVehicles === 1 ? " is" : "s are"} currently available for operational planning.`,
      value: availableVehicles,
    },
  ];

  return (
    <section
      aria-labelledby="decision-support-highlight"
      className="mb-5 overflow-hidden rounded-lg border border-[#b9d6e5] bg-[#f2f8fc]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#cfe1eb] px-5 py-5">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-white">
            <Brain aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2e647b]">
              Decision support
            </p>
            <h2
              id="decision-support-highlight"
              className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground"
            >
              Make the next operational move with confidence.
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
              Use canonical demand, supply, and fleet-readiness signals to focus
              decisions where they matter most.
            </p>
          </div>
        </div>
        <Link
          to="/admin/decisions"
          className="touch-target inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-[#0d322e]"
        >
          Open decision support
          <span aria-hidden="true" className="ml-2 text-lg">
            →
          </span>
        </Link>
      </div>
      <div className="grid divide-y divide-[#cfe1eb] md:grid-cols-3 md:divide-x md:divide-y-0">
        {recommendations.map((recommendation) => (
          <div key={recommendation.label} className="px-5 py-4">
            <p className="text-2xl font-semibold tabular-nums tracking-[-0.03em] text-primary">
              {recommendation.value}
            </p>
            <p className="mt-1 font-semibold">{recommendation.label}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {recommendation.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AttentionRow({
  icon,
  label,
  detail,
  count,
  href,
  action,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  count: number | string;
  href: string;
  action: string;
}) {
  return (
    <div className="grid gap-4 px-5 py-4 md:grid-cols-[40px_minmax(0,1fr)_100px_auto] md:items-center">
      <span className="text-primary" aria-hidden="true">
        <span className="inline-flex h-10 w-10 items-center justify-center">
          {icon}
        </span>
      </span>
      <div className="min-w-0">
        <p className="text-base font-semibold">{label}</p>
        <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
          {detail}
        </p>
      </div>
      <div className="md:border-l md:border-border md:pl-4">
        <p className="text-2xl font-semibold tabular-nums tracking-[-0.03em]">
          {count}
        </p>
        <p className="text-xs text-muted-foreground">current</p>
      </div>
      <Link
        to={href as never}
        className="touch-target inline-flex items-center justify-start text-sm font-semibold text-primary underline underline-offset-4 hover:text-[#0d322e] md:justify-end"
      >
        {action}
        <span aria-hidden="true" className="ml-2 text-lg no-underline">
          →
        </span>
      </Link>
    </div>
  );
}

function OwnerDashboardLower({
  pickups,
  returns,
  base,
  bookings,
  recentNotifications,
  bookingsById,
  calendarAvailable,
}: {
  pickups: CalendarEvent[];
  returns: CalendarEvent[];
  base: AdminDashboardResponse;
  bookings: AdminBooking[] | null;
  recentNotifications: NotificationsResponse["notifications"];
  bookingsById: Map<string, AdminBooking>;
  calendarAvailable: boolean;
}) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(340px,5fr)]">
      <Card>
        <CardHeader
          title="Today"
          right={
            <Link
              to="/admin/calendar"
              className="touch-target inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4"
            >
              View calendar{" "}
              <span aria-hidden="true" className="ml-2 text-lg no-underline">
                →
              </span>
            </Link>
          }
        />
        {!calendarAvailable ? (
          <div
            className="px-5 py-8 text-sm text-muted-foreground"
            role="status"
          >
            Today’s schedule is unavailable. Calendar data could not be loaded.
          </div>
        ) : (
          <div className="grid gap-7 px-5 py-5 md:grid-cols-2">
            <ScheduleGroup
              title="Deliveries"
              events={pickups}
              bookingsById={bookingsById}
            />
            <ScheduleGroup
              title="Returns"
              events={returns}
              bookingsById={bookingsById}
            />
          </div>
        )}
      </Card>

      <div className="space-y-5">
        <Snapshot base={base} owner />
        <RecentActivity
          notifications={recentNotifications}
          bookings={bookings}
          bookingsById={bookingsById}
        />
      </div>
    </div>
  );
}

function StaffDashboardLower({
  events,
  base,
  bookings,
  bookingsById,
}: {
  events: CalendarEvent[];
  base: AdminDashboardResponse;
  bookings: AdminBooking[] | null;
  bookingsById: Map<string, AdminBooking>;
}) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader
          title="Today"
          right={
            <Link
              to="/admin/calendar"
              className="touch-target inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4"
            >
              Open calendar{" "}
              <span aria-hidden="true" className="ml-2 text-lg no-underline">
                →
              </span>
            </Link>
          }
        />
        {events.length === 0 ? (
          <EmptyState
            title="No schedule recorded today"
            description="Calendar events are shown here when the authorized schedule contains deliveries, returns, reservations, or maintenance attention."
          />
        ) : (
          <div className="divide-y divide-border">
            {events.slice(0, 6).map((event) => (
              <ScheduleRow
                key={event.id}
                event={event}
                booking={bookingsById.get(eventBookingId(event) ?? "")}
              />
            ))}
          </div>
        )}
      </Card>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
        <Snapshot base={base} />
        <RecentActivity
          notifications={[]}
          bookings={bookings}
          bookingsById={bookingsById}
        />
      </div>
    </div>
  );
}

function Snapshot({
  base,
  owner = false,
}: {
  base: AdminDashboardResponse;
  owner?: boolean;
}) {
  const rows = [
    {
      icon: <Car aria-hidden="true" className="h-6 w-6" />,
      label: "Active rentals",
      detail: "Vehicles currently on rent",
      value: base.operational.activeRentals,
    },
    {
      icon: <Car aria-hidden="true" className="h-6 w-6" />,
      label: "Available now",
      detail: "Active, maintenance-ready, and not on rent",
      value: base.operational.availableVehicles,
    },
  ];
  if (owner) {
    rows.push({
      icon: <Wrench aria-hidden="true" className="h-6 w-6" />,
      label: "Readiness attention",
      detail: "In maintenance or inspection attention",
      value: base.operational.readinessAttention,
    });
  }
  return (
    <Card>
      <CardHeader
        title={owner ? "Operational snapshot" : "Current snapshot"}
        hint={`Current snapshot · ${formatAdminDateTime(base.generatedAt)}`}
      />
      <div className="divide-y divide-border px-5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-4 py-4">
            <span className="text-primary" aria-hidden="true">
              {row.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{row.label}</p>
              <p className="text-sm text-muted-foreground">{row.detail}</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums">{row.value}</p>
          </div>
        ))}
      </div>
      {owner && base.operational.readinessAttention === 0 ? (
        <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
          No vehicles currently require readiness attention.
        </p>
      ) : null}
    </Card>
  );
}

function RecentActivity({
  notifications,
  bookings,
  bookingsById,
}: {
  notifications: NotificationsResponse["notifications"];
  bookings: AdminBooking[] | null;
  bookingsById: Map<string, AdminBooking>;
}) {
  const items =
    notifications.length > 0
      ? notifications
      : (bookings ?? []).slice(0, 4).map((booking) => ({
          id: booking.id,
          notificationType: "new_booking_request" as const,
          title: "Rental request",
          message: `${booking.customer?.full_name ?? "Customer"} · ${bookingReference(booking.id)}`,
          relatedEntityType: "booking" as const,
          relatedEntityId: booking.id,
          createdAt:
            booking.created_at ?? booking.updated_at ?? booking.pickup_at,
          readAt: null,
        }));
  return (
    <Card>
      <CardHeader
        title={notifications.length > 0 ? "Recent updates" : "Recent bookings"}
        right={
          <Link
            to="/admin/bookings"
            className="touch-target inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4"
          >
            View all bookings{" "}
            <span aria-hidden="true" className="ml-2 text-lg no-underline">
              →
            </span>
          </Link>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          title={
            bookings?.length === 0
              ? "No booking records yet"
              : "No recent updates"
          }
          description="Recent operational events will appear here when the authorized source contains them."
        />
      ) : (
        <div className="divide-y divide-border">
          {items.slice(0, 4).map((item) => {
            const bookingId =
              item.relatedEntityType === "booking"
                ? item.relatedEntityId
                : undefined;
            const booking = bookingId ? bookingsById.get(bookingId) : undefined;
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-5 py-3.5 text-sm"
              >
                <span className="mt-0.5 text-primary" aria-hidden="true">
                  {item.notificationType.includes("payment") ? (
                    <CreditCard className="h-5 w-5" />
                  ) : item.notificationType.includes("maintenance") ? (
                    <Wrench className="h-5 w-5" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {item.message}
                  </p>
                  {booking ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {booking.customer?.full_name ?? "Customer"} ·{" "}
                      {booking.requested_vehicle?.name ??
                        "Vehicle not assigned"}
                    </p>
                  ) : null}
                </div>
                <time
                  className="shrink-0 text-xs tabular-nums text-muted-foreground"
                  dateTime={item.createdAt}
                >
                  {formatAdminDateTime(item.createdAt)}
                </time>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ScheduleGroup({
  title,
  events,
  bookingsById,
}: {
  title: string;
  events: CalendarEvent[];
  bookingsById: Map<string, AdminBooking>;
}) {
  return (
    <section aria-labelledby={`schedule-${title.toLowerCase()}`}>
      <h3
        id={`schedule-${title.toLowerCase()}`}
        className="text-lg font-semibold"
      >
        {title}
      </h3>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No {title.toLowerCase()} scheduled today.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-border border-y border-border">
          {events.slice(0, 5).map((event) => (
            <ScheduleRow
              key={event.id}
              event={event}
              booking={bookingsById.get(eventBookingId(event) ?? "")}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ScheduleRow({
  event,
  booking,
}: {
  event: CalendarEvent;
  booking?: AdminBooking;
}) {
  const href = eventBookingId(event)
    ? `/admin/bookings/${encodeURIComponent(eventBookingId(event) ?? "")}`
    : undefined;
  const content = (
    <div className="flex items-start gap-3 py-3 text-sm">
      <Clock3
        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {booking?.customer?.full_name ?? event.label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {event.dateTime
            ? formatAdminDateTime(event.dateTime)
            : formatAdminDate(event.date)}{" "}
          · {event.kind}
        </p>
      </div>
      <span className="max-w-32 truncate text-xs text-muted-foreground">
        {booking?.pickup_branch?.name ?? "Operational schedule"}
      </span>
    </div>
  );
  return href ? (
    <Link to={href as never} className="block hover:bg-secondary">
      {content}
    </Link>
  ) : (
    content
  );
}
