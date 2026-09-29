import { createFileRoute } from "@tanstack/react-router";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const fallback = {
  phone: "+63 917 555 0142",
  email: "hello@briahsrental.ph",
  office_hours: "Mon–Sun, 7:00 AM–9:00 PM",
  location_summary: "Taft, Manila · Antipolo, Rizal",
  service_area:
    "We serve Luzon trips. Contact us in advance for special arrangements outside the regular service area.",
  reply_commitment:
    "Messages are recorded for the rental team to review during office hours.",
};

export const Route = createFileRoute("/api/public-contact")({
  server: { handlers: { GET: getPublicContact } },
});

async function getPublicContact() {
  const client = getSupabaseServerClient() as any;
  const [settings, locations] = await Promise.all([
    client.from("public_contact_settings").select("phone,email,office_hours,location_summary,service_area,reply_commitment").eq("id", true).maybeSingle(),
    client.from("public_contact_locations").select("id,name,address,note,sort_order").eq("is_active", true).order("sort_order"),
  ]);
  if (settings.error || locations.error)
    return Response.json({ message: "Unable to load public contact details." }, { status: 503 });
  return Response.json({
    settings: settings.data ?? fallback,
    locations: locations.data ?? [],
  });
}
