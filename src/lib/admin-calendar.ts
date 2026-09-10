import type { AppRole } from "./auth.ts";
import { instantToManilaCalendarDate } from "./business-time.ts";

export type CalendarEventKind =
  | "pickup"
  | "return"
  | "maintenance"
  | "reservation";

export type CalendarEvent = {
  id: string;
  date: string;
  dateTime: string | null;
  label: string;
  kind: CalendarEventKind;
};

export type CalendarBookingRecord = {
  id: string;
  booking_status: string;
  pickup_at: string;
  return_at: string;
  requested_vehicle: { name: string } | null;
  assigned_vehicle: { name: string } | null;
};

export type CalendarRentalRecord = {
  id: string;
  booking_id: string;
  scheduled_pickup_at: string;
  scheduled_return_at: string;
  vehicle: { name: string } | null;
};

export type CalendarMaintenanceRecord = {
  id: string;
  maintenance_type: string;
  status: "Open" | "Completed" | "Cancelled";
  service_started_at: string;
  next_service_date: string | null;
  vehicle: { name: string } | null;
};

export type CalendarSources = {
  bookings: CalendarBookingRecord[];
  rentals: CalendarRentalRecord[];
  maintenance: CalendarMaintenanceRecord[];
};

export type AdminCalendarResponse = {
  period: string;
  role: "Owner/Admin" | "Operations Staff";
  events: CalendarEvent[];
};

export type CalendarPeriod = {
  key: string;
  startDate: string;
  endDate: string;
  startInstant: string;
  endInstant: string;
};

function dateKey(year: number, month: number, day = 1) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseCalendarPeriod(value: string | null): CalendarPeriod {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) throw new Error("invalid_period");
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 1000 || month < 1 || month > 12) throw new Error("invalid_period");

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const startDate = dateKey(year, month);
  const endDate = dateKey(nextYear, nextMonth);
  return {
    key: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`,
    startDate,
    endDate,
    startInstant: new Date(`${startDate}T00:00:00+08:00`).toISOString(),
    endInstant: new Date(`${endDate}T00:00:00+08:00`).toISOString(),
  };
}

function eventFromInstant(
  id: string,
  dateTime: string,
  label: string,
  kind: CalendarEventKind,
): CalendarEvent {
  return {
    id,
    date: instantToManilaCalendarDate(new Date(dateTime)),
    dateTime,
    label,
    kind,
  };
}

function vehicleName(
  primary: { name: string } | null,
  fallback?: { name: string } | null,
) {
  return primary?.name ?? fallback?.name ?? "Unassigned vehicle";
}

export function buildAdminCalendar(
  role: AppRole,
  period: CalendarPeriod,
  sources: CalendarSources,
): AdminCalendarResponse {
  if (role === "Customer/Renter") throw new Error("forbidden");

  const events: CalendarEvent[] = [];
  const rentalBookingIds = new Set(
    sources.rentals.map((rental) => rental.booking_id),
  );

  for (const booking of sources.bookings) {
    if (
      booking.booking_status === "Cancelled" ||
      rentalBookingIds.has(booking.id)
    )
      continue;
    const name = vehicleName(
      booking.assigned_vehicle,
      booking.requested_vehicle,
    );
    if (booking.booking_status === "Submitted") {
      events.push(
        eventFromInstant(
          `booking:${booking.id}:reservation`,
          booking.pickup_at,
          `${name} reservation`,
          "reservation",
        ),
      );
      continue;
    }
    if (booking.booking_status === "Confirmed") {
      events.push(
        eventFromInstant(
          `booking:${booking.id}:pickup`,
          booking.pickup_at,
          `${name} pickup`,
          "pickup",
        ),
        eventFromInstant(
          `booking:${booking.id}:return`,
          booking.return_at,
          `${name} return`,
          "return",
        ),
      );
    }
  }

  for (const rental of sources.rentals) {
    const name = vehicleName(rental.vehicle);
    events.push(
      eventFromInstant(
        `rental:${rental.id}:pickup`,
        rental.scheduled_pickup_at,
        `${name} pickup`,
        "pickup",
      ),
      eventFromInstant(
        `rental:${rental.id}:return`,
        rental.scheduled_return_at,
        `${name} return`,
        "return",
      ),
    );
  }

  for (const record of sources.maintenance) {
    if (record.status === "Cancelled") continue;
    const name = vehicleName(record.vehicle);
    if (record.status === "Open") {
      events.push(
        eventFromInstant(
          `maintenance:${record.id}:service`,
          record.service_started_at,
          `${name} · ${record.maintenance_type}`,
          "maintenance",
        ),
      );
    }
    if (record.next_service_date) {
      events.push({
        id: `maintenance:${record.id}:next`,
        date: record.next_service_date,
        dateTime: null,
        label: `${name} · ${record.maintenance_type} due`,
        kind: "maintenance",
      });
    }
  }

  return {
    period: period.key,
    role,
    events: events
      .filter(
        (event) =>
          event.date >= period.startDate && event.date < period.endDate,
      )
      .sort(
        (left, right) =>
          left.date.localeCompare(right.date) ||
          (left.dateTime ?? "").localeCompare(right.dateTime ?? "") ||
          left.label.localeCompare(right.label),
      ),
  };
}

export async function loadAdminCalendar(
  role: AppRole,
  period: CalendarPeriod,
  loadSources: () => Promise<CalendarSources>,
) {
  if (role === "Customer/Renter") throw new Error("forbidden");
  return buildAdminCalendar(role, period, await loadSources());
}
