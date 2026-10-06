import { readFetch } from "@/lib/read-fetch";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Check, Loader2, Mail, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Btn, Card, CardHeader, PageHeader, TInput } from "@/components/admin/ui";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import { defaultPublicContact, type PublicContactSettings } from "@/lib/public-contact";

type LocationDraft = { id?: string; name: string; address: string; note: string; is_active: boolean };
type Inquiry = { id: string; name: string; email: string; subject: string; message: string; status: "New" | "Read" | "Closed"; created_at: string };
type ContactPayload = { settings: PublicContactSettings | null; locations: Array<LocationDraft & { id: string }>; inquiries: Inquiry[] };

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<PublicContactSettings>(defaultPublicContact);
  const [locations, setLocations] = useState<LocationDraft[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingInquiry, setChangingInquiry] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const response = await readFetch("/api/admin-public-contact");
      const payload = (await response.json().catch(() => null)) as ContactPayload | { message?: string } | null;
      if (!response.ok) throw new Error((payload as { message?: string } | null)?.message ?? "Unable to load public contact management.");
      applyPayload(payload as ContactPayload);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to load public contact management.");
    } finally {
      setLoading(false);
    }
  }

  function applyPayload(data: ContactPayload) {
    setSettings(data.settings ?? defaultPublicContact);
    setLocations(data.locations.map(({ id, name, address, note, is_active }) => ({ id, name, address, note: note ?? "", is_active })));
    setInquiries(data.inquiries);
  }

  useEffect(() => { void load(); }, []);
  const setField = (field: keyof PublicContactSettings, value: string) => setSettings((current) => ({ ...current, [field]: value }));
  const updateLocation = (index: number, field: keyof LocationDraft, value: string | boolean) => setLocations((current) => current.map((location, locationIndex) => locationIndex === index ? { ...location, [field]: value } : location));

  async function save() {
    try {
      setSaving(true);
      const response = await readFetch("/api/admin-public-contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings, locations }) });
      const payload = (await response.json().catch(() => null)) as ContactPayload | { message?: string } | null;
      if (!response.ok) throw new Error((payload as { message?: string } | null)?.message ?? "Unable to save public contact details.");
      applyPayload(payload as ContactPayload);
      toast.success("Public contact details saved");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to save public contact details.");
    } finally { setSaving(false); }
  }

  async function setInquiryStatus(inquiry: Inquiry, status: Inquiry["status"]) {
    try {
      setChangingInquiry(inquiry.id);
      const response = await readFetch("/api/admin-public-contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inquiryId: inquiry.id, status }) });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "Unable to update inquiry.");
      setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, status } : item));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to update inquiry.");
    } finally { setChangingInquiry(null); }
  }

  return <div>
    <PageHeader title="Public contact" subtitle="Manage the contact details and pickup locations shown to customers." />
    {loading ? <div className="p-8 text-sm text-muted-foreground">Loading public contact management…</div> : <div className="space-y-4">
      <Card>
        <CardHeader title="Customer-facing contact details" hint="These values appear on the Contact page and every customer footer." />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Phone"><TInput value={settings.phone} onChange={(event) => setField("phone", event.target.value)} /></Field>
          <Field label="Email"><TInput type="email" value={settings.email} onChange={(event) => setField("email", event.target.value)} /></Field>
          <Field label="Office hours"><TInput value={settings.office_hours} onChange={(event) => setField("office_hours", event.target.value)} /></Field>
          <Field label="Location summary"><TInput value={settings.location_summary} onChange={(event) => setField("location_summary", event.target.value)} /></Field>
          <Field label="Service area" className="md:col-span-2"><textarea className="input-control min-h-24 py-3" value={settings.service_area} onChange={(event) => setField("service_area", event.target.value)} /></Field>
          <Field label="Message acknowledgement" className="md:col-span-2"><TInput value={settings.reply_commitment} onChange={(event) => setField("reply_commitment", event.target.value)} /></Field>
        </div>
      </Card>
      <Card>
        <CardHeader title="Public pickup locations" hint="Only list locations customers may use for pickup or coordination. Fleet allocation branches remain separate." />
        <div className="space-y-3 p-5">
          {locations.map((location, index) => <div key={location.id ?? `new-${index}`} className="grid gap-3 rounded-lg border border-border p-4 lg:grid-cols-[0.75fr_1.5fr_1fr_auto]">
            <Field label="Name"><TInput value={location.name} onChange={(event) => updateLocation(index, "name", event.target.value)} /></Field>
            <Field label="Address"><TInput value={location.address} onChange={(event) => updateLocation(index, "address", event.target.value)} /></Field>
            <Field label="Customer note"><TInput value={location.note} onChange={(event) => updateLocation(index, "note", event.target.value)} /></Field>
            <div className="flex items-end gap-2"><label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={location.is_active} onChange={(event) => updateLocation(index, "is_active", event.target.checked)} /> Visible</label><button type="button" className="touch-target mb-1 inline-flex min-h-9 items-center justify-center rounded-md border border-rose-200 px-3 text-rose-700 hover:bg-rose-50" aria-label={`Remove ${location.name || "location"}`} onClick={() => setLocations((current) => current.filter((_, locationIndex) => locationIndex !== index))}><Trash2 className="h-4 w-4" /></button></div>
          </div>)}
          <Btn onClick={() => setLocations((current) => [...current, { name: "", address: "", note: "", is_active: true }])}><Plus className="h-4 w-4" /> Add public location</Btn>
        </div>
        <div className="flex justify-end border-t border-border p-4"><Btn variant="primary" disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "Saving…" : "Save public contact"}</Btn></div>
      </Card>
      <Card>
        <CardHeader title="Customer messages" hint="Messages submitted from the public Contact page are stored here for follow-up." />
        {inquiries.length === 0 ? <div className="p-5 text-sm text-muted-foreground">No customer messages yet.</div> : <div className="divide-y divide-border">{inquiries.map((inquiry) => <article key={inquiry.id} className="grid gap-3 p-5 lg:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><strong>{inquiry.subject}</strong><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${inquiry.status === "New" ? "bg-amber-100 text-amber-800" : inquiry.status === "Closed" ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"}`}>{inquiry.status}</span></div><p className="mt-1 text-sm text-muted-foreground">{inquiry.name} · <a className="underline" href={`mailto:${inquiry.email}`}>{inquiry.email}</a> · {new Date(inquiry.created_at).toLocaleString()}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{inquiry.message}</p></div><div className="flex items-start gap-2"><Btn disabled={changingInquiry === inquiry.id || inquiry.status === "Read"} onClick={() => void setInquiryStatus(inquiry, "Read")}><Mail className="h-4 w-4" /> Mark read</Btn><Btn disabled={changingInquiry === inquiry.id || inquiry.status === "Closed"} onClick={() => void setInquiryStatus(inquiry, "Closed")}>Close</Btn></div></article>)}</div>}
      </Card>
    </div>}
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span><div className="[&>*]:w-full">{children}</div></label>;
}
