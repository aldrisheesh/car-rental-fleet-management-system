import { getAdminSession } from "@/lib/admin-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { bookingStage } from "@/lib/booking-stage";
import { bookingReference } from "@/lib/booking-reference";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  Card,
  Btn,
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
  const [reportFrom, setReportFrom] = useState(() =>
    initialSearchParam("from"),
  );
  const [reportTo, setReportTo] = useState(() => initialSearchParam("to"));
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const serverPaginated = !query.trim();
      const params = new URLSearchParams();
      if (reportFrom) params.set("from", reportFrom);
      if (reportTo) params.set("to", reportTo);
      if (serverPaginated) {
        params.set("view", "queue");
        params.set("page", String(page));
        params.set("limit", String(pageSize));
        if (status) params.set("status", status);
        if (branch) params.set("branch", branch);
      }
      const response = await fetch(
        `/api/bookings${params.size ? `?${params}` : ""}`,
        {
          credentials: "same-origin",
        },
      );
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
  }, [branch, page, pageSize, query, status, reportFrom, reportTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status) next.set("status", status);
    if (branch) next.set("branch", branch);
    if (reportFrom) next.set("from", reportFrom);
    if (reportTo) next.set("to", reportTo);
    if (page > 1) next.set("page", String(page));
    if (pageSize !== 25) next.set("limit", String(pageSize));
    const search = next.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [branch, page, pageSize, query, status, reportFrom, reportTo]);

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
  const branchOptions = useMemo(() => {
    if (state.status === "ready" && state.branches.length)
      return state.branches;
    return bookings
      .map((booking) => booking.pickup_branch)
      .filter((value): value is { id: string; name: string } =>
        Boolean(value?.id && value.name),
      )
      .filter(
        (value, index, values) =>
          values.findIndex((item) => item.id === value.id) === index,
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [bookings, state]);
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (status && booking.booking_status !== status) return false;
      if (branch && booking.pickup_branch?.id !== branch) return false;
      if (!normalizedQuery) return true;
      return [
        booking.id,
        bookingReference(booking.id),
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
    setReportFrom("");
    setReportTo("");
    setPage(1);
  };
  const documentReviewCount = visibleRows.filter(
    (b) => bookingStage(b).label === "Document review",
  ).length;
  const readyForReviewCount = visibleRows.filter(
    (b) => bookingStage(b).label === "Ready to confirm",
  ).length;
  const paymentReviewCount = visibleRows.filter(
    (b) => bookingStage(b).label === "Payment review",
  ).length;
  const dateChangeReviewCount = visibleRows.filter(
    (b) => bookingStage(b).label === "Reschedule requested",
  ).length;
  const hasFilters = Boolean(
    query || status || branch || reportFrom || reportTo,
  );
  const isLoading = state.status === "loading";

  return (
    <div
      className="admin-bookings-workspace admin-bookings-stage-workspace"
      aria-busy={isLoading || undefined}
    >
      <header className="admin-bookings-heading">
        <div>
          <h1>Bookings</h1>
          <p>
            {getAdminSession()?.role === "Owner/Admin"
              ? "Review requests and coordinate rentals."
              : "Track request status and coordinate handovers. Owner/Admin reviews requirements, verifies payment and confirms the rental."}
          </p>
        </div>
        <div
          className="admin-bookings-heading__stats"
          aria-label="Queue overview"
        >
          <QueueMetric
            label={hasFilters ? "Matching requests" : "Total requests"}
            value={total}
            loading={isLoading}
          />
        </div>
      </header>
      {reportFrom || reportTo ? (
        <div className="reports-booking-scope" role="note">
          <span>
            Requests received {reportFrom} – {reportTo} · Asia/Manila. These are
            request dates, not rental dates.
          </span>
          <Btn
            variant="ghost"
            onClick={() => {
              setReportFrom("");
              setReportTo("");
              setPage(1);
            }}
          >
            Clear date filter
          </Btn>
        </div>
      ) : null}

      {isLoading ? (
        <div className="booking-page-tasks" aria-hidden="true">
          {[100, 160, 150, 140].map((width) => (
            <Skeleton key={width} style={{ width }} className="h-4" />
          ))}
        </div>
      ) : null}

      {!isLoading && state.status === "ready" && visibleRows.length > 0 ? (
        <div
          className="booking-page-tasks"
          role="note"
          aria-label="Tasks on this page"
        >
          <strong>On this page:</strong>
          <span>
            <b>{documentReviewCount}</b> document review
            {documentReviewCount === 1 ? "" : "s"}
          </span>
          <span>
            <b>{paymentReviewCount}</b> payment review
            {paymentReviewCount === 1 ? "" : "s"}
          </span>
          <span>
            <b>{readyForReviewCount}</b> ready to confirm
          </span>
          {getAdminSession()?.role === "Owner/Admin" ? (
            <span>
              <b>{dateChangeReviewCount}</b> date-change review
              {dateChangeReviewCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className="admin-bookings-toolbar"
        role="search"
        aria-label="Filter rental requests"
      >
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
            <option value="">All booking statuses</option>
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
              hasFilters ? "No bookings match these filters" : "No bookings yet"
            }
            description={
              hasFilters
                ? "Try a different search or clear the filters to view bookings."
                : "Customer requests will appear here once they are saved."
            }
            action={
              hasFilters ? (
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
          <section
            className="admin-bookings-triage"
            aria-label="Rental request triage"
          >
            <div className="admin-bookings-queue">
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

function BookingsWorkspaceSkeleton() {
  return (
    <div
      className="booking-loading-workspace"
      role="status"
      aria-label="Loading rental requests"
    >
      <span className="sr-only">Loading rental requests…</span>
      <section className="admin-bookings-triage" aria-hidden="true">
        <div className="booking-loading-table hidden xl:block">
          <div className="booking-loading-table-head">
            {[
              "Customer",
              "Vehicle & dates",
              "Location & service",
              "Current stage",
              "Next action",
            ].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, row) => (
            <div className="booking-loading-table-row" key={row}>
              {[0, 1, 2, 3].map((column) => (
                <div className="booking-loading-cell" key={column}>
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  {column !== 2 ? <Skeleton className="h-3 w-1/2" /> : null}
                </div>
              ))}
              <Skeleton className="booking-loading-action" />
            </div>
          ))}
        </div>
        <div className="booking-loading-cards xl:hidden">
          {Array.from({ length: 5 }, (_, row) => (
            <div className="booking-loading-card" key={row}>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </section>
      <div className="booking-loading-pagination" aria-hidden="true">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-11 w-64 max-w-full" />
      </div>
    </div>
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
                    Vehicle & dates
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Location & service
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Current stage
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Next action
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
      <div className="admin-bookings-responsive-list xl:hidden">
        {rows.map((booking) => (
          <BookingDisclosure key={booking.id} booking={booking} />
        ))}
      </div>
    </>
  );
}

function BookingTableRow({ booking }: { booking: AdminBooking }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className="admin-bookings-row align-top">
        <td className="px-4 py-4">
          <div className="font-semibold">
            {booking.customer?.full_name ?? "Customer unavailable"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {booking.customer?.email ?? "Email unavailable"}
          </div>
          <div className="admin-bookings-reference" title={booking.id}>
            Ref. {bookingReference(booking.id)}
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
          <BookingStageDetails
            booking={booking}
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
          />
        </td>
        <td className="px-4 py-4">
          <BookingAction booking={booking} />
        </td>
      </tr>
      {expanded ? (
        <tr className="booking-expanded-row">
          <td colSpan={5}>
            <BookingRawStates booking={booking} />
          </td>
        </tr>
      ) : null}
    </>
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
            <p className="mt-1 text-sm text-muted-foreground">
              {booking.requested_vehicle?.name ?? "Vehicle not recorded"} ·{" "}
              {formatAdminDateRange(booking.pickup_at, booking.return_at)}
            </p>
            <div className="mt-3">
              <DomainStatus
                label={bookingStage(booking).label}
                tone={bookingStage(booking).tone}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {bookingStage(booking).detail}
            </p>
            <p className="admin-bookings-reference">
              Ref. {bookingReference(booking.id)}
            </p>
          </div>
          <span className="admin-bookings-disclosure-toggle">
            View details <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </summary>
      <div className="border-t border-border px-4 pb-4 pt-3">
        <dl className="grid gap-3 sm:grid-cols-2">
          <DisclosureField
            label="Location & service"
            value={`${booking.pickup_branch?.name ?? "Location unavailable"} · ${serviceLabel(booking)}`}
          />
          <DisclosureField
            label="Schedule"
            value={`${formatAdminDateTime(booking.pickup_at)} – ${formatAdminDateTime(booking.return_at)}`}
          />
          <DisclosureStatus label="Booking" value={booking.booking_status} />
          <DisclosureStatus
            label="Documents"
            value={booking.requirement_status ?? "Unavailable"}
          />
          <DisclosureStatus
            label="Payment"
            value={booking.payment_status ?? "Unavailable"}
          />
          <DisclosureStatus label="Rental" value={rentalState(booking)} />
        </dl>
        <div className="mt-4">
          <BookingAction booking={booking} />
        </div>
      </div>
    </details>
  );
}

function BookingAction({ booking }: { booking: AdminBooking }) {
  const stage = bookingStage(booking);
  return (
    <Link
      to={`/admin/bookings/${encodeURIComponent(booking.id)}` as never}
      className="admin-bookings-detail-link touch-target"
      aria-label={`${getAdminSession()?.role === "Owner/Admin" ? stage.action : "View booking"} for ${booking.customer?.full_name ?? "customer"}, ${bookingReference(booking.id)}`}
    >
      {getAdminSession()?.role === "Owner/Admin"
        ? stage.action
        : "View booking"}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
function BookingStageDetails({
  booking,
  expanded,
  onToggle,
}: {
  booking: AdminBooking;
  expanded: boolean;
  onToggle: () => void;
}) {
  const stage = bookingStage(booking);
  return (
    <div className="booking-stage-cell">
      <DomainStatus label={stage.label} tone={stage.tone} />
      <p>{stage.detail}</p>
      <button
        type="button"
        className="booking-status-toggle"
        aria-expanded={expanded}
        aria-controls={`booking-status-${booking.id}`}
        onClick={onToggle}
      >
        Status details
        <span className="sr-only"> for {bookingReference(booking.id)}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
function BookingRawStates({ booking }: { booking: AdminBooking }) {
  return (
    <div id={`booking-status-${booking.id}`} className="booking-raw-states">
      <dl>
        <DisclosureStatus
          label="Booking"
          value={booking.booking_status || "Unavailable"}
        />
        <DisclosureStatus
          label="Documents"
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
        className="booking-open-link"
      >
        Open booking
      </Link>
    </div>
  );
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
  return booking.pickup_delivery_option === "delivery" ? "Delivery" : "Pickup";
}
