import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal, AuthBoundaryError } from "@/lib/auth.server";
import { dispatchBookingEmail } from "@/lib/transactional-email.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDateTimeLocalToInstant } from "@/lib/business-time";
export const Route = createFileRoute("/api/booking-resolution-offers")({
  server: { handlers: { GET: read, POST: write } },
});
const fail = (message: string, status = 400) =>
  Response.json({ message }, { status });
async function accessible(bookingId: string) {
  const principal = await requirePrincipal();
  if (principal.role !== "Owner/Admin" && principal.role !== "Customer/Renter")
    throw new Error("forbidden");
  const client = getSupabaseServerClient();
  const result = await client
    .from("booking_requests")
    .select(
      "id,customer_id,booking_status,pickup_branch_id,requested_vehicle_id",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (result.error) throw new Error("source_unavailable");
  if (
    !result.data ||
    (principal.role === "Customer/Renter" &&
      result.data.customer_id !== principal.userId)
  )
    throw new Error("forbidden");
  return { principal, client, booking: result.data };
}
function caught(error: unknown) {
  if (error instanceof AuthBoundaryError)
    return fail(
      error.reason === "forbidden" ? "Forbidden." : "Authentication required.",
      error.reason === "forbidden" ? 403 : 401,
    );
  return fail(
    error instanceof Error && error.message === "forbidden"
      ? "Forbidden."
      : "Alternative offers are unavailable. Try again shortly.",
    error instanceof Error && error.message === "forbidden" ? 403 : 503,
  );
}
async function read({ request }: { request: Request }) {
  try {
    const bookingId = new URL(request.url).searchParams.get("bookingId") ?? "";
    if (!bookingId) return fail("Booking ID is required.");
    const { client, booking, principal } = await accessible(bookingId);
    const [offers, payments, rentals, vehicleResult] = await Promise.all([
      client
        .from("booking_resolution_offers")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false }),
      client.from("payments").select("status").eq("booking_id", bookingId),
      client
        .from("rental_transactions")
        .select("id")
        .eq("booking_id", bookingId),
      client
        .from("vehicles")
        .select(
          "id,name,license_plate,branch_id,category_id,seat_capacity,is_active",
        )
        .order("name"),
    ]);
    if ([offers, payments, rentals, vehicleResult].some((r) => r.error))
      throw new Error("source_unavailable");
    const vehicles = vehicleResult.data ?? [];
    const original = vehicles.find(
      (v) => v.id === booking.requested_vehicle_id,
    );
    const offeredIds = new Set(
      (offers.data ?? []).map((o) => o.proposed_vehicle_id),
    );
    const visible =
      principal.role === "Owner/Admin"
        ? vehicles.filter(
            (v) =>
              original &&
              v.is_active &&
              v.branch_id === booking.pickup_branch_id &&
              v.category_id === original?.category_id &&
              v.seat_capacity !== null &&
              original.seat_capacity !== null &&
              v.seat_capacity >= original.seat_capacity,
          )
        : vehicles.filter((v) => offeredIds.has(v.id));
    return Response.json(
      {
        offers: offers.data,
        vehicles: visible.map((v) => ({
          id: v.id,
          name: v.license_plate ? `${v.name} (${v.license_plate})` : v.name,
        })),
        eligible:
          ["Submitted", "Confirmed"].includes(booking.booking_status) &&
          !rentals.data?.length &&
          (payments.data as { status: string }[] | null)?.some(
            (p) => p.status === "Verified",
          ),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return caught(error);
  }
}
async function write({ request }: { request: Request }) {
  try {
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body.bookingId !== "string")
      return fail("Booking ID is required.");
    const { principal, client } = await accessible(body.bookingId);
    let result;
    if (body.action === "create" && principal.role === "Owner/Admin") {
      const pickup = manilaDateTimeLocalToInstant(String(body.pickupAt ?? ""));
      if (
        !pickup ||
        typeof body.vehicleId !== "string" ||
        typeof body.note !== "string" ||
        !body.note.trim() ||
        body.note.length > 500 ||
        body.preservePrice !== true
      )
        return fail(
          "Choose the alternative, explain it, and confirm the saved price will be honored.",
        );
      result = await client.rpc("create_booking_resolution_offer", {
        p_booking_id: body.bookingId,
        p_actor_id: principal.userId,
        p_vehicle_id: body.vehicleId,
        p_pickup_at: pickup.toISOString(),
        p_note: body.note.trim(),
      });
    } else if (
      ["accept", "decline", "withdraw"].includes(String(body.action)) &&
      typeof body.offerId === "string"
    ) {
      if (
        body.action === "withdraw"
          ? principal.role !== "Owner/Admin"
          : principal.role !== "Customer/Renter"
      )
        return fail("Forbidden.", 403);
      if (body.action === "accept" && body.acknowledged !== true)
        return fail(
          "Review the vehicle, dates and saved price before accepting.",
        );
      const own = await client
        .from("booking_resolution_offers")
        .select("id")
        .eq("id", body.offerId)
        .eq("booking_id", body.bookingId)
        .maybeSingle();
      if (own.error) throw new Error("source_unavailable");
      if (!own.data) return fail("Offer not found.", 404);
      result = await client.rpc("respond_booking_resolution_offer", {
        p_offer_id: body.offerId,
        p_actor_id: principal.userId,
        p_action: String(body.action),
      });
    } else return fail("Forbidden.", 403);
    if (result.error) {
      const messages: Record<string, string> = {
        vehicle_conflict:
          "The car is reserved during those dates. Choose another option.",
        vehicle_already_rented: "The car currently has an active rental.",
        vehicle_maintenance_unready:
          "The car is blocked by maintenance or a due service requirement.",
        vehicle_inspection_pending:
          "Complete the vehicle's return inspection first.",
        offer_unavailable:
          "This booking is no longer eligible for an alternative offer.",
        offer_not_pending:
          "The offer was already resolved. Reload to see the outcome.",
        pending_request_requires_review:
          "Resolve the pending cancellation or date-change request first.",
        booking_changed:
          "The booking changed after this offer. Ask the owner for an updated offer.",
        quote_changed:
          "The saved quote changed. Ask the owner for an updated offer.",
        invalid_dates:
          "Choose future handover and return times from 8 AM to 6 PM, on the hour. New dates must start tomorrow or later.",
        incompatible_vehicle:
          "Choose a vehicle at the same pickup branch and in the same category, with enough seats.",
        offer_unchanged:
          "Choose a different vehicle or a different handover date.",
        forbidden: "Forbidden.",
      };
      return fail(
        result.error.code === "23505"
          ? "An offer is already awaiting a response. Withdraw it before proposing another."
          : (messages[result.error.message] ??
              "The offer could not be saved. Reload and try again."),
        result.error.message === "forbidden" ? 403 : 409,
      );
    }
    if (body.action === "accept") await dispatchBookingEmail(body.bookingId);
    return Response.json(
      { offer: result.data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return caught(error);
  }
}
