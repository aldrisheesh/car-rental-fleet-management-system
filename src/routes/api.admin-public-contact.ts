import { createFileRoute } from "@tanstack/react-router";

import { AuthBoundaryError, requireRole } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const fields = ["phone", "email", "office_hours", "location_summary", "service_area", "reply_commitment"] as const;
type SettingField = (typeof fields)[number];

function error(message: string, status = 400) {
  return Response.json({ message }, { status });
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function owner() {
  return requireRole("Owner/Admin");
}

export const Route = createFileRoute("/api/admin-public-contact")({
  server: { handlers: { GET: read, PATCH: save, POST: updateInquiry } },
});

async function read() {
  try {
    await owner();
    const client = getSupabaseServerClient() as any;
    const [settings, locations, inquiries] = await Promise.all([
      client.from("public_contact_settings").select("phone,email,office_hours,location_summary,service_area,reply_commitment,updated_at").eq("id", true).maybeSingle(),
      client.from("public_contact_locations").select("id,name,address,note,sort_order,is_active").order("sort_order"),
      client.from("contact_inquiries").select("id,name,email,subject,message,status,created_at,read_at").order("created_at", { ascending: false }).limit(20),
    ]);
    if (settings.error || locations.error || inquiries.error) return error("Unable to load public contact management.", 503);
    return Response.json({ settings: settings.data, locations: locations.data ?? [], inquiries: inquiries.data ?? [] });
  } catch (cause) {
    return error(cause instanceof AuthBoundaryError && cause.reason === "forbidden" ? "Forbidden." : "Authentication required.", cause instanceof AuthBoundaryError && cause.reason === "forbidden" ? 403 : 401);
  }
}

async function save({ request }: { request: Request }) {
  try {
    const principal = await owner();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const rawSettings = body?.settings as Record<string, unknown> | undefined;
    const settings = Object.fromEntries(fields.map((field) => [field, clean(rawSettings?.[field], field === "service_area" ? 500 : 180)])) as Record<SettingField, string>;
    if (Object.values(settings).some((value) => !value) || !/^\S+@\S+\.\S+$/.test(settings.email)) return error("Complete all public contact fields with a valid email address.");
    const locations = Array.isArray(body?.locations) ? body.locations : [];
    if (locations.length > 12) return error("Use up to twelve public locations.");
    const prepared = locations.map((item, index) => {
      const value = item as Record<string, unknown>;
      return {
        id: clean(value.id, 80) || null,
        name: clean(value.name, 120),
        address: clean(value.address, 300),
        note: clean(value.note, 300) || null,
        is_active: value.is_active !== false,
        sort_order: index,
      };
    });
    if (prepared.some((location) => !location.name || !location.address)) return error("Every public location needs a name and address.");
    const client = getSupabaseServerClient() as any;
    const settingsWrite = await client.from("public_contact_settings").upsert({ id: true, ...settings, updated_at: new Date().toISOString(), updated_by: principal.userId });
    if (settingsWrite.error) return error("Unable to save public contact details.", 503);
    const current = await client.from("public_contact_locations").select("id");
    if (current.error) return error("Public contact details were saved, but locations could not be checked.", 503);
    const retained = new Set(prepared.map((location) => location.id).filter(Boolean));
    const stale = (current.data ?? []).map((location: { id: string }) => location.id).filter((id: string) => !retained.has(id));
    if (stale.length && (await client.from("public_contact_locations").delete().in("id", stale)).error) return error("Unable to remove an old public location.", 503);
    for (const location of prepared) {
      const payload = { name: location.name, address: location.address, note: location.note, is_active: location.is_active, sort_order: location.sort_order, updated_at: new Date().toISOString() };
      const result = location.id
        ? await client.from("public_contact_locations").update(payload).eq("id", location.id)
        : await client.from("public_contact_locations").insert(payload);
      if (result.error) return error("Public contact details were saved, but a location could not be saved.", 503);
    }
    return read();
  } catch (cause) {
    return error(cause instanceof AuthBoundaryError && cause.reason === "forbidden" ? "Forbidden." : "Authentication required.", cause instanceof AuthBoundaryError && cause.reason === "forbidden" ? 403 : 401);
  }
}

async function updateInquiry({ request }: { request: Request }) {
  try {
    const principal = await owner();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const inquiryId = clean(body?.inquiryId, 80);
    const status = clean(body?.status, 20);
    if (!inquiryId || !["New", "Read", "Closed"].includes(status)) return error("Choose a valid inquiry status.");
    const result = await (getSupabaseServerClient() as any).from("contact_inquiries").update({ status, read_at: status === "New" ? null : new Date().toISOString(), read_by: status === "New" ? null : principal.userId }).eq("id", inquiryId);
    return result.error ? error("Unable to update inquiry.", 503) : Response.json({ ok: true });
  } catch (cause) {
    return error(cause instanceof AuthBoundaryError && cause.reason === "forbidden" ? "Forbidden." : "Authentication required.", cause instanceof AuthBoundaryError && cause.reason === "forbidden" ? 403 : 401);
  }
}
