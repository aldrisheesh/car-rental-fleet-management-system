import { createFileRoute } from "@tanstack/react-router";
import { AuthBoundaryError, requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validCategory } from "@/lib/booking-categories";
import { dispatchBookingEmail } from "@/lib/transactional-email.server";

export const Route = createFileRoute("/api/booking-cancellations")({
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
    .select("id,customer_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (result.error) throw new Error("source_unavailable");
  if (
    !result.data ||
    (principal.role === "Customer/Renter" &&
      result.data.customer_id !== principal.userId)
  )
    throw new Error("forbidden");
  return { principal, client };
}
function caught(error: unknown) {
  if (error instanceof AuthBoundaryError)
    return fail(
      error.reason === "forbidden" ? "Forbidden." : "Authentication required.",
      error.reason === "forbidden" ? 403 : 401,
    );
  if (error instanceof Error && error.message === "forbidden")
    return fail("Forbidden.", 403);
  return fail("Cancellation requests are unavailable. Try again shortly.", 503);
}
async function read({ request }: { request: Request }) {
  try {
    const bookingId = new URL(request.url).searchParams.get("bookingId") ?? "";
    if (!bookingId) return fail("Booking ID is required.");
    const { client } = await accessible(bookingId);
    const result = await client
      .from("booking_cancellation_requests")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    if (result.error) throw new Error("source_unavailable");
    return Response.json(
      { requests: result.data },
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
    if (
      !body ||
      typeof body.bookingId !== "string" ||
      typeof body.reason !== "string" ||
      !body.reason.trim() ||
      body.reason.length > 500
    )
      return fail("Choose a reason of at most 500 characters.");
    const { principal, client } = await accessible(body.bookingId);
    let result;
    if (body.action === "request" && principal.role === "Customer/Renter") {
      if (
        !validCategory("cancellation", body.reason) ||
        body.acknowledged !== true
      )
        return fail(
          "Choose a cancellation reason and acknowledge that admin review is required.",
        );
      result = await client.rpc("request_booking_cancellation_atomic", {
        p_booking_id: body.bookingId,
        p_actor_id: principal.userId,
        p_reason: body.reason.trim(),
      });
    } else if (
      (body.action === "approve" || body.action === "reject") &&
      principal.role === "Owner/Admin"
    ) {
      if (typeof body.requestId !== "string")
        return fail("Request ID is required.");
      if (body.action === "approve" && body.paymentChecked !== true)
        return fail(
          "Check the payment record and cancellation terms before approving.",
        );
      const own = await client
        .from("booking_cancellation_requests")
        .select("id")
        .eq("id", body.requestId)
        .eq("booking_id", body.bookingId)
        .maybeSingle();
      if (own.error) throw new Error("source_unavailable");
      if (!own.data) return fail("Request not found.", 404);
      result = await client.rpc("review_booking_cancellation_atomic", {
        p_request_id: body.requestId,
        p_actor_id: principal.userId,
        p_action: body.action,
        p_reason: body.reason.trim(),
      });
    } else return fail("Forbidden.", 403);
    if (result.error) {
      const messages: Record<string, string> = {
        cancellation_unavailable:
          "This booking can no longer be cancelled online. Reload to check its current state.",
        booking_changed:
          "Booking dates changed. Decline this request and ask the customer to submit a new one for the updated dates.",
        request_already_reviewed:
          "This request was already reviewed. Reload to see the outcome.",
        reason_required: "A valid reason is required.",
        forbidden: "Forbidden.",
      };
      return fail(
        messages[result.error.message] ??
          "The request could not be saved. Reload and try again.",
        result.error.message === "forbidden" ? 403 : 409,
      );
    }
    await dispatchBookingEmail(body.bookingId);
    return Response.json(
      { request: result.data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return caught(error);
  }
}
