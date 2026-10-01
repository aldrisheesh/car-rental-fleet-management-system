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
    const search = normalizeSearch(url.searchParams.get("search"));
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
    if (search === undefined) return fail("Invalid audit search.");
    if (from === undefined || to === undefined)
      return fail("Invalid date range.");
    if (from && to && from > to) return fail("Date range is reversed.");
    if (page === undefined || limit === undefined)
      return fail("Invalid pagination.");

    const filters = { actorType, actorUserId, from, to, search };
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
    query = applyAuditFilters(query, { ...filters, domain });

    const [result, countResults] = await Promise.all([
      query,
      Promise.all(
        AUDIT_DOMAINS.map(async (countDomain) => {
          let countQuery = client
            .from("audit_events")
            .select("id", { count: "exact", head: true });
          countQuery = applyAuditFilters(countQuery, {
            ...filters,
            domain: countDomain,
          });
          const countResult = await countQuery;
          return [countDomain, countResult] as const;
        }),
      ),
    ]);

    if (result.error || countResults.some(([, value]) => value.error))
      return fail("Unable to load audit events.", 503);
    return Response.json({
      events: result.data ?? [],
      page,
      limit,
      total: result.count ?? 0,
      domainCounts: Object.fromEntries(
        countResults.map(([countDomain, value]) => [
          countDomain,
          value.count ?? 0,
        ]),
      ),
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

function applyAuditFilters<T extends AuditFilterQuery<T>>(
  query: T,
  filters: {
    domain: string | null;
    actorType: string | null;
    actorUserId: string | null;
    from: Date | null;
    to: Date | null;
    search: string | null;
  },
) {
  let filtered = query;
  if (filters.domain) filtered = filtered.eq("entity_type", filters.domain);
  if (filters.actorType)
    filtered = filtered.eq("actor_type", filters.actorType);
  if (filters.actorUserId)
    filtered = filtered.eq("actor_user_id", filters.actorUserId);
  if (filters.from)
    filtered = filtered.gte("occurred_at", filters.from.toISOString());
  if (filters.to)
    filtered = filtered.lte("occurred_at", filters.to.toISOString());
  if (filters.search) {
    if (UUID.test(filters.search)) {
      filtered = filtered.or(
        `entity_id.eq.${filters.search},booking_id.eq.${filters.search}`,
      );
    } else {
      filtered = filtered.ilike("action", `%${filters.search}%`);
    }
  }
  return filtered;
}

type AuditFilterQuery<T> = {
  eq: (column: string, value: string) => T;
  gte: (column: string, value: string) => T;
  lte: (column: string, value: string) => T;
  ilike: (column: string, value: string) => T;
  or: (filters: string) => T;
};

function normalizeSearch(value: string | null) {
  if (!value?.trim()) return null;
  const normalized = value.trim();
  if (normalized.length > 100 || /[^a-zA-Z0-9 .-]/.test(normalized))
    return undefined;
  return normalized;
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
