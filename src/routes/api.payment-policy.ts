import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PAYMENT_POLICY_VERSION } from "@/lib/payment-policy";

export const Route = createFileRoute("/api/payment-policy")({
  server: { handlers: { GET: handle, POST: handle } },
});

async function handle({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    if (principal.role !== "Customer/Renter")
      return Response.json({ message: "Forbidden." }, { status: 403 });
    const body = request.method === "POST" ? await request.json() : null;
    const bookingId =
      body?.bookingId ?? new URL(request.url).searchParams.get("bookingId");
    if (typeof bookingId !== "string" || !bookingId)
      return Response.json(
        { message: "Booking is required." },
        { status: 400 },
      );
    const client = getSupabaseServerClient();
    const booking = await client
      .from("booking_requests")
      .select("id")
      .eq("id", bookingId)
      .eq("customer_id", principal.userId)
      .maybeSingle();
    if (booking.error) throw booking.error;
    if (!booking.data)
      return Response.json({ message: "Booking not found." }, { status: 404 });
    if (request.method === "GET") {
      const result = await client
        .from("booking_payment_policy_acceptances")
        .select("acknowledged_at")
        .eq("booking_id", bookingId)
        .eq("customer_id", principal.userId)
        .eq("policy_version", PAYMENT_POLICY_VERSION)
        .maybeSingle();
      if (result.error) throw result.error;
      return Response.json(
        {
          accepted: Boolean(result.data),
          policyVersion: PAYMENT_POLICY_VERSION,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (
      body.policyAcknowledged !== true ||
      body.policyVersion !== PAYMENT_POLICY_VERSION
    )
      return Response.json(
        { message: "Please acknowledge the current payment policies." },
        { status: 400 },
      );
    const result = await client.rpc("acknowledge_booking_payment_policy", {
      p_booking_id: bookingId,
      p_customer_id: principal.userId,
      p_policy_version: PAYMENT_POLICY_VERSION,
    });
    if (result.error) {
      if (
        [
          "requirements_not_verified",
          "forbidden",
          "booking_not_found",
        ].includes(result.error.message)
      )
        return Response.json(
          {
            message:
              "Payment policies are available after your documents are verified.",
          },
          { status: 409 },
        );
      throw result.error;
    }
    return Response.json({
      accepted: true,
      policyVersion: PAYMENT_POLICY_VERSION,
    });
  } catch {
    return Response.json(
      {
        message:
          "Unable to save or check your payment policy acknowledgement. Please try again.",
      },
      { status: 503 },
    );
  }
}
