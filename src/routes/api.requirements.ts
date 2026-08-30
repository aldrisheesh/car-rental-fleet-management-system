import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateRequirementFile } from "@/lib/requirements-validation";

const TYPES = ["Valid Government ID", "Driver's License"] as const;
const error = (message: string, status = 400) => Response.json({ message }, { status });
const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "document";
const keyFor = (type: string) => type === "Valid Government ID" ? "government-id" : "drivers-license";

export const Route = createFileRoute("/api/requirements")({ server: { handlers: { GET: read, POST: mutate } } });

async function ownBooking(client: ReturnType<typeof getSupabaseServerClient>, bookingId: string, principal: Awaited<ReturnType<typeof requirePrincipal>>) {
  const q = await client.from("booking_requests").select("id,customer_id").eq("id", bookingId).maybeSingle();
  if (q.error || !q.data) return null;
  if (principal.role === "Customer/Renter" && q.data.customer_id !== principal.userId) return null;
  return q.data;
}

async function getSet(client: ReturnType<typeof getSupabaseServerClient>, bookingId: string, customerId: string, create = false) {
  let set = await client.from("renter_requirement_sets").select("*").eq("booking_id", bookingId).maybeSingle();
  if (!set.data && create) set = await client.from("renter_requirement_sets").insert({ booking_id: bookingId, customer_id: customerId }).select("*").single();
  return set;
}

async function read({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    const url = new URL(request.url); const bookingId = url.searchParams.get("bookingId") || ""; const documentId = url.searchParams.get("documentId");
    const client = getSupabaseServerClient();
    if (documentId) {
      const d = await client.from("renter_requirement_documents").select("*").eq("id", documentId).maybeSingle();
      if (!d.data || (principal.role === "Customer/Renter" && d.data.customer_id !== principal.userId) || principal.role === "Operations Staff") return error("Forbidden.", 403);
      const signed = await client.storage.from("renter-requirements").createSignedUrl(d.data.storage_path, 300);
      if (signed.error || !signed.data) return error("Unable to open document.", 503);
      return Response.json({ url: signed.data.signedUrl });
    }
    if (!bookingId && principal.role === "Owner/Admin") {
      const pending = await client.from("renter_requirement_sets").select("*, booking:booking_requests(id,customer:profiles(id,full_name,email),requested_vehicle:vehicles(name))").eq("status", "Pending Review").order("updated_at", { ascending: true });
      if (pending.error) return error("Unable to load requirements.", 503);
      return Response.json({ requirementSets: pending.data ?? [], requiredTypes: TYPES });
    }
    if (!bookingId) return error("Booking is required.");
    const booking = await ownBooking(client, bookingId, principal); if (!booking) return error("Booking not found.", 404);
    const set = await getSet(client, bookingId, booking.customer_id, principal.role === "Customer/Renter");
    if (set.error) return error("Unable to load requirements.", 503);
    if (principal.role === "Operations Staff") return Response.json({ requirementSet: set.data, documents: [], requiredTypes: TYPES });
    const docs = set.data ? await client.from("renter_requirement_documents").select("id,requirement_set_id,booking_id,customer_id,requirement_type,original_filename,mime_type,size_bytes,version,is_current,uploaded_at,superseded_at").eq("requirement_set_id", set.data.id).order("uploaded_at", { ascending: false }) : { data: [], error: null };
    const reviews = set.data ? await client.from("renter_requirement_reviews").select("*").eq("requirement_set_id", set.data.id).order("reviewed_at", { ascending: false }) : { data: [], error: null };
    return Response.json({ requirementSet: set.data, documents: docs.data ?? [], reviews: reviews.data ?? [], requiredTypes: TYPES });
  } catch (e) { return error(e instanceof Error && e.message === "forbidden" ? "Forbidden." : "Authentication required.", e instanceof Error && e.message === "forbidden" ? 403 : 401); }
}

