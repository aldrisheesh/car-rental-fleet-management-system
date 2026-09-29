import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const fail = (message: string, status = 400) =>
  Response.json({ message }, { status });

export const Route = createFileRoute("/api/payment-terms")({
  server: { handlers: { POST: setPaymentRequirement } },
});

async function setPaymentRequirement({ request }: { request: Request }) {
  try {
    const principal = await requireRole("Owner/Admin");
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
    const requiredAmount = Number(body?.requiredAmount);
    if (!bookingId.trim()) return fail("Booking reference is required.");
    if (
      !Number.isFinite(requiredAmount) ||
      requiredAmount <= 0 ||
      requiredAmount > 99_999_999.99
    ) {
      return fail("Enter a valid required payment amount.");
    }

    // This RPC performs the eligibility check, row lock, write, and audit entry
    // in one transaction. The browser never receives service-role access.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    const result = await client.rpc("set_booking_payment_requirement", {
      p_booking_id: bookingId,
      p_actor_id: principal.userId,
      p_required_amount: requiredAmount,
    });
    if (result.error) {
      const messages: Record<string, { message: string; status: number }> = {
        forbidden: { message: "Forbidden.", status: 403 },
        booking_not_found: { message: "Booking not found.", status: 404 },
        requirements_not_verified: {
          message: "Verify customer requirements before recording payment terms.",
          status: 409,
        },
        payment_requirement_locked: {
          message:
            "The required payment amount is locked after a payment proof is submitted.",
          status: 409,
        },
        invalid_required_amount: {
          message: "Enter a valid required payment amount.",
          status: 400,
        },
      };
      const mapped = messages[result.error.message];
      return fail(mapped?.message ?? "Unable to record the payment amount.", mapped?.status ?? 503);
    }
    return Response.json({ payment: result.data });
  } catch (cause) {
    return fail(
      cause instanceof Error && cause.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      cause instanceof Error && cause.message === "forbidden" ? 403 : 401,
    );
  }
}
