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
    if (!bookingId) return error("Booking is required.");
    const booking = await ownBooking(client, bookingId, principal); if (!booking) return error("Booking not found.", 404);
    const set = await getSet(client, bookingId, booking.customer_id, principal.role === "Customer/Renter");
    if (set.error) return error("Unable to load requirements.", 503);
    if (principal.role === "Operations Staff") return Response.json({ requirementSet: set.data, documents: [], requiredTypes: TYPES });
    const docs = set.data ? await client.from("renter_requirement_documents").select("id,requirement_set_id,booking_id,customer_id,requirement_type,original_filename,mime_type,size_bytes,version,is_current,uploaded_at,superseded_at").eq("requirement_set_id", set.data.id).order("uploaded_at", { ascending: false }) : { data: [], error: null };
    return Response.json({ requirementSet: set.data, documents: docs.data ?? [], requiredTypes: TYPES });
  } catch (e) { return error(e instanceof Error && e.message === "forbidden" ? "Forbidden." : "Authentication required.", e instanceof Error && e.message === "forbidden" ? 403 : 401); }
}

async function mutate({ request }: { request: Request }) {
  let uploadedPath: string | null = null;
  try {
    const principal = await requirePrincipal(); if (principal.role !== "Customer/Renter") return error("Customer access is required.", 403);
    const form = await request.formData(); const bookingId = String(form.get("bookingId") || ""); const action = String(form.get("action") || "upload");
    const client = getSupabaseServerClient(); const booking = await ownBooking(client, bookingId, principal); if (!booking) return error("Booking not found.", 404);
    const set = await getSet(client, bookingId, principal.userId, true); if (set.error || !set.data) return error("Unable to initialize requirements.", 503);
    if (set.data.status !== "Not Submitted") return error("Requirements are already pending review and cannot be changed.", 409);
    if (action === "submit") {
      const current = await client.from("renter_requirement_documents").select("requirement_type").eq("requirement_set_id", set.data.id).eq("is_current", true);
      if (current.error || !TYPES.every((t) => current.data?.some((d) => d.requirement_type === t))) return error("Upload both required documents before submitting.");
      const updated = await client.from("renter_requirement_sets").update({ status: "Pending Review", submitted_at: new Date().toISOString() }).eq("id", set.data.id).eq("status", "Not Submitted").select("*").single();
      if (updated.error) return error("Unable to submit requirements.", 503); return Response.json({ requirementSet: updated.data });
    }
    const type = String(form.get("requirementType") || ""); if (!(TYPES as readonly string[]).includes(type)) return error("Unsupported requirement type.");
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
