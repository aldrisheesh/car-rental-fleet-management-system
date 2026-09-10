import type { AppRole } from "./auth";
import {
  loadAdminCalendar,
  type CalendarPeriod,
  type CalendarSources,
} from "./admin-calendar";
import { getSupabaseServerClient } from "./supabase/server";

export async function getCanonicalAdminCalendar(
  role: AppRole,
  period: CalendarPeriod,
) {
  return loadAdminCalendar(role, period, async () => {
    const client = getSupabaseServerClient();
    const [bookings, rentals, maintenance] = await Promise.all([
      client
        .from("booking_requests")
        .select(
          "id,booking_status,pickup_at,return_at,requested_vehicle:vehicles!booking_requests_requested_vehicle_id_fkey(name),assigned_vehicle:vehicles!booking_requests_assigned_vehicle_id_fkey(name)",
        )
        .or(
          `and(pickup_at.gte.${period.startInstant},pickup_at.lt.${period.endInstant}),and(return_at.gte.${period.startInstant},return_at.lt.${period.endInstant})`,
        ),
      client
        .from("rental_transactions")
        .select(
          "id,booking_id,scheduled_pickup_at,scheduled_return_at,vehicle:vehicles(name)",
        )
        .or(
          `and(scheduled_pickup_at.gte.${period.startInstant},scheduled_pickup_at.lt.${period.endInstant}),and(scheduled_return_at.gte.${period.startInstant},scheduled_return_at.lt.${period.endInstant})`,
        ),
      client
        .from("maintenance_records")
        .select(
          "id,maintenance_type,status,service_started_at,next_service_date,vehicle:vehicles(name)",
        )
        .or(
          `and(service_started_at.gte.${period.startInstant},service_started_at.lt.${period.endInstant}),and(next_service_date.gte.${period.startDate},next_service_date.lt.${period.endDate})`,
        ),
    ]);

    const failed = [bookings, rentals, maintenance].find(
      (result) => result.error,
    );
    if (failed?.error) throw new Error("canonical_calendar_source_failed");

    return {
      bookings: bookings.data ?? [],
      rentals: rentals.data ?? [],
      maintenance: maintenance.data ?? [],
    } as unknown as CalendarSources;
  });
}