async function mutate({ request }: { request: Request }) {
  let uploadedPath: string | null = null;
  try {
    const principal = await requirePrincipal();
    const client = getSupabaseServerClient();
    if (principal.role === "Owner/Admin") {
      const body = await request.json().catch(() => null) as Record<string, unknown> | null;
      if (body?.action !== "review") return error("Invalid review action.");
      const setId = String(body.requirementSetId || "");
      const rs = await client.from("renter_requirement_sets").select("*").eq("id", setId).maybeSingle();
      if (!rs.data) return error("Requirement set not found.", 404);
      const docs = await client.from("renter_requirement_documents").select("id,version,requirement_type,is_current").eq("requirement_set_id", setId).eq("is_current", true);
      const gov = docs.data?.find((d) => d.requirement_type === "Valid Government ID"); const lic = docs.data?.find((d) => d.requirement_type === "Driver's License");
      if (!gov || !lic) return error("Both current documents are required.");
      const result = await client.rpc("record_renter_requirement_review", { p_requirement_set_id: setId, p_reviewer_id: principal.userId, p_government_id_document_id: String(body.governmentIdDocumentId || gov.id), p_government_id_version: Number(body.governmentIdVersion || gov.version), p_government_id_outcome: String(body.governmentIdOutcome || ""), p_government_id_reason: String(body.governmentIdReason || ""), p_drivers_license_document_id: String(body.driversLicenseDocumentId || lic.id), p_drivers_license_version: Number(body.driversLicenseVersion || lic.version), p_drivers_license_outcome: String(body.driversLicenseOutcome || ""), p_drivers_license_reason: String(body.driversLicenseReason || ""), p_identity_consistency: String(body.identityConsistency || ""), p_lto_outcome: String(body.ltoOutcome || ""), p_resulting_status: String(body.resultingStatus || "") });
      if (result.error) { const map: Record<string,string> = { not_reviewable:"Requirement set is no longer pending review.", stale_document:"Document version is stale; reload and review the current files.", invalid_verified_gate:"Verified requires both accepted documents, consistent identity, and LTO Clear.", invalid_resubmission_gate:"Needs Resubmission requires a flagged document with a reason.", missing_reason:"A customer-facing replacement reason is required." }; return error(map[result.error.message] || "Unable to save review.", 409); }
      return Response.json({ reviewId: result.data, status: body.resultingStatus });
    }
    if (principal.role !== "Customer/Renter") return error("Customer access is required.", 403);
    const form = await request.formData(); const bookingId = String(form.get("bookingId") || ""); const action = String(form.get("action") || "upload");
    const booking = await ownBooking(client, bookingId, principal); if (!booking) return error("Booking not found.", 404);
    const set = await getSet(client, bookingId, principal.userId, true); if (set.error || !set.data) return error("Unable to initialize requirements.", 503);
    if (action === "resubmit") {
      const result = await client.rpc("resubmit_renter_requirements", { p_requirement_set_id: set.data.id, p_customer_id: principal.userId });
      if (result.error) return error(result.error.message === "replacement_required" ? "Replace every flagged document before resubmitting." : "Requirements are not ready for resubmission.", 409);
      return Response.json({ status: "Pending Review" });
    }
    if (set.data.status !== "Not Submitted" && set.data.status !== "Needs Resubmission") return error("Requirements are already pending review and cannot be changed.", 409);
    if (action === "submit") {
      const current = await client.from("renter_requirement_documents").select("requirement_type").eq("requirement_set_id", set.data.id).eq("is_current", true);
      if (current.error || !TYPES.every((t) => current.data?.some((d) => d.requirement_type === t))) return error("Upload both required documents before submitting.");
      const updated = await client.from("renter_requirement_sets").update({ status: "Pending Review", submitted_at: new Date().toISOString() }).eq("id", set.data.id).eq("status", "Not Submitted").select("*").single();
      if (updated.error) return error("Unable to submit requirements.", 503); return Response.json({ requirementSet: updated.data });
    }
    const type = String(form.get("requirementType") || ""); if (!(TYPES as readonly string[]).includes(type)) return error("Unsupported requirement type.");
    if (set.data.status === "Needs Resubmission") {
      const latest = await client.from("renter_requirement_reviews").select("government_id_outcome,drivers_license_outcome").eq("requirement_set_id", set.data.id).order("reviewed_at", { ascending: false }).limit(1).maybeSingle();
      const flagged = type === "Valid Government ID" ? latest.data?.government_id_outcome === "Needs Replacement" : latest.data?.drivers_license_outcome === "Needs Replacement";
      if (!flagged) return error("Only flagged document types may be replaced.", 403);
    }
    const file = form.get("file"); if (!(file instanceof File) || file.size === 0) return error("A file is required.");
    const validationError = await validateRequirementFile(file); if (validationError) return error(validationError);
    const ext = file.name.toLowerCase().split(".").pop() || "";
    const existing = await client.from("renter_requirement_documents").select("id,version,storage_path").eq("requirement_set_id", set.data.id).eq("requirement_type", type).eq("is_current", true).maybeSingle();
    const version = (existing.data?.version ?? 0) + 1; const path = `${principal.userId}/${bookingId}/${keyFor(type)}/${crypto.randomUUID()}.${ext}`; uploadedPath = path;
    const up = await client.storage.from("renter-requirements").upload(path, file, { contentType: file.type, upsert: false }); if (up.error) return error("Unable to store document.", 503);
    const switched = await client.rpc("replace_renter_requirement_document", { p_requirement_set_id: set.data.id, p_booking_id: bookingId, p_customer_id: principal.userId, p_requirement_type: type, p_storage_path: path, p_original_filename: safeName(file.name), p_mime_type: file.type, p_size_bytes: file.size, p_version: version });
    if (switched.error || !switched.data) { await client.storage.from("renter-requirements").remove([path]); return error("Unable to save document.", 503); }
    const inserted = await client.from("renter_requirement_documents").select("*").eq("id", switched.data).single();
    if (inserted.error || !inserted.data) { await client.storage.from("renter-requirements").remove([path]); return error("Unable to load saved document.", 503); }
    return Response.json({ document: inserted.data });
  } catch (e) { if (uploadedPath) { try { await getSupabaseServerClient().storage.from("renter-requirements").remove([uploadedPath]); } catch {} } return error(e instanceof Error && e.message === "forbidden" ? "Forbidden." : "Authentication required.", e instanceof Error && e.message === "forbidden" ? 403 : 401); }
}
