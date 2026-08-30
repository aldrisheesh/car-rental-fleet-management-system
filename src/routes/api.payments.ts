import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateRequirementFile } from "@/lib/requirements-validation";
import { projectCustomerPayment } from "@/lib/payment-integrity";

const error = (message: string, status = 400) => Response.json({ message }, { status });
const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "proof";

export const Route = createFileRoute("/api/payments")({ server: { handlers: { GET: read, POST: mutate } } });

async function read({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    const client = getSupabaseServerClient() as any;
    const url = new URL(request.url); const bookingId = url.searchParams.get("bookingId"); const proofId = url.searchParams.get("proofId");
    if (proofId) {
      const proof = await client.from("payment_proofs").select("*").eq("id", proofId).maybeSingle();
      if (!proof.data || principal.role === "Operations Staff" || (principal.role === "Customer/Renter" && proof.data.customer_id !== principal.userId)) return error("Forbidden.", 403);
      const signed = await client.storage.from("payment-proofs").createSignedUrl(proof.data.storage_path, 300);
      if (signed.error) return error("Unable to open proof.", 503);
      return Response.json({ url: signed.data.signedUrl });
    }
    if (principal.role === "Operations Staff") return Response.json({ payments: [] });
    let query = client.from("payments").select("*, booking:booking_requests(id,booking_status,customer:profiles(id,full_name,email)), payment_methods(id,code,label,instructions,is_demo), payment_proofs(*)").order("updated_at", { ascending: false });
    if (principal.role === "Customer/Renter") query = query.eq("customer_id", principal.userId);
    if (bookingId) query = query.eq("booking_id", bookingId);
    const result = await query;
    if (result.error) return error("Unable to load payments.", 503);
    const methods = await client.from("payment_methods").select("id,code,label,instructions,is_demo").eq("is_active", true).order("label");
    const payments = principal.role === "Customer/Renter" ? (result.data ?? []).map(projectCustomerPayment) : (result.data ?? []);
    return Response.json({ payments, paymentMethods: methods.data ?? [] });
  } catch (e) { return error(e instanceof Error && e.message === "forbidden" ? "Forbidden." : "Authentication required.", e instanceof Error && e.message === "forbidden" ? 403 : 401); }
}

