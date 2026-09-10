import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Btn, Card, CardHeader, PageHeader } from "@/components/admin/ui";
import type {
  AdminCalendarResponse,
  CalendarEvent,
  CalendarEventKind,
} from "@/lib/admin-calendar";

export const Route = createFileRoute("/admin/calendar")({
  component: CalendarPage,
});

const kindStyles: Record<CalendarEventKind, string> = {
  pickup: "bg-primary/15 text-primary border-primary/30",
  return: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  maintenance: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  reservation: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const kindLabel: Record<CalendarEventKind, string> = {
  pickup: "Pickup",
  return: "Return",
  maintenance: "Maintenance",
  reservation: "Reservation",
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

function formatEventDate(event: CalendarEvent) {
  if (!event.dateTime)
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(`${event.date}T00:00:00Z`));
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(event.dateTime));
}

function CalendarPage() {
  const [period, setPeriod] = useState(currentManilaMonth);
  const [state, setState] = useState<LoadState>({ status: "loading" });
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
      if (!response.ok || !body || !("events" in body))
        throw new Error(
          body && "message" in body && body.message
            ? body.message
            : "Unable to load the calendar schedule.",
        );
      if (latestRequest.current === request)
        setState({ status: "ready", data: body });
    } catch (error) {
      if (latestRequest.current === request)
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load the calendar schedule.",
        });
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

  const events = state.status === "ready" ? state.data.events : [];
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
  }).format(new Date());

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Canonical view of reservations, pickups, returns, and maintenance."
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setPeriod((value) => shiftMonth(value, -1))}
              className="touch-target grid place-items-center rounded-md border border-border bg-background hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="min-w-32 text-center font-display text-base font-semibold sm:min-w-36">
              {formatMonth(period)}
            </h2>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setPeriod((value) => shiftMonth(value, 1))}
              className="touch-target grid place-items-center rounded-md border border-border bg-background hover:bg-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {(Object.keys(kindLabel) as CalendarEventKind[]).map((kind) => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${kindStyles[kind].split(" ")[0].replace("/15", "")}`}
                />
                <span className="text-muted-foreground">{kindLabel[kind]}</span>
              </span>
            ))}
          </div>
        </div>

        {state.status === "loading" ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            Loading calendar schedule...
          </p>
        ) : state.status === "error" ? (
          <div role="alert" className="px-5 py-10 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-amber-400" />
            <p className="mt-3 text-sm">{state.message}</p>
            <Btn className="mt-4" onClick={() => void loadCalendar()}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Btn>
          </div>
        ) : (
          <>
            {events.length === 0 ? (
              <p className="border-b border-border px-5 py-4 text-center text-sm text-muted-foreground">
                No reservations, pickups, returns, or maintenance are scheduled
                for {formatMonth(period)}.
              </p>
            ) : null}
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-7 border-b border-border bg-secondary/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="border-r border-border px-3 py-2 last:border-r-0"
                      >
                        {day}
                      </div>
                    ),
                  )}
                </div>

                <div className="grid grid-cols-7">
                  {calendar.cells.map((day, index) => {
                    const date = day
                      ? `${period}-${String(day).padStart(2, "0")}`
                      : null;
                    const dayEvents = date
                      ? events.filter((event) => event.date === date)
                      : [];
                    const isWeekend = index % 7 === 0 || index % 7 === 6;
                    return (
                      <div
                        key={`${period}:${index}`}
                        className={`min-h-28 border-b border-r border-border p-2 last:border-r-0 ${isWeekend ? "bg-background/40" : ""} ${index >= calendar.cells.length - 7 ? "border-b-0" : ""}`}
                      >
                        {day ? (
                          <>
                            <div
                              className={`mb-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs ${date === today ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground"}`}
                            >
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.map((event) => (
                                <div
                                  key={event.id}
                                  title={`${event.label} · ${formatEventDate(event)}`}
                                  className={`truncate rounded border px-1.5 py-0.5 text-[10px] font-medium ${kindStyles[event.kind]}`}
                                >
                                  {event.label}
                                </div>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {state.status === "ready" && events.length > 0 ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <EventList
            title="Reservations & pickups"
            events={events.filter(
              (event) =>
                event.kind === "reservation" || event.kind === "pickup",
            )}
          />
          <EventList
            title="Returns & maintenance"
            events={events.filter(
              (event) =>
                event.kind === "return" || event.kind === "maintenance",
            )}
          />
        </div>
      ) : null}
    </div>
  );
}

function EventList({
  title,
  events,
}: {
  title: string;
  events: CalendarEvent[];
}) {
  return (
    <Card>
      <CardHeader title={title} />
      {events.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          No matching events this month.
        </p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
            >
              <div className="min-w-0">
                <div className="font-medium">{event.label}</div>
                <div className="text-xs text-muted-foreground">
                  {formatEventDate(event)}
                </div>
              </div>
              <span
                className={`rounded border px-2 py-0.5 text-[10px] font-medium ${kindStyles[event.kind]}`}
              >
                {kindLabel[event.kind]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
