import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CarFront,
  Camera,
  CheckCircle2,
  CreditCard,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  IdCard,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
  ErrorSummary,
  FieldError,
  FileTarget,
  LifecycleJourney,
  Rate,
  StatusCallout,
  VehicleFacts,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ApiRequestError,
  encodeSearch,
  fetchJson,
  fileSizeLabel,
  formatDateRange,
  formatInstant,
  humanizeRequirementType,
  type CustomerBooking,
  type CustomerRequirementReview,
  type CustomerVehicle,
  type RequirementDocument,
  type RequirementsResponse,
} from "@/lib/customer-data";
import {
  deriveCustomerLifecycle,
  paymentForBooking,
  type CustomerBookingComposition,
  type LifecyclePresentation,
} from "@/lib/customer-lifecycle";
import type {
  CustomerPayment,
  CustomerPaymentMethod,
  CustomerPaymentResponse,
} from "@/lib/payment-retrieval";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/bookings/$bookingId")({
  head: () => ({
    meta: [
      { title: "Booking details | Briah's Car Rental" },
      {
        name: "description",
        content:
          "Review the requirements, payment, confirmation, rental, and return stages for one rental request.",
      },
    ],
  }),
  component: BookingDetailPage,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
const REQUIREMENTS_TASKS = [
  "Upload and preview documents",
  "Send for verification",
] as const;

const REQUIREMENT_PRESENTATION: Record<
  string,
  { description: string; Icon: LucideIcon }
> = {
  "Valid Government ID": {
    description: "Passport, UMID, PhilSys ID, or another valid government ID.",
    Icon: IdCard,
  },
  "Driver's License": {
    description:
      "Include the front and back of your current license in one file.",
    Icon: CarFront,
  },
  "Proof of Billing": {
    description:
      "A utility bill or bank statement issued within the last 3 months.",
    Icon: FileText,
  },
  "Selfie with ID": {
    description: "A clear photo of you holding the government ID you uploaded.",
    Icon: Camera,
  },
};

type BookingPageData = {
  composition: CustomerBookingComposition;
  vehicle: CustomerVehicle | null;
  vehicleError: string | null;
};

type BookingLoadingVariant = "detail" | "payment-waiting" | "resolution";

