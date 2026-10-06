import { readFetch } from "@/lib/read-fetch";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  AUDIT_ACTOR_TYPES,
  AUDIT_DOMAINS,
  humanizeAction,
  summarizeAuditEvent,
  type AuditDomain,
  type AuditEvent,
} from "@/lib/audit";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import { Btn, PageHeader, TInput, TSelect } from "@/components/admin/ui";

type AuditResponse = {
  events: AuditEvent[];
  page: number;
  limit: number;
  total: number;
  domainCounts: Record<AuditDomain, number>;
};

type AuditFilters = {
  domain: string;
  actorType: string;
  from: string;
  to: string;
  query: string;
};

const emptyFilters: AuditFilters = {
  domain: "",
  actorType: "",
  from: "",
  to: "",
  query: "",
};

const domainCopy: Record<AuditDomain, string> = {
  booking: "Bookings",
  requirements: "Requirements",
  payment: "Payments",
  rental: "Rentals",
  maintenance: "Maintenance",
};

const domainIcon: Record<AuditDomain, LucideIcon> = {
  booking: CalendarDays,
  requirements: ClipboardCheck,
  payment: CreditCard,
  rental: CarFront,
  maintenance: Wrench,
};

const domainAccent: Record<AuditDomain, string> = {
  booking: "bg-[#e8f0ec] text-[#165447]",
  requirements: "bg-[#e4f1ee] text-[#17695f]",
  payment: "bg-[#fcf0d8] text-[#96611b]",
  rental: "bg-[#e6eee8] text-[#154d43]",
  maintenance: "bg-[#edf0f3] text-[#4e6170]",
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
    domainCounts: {
      booking: 0,
      requirements: 0,
      payment: 0,
      rental: 0,
      maintenance: 0,
    },
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filterError, setFilterError] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

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
      if (applied.query) params.set("search", applied.query);
      try {
        const response = await readFetch(`/api/audit-events?${params}`, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const body = (await response.json().catch(() => null)) as
          | (AuditResponse & { message?: string })
          | null;
        if (!response.ok)
          throw new Error(body?.message || "Unable to load audit trail.");
        setData(
          body ?? {
            events: [],
            page,
            limit: 25,
            total: 0,
            domainCounts: {
              booking: 0,
              requirements: 0,
              payment: 0,
              rental: 0,
              maintenance: 0,
            },
          },
        );
        setExpandedEventId(null);
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

  function selectDomain(domain: string) {
    const next = { ...draft, domain };
    setDraft(next);
    setApplied(next);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
  const allDomainCount = Object.values(data.domainCounts).reduce(
    (total, count) => total + count,
    0,
  );

  return (
    <div className="admin-audit-ledger">
      <PageHeader
        title="Audit trail"
        subtitle="An immutable record of booking, payment, rental, requirements, and maintenance activity."
        actions={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Read only</span>
          </div>
        }
      />

      <section
        className="overflow-hidden rounded-lg border border-border bg-card"
        aria-labelledby="audit-register-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#f3f7f4] px-5 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <h2
              id="audit-register-title"
              className="font-semibold text-foreground"
            >
              Audit register
            </h2>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {data.total.toLocaleString()} events
            </span>
          </div>
          <button
            type="button"
            onClick={() => setApplied({ ...applied })}
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-[#0d322e]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="border-b border-border px-5 py-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(13rem,1.4fr)_minmax(9rem,.7fr)_minmax(9rem,.7fr)_minmax(8.5rem,.6fr)_minmax(8.5rem,.6fr)_auto]">
            <label className="relative block">
              <span className="sr-only">Search audit events</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <TInput
                value={draft.query}
                onChange={(event) => updateDraft("query", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                placeholder="Search events or record ID"
                className="w-full pl-10"
              />
            </label>
            <label className="relative min-w-0">
              <span className="sr-only">Filter audit domain</span>
              <TSelect
                value={draft.domain}
                onChange={(event) => updateDraft("domain", event.target.value)}
                className="w-full appearance-none pr-10"
              >
                <option value="">All domains</option>
                {AUDIT_DOMAINS.map((value) => (
                  <option key={value} value={value}>
                    {domainCopy[value]}
                  </option>
                ))}
              </TSelect>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </label>
            <label className="relative min-w-0">
              <span className="sr-only">Filter audit actor</span>
              <TSelect
                value={draft.actorType}
                onChange={(event) =>
                  updateDraft("actorType", event.target.value)
                }
                className="w-full appearance-none pr-10"
              >
                <option value="">All actors</option>
                {AUDIT_ACTOR_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </TSelect>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </label>
            <label>
              <span className="sr-only">From date</span>
              <TInput
                type="date"
                value={draft.from}
                onChange={(event) => updateDraft("from", event.target.value)}
                className="w-full"
              />
            </label>
            <label>
              <span className="sr-only">To date</span>
              <TInput
                type="date"
                value={draft.to}
                onChange={(event) => updateDraft("to", event.target.value)}
                className="w-full"
              />
            </label>
            <div className="flex gap-2">
              <Btn variant="primary" onClick={applyFilters}>
                Filter
              </Btn>
              <Btn variant="ghost" onClick={clearFilters}>
                Clear
              </Btn>
            </div>
          </div>
          {filterError ? (
            <p className="mt-3 text-sm text-[#b43b3b]" role="alert">
              {filterError}
            </p>
          ) : null}
        </div>

        <nav
          className="flex overflow-x-auto border-b border-border px-5"
          aria-label="Audit event domain"
        >
          <DomainTab
            label="All activity"
            count={allDomainCount}
            active={!applied.domain}
            onClick={() => selectDomain("")}
          />
          {AUDIT_DOMAINS.map((domain) => (
            <DomainTab
              key={domain}
              label={domainCopy[domain]}
              count={data.domainCounts[domain]}
              active={applied.domain === domain}
              onClick={() => selectDomain(domain)}
            />
          ))}
        </nav>

        {message ? (
          <div className="px-5 py-6" role="alert">
            <p className="text-sm text-[#b43b3b]">{message}</p>
            <Btn className="mt-3" onClick={() => setApplied({ ...applied })}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Btn>
          </div>
        ) : null}
        {loading ? <AuditLedgerSkeleton /> : null}
        {!loading && !message && data.events.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No audit events match these filters.
          </p>
        ) : null}
        {!loading && !message && data.events.length ? (
          <AuditLedger
            events={data.events}
            expandedEventId={expandedEventId}
            onToggle={setExpandedEventId}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm">
          <span className="tabular-nums text-muted-foreground">
            Showing {(page - 1) * data.limit + 1}–
            {Math.min(page * data.limit, data.total)} of {data.total} events
          </span>
          <nav
            className="flex items-center gap-2"
            aria-label="Audit events pagination"
          >
            <Btn
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Btn>
            <span className="min-w-16 text-center tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Btn
              aria-label="Next page"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Btn>
          </nav>
        </div>
      </section>
    </div>
  );
}

function DomainTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 cursor-pointer px-4 py-3 text-sm font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
    >
      {label} <span className="ml-2 tabular-nums">{count}</span>
      {active ? (
        <span
          className="absolute inset-x-4 bottom-0 h-0.5 bg-primary"
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}

function AuditLedgerSkeleton() {
  return (
    <div
      className="animate-pulse"
      role="status"
      aria-label="Loading audit events"
      aria-busy="true"
    >
      <div className="hidden overflow-x-auto lg:block">
        <table
          className="w-full min-w-[940px] text-left text-sm"
          aria-hidden="true"
        >
          <thead className="border-b border-border bg-[#fbfcfb]">
            <tr>
              {["w-5", "w-20", "w-32", "w-20", "w-28", "w-16", "w-5"].map(
                (width, index) => (
                  <th key={index} className="px-4 py-3 first:px-5">
                    <span
                      className={`block h-3 rounded-full bg-[#e8eeea] ${width}`}
                    />
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }, (_, row) => (
              <tr key={row} className="border-b border-border/60">
                <td className="px-5 py-5">
                  <span className="block h-3 w-4 rounded-full bg-[#e8eeea]" />
                </td>
                <td className="px-4 py-5">
                  <span className="block h-3 w-24 rounded-full bg-[#e8eeea]" />
                </td>
                <td className="px-4 py-5">
                  <div className="flex items-start gap-3">
                    <span className="h-8 w-8 rounded-full bg-[#e3ece7]" />
                    <span className="mt-1 block h-3 w-36 rounded-full bg-[#e8eeea]" />
                  </div>
                </td>
                <td className="px-4 py-5">
                  <span className="block h-3 w-28 rounded-full bg-[#e8eeea]" />
                </td>
                <td className="px-4 py-5">
                  <span className="block h-3 w-40 rounded-full bg-[#e8eeea]" />
                </td>
                <td className="px-4 py-5">
                  <span className="block h-3 w-16 rounded-full bg-[#e3ece7]" />
                </td>
                <td className="px-4 py-5">
                  <span className="block h-4 w-4 rounded-full bg-[#e8eeea]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-border px-5 lg:hidden" aria-hidden="true">
        {Array.from({ length: 5 }, (_, row) => (
          <div key={row} className="flex gap-3 py-5">
            <span className="h-9 w-9 shrink-0 rounded-full bg-[#e3ece7]" />
            <div className="min-w-0 flex-1 space-y-2">
              <span className="block h-3 w-2/5 rounded-full bg-[#e8eeea]" />
              <span className="block h-3 w-3/5 rounded-full bg-[#e8eeea]" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading audit events…</span>
    </div>
  );
}

function AuditLedger({
  events,
  expandedEventId,
  onToggle,
}: {
  events: AuditEvent[];
  expandedEventId: string | null;
  onToggle: (id: string | null) => void;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[940px] text-left text-sm">
          <caption className="sr-only">Immutable audit events</caption>
          <thead className="border-b border-border bg-[#fbfcfb] text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-12 px-5 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Date &amp; time</th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Related record</th>
              <th className="px-4 py-3 font-semibold">Result</th>
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <AuditLedgerRow
                key={event.id}
                event={event}
                index={index}
                expanded={event.id === expandedEventId}
                onToggle={() =>
                  onToggle(event.id === expandedEventId ? null : event.id)
                }
              />
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

function AuditLedgerRow({
  event,
  index,
  expanded,
  onToggle,
}: {
  event: AuditEvent;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = domainIcon[event.entity_type];
  return (
    <>
      <tr
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className={`cursor-pointer border-b border-border/60 align-top transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset ${expanded ? "bg-[#eef5f0]" : "hover:bg-secondary/30"}`}
      >
        <td className="px-5 py-4 tabular-nums text-muted-foreground">
          {index + 1}
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-xs leading-5 text-muted-foreground">
          {formatManila(event.occurred_at)}
        </td>
        <td className="px-4 py-4">
          <div className="flex min-w-[13rem] items-start gap-3">
            <span
              className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${domainAccent[event.entity_type]}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="font-semibold text-foreground">
                {humanizeAction(event.action)}
              </div>
              <div className="mt-0.5 max-w-xs text-xs leading-5 text-muted-foreground">
                {summarizeAuditEvent(event)}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="font-medium text-foreground">
            {event.actor?.full_name || event.actor_type}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {event.actor?.user_type || event.actor_type}
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="font-mono text-xs text-primary">
            {event.booking_id || event.entity_id}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {titleCase(event.entity_type)}
          </div>
        </td>
        <td className="px-4 py-4">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#267a55]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Recorded
          </span>
        </td>
        <td className="px-4 py-4">
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`${expanded ? "Hide" : "Show"} details for ${humanizeAction(event.action)}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-border bg-[#f8fbf9]">
          <td colSpan={7} className="px-5 py-5">
            <AuditChangeDetail event={event} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function AuditChangeDetail({ event }: { event: AuditEvent }) {
  const before = readableMetadata(event.metadata, "previous_");
  const after = readableMetadata(event.metadata, "new_");
  return (
    <section
      className="ml-16 border-l-2 border-primary/30 pl-5"
      aria-label="Immutable event details"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-3 text-xs text-muted-foreground">
        <span>
          <strong className="mr-2 font-semibold text-foreground">
            Audit ID
          </strong>
          <span className="font-mono">{event.id}</span>
        </span>
        <span>
          <strong className="mr-2 font-semibold text-foreground">
            Recorded at
          </strong>
          {formatManila(event.occurred_at)}
        </span>
        <span>
          <strong className="mr-2 font-semibold text-foreground">Domain</strong>
          {domainCopy[event.entity_type]}
        </span>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <ChangeList
          title="Before"
          rows={before}
          emptyLabel="No prior value recorded"
        />
        <ChangeList
          title="After"
          rows={after}
          emptyLabel={summarizeAuditEvent(event)}
        />
      </div>
    </section>
  );
}

function ChangeList({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Array<[string, string]>;
  emptyLabel: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {rows.length ? (
        <dl className="divide-y divide-border rounded-md border border-border bg-white px-3">
          {rows.map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-[minmax(7rem,.8fr)_minmax(0,1.2fr)] gap-3 py-2 text-xs"
            >
              <dt className="text-muted-foreground">
                {titleCase(key.replaceAll("_", " "))}
              </dt>
              <dd className="font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="rounded-md border border-border bg-white px-3 py-3 text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      )}
    </div>
  );
}

function AuditDisclosure({ event }: { event: AuditEvent }) {
  const Icon = domainIcon[event.entity_type];
  return (
    <details className="group px-5 py-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 gap-3">
          <span
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${domainAccent[event.entity_type]}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <div className="font-semibold">{humanizeAction(event.action)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {formatManila(event.occurred_at)} ·{" "}
              {event.actor?.full_name || event.actor_type}
            </div>
          </div>
        </div>
        <ChevronDown
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-4 border-t border-border pt-4">
        <AuditChangeDetail event={event} />
      </div>
    </details>
  );
}

function readableMetadata(
  metadata: Record<string, unknown>,
  prefix: string,
): Array<[string, string]> {
  return Object.entries(metadata)
    .filter(
      ([key, value]) =>
        key.startsWith(prefix) &&
        value !== null &&
        value !== undefined &&
        String(value).trim(),
    )
    .map(([key, value]) => [key.slice(prefix.length), String(value)]);
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
