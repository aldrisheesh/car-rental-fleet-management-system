import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";

type HoldBlock = {
  booking_id: string;
  vehicle_id: string;
  pickup_at: string;
  return_at: string;
};
export async function loadPaymentHoldBlocks(
  client: SupabaseClient<Database>,
  excludeBookingId?: string,
) {
  const rows: HoldBlock[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = client
      .from("booking_payment_holds")
      .select("booking_id,vehicle_id,pickup_at,return_at")
      .or(
        `state.in.(Review,Verified),and(state.in.(AwaitingPayment,Correction),deadline_at.gt.${new Date().toISOString()})`,
      )
      .order("booking_id")
      .range(offset, offset + 499);
    if (excludeBookingId) query = query.neq("booking_id", excludeBookingId);
    const result = await query;
    if (result.error) throw new Error("payment_hold_availability_unavailable");
    rows.push(...result.data);
    if (result.data.length < 500) return rows;
  }
}
