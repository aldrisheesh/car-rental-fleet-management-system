import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CreditCard,
  Clock3,
  Eye,
  FileCheck2,
  MapPin,
  RefreshCw,
  Upload,
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

type BookingPageData = {
  composition: CustomerBookingComposition;
  vehicle: CustomerVehicle | null;
  vehicleError: string | null;
};

function BookingDetailPage() {
  const { bookingId } = Route.useParams();
  const [pageData, setPageData] = useState<BookingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const loadBooking = useCallback(async () => {
    setLoading(true);
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
      const booking = bookings.find((candidate) => candidate.id === bookingId);
      if (!booking) {
        setPageData(null);
        setNotFound(true);
        return;
      }

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
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  if (loading) {
    return (
      <CustomerPage>
        <Header />
        <main id="main-content" className="booking-detail-main">
          <div className="customer-container">
            <div className="booking-loading" role="status" aria-live="polite">
              Loading this rental request…
            </div>
          </div>
        </main>
      </CustomerPage>
    );
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
  const compositionErrors = [
    composition.requirementsError,
    composition.paymentError,
  ].filter((message): message is string => Boolean(message));

  return (
    <CustomerPage className="booking-detail-page">
      <Header />
      <LifecycleJourney steps={lifecycle.journey} />
      <main id="main-content" className="booking-detail-main">
        <div className="customer-container">
          <div className="booking-detail-breadcrumb">
            <Link to="/customer">My Bookings</Link>
            <span aria-hidden="true">/</span>
            <span>
              {vehicle?.name ??
                booking.requested_vehicle?.name ??
                "Booking details"}
            </span>
          </div>

          <div className="booking-detail-heading">
            <div>
              <p className="booking-detail-eyebrow">Your rental request</p>
              <h1>{lifecycle.title}</h1>
            </div>
            <p className={`booking-detail-stage is-${lifecycle.statusTone}`}>
              {lifecycle.statusLabel}
            </p>
          </div>

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
              <BookingStatusBand
                booking={booking}
                lifecycle={lifecycle}
                vehicle={vehicle}
              />
              <BookingStateContent
                booking={booking}
                composition={composition}
                lifecycle={lifecycle}
                vehicle={vehicle}
                onRefresh={loadBooking}
              />
            </div>
            <BookingSummary
              booking={booking}
              lifecycle={lifecycle}
              vehicle={vehicle}
            />
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
  if (lifecycle.state === "confirmation-waiting") {
    return (
      <StatusCallout
        tone="info"
        title="No action needed — booking confirmation is next."
      >
        Your payment is verified. Booking confirmation is a separate later step.
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
    case "payment-review":
      return <PaymentUnderReview payment={composition.payment} />;
    case "confirmation-waiting":
      return <PaymentVerified payment={composition.payment} />;
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

function BookingSummary({
  booking,
  lifecycle,
  vehicle,
}: {
  booking: CustomerBooking;
  lifecycle: LifecyclePresentation;
  vehicle: CustomerVehicle | null;
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
      />
      <dl className="booking-summary-facts">
        <div>
          <dt>Rental dates</dt>
          <dd>{formatDateRange(booking.pickup_at, booking.return_at)}</dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>{booking.pickup_branch?.name ?? "Not recorded"}</dd>
        </div>
        <div>
          <dt>Current stage</dt>
          <dd>{lifecycle.statusLabel}</dd>
        </div>
      </dl>
      <Link
        className="customer-link booking-summary-link"
        to="/bookings/$bookingId"
        params={{ bookingId: booking.id }}
      >
        View request details <ArrowRight size={18} aria-hidden="true" />
      </Link>
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
  const taskStep = allDocumentsPresent ? 2 : 1;

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
      className="booking-detail-section booking-requirements"
      aria-labelledby="requirements-title"
    >
      <div className="booking-section-heading">
        <div>
          <h2 id="requirements-title">Required documents</h2>
          <p>
            Accepted files are JPEG, PNG, or PDF up to 10 MiB. Uploads are not
            verification until Briah reviews them.
          </p>
        </div>
        <span className="booking-step-label">Step {taskStep} of 2</span>
      </div>
      <RequirementsTaskList taskStep={taskStep} />

      {state === "requirements-resubmission" ? (
        <StatusCallout tone="warning" title="Corrections are needed">
          Replace each flagged document using the customer-facing reason shown
          below, then resubmit the requirements.
        </StatusCallout>
      ) : (
        <StatusCallout tone="info" title="Before you start">
          Upload one current file for each document type, then preview each file
          here to confirm it is readable before sending it for verification.
        </StatusCallout>
      )}

      {requiredTypes.length === 0 ? (
        <StatusCallout tone="error" title="Required document types unavailable">
          The requirements service did not return its canonical document types.
          Try again before uploading anything.
        </StatusCallout>
      ) : (
        <div className="booking-requirement-list">
          {requiredTypes.map((type) => {
            const document = currentDocument(documents, type);
            const review = reviewFor(requirements?.review, type);
            const flagged = review?.outcome === "Needs Replacement";
            const editable =
              status === "Not Submitted" ||
              (status === "Needs Resubmission" && flagged);
            return (
              <article className="booking-requirement-row" key={type}>
                <div className="booking-requirement-copy">
                  <FileCheck2 size={24} aria-hidden="true" />
                  <div>
                    <h3>{humanizeRequirementType(type)}</h3>
                    <p>
                      {document
                        ? `${document.original_filename} · ${fileSizeLabel(document.size_bytes)}`
                        : "No document uploaded yet."}
                    </p>
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
                    <RequirementDocumentPreview document={document} />
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
                  ) : (
                    <span className="customer-helper">
                      Current file is locked
                    </span>
                  )}
                  <FieldError
                    id={`booking-file-${type}`}
                    message={uploadErrors[type]}
                  />
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

  async function openPreview() {
    setOpen(true);
    setLoading(true);
    setPreviewUrl("");
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
  }

  return (
    <>
      <button
        className="customer-secondary-button booking-document-preview-button"
        type="button"
        disabled={loading}
        onClick={() => void openPreview()}
      >
        {loading ? "Loading preview…" : "Preview document"}
        <Eye size={17} aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
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
  const status = requirements?.requirementSet?.status ?? "Not recorded";
  return (
    <section
      className="booking-detail-section"
      aria-labelledby="requirements-overview-title"
    >
      <div className="booking-section-heading">
        <div>
          <h2 id="requirements-overview-title">Requirements</h2>
          <p>
            Your current document state is shown here. Payment remains locked
            until verification is complete.
          </p>
        </div>
        <span className="booking-detail-mini-status">{status}</span>
      </div>
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
    <div className="booking-requirement-list booking-requirement-list-readonly">
      {types.map((type) => {
        const document = currentDocument(requirements?.documents ?? [], type);
        return (
          <div className="booking-requirement-row" key={type}>
            <div className="booking-requirement-copy">
              <FileCheck2 size={24} aria-hidden="true" />
              <div>
                <h3>{humanizeRequirementType(type)}</h3>
                <p>
                  {document
                    ? `${document.original_filename} · ${fileSizeLabel(document.size_bytes)}`
                    : "No current document recorded."}
                </p>
              </div>
            </div>
            <div className="booking-requirement-action">
              {document ? (
                <RequirementDocumentPreview document={document} />
              ) : null}
              <span className="customer-helper">Current file is locked</span>
            </div>
          </div>
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
  const [amount, setAmount] = useState(
    payment?.submitted_amount == null ? "" : String(payment.submitted_amount),
  );
  const [reference, setReference] = useState(
    payment?.transaction_reference ?? "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [focusKey, setFocusKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const selectedMethod = methods.find((item) => item.id === method);
  const requiredAmount = numericValue(payment?.required_amount);
  const resubmissionReason = payment?.resubmission_reason?.trim();

  const errors = [
    fieldErrors.method
      ? {
          id: "payment-method",
          label: "Payment method",
          message: fieldErrors.method,
        }
      : null,
    fieldErrors.amount
      ? {
          id: "payment-amount",
          label: "Amount paid",
          message: fieldErrors.amount,
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
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      nextErrors.amount = "Enter a positive amount paid.";
    }
    if (!reference.trim()) {
      nextErrors.reference = "Enter the reference from your payment.";
    }
    if (!file) nextErrors.proof = "Choose a JPEG, PNG, or PDF proof file.";
    setFieldErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) {
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
      className="booking-detail-section booking-payment-section"
      aria-labelledby="payment-title"
    >
      <div className="booking-section-heading">
        <div>
          <h2 id="payment-title">Submit your payment</h2>
          <p>
            Payment is available because your requirements are verified. Briah
            reviews the proof manually before booking confirmation.
          </p>
        </div>
        <span className="booking-step-label">Payment</span>
      </div>

      {state === "payment-resubmission" && resubmissionReason ? (
        <StatusCallout tone="warning" title="Update the payment information">
          <strong>Reason from Briah:</strong> {resubmissionReason}
        </StatusCallout>
      ) : null}

      <StatusCallout
        tone="warning"
        title="A minimum 50% down payment is required."
      >
        {requiredAmount !== null ? (
          <>
            The canonical required amount for this booking is{" "}
            <strong>{formatCurrency(requiredAmount)}</strong>. Enter the amount
            you paid and submit proof for manual review.
          </>
        ) : (
          "The required peso amount is not available here. Enter the amount you paid and submit proof for manual review."
        )}
      </StatusCallout>

      <ErrorSummary errors={errors} focusKey={focusKey} />
      {submitError ? (
        <StatusCallout tone="error" title="Payment not submitted">
          {submitError}
        </StatusCallout>
      ) : null}

      <form className="booking-payment-form" onSubmit={submit} noValidate>
        <fieldset>
          <legend>Payment details</legend>
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
              <option value="">Choose a payment method</option>
              {methods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <FieldError id="payment-method" message={fieldErrors.method} />
            {selectedMethod?.instructions ? (
              <p className="customer-helper">{selectedMethod.instructions}</p>
            ) : (
              <p className="customer-helper">
                Instructions appear after you choose a current payment method.
              </p>
            )}
          </div>

          <div className="booking-form-field">
            <label htmlFor="payment-amount">Amount paid</label>
            <div className="booking-currency-input">
              <span aria-hidden="true">₱</span>
              <input
                id="payment-amount"
                name="submittedAmount"
                autoComplete="off"
                className="customer-input"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount paid…"
                aria-invalid={Boolean(fieldErrors.amount)}
                aria-describedby={
                  fieldErrors.amount ? "payment-amount-error" : undefined
                }
                disabled={submitting}
              />
            </div>
            <FieldError id="payment-amount" message={fieldErrors.amount} />
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
              placeholder="Enter the reference from your payment…"
              aria-invalid={Boolean(fieldErrors.reference)}
              aria-describedby={
                fieldErrors.reference ? "payment-reference-error" : undefined
              }
              disabled={submitting}
            />
            <FieldError
              id="payment-reference"
              message={fieldErrors.reference}
            />
          </div>

          <div className="booking-form-field" id="payment-proof">
            <label htmlFor="payment-proof-file">Payment proof</label>
            <FileTarget
              id="payment-proof-file"
              name="file"
              label={file ? "Replace selected file" : "Choose a file"}
              disabled={submitting}
              onChange={chooseProof}
            />
            <p className="customer-helper">JPEG, PNG, or PDF · Up to 10 MiB</p>
            {file ? (
              <p className="booking-selected-file">
                <Upload size={16} aria-hidden="true" />
                {file.name} · {fileSizeLabel(file.size)}
              </p>
            ) : (
              <p className="customer-helper">
                {state === "payment-resubmission"
                  ? "Choose a replacement proof file."
                  : "No file selected."}
              </p>
            )}
            <FieldError id="payment-proof" message={fieldErrors.proof} />
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

        <StatusCallout tone="info" title="What happens next">
          Briah reviews your payment proof. Your booking is not confirmed until
          payment review and booking confirmation are complete.
        </StatusCallout>

        <div className="booking-detail-actions">
          <button
            className="customer-primary-button"
            type="submit"
            disabled={submitting || methods.length === 0}
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
          <Link className="customer-tertiary-button" to="/customer">
            Back to My Bookings
          </Link>
        </div>
      </form>
    </section>
  );
}

function PaymentUnderReview({ payment }: { payment: CustomerPayment | null }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const proof =
    payment?.payment_proofs?.find((item) => item.is_current) ?? null;

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
      className="booking-detail-section"
      aria-labelledby="payment-submitted-title"
    >
      <div className="booking-section-heading">
        <div>
          <h2 id="payment-submitted-title">Payment submitted</h2>
          <p>Briah reviews the submitted payment details and proof manually.</p>
        </div>
      </div>
      <div className="booking-facts-table">
        <FactRow
          icon={CreditCard}
          label="Payment method"
          value={paymentMethodLabel(payment)}
        />
        <FactRow
          icon={FileCheck2}
          label="Transaction reference"
          value={payment?.transaction_reference ?? "Reference not recorded"}
        />
        <FactRow
          icon={FileCheck2}
          label="Payment proof"
          value={proof?.original_filename ?? "Proof not recorded"}
        />
        <FactRow
          icon={CalendarDays}
          label="Submitted"
          value={formatInstant(payment?.submitted_at)}
        />
      </div>
      {proof ? (
        <button
          className="customer-secondary-button"
          type="button"
          onClick={() => void openProof()}
          disabled={opening}
        >
          <FileCheck2 size={18} aria-hidden="true" />
          {opening ? "Opening proof…" : "View submitted proof"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      ) : null}
      {error ? (
        <p className="customer-field-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" /> {error}
        </p>
      ) : null}
      <p className="booking-inline-note">
        You can leave this page. We’ll update your booking when the review
        changes.
      </p>
      <StatusCallout tone="info" title="What happens next">
        <ol className="booking-next-steps">
          <li>Briah completes the manual review.</li>
          <li>
            If payment is verified, booking confirmation is the next separate
            step.
          </li>
        </ol>
      </StatusCallout>
    </section>
  );
}

function PaymentVerified({ payment }: { payment: CustomerPayment | null }) {
  return (
    <section
      className="booking-detail-section"
      aria-labelledby="payment-verified-title"
    >
      <div className="booking-section-heading">
        <div>
          <h2 id="payment-verified-title">Payment verified</h2>
          <p>
            Your payment has been verified. Booking confirmation remains a
            separate later milestone.
          </p>
        </div>
      </div>
      <div className="booking-facts-table">
        <FactRow icon={CheckCircle2} label="Payment status" value="Verified" />
        <FactRow
          icon={FileCheck2}
          label="Payment method"
          value={paymentMethodLabel(payment)}
        />
        <FactRow
          icon={FileCheck2}
          label="Transaction reference"
          value={payment?.transaction_reference ?? "Reference not recorded"}
        />
      </div>
      <StatusCallout tone="locked" title="Confirmation is next">
        No customer action is available while the booking is waiting for
        canonical confirmation.
      </StatusCallout>
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
  return (
    <section
      className="booking-detail-section"
      aria-labelledby="confirmed-title"
    >
      <h2 id="confirmed-title">Scheduled pickup</h2>
      <FactTable
        rows={[
          [CalendarDays, "Date and time", formatInstant(booking.pickup_at)],
          [MapPin, "Pickup at", booking.pickup_branch?.name ?? "Not recorded"],
          [CarFront, "Service", serviceLabel(booking)],
        ]}
      />
      <StatusCallout tone="info" title="Scheduled details only">
        This confirms your booking schedule. It does not mean the vehicle is
        ready for pickup before the scheduled time.
      </StatusCallout>
      <h2>Trip details</h2>
      <FactTable
        rows={[
          [CalendarDays, "Rental return", formatInstant(booking.return_at)],
          [
            MapPin,
            "Return branch",
            booking.return_branch?.name ?? "Not recorded",
          ],
          [MapPin, "Destination", booking.destination ?? "Not recorded"],
        ]}
      />
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
  return (
    <section
      className="booking-detail-section"
      aria-labelledby="active-rental-title"
    >
      <h2 id="active-rental-title">Scheduled return</h2>
      <FactTable
        rows={[
          [
            CalendarDays,
            "Date and time",
            formatInstant(booking.rental?.scheduled_return_at),
          ],
          [MapPin, "Return to", booking.return_branch?.name ?? "Not recorded"],
          [Clock3, "Status", "Return is scheduled"],
        ]}
      />
      <h2>Rental details</h2>
      <FactTable
        rows={[
          [
            CalendarDays,
            "Actual start",
            formatInstant(booking.rental?.started_at),
          ],
          [CalendarDays, "Scheduled pickup", formatInstant(booking.pickup_at)],
          [CarFront, "Vehicle", vehicle?.name ?? "Vehicle details unavailable"],
          [
            MapPin,
            "Return branch",
            booking.return_branch?.name ?? "Not recorded",
          ],
        ]}
      />
      <p className="booking-inline-note">
        The customer rental view does not include tracking, emergency tooling,
        or extension controls.
      </p>
      <Link className="customer-link" to="/customer">
        Back to My Bookings <ArrowRight size={18} aria-hidden="true" />
      </Link>
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
  return (
    <section
      className="booking-detail-section"
      aria-labelledby="returned-title"
    >
      <h2 id="returned-title">Return details</h2>
      <FactTable
        rows={[
          [
            CalendarDays,
            "Actual return",
            formatInstant(booking.rental?.ended_at),
          ],
          [
            CalendarDays,
            "Scheduled return",
            formatInstant(booking.rental?.scheduled_return_at),
          ],
          [
            MapPin,
            "Return branch",
            booking.return_branch?.name ?? "Not recorded",
          ],
          [Clock3, "Actual start", formatInstant(booking.rental?.started_at)],
        ]}
      />
      <StatusCallout tone="info" title="Return recorded">
        This status does not confirm settlement, final charges, or booking
        completion.
      </StatusCallout>
      <h2>Trip summary</h2>
      <FactTable
        rows={[
          [CarFront, "Vehicle", vehicle?.name ?? "Vehicle details unavailable"],
          [
            MapPin,
            "Pickup branch",
            booking.pickup_branch?.name ?? "Not recorded",
          ],
          [
            CalendarDays,
            "Rental period",
            formatDateRange(booking.pickup_at, booking.return_at),
          ],
        ]}
      />
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
  return type === "Valid Government ID"
    ? { outcome: review.governmentIdOutcome, reason: review.governmentIdReason }
    : {
        outcome: review.driversLicenseOutcome,
        reason: review.driversLicenseReason,
      };
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
