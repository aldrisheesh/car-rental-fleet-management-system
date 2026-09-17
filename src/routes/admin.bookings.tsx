import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import {
  Card,
  DomainStatus,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  TInput,
  TSelect,
  Toolbar,
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
  | { status: "ready"; bookings: AdminBooking[] };

function initialSearchParam(key: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
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

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/bookings", {
        credentials: "same-origin",
      });
      const data = await parseAdminBookingResponse(response, {
        allowStaffResponse: true,
      });
      setState({ status: "ready", bookings: data.bookings as AdminBooking[] });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load rental requests.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status) next.set("status", status);
    if (branch) next.set("branch", branch);
    const search = next.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [branch, query, status]);

  const bookings = useMemo(
    () => (state.status === "ready" ? state.bookings : []),
    [state],
  );
  const statusOptions = useMemo(
    () =>
      [
        ...new Set(
          bookings.map((booking) => booking.booking_status).filter(Boolean),
        ),
      ].sort(),
    [bookings],
  );
  const branchOptions = useMemo(
    () =>
      [
        ...new Set(
          bookings
            .map((booking) => booking.pickup_branch?.name)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [bookings],
  );
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (status && booking.booking_status !== status) return false;
      if (branch && booking.pickup_branch?.name !== branch) return false;
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

  const clearFilters = () => {
    setQuery("");
    setStatus("");
    setBranch("");
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
  const hasFilters = Boolean(query || status || branch);

  return (
    <div className="admin-bookings-workspace">
      <PageHeader
        title="Rental requests"
        subtitle="Scan request, review, payment, and rental state."
        eyebrow="Operations queue"
        actions={
          <div className="admin-bookings-overview" aria-label="Queue overview">
            <span>
              <strong>{state.status === "ready" ? bookings.length : "—"}</strong>
              total requests
            </span>
            <span className={attentionCount ? "is-attention" : ""}>
              <strong>{state.status === "ready" ? attentionCount : "—"}</strong>
              need review
            </span>
          </div>
        }
      />

      <Toolbar>
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
              onChange={(event) => setQuery(event.target.value)}
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
            onChange={(event) => setStatus(event.target.value)}
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
            onChange={(event) => setBranch(event.target.value)}
          >
            <option value="">All locations</option>
            {branchOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </TSelect>
        </label>
        <span className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {state.status === "ready"
            ? `Showing ${rows.length} of ${bookings.length}`
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
      </Toolbar>

      {state.status === "loading" ? (
        <Card>
          <LoadingRows count={6} />
        </Card>
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
        <BookingsTable rows={rows} />
      )}
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
            <table className="admin-bookings-table w-full min-w-[1120px] text-left text-sm">
              <caption className="sr-only">
                Rental requests and their current operational state
              </caption>
              <thead className="border-b border-border bg-secondary/45 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-4">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Vehicle / plate
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Requested schedule
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Allocation / service
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Request
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Requirements
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Payment
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Rental
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
      </td>
      <td className="px-4 py-4 tabular-nums">
        <div>{formatAdminDateRange(booking.pickup_at, booking.return_at)}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {formatAdminDateTime(booking.pickup_at)} –{" "}
          {formatAdminDateTime(booking.return_at)}
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
      </td>
      <td className="px-4 py-4">
        <DomainStatus
          label={booking.requirement_status ?? "Unavailable"}
          tone={statusTone(booking.requirement_status)}
        />
      </td>
      <td className="px-4 py-4">
        <DomainStatus
          label={booking.payment_status ?? "Unavailable"}
          tone={statusTone(booking.payment_status)}
        />
      </td>
      <td className="px-4 py-4">
        <DomainStatus
          label={rentalState(booking)}
          tone={statusTone(rentalState(booking))}
        />
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
