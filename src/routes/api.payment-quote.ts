import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal, requireRole } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const fail = (message: string, status = 400) => Response.json({ message }, { status });

export const Route = createFileRoute("/api/payment-quote")({
  server: { handlers: { GET: read, POST: issue } },
});

async function read({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
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
      const booking = await client.from("booking_requests").select("customer_id").eq("id", bookingId).maybeSingle();
      if (!booking.data || booking.data.customer_id !== principal.userId) return fail("Forbidden.", 403);
    }
    return Response.json({ quote: result.data });
  } catch (error) {
    return fail(error instanceof Error && error.message === "forbidden" ? "Forbidden." : "Authentication required.", error instanceof Error && error.message === "forbidden" ? 403 : 401);
  }
}

async function issue({ request }: { request: Request }) {
  try {
    const principal = await requireRole("Owner/Admin");
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
    const deliveryFee = Number(body?.deliveryFee);
    if (!bookingId) return fail("Booking reference is required.");
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || deliveryFee > 99_999_999.99) return fail("Enter a valid delivery fee.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    const result = await client.rpc("issue_booking_payment_quote", {
      p_booking_id: bookingId,
      p_delivery_fee: deliveryFee,
      p_actor_id: principal.userId,
    });
    if (result.error) {
      const messages: Record<string, [string, number]> = {
        forbidden: ["Forbidden.", 403], booking_not_found: ["Booking not found.", 404],
        requirements_not_verified: ["Verify requirements before issuing a quote.", 409],
        daily_rate_unavailable: ["This vehicle has no usable daily rate.", 409],
        quote_locked_by_payment: ["The quote is locked after payment submission.", 409],
        invalid_delivery_fee: ["Enter a valid delivery fee.", 400], invalid_rental_period: ["Return must be after pickup.", 409],
      };
      const mapped = messages[result.error.message];
      return fail(mapped?.[0] ?? "Unable to issue the booking quote.", mapped?.[1] ?? 503);
    }
    return Response.json({ quote: result.data });
  } catch (error) {
    return fail(error instanceof Error && error.message === "forbidden" ? "Forbidden." : "Authentication required.", error instanceof Error && error.message === "forbidden" ? 403 : 401);
  }
}
