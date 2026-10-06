import {
  hasCurrentPaymentPolicyAcknowledgement,
  PAYMENT_POLICY_VERSION,
} from "@/lib/payment-policy";
import { validCategory } from "@/lib/booking-categories";
import { dispatchBookingEmail } from "@/lib/transactional-email.server";
import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateRequirementFile } from "@/lib/requirements-validation";
import { isPaymentEligibleRequirementStatus } from "@/lib/requirements-access";
import { projectCustomerPayment } from "@/lib/payment-integrity";

const error = (message: string, status = 400) =>
  Response.json({ message }, { status });
const safeName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "proof";

export const Route = createFileRoute("/api/payments")({
  server: { handlers: { GET: read, POST: mutate } },
});

async function read({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    // Supabase's generated relationship/RPC types do not cover this legacy payment query yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    const url = new URL(request.url);
    const bookingId = url.searchParams.get("bookingId");
    const proofId = url.searchParams.get("proofId");
    if (proofId) {
      const proof = await client
        .from("payment_proofs")
        .select("*")
        .eq("id", proofId)
        .maybeSingle();
      if (
        !proof.data ||
        principal.role === "Operations Staff" ||
        (principal.role === "Customer/Renter" &&
          proof.data.customer_id !== principal.userId)
      )
        return error("Forbidden.", 403);
      const signed = await client.storage
        .from("payment-proofs")
        .createSignedUrl(proof.data.storage_path, 300);
      if (signed.error) return error("Unable to open proof.", 503);
      return Response.json({ url: signed.data.signedUrl });
    }
    if (principal.role === "Operations Staff")
      return Response.json({ payments: [] });
    if (
      principal.role === "Owner/Admin" &&
      url.searchParams.get("view") === "summary"
    ) {
      const result = await client
        .from("payments")
        .select("id,booking_id,status")
        .order("updated_at", { ascending: false });
      if (result.error) return error("Unable to load payments.", 503);
      return Response.json({ payments: result.data ?? [] });
    }
    let query = client
      .from("payments")
      .select(
        "*, booking:booking_requests(id,booking_status,customer:profiles!booking_requests_customer_id_fkey(id,full_name,email)), payment_methods(id,code,label,recipient_name,account_number,qr_image_path), payment_proofs(*)",
      )
      .order("updated_at", { ascending: false });
    if (principal.role === "Customer/Renter")
      query = query.eq("customer_id", principal.userId);
    if (bookingId) query = query.eq("booking_id", bookingId);
    if (url.searchParams.get("paymentId"))
      query = query.eq("id", url.searchParams.get("paymentId"));
    const [result, methods] = await Promise.all([
      query,
      client
        .from("payment_methods")
        .select("id,code,label,recipient_name,account_number,qr_image_path")
        .eq("is_active", true)
        .order("label"),
    ]);
    if (result.error) return error("Unable to load payments.", 503);
    const bookingIds = [
      ...new Set(
        (result.data ?? []).map(
          (payment: { booking_id: string }) => payment.booking_id,
        ),
      ),
    ];
    const quotes = bookingIds.length
      ? await client
          .from("booking_payment_quotes")
          .select("*")
          .in("booking_id", bookingIds)
      : { data: [] };
    // A quote enriches payment review, but it must not prevent the operational
    // payment queue from loading when its source is temporarily unavailable.
    const quoteByBooking = new Map(
      (quotes.error ? [] : (quotes.data ?? [])).map(
        (quote: { booking_id: string }) => [quote.booking_id, quote],
      ),
    );
    const enrichedPayments = (result.data ?? []).map(
      (payment: { booking_id: string }) => ({
        ...payment,
        payment_quote: quoteByBooking.get(payment.booking_id) ?? null,
      }),
    );
    const payments =
      principal.role === "Customer/Renter"
        ? enrichedPayments.map(projectCustomerPayment)
        : enrichedPayments;
    const paymentMethods = await Promise.all(
      (methods.data ?? []).map(async (method: Record<string, unknown>) => {
        const qrImagePath =
          typeof method.qr_image_path === "string"
            ? method.qr_image_path
            : null;
        if (!qrImagePath) return { ...method, qr_image_url: null };
        const signed = await client.storage
          .from("payment-method-qr")
          .createSignedUrl(qrImagePath, 3600);
        return { ...method, qr_image_url: signed.data?.signedUrl ?? null };
      }),
    );
    return Response.json({ payments, paymentMethods });
  } catch (e) {
    return error(
      e instanceof Error && e.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      e instanceof Error && e.message === "forbidden" ? 403 : 401,
    );
  }
}

