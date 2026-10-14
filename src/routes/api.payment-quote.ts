import { dispatchBookingEmail } from "@/lib/transactional-email.server";
import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal, requireRole } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const fail = (message: string, status = 400) =>
  Response.json({ message }, { status });

export const Route = createFileRoute("/api/payment-quote")({
  server: { handlers: { GET: read, POST: issue, PATCH: extend } },
});

async function read({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    if (principal.role === "Operations Staff") return fail("Forbidden.", 403);
    const bookingId = new URL(request.url).searchParams.get("bookingId") ?? "";
    if (!bookingId) return fail("Booking reference is required.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    const result = await client
      .from("booking_payment_quotes")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (result.error) return fail("Unable to load the booking quote.", 503);
    if (principal.role === "Customer/Renter") {
      const booking = await client
        .from("booking_requests")
        .select("customer_id")
        .eq("id", bookingId)
        .maybeSingle();
      if (!booking.data || booking.data.customer_id !== principal.userId)
        return fail("Forbidden.", 403);
    }
    const hold = await client
      .from("booking_payment_holds")
      .select(
        "booking_id,state,opened_at,deadline_at,review_due_at,generation,correction_count",
      )
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (hold.error) return fail("Unable to load the payment hold.", 503);
    return Response.json(
      { quote: result.data, hold: hold.data },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      error instanceof Error && error.message === "forbidden" ? 403 : 401,
    );
  }
}

async function issue({ request }: { request: Request }) {
  try {
    const principal = await requireRole("Owner/Admin");
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
    const deliveryFee = Number(body?.deliveryFee);
    if (!bookingId) return fail("Booking reference is required.");
    if (
      body?.deadline != null &&
      (typeof body.deadline !== "string" ||
        !Number.isFinite(Date.parse(body.deadline)))
    )
      return fail("Enter a valid payment deadline.");
    if (
      !Number.isFinite(deliveryFee) ||
      deliveryFee < 0 ||
      deliveryFee > 99_999_999.99
    )
      return fail("Enter a valid delivery fee.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    const result = await client.rpc("issue_booking_payment_quote_with_hold", {
      p_booking_id: bookingId,
      p_delivery_fee: deliveryFee,
      p_actor_id: principal.userId,
      p_deadline: typeof body?.deadline === "string" ? body.deadline : null,
    });
    if (result.error) {
      const messages: Record<string, [string, number]> = {
        custom_deadline_only_for_urgent_booking: [
          "Standard quotes use a 24-hour hold. Extend an issued hold with a recorded reason.",
          400,
        ],
        urgent_payment_deadline_required: [
          "Set a payment deadline before handover for this urgent booking.",
          409,
        ],
        invalid_payment_deadline: [
          "The deadline must be in the future and before pickup.",
          400,
        ],
        quote_vehicle_mismatch: [
          "The quote vehicle differs from the assignment. Resolve the assignment before quoting.",
          409,
        ],
        vehicle_conflict: [
          "This vehicle is reserved or held for overlapping dates. Review alternatives before requesting payment.",
          409,
        ],
        vehicle_already_rented: ["This vehicle has an active rental.", 409],
        vehicle_maintenance_unready: [
          "Resolve the vehicle maintenance restrictions before quoting.",
          409,
        ],
        vehicle_inspection_pending: [
          "Complete the vehicle inspection before quoting.",
          409,
        ],
        booking_not_submitted: [
          "This request is no longer eligible for a payment quote.",
          409,
        ],
        forbidden: ["Forbidden.", 403],
        booking_not_found: ["Booking not found.", 404],
        pickup_arrangement_required: [
          "Save the pickup and return meeting details before sending the quote.",
          409,
        ],
        requirements_not_verified: [
          "Verify requirements before issuing a quote.",
          409,
        ],
        daily_rate_unavailable: ["This vehicle has no usable daily rate.", 409],
        quote_locked_by_payment: [
          "The quote is locked after payment submission.",
          409,
        ],
        invalid_delivery_fee: ["Enter a valid delivery fee.", 400],
        invalid_rental_period: ["Return must be after pickup.", 409],
      };
      const mapped = messages[result.error.message];
      return fail(
        mapped?.[0] ?? "Unable to issue the booking quote.",
        mapped?.[1] ?? 503,
      );
    }
    await dispatchBookingEmail(bookingId);
    return Response.json({ quote: result.data });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      error instanceof Error && error.message === "forbidden" ? 403 : 401,
    );
  }
}

async function extend({ request }: { request: Request }) {
  try {
    const principal = await requireRole("Owner/Admin");
    const body = await request.json().catch(() => null);
    if (
      typeof body?.bookingId !== "string" ||
      typeof body?.deadline !== "string" ||
      typeof body?.reason !== "string" ||
      !Number.isFinite(Date.parse(body.deadline))
    )
      return fail("Enter a deadline and reason.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    const result = await client.rpc("extend_booking_payment_hold", {
      p_booking_id: body.bookingId,
      p_actor_id: principal.userId,
      p_deadline: body.deadline,
      p_reason: body.reason,
    });
    if (result.error) {
      const messages: Record<string, string> = {
        forbidden: "Forbidden.",
        hold_not_extendable:
          "This hold cannot be extended in its current stage.",
        invalid_payment_deadline: "Choose a later deadline before pickup.",
        reason_required: "Record a reason for the extension.",
        vehicle_conflict:
          "Another booking or payment hold now occupies these dates. Review alternatives.",
        vehicle_already_rented: "The vehicle has an active rental.",
        vehicle_maintenance_unready: "The vehicle is blocked by maintenance.",
        vehicle_inspection_pending: "Complete the vehicle inspection first.",
      };
      return fail(
        messages[result.error.message] ?? "Unable to extend the hold.",
        409,
      );
    }
    await dispatchBookingEmail(body.bookingId);
    return Response.json({ hold: result.data });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      error instanceof Error && error.message === "forbidden" ? 403 : 401,
    );
  }
}
