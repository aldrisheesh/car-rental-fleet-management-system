import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { FileCheck2, Search } from "lucide-react";
import {
  Card,
  DomainStatus,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  TInput,
  Toolbar,
} from "@/components/admin/ui";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import type { AdminRequirementSet } from "@/lib/admin-presentations";
import { formatAdminDateTime, statusTone } from "@/lib/admin-presentations";

export const Route = createFileRoute("/admin/requirements")({
  beforeLoad: () => {
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: RequirementsQueuePage,
});

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sets: AdminRequirementSet[] };

function RequirementsQueuePage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/requirements", {
        credentials: "same-origin",
      });
      const body = (await response.json().catch(() => null)) as {
        requirementSets?: AdminRequirementSet[];
        message?: string;
      } | null;
      if (!response.ok || !body || !Array.isArray(body.requirementSets)) {
        throw new Error(
          body?.message ?? "Unable to load requirements for review.",
        );
      }
      setState({ status: "ready", sets: body.requirementSets });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load requirements for review.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sets = useMemo(
    () => (state.status === "ready" ? state.sets : []),
    [state],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sets;
    return sets.filter((set) =>
      [
        set.booking_id,
        set.booking?.customer?.full_name,
        set.booking?.customer?.email,
        set.booking?.requested_vehicle?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, sets]);

  return (
    <div>
      <PageHeader
        title="Requirements review"
        subtitle="Review current customer documents against the canonical requirements contract."
      />

      <Toolbar>
        <label className="min-w-0 flex-1 md:min-w-[320px]">
          <span className="sr-only">Search requirements queue</span>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <TInput
              name="requirements-search"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer or booking reference…"
              className="pl-10"
            />
          </span>
        </label>
        <span className="inline-flex min-h-11 items-center text-sm text-muted-foreground">
          {state.status === "ready"
            ? `${filtered.length} pending review${filtered.length === 1 ? "" : "s"}`
            : "Loading review queue…"}
        </span>
      </Toolbar>

      {state.status === "loading" ? (
        <Card>
          <LoadingRows count={5} />
        </Card>
      ) : state.status === "error" ? (
        <Card>
          <ErrorState message={state.message} onRetry={() => void load()} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={
              sets.length === 0
                ? "No requirements need review"
                : "No reviews match this search"
            }
            description={
              sets.length === 0
                ? "The canonical requirements queue contains no pending submissions."
                : "Clear the search to review the current pending submissions."
            }
            action={
              sets.length > 0 && query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="touch-target text-sm font-semibold text-primary underline underline-offset-4"
                >
                  Clear search
                </button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {filtered.map((set) => (
              <Link
                key={set.id}
                to={
                  `/admin/requirements/${encodeURIComponent(set.booking_id)}` as never
                }
                className="group grid gap-3 px-5 py-4 transition-colors hover:bg-secondary/35 md:grid-cols-[minmax(0,1fr)_minmax(160px,0.65fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {set.booking?.customer?.full_name ?? "Customer unavailable"}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {set.booking?.requested_vehicle?.name ??
                      "Vehicle unavailable"}
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono text-xs">{set.booking_id}</span>
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Submitted
                  </span>
                  <span className="mt-1 block">
                    {formatAdminDateTime(set.submitted_at ?? set.updated_at)}
                  </span>
                </div>
                <div className="flex items-center gap-4 md:justify-end">
                  <DomainStatus
                    label={set.status}
                    tone={statusTone(set.status)}
                  />
                  <span className="touch-target inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4 group-hover:text-[#0d322e]">
                    <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                    Review
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
