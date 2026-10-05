import { isHandoverTime } from "@/lib/handover-times";
import { dispatchBookingEmail } from "@/lib/transactional-email.server";
import { createFileRoute } from "@tanstack/react-router";
import { AuthBoundaryError, requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDateTimeLocalToInstant } from "@/lib/business-time";
import { validCategory } from "@/lib/booking-categories";
import { loadRescheduleAvailability } from "@/lib/reschedule-availability.server";
import { hasRescheduleConflict } from "@/lib/reschedule-availability";
export const Route = createFileRoute("/api/booking-date-changes")({
  server: { handlers: { GET: read, POST: write } },
});
const fail = (message: string, status = 400) =>
  Response.json({ message }, { status });
async function accessible(bookingId: string) {
  const principal = await requirePrincipal();
  const client = getSupabaseServerClient();
  if (!["Owner/Admin", "Customer/Renter"].includes(principal.role))
    throw Error("forbidden");
  const result = await client
    .from("booking_requests")
    .select("id,customer_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (result.error) throw Error("unavailable");
  if (
    !result.data ||
    (principal.role === "Customer/Renter" &&
      result.data.customer_id !== principal.userId)
  )
    throw Error("forbidden");
  return { principal, client };
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
      : "Unable to access date-change requests.",
    error instanceof Error && error.message === "forbidden" ? 403 : 503,
  );
}
async function read({ request }: { request: Request }) {
  try {
    const bookingId = new URL(request.url).searchParams.get("bookingId") ?? "";
    const { client } = await accessible(bookingId);
    if (new URL(request.url).searchParams.get("availability") === "true")
      return Response.json(
        await loadRescheduleAvailability(client, bookingId),
        { headers: { "Cache-Control": "no-store" } },
      );
    const result = await client
      .from("booking_date_change_requests")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    return result.error
      ? fail("Unable to load date-change requests.", 503)
      : Response.json({ requests: result.data });
  } catch (error) {
    return caught(error);
  }
}
async function write({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { principal, client } = await accessible(
      String(body.bookingId ?? ""),
    );
    let result;
    if (body.action === "request" && principal.role === "Customer/Renter") {
      if (!validCategory("rescheduling", body.reason))
        return fail("Choose a date-change reason; add details for Other.");
      const pickup = manilaDateTimeLocalToInstant(String(body.pickupAt ?? ""));
      if (!pickup) return fail("Enter a valid new handover date and time.");
      if (!isHandoverTime(String(body.pickupAt ?? "")))
        return fail("Choose a handover time from 8 AM to 6 PM, on the hour.");
      const availability = await loadRescheduleAvailability(
        client,
        body.bookingId,
      );
      if (
        hasRescheduleConflict(
          pickup,
          availability.durationMs,
          availability.blocks,
        )
      )
        return fail(
          "The car is unavailable for the full rental duration at that handover time. Choose another date or time.",
          409,
        );
      result = await client.rpc("request_booking_date_change", {
        p_booking_id: body.bookingId,
        p_actor_id: principal.userId,
        p_pickup_at: pickup.toISOString(),
        p_reason: body.reason,
      });
    } else if (
      ["approve", "reject"].includes(body.action) &&
      principal.role === "Owner/Admin"
    ) {
      if (body.action === "approve" && body.handoverChecked !== true)
        return fail(
          "Confirm the new dates and handover instructions with the customer before approval.",
        );
      if (
        body.action === "reject" &&
        !validCategory("reschedule_decline", body.reason)
      )
        return fail("Choose a reason for declining the date change.");
      const own = await client
        .from("booking_date_change_requests")
        .select("id")
        .eq("id", body.requestId)
        .eq("booking_id", body.bookingId)
        .maybeSingle();
      if (!own.data) return fail("Request not found.", 404);
      result = await client.rpc("review_booking_date_change", {
        p_request_id: body.requestId,
        p_actor_id: principal.userId,
        p_action: body.action,
        p_reason: body.reason ?? "",
      });
    } else return fail("Forbidden.", 403);
    if (result.error) {
      const messages: Record<string, string> = {
        vehicle_already_rented:
          "The car has an active rental. The original booking is unchanged.",
        vehicle_conflict:
          "The car is reserved during the requested dates. The original booking is unchanged.",
        vehicle_unavailable: "The car is currently unavailable.",
        vehicle_inspection_pending:
          "Complete the pending vehicle inspection first.",
        vehicle_maintenance_unready: "The car is blocked by maintenance.",
        date_change_unavailable:
          "Date changes are available only before handover for an unstarted booking.",
        stale_dates: "The booking dates changed. Reload before reviewing.",
        invalid_dates:
          "Choose a different handover date at least one calendar day ahead.",
        request_not_pending: "This request has already been reviewed.",
      };
      return fail(
        result.error.code === "23505"
          ? "A date-change request is already pending."
          : (messages[result.error.message] ??
              "Unable to save the date-change request."),
        409,
      );
    }
    await dispatchBookingEmail(String(body.bookingId));
    return Response.json({ request: result.data });
  } catch (error) {
    return caught(error);
  }
}
