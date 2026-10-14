import { loadPaymentHoldBlocks } from "./payment-hold.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import type { RescheduleBlock } from "./reschedule-availability";

export async function loadRescheduleAvailability(
  client: SupabaseClient<Database>,
  bookingId: string,
) {
  const booking = await client
    .from("booking_requests")
    .select("id,assigned_vehicle_id,requested_vehicle_id,pickup_at,return_at")
    .eq("id", bookingId)
    .single();
  if (booking.error) throw booking.error;
  const vehicleId =
    booking.data.assigned_vehicle_id ?? booking.data.requested_vehicle_id;
  if (!vehicleId) throw Error("vehicle_missing");
  const [bookings, rentals, holds] = await Promise.all([
    client
      .from("booking_requests")
      .select("pickup_at,return_at")
      .eq("assigned_vehicle_id", vehicleId)
      .eq("booking_status", "Confirmed")
      .neq("id", bookingId)
      .gt("return_at", new Date().toISOString()),
    client
      .from("rental_transactions")
      .select("scheduled_pickup_at,scheduled_return_at")
      .eq("vehicle_id", vehicleId)
      .neq("booking_id", bookingId)
      .gt("scheduled_return_at", new Date().toISOString()),
    loadPaymentHoldBlocks(client, bookingId),
  ]);
  if (bookings.error || rentals.error) throw Error("availability_unavailable");
  const blocks: RescheduleBlock[] = [
    ...holds
      .filter((h) => h.vehicle_id === vehicleId)
      .map((h) => ({ start: h.pickup_at, end: h.return_at })),
    ...(bookings.data ?? []).map((b) => ({
      start: b.pickup_at,
      end: b.return_at,
    })),
    ...(rentals.data ?? []).map((r) => ({
      start: r.scheduled_pickup_at,
      end: r.scheduled_return_at,
    })),
  ];
  return {
    blocks,
    durationMs:
      new Date(booking.data.return_at).getTime() -
      new Date(booking.data.pickup_at).getTime(),
  };
}