async function mutate({ request }: { request: Request }) {
  let uploadedPath: string | null = null;
  try {
    const principal = await requirePrincipal(); const client = getSupabaseServerClient() as any;
    if (principal.role === "Owner/Admin") {
      const body = await request.json().catch(() => null) as Record<string, unknown> | null;
      const paymentId = String(body?.paymentId || ""); const action = String(body?.action || "");
      if (!paymentId || !["verify", "resubmit", "pending"].includes(action)) return error("Invalid payment review action.");
      const payment = await client.from("payments").select("*").eq("id", paymentId).maybeSingle(); if (!payment.data) return error("Payment not found.", 404);
      if (payment.data.status !== "Pending Verification") return error("Only pending payments can be reviewed.", 409);
      const current = await client.from("payment_proofs").select("version,id").eq("payment_id", paymentId).eq("is_current", true).maybeSingle();
      const stale = Number(body?.proofVersion || 0) !== Number(current.data?.version || 0) || String(body?.transactionReference ?? payment.data.transaction_reference) !== String(payment.data.transaction_reference ?? "") || Number(body?.submittedAmount ?? payment.data.submitted_amount) !== Number(payment.data.submitted_amount);
      if (stale) return error("Submission changed; reload before reviewing.", 409);
      if (action === "resubmit" && !String(body?.reason || "").trim()) return error("A customer-facing reason is required.");
      const updated = await client.rpc("review_payment_atomic", { p_payment_id: paymentId, p_reviewer_id: principal.userId, p_action: action, p_proof_version: Number(body?.proofVersion || 0), p_submitted_amount: Number(body?.submittedAmount), p_transaction_reference: String(body?.transactionReference || ""), p_reason: String(body?.reason || "") });
      if (updated.error) { const map: Record<string,string> = { insufficient_amount:"Submitted amount is below the required down payment.", stale_proof:"Proof changed; reload before reviewing.", stale_snapshot:"Payment details changed; reload before reviewing.", missing_reason:"A customer-facing reason is required.", not_pending:"Payment is no longer pending." }; return error(map[updated.error.message] || "Unable to save review.", 409); } return Response.json({ payment: updated.data });
    }
    if (principal.role !== "Customer/Renter") return error("Customer access is required.", 403);
    const form = await request.formData(); const bookingId = String(form.get("bookingId") || ""); const action = String(form.get("action") || "submit");
    const booking = await client.from("booking_requests").select("id,customer_id").eq("id", bookingId).eq("customer_id", principal.userId).maybeSingle(); if (!booking.data) return error("Booking not found.", 404);
    const req = await client.from("renter_requirement_sets").select("status").eq("booking_id", bookingId).eq("customer_id", principal.userId).maybeSingle();
    if (req.data?.status !== "Verified") return error("Payment is available only after requirements are Verified.", 409);
    let payment = await client.from("payments").select("*").eq("booking_id", bookingId).maybeSingle();
    if (!payment.data) payment = await client.from("payments").insert({ booking_id: bookingId, customer_id: principal.userId, payment_method_label: "" }).select("*").single();
    if (payment.error || !payment.data) return error("Unable to initialize payment.", 503);
    const methodId = String(form.get("paymentMethodId") || ""); const amount = Number(form.get("submittedAmount")); const reference = String(form.get("transactionReference") || "").trim();
    if (!methodId || !Number.isFinite(amount) || amount <= 0 || !reference) return error("Payment method, positive amount, and transaction reference are required.");
    const method = await client.from("payment_methods").select("id,label").eq("id", methodId).eq("is_active", true).maybeSingle(); if (!method.data) return error("Invalid payment method.");
    const file = form.get("file"); if (!(file instanceof File) || file.size === 0) return error("A proof file is required."); const validation = await validateRequirementFile(file); if (validation) return error(validation);
    const ext = file.name.toLowerCase().split(".").pop() || "bin"; const version = (await client.from("payment_proofs").select("version").eq("payment_id", payment.data.id).order("version", { ascending: false }).limit(1).maybeSingle()).data?.version ?? 0; const path = `${principal.userId}/${bookingId}/${payment.data.id}/${crypto.randomUUID()}.${ext}`; uploadedPath = path;
    const up = await client.storage.from("payment-proofs").upload(path, file, { contentType: file.type, upsert: false }); if (up.error) return error("Unable to store proof.", 503);
    await client.from("payment_proofs").update({ is_current: false, superseded_at: new Date().toISOString() }).eq("payment_id", payment.data.id).eq("is_current", true);
    const proof = await client.from("payment_proofs").insert({ payment_id: payment.data.id, booking_id: bookingId, customer_id: principal.userId, storage_path: path, original_filename: safeName(file.name), mime_type: file.type, size_bytes: file.size, version: Number(version) + 1 }).select("*").single();
    if (proof.error) return error("Unable to save proof metadata.", 503);
    const updated = await client.from("payments").update({ payment_method_id: methodId, payment_method_label: method.data.label, submitted_amount: amount, transaction_reference: reference, status: "Pending Verification", submitted_at: new Date().toISOString(), resubmission_reason: null, reviewed_by: null, reviewed_at: null }).eq("id", payment.data.id).eq("customer_id", principal.userId).select("*").single();
    if (updated.error) return error("Unable to submit payment.", 503);
    return Response.json({ payment: updated.data, proof: proof.data });
  } catch (e) { if (uploadedPath) { try { await (getSupabaseServerClient() as any).storage.from("payment-proofs").remove([uploadedPath]); } catch {} } return error(e instanceof Error && e.message === "forbidden" ? "Forbidden." : "Authentication required.", e instanceof Error && e.message === "forbidden" ? 403 : 401); }
}