function BookingDetailPage() {
  const { bookingId } = Route.useParams();
  const [pageData, setPageData] = useState<BookingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingVariant, setLoadingVariant] = useState<BookingLoadingVariant>(
    () =>
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(`booking-loading-variant:${bookingId}`) ===
        "payment-waiting"
        ? "payment-waiting"
        : "detail",
  );
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const loadBooking = useCallback(
    async ({ preserveView = false }: { preserveView?: boolean } = {}) => {
      if (!preserveView) {
        setLoading(true);
        setLoadingVariant(
          window.sessionStorage.getItem(
            `booking-loading-variant:${bookingId}`,
          ) === "payment-waiting"
            ? "payment-waiting"
            : "detail",
        );
      }
      setError("");
      setNotFound(false);

      try {
        const session = await getSession();
        if (!session.ok || session.data.principal.role !== "Customer/Renter") {
          if (session.ok && session.data.principal.role !== "Customer/Renter") {
            window.location.assign("/admin");
          } else {
            window.location.assign(
              `/sign-in${encodeSearch({ returnTo: `/bookings/${bookingId}` })}`,
            );
          }
          return;
        }

        const bookings = await fetchJson<CustomerBooking[]>("/api/bookings");
        const booking = bookings.find(
          (candidate) => candidate.id === bookingId,
        );
        if (!booking) {
          setPageData(null);
          setNotFound(true);
          return;
        }
        if (booking.confirmation_exception_message?.trim())
          setLoadingVariant("resolution");

        const [requirementsResult, paymentResult, vehiclesResult] =
          await Promise.allSettled([
            fetchJson<RequirementsResponse>(
              `/api/requirements?bookingId=${encodeURIComponent(bookingId)}`,
            ),
            fetchJson<CustomerPaymentResponse>(
              `/api/payments?bookingId=${encodeURIComponent(bookingId)}`,
            ),
            fetchJson<CustomerVehicle[]>("/api/vehicles"),
          ]);

        const requirementsAvailable = requirementsResult.status === "fulfilled";
        const paymentAvailable = paymentResult.status === "fulfilled";
        const vehiclesAvailable = vehiclesResult.status === "fulfilled";
        const requirements = requirementsAvailable
          ? requirementsResult.value
          : null;
        const requirementMatchesBooking =
          !requirements?.requirementSet ||
          requirements.requirementSet.booking_id === bookingId;
        const paymentResponse = paymentAvailable ? paymentResult.value : null;
        const payment = paymentResponse
          ? paymentForBooking(bookingId, paymentResponse.payments)
          : null;
        const composition: CustomerBookingComposition = {
          booking,
          requirements: requirementMatchesBooking ? requirements : null,
          payment,
          paymentMethods: paymentResponse?.paymentMethods ?? [],
          requirementsAvailable:
            requirementsAvailable && requirementMatchesBooking,
          paymentAvailable,
          requirementsError:
            requirementsAvailable && requirementMatchesBooking
              ? null
              : requirementsAvailable
                ? "Requirements could not be matched to this booking."
                : errorFromResult(
                    requirementsResult.reason,
                    "Requirements status is unavailable.",
                  ),
          paymentError: paymentAvailable
            ? null
            : errorFromResult(
                paymentResult.reason,
                "Payment status is unavailable.",
              ),
        };
        const vehicles = vehiclesAvailable ? vehiclesResult.value : [];
        setPageData({
          composition,
          vehicle: vehicleForBooking(booking, vehicles),
          vehicleError: vehiclesAvailable
            ? null
            : errorFromResult(
                vehiclesResult.reason,
                "Vehicle details are unavailable right now.",
              ),
        });
      } catch (requestError) {
        if (
          requestError instanceof ApiRequestError &&
          (requestError.status === 401 || requestError.status === 403)
        ) {
          window.location.assign(
            `/sign-in${encodeSearch({ returnTo: `/bookings/${bookingId}` })}`,
          );
          return;
        }
        setError(
          requestError instanceof ApiRequestError
            ? requestError.message
            : "Booking details cannot be loaded right now.",
        );
      } finally {
        if (!preserveView) setLoading(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  useEffect(() => {
    if (!pageData) return;
    const lifecycle = deriveCustomerLifecycle(pageData.composition);
    window.sessionStorage.setItem(
      `booking-loading-variant:${bookingId}`,
      lifecycle.state === "payment-waiting" ? "payment-waiting" : "detail",
    );
  }, [bookingId, pageData]);

  if (loading) {
    return <BookingDetailSkeleton variant={loadingVariant} />;
  }

  if (error) {
    return (
      <CustomerPage>
        <Header />
        <main id="main-content" className="booking-detail-main">
          <div className="customer-container">
            <StatusCallout
              tone="error"
              title="Booking details unavailable"
              action={
                <button
                  className="customer-secondary-button"
                  type="button"
                  onClick={() => void loadBooking()}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Try again
                </button>
              }
            >
              {error}
            </StatusCallout>
          </div>
        </main>
      </CustomerPage>
    );
  }

  if (notFound || !pageData) {
    return (
      <CustomerPage>
        <Header />
        <main id="main-content" className="booking-detail-main">
          <div className="customer-container booking-not-found">
            <StatusCallout tone="info" title="Request not found">
              This rental request is not available in your customer account. No
              booking, requirement, or payment details were opened.
            </StatusCallout>
            <Link className="customer-secondary-button" to="/customer">
              <ArrowRight size={16} aria-hidden="true" />
              Back to My Bookings
            </Link>
          </div>
        </main>
      </CustomerPage>
    );
  }

  const { composition, vehicle, vehicleError } = pageData;
  const lifecycle = deriveCustomerLifecycle(composition);
  const booking = composition.booking;
  const isRequirementsStage = [
    "requirements-needed",
    "requirements-review",
    "requirements-resubmission",
  ].includes(lifecycle.state);
  const isPaymentStage = [
    "payment-action",
    "payment-review",
    "payment-resubmission",
  ].includes(lifecycle.state);
  const isPaymentWaiting = lifecycle.state === "payment-waiting";
  const isActiveRental = lifecycle.state === "active-rental";
  const isReturnedRental = lifecycle.state === "returned";
  const canManageRequest = lifecycle.state === "requirements-needed";
  const compositionErrors = [
    composition.requirementsError,
    composition.paymentError,
  ].filter((message): message is string => Boolean(message));

  return (
    <CustomerPage
      className={`booking-detail-page${isRequirementsStage ? " booking-detail-page--requirements" : ""}${isPaymentStage || isPaymentWaiting ? " booking-detail-page--payment" : ""}${lifecycle.state === "confirmed" ? " booking-detail-page--confirmed" : ""}${isActiveRental ? " booking-detail-page--active" : ""}${isReturnedRental ? " booking-detail-page--returned" : ""}${lifecycle.state === "confirmation-resolution" ? " booking-detail-page--resolution" : ""}`}
    >
      <Header />
      <LifecycleJourney steps={lifecycle.journey} />
      <main id="main-content" className="booking-detail-main">
        <div className="customer-container">
          {!isPaymentWaiting &&
          !isActiveRental &&
          !isReturnedRental &&
          lifecycle.state !== "confirmed" &&
          lifecycle.state !== "confirmation-resolution" ? (
            <div className="booking-detail-breadcrumb">
              <Link to="/customer">My Bookings</Link>
              <span aria-hidden="true">/</span>
              <span>
                {vehicle?.name ??
                  booking.requested_vehicle?.name ??
                  "Booking details"}
              </span>
            </div>
          ) : null}

          {!isPaymentWaiting && !isActiveRental && !isReturnedRental ? <div className="booking-detail-heading">
            <div>
              {lifecycle.state !== "confirmed" &&
              lifecycle.state !== "confirmation-resolution" ? (
                <p className="booking-detail-eyebrow">Your rental request</p>
              ) : null}
              <h1>{lifecycle.title}</h1>
              {lifecycle.state === "confirmed" ? (
                <p className="booking-detail-confirmation-message">
                  Thank you for choosing Briah&apos;s Car Rental. We&apos;ve
                  sent a confirmation to your email with all the booking
                  details.
                </p>
              ) : null}
            </div>
            {lifecycle.state === "confirmed" ? (
              <div className="booking-confirmation-mark">
                <span aria-hidden="true">
                  <CheckCircle2 size={28} strokeWidth={1.8} />
                </span>
                <strong>Booking Confirmed</strong>
                <small>Reference #{booking.id.slice(0, 8).toUpperCase()}</small>
              </div>
            ) : lifecycle.state === "confirmation-resolution" ? null : (
              <p className={`booking-detail-stage is-${lifecycle.statusTone}`}>
                {lifecycle.statusLabel}
              </p>
            )}
          </div> : null}

          {compositionErrors.length > 0 ? (
            <StatusCallout
              tone={lifecycle.state === "unavailable" ? "error" : "info"}
              title="Some booking details are unavailable"
              action={
                <button
                  className="customer-secondary-button"
                  type="button"
                  onClick={() => void loadBooking()}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Refresh details
                </button>
              }
            >
              {compositionErrors.join(" ")}
            </StatusCallout>
          ) : null}

          {vehicleError ? (
            <p className="booking-detail-optional-data" role="status">
              Vehicle photo and specifications are unavailable right now. The
              booking record remains available below.
            </p>
          ) : null}

          <div className="booking-detail-layout">
            <div className="booking-detail-primary">
              {!isRequirementsStage &&
              !isPaymentStage &&
              !isPaymentWaiting &&
              !isActiveRental &&
              !isReturnedRental &&
              lifecycle.state !== "confirmed" &&
              lifecycle.state !== "confirmation-resolution" ? (
                <BookingStatusBand
                  booking={booking}
                  lifecycle={lifecycle}
                  vehicle={vehicle}
                />
              ) : null}
              <BookingStateContent
                booking={booking}
                composition={composition}
                lifecycle={lifecycle}
                vehicle={vehicle}
                onRefresh={() => loadBooking({ preserveView: true })}
              />
            </div>
            <BookingSummary
              booking={booking}
              lifecycle={lifecycle}
              vehicle={vehicle}
              onWithdrawn={loadBooking}
              showRequestManagement={canManageRequest}
            />
          </div>
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function BookingDetailSkeleton({
  variant = "detail",
}: {
  variant?: BookingLoadingVariant;
}) {
  if (variant === "resolution") {
    return <BookingResolutionSkeleton />;
  }
  if (variant === "payment-waiting") {
    return <PaymentAwaitingSkeleton />;
  }

  return (
    <CustomerPage className="booking-detail-page booking-detail-page--confirmed">
      <Header />
      <section
        className="booking-requirements-skeleton-journey"
        aria-hidden="true"
      >
        <div className="customer-container booking-requirements-skeleton-journey__inner">
          <i />
          <div>
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>
      <main id="main-content" className="booking-detail-main">
        <div className="customer-container">
          <div
            className="booking-detail-skeleton"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Loading booking details…</span>
            <div
              className="booking-detail-skeleton__primary"
              aria-hidden="true"
            >
              <i className="booking-detail-skeleton__title" />
              <i className="booking-detail-skeleton__copy" />
              {[1, 2].map((moment) => (
                <section
                  className="booking-detail-skeleton__moment"
                  key={moment}
                >
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                </section>
              ))}
              <section className="booking-detail-skeleton__next">
                <i />
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </section>
            </div>
            <aside
              className="booking-detail-skeleton__summary"
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
              <i />
              <i />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function PaymentAwaitingSkeleton() {
  return (
    <CustomerPage className="booking-detail-page booking-detail-page--payment">
      <Header />
      <section
        className="booking-requirements-skeleton-journey"
        aria-hidden="true"
      >
        <div className="customer-container booking-requirements-skeleton-journey__inner">
          <i />
          <div>
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>
      <main id="main-content" className="booking-detail-main">
        <div className="customer-container">
          <div className="booking-payment-awaiting-skeleton" role="status" aria-live="polite">
            <span className="sr-only">Loading payment details…</span>
            <div className="booking-payment-awaiting-skeleton__primary" aria-hidden="true">
              <i className="booking-payment-awaiting-skeleton__title" />
              <i className="booking-payment-awaiting-skeleton__copy" />
              <section className="booking-payment-awaiting-skeleton__handoff">
                {[1, 2, 3].map((step) => (
                  <div key={step}>
                    <i />
                    <i />
                    {step === 2 ? <i /> : null}
                  </div>
                ))}
              </section>
              <section className="booking-payment-awaiting-skeleton__trip">
                <i />
                <div>
                  <section><i /><div><i /><i /><i /></div></section>
                  <section><i /><div><i /><i /></div></section>
                </div>
              </section>
            </div>
            <aside className="booking-payment-awaiting-skeleton__summary" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function BookingResolutionSkeleton() {
  return (
    <CustomerPage className="booking-detail-page booking-detail-page--resolution">
      <Header />
      <section
        className="booking-requirements-skeleton-journey"
        aria-hidden="true"
      >
        <div className="customer-container booking-requirements-skeleton-journey__inner">
          <i />
          <div>
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>
      <main id="main-content" className="booking-detail-main">
        <div className="customer-container">
          <div
            className="booking-resolution-skeleton"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Loading booking resolution details…</span>
            <div
              className="booking-resolution-skeleton__primary"
              aria-hidden="true"
            >
              <i className="booking-resolution-skeleton__title" />
              <section className="booking-resolution-skeleton__reassurance">
                <article>
                  <i />
                  <i />
                  <i />
                </article>
                <article>
                  <i />
                  <i />
                  <i />
                </article>
                <article>
                  <i />
                  <i />
                  <i />
                </article>
              </section>
              <div className="booking-resolution-skeleton__summary-copy">
                <i />
                <i />
                <i />
              </div>
              <dl className="booking-resolution-skeleton__facts">
                {[1, 2, 3, 4].map((fact) => (
                  <div key={fact}>
                    <i />
                    <i />
                    {fact === 1 || fact === 4 ? <i /> : null}
                  </div>
                ))}
              </dl>
              <i className="booking-resolution-skeleton__contact" />
            </div>
            <aside
              className="booking-resolution-skeleton__vehicle"
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
              <i />
              <div>
                <i />
                <i />
                <i />
                <i />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function BookingStatusBand({
  booking,
  lifecycle,
  vehicle,
}: {
  booking: CustomerBooking;
  lifecycle: LifecyclePresentation;
  vehicle: CustomerVehicle | null;
}) {
  const assignedVehicleName = booking.assigned_vehicle
    ? vehicle?.id === booking.assigned_vehicle.id
      ? vehicle.name
      : booking.assigned_vehicle.name
    : null;
  const rentalVehicleName =
    booking.rental && vehicle?.id === booking.rental.vehicle_id
      ? vehicle.name
      : null;
  const vehicleName = booking.rental
    ? (rentalVehicleName ?? "Your vehicle")
    : (assignedVehicleName ??
      vehicle?.name ??
      booking.requested_vehicle?.name ??
      "Your vehicle");
  if (lifecycle.state === "unavailable") {
    return (
      <StatusCallout tone="error" title="Action cannot be determined">
        Refresh the booking details before taking any requirements or payment
        action.
      </StatusCallout>
    );
  }
  if (lifecycle.actionRequired) {
    return (
      <StatusCallout tone="warning" title="Action required">
        <p>{lifecycle.message}</p>
        {lifecycle.reason ? (
          <p className="booking-status-reason">
            <strong>Reason from Briah:</strong> {lifecycle.reason}
          </p>
        ) : null}
      </StatusCallout>
    );
  }
  if (lifecycle.state === "payment-review") {
    return (
      <StatusCallout
        tone="info"
        title="No action needed — payment is under review."
      >
        Briah is checking the payment details and proof you submitted. We’ll
        update this booking if anything needs to be corrected.
      </StatusCallout>
    );
  }
  if (lifecycle.state === "requirements-review") {
    return (
      <StatusCallout
        tone="info"
        title="No action needed — requirements are under review."
      >
        Briah is reviewing your submitted documents. Payment remains locked
        until requirements are verified.
      </StatusCallout>
    );
  }
  if (lifecycle.state === "confirmed") {
    return (
      <StatusCallout
        tone="success"
        title={
          assignedVehicleName
            ? `${assignedVehicleName} is assigned to your booking.`
            : "Your booking is confirmed."
        }
      >
        Review your scheduled pickup details below. No action needed right now.
      </StatusCallout>
    );
  }
  if (lifecycle.state === "active-rental") {
    return (
      <StatusCallout
        tone="success"
        title={`${vehicleName} was released for your trip.`}
      >
        Keep the scheduled return time in view.
      </StatusCallout>
    );
  }
  if (lifecycle.state === "returned") {
    return (
      <StatusCallout tone="success" title={`${vehicleName} was returned.`}>
        {lifecycle.message}
      </StatusCallout>
    );
  }
  if (lifecycle.state === "rejected" || lifecycle.state === "cancelled") {
    return (
      <StatusCallout
        tone={lifecycle.state === "rejected" ? "error" : "info"}
        title={lifecycle.statusLabel}
      >
        {lifecycle.message}
        {lifecycle.reason ? (
          <p className="booking-status-reason">
            <strong>Reason:</strong> {lifecycle.reason}
          </p>
        ) : null}
      </StatusCallout>
    );
  }
  return null;
}

function BookingStateContent({
  booking,
  composition,
  lifecycle,
  vehicle,
  onRefresh,
}: {
  booking: CustomerBooking;
  composition: CustomerBookingComposition;
  lifecycle: LifecyclePresentation;
  vehicle: CustomerVehicle | null;
  onRefresh: () => Promise<void>;
}) {
  switch (lifecycle.state) {
    case "requirements-needed":
    case "requirements-resubmission":
      return (
        <RequirementsPanel
          bookingId={booking.id}
          requirements={composition.requirements}
          state={lifecycle.state}
          onRefresh={onRefresh}
        />
      );
    case "requirements-review":
      return <RequirementsOverview requirements={composition.requirements} />;
    case "payment-action":
    case "payment-resubmission":
      return (
        <PaymentSubmission
          bookingId={booking.id}
          payment={composition.payment}
          methods={composition.paymentMethods}
          state={lifecycle.state}
          onRefresh={onRefresh}
        />
      );
    case "payment-waiting":
      return <PaymentAwaitingAmount booking={booking} />;
    case "payment-review":
      return <PaymentUnderReview payment={composition.payment} />;
    case "confirmation-resolution":
      return (
        <BookingResolution
          booking={booking}
          payment={composition.payment}
          vehicle={vehicle}
        />
      );
    case "confirmed":
      return <ConfirmedBooking booking={booking} vehicle={vehicle} />;
    case "active-rental":
      return <ActiveRental booking={booking} vehicle={vehicle} />;
    case "returned":
      return <ReturnedRental booking={booking} vehicle={vehicle} />;
    case "rejected":
    case "cancelled":
      return <BookingFactsSection booking={booking} vehicle={vehicle} />;
    case "unavailable":
      return (
        <StatusCallout tone="error" title="Booking details need a refresh">
          The exact requirement or payment record could not be composed safely.
          No action was enabled.
        </StatusCallout>
      );
  }
}

function WithdrawBookingAction({
  bookingId,
  onWithdrawn,
}: {
  bookingId: string;
  onWithdrawn: () => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function withdraw() {
    if (!reason.trim()) return;
    setSaving(true);
    setError("");
    try {
      await fetchJson<{ booking: CustomerBooking }>("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "withdraw",
          bookingId,
          resolutionReason: reason.trim(),
        }),
      });
      await onWithdrawn();
      setOpen(false);
    } catch (requestError) {
      setError(
        errorFromResult(requestError, "Unable to withdraw this request."),
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <details
      className="booking-withdrawal"
      aria-labelledby="withdraw-request-title"
    >
      <summary id="withdraw-request-title">Need to change your plans?</summary>
      <div className="booking-withdrawal__content">
        <p>
          Withdraw this unfinished request. Your reason is saved with the
          request history.
        </p>
        <label htmlFor="withdrawal-reason">Reason for withdrawal</label>
        <input
          id="withdrawal-reason"
          className="customer-input"
          value={reason}
          maxLength={500}
          disabled={saving}
          autoComplete="off"
          onChange={(event) => setReason(event.target.value)}
          placeholder="Tell us why…"
        />
        {error ? (
          <p className="booking-withdrawal__error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="customer-secondary-button booking-withdrawal__button"
          disabled={saving || !reason.trim()}
          onClick={() => setOpen(true)}
        >
          Withdraw request
        </button>
      </div>
      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw this rental request?</DialogTitle>
            <DialogDescription>
              This will stop the unfinished request. It cannot be restored from
              the customer portal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="customer-secondary-button"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Keep request
            </button>
            <button
              type="button"
              className="customer-primary-button"
              disabled={saving}
              onClick={() => void withdraw()}
            >
              {saving ? "Withdrawing…" : "Withdraw request"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </details>
  );
}

function BookingSummary({
  booking,
  lifecycle,
  vehicle,
  onWithdrawn,
  showRequestManagement,
}: {
  booking: CustomerBooking;
  lifecycle: LifecyclePresentation;
  vehicle: CustomerVehicle | null;
  onWithdrawn: () => Promise<void>;
  showRequestManagement: boolean;
}) {
  const vehicleName = booking.rental
    ? (vehicle?.name ?? "Vehicle details unavailable")
    : (vehicle?.name ??
      booking.requested_vehicle?.name ??
      "Vehicle not recorded");
  const summaryVehicle = vehicle ?? fallbackVehicle(booking);
  return (
    <aside className="booking-summary" aria-labelledby="booking-summary-title">
      <h2 id="booking-summary-title">
        {lifecycle.state === "confirmed" ||
        lifecycle.state === "active-rental" ||
        lifecycle.state === "returned"
          ? "Your booking"
          : "Your rental request"}
      </h2>
      <div className="booking-summary-image">
        <VehicleImage
          src={vehicle?.image_url}
          alt={vehicleName}
          priority
          sizes="(max-width: 900px) 100vw, 28rem"
        />
      </div>
      <div>
        <p className="booking-summary-category">
          {vehicle?.category?.name ?? "Vehicle"}
        </p>
        <h3>{vehicleName}</h3>
        <Rate
          value={summaryVehicle?.daily_rate}
          className="booking-summary-rate"
        />
        {booking.assigned_vehicle ? (
          <p className="booking-summary-assignment">Assigned vehicle</p>
        ) : null}
      </div>
      <VehicleFacts
        vehicle={
          summaryVehicle ?? {
            seat_capacity: null,
            transmission: null,
            fuel_type: null,
            branch: booking.pickup_branch,
          }
        }
        showBranch={false}
      />
      {lifecycle.state !== "confirmed" ? (
        <dl className="booking-summary-facts">
          <div>
            <dt>Delivery</dt>
            <dd>
              {formatInstant(booking.pickup_at)}
              <small>
                {booking.pickup_location ??
                  booking.pickup_branch?.name ??
                  "Not recorded"}
              </small>
            </dd>
          </div>
          <div>
            <dt>Return</dt>
            <dd>
              {formatInstant(booking.return_at)}
              <small>
                {booking.dropoff_location ??
                  booking.return_branch?.name ??
                  "Not recorded"}
              </small>
            </dd>
          </div>
        </dl>
      ) : null}
      {showRequestManagement && booking.requested_vehicle ? (
        <Link
          className="customer-link booking-summary-link"
          to="/booking"
          search={{
            editBooking: booking.id,
            vehicle: booking.requested_vehicle.id,
            finderStart: booking.pickup_at,
            finderEnd: booking.return_at,
          }}
        >
          Need to update your request?{" "}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      ) : null}
      {showRequestManagement ? (
        <WithdrawBookingAction
          bookingId={booking.id}
          onWithdrawn={onWithdrawn}
        />
      ) : null}
    </aside>
  );
}

function RequirementsPanel({
  bookingId,
  requirements,
  state,
  onRefresh,
}: {
  bookingId: string;
  requirements: RequirementsResponse | null;
  state: "requirements-needed" | "requirements-resubmission";
  onRefresh: () => Promise<void>;
}) {
  const [uploadingType, setUploadingType] = useState("");
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replacedTypes, setReplacedTypes] = useState<Record<string, boolean>>(
    {},
  );
  const [recentlyUploadedType, setRecentlyUploadedType] = useState("");
  const status = requirements?.requirementSet?.status ?? "Not Submitted";
  const requiredTypes = requirements?.requiredTypes ?? [];
  const documents = requirements?.documents ?? [];
  const flaggedTypes = requiredTypes.filter(
    (type) =>
      reviewFor(requirements?.review, type)?.outcome === "Needs Replacement",
  );
  const allDocumentsPresent =
    requiredTypes.length > 0 &&
    requiredTypes.every((type) => currentDocument(documents, type));
  const resubmissionReady =
    flaggedTypes.length > 0 &&
    flaggedTypes.every((type) => replacedTypes[type]);

  async function uploadDocument(
    type: string,
    file: File | undefined,
    input: HTMLInputElement,
  ) {
    input.value = "";
    if (!file) return;
    const clientError = validateFile(file);
    if (clientError) {
      setUploadErrors((current) => ({ ...current, [type]: clientError }));
      return;
    }
    setUploadErrors((current) => ({ ...current, [type]: "" }));
    setUploadingType(type);
    const form = new FormData();
    form.append("bookingId", bookingId);
    form.append("requirementType", type);
    form.append("file", file);
    try {
      await fetchJson("/api/requirements", { method: "POST", body: form });
      setReplacedTypes((current) => ({ ...current, [type]: true }));
      await onRefresh();
      setRecentlyUploadedType(type);
      window.setTimeout(() => setRecentlyUploadedType(""), 360);
    } catch (requestError) {
      setUploadErrors((current) => ({
        ...current,
        [type]: errorFromResult(
          requestError,
          "The document could not be uploaded.",
        ),
      }));
    } finally {
      setUploadingType("");
    }
  }

  async function submitRequirements(action: "submit" | "resubmit") {
    setSubmitting(true);
    setSubmitError("");
    const form = new FormData();
    form.append("bookingId", bookingId);
    form.append("action", action);
    try {
      await fetchJson("/api/requirements", { method: "POST", body: form });
      setReplacedTypes({});
      await onRefresh();
    } catch (requestError) {
      setSubmitError(
        errorFromResult(
          requestError,
          "Requirements could not be sent for verification.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`booking-detail-section booking-requirements${
        state === "requirements-resubmission"
          ? " booking-requirements--review booking-requirements--resubmission"
          : ""
      }`}
      aria-labelledby="requirements-title"
    >
      <p className="booking-requirements-intro" id="requirements-title">
        {state === "requirements-resubmission"
          ? "We reviewed your documents and flagged the files that need an update. Replace only the flagged documents, then send them back for verification."
          : "To confirm your booking, upload each required document. We’ll review them and notify you once they’re approved."}
      </p>

      {state !== "requirements-resubmission" ? (
        <aside
          className="booking-requirements-guide"
          aria-labelledby="requirements-guide-title"
        >
          <div className="booking-requirements-guide__section">
            <h2 id="requirements-guide-title">Have ready</h2>
            <ul>
              <li>
                <CheckCircle2 aria-hidden="true" />
                Clear, original documents, not screenshots
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                Every detail readable and not cropped
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                JPEG, PNG, or PDF files up to 10 MiB each
              </li>
            </ul>
          </div>
          <div className="booking-requirements-guide__section">
            <h2>How to photograph it</h2>
            <ul>
              <li>
                <CheckCircle2 aria-hidden="true" />
                Use good lighting, ideally natural light
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                Place the document on a flat, clean surface
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                Keep all four corners visible in the frame
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                Make sure the photo is sharp and in focus
              </li>
            </ul>
          </div>
        </aside>
      ) : null}

      {requiredTypes.length === 0 ? (
        <StatusCallout tone="error" title="Required document types unavailable">
          The requirements service did not return its canonical document types.
          Try again before uploading anything.
        </StatusCallout>
      ) : (
        <div className="booking-requirement-list booking-requirement-grid">
          {requiredTypes.map((type) => {
            const document = currentDocument(documents, type);
            const review = reviewFor(requirements?.review, type);
            const flagged = review?.outcome === "Needs Replacement";
            const presentation = REQUIREMENT_PRESENTATION[type] ?? {
              description: "Upload a clear, current file for this requirement.",
              Icon: FileCheck2,
            };
            const RequirementIcon = presentation.Icon;
            const editable =
              status === "Not Submitted" ||
              (status === "Needs Resubmission" && flagged);
            return (
              <article
                className={`booking-requirement-row${recentlyUploadedType === type ? " booking-requirement-row--just-uploaded" : ""}`}
                key={type}
              >
                <div className="booking-requirement-copy">
                  <RequirementIcon size={28} aria-hidden="true" />
                  <div>
                    <h3>{humanizeRequirementType(type)}</h3>
                    <p>{presentation.description}</p>
                    {flagged ? (
                      <p className="booking-correction-reason">
                        <strong>Correction needed:</strong>{" "}
                        {review?.reason ||
                          "Replace this document before resubmitting."}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="booking-requirement-action">
                  {document ? (
                    <>
                      <RequirementDocumentPreview document={document} />
                      <p className="booking-requirement-file">
                        {document.original_filename} ·{" "}
                        {fileSizeLabel(document.size_bytes)}
                      </p>
                    </>
                  ) : null}
                  {editable ? (
                    <FileTarget
                      id={`booking-file-${type.replaceAll(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`}
                      name={`requirement-${type.replaceAll(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`}
                      label={
                        uploadingType === type
                          ? "Uploading…"
                          : document
                            ? "Replace document"
                            : "Choose a file"
                      }
                      disabled={Boolean(uploadingType)}
                      onChange={(file, input) =>
                        void uploadDocument(type, file, input)
                      }
                    />
                  ) : document ? (
                    <span className="booking-requirement-review-status">
                      <CheckCircle2 size={14} aria-hidden="true" />
                      {review?.outcome === "Accepted" ? "Approved" : "Received"}
                    </span>
                  ) : null}
                  <FieldError
                    id={`booking-file-${type}`}
                    message={uploadErrors[type]}
                  />
                  <small className="booking-requirement-format">
                    JPEG, PNG, or PDF · Max 10 MiB
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {submitError ? (
        <StatusCallout tone="error" title="Requirements action unavailable">
          {submitError}
        </StatusCallout>
      ) : null}

      <div className="booking-detail-actions">
        {state === "requirements-resubmission" ? (
          <button
            className="customer-primary-button"
            type="button"
            disabled={!resubmissionReady || submitting}
            onClick={() => void submitRequirements("resubmit")}
          >
            {submitting
              ? "Resubmitting…"
              : "Resubmit requirements for verification"}
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        ) : (
          <button
            className="customer-primary-button"
            type="button"
            disabled={
              !allDocumentsPresent || Boolean(uploadingType) || submitting
            }
            onClick={() => void submitRequirements("submit")}
          >
            {submitting ? "Sending…" : "Submit requirements for verification"}
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

function RequirementDocumentPreview({
  document,
}: {
  document: RequirementDocument;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");

  async function loadPreviewUrl(force = false) {
    if (previewUrl && !force) return previewUrl;
    setLoading(true);
    if (force) setPreviewUrl("");
    setPreviewError("");
    try {
      const response = await fetch(
        `/api/requirements?documentId=${encodeURIComponent(document.id)}`,
        { credentials: "same-origin" },
      );
      const body = (await response.json().catch(() => null)) as {
        url?: string;
        message?: string;
      } | null;
      if (!response.ok || !body?.url) {
        throw new Error(
          body?.message ?? "This document is not available for secure preview.",
        );
      }
      setPreviewUrl(body.url);
      return body.url;
    } catch (requestError) {
      setPreviewError(
        errorFromResult(
          requestError,
          "This document is not available for secure preview.",
        ),
      );
    } finally {
      setLoading(false);
    }
    return "";
  }

  useEffect(() => {
    void loadPreviewUrl(true);
    // A new document id represents a newly uploaded file and needs its own URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id]);

  async function openPreview() {
    setOpen(true);
    await loadPreviewUrl();
  }

  return (
    <>
      <button
        className="booking-document-thumbnail"
        type="button"
        disabled={loading}
        onClick={() => void openPreview()}
        aria-label={`Preview ${document.original_filename}`}
      >
        {previewUrl ? (
          document.mime_type === "application/pdf" ? (
            <PdfDocumentThumbnail
              source={previewUrl}
              filename={document.original_filename}
            />
          ) : (
            <img
              src={previewUrl}
              alt={`Preview of ${document.original_filename}`}
            />
          )
        ) : (
          <span className="booking-document-thumbnail__placeholder">
            {previewError ? "Preview unavailable" : "Preparing preview…"}
          </span>
        )}
        <span className="booking-document-thumbnail__label">
          <Eye size={15} aria-hidden="true" /> Preview document
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[92vh] max-w-5xl overflow-hidden p-0"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader className="border-b border-[#d8d5cc] px-6 py-5 pr-14">
            <DialogTitle>Document preview</DialogTitle>
            <DialogDescription>
              {document.original_filename} ·{" "}
              {fileSizeLabel(document.size_bytes)}
            </DialogDescription>
          </DialogHeader>
          <div className="booking-document-preview-frame" aria-busy={loading}>
            {previewError ? (
              <StatusCallout tone="error" title="Preview unavailable">
                {previewError}
              </StatusCallout>
            ) : previewUrl ? (
              document.mime_type === "application/pdf" ? (
                <PdfDocumentPreview
                  source={previewUrl}
                  filename={document.original_filename}
                />
              ) : (
                <img
                  className="booking-document-preview-image"
                  src={previewUrl}
                  alt={`Preview of ${document.original_filename}`}
                />
              )
            ) : (
              <p className="customer-helper">
                Loading secure document preview…
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PdfDocumentThumbnail({
  source,
  filename,
}: {
  source: string;
  filename: string;
}) {
  const [thumbnail, setThumbnail] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadingTask: {
      destroy?: () => void | Promise<void>;
      promise: Promise<any>;
    } | null = null;
    async function renderThumbnail() {
      try {
        const [{ GlobalWorkerOptions, getDocument }, response] =
          await Promise.all([
            import("pdfjs-dist"),
            fetch(source, { credentials: "omit" }),
          ]);
        if (!response.ok)
          throw new Error("The secure PDF could not be loaded.");
        GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        loadingTask = getDocument({
          data: new Uint8Array(await response.arrayBuffer()),
        });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.42 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("The PDF preview canvas is unavailable.");
        await page.render({ canvasContext: context, viewport }).promise;
        if (!cancelled) setThumbnail(canvas.toDataURL("image/png"));
        pdf.cleanup?.();
      } catch {
        // The full modal still gives a detailed error if this document cannot render.
      }
    }
    void renderThumbnail();
    return () => {
      cancelled = true;
      void Promise.resolve(loadingTask?.destroy?.()).catch(() => undefined);
    };
  }, [source]);

  return thumbnail ? (
    <img src={thumbnail} alt={`First page of ${filename}`} />
  ) : (
    <span className="booking-document-thumbnail__placeholder">
      Rendering PDF…
    </span>
  );
}

function PdfDocumentPreview({
  source,
  filename,
}: {
  source: string;
  filename: string;
}) {
  const [pages, setPages] = useState<string[]>([]);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadingTask: {
      destroy?: () => void | Promise<void>;
      promise: Promise<any>;
    } | null = null;

    async function renderPdf() {
      setPages([]);
      setRenderError("");
      try {
        const [{ GlobalWorkerOptions, getDocument }, response] =
          await Promise.all([
            import("pdfjs-dist"),
            fetch(source, { credentials: "omit" }),
          ]);
        if (!response.ok) {
          throw new Error("The secure PDF could not be loaded.");
        }
        GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        loadingTask = getDocument({
          data: new Uint8Array(await response.arrayBuffer()),
        });
        const pdf = await loadingTask.promise;
        const renderedPages: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const initialViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(1.5, 980 / initialViewport.width);
          const viewport = page.getViewport({ scale });
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width * pixelRatio);
          canvas.height = Math.ceil(viewport.height * pixelRatio);
          const context = canvas.getContext("2d");
          if (!context)
            throw new Error("The PDF preview canvas is unavailable.");
          await page.render({
            canvasContext: context,
            transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
            viewport,
          }).promise;
          renderedPages.push(canvas.toDataURL("image/png"));
        }
        if (!cancelled) setPages(renderedPages);
        // PDFDocumentProxy no longer guarantees a destroy method in current
        // pdf.js builds. Its loading task owns teardown instead.
        pdf.cleanup?.();
      } catch (error) {
        if (!cancelled) {
          setRenderError(
            errorFromResult(
              error,
              "This PDF could not be rendered for preview.",
            ),
          );
        }
      }
    }

    void renderPdf();
    return () => {
      cancelled = true;
      void Promise.resolve(loadingTask?.destroy?.()).catch(() => undefined);
    };
  }, [source]);

  if (renderError) {
    return (
      <StatusCallout tone="error" title="Preview unavailable">
        {renderError}
      </StatusCallout>
    );
  }
  if (pages.length === 0) {
    return <p className="customer-helper">Rendering secure PDF preview…</p>;
  }
  return (
    <div className="booking-document-preview-pages">
      {pages.map((page, index) => (
        <img
          alt={`${filename}, page ${index + 1}`}
          className="booking-document-preview-image"
          key={page}
          src={page}
        />
      ))}
    </div>
  );
}

function RequirementsOverview({
  requirements,
}: {
  requirements: RequirementsResponse | null;
}) {
  return (
    <section
      className="booking-detail-section booking-requirements booking-requirements--review"
      aria-labelledby="requirements-overview-title"
    >
      <p
        className="booking-requirements-intro"
        id="requirements-overview-title"
      >
        We received your documents and will notify you once they have been
        verified. Payment becomes available after verification is complete.
      </p>
      <RequirementDocumentList requirements={requirements} />
    </section>
  );
}

function RequirementDocumentList({
  requirements,
}: {
  requirements: RequirementsResponse | null;
}) {
  const types = requirements?.requiredTypes ?? [];
  return (
    <div className="booking-requirement-list booking-requirement-grid">
      {types.map((type) => {
        const document = currentDocument(requirements?.documents ?? [], type);
        const presentation = REQUIREMENT_PRESENTATION[type] ?? {
          description: "A submitted document for this requirement.",
          Icon: FileCheck2,
        };
        const RequirementIcon = presentation.Icon;
        return (
          <article className="booking-requirement-row" key={type}>
            <div className="booking-requirement-copy">
              <RequirementIcon size={28} aria-hidden="true" />
              <div>
                <h3>{humanizeRequirementType(type)}</h3>
                <p>{presentation.description}</p>
              </div>
            </div>
            <div className="booking-requirement-action">
              {document ? (
                <>
                  <RequirementDocumentPreview document={document} />
                  <p className="booking-requirement-file">
                    {document.original_filename} ·{" "}
                    {fileSizeLabel(document.size_bytes)}
                  </p>
                  <span className="booking-requirement-review-status">
                    <CheckCircle2 size={14} aria-hidden="true" /> Received
                  </span>
                </>
              ) : (
                <span className="customer-helper">
                  No current document recorded
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PaymentSubmission({
  bookingId,
  payment,
  methods,
  state,
  onRefresh,
}: {
  bookingId: string;
  payment: CustomerPayment | null;
  methods: CustomerPaymentMethod[];
  state: "payment-action" | "payment-resubmission";
  onRefresh: () => Promise<void>;
}) {
  const [method, setMethod] = useState(payment?.payment_method_id ?? "");
  const [reference, setReference] = useState(
    payment?.transaction_reference ?? "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [focusKey, setFocusKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const selectedMethod = methods.find((item) => item.id === method);
  const proofInputsDisabled = submitting || !method;
  const requiredAmount = numericValue(payment?.required_amount);
  const amount = requiredAmount == null ? "" : String(requiredAmount);
  const qrImageUrl = selectedMethod?.qr_image_url ?? null;
  const amountDue = requiredAmount;
  const amountDueLabel = formatCurrency(amountDue ?? 0);
  const amountDueScale =
    amountDueLabel.length >= 12
      ? " booking-payment-request__amount-value--condensed"
      : amountDueLabel.length >= 10
        ? " booking-payment-request__amount-value--compact"
        : "";
  const submittedAmount = Number(amount);
  const hasRequiredAmount =
    Number.isFinite(submittedAmount) && submittedAmount > 0;
  const canSubmitPayment =
    Boolean(method) &&
    hasRequiredAmount &&
    Boolean(reference.trim()) &&
    Boolean(file) &&
    methods.length > 0;
  const resubmissionReason = payment?.resubmission_reason?.trim();
  const quote = payment?.payment_quote;

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setProofPreviewUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setProofPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const errors = [
    fieldErrors.method
      ? {
          id: "payment-method",
          label: "Payment method",
          message: fieldErrors.method,
        }
      : null,
    fieldErrors.reference
      ? {
          id: "payment-reference",
          label: "Transaction reference",
          message: fieldErrors.reference,
        }
      : null,
    fieldErrors.proof
      ? {
          id: "payment-proof",
          label: "Payment proof",
          message: fieldErrors.proof,
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; message: string }>;

  function chooseProof(nextFile: File | undefined, input: HTMLInputElement) {
    input.value = "";
    if (!nextFile) return;
    const validationError = validateFile(nextFile);
    setFieldErrors((current) => ({ ...current, proof: validationError }));
    setFile(validationError ? null : nextFile);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!method)
      nextErrors.method = "Choose one of the available payment methods.";
    if (!hasRequiredAmount)
      setSubmitError("The required payment amount is not available yet.");
    if (!reference.trim()) {
      nextErrors.reference = "Enter the reference from your payment.";
    }
    if (!file) nextErrors.proof = "Choose a JPEG, PNG, or PDF proof file.";
    setFieldErrors(nextErrors);
    if (hasRequiredAmount) setSubmitError("");
    if (!hasRequiredAmount || Object.keys(nextErrors).length > 0) {
      setFocusKey((current) => current + 1);
      return;
    }
    if (!file) return;

    setSubmitting(true);
    const proofFile = file;
    const form = new FormData();
    form.set("bookingId", bookingId);
    form.set("paymentMethodId", method);
    form.set("submittedAmount", amount);
    form.set("transactionReference", reference.trim());
    form.set("file", proofFile);
    try {
      await fetchJson<{ payment: CustomerPayment }>("/api/payments", {
        method: "POST",
        body: form,
      });
      await onRefresh();
    } catch (requestError) {
      setSubmitError(
        errorFromResult(requestError, "Payment could not be submitted."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="booking-detail-section booking-payment-section booking-payment-section--request"
      aria-label="Payment submission"
    >
      <p className="booking-payment-request__lead">
        {state === "payment-resubmission"
          ? "Review the requested changes, then update your payment details and proof for another review."
          : "Your requirements are verified. Send the down payment and proof so the team can review your booking."}
      </p>

      {state === "payment-resubmission" && resubmissionReason ? (
        <aside
          className="booking-payment-resubmission-note"
          aria-label="A note from the team"
        >
          <div>
            <AlertCircle size={17} aria-hidden="true" />
            <span>A note from the team</span>
          </div>
          <p>{resubmissionReason}</p>
        </aside>
      ) : null}

      <section
        className="booking-payment-request__quote"
        aria-label="Payment request"
      >
        <div className="booking-payment-request__amount">
          <h2>Amount due now</h2>
          <strong
            className={`booking-payment-request__amount-value${amountDueScale}`}
          >
            {amountDueLabel}
          </strong>
          <p>
            This is 50% down payment of your total rental fee (rental charge +
            delivery fee).
          </p>
        </div>
        <div className="booking-payment-request__breakdown">
          <h2>Quote summary</h2>
          {quote ? (
            <dl
              className="booking-payment-quote"
              aria-label="Your final rental quote"
            >
              <div>
                <dt>
                  Rental charge ({quote.billable_days} day
                  {quote.billable_days === 1 ? "" : "s"})
                </dt>
                <dd>
                  {formatCurrency(numericValue(quote.rental_subtotal) ?? 0)}
                </dd>
              </div>
              <div className="booking-payment-quote__subtotal-end">
                <dt>Delivery fee</dt>
                <dd>{formatCurrency(numericValue(quote.delivery_fee) ?? 0)}</dd>
              </div>
              <div className="booking-payment-quote__total">
                <dt>Total rental price</dt>
                <dd>{formatCurrency(numericValue(quote.total_amount) ?? 0)}</dd>
              </div>
              <div>
                <dt>Less: Down payment (50%)</dt>
                <dd>{formatCurrency(requiredAmount ?? 0)}</dd>
              </div>
              <div className="booking-payment-quote__remaining">
                <dt>Remaining balance</dt>
                <dd>
                  {formatCurrency(
                    numericValue(quote.remaining_balance_amount) ?? 0,
                  )}
                </dd>
              </div>
            </dl>
          ) : null}
          <div className="booking-payment-request__deposit">
            <ShieldCheck aria-hidden="true" />
            <div>
              <strong>Refundable security deposit (upon vehicle return)</strong>
              <p>
                The security deposit will be collected upon vehicle handover and
                refunded in full, subject to our terms and condition.
              </p>
            </div>
            <b>
              {formatCurrency(
                numericValue(quote?.security_deposit_amount) ?? 3_000,
              )}
            </b>
          </div>
        </div>
      </section>

      <ErrorSummary errors={errors} focusKey={focusKey} />
      {submitError ? (
        <StatusCallout tone="error" title="Payment not submitted">
          {submitError}
        </StatusCallout>
      ) : null}

      <form className="booking-payment-form" onSubmit={submit} noValidate>
        <fieldset>
          <legend>Payment information</legend>
          <p className="booking-payment-form__intro">
            Select a payment method to show its payment code.
          </p>
          <div className="booking-form-field">
            <label htmlFor="payment-method">Payment method</label>
            <select
              id="payment-method"
              name="paymentMethodId"
              autoComplete="off"
              className="customer-select"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              aria-invalid={Boolean(fieldErrors.method)}
              aria-describedby={
                fieldErrors.method ? "payment-method-error" : undefined
              }
              disabled={submitting || methods.length === 0}
            >
              <option value="" disabled hidden>
                Choose a payment method
              </option>
              {methods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <FieldError id="payment-method" message={fieldErrors.method} />
          </div>

          <div className="booking-payment-workspace">
            <section
              key={selectedMethod?.id ?? "payment-method-placeholder"}
              className={`booking-payment-qr-panel${selectedMethod && qrImageUrl ? " booking-payment-qr-panel--revealed" : ""}`}
              aria-live="polite"
              aria-labelledby="payment-code-title"
            >
              {selectedMethod && qrImageUrl ? (
                <>
                  <div>
                    <h2 id="payment-code-title">
                      Scan to pay with {selectedMethod.label}
                    </h2>
                    <p className="booking-payment-qr-panel__amount">
                      <span>Amount due</span>
                      <strong>{amountDueLabel}</strong>
                    </p>
                  </div>
                  <button
                    className="booking-payment-qr-panel__image"
                    type="button"
                    onClick={() => setQrPreviewOpen(true)}
                    aria-label={`Preview ${selectedMethod.label} payment QR code`}
                  >
                    <img
                      src={qrImageUrl}
                      alt={`${selectedMethod.label} payment QR code`}
                    />
                    <span>
                      <Eye size={15} aria-hidden="true" /> View larger
                    </span>
                  </button>
                  <Dialog open={qrPreviewOpen} onOpenChange={setQrPreviewOpen}>
                    <DialogContent
                      className="booking-payment-qr-preview-dialog w-[min(92vw,42rem)] max-w-none overflow-hidden p-0"
                      onOpenAutoFocus={(event) => event.preventDefault()}
                    >
                      <DialogHeader className="border-b border-[#d8d5cc] px-6 py-5 pr-14">
                        <DialogTitle>
                          Scan to pay with {selectedMethod.label}
                        </DialogTitle>
                        <DialogDescription>
                          Amount due: {amountDueLabel}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="booking-payment-qr-preview-dialog__image">
                        <img
                          src={qrImageUrl}
                          alt={`${selectedMethod.label} payment QR code`}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                  {selectedMethod.recipient_name ||
                  selectedMethod.account_number ? (
                    <dl className="booking-payment-qr-panel__recipient">
                      {selectedMethod.recipient_name ? (
                        <div>
                          <dt>Recipient</dt>
                          <dd>{selectedMethod.recipient_name}</dd>
                        </div>
                      ) : null}
                      {selectedMethod.account_number ? (
                        <div>
                          <dt>Account number</dt>
                          <dd>{selectedMethod.account_number}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </>
              ) : (
                <div className="booking-payment-qr-panel__empty">
                  <h2 id="payment-code-title">
                    {selectedMethod
                      ? "Payment code unavailable"
                      : "Choose a payment method"}
                  </h2>
                  <p>
                    {selectedMethod
                      ? "Choose another method or contact the team for payment details."
                      : "Its payment code will appear here."}
                  </p>
                </div>
              )}
            </section>

            <section
              className="booking-payment-proof"
              aria-labelledby="payment-proof-heading"
            >
              <div>
                <h2 id="payment-proof-heading">Submit your proof</h2>
                <p>Once payment is complete, enter the confirmation details.</p>
              </div>

              <div className="booking-form-field" id="payment-proof">
                <label htmlFor="payment-proof-file">Payment proof</label>
                <label
                  className={`booking-payment-proof-file${proofInputsDisabled ? " is-disabled" : ""}`}
                  htmlFor="payment-proof-file"
                >
                  <span
                    className="booking-payment-proof-file__thumbnail"
                    aria-hidden="true"
                  >
                    {proofPreviewUrl ? (
                      <img src={proofPreviewUrl} alt="" />
                    ) : (
                      <FileText size={24} strokeWidth={1.7} />
                    )}
                  </span>
                  <span className="booking-payment-proof-file__copy">
                    <strong>{file ? file.name : "Choose a file"}</strong>
                    <small>
                      {file
                        ? `${fileSizeLabel(file.size)} · Ready to upload with your payment`
                        : "JPEG, PNG, or PDF · Up to 10 MiB"}
                    </small>
                  </span>
                  <span className="booking-payment-proof-file__action">
                    {file ? "Change" : "Upload"}
                  </span>
                  <input
                    id="payment-proof-file"
                    name="file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    disabled={proofInputsDisabled}
                    onChange={(event) =>
                      chooseProof(event.target.files?.[0], event.currentTarget)
                    }
                  />
                </label>
                {!file && state === "payment-resubmission" ? (
                  <p className="customer-helper">
                    Choose a replacement proof file.
                  </p>
                ) : null}
                <FieldError id="payment-proof" message={fieldErrors.proof} />
              </div>

              <div className="booking-form-field">
                <label htmlFor="payment-reference">Transaction reference</label>
                <input
                  id="payment-reference"
                  name="transactionReference"
                  autoComplete="off"
                  spellCheck={false}
                  className="customer-input"
                  type="text"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Enter reference number"
                  aria-invalid={Boolean(fieldErrors.reference)}
                  aria-describedby={
                    fieldErrors.reference
                      ? "payment-reference-error"
                      : undefined
                  }
                  disabled={proofInputsDisabled}
                />
                <FieldError
                  id="payment-reference"
                  message={fieldErrors.reference}
                />
              </div>
            </section>
          </div>
        </fieldset>

        {methods.length === 0 ? (
          <StatusCallout
            tone="error"
            title="Payment methods unavailable"
            action={
              <button
                className="customer-secondary-button"
                type="button"
                onClick={() => void onRefresh()}
              >
                Refresh payment options
              </button>
            }
          >
            No active payment method was returned by the payment service. No
            payment submission was started.
          </StatusCallout>
        ) : null}

        <div className="booking-detail-actions">
          <button
            className="customer-primary-button"
            type="submit"
            disabled={submitting || !canSubmitPayment}
          >
            {submitting
              ? state === "payment-resubmission"
                ? "Resubmitting…"
                : "Submitting…"
              : state === "payment-resubmission"
                ? "Resubmit payment information"
                : "Submit payment for review"}
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
}

function PaymentAwaitingAmount({ booking }: { booking: CustomerBooking }) {
  const deliveryLocation =
    booking.pickup_location ??
    booking.pickup_branch?.name ??
    "Delivery location will be confirmed with your booking.";
  const rentalDays = Math.max(
    1,
    Math.ceil(
      (new Date(booking.return_at).getTime() -
        new Date(booking.pickup_at).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <section
      className="booking-detail-section booking-payment-awaiting"
      aria-labelledby="payment-amount-pending-title"
    >
      <header className="booking-payment-awaiting__header">
        <h1 id="payment-amount-pending-title">
          We&apos;re preparing your payment details.
        </h1>
        <p>
          Your requirements are verified. Briah&apos;s team is confirming the
          amount for this trip.
        </p>
      </header>

      <ol
        className="booking-payment-awaiting__handoff"
        aria-label="Payment progress"
      >
        <li className="is-complete">
          <span aria-hidden="true">
            <FileCheck2 size={27} strokeWidth={1.8} />
          </span>
          <div>
            <strong>Requirements verified</strong>
          </div>
          <span
            className="booking-payment-awaiting__connector"
            aria-hidden="true"
          >
            <ArrowRight size={19} strokeWidth={1.7} />
          </span>
        </li>
        <li className="is-current">
          <span aria-hidden="true">
            <CreditCard size={24} strokeWidth={1.8} />
          </span>
          <div>
            <strong>Amount being prepared</strong>
            <p>We&apos;ll email you when it&apos;s ready.</p>
          </div>
          <span
            className="booking-payment-awaiting__connector"
            aria-hidden="true"
          >
            <ArrowRight size={19} strokeWidth={1.7} />
          </span>
        </li>
        <li>
          <span aria-hidden="true">
            <Clock3 size={27} strokeWidth={1.8} />
          </span>
          <div>
            <strong>Payment ready</strong>
          </div>
        </li>
      </ol>

      <section
        className="booking-payment-awaiting__trip"
        aria-labelledby="payment-trip-details-title"
      >
        <h2 id="payment-trip-details-title">Trip details</h2>
        <dl>
          <div>
            <CalendarDays size={22} aria-hidden="true" />
            <div>
              <dt>Rental dates</dt>
              <dd>{formatDateRange(booking.pickup_at, booking.return_at)}</dd>
              <small>
                {rentalDays} {rentalDays === 1 ? "day" : "days"}
              </small>
            </div>
          </div>
          <div>
            <MapPin size={22} aria-hidden="true" />
            <div>
              <dt>Delivery location</dt>
              <dd>{deliveryLocation}</dd>
            </div>
          </div>
        </dl>
      </section>
    </section>
  );
}

function PaymentUnderReview({ payment }: { payment: CustomerPayment | null }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false);
  const proof =
    payment?.payment_proofs?.find((item) => item.is_current) ?? null;
  const proofIsImage = Boolean(proof?.mime_type?.startsWith("image/"));
  const proofIsPdf = proof?.mime_type === "application/pdf";
  const proofIsPreviewable = proofIsImage || proofIsPdf;
  const submittedAmount = numericValue(payment?.submitted_amount);

  useEffect(() => {
    let cancelled = false;
    if (!proof?.id || !proofIsPreviewable) {
      setProofPreviewUrl(null);
      return;
    }

    void fetchJson<{ url: string }>(
      `/api/payments?proofId=${encodeURIComponent(proof.id)}`,
    )
      .then((response) => {
        if (!cancelled) setProofPreviewUrl(response.url);
      })
      .catch(() => {
        if (!cancelled) setProofPreviewUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [proof?.id, proofIsPreviewable]);

  async function openProof() {
    if (!proof?.id) return;
    setOpening(true);
    setError("");
    try {
      const response = await fetchJson<{ url: string }>(
        `/api/payments?proofId=${encodeURIComponent(proof.id)}`,
      );
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(
        errorFromResult(
          requestError,
          "The submitted proof could not be opened.",
        ),
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <section
      className="booking-detail-section booking-payment-section booking-payment-section--review"
      aria-labelledby="payment-submitted-title"
    >
      <p className="booking-payment-request__lead">
        We’ve received your payment proof and are checking the details. We’ll
        notify you once it’s confirmed.
      </p>
      <div className="booking-payment-review__submitted">
        <CheckCircle2 size={18} aria-hidden="true" />
        <span>Submitted {formatInstant(payment?.submitted_at)}</span>
      </div>
      <section className="booking-payment-review__details">
        <h2 id="payment-submitted-title">Payment submitted</h2>
        {proof ? (
          <div className="booking-payment-review__proof">
            {proofIsPreviewable && proofPreviewUrl ? (
              <button
                className="booking-payment-review__proof-image"
                type="button"
                onClick={() => setProofPreviewOpen(true)}
                aria-label="View submitted payment proof"
              >
                {proofIsPdf ? (
                  <PdfDocumentThumbnail
                    source={proofPreviewUrl}
                    filename={
                      proof.original_filename ?? "Submitted payment proof"
                    }
                  />
                ) : (
                  <img src={proofPreviewUrl} alt="Submitted payment proof" />
                )}
                <span className="booking-payment-review__proof-cue">
                  <Eye size={15} aria-hidden="true" /> View larger
                </span>
              </button>
            ) : (
              <button
                className="booking-payment-review__proof-document"
                type="button"
                onClick={() => void openProof()}
                disabled={opening}
              >
                <FileText size={30} aria-hidden="true" />
                <span>
                  <strong>
                    {proof.original_filename ?? "Submitted payment proof"}
                  </strong>
                  <small>
                    {proofIsImage ? "Open image proof" : "Open submitted proof"}
                  </small>
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="booking-payment-review__proof booking-payment-review__proof--missing">
            <FileText size={30} aria-hidden="true" />
            <span>Payment proof was not recorded.</span>
          </div>
        )}
        {proofIsPreviewable && proofPreviewUrl ? (
          <Dialog open={proofPreviewOpen} onOpenChange={setProofPreviewOpen}>
            <DialogContent
              className="booking-payment-qr-preview-dialog w-[min(92vw,42rem)] max-w-none overflow-hidden p-0"
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <DialogHeader className="border-b border-[#d8d5cc] px-6 py-5 pr-14">
                <DialogTitle>Submitted payment proof</DialogTitle>
                <DialogDescription>
                  {proof?.original_filename ?? "Payment proof"}
                </DialogDescription>
              </DialogHeader>
              {proofIsPdf ? (
                <div className="booking-document-preview-frame">
                  <PdfDocumentPreview
                    source={proofPreviewUrl}
                    filename={
                      proof?.original_filename ?? "Submitted payment proof"
                    }
                  />
                </div>
              ) : (
                <div className="booking-payment-qr-preview-dialog__image">
                  <img src={proofPreviewUrl} alt="Submitted payment proof" />
                </div>
              )}
            </DialogContent>
          </Dialog>
        ) : null}
        <dl className="booking-payment-review__facts">
          <div>
            <dt>Payment method</dt>
            <dd>{paymentMethodLabel(payment)}</dd>
          </div>
          <div>
            <dt>Amount paid</dt>
            <dd className="booking-payment-review__amount">
              {submittedAmount === null
                ? "Amount not recorded"
                : formatCurrency(submittedAmount)}
            </dd>
          </div>
          <div>
            <dt>Reference number</dt>
            <dd>
              {payment?.transaction_reference ?? "Reference not recorded"}
            </dd>
          </div>
        </dl>
        <p className="booking-payment-review__note">
          <Clock3 size={18} aria-hidden="true" />
          No action is needed while we review your proof.
        </p>
        {error ? (
          <p className="customer-field-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" /> {error}
          </p>
        ) : null}
      </section>
    </section>
  );
}

function BookingResolution({
  booking,
  payment,
  vehicle,
}: {
  booking: CustomerBooking;
  payment: CustomerPayment | null;
  vehicle: CustomerVehicle | null;
}) {
  const vehicleName =
    vehicle?.name ??
    booking.assigned_vehicle?.name ??
    booking.requested_vehicle?.name ??
    "your vehicle";
  const vehicleUnavailable =
    booking.confirmation_exception_code === "vehicle_unavailable";
  const submittedAmount = Number(payment?.submitted_amount);
  const amount = Number.isFinite(submittedAmount)
    ? formatCurrency(submittedAmount)
    : "Payment recorded";
  const availabilityUpdate = vehicleUnavailable
    ? `${vehicleName} is no longer available for your dates.`
    : "We couldn’t complete this booking for your dates.";

  return (
    <section
      className="booking-detail-section booking-resolution"
      aria-labelledby="resolution-title"
    >
      <h2 id="resolution-title" className="sr-only">
        Booking resolution in progress
      </h2>
      <div className="booking-resolution__reassurance">
        <article>
          <ShieldCheck size={28} aria-hidden="true" />
          <div>
            <h3>Payment protected</h3>
            <p>You won&apos;t be charged again.</p>
          </div>
        </article>
        <article>
          <CarFront size={28} aria-hidden="true" />
          <div>
            <h3>Finding a similar vehicle</h3>
            <p>Same class and capacity where available.</p>
          </div>
        </article>
        <article>
          <Clock3 size={28} aria-hidden="true" />
          <div>
            <h3>Update within one business day</h3>
            <p>We&apos;ll be in touch soon.</p>
          </div>
        </article>
      </div>
      <p className="booking-resolution__summary">
        {availabilityUpdate} We&apos;re finding the best available option and
        will confirm your updated booking shortly.
      </p>
      <dl className="booking-resolution__facts">
        <div>
          <dt>Amount paid</dt>
          <dd>{amount}</dd>
          <small>{formatInstant(payment?.submitted_at)}</small>
        </div>
        <div>
          <dt>Vehicle</dt>
          <dd>{vehicleName}</dd>
        </div>
        <div>
          <dt>Rental dates</dt>
          <dd>{formatDateRange(booking.pickup_at, booking.return_at)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>Being resolved</dd>
          <small>We&apos;ll update you soon.</small>
        </div>
      </dl>
      <p className="booking-resolution__contact">
        Questions?{" "}
        <Link to="/contact">
          Contact the team <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </p>
    </section>
  );
}

function ConfirmedBooking({
  booking,
  vehicle,
}: {
  booking: CustomerBooking;
  vehicle: CustomerVehicle | null;
}) {
  const pickup = confirmationSchedule(booking.pickup_at);
  const rentalReturn = confirmationSchedule(booking.return_at);
  const deliveryAddress =
    booking.pickup_location ?? "Delivery address not recorded";
  const returnAddress =
    booking.dropoff_location ?? "Return address not recorded";

  return (
    <section
      className="booking-detail-section booking-confirmation-dossier"
      aria-labelledby="confirmed-title"
    >
      <h2 id="confirmed-title" className="sr-only">
        Confirmed booking schedule
      </h2>
      <div className="booking-confirmation-moment">
        <div
          className="booking-confirmation-date"
          aria-label={formatInstant(booking.pickup_at)}
        >
          <strong>{pickup.day}</strong>
          <span>{pickup.month}</span>
          <small>{pickup.weekdayAndTime}</small>
        </div>
        <div className="booking-confirmation-details">
          <p>Scheduled delivery</p>
          <h3>Delivery to {deliveryAddress}</h3>
          <dl>
            <div>
              <Clock3 size={20} aria-hidden="true" />
              <div>
                <dt>{pickup.weekdayAndTime}</dt>
                <dd>We&apos;ll deliver the vehicle at this scheduled time.</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      <div className="booking-confirmation-moment">
        <div
          className="booking-confirmation-date"
          aria-label={formatInstant(booking.return_at)}
        >
          <strong>{rentalReturn.day}</strong>
          <span>{rentalReturn.month}</span>
          <small>{rentalReturn.weekdayAndTime}</small>
        </div>
        <div className="booking-confirmation-details">
          <p>Rental return</p>
          <h3>Return to {returnAddress}</h3>
          <dl>
            <div>
              <Clock3 size={20} aria-hidden="true" />
              <div>
                <dt>{rentalReturn.weekdayAndTime}</dt>
                <dd>Return the vehicle at the scheduled time and location.</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      <section
        className="booking-confirmation-next"
        aria-labelledby="next-steps-title"
      >
        <h3 id="next-steps-title">What happens next</h3>
        <ol>
          <li>
            <FileCheck2 size={24} aria-hidden="true" />
            <div>
              <strong>Bring your documents</strong>
              <p>
                Have your driver’s license and a government-issued ID ready.
              </p>
            </div>
          </li>
          <li>
            <CarFront size={24} aria-hidden="true" />
            <div>
              <strong>Meet the team for handover</strong>
              <p>Our team will meet you at the delivery address and time.</p>
            </div>
          </li>
          <li>
            <Eye size={24} aria-hidden="true" />
            <div>
              <strong>Inspect the vehicle with the team</strong>
              <p>
                We’ll walk through the vehicle condition together before your
                trip.
              </p>
            </div>
          </li>
        </ol>
      </section>
      {vehicle?.name ? null : (
        <p className="booking-detail-optional-data">
          Assigned vehicle details are not recorded.
        </p>
      )}
    </section>
  );
}

function ActiveRental({
  booking,
  vehicle,
}: {
  booking: CustomerBooking;
  vehicle: CustomerVehicle | null;
}) {
  const startedAt = booking.rental?.started_at ?? booking.pickup_at;
  const returnAt = booking.rental?.scheduled_return_at ?? booking.return_at;
  const started = activeRentalDate(startedAt);
  const rentalReturn = activeRentalDate(returnAt);
  const pickupLocation =
    booking.pickup_location ?? booking.pickup_branch?.name ?? "Not recorded";
  const returnLocation =
    booking.dropoff_location ?? booking.return_branch?.name ?? "Not recorded";
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(returnAt).getTime() - Date.now()) / 86_400_000),
  );

  return (
    <section
      className="booking-detail-section booking-active-rental"
      aria-labelledby="active-rental-title"
    >
      <header className="booking-active-rental__header">
        <h1 id="active-rental-title">Your rental is active.</h1>
        <p>You&apos;re all set. Enjoy the drive, and let us know if you need anything.</p>
      </header>

      <section
        className="booking-active-rental__schedule"
        aria-labelledby="rental-schedule-title"
      >
        <h2 id="rental-schedule-title">Rental schedule</h2>
        <dl>
          <div>
            <dt>Started</dt>
            <dd>{started.date}</dd>
            <dd>{started.time}</dd>
            <p>
              <MapPin size={18} aria-hidden="true" />
              {pickupLocation}
            </p>
          </div>
          <div>
            <dt>Return</dt>
            <dd>{rentalReturn.date}</dd>
            <dd>{rentalReturn.time}</dd>
            <p>
              <MapPin size={18} aria-hidden="true" />
              {returnLocation}
            </p>
          </div>
          <div className="booking-active-rental__remaining">
            <strong>{daysRemaining}</strong>
            <span>{daysRemaining === 1 ? "day remaining" : "days remaining"}</span>
            <p>Return on {rentalReturn.date} at {rentalReturn.time}.</p>
          </div>
        </dl>
      </section>

      <div className="booking-active-rental__help">
        <h2>Need help on your trip?</h2>
        <a href="tel:+639175550142">
          <Phone size={18} aria-hidden="true" />
          +63 917 555 0142
        </a>
        <Link className="customer-link" to="/contact">
          Contact the team <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>

      <section className="booking-active-rental__condition" aria-labelledby="vehicle-condition-title">
        <h2 id="vehicle-condition-title">Vehicle condition</h2>
        <p>
          <CarFront size={21} aria-hidden="true" />
          {vehicle?.name ?? "Your vehicle"} was released for this trip. If you notice an issue during your rental, contact us right away.
        </p>
      </section>
    </section>
  );
}

function ReturnedRental({
  booking,
  vehicle,
}: {
  booking: CustomerBooking;
  vehicle: CustomerVehicle | null;
}) {
  const startedAt = booking.rental?.started_at ?? booking.pickup_at;
  const returnedAt =
    booking.rental?.ended_at ??
    booking.rental?.scheduled_return_at ??
    booking.return_at;
  const started = activeRentalDate(startedAt);
  const returned = activeRentalDate(returnedAt);
  const pickupLocation =
    booking.pickup_location ?? booking.pickup_branch?.name ?? "Not recorded";
  const returnLocation =
    booking.dropoff_location ?? booking.return_branch?.name ?? "Not recorded";

  return (
    <section
      className="booking-detail-section booking-active-rental booking-returned-rental"
      aria-labelledby="returned-title"
    >
      <header className="booking-active-rental__header">
        <h1 id="returned-title">Your rental is complete.</h1>
        <p>
          Your {vehicle?.name ?? "vehicle"} has been returned. Thank you for
          choosing Briah&apos;s Car Rental.
        </p>
      </header>

      <section
        className="booking-active-rental__schedule"
        aria-labelledby="return-schedule-title"
      >
        <h2 id="return-schedule-title">Rental schedule</h2>
        <dl>
          <div>
            <dt>Started</dt>
            <dd>{started.date}</dd>
            <dd>{started.time}</dd>
            <p>
              <MapPin size={18} aria-hidden="true" />
              {pickupLocation}
            </p>
          </div>
          <div>
            <dt>Returned</dt>
            <dd>{returned.date}</dd>
            <dd>{returned.time}</dd>
            <p>
              <MapPin size={18} aria-hidden="true" />
              {returnLocation}
            </p>
          </div>
          <div className="booking-returned-rental__recorded">
            <div className="booking-returned-rental__recorded-title">
              <CheckCircle2 size={30} strokeWidth={1.8} aria-hidden="true" />
              <strong>Return recorded</strong>
            </div>
            <p>We&apos;ll review the return and email any final update.</p>
          </div>
        </dl>
      </section>

      <div className="booking-active-rental__help">
        <h2>Questions about your return?</h2>
        <a href="tel:+639175550142">
          <Phone size={18} aria-hidden="true" />
          +63 917 555 0142
        </a>
        <Link className="customer-link" to="/contact">
          Contact the team <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function BookingFactsSection({
  booking,
  vehicle,
}: {
  booking: CustomerBooking;
  vehicle: CustomerVehicle | null;
}) {
  return (
    <section
      className="booking-detail-section"
      aria-labelledby="request-facts-title"
    >
      <h2 id="request-facts-title">Request details</h2>
      <FactTable
        rows={[
          [
            CarFront,
            "Vehicle",
            vehicle?.name ?? booking.requested_vehicle?.name ?? "Not recorded",
          ],
          [
            CalendarDays,
            "Rental period",
            formatDateRange(booking.pickup_at, booking.return_at),
          ],
          [
            MapPin,
            "Pickup branch",
            booking.pickup_branch?.name ?? "Not recorded",
          ],
          [
            MapPin,
            "Return branch",
            booking.return_branch?.name ?? "Not recorded",
          ],
        ]}
      />
    </section>
  );
}

function FactTable({ rows }: { rows: Array<[LucideIcon, string, string]> }) {
  return (
    <div className="booking-facts-table">
      {rows.map(([Icon, label, value]) => (
        <FactRow icon={Icon} label={label} value={value} key={label} />
      ))}
    </div>
  );
}

function FactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="booking-fact-row">
      <Icon size={22} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RequirementsTaskList({ taskStep }: { taskStep: number }) {
  return (
    <ol className="requirements-task-list booking-requirements-task-list">
      {REQUIREMENTS_TASKS.map((label, index) => {
        const number = index + 1;
        const complete = number < taskStep;
        const current = number === taskStep;
        return (
          <li
            className={`${complete ? "is-complete" : ""} ${current ? "is-current" : ""}`}
            key={label}
            aria-current={current ? "step" : undefined}
          >
            <span className="task-marker" aria-hidden="true">
              {complete ? <CheckCircle2 size={13} /> : number}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function serviceLabel(booking: CustomerBooking) {
  if (booking.pickup_delivery_option === "delivery") {
    const locations = [
      booking.pickup_location,
      booking.dropoff_location,
    ].filter(Boolean);
    return locations.length ? `Delivery: ${locations.join(" → ")}` : "Delivery";
  }
  if (booking.pickup_delivery_option === "pickup") return "Pick up at branch";
  return "Service method not recorded";
}

function confirmationSchedule(value: string | null | undefined) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { day: "-", month: "", weekdayAndTime: "Not recorded" };
  }
  return {
    day: new Intl.DateTimeFormat("en-PH", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("en-PH", { month: "short" })
      .format(date)
      .toUpperCase(),
    weekdayAndTime: new Intl.DateTimeFormat("en-PH", {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

function activeRentalDate(value: string | null | undefined) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { date: "Not recorded", time: "" };
  }
  return {
    date: new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

function currentDocument(documents: RequirementDocument[], type: string) {
  return (
    documents.find(
      (document) => document.requirement_type === type && document.is_current,
    ) ?? null
  );
}

function reviewFor(
  review: CustomerRequirementReview | null | undefined,
  type: string,
) {
  if (!review) return null;
  const outcomes: Record<string, { outcome: string; reason: string }> = {
    "Valid Government ID": {
      outcome: review.governmentIdOutcome,
      reason: review.governmentIdReason,
    },
    "Driver's License": {
      outcome: review.driversLicenseOutcome,
      reason: review.driversLicenseReason,
    },
    "Proof of Billing": {
      outcome: review.proofOfBillingOutcome,
      reason: review.proofOfBillingReason,
    },
    "Selfie with ID": {
      outcome: review.selfieWithIdOutcome,
      reason: review.selfieWithIdReason,
    },
  };
  return outcomes[type] ?? null;
}

function validateFile(file: File) {
  if (!ACCEPTED_FILE_TYPES.has(file.type)) {
    return "Choose a JPEG, PNG, or PDF file.";
  }
  if (file.size <= 0) return "Choose a file with content.";
  if (file.size > MAX_FILE_SIZE) return "The file must be 10 MiB or smaller.";
  return "";
}

function numericValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function paymentMethodLabel(payment: CustomerPayment | null) {
  return (
    payment?.payment_method_label ??
    payment?.payment_methods?.label ??
    "Method not recorded"
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function errorFromResult(reason: unknown, fallback: string) {
  return reason instanceof ApiRequestError || reason instanceof Error
    ? reason.message
    : fallback;
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
  return fromFleet ?? fallbackVehicle(booking);
}

function fallbackVehicle(booking: CustomerBooking): CustomerVehicle | null {
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
  };
}
