import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowRight,
  Car,
  CreditCard,
  FileText,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  Card,
  DomainStatus,
  EmptyState,
  ErrorState,
  QueuePagination,
  TInput,
  TSelect,
} from "@/components/admin/ui";
import {
  formatAdminDateRange,
  formatAdminDateTime,
  rentalState,
  statusTone,
  type AdminBooking,
} from "@/lib/admin-presentations";
import { parseAdminBookingResponse } from "@/lib/booking-retrieval";

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsRouteComponent,
});

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      bookings: AdminBooking[];
      total: number;
      branches: Array<{ id: string; name: string }>;
      statuses: string[];
      serverPaginated: boolean;
    };

function initialSearchParam(key: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

function initialPage() {
  const value = Number(initialSearchParam("page"));
  return Number.isInteger(value) && value > 0 ? value : 1;
}

function initialPageSize() {
  return Number(initialSearchParam("limit")) === 50 ? 50 : 25;
}

function BookingsRouteComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  return pathname === "/admin/bookings" || pathname === "/admin/bookings/" ? (
    <BookingsPage />
  ) : (
    <Outlet />
  );
}

function BookingsPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState(() => initialSearchParam("q"));
  const [status, setStatus] = useState(() => initialSearchParam("status"));
  const [branch, setBranch] = useState(() => initialSearchParam("branch"));
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const serverPaginated = !query.trim();
      const params = new URLSearchParams();
      if (serverPaginated) {
        params.set("view", "queue");
        params.set("page", String(page));
        params.set("limit", String(pageSize));
        if (status) params.set("status", status);
        if (branch) params.set("branch", branch);
      }
      const response = await fetch(`/api/bookings${params.size ? `?${params}` : ""}`, {
        credentials: "same-origin",
      });
      const data = await parseAdminBookingResponse(response, {
        allowStaffResponse: true,
      });
      setState({
        status: "ready",
        bookings: data.bookings as AdminBooking[],
        total: data.pagination?.total ?? data.bookings.length,
        branches: data.branches ?? [],
        statuses: data.statuses ?? [],
        serverPaginated,
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load rental requests.",
      });
    }
  }, [branch, page, pageSize, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status) next.set("status", status);
    if (branch) next.set("branch", branch);
    if (page > 1) next.set("page", String(page));
    if (pageSize !== 25) next.set("limit", String(pageSize));
    const search = next.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [branch, page, pageSize, query, status]);

  const bookings = useMemo(
    () => (state.status === "ready" ? state.bookings : []),
    [state],
  );
  const statusOptions = useMemo(
    () =>
      state.status === "ready" && state.statuses.length
        ? state.statuses
        : [
            ...new Set(
              bookings.map((booking) => booking.booking_status).filter(Boolean),
            ),
          ].sort(),
    [bookings, state],
  );
  const branchOptions = useMemo(
    () => {
      if (state.status === "ready" && state.branches.length) return state.branches;
      return bookings
        .map((booking) => booking.pickup_branch)
        .filter(
          (value): value is { id: string; name: string } =>
            Boolean(value?.id && value.name),
        )
        .filter(
          (value, index, values) =>
            values.findIndex((item) => item.id === value.id) === index,
        )
        .sort((left, right) => left.name.localeCompare(right.name));
    },
    [bookings, state],
  );
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (status && booking.booking_status !== status) return false;
      if (branch && booking.pickup_branch?.id !== branch) return false;
      if (!normalizedQuery) return true;
      return [
        booking.id,
        booking.customer?.full_name,
        booking.customer?.email,
        booking.requested_vehicle?.name,
        booking.requested_vehicle?.license_plate,
        booking.assigned_vehicle?.name,
        booking.assigned_vehicle?.license_plate,
        booking.pickup_branch?.name,
        booking.return_branch?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [bookings, branch, query, status]);

  const serverPaginated = state.status === "ready" && state.serverPaginated;
  const total = serverPaginated ? state.total : rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const visibleRows = useMemo(
    () =>
      serverPaginated
        ? rows
        : rows.slice((page - 1) * pageSize, page * pageSize),
    [page, pageSize, rows, serverPaginated],
  );

  const clearFilters = () => {
    setQuery("");
    setStatus("");
    setBranch("");
    setPage(1);
  };
  const attentionCount = rows.filter((booking) =>
    [
      booking.requirement_status,
      booking.payment_status,
      booking.booking_status,
    ].some((value) =>
      ["Pending Review", "Needs Resubmission", "Pending Verification"].includes(
        value ?? "",
      ),
    ),
  ).length;
  const documentReviewCount = rows.filter((booking) =>
    ["Pending Review", "Needs Resubmission"].includes(
      booking.requirement_status ?? "",
    ),
  ).length;
  const readyForReviewCount = rows.filter(
    (booking) =>
      booking.booking_status === "Submitted" &&
      booking.requirement_status === "Verified",
  ).length;
  const paymentReviewCount = rows.filter(
    (booking) => booking.payment_status === "Pending Verification",
  ).length;
  const hasFilters = Boolean(query || status || branch);
  const isLoading = state.status === "loading";

  return (
    <div className="admin-bookings-workspace" aria-busy={isLoading || undefined}>
      <header className="admin-bookings-heading">
        <div>
          <h1>Rental requests</h1>
          <p>
            Review requirements, confirm the request, then collect payment.
          </p>
        </div>
        <div className="admin-bookings-heading__stats" aria-label="Queue overview">
          <QueueMetric
            label="Total requests"
            value={total}
            loading={isLoading}
          />
          <QueueMetric
            label="Needs attention"
            value={attentionCount}
            loading={isLoading}
            attention={attentionCount > 0}
          />
        </div>
      </header>

      <div className="admin-bookings-toolbar" role="search" aria-label="Filter rental requests">
        <label className="min-w-0 flex-1 md:min-w-[300px]">
          <span className="sr-only">Search rental requests</span>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <TInput
              name="booking-search"
              autoComplete="off"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by customer, vehicle, or reference…"
              className="pl-10"
            />
          </span>
        </label>
        <label className="min-w-[150px]">
          <span className="sr-only">Filter by booking status</span>
          <TSelect
            name="booking-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </TSelect>
        </label>
        <label className="min-w-[150px]">
          <span className="sr-only">Filter by allocation location</span>
          <TSelect
            name="booking-branch"
            value={branch}
            onChange={(event) => {
              setBranch(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All locations</option>
            {branchOptions.map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </TSelect>
        </label>
        <span className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {state.status === "ready"
            ? `${total.toLocaleString()} request${total === 1 ? "" : "s"}`
            : "Loading requests…"}
        </span>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="touch-target admin-bookings-clear"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <BookingsWorkspaceSkeleton />
      ) : state.status === "error" ? (
        <Card>
          <ErrorState message={state.message} onRetry={() => void load()} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            title={
              bookings.length === 0
                ? "No rental requests"
                : "No requests match these filters"
            }
            description={
              bookings.length === 0
                ? "No canonical booking records are available for this workspace."
                : "Clear the filters to review the current request collection."
            }
            action={
              bookings.length > 0 && (query || status || branch) ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="touch-target text-sm font-semibold text-primary underline underline-offset-4"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <section className="admin-bookings-triage" aria-label="Rental request triage">
            <AttentionRail
              documentReviewCount={documentReviewCount}
              readyForReviewCount={readyForReviewCount}
              paymentReviewCount={paymentReviewCount}
            />
            <div className="admin-bookings-queue">
              <div className="admin-bookings-queue__heading">
                <div>
                  <h2>Review queue</h2>
                  <p>Open a request to review its requirements and next action.</p>
                </div>
                <span>{visibleRows.length} on this page</span>
              </div>
              <BookingsTable rows={visibleRows} />
            </div>
          </section>
          <QueuePagination
            page={Math.min(page, pageCount)}
            pageSize={pageSize}
            total={total}
            itemLabel="rental requests"
            onPageChange={(nextPage) =>
              setPage(Math.max(1, Math.min(nextPage, pageCount)))
            }
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}

function QueueMetric({
  label,
  value,
  loading,
  attention = false,
}: {
  label: string;
  value: number;
  loading: boolean;
  attention?: boolean;
}) {
  return (
    <span className={attention ? "is-attention" : undefined}>
      {loading ? (
        <i className="admin-bookings-skeleton admin-bookings-skeleton--metric" />
      ) : (
        <strong>{value.toLocaleString()}</strong>
      )}
      {label}
    </span>
  );
}

function AttentionRail({
  documentReviewCount,
  readyForReviewCount,
  paymentReviewCount,
}: {
  documentReviewCount: number;
  readyForReviewCount: number;
  paymentReviewCount: number;
}) {
  const items = [
    {
      icon: FileText,
      label: "Requirements to review",
      detail: "Submitted documents awaiting a decision",
      value: documentReviewCount,
      to: "/admin/requirements" as never,
      attention: documentReviewCount > 0,
    },
    {
      icon: Car,
      label: "Ready for request review",
      detail: "Requirements verified; confirm vehicle and schedule",
      value: readyForReviewCount,
      to: "/admin/bookings" as never,
    },
    {
      icon: CreditCard,
      label: "Payments to verify",
      detail: "Payment proof awaiting verification",
      value: paymentReviewCount,
      to: "/admin/payments" as never,
      attention: paymentReviewCount > 0,
    },
  ];

  return (
    <aside className="admin-bookings-attention" aria-labelledby="attention-heading">
      <div className="admin-bookings-attention__heading">
        <h2 id="attention-heading">Needs attention</h2>
        <p>Work through the next unblocker for each request.</p>
      </div>
      <div className="admin-bookings-attention__list">
        {items.map(({ icon: Icon, label, detail, value, to, attention }) => (
          <Link
            key={label}
            to={to}
            className="admin-bookings-attention__item"
          >
            <span className={attention ? "is-attention" : undefined}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
            <b className={attention ? "is-attention" : undefined}>{value}</b>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </aside>
  );
}

function BookingsWorkspaceSkeleton() {
  return (
    <section className="admin-bookings-triage admin-bookings-triage--loading" aria-label="Loading rental request queue">
      <aside className="admin-bookings-attention">
        <div className="admin-bookings-attention__heading">
          <i className="admin-bookings-skeleton admin-bookings-skeleton--title" />
          <i className="admin-bookings-skeleton admin-bookings-skeleton--copy" />
        </div>
        <div className="admin-bookings-attention__list">
          {[1, 2, 3].map((item) => (
            <div className="admin-bookings-skeleton-attention" key={item}>
              <i className="admin-bookings-skeleton admin-bookings-skeleton--icon" />
              <span>
                <i className="admin-bookings-skeleton admin-bookings-skeleton--line" />
                <i className="admin-bookings-skeleton admin-bookings-skeleton--copy" />
              </span>
              <i className="admin-bookings-skeleton admin-bookings-skeleton--count" />
            </div>
          ))}
        </div>
      </aside>
      <div className="admin-bookings-queue">
        <div className="admin-bookings-queue__heading">
          <div>
            <i className="admin-bookings-skeleton admin-bookings-skeleton--title" />
            <i className="admin-bookings-skeleton admin-bookings-skeleton--copy" />
          </div>
        </div>
        <div className="admin-bookings-skeleton-table" aria-hidden="true">
          <div className="admin-bookings-skeleton-table__head">
            {[1, 2, 3, 4, 5].map((item) => (
              <i className="admin-bookings-skeleton admin-bookings-skeleton--line" key={item} />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((item) => (
            <div className="admin-bookings-skeleton-table__row" key={item}>
              {[1, 2, 3, 4, 5].map((column) => (
                <i className="admin-bookings-skeleton admin-bookings-skeleton--line" key={column} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingsTable({ rows }: { rows: AdminBooking[] }) {
  return (
    <>
      <div className="hidden xl:block">
        <Card className="admin-bookings-table-card">
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Rental requests table"
            tabIndex={0}
          >
            <table className="admin-bookings-table w-full min-w-[920px] text-left text-sm">
              <caption className="sr-only">
                Rental requests and their current operational state
              </caption>
              <thead className="border-b border-border bg-secondary/45 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-4">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Vehicle / schedule
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Allocation / service
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Request gate
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Payment / rental
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((booking) => (
                  <BookingTableRow key={booking.id} booking={booking} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div className="space-y-3 xl:hidden">
        <p className="text-xs text-muted-foreground">
          Select a request to review its complete operational context.
        </p>
        {rows.map((booking) => (
          <BookingDisclosure key={booking.id} booking={booking} />
        ))}
      </div>
    </>
  );
}

function BookingTableRow({ booking }: { booking: AdminBooking }) {
  return (
    <tr className="admin-bookings-row align-top">
      <td className="px-4 py-4">
        <div className="font-semibold">
          {booking.customer?.full_name ?? "Customer unavailable"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {booking.customer?.email ?? "Email unavailable"}
        </div>
        <div className="admin-bookings-reference" title={booking.id}>
          Ref. {shortBookingReference(booking.id)}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="font-medium">
          {booking.requested_vehicle?.name ?? "Vehicle not recorded"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {booking.assigned_vehicle
            ? `Assigned: ${booking.assigned_vehicle.name}`
            : (booking.requested_vehicle?.license_plate ??
              "Plate not recorded")}
        </div>
        <div className="mt-2 text-xs font-medium tabular-nums text-foreground">
          {formatAdminDateRange(booking.pickup_at, booking.return_at)}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="font-medium">
          {booking.pickup_branch?.name ?? "Location unavailable"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {serviceLabel(booking)}
        </div>
      </td>
      <td className="px-4 py-4">
        <DomainStatus
          label={booking.booking_status || "Unknown"}
          tone={statusTone(booking.booking_status)}
        />
        <div className="mt-2">
          <DomainStatus
            label={booking.requirement_status ?? "Unavailable"}
            tone={statusTone(booking.requirement_status)}
          />
        </div>
      </td>
      <td className="px-4 py-4">
        <DomainStatus
          label={booking.payment_status ?? "Unavailable"}
          tone={statusTone(booking.payment_status)}
        />
        <div className="mt-2">
          <DomainStatus
            label={rentalState(booking)}
            tone={statusTone(rentalState(booking))}
          />
        </div>
      </td>
      <td className="px-4 py-4">
        <Link
          to={`/admin/bookings/${encodeURIComponent(booking.id)}` as never}
          className="admin-bookings-detail-link touch-target"
        >
          Review request
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}

function BookingDisclosure({ booking }: { booking: AdminBooking }) {
  return (
    <details className="admin-bookings-disclosure">
      <summary className="cursor-pointer list-none px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {booking.customer?.full_name ?? "Customer unavailable"}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {booking.requested_vehicle?.name ?? "Vehicle not recorded"} ·{" "}
              {formatAdminDateRange(booking.pickup_at, booking.return_at)}
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {booking.id}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
            Review <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </summary>
      <div className="border-t border-border px-4 pb-4 pt-3">
        <dl className="grid gap-3 sm:grid-cols-2">
          <DisclosureField
            label="Allocation / service"
            value={`${booking.pickup_branch?.name ?? "Location unavailable"} · ${serviceLabel(booking)}`}
          />
          <DisclosureField
            label="Schedule"
            value={`${formatAdminDateTime(booking.pickup_at)} – ${formatAdminDateTime(booking.return_at)}`}
          />
          <DisclosureStatus label="Request" value={booking.booking_status} />
          <DisclosureStatus
            label="Requirements"
            value={booking.requirement_status ?? "Unavailable"}
          />
          <DisclosureStatus
            label="Payment"
            value={booking.payment_status ?? "Unavailable"}
          />
          <DisclosureStatus label="Rental" value={rentalState(booking)} />
        </dl>
        <Link
          to={`/admin/bookings/${encodeURIComponent(booking.id)}` as never}
          className="admin-bookings-detail-link touch-target mt-4"
        >
          Review request
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </details>
  );
}

function shortBookingReference(id: string) {
  return id.slice(-8).toUpperCase();
}

function DisclosureField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

function DisclosureStatus({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        <DomainStatus label={value} tone={statusTone(value)} />
      </dd>
    </div>
  );
}

function serviceLabel(booking: AdminBooking) {
  return booking.pickup_delivery_option === "delivery"
    ? "Delivery"
    : "Delivery / collection service";
}
