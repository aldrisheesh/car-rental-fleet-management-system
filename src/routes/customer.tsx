import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Info,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
  StatusCallout,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";
import {
  ApiRequestError,
  fetchJson,
  formatDateRange,
  formatInstant,
  type CustomerBooking,
  type CustomerVehicle,
  type RequirementsResponse,
} from "@/lib/customer-data";
import {
  deriveCustomerLifecycle,
  paymentForBooking,
  type CustomerBookingComposition,
  type LifecyclePresentation,
} from "@/lib/customer-lifecycle";
import type { CustomerPaymentResponse } from "@/lib/payment-retrieval";
import { getAdminSession } from "@/lib/admin-auth";
import { getCustomerSession } from "@/lib/customer-auth";

export const Route = createFileRoute("/customer")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;

    if (getAdminSession()) {
      throw redirect({ to: "/admin" });
    }

    if (!getCustomerSession()) {
      throw redirect({ to: "/sign-in" });
    }
  },
  head: () => ({
    meta: [
      { title: "My Bookings | Briah's Car Rental" },
      {
        name: "description",
        content:
          "Review your rental requests, booking stages, and the next action for each trip.",
      },
    ],
    links: [{ rel: "canonical", href: "/customer" }],
  }),
  component: MyBookingsPage,
});

type BookingRecord = CustomerBookingComposition & {
  vehicle: CustomerVehicle | null;
  lifecycle: LifecyclePresentation;
};

type BookingFilter = "all" | "needs-action" | "current";

