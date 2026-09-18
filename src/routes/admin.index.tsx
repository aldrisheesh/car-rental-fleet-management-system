import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
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
    return <DashboardLoadingState />;
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

function DashboardLoadingState() {
  return (
    <div
      className="admin-dispatch-dashboard admin-dispatch-dashboard--loading"
      aria-busy="true"
      aria-label="Loading operational dashboard"
    >
      <span className="sr-only" role="status">
        Loading operational dashboard
      </span>
      <header className="admin-dispatch-heading">
        <div>
          <h1>Today at Briah’s</h1>
          <p>Keep every pickup, return, and review moving on time.</p>
        </div>
        <div className="admin-dispatch-heading__date" aria-hidden="true">
          <CalendarDays />
          <span>
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--date" />
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--timestamp" />
          </span>
        </div>
      </header>

      <section className="admin-trip-board" aria-labelledby="loading-trip-timeline-title">
        <div className="admin-dispatch-section-heading">
          <h2 id="loading-trip-timeline-title">Today’s trip timeline</h2>
          <i className="admin-dispatch-skeleton admin-dispatch-skeleton--link" aria-hidden="true" />
        </div>
        <div className="admin-trip-timeline" aria-hidden="true">
          <div className="admin-timeline-scale">
            {timelineTicks.map((tick) => (
              <span
                key={tick.hour}
                style={{ left: `${((tick.hour - 6) / 15) * 100}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
          <LoadingTimelineLane label="Pickups" positions={[22, 52]} />
          <LoadingTimelineLane label="Returns" positions={[38]} />
        </div>
      </section>

      <div className="admin-dispatch-grid" aria-hidden="true">
        <LoadingActionColumn />
        <LoadingReviewColumn />
        <LoadingFleetColumn />
      </div>
    </div>
  );
}

function LoadingTimelineLane({
  label,
  positions,
}: {
  label: string;
  positions: number[];
}) {
  return (
    <div className="admin-trip-lane">
      <h3>{label}</h3>
      <div className="admin-trip-lane__plot">
        {positions.map((position) => (
          <span
            key={position}
            className="admin-loading-trip-stop"
            style={{ left: `${position}%` }}
          >
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--line" />
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--short" />
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadingColumnHeader({ title }: { title: string }) {
  return (
    <div className="admin-dispatch-section-heading">
      <h2>{title}</h2>
      <i className="admin-dispatch-skeleton admin-dispatch-skeleton--link" />
    </div>
  );
}

function LoadingActionColumn() {
  return (
    <section className="admin-dispatch-column">
      <LoadingColumnHeader title="What to do next" />
      <div className="admin-loading-action-list">
        {[1, 2, 3, 4].map((item) => (
          <div className="admin-loading-action" key={item}>
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--circle" />
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--number" />
            <span>
              <i className="admin-dispatch-skeleton admin-dispatch-skeleton--line" />
              <i className="admin-dispatch-skeleton admin-dispatch-skeleton--short" />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function LoadingReviewColumn() {
  return (
    <section className="admin-dispatch-column admin-dispatch-reviews">
      <LoadingColumnHeader title="Requirements to review" />
      <div className="admin-loading-review-list">
        {[1, 2, 3, 4].map((item) => (
          <div className="admin-loading-review" key={item}>
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--circle" />
            <span>
              <i className="admin-dispatch-skeleton admin-dispatch-skeleton--line" />
              <i className="admin-dispatch-skeleton admin-dispatch-skeleton--short" />
            </span>
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--button" />
          </div>
        ))}
      </div>
    </section>
  );
}

function LoadingFleetColumn() {
  return (
    <section className="admin-dispatch-column">
      <LoadingColumnHeader title="Fleet availability" />
      <div className="admin-loading-fleet-list">
        {[1, 2, 3, 4].map((item) => (
          <div className="admin-loading-fleet" key={item}>
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--dot" />
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--line" />
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--number" />
          </div>
        ))}
        <div className="admin-loading-fleet-summary">
          <i className="admin-dispatch-skeleton admin-dispatch-skeleton--circle" />
          <span>
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--line" />
            <i className="admin-dispatch-skeleton admin-dispatch-skeleton--short" />
          </span>
        </div>
      </div>
    </section>
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

  const submittedBookings =
    data.bookings?.filter((booking) => booking.booking_status === "Submitted") ?? [];
  const reviewItems = staffView ? submittedBookings : pendingRequirements;
  const reviewSourceUnavailable = staffView
    ? data.bookings == null
    : data.requirements == null;
  const actionItems = staffView
    ? [
        {
          icon: <CalendarDays />,
          value: events.length,
          label: "handoffs today",
          detail: events.length > 0 ? "Open today’s operating schedule" : "No handoffs are scheduled today",
          href: "/admin/calendar",
        },
        {
          icon: <UserRound />,
          value: data.base.operational.submittedBookings,
          label: "requests to review",
          detail: "New rental requests awaiting operational review",
          href: "/admin/bookings?status=Submitted",
        },
        {
          icon: <CircleAlert />,
          value: data.notifications == null ? "—" : lowAvailability.length,
          label: "availability notices",
          detail: "Notices that may affect new reservations",
          href: "/admin/notifications",
        },
      ]
    : [
        {
          icon: <CalendarDays />,
          value: pickups.length,
          label: "pickups due",
          detail: pickups.length > 0 ? `Next: ${eventTime(pickups[0])}` : "No pickups scheduled today",
          href: "/admin/calendar",
        },
        {
          icon: <Clock3 />,
          value: returns.length,
          label: "returns due",
          detail: returns.length > 0 ? `Next: ${eventTime(returns[0])}` : "No returns scheduled today",
          href: "/admin/calendar",
        },
        {
          icon: <FileText />,
          value: data.requirements == null ? "—" : pendingRequirements.length,
          label: "requirements to review",
          detail: "Submitted customer documents awaiting review",
          href: "/admin/requirements",
        },
        {
          icon: <CreditCard />,
          value: data.payments == null ? "—" : pendingPayments.length,
          label: "payments to verify",
          detail: "Payment proofs awaiting verification",
          href: "/admin/payments",
        },
      ];

  return (
    <div className="admin-dispatch-dashboard">
      <header className="admin-dispatch-heading">
        <div>
          <h1>{staffView ? "Today’s operations" : "Today at Briah’s"}</h1>
          <p>Keep every pickup, return, and review moving on time.</p>
        </div>
        <div className="admin-dispatch-heading__date">
          <CalendarDays aria-hidden="true" />
          <span>
            <strong>{formatAdminDate(data.base.generatedAt)}</strong>
            <small>Updated {formatAdminDateTime(data.base.generatedAt)}</small>
          </span>
        </div>
      </header>

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

      <TripTimeline
        events={events}
        bookingsById={bookingsById}
        calendarAvailable={data.calendar != null}
      />

      <div className="admin-dispatch-grid">
        <section className="admin-dispatch-column" aria-labelledby="next-actions-title">
          <DashboardSectionHeader
            id="next-actions-title"
            title="What to do next"
            href={staffView ? "/admin/bookings" : "/admin/calendar"}
            action="Open operations"
          />
          <div className="admin-next-actions">
            {actionItems.map((item) => (
              <DispatchAction key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="admin-dispatch-column admin-dispatch-reviews" aria-labelledby="review-work-title">
          <DashboardSectionHeader
            id="review-work-title"
            title={staffView ? "Requests to review" : "Requirements to review"}
            href={staffView ? "/admin/bookings?status=Submitted" : "/admin/requirements"}
            action="View queue"
          />
          <ReviewWork
            items={reviewItems}
            staffView={staffView}
            sourceUnavailable={reviewSourceUnavailable}
          />
        </section>

        <section className="admin-dispatch-column" aria-labelledby="fleet-state-title">
          <DashboardSectionHeader
            id="fleet-state-title"
            title="Fleet availability"
            href="/admin/fleet"
            action="View fleet"
          />
          <FleetAvailability
            available={data.base.operational.availableVehicles}
            active={data.base.operational.activeRentals}
            dueBack={returns.length}
            attention={data.base.operational.readinessAttention}
          />
        </section>
      </div>

    </div>
  );
}

function eventTime(event: CalendarEvent | undefined) {
  if (!event?.dateTime) return "Time not recorded";
  const value = new Date(event.dateTime);
  if (Number.isNaN(value.getTime())) return "Time not recorded";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

const timelineTicks = [
  { label: "6:00 AM", hour: 6 },
  { label: "9:00 AM", hour: 9 },
  { label: "12:00 PM", hour: 12 },
  { label: "3:00 PM", hour: 15 },
  { label: "6:00 PM", hour: 18 },
  { label: "9:00 PM", hour: 21 },
];

function timelinePosition(event: CalendarEvent) {
  if (!event.dateTime) return 0;
  const parts = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(event.dateTime));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 6);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return Math.max(0, Math.min(100, ((hour + minute / 60 - 6) / 15) * 100));
}

function DashboardSectionHeader({
  id,
  title,
  href,
  action,
}: {
  id: string;
  title: string;
  href: string;
  action: string;
}) {
  return (
    <div className="admin-dispatch-section-heading">
      <h2 id={id}>{title}</h2>
      <Link to={href as never}>
        {action}
        <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}

function TripTimeline({
  events,
  bookingsById,
  calendarAvailable,
}: {
  events: CalendarEvent[];
  bookingsById: Map<string, AdminBooking>;
  calendarAvailable: boolean;
}) {
  const pickups = events.filter((event) => event.kind === "pickup");
  const returns = events.filter((event) => event.kind === "return");
  return (
    <section className="admin-trip-board" aria-labelledby="trip-timeline-title">
      <DashboardSectionHeader
        id="trip-timeline-title"
        title="Today’s trip timeline"
        href="/admin/calendar"
        action="View calendar"
      />
      {!calendarAvailable ? (
        <div className="admin-trip-board__empty" role="status">
          Today’s schedule is unavailable. Calendar data could not be loaded.
        </div>
      ) : events.length === 0 ? (
        <div className="admin-trip-board__empty">
          <strong>No handoffs scheduled today.</strong>
          <span>The board will update when a confirmed pickup or return enters today’s schedule.</span>
        </div>
      ) : (
        <div className="admin-trip-timeline">
          <div className="admin-timeline-scale" aria-hidden="true">
            {timelineTicks.map((tick) => (
              <span
                key={tick.hour}
                style={{ left: `${((tick.hour - 6) / 15) * 100}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
          <div className="admin-trip-lanes">
          <TimelineLane label="Pickups" events={pickups} bookingsById={bookingsById} />
          <TimelineLane label="Returns" events={returns} bookingsById={bookingsById} />
          </div>
        </div>
      )}
    </section>
  );
}

function TimelineLane({
  label,
  events,
  bookingsById,
}: {
  label: string;
  events: CalendarEvent[];
  bookingsById: Map<string, AdminBooking>;
}) {
  return (
    <div className="admin-trip-lane">
      <h3>{label}</h3>
      <div className="admin-trip-lane__plot">
        {events.length === 0 ? (
          <p className="admin-trip-lane__empty">No {label.toLowerCase()} scheduled</p>
        ) : (
          events.slice(0, 5).map((event) => {
            const bookingId = eventBookingId(event);
            const booking = bookingsById.get(bookingId ?? "");
            const position = timelinePosition(event);
            const isAtEnd = position > 80;
            const content = (
              <>
                <span className="admin-trip-marker" aria-hidden="true" />
                <strong>{eventTime(event)}</strong>
                <span>{booking?.requested_vehicle?.name ?? event.label}</span>
                <small>{booking?.customer?.full_name ?? (bookingId ? bookingReference(bookingId) : "Operational schedule")}</small>
              </>
            );
            return bookingId ? (
              <Link
                key={event.id}
                to={`/admin/bookings/${encodeURIComponent(bookingId)}` as never}
                className={`admin-trip-stop${isAtEnd ? " is-end" : ""}`}
                style={{ left: `${position}%` }}
              >
                {content}
              </Link>
            ) : (
              <div
                key={event.id}
                className={`admin-trip-stop${isAtEnd ? " is-end" : ""}`}
                style={{ left: `${position}%` }}
              >
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DispatchAction({
  icon,
  value,
  label,
  detail,
  href,
}: {
  icon: ReactNode;
  value: number | string;
  label: string;
  detail: string;
  href: string;
}) {
  return (
    <Link to={href as never} className="admin-next-action">
      <span className="admin-next-action__icon" aria-hidden="true">{icon}</span>
      <strong>{value}</strong>
      <span className="admin-next-action__copy">
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <ArrowRight className="admin-next-action__arrow" aria-hidden="true" />
    </Link>
  );
}

function ReviewWork({
  items,
  staffView,
  sourceUnavailable,
}: {
  items: Array<AdminBooking | AdminRequirementSet>;
  staffView: boolean;
  sourceUnavailable: boolean;
}) {
  if (sourceUnavailable) {
    return <div className="admin-review-empty" role="status">The review queue is temporarily unavailable.</div>;
  }
  if (items.length === 0) {
    return (
      <div className="admin-review-empty">
        <strong>Review queue is clear.</strong>
        <span>New submitted work will appear here.</span>
      </div>
    );
  }
  return (
    <div className="admin-review-list">
      {items.slice(0, 4).map((item) => {
        const bookingId = staffView ? item.id : (item as AdminRequirementSet).booking_id;
        const booking = staffView ? (item as AdminBooking) : (item as AdminRequirementSet).booking;
        const name = booking?.customer?.full_name ?? "Customer";
        const vehicle = booking?.requested_vehicle?.name ?? "Vehicle not assigned";
        const submittedAt = staffView
          ? ((item as AdminBooking).created_at ?? (item as AdminBooking).updated_at)
          : (item as AdminRequirementSet).submitted_at;
        const href = `/admin/bookings/${encodeURIComponent(bookingId)}`;
        return (
          <Link key={item.id} to={href as never} className="admin-review-item">
            <span className="admin-review-item__document" aria-hidden="true"><FileText /></span>
            <span className="admin-review-item__copy">
              <strong>{bookingReference(bookingId)}</strong>
              <b>{name}</b>
              <small>{vehicle}</small>
            </span>
            <time dateTime={submittedAt ?? undefined}>{formatAdminDateTime(submittedAt)}</time>
            <span className="admin-review-item__action">Review <ArrowRight aria-hidden="true" /></span>
          </Link>
        );
      })}
    </div>
  );
}

function FleetAvailability({
  available,
  active,
  dueBack,
  attention,
}: {
  available: number;
  active: number;
  dueBack: number;
  attention: number;
}) {
  const rows = [
    { label: "Available now", value: available, tone: "ready" },
    { label: "On active rental", value: active, tone: "active" },
    { label: "Due back today", value: dueBack, tone: "return" },
    { label: "Needs readiness attention", value: attention, tone: "attention" },
  ];
  return (
    <div className="admin-fleet-state">
      {rows.map((row) => (
        <div key={row.label} className="admin-fleet-state__row">
          <span className={`admin-fleet-state__dot is-${row.tone}`} aria-hidden="true" />
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
      <div className="admin-fleet-state__summary">
        <Car aria-hidden="true" />
        <span>
          <strong>{available} {available === 1 ? "car is" : "cars are"} ready to rent</strong>
          <small>Maintenance-ready and not currently on rent.</small>
        </span>
      </div>
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
