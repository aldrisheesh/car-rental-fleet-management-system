import { rememberBookingLoadingState } from "@/lib/booking-loading-state";
import { bookingReference } from "@/lib/booking-reference";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MapPin,
  RefreshCw,
  XCircle,
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
  type CustomerBooking,
  type CustomerVehicle,
  type RequirementSet,
  type RequirementsResponse,
} from "@/lib/customer-data";
import {
  deriveCustomerLifecycle,
  paymentForBooking,
  type CustomerBookingComposition,
  type LifecyclePresentation,
} from "@/lib/customer-lifecycle";
import type { CustomerPayment } from "@/lib/payment-retrieval";
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

type CustomerDashboardResponse = {
  bookings: CustomerBooking[];
  vehicles: CustomerVehicle[];
  requirements: Array<{
    bookingId: string;
    requirementSet: RequirementSet;
    review: RequirementsResponse["review"];
  }>;
  payments: CustomerPayment[];
};

function MyBookingsPage() {
  const [records, setRecords] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const dashboard = await fetchJson<CustomerDashboardResponse>(
        "/api/bookings?view=dashboard",
      );
      const requirementsByBooking = new Map(
        dashboard.requirements.map((requirements) => [
          requirements.bookingId,
          requirements,
        ]),
      );
      setRecords(
        dashboard.bookings.map((booking) =>
          composeBookingRecord(
            booking,
            dashboard.vehicles,
            requirementsByBooking.get(booking.id),
            paymentForBooking(booking.id, dashboard.payments),
          ),
        ),
      );
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

  useEffect(() => {
    records.forEach(({ booking, lifecycle }) =>
      rememberBookingLoadingState(booking.id, lifecycle.state),
    );
  }, [records]);

  const {
    featuredRecord,
    remainingActiveRecords,
    pastRentalRecords,
    closedRecords,
  } = useMemo(() => groupBookings(records), [records]);

  if (loading) {
    return (
      <CustomerPage className="booking-list-page">
        <Header />
        <main id="main-content" className="booking-list-main">
          <div className="customer-container">
            <BookingListLoading />
          </div>
        </main>
        <Footer />
      </CustomerPage>
    );
  }

  return (
    <CustomerPage className="booking-list-page">
      <Header />
      <main id="main-content" className="booking-list-main">
        <div className="customer-container">
          <div className="booking-list-heading">
            <h1>Your rentals</h1>
          </div>

          {error ? (
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
              {featuredRecord ? (
                <section
                  className="booking-dossier-section"
                  aria-labelledby="booking-current-title"
                >
                  <h2 id="booking-current-title">
                    {remainingActiveRecords.length > 0
                      ? "Active and upcoming bookings"
                      : "Active booking"}
                  </h2>
                  <BookingDossier record={featuredRecord} />
                  {remainingActiveRecords.length > 0 ? (
                    <div className="booking-current-list">
                      {remainingActiveRecords.map((record) => (
                        <CurrentBookingRow
                          key={record.booking.id}
                          record={record}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {pastRentalRecords.length > 0 ? (
                <section
                  className="booking-archive"
                  aria-labelledby="booking-archive-title"
                >
                  <h2 id="booking-archive-title">Past rentals</h2>
                  <div className="booking-archive-table" role="list">
                    {pastRentalRecords.map((record) => (
                      <ArchiveBookingRow
                        key={record.booking.id}
                        record={record}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {closedRecords.length > 0 ? (
                <section
                  className="booking-closed-section"
                  aria-labelledby="booking-closed-title"
                >
                  <h2 id="booking-closed-title">Other requests</h2>
                  <div className="booking-closed-list" role="list">
                    {closedRecords.map((record) => (
                      <CurrentBookingRow
                        key={record.booking.id}
                        record={record}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {records.length === 0 ? <BookingEmpty /> : null}
            </>
          )}
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function composeBookingRecord(
  booking: CustomerBooking,
  vehicles: CustomerVehicle[],
  dashboardRequirements:
    CustomerDashboardResponse["requirements"][number] | undefined,
  payment: CustomerPayment | null,
): BookingRecord {
  const requirements: RequirementsResponse = {
    requirementSet: dashboardRequirements?.requirementSet ?? null,
    documents: [],
    review: dashboardRequirements?.review ?? null,
    requiredTypes: [],
  };
  const composition: CustomerBookingComposition = {
    booking,
    requirements,
    payment,
    paymentMethods: [],
    requirementsAvailable: true,
    paymentAvailable: true,
    requirementsError: null,
    paymentError: null,
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

function groupBookings(records: BookingRecord[]) {
  const byPickup = (left: BookingRecord, right: BookingRecord) =>
    new Date(left.booking.pickup_at).getTime() -
    new Date(right.booking.pickup_at).getTime();
  const active = records
    .filter(
      (record) =>
        !["returned", "rejected", "cancelled"].includes(record.lifecycle.state),
    )
    .sort((left, right) => {
      if (left.lifecycle.actionRequired !== right.lifecycle.actionRequired)
        return left.lifecycle.actionRequired ? -1 : 1;
      return byPickup(left, right);
    });
  const pastRentalRecords = records
    .filter((record) => record.lifecycle.state === "returned")
    .sort((left, right) => byPickup(right, left));
  const closedRecords = records
    .filter((record) =>
      ["rejected", "cancelled"].includes(record.lifecycle.state),
    )
    .sort((left, right) => byPickup(right, left));

  return {
    featuredRecord: active[0] ?? null,
    remainingActiveRecords: active.slice(1),
    pastRentalRecords,
    closedRecords,
  };
}

function BookingDossier({ record }: { record: BookingRecord }) {
  const { booking, lifecycle, vehicle } = record;
  const actionLabel = lifecycle.actionLabel ?? defaultActionLabel(lifecycle);
  const vehicleName =
    vehicle?.name ??
    (booking.rental
      ? "Vehicle details unavailable"
      : (booking.requested_vehicle?.name ?? "Vehicle not recorded"));
  const location = bookingLocation(booking);
  const journey = lifecycle.journey;

  return (
    <article className="booking-dossier">
      <div className="booking-dossier-image">
        <VehicleImage
          src={vehicle?.image_url}
          alt={vehicleName}
          sizes="(max-width: 767px) 100vw, 50vw"
        />
      </div>
      <div className="booking-dossier-content">
        <div className={`booking-dossier-status is-${lifecycle.statusTone}`}>
          <Clock3 size={21} aria-hidden="true" />
          <div>
            <strong>{lifecycle.statusLabel}</strong>
            <p>{lifecycle.reason ?? lifecycle.message}</p>
          </div>
        </div>
        <h3>{vehicleName}</h3>
        <p className="booking-display-reference" title={booking.id}>
          Booking {bookingReference(booking.id)}
        </p>
        <div className="booking-dossier-facts">
          <p>
            <CalendarDays size={18} aria-hidden="true" />
            {formatDateRange(booking.pickup_at, booking.return_at)}
          </p>
          <p>
            <MapPin size={18} aria-hidden="true" />
            {location}
          </p>
        </div>
        <ol className="booking-dossier-journey" aria-label="Rental journey">
          {journey.map((step) => (
            <li className={`is-${step.state}`} key={step.key}>
              <span aria-hidden="true">
                {step.state === "complete" ? <CheckCircle2 size={15} /> : null}
              </span>
              <strong>{step.label}</strong>
              {step.note ? <small>{step.note}</small> : null}
            </li>
          ))}
        </ol>
        <Link
          className="customer-primary-button"
          to="/bookings/$bookingId"
          params={{ bookingId: booking.id }}
        >
          {actionLabel}
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function CurrentBookingRow({ record }: { record: BookingRecord }) {
  const { booking, lifecycle, vehicle } = record;
  const StatusIcon = lifecycle.actionRequired
    ? AlertCircle
    : lifecycle.statusTone === "success"
      ? CheckCircle2
      : lifecycle.statusTone === "error"
        ? XCircle
        : Clock3;
  const vehicleName =
    vehicle?.name ?? booking.requested_vehicle?.name ?? "Vehicle not recorded";
  return (
    <article className="booking-current-row" role="listitem">
      <div className="booking-current-row-image">
        <VehicleImage src={vehicle?.image_url} alt={vehicleName} sizes="8rem" />
      </div>
      <div>
        <h3>{vehicleName}</h3>
        <p className="booking-display-reference" title={booking.id}>
          Booking {bookingReference(booking.id)}
        </p>
        <p>{formatDateRange(booking.pickup_at, booking.return_at)}</p>
      </div>
      <div className={`booking-current-row-status is-${lifecycle.statusTone}`}>
        <span className="booking-current-row-status-icon" aria-hidden="true">
          <StatusIcon size={16} strokeWidth={2} />
        </span>
        <div>
          <strong>{lifecycle.statusLabel}</strong>
          <span>
            {lifecycle.actionRequired ? "Action needed" : "In progress"}
          </span>
        </div>
      </div>
      <Link to="/bookings/$bookingId" params={{ bookingId: booking.id }}>
        View rental <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

function ArchiveBookingRow({ record }: { record: BookingRecord }) {
  const { booking, vehicle } = record;
  const vehicleName =
    vehicle?.name ?? booking.requested_vehicle?.name ?? "Vehicle not recorded";
  return (
    <article className="booking-archive-row" role="listitem">
      <div className="booking-archive-date">
        <strong>{formatDateRange(booking.pickup_at, booking.return_at)}</strong>
      </div>
      <div className="booking-archive-car">
        <VehicleImage src={vehicle?.image_url} alt={vehicleName} sizes="7rem" />
        <div>
          <h3>{vehicleName}</h3>
          <p className="booking-display-reference" title={booking.id}>
            Booking {bookingReference(booking.id)}
          </p>
          <p>{bookingLocation(booking)}</p>
        </div>
      </div>
      <span className="booking-archive-status">Completed</span>
      <Link
        to="/bookings/$bookingId"
        params={{ bookingId: booking.id }}
        aria-label={`View ${vehicleName} rental details`}
      >
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </article>
  );
}

function bookingLocation(booking: CustomerBooking) {
  const pickup = booking.pickup_branch?.name ?? booking.pickup_location;
  const label =
    booking.pickup_delivery_option === "delivery" ? "Delivery" : "Pickup";
  return pickup ? `${label}: ${pickup}` : `${label} details will appear here`;
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
    <div className="booking-list-skeleton" role="status" aria-live="polite">
      <span className="sr-only">Loading your rentals…</span>
      <div className="booking-list-skeleton__heading" aria-hidden="true">
        <i />
        <i />
      </div>
      <section className="booking-list-skeleton__featured" aria-hidden="true">
        <i />
        <div>
          <i />
          <i />
          <i />
          <div className="booking-list-skeleton__journey">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <i />
        </div>
      </section>
      <div className="booking-list-skeleton__rows" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

function BookingEmpty() {
  return (
    <div className="booking-empty">
      <FileCheck2 size={28} aria-hidden="true" />
      <h3>No bookings yet</h3>
      <p>
        When you send a rental request, its requirements, payment, and rental
        stages will appear here.
      </p>
      <Link className="customer-secondary-button" to="/vehicles">
        Find a car
      </Link>
    </div>
  );
}
