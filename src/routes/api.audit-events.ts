import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth.server";
import { AUDIT_ACTOR_TYPES, AUDIT_DOMAINS } from "@/lib/audit";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/audit-events")({
  server: { handlers: { GET: readAuditEvents } },
});

async function readAuditEvents({ request }: { request: Request }) {
  try {
    await requireRole("Owner/Admin");
    const url = new URL(request.url);
    const domain = url.searchParams.get("domain")?.trim() || null;
    const actorType = url.searchParams.get("actorType")?.trim() || null;
    const actorUserId = url.searchParams.get("actorUserId")?.trim() || null;
    const from = parseDate(url.searchParams.get("from"));
    const to = parseDate(url.searchParams.get("to"));
    const page = boundedInteger(url.searchParams.get("page"), 1, 1, 10_000);
    const limit = boundedInteger(url.searchParams.get("limit"), 25, 1, 100);

    if (domain && !(AUDIT_DOMAINS as readonly string[]).includes(domain))
      return fail("Invalid audit domain.");
    if (
      actorType &&
      !(AUDIT_ACTOR_TYPES as readonly string[]).includes(actorType)
    )
      return fail("Invalid actor type.");
    if (actorUserId && !UUID.test(actorUserId)) return fail("Invalid actor.");
    if (from === undefined || to === undefined)
      return fail("Invalid date range.");
    if (from && to && from > to) return fail("Date range is reversed.");
    if (page === undefined || limit === undefined)
      return fail("Invalid pagination.");

    const start = (page - 1) * limit;
    const client = getSupabaseServerClient();
    let query = client
      .from("audit_events")
      .select(
        "id,actor_type,actor_user_id,action,entity_type,entity_id,booking_id,metadata,occurred_at,actor:profiles!audit_events_actor_user_id_fkey(id,full_name,email,user_type)",
        { count: "exact" },
      )
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .range(start, start + limit - 1);

    if (domain) query = query.eq("entity_type", domain);
    if (actorType) query = query.eq("actor_type", actorType);
    if (actorUserId) query = query.eq("actor_user_id", actorUserId);
    if (from) query = query.gte("occurred_at", from.toISOString());
    if (to) query = query.lte("occurred_at", to.toISOString());

    const result = await query;
    if (result.error) return fail("Unable to load audit events.", 503);
    return Response.json({
      events: result.data ?? [],
      page,
      limit,
      total: result.count ?? 0,
    });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      error instanceof Error && error.message === "forbidden" ? 403 : 401,
    );
  }
}

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function boundedInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function fail(message: string, status = 400) {
  return Response.json({ message }, { status });
}
