import { createFileRoute, redirect } from "@tanstack/react-router";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  AUDIT_ACTOR_TYPES,
  AUDIT_DOMAINS,
  humanizeAction,
  summarizeAuditEvent,
  type AuditEvent,
} from "@/lib/audit";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  Badge,
  Btn,
  Card,
  CardHeader,
  PageHeader,
  TInput,
  TSelect,
  Toolbar,
} from "@/components/admin/ui";

type AuditResponse = {
  events: AuditEvent[];
  page: number;
  limit: number;
  total: number;
};

type AuditFilters = {
  domain: string;
  actorType: string;
  from: string;
  to: string;
};

const emptyFilters: AuditFilters = {
  domain: "",
  actorType: "",
  from: "",
  to: "",
};

export const Route = createFileRoute("/admin/activity")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: ActivityPage,
});

function ActivityPage() {
  const [draft, setDraft] = useState<AuditFilters>(emptyFilters);
  const [applied, setApplied] = useState<AuditFilters>(emptyFilters);
  const [data, setData] = useState<AuditResponse>({
    events: [],
    page: 1,
    limit: 25,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filterError, setFilterError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setMessage("");
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (applied.domain) params.set("domain", applied.domain);
      if (applied.actorType) params.set("actorType", applied.actorType);
      if (applied.from) params.set("from", manilaStart(applied.from));
      if (applied.to) params.set("to", manilaEnd(applied.to));
      try {
        const response = await fetch(`/api/audit-events?${params}`, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const body = (await response.json().catch(() => null)) as
          | (AuditResponse & { message?: string })
          | null;
        if (!response.ok)
          throw new Error(body?.message || "Unable to load audit trail.");
        setData(body ?? { events: [], page, limit: 25, total: 0 });
      } catch (error) {
        if (!controller.signal.aborted)
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load audit trail.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [applied, page]);

  function updateDraft<K extends keyof AuditFilters>(
    key: K,
    value: AuditFilters[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFilterError("");
  }

  function applyFilters() {
    if ((draft.from && !draft.to) || (!draft.from && draft.to)) {
      setFilterError("Choose both audit date bounds or leave both blank.");
      return;
    }
    if (draft.from && draft.to && draft.from > draft.to) {
      setFilterError("From date must be on or before To date.");
      return;
    }
    setFilterError("");
    setPage(1);
    setApplied({ ...draft });
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setFilterError("");
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle="Append-only history of canonical booking, payment, rental, requirements, and maintenance activity."
      />
      <Card>
        <CardHeader
          title="Audit events"
          hint={`${data.total.toLocaleString()} recorded events · read only`}
        />
        <Toolbar>
          <Filter label="Domain">
            <TSelect
              value={draft.domain}
              onChange={(event) => updateDraft("domain", event.target.value)}
              aria-label="Filter audit domain"
            >
              <option value="">All domains</option>
              {AUDIT_DOMAINS.map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </TSelect>
          </Filter>
          <Filter label="Actor">
            <TSelect
              value={draft.actorType}
              onChange={(event) => updateDraft("actorType", event.target.value)}
              aria-label="Filter audit actor"
            >
              <option value="">All actors</option>
              {AUDIT_ACTOR_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </TSelect>
          </Filter>
          <Filter label="From">
            <TInput
              type="date"
              value={draft.from}
              onChange={(event) => updateDraft("from", event.target.value)}
            />
          </Filter>
          <Filter label="To">
            <TInput
              type="date"
              value={draft.to}
              onChange={(event) => updateDraft("to", event.target.value)}
            />
          </Filter>
          <Btn variant="primary" onClick={applyFilters}>
            Apply
          </Btn>
          <Btn variant="ghost" onClick={clearFilters}>
            Clear
          </Btn>
        </Toolbar>
        {filterError ? (
          <p
            className="border-b border-border px-5 pb-4 text-sm text-[#b43b3b]"
            role="alert"
          >
            {filterError}
          </p>
        ) : null}
        {message ? (
          <div className="px-5 py-5" role="alert">
            <p className="text-sm text-[#b43b3b]">{message}</p>
            <Btn className="mt-3" onClick={() => setApplied({ ...applied })}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Btn>
          </div>
        ) : null}
        {loading ? (
          <p className="px-5 py-8 text-sm text-muted-foreground" role="status">
            Loading audit events…
          </p>
        ) : null}
        {!loading && !message && data.events.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No audit events match these filters.
          </p>
        ) : null}
        {!loading && !message && data.events.length ? (
          <AuditEvents events={data.events} />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm">
          <span className="text-muted-foreground">
            Page {data.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Btn
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Btn>
            <Btn
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AuditEvents({ events }: { events: AuditEvent[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Immutable audit events</caption>
          <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Time</th>
              <th className="px-5 py-3 font-semibold">Actor</th>
              <th className="px-5 py-3 font-semibold">Action</th>
              <th className="px-5 py-3 font-semibold">Entity / context</th>
              <th className="px-5 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <AuditRow key={event.id} event={event} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-border lg:hidden">
        {events.map((event) => (
          <AuditDisclosure key={event.id} event={event} />
        ))}
      </div>
    </>
  );
}

function AuditRow({ event }: { event: AuditEvent }) {
  return (
    <tr className="border-b border-border/60 align-top hover:bg-secondary/30">
      <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
        {formatManila(event.occurred_at)}
      </td>
      <td className="px-5 py-4">
        <div className="font-medium">
          {event.actor?.full_name || event.actor_type}
        </div>
        <div className="text-xs text-muted-foreground">
          {event.actor?.user_type || event.actor_type}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="font-medium">{humanizeAction(event.action)}</div>
        <Badge>{event.actor_type}</Badge>
      </td>
      <td className="px-5 py-4">
        <div>{titleCase(event.entity_type)}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {event.entity_id}
        </div>
        {event.booking_id ? (
          <div className="mt-1 text-xs text-muted-foreground">
            Booking {event.booking_id}
          </div>
        ) : null}
      </td>
      <td className="max-w-md px-5 py-4 text-muted-foreground">
        {summarizeAuditEvent(event)}
      </td>
    </tr>
  );
}

function AuditDisclosure({ event }: { event: AuditEvent }) {
  return (
    <details className="group px-5 py-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <div className="font-medium">{humanizeAction(event.action)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatManila(event.occurred_at)} ·{" "}
            {event.actor?.full_name || event.actor_type}
          </div>
        </div>
        <ChevronDown
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Actor
          </dt>
          <dd className="mt-1">
            {event.actor?.full_name || event.actor_type} ·{" "}
            {event.actor?.user_type || event.actor_type}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Entity
          </dt>
          <dd className="mt-1">
            {titleCase(event.entity_type)}{" "}
            <span className="font-mono text-xs text-muted-foreground">
              {event.entity_id}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Canonical details
          </dt>
          <dd className="mt-1 text-muted-foreground">
            {summarizeAuditEvent(event)}
          </dd>
        </div>
        {event.booking_id ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Booking context
            </dt>
            <dd className="mt-1 font-mono text-xs">{event.booking_id}</dd>
          </div>
        ) : null}
      </dl>
    </details>
  );
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-36 flex-col gap-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function manilaStart(value: string) {
  return new Date(`${value}T00:00:00+08:00`).toISOString();
}
function manilaEnd(value: string) {
  return new Date(`${value}T23:59:59.999+08:00`).toISOString();
}
function formatManila(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
