import { createFileRoute } from "@tanstack/react-router";

import { getSupabaseServerClient } from "@/lib/supabase/server";

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export const Route = createFileRoute("/api/contact-inquiries")({
  server: { handlers: { POST: createInquiry } },
});

async function createInquiry({ request }: { request: Request }) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = text(body?.name, 120);
  const email = text(body?.email, 254).toLowerCase();
  const subject = text(body?.subject, 180);
  const message = text(body?.message, 5000);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !subject || message.length < 10)
    return Response.json({ message: "Enter a name, valid email, subject, and message." }, { status: 400 });
  const result = await (getSupabaseServerClient() as any)
    .from("contact_inquiries")
    .insert({ name, email, subject, message })
    .select("id,created_at")
    .single();
  if (result.error)
    return Response.json({ message: "Your message could not be saved. Please try again or use the listed contact details." }, { status: 503 });
  return Response.json({ inquiry: result.data }, { status: 201 });
}
