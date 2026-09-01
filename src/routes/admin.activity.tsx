import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AUDIT_DOMAINS,
  humanizeAction,
  summarizeAuditEvent,
  type AuditEvent,
} from "@/lib/audit";
import { Card, CardHeader, PageHeader } from "@/components/admin/ui";

type AuditResponse = {
  events: AuditEvent[];
  page: number;
  limit: number;
  total: number;
};

export const Route = createFileRoute("/admin/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const [data, setData] = useState<AuditResponse>({
    events: [],
    page: 1,
    limit: 25,
    total: 0,
  });
  const [domain, setDomain] = useState("");
  const [actorType, setActorType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setMessage("");
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (domain) params.set("domain", domain);
      if (actorType) params.set("actorType", actorType);
      if (from) params.set("from", new Date(`${from}T00:00:00`).toISOString());
      if (to) params.set("to", new Date(`${to}T23:59:59.999`).toISOString());
      try {
        const response = await fetch(`/api/audit-events?${params}`, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const body = await response.json().catch(() => null);
        if (!response.ok)
          throw new Error(body?.message || "Unable to load audit trail.");
        setData(body);
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
  }, [actorType, domain, from, page, to]);

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Audit Trail"
        subtitle="Append-only history of core booking and fleet lifecycle activity."
      />
      <Card>
        <CardHeader
          title="Activity"
          hint={`${data.total.toLocaleString()} recorded events`}
        />
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-4">
          <Filter label="Domain">
            <select
              className="input-control"
              value={domain}
              onChange={(event) => updateFilter(setDomain, event.target.value)}
            >
              <option value="">All domains</option>
              {AUDIT_DOMAINS.map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </select>
          </Filter>
          <Filter label="Actor">
            <select
              className="input-control"
              value={actorType}
              onChange={(event) =>
                updateFilter(setActorType, event.target.value)
              }
            >
              <option value="">All actors</option>
              <option value="User">Users</option>
              <option value="System">System</option>
            </select>
          </Filter>
          <Filter label="From">
            <input
              className="input-control"
              type="date"
              value={from}
              onChange={(event) => updateFilter(setFrom, event.target.value)}
            />
          </Filter>
          <Filter label="To">
            <input
              className="input-control"
              type="date"
              value={to}
              onChange={(event) => updateFilter(setTo, event.target.value)}
            />
          </Filter>
        </div>

        {message ? (
          <p className="p-5 text-sm text-destructive">{message}</p>
        ) : null}
        {loading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading activity…</p>
        ) : null}
        {!loading && !message && data.events.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No audit events match these filters.
          </p>
        ) : null}
        {!loading && data.events.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.events.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {new Date(event.occurred_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {event.actor?.full_name || event.actor_type}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.actor?.user_type || event.actor_type}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {humanizeAction(event.action)}
                    </td>
                    <td className="px-4 py-3">
                      <div>{titleCase(event.entity_type)}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {event.entity_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="max-w-md px-4 py-3 text-muted-foreground">
                      {summarizeAuditEvent(event)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">
            Page {data.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-border px-3 py-2 disabled:opacity-40"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </button>
            <button
              className="rounded-md border border-border px-3 py-2 disabled:opacity-40"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
