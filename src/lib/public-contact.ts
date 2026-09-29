export type PublicContactSettings = {
  phone: string;
  email: string;
  office_hours: string;
  location_summary: string;
  service_area: string;
  reply_commitment: string;
};

export type PublicContactLocation = {
  id: string;
  name: string;
  address: string;
  note: string | null;
  sort_order: number;
};

export const defaultPublicContact: PublicContactSettings = {
  phone: "+63 917 555 0142",
  email: "hello@briahsrental.ph",
  office_hours: "Mon–Sun, 7:00 AM–9:00 PM",
  location_summary: "Taft, Manila · Antipolo, Rizal",
  service_area:
    "We serve Luzon trips. Contact us in advance for special arrangements outside the regular service area.",
  reply_commitment:
    "Messages are recorded for the rental team to review during office hours.",
};

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export async function fetchPublicContact() {
  const response = await fetch("/api/public-contact");
  if (!response.ok) throw new Error("Unable to load public contact details.");
  return (await response.json()) as {
    settings: PublicContactSettings;
    locations: PublicContactLocation[];
  };
}