function MyBookingsPage() {
  const [records, setRecords] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vehicleWarning, setVehicleWarning] = useState("");
  const [filter, setFilter] = useState<BookingFilter>("all");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    setVehicleWarning("");

    try {
      const [bookings, vehiclesResult] = await Promise.all([
        fetchJson<CustomerBooking[]>("/api/bookings"),
        fetchJson<CustomerVehicle[]>("/api/vehicles").catch((requestError) => {
          setVehicleWarning(
            requestError instanceof ApiRequestError
              ? requestError.message
              : "Vehicle images and specifications are unavailable right now.",
          );
          return [];
        }),
      ]);

      const composed = await Promise.all(
        bookings.map(async (booking) =>
          composeBookingRecord(booking, vehiclesResult),
        ),
      );
      setRecords(composed);
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Your bookings cannot be loaded right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const attentionRecords = useMemo(
    () => records.filter((record) => record.lifecycle.actionRequired),
    [records],
  );
  const filteredRecords = useMemo(
    () => records.filter((record) => matchesFilter(record, filter)),
    [filter, records],
  );
  return (
    <CustomerPage className="booking-list-page">
      <Header />
      <main id="main-content" className="booking-list-main">
        <div className="customer-container">
          <div className="booking-list-heading">
            <div>
              <p className="booking-list-kicker">My account</p>
              <h1>My bookings</h1>
              <p>
                Your current requests and rentals, with the next step shown
                first.
              </p>
            </div>
            <Link className="customer-primary-button" to="/vehicles">
              <CarFront size={20} aria-hidden="true" />
              Find another car
            </Link>
          </div>

          {vehicleWarning ? (
            <StatusCallout tone="info" title="Vehicle details are limited">
              {vehicleWarning} Booking dates and lifecycle state remain tied to
              your account records.
            </StatusCallout>
          ) : null}

          {loading ? (
            <BookingListLoading />
          ) : error ? (
            <StatusCallout
              tone="error"
              title="Bookings unavailable"
              action={
                <button
                  className="customer-secondary-button"
                  type="button"
                  onClick={() => void loadBookings()}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Try again
                </button>
              }
            >
              {error}
            </StatusCallout>
          ) : (
            <>
              {attentionRecords.length > 0 ? (
                <section
                  className="booking-attention"
                  aria-labelledby="booking-attention-title"
                >
                  <div className="booking-section-heading">
                    <h2 id="booking-attention-title">Needs your attention</h2>
                    <span>{attentionRecords.length} request(s)</span>
                  </div>
                  <div className="booking-attention-list">
                    {attentionRecords.map((record) => (
                      <BookingListItem
                        key={record.booking.id}
                        record={record}
                        featured
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <section
                className="booking-all-section"
                aria-labelledby="booking-all-title"
              >
                <div className="booking-section-heading booking-all-heading">
                  <div>
                    <h2 id="booking-all-title">All bookings</h2>
                    <p>
                      Open any request for its exact requirements, payment, and
                      rental record.
                    </p>
                  </div>
                  <BookingFilterTabs filter={filter} onChange={setFilter} />
                </div>

                {filteredRecords.length > 0 ? (
                  <div id="booking-list" className="booking-list" role="list">
                    {filteredRecords.map((record) => (
                      <BookingListItem
                        key={record.booking.id}
                        record={record}
                      />
                    ))}
                  </div>
                ) : (
                  <BookingEmpty
                    filter={filter}
                    hasBookings={records.length > 0}
                  />
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

async function composeBookingRecord(
  booking: CustomerBooking,
  vehicles: CustomerVehicle[],
): Promise<BookingRecord> {
  const [requirementsResult, paymentResult] = await Promise.allSettled([
    fetchJson<RequirementsResponse>(
      `/api/requirements?bookingId=${encodeURIComponent(booking.id)}`,
    ),
    fetchJson<CustomerPaymentResponse>(
      `/api/payments?bookingId=${encodeURIComponent(booking.id)}`,
    ),
  ]);
  const requirementsAvailable = requirementsResult.status === "fulfilled";
  const paymentAvailable = paymentResult.status === "fulfilled";
  const requirements = requirementsAvailable ? requirementsResult.value : null;
  const payment = paymentAvailable
    ? paymentForBooking(booking.id, paymentResult.value.payments)
    : null;
  const requirementsError = requirementsAvailable
    ? null
    : describeError(
        requirementsResult.reason,
        "Requirements status is unavailable.",
      );
  const paymentError = paymentAvailable
    ? null
    : describeError(paymentResult.reason, "Payment status is unavailable.");
  const composition: CustomerBookingComposition = {
    booking,
    requirements,
    payment,
    paymentMethods: [],
    requirementsAvailable,
    paymentAvailable,
    requirementsError,
    paymentError,
  };

  return {
    ...composition,
    vehicle: vehicleForBooking(booking, vehicles),
    lifecycle: deriveCustomerLifecycle(composition),
  };
}

function vehicleForBooking(
  booking: CustomerBooking,
  vehicles: CustomerVehicle[],
) {
  const vehicleId =
    booking.rental?.vehicle_id ??
    booking.assigned_vehicle?.id ??
    booking.requested_vehicle?.id ??
    "";
  const fromFleet = vehicles.find((vehicle) => vehicle.id === vehicleId);
  if (fromFleet) return fromFleet;

  const fallback = booking.rental
    ? ([booking.assigned_vehicle, booking.requested_vehicle].find(
        (candidate) => candidate?.id === booking.rental?.vehicle_id,
      ) ?? null)
    : (booking.assigned_vehicle ?? booking.requested_vehicle);
  if (!fallback) return null;
  return {
    id: fallback.id,
    name: fallback.name,
    license_plate: fallback.license_plate,
    transmission: null,
    fuel_type: null,
    seat_capacity: null,
    daily_rate: null,
    image_url: null,
    branch: booking.pickup_branch,
    category: null,
  } satisfies CustomerVehicle;
}

function describeError(reason: unknown, fallback: string) {
  return reason instanceof ApiRequestError || reason instanceof Error
    ? reason.message
    : fallback;
}

function matchesFilter(record: BookingRecord, filter: BookingFilter) {
  if (filter === "needs-action") return record.lifecycle.actionRequired;
  if (filter === "current") {
    return !["returned", "rejected", "cancelled"].includes(
      record.lifecycle.state,
    );
  }
  return true;
}

function BookingFilterTabs({
  filter,
  onChange,
}: {
  filter: BookingFilter;
  onChange: (filter: BookingFilter) => void;
}) {
  const filters: Array<{ value: BookingFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "needs-action", label: "Needs action" },
    { value: "current", label: "Current" },
  ];
  return (
    <div
      className="booking-filter-tabs"
      role="group"
      aria-label="Filter bookings"
    >
      {filters.map((item) => (
        <button
          className={filter === item.value ? "is-active" : ""}
          key={item.value}
          type="button"
          aria-pressed={filter === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function BookingListItem({
  record,
  featured = false,
}: {
  record: BookingRecord;
  featured?: boolean;
}) {
  const { booking, lifecycle, vehicle } = record;
  const actionLabel = lifecycle.actionLabel ?? defaultActionLabel(lifecycle);
  const vehicleName =
    vehicle?.name ??
    (booking.rental
      ? "Vehicle details unavailable"
      : (booking.requested_vehicle?.name ?? "Vehicle not recorded"));
  const pickup = booking.pickup_branch?.name ?? "Pickup branch not recorded";
  const returnAt = booking.rental?.ended_at
    ? `Returned ${formatInstant(booking.rental.ended_at)}`
    : booking.rental?.started_at
      ? `Return ${formatInstant(booking.rental.scheduled_return_at)}`
      : lifecycle.state === "unavailable"
        ? "Booking details need attention"
        : lifecycle.statusLabel;
  const StatusIcon = statusIcon(lifecycle);

  return (
    <article
      className={`booking-list-item${featured ? " is-featured" : ""}`}
      role="listitem"
    >
      <div className="booking-list-image">
        <VehicleImage
          src={vehicle?.image_url}
          alt={vehicleName}
          sizes="(max-width: 767px) 100vw, 14rem"
        />
      </div>
      <div className="booking-list-identity">
        <h3>{vehicleName}</h3>
        <p>
          <CalendarDays size={18} aria-hidden="true" />
          <span>{formatDateRange(booking.pickup_at, booking.return_at)}</span>
        </p>
        <p>
          <MapPin size={18} aria-hidden="true" />
          <span>Pickup: {pickup}</span>
        </p>
      </div>
      <div className={`booking-list-status is-${lifecycle.statusTone}`}>
        <div className="booking-status-heading">
          <StatusIcon size={20} aria-hidden="true" />
          <strong>{lifecycle.statusLabel}</strong>
        </div>
        <p>{lifecycle.reason || returnAt}</p>
        {lifecycle.state === "unavailable" ? (
          <p className="booking-list-unavailable">
            {record.requirementsError || record.paymentError}
          </p>
        ) : null}
      </div>
      <div className="booking-list-action">
        <Link
          className={
            lifecycle.actionRequired
              ? "customer-primary-button"
              : "customer-link"
          }
          to="/bookings/$bookingId"
          params={{ bookingId: booking.id }}
        >
          {actionLabel}
          {lifecycle.actionRequired ? (
            <ArrowRight size={20} aria-hidden="true" />
          ) : (
            <ArrowRight size={18} aria-hidden="true" />
          )}
        </Link>
      </div>
    </article>
  );
}

function statusIcon(lifecycle: LifecyclePresentation) {
  if (lifecycle.actionRequired) return AlertCircle;
  if (lifecycle.state === "unavailable") return Info;
  if (["active-rental", "returned", "confirmed"].includes(lifecycle.state)) {
    return CheckCircle2;
  }
  return Clock3;
}

function defaultActionLabel(lifecycle: LifecyclePresentation) {
  if (lifecycle.state === "active-rental") return "View rental";
  if (lifecycle.state === "returned") return "View details";
  if (lifecycle.state === "confirmed") return "View booking";
  if (lifecycle.state === "unavailable") return "View request";
  return "View request";
}

function BookingListLoading() {
  return (
    <div className="booking-loading" role="status" aria-live="polite">
      <span>Loading your bookings…</span>
      {[1, 2].map((item) => (
        <div className="booking-skeleton" key={item} aria-hidden="true">
          <div />
          <div />
          <div />
        </div>
      ))}
    </div>
  );
}

function BookingEmpty({
  filter,
  hasBookings,
}: {
  filter: BookingFilter;
  hasBookings: boolean;
}) {
  return (
    <div className="booking-empty">
      <FileCheck2 size={28} aria-hidden="true" />
      <h3>{hasBookings ? "No bookings in this view" : "No bookings yet"}</h3>
      <p>
        {hasBookings
          ? filter === "needs-action"
            ? "Nothing needs your action right now. You can review all booking records instead."
            : "There are no current requests or rentals in this view."
          : "When you send a rental request, its requirements, payment, and rental stages will appear here."}
      </p>
      <Link className="customer-secondary-button" to="/vehicles">
        Find a car
      </Link>
    </div>
  );
}
