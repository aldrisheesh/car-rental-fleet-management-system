import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Btn } from "@/components/admin/ui";
import type {
  AdminCalendarResponse,
  CalendarEvent,
  CalendarEventKind,
} from "@/lib/admin-calendar";

export const Route = createFileRoute("/admin/calendar")({
  component: CalendarPage,
});

const kindClass: Record<CalendarEventKind, string> = {
  pickup: "is-pickup",
  return: "is-return",
  maintenance: "is-maintenance",
  reservation: "is-reservation",
};

const kindLabel: Record<CalendarEventKind, string> = {
  pickup: "Delivery",
  return: "Return",
  maintenance: "Maintenance",
  reservation: "Reserved",
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AdminCalendarResponse };

function currentManilaMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

function shiftMonth(period: string, amount: number) {
  const [year, month] = period.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatSelectedDate(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatEventTime(event: CalendarEvent) {
  if (!event.dateTime) return "All day";
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(event.dateTime));
}

function CalendarPage() {
  const [period, setPeriod] = useState(currentManilaMonth);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
    }).format(new Date());
    return today.startsWith(currentManilaMonth()) ? today : `${currentManilaMonth()}-01`;
  });
  const latestRequest = useRef(0);

  const loadCalendar = useCallback(async () => {
    const request = latestRequest.current + 1;
    latestRequest.current = request;
    setState({ status: "loading" });
    try {
      const response = await fetch(
        `/api/admin-calendar?month=${encodeURIComponent(period)}`,
        { credentials: "same-origin" },
      );
      const body = (await response.json().catch(() => null)) as
        | AdminCalendarResponse
        | { message?: string }
        | null;
      if (!response.ok || !body || !("events" in body)) {
        throw new Error(
          body && "message" in body && body.message
            ? body.message
            : "Unable to load the calendar schedule.",
        );
      }
      if (latestRequest.current === request) {
        setState({ status: "ready", data: body });
      }
    } catch (error) {
      if (latestRequest.current === request) {
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load the calendar schedule.",
        });
      }
    }
  }, [period]);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  const calendar = useMemo(() => {
    const [year, month] = period.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const startOffset = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const cells: (number | null)[] = [
      ...Array.from({ length: startOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return { cells };
  }, [period]);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
  }).format(new Date());
  const events = state.status === "ready" ? state.data.events : [];
  const selectedEvents = events.filter((event) => event.date === selectedDate);
  const selectedCounts = (Object.keys(kindLabel) as CalendarEventKind[]).map(
    (kind) => ({ kind, value: selectedEvents.filter((event) => event.kind === kind).length }),
  );

  const changeMonth = (amount: number) => {
    setPeriod((value) => {
      const next = shiftMonth(value, amount);
      setSelectedDate(`${next}-01`);
      return next;
    });
  };

  return (
    <div className="admin-calendar-workspace" aria-busy={state.status === "loading" || undefined}>
      <header className="admin-calendar-heading">
        <div>
          <h1>Calendar</h1>
          <p>Track reservations, delivery windows, returns, and maintenance.</p>
        </div>
        <div className="admin-calendar-controls">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
            className="touch-target admin-calendar-nav-button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2>{formatMonth(period)}</h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            className="touch-target admin-calendar-nav-button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="admin-calendar-layout">
        <section className="admin-calendar-board" aria-labelledby="calendar-month-heading">
          <div className="admin-calendar-board__heading">
            <h2 id="calendar-month-heading">{formatMonth(period)}</h2>
            <div className="admin-calendar-legend" aria-label="Calendar legend">
              {(Object.keys(kindLabel) as CalendarEventKind[]).map((kind) => (
                <span key={kind} className={kindClass[kind]}>
                  <i /> {kindLabel[kind]}
                </span>
              ))}
            </div>
          </div>

          {state.status === "loading" ? (
            <CalendarLoading />
          ) : state.status === "error" ? (
            <div role="alert" className="admin-calendar-message">
              <AlertTriangle className="h-6 w-6" />
              <p>{state.message}</p>
              <Btn onClick={() => void loadCalendar()}>
                <RefreshCw className="h-4 w-4" /> Retry
              </Btn>
            </div>
          ) : (
            <div className="admin-calendar-scroll">
              <div className="admin-calendar-grid">
                <div className="admin-calendar-weekdays">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="admin-calendar-days">
                  {calendar.cells.map((day, index) => {
                    const date = day ? `${period}-${String(day).padStart(2, "0")}` : null;
                    const dayEvents = date ? events.filter((event) => event.date === date) : [];
                    const primaryEvent = dayEvents[0];
                    const isWeekend = index % 7 === 0 || index % 7 === 6;
                    return (
                      <button
                        key={`${period}:${index}`}
                        type="button"
                        disabled={!date}
                        aria-label={date ? `${formatSelectedDate(date)}${dayEvents.length ? `, ${dayEvents.length} scheduled item${dayEvents.length === 1 ? "" : "s"}` : ", no scheduled items"}` : undefined}
                        onClick={() => date && setSelectedDate(date)}
                        className={`admin-calendar-day ${isWeekend ? "is-weekend" : ""} ${date === selectedDate ? "is-selected" : ""} ${date === today ? "is-today" : ""}`}
                      >
                        {day ? (
                          <>
                            <span className="admin-calendar-date">{day}</span>
                            {primaryEvent ? (
                              <span className={`admin-calendar-event ${kindClass[primaryEvent.kind]}`}>
                                <i /> {primaryEvent.label}
                              </span>
                            ) : null}
                            {dayEvents.length > 1 ? (
                              <span className="admin-calendar-more">+{dayEvents.length - 1} more</span>
                            ) : null}
                          </>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="admin-calendar-drawer" aria-labelledby="day-schedule-heading">
          <header>
            <h2 id="day-schedule-heading">{formatSelectedDate(selectedDate)}</h2>
            <p>{selectedEvents.length} scheduled {selectedEvents.length === 1 ? "item" : "items"}</p>
          </header>

          <div className="admin-calendar-day-events">
            {state.status === "ready" && selectedEvents.length > 0 ? (
              selectedEvents.map((event) => (
                <div key={event.id} className={`admin-calendar-day-event ${kindClass[event.kind]}`}>
                  <time>{formatEventTime(event)}</time>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{event.label}</strong>
                    <small>{kindLabel[event.kind]}</small>
                  </div>
                </div>
              ))
            ) : state.status === "ready" ? (
              <div className="admin-calendar-day-empty">
                <strong>No scheduled handoffs</strong>
                <p>No reservations, deliveries, returns, or maintenance are planned for this date.</p>
              </div>
            ) : null}
          </div>

          <section className="admin-calendar-signals" aria-labelledby="calendar-signals-heading">
            <div>
              <h3 id="calendar-signals-heading">Day at a glance</h3>
              <span>{formatMonth(period)}</span>
            </div>
            <dl>
              {selectedCounts.map(({ kind, value }) => (
                <div key={kind} className={kindClass[kind]}>
                  <dt>{kindLabel[kind]}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <Link to="/admin/bookings" className="admin-calendar-queue-link">
            Open operations queue <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function CalendarLoading() {
  return (
    <div className="admin-calendar-loading" aria-label="Loading calendar schedule">
      {Array.from({ length: 35 }, (_, index) => (
        <div key={index}><i /><i /></div>
      ))}
    </div>
  );
}