async function mutate({ request }: { request: Request }) {
  let uploadedPath: string | null = null;
  try {
    const principal = await requirePrincipal();
    // Supabase's generated relationship/RPC types do not cover this legacy payment query yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    if (principal.role === "Owner/Admin") {
      const body = (await request.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;
      const paymentId = String(body?.paymentId || "");
      const action = String(body?.action || "");
      if (!paymentId || !["verify", "resubmit", "pending"].includes(action))
        return error("Invalid payment review action.");
      const payment = await client
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .maybeSingle();
      if (!payment.data) return error("Payment not found.", 404);
      if (payment.data.status !== "Pending Verification")
        return error("Only pending payments can be reviewed.", 409);
      const current = await client
        .from("payment_proofs")
        .select("version,id")
        .eq("payment_id", paymentId)
        .eq("is_current", true)
        .maybeSingle();
      const stale =
        Number(body?.proofVersion || 0) !==
          Number(current.data?.version || 0) ||
        String(
          body?.transactionReference ?? payment.data.transaction_reference,
        ) !== String(payment.data.transaction_reference ?? "") ||
        Number(body?.submittedAmount ?? payment.data.submitted_amount) !==
          Number(payment.data.submitted_amount);
      if (stale)
        return error("Submission changed; reload before reviewing.", 409);
      if (
        action === "resubmit" &&
        !validCategory("payment_review", body?.reason)
      )
        return error("A customer-facing reason is required.");
      const updated = await client.rpc("review_payment_atomic", {
        p_payment_id: paymentId,
        p_reviewer_id: principal.userId,
        p_action: action,
        p_proof_version: Number(body?.proofVersion || 0),
        p_submitted_amount: Number(body?.submittedAmount),
        p_transaction_reference: String(body?.transactionReference || ""),
        p_reason: String(body?.reason || ""),
      });
      if (updated.error) {
        const map: Record<string, string> = {
          insufficient_amount:
            "Submitted amount is below the required payment amount.",
          stale_proof: "Proof changed; reload before reviewing.",
          stale_snapshot: "Payment details changed; reload before reviewing.",
          missing_reason: "A customer-facing reason is required.",
          not_pending: "Payment is no longer pending.",
        };
        return error(
          map[updated.error.message] || "Unable to save review.",
          409,
        );
      }
      let confirmation:
        { status: "confirmed" | "review-needed"; message: string } | undefined;
      if (action === "verify" && updated.data?.booking_id) {
        const booking = await client
          .from("booking_requests")
          .select(
            "booking_status,confirmation_exception_code,confirmation_exception_message",
          )
          .eq("id", updated.data.booking_id)
          .maybeSingle();
        if (booking.data?.booking_status === "Confirmed") {
          confirmation = {
            status: "confirmed",
            message: "Payment verified and rental confirmed automatically.",
          };
        } else if (booking.data?.confirmation_exception_message) {
          confirmation = {
            status: "review-needed",
            message: `Payment verified. ${booking.data.confirmation_exception_message}`,
          };
        }
      }
      await dispatchBookingEmail(payment.data.booking_id);
      return Response.json({ payment: updated.data, confirmation });
    }
    if (principal.role !== "Customer/Renter")
      return error("Customer access is required.", 403);
    const form = await request.formData();
    if (!hasCurrentPaymentPolicyAcknowledgement(form))
      return error(
        "Please read and acknowledge the current cancellation and date-change policies before submitting payment proof.",
      );
    const bookingId = String(form.get("bookingId") || "");
    const action = String(form.get("action") || "submit");
    const booking = await client
      .from("booking_requests")
      .select("id,customer_id")
      .eq("id", bookingId)
      .eq("customer_id", principal.userId)
      .maybeSingle();
    if (!booking.data) return error("Booking not found.", 404);
    const acceptance = await client
      .from("booking_payment_policy_acceptances")
      .select("acknowledged_at")
      .eq("booking_id", bookingId)
      .eq("customer_id", principal.userId)
      .eq("policy_version", PAYMENT_POLICY_VERSION)
      .maybeSingle();
    if (acceptance.error)
      return error("Unable to check payment policy acknowledgement.", 503);
    if (!acceptance.data)
      return error(
        "Please review the payment policies before paying or submitting proof.",
        409,
      );
    const req = await client
      .from("renter_requirement_sets")
      .select("status")
      .eq("booking_id", bookingId)
      .eq("customer_id", principal.userId)
      .maybeSingle();
    if (!isPaymentEligibleRequirementStatus(req.data?.status))
      return error(
        "Payment is available only after requirements are Verified.",
        409,
      );
    const methodId = String(form.get("paymentMethodId") || "");
    const amount = Number(form.get("submittedAmount"));
    const reference = String(form.get("transactionReference") || "").trim();
    if (!methodId || !Number.isFinite(amount) || amount <= 0 || !reference)
      return error(
        "Payment method, positive amount, and transaction reference are required.",
      );
    const method = await client
      .from("payment_methods")
      .select("id,label")
      .eq("id", methodId)
      .eq("is_active", true)
      .maybeSingle();
    if (!method.data) return error("Invalid payment method.");
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0)
      return error("A proof file is required.");
    const validation = await validateRequirementFile(file);
    if (validation) return error(validation);
    const ext = file.name.toLowerCase().split(".").pop() || "bin";
    const path = `${principal.userId}/${bookingId}/${crypto.randomUUID()}.${ext}`;
    uploadedPath = path;
    const up = await client.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) return error("Unable to store proof.", 503);
    const submitted = await client.rpc(
      "submit_payment_proof_with_policy_atomic",
      {
        p_policy_version: PAYMENT_POLICY_VERSION,
        p_policy_acknowledged: true,
        p_booking_id: bookingId,
        p_customer_id: principal.userId,
        p_payment_method_id: methodId,
        p_submitted_amount: amount,
        p_transaction_reference: reference,
        p_storage_path: path,
        p_original_filename: safeName(file.name),
        p_mime_type: file.type,
        p_size_bytes: file.size,
      },
    );
    if (submitted.error) {
      await client.storage.from("payment-proofs").remove([path]);
      uploadedPath = null;
      const paymentMessages: Record<string, string> = {
        payment_policy_acknowledgement_required:
          "The payment policy has changed. Reload the page and review it before submitting again.",
        payment_quote_required:
          "Please wait for the team to send your rental quote before payment.",
        pickup_arrangement_required:
          "The team needs to confirm your pickup and return points before payment. Please contact the team.",
        not_submittable: "Payment proof is already pending verification.",
        payment_requirement_not_set:
          "The required payment amount has not been recorded for this booking yet.",
        insufficient_amount:
          "Submitted amount is below the required payment amount.",
        amount_must_match_required:
          "Submitted amount must match the required payment amount exactly.",
      };
      const message =
        paymentMessages[submitted.error.message] ?? "Unable to submit payment.";
      return error(
        message,
        [
          "payment_policy_acknowledgement_required",
          "payment_quote_required",
          "pickup_arrangement_required",
          "not_submittable",
          "payment_requirement_not_set",
          "insufficient_amount",
          "amount_must_match_required",
        ].includes(submitted.error.message)
          ? 409
          : 503,
      );
    }
    uploadedPath = null;
    return Response.json(submitted.data);
  } catch (e) {
    if (uploadedPath) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (getSupabaseServerClient() as any).storage
          .from("payment-proofs")
          .remove([uploadedPath]);
      } catch {
        // Cleanup is best-effort after a failed submission.
      }
    }
    return error(
      e instanceof Error && e.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      e instanceof Error && e.message === "forbidden" ? 403 : 401,
    );
  }
}
