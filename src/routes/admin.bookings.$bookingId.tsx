import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  Gauge,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  Btn,
  Card,
  CardHeader,
  DomainStatus,
  EmptyState,
  ErrorState,
  PageHeader,
  TInput,
  TSelect,
} from "@/components/admin/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminSession } from "@/lib/admin-auth";
import { bookingActionAvailability } from "@/lib/admin-slice-1";
import {
  exactAdminEntity,
  formatAdminDateTime,
  formatAdminDateRange,
  formatAdminMoney,
  requirementReviewGate,
  rentalState,
  statusTone,
  type AdminBooking,
  type AdminRequirementDocument,
  type AdminRequirementReview,
  type AdminPayment,
  type AdminRequirementsResponse,
  type AdminVehicle,
} from "@/lib/admin-presentations";
import { parseAdminBookingResponse } from "@/lib/booking-retrieval";

export const Route = createFileRoute("/admin/bookings/$bookingId")({
  component: BookingDetailPage,
});

type DetailData = {
  booking: AdminBooking;
  candidates: AdminVehicle[];
  bookings: AdminBooking[];
  requirements: AdminRequirementsResponse | null;
  payments: AdminPayment[] | null;
  failures: string[];
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not-found" }
  | { status: "ready"; data: DetailData };

type Feedback = { tone: "error" | "success" | "info"; message: string };

const FUEL_OPTIONS = ["Full", "3/4", "1/2", "1/4", "Empty", "Other/Unknown"];

function BookingDetailSkeleton() {
  const stages = [
    ["Booking request", "Trip details and the requested vehicle are recorded."],
    ["Requirements review", "Verify customer documents and eligibility."],
    ["Payment", "Review the customer’s submitted payment proof."],
    ["Release", "Prepare the requested vehicle and start the rental."],
    ["Return", "Record the vehicle return and close the rental."],
  ];

  return (
    <div
      aria-busy="true"
      aria-label="Loading booking detail"
      className="admin-booking-detail-page admin-booking-detail-skeleton"
      role="status"
    >
      <span className="sr-only">Loading booking detail</span>
      <header className="admin-booking-detail-page__header">
        <div className="admin-booking-detail-skeleton__header-copy">
          <i className="admin-booking-detail-skeleton__back" />
          <i className="admin-booking-detail-skeleton__title" />
          <i className="admin-booking-detail-skeleton__meta" />
        </div>
        <div className="admin-booking-detail-skeleton__header-status">
          <i />
          <i />
        </div>
      </header>

      <div className="admin-booking-ledger">
        <div className="admin-booking-ledger__left">
          <section className="admin-booking-ledger__main">
            <header className="admin-booking-ledger__heading">
              <div className="admin-booking-detail-skeleton__ledger-heading">
                <i />
                <i />
              </div>
              <i className="admin-booking-detail-skeleton__status-line" />
            </header>
            {stages.map(([title, detail], index) => (
              <section
                className={`admin-booking-ledger__stage${index === 2 ? " is-active" : ""}`}
                key={title}
              >
                <span className="admin-booking-ledger__number">
                  {index + 1}
                </span>
                <div className="admin-booking-detail-skeleton__stage-copy">
                  <i />
                  <i />
                  {index === 2 ? (
                    <div className="admin-booking-detail-skeleton__stage-body">
                      <i />
                      <i />
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
          </section>

          <section className="admin-booking-activity-card admin-booking-detail-skeleton__activity">
            <header>
              <i />
              <i />
            </header>
            <ol className="admin-booking-timeline">
              {[0, 1, 2, 3].map((item) => (
                <li key={item}>
                  <span className="admin-booking-timeline__dot" />
                  <i className="admin-booking-detail-skeleton__time" />
                  <div>
                    <i />
                    <i />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="admin-booking-ledger__side">
          <section className="admin-booking-ledger__details">
            <header>
              <i className="admin-booking-detail-skeleton__details-title" />
              <i className="admin-booking-detail-skeleton__reference" />
            </header>
            <div className="admin-booking-detail-skeleton__vehicle">
              <i />
              <div>
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="admin-booking-detail-skeleton__facts">
              {[0, 1, 2, 3, 4].map((item) => (
                <div key={item}>
                  <i />
                  <i />
                </div>
              ))}
            </div>
          </section>
          <section className="admin-booking-detail-skeleton__customer">
            <header>
              <i />
              <i />
            </header>
            <div>
              <i className="admin-booking-detail-skeleton__avatar" />
              <span>
                <i />
                <i />
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function BookingDetailPage() {
  const { bookingId } = Route.useParams();
  const ownerView = getAdminSession()?.role === "Owner/Admin";
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [releaseOdometer, setReleaseOdometer] = useState("");
  const [releaseFuelLevel, setReleaseFuelLevel] = useState("Other/Unknown");
  const [releaseConditionSummary, setReleaseConditionSummary] = useState("");
  const [existingDamageNotes, setExistingDamageNotes] = useState("");
  const [agreementAcknowledged, setAgreementAcknowledged] = useState(false);
  const [conditionAcknowledged, setConditionAcknowledged] = useState(false);
  const [returnScheduleAcknowledged, setReturnScheduleAcknowledged] =
    useState(false);
  const [returnOdometer, setReturnOdometer] = useState("");
  const [returnFuelLevel, setReturnFuelLevel] = useState("Other/Unknown");
  const [returnConditionSummary, setReturnConditionSummary] = useState("");
  const [observedDamageNotes, setObservedDamageNotes] = useState("");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setFeedback(null);
    try {
      const response = await fetch("/api/bookings?includeDraft=1", {
        credentials: "same-origin",
      });
      const parsed = await parseAdminBookingResponse(response, {
        allowStaffResponse: true,
      });
      const bookings = parsed.bookings as AdminBooking[];
      const booking = exactAdminEntity(bookings, bookingId);
      if (!booking) {
        setState({ status: "not-found" });
        return;
      }

      const candidates = parsed.candidateVehicles as AdminVehicle[];
      let requirements: AdminRequirementsResponse | null = null;
      let payments: AdminPayment[] | null = null;
      const failures: string[] = [];
      if (ownerView) {
        const results = await Promise.allSettled([
          fetch(
            `/api/requirements?bookingId=${encodeURIComponent(bookingId)}`,
            {
              credentials: "same-origin",
            },
          ),
          fetch(`/api/payments?bookingId=${encodeURIComponent(bookingId)}`, {
            credentials: "same-origin",
          }),
        ]);
        const requirementsResult = results[0];
        if (requirementsResult?.status === "fulfilled") {
          const body = (await requirementsResult.value
            .json()
            .catch(() => null)) as
            | AdminRequirementsResponse
            | { message?: string }
            | null;
          if (
            !requirementsResult.value.ok ||
            !body ||
            !("requiredTypes" in body)
          )
            failures.push(
              body && "message" in body && body.message
                ? body.message
                : "Requirements are unavailable.",
            );
          else if (
            body.requirementSet &&
            body.requirementSet.booking_id !== bookingId
          )
            failures.push(
              "Requirements could not be matched to this exact booking.",
            );
          else requirements = body;
        } else failures.push("Requirements are unavailable.");

        const paymentsResult = results[1];
        if (paymentsResult?.status === "fulfilled") {
          const body = (await paymentsResult.value
            .json()
            .catch(() => null)) as {
            payments?: AdminPayment[];
            message?: string;
          } | null;
          if (
            !paymentsResult.value.ok ||
            !body ||
            !Array.isArray(body.payments)
          )
            failures.push(body?.message ?? "Payment status is unavailable.");
          else if (
            body.payments.some((payment) => payment.booking_id !== bookingId)
          )
            failures.push(
              "Payment records could not be matched to this exact booking.",
            );
          else payments = body.payments;
        } else failures.push("Payment status is unavailable.");
      }
      setState({
        status: "ready",
        data: {
          booking,
          candidates,
          bookings,
          requirements,
          payments,
          failures,
        },
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load this booking.",
      });
    }
  }, [bookingId, ownerView]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return <BookingDetailSkeleton />;
  }
  if (state.status === "error") {
    return (
      <div>
        <PageHeader
          title="Booking detail"
          subtitle="The booking workspace could not be loaded."
        />
        <Card>
          <ErrorState message={state.message} onRetry={() => void load()} />
        </Card>
      </div>
    );
  }
  if (state.status === "not-found") {
    return (
      <div>
        <PageHeader
          title="Booking detail"
          subtitle="The requested booking is not available."
        />
        <Card>
          <EmptyState
            title="Booking not found"
            description="No requirements, payment records, or actions were opened because this exact booking is not present in the authorized booking response."
            action={
              <Link
                to="/admin/bookings"
                className="touch-target inline-flex items-center font-semibold text-primary underline underline-offset-4"
              >
                Back to bookings
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const { booking, requirements, payments, failures } = state.data;
  const payment = payments?.length === 1 ? payments[0] : null;
  const ambiguousPayments = (payments?.length ?? 0) > 1;
  const requirementStatus = booking.requirement_status ?? "Unavailable";
  const paymentStatus = booking.payment_status ?? "Unavailable";
  const currentStage = currentLedgerStage({
    booking,
    requirementStatus,
    paymentStatus,
  });
  const actions = bookingActionAvailability({
    role: ownerView ? "Owner/Admin" : "Operations Staff",
    bookingStatus: booking.booking_status,
    assignedVehicle: Boolean(booking.assigned_vehicle_id),
    assignedAt: Boolean(booking.assigned_at),
    confirmedAt: Boolean(booking.confirmed_at),
    requirementsStatus: requirementStatus,
    paymentStatus,
    hasRental: Boolean(booking.rental),
    rentalActive: Boolean(
      booking.rental?.id &&
      booking.rental.started_at &&
      !booking.rental.ended_at,
    ),
    selectedVehicle: Boolean(booking.requested_vehicle_id),
    selectedVehicleConflict: false,
  });
  const canConfirm =
    actions.confirm ||
    (booking.booking_status === "Submitted" &&
      requirementStatus === "Verified" &&
      paymentStatus === "Verified");
  const canRelease = actions.release;
  const canReturn = actions.return;

  async function postBookingAction(
    action: "assign" | "confirm" | "release" | "return",
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusyAction(action);
    setFeedback(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, bookingId, ...body }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok)
        throw new Error(
          response.status === 409
            ? (payload?.message ??
                "Booking state changed; reload before trying again.")
            : (payload?.message ?? "Unable to update this booking."),
        );
      await load();
      setFeedback({ tone: "success", message: successMessage });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update this booking.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="admin-booking-detail-page">
      <header className="admin-booking-detail-page__header">
        <div>
          <a href="/admin/bookings" className="touch-target">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Bookings
          </a>
          <h1>{booking.customer?.full_name ?? "Booking detail"}</h1>
          <p>
            {bookingReferenceLabel(booking.id)} <span />{" "}
            {formatAdminDateRange(booking.pickup_at, booking.return_at)}
          </p>
        </div>
        <div className="admin-booking-detail-page__status">
          <DomainStatus
            label={booking.booking_status}
            tone={statusTone(booking.booking_status)}
          />
          <time>Submitted {formatAdminDateTime(booking.created_at)}</time>
        </div>
      </header>

      {ownerView && failures.length > 0 ? (
        <div
          className="mb-5 flex items-start gap-3 rounded-lg border border-[#d6e3ed] bg-[#f2f8fc] px-4 py-3 text-sm text-[#2e647b]"
          role="status"
          aria-live="polite"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            Some review sources are unavailable. Booking lifecycle context
            remains visible; review actions are limited until their source is
            restored.
          </span>
          <Btn
            variant="ghost"
            className="ml-auto -my-1"
            onClick={() => void load()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Btn>
        </div>
      ) : null}
      {feedback ? (
        <div
          className={`mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${feedback.tone === "error" ? "border-[#edc9c5] bg-[#fff5f3] text-[#8d302f]" : feedback.tone === "success" ? "border-[#b9d9c8] bg-[#f1faf4] text-[#267a55]" : "border-[#d6e3ed] bg-[#f2f8fc] text-[#2e647b]"}`}
          role={feedback.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <span>{feedback.message}</span>
          {feedback.tone === "error" &&
          feedback.message.toLowerCase().includes("reload") ? (
            <Btn
              variant="ghost"
              className="ml-auto -my-1"
              onClick={() => void load()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload
            </Btn>
          ) : null}
        </div>
      ) : null}

      <div className="admin-booking-ledger">
        <div className="admin-booking-ledger__left">
          <section
            className="admin-booking-ledger__main"
            aria-labelledby="approval-ledger-title"
          >
            <header className="admin-booking-ledger__heading">
              <div>
                <h2 id="approval-ledger-title">Approval ledger</h2>
                <p>Track and complete each step to fulfill this booking.</p>
              </div>
              <DomainStatus
                label={booking.booking_status}
                tone={statusTone(booking.booking_status)}
              />
            </header>
            <LedgerStage
              number={1}
              title="Booking request"
              status={
                booking.booking_status === "Draft"
                  ? "Awaiting documents"
                  : "Submitted"
              }
              detail="Trip details and the requested vehicle are recorded."
              active={currentStage === 1}
              expanded={
                expandedStage === null
                  ? currentStage === 1
                  : expandedStage === 1
              }
              onToggle={() => setExpandedStage(expandedStage === 1 ? null : 1)}
            >
              <p className="admin-booking-ledger__empty">
                The customer selected this vehicle. The request appears here
                immediately while documents are still being prepared.
              </p>
            </LedgerStage>
            <LedgerStage
              number={2}
              title="Requirements review"
              status={requirementStatus}
              detail="Verify customer documents and eligibility."
              active={currentStage === 2}
              expanded={
                expandedStage === null
                  ? currentStage === 2
                  : expandedStage === 2
              }
              onToggle={() => setExpandedStage(expandedStage === 2 ? null : 2)}
            >
              {ownerView && requirements ? (
                <BookingRequirementsReview
                  bookingId={bookingId}
                  requirements={requirements}
                  onRefresh={load}
                  embedded
                />
              ) : (
                <p className="admin-booking-ledger__empty">
                  Requirement review is unavailable for this exact booking.
                </p>
              )}
            </LedgerStage>
            <LedgerStage
              number={3}
              title="Payment"
              status={paymentStatus}
              detail="Review the customer’s submitted payment proof."
              active={currentStage === 3}
              expanded={
                expandedStage === null
                  ? currentStage === 3
                  : expandedStage === 3
              }
              onToggle={() => setExpandedStage(expandedStage === 3 ? null : 3)}
            >
              <div className="admin-booking-ledger__action">
                <p className="admin-booking-ledger__empty">
                  Payment is available after the requirements review is
                  verified.
                </p>
                {payment ? (
                  <Link
                    to="/admin/payments/$paymentId"
                    params={{ paymentId: payment.id }}
                    search={{ fromBooking: bookingId } as never}
                    className="touch-target admin-booking-ledger__payment-link"
                  >
                    Review {payment.booking?.customer?.full_name ?? "customer"}
                    's payment
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
                {ownerView && canConfirm ? (
                  <Btn
                    variant="primary"
                    disabled={busyAction !== null}
                    onClick={() =>
                      void postBookingAction(
                        "confirm",
                        {},
                        "Booking confirmed. The requested vehicle was reserved automatically.",
                      )
                    }
                  >
                    {busyAction === "confirm"
                      ? "Confirming…"
                      : "Confirm rental"}
                  </Btn>
                ) : null}
              </div>
            </LedgerStage>
            <LedgerStage
              number={4}
              title="Release"
              status={booking.rental?.started_at ? "Released" : "Not started"}
              detail="Prepare the requested vehicle and start the rental."
              active={currentStage === 4}
              expanded={
                expandedStage === null
                  ? currentStage === 4
                  : expandedStage === 4
              }
              onToggle={() => setExpandedStage(expandedStage === 4 ? null : 4)}
            />
            <LedgerStage
              number={5}
              title="Return"
              status={rentalState(booking)}
              detail="Record the vehicle return and close the rental."
              active={currentStage === 5}
              expanded={
                expandedStage === null
                  ? currentStage === 5
                  : expandedStage === 5
              }
              onToggle={() => setExpandedStage(expandedStage === 5 ? null : 5)}
            />
            {ownerView &&
            (canRelease ||
              canReturn ||
              (booking.booking_status === "Confirmed" && !booking.rental) ||
              Boolean(booking.rental && !booking.rental.ended_at)) ? (
              <div className="admin-booking-ledger__operational">
                <OwnerActionArea
                  booking={booking}
                  canConfirm={canConfirm}
                  canRelease={canRelease}
                  canReturn={canReturn}
                  releaseOdometer={releaseOdometer}
                  setReleaseOdometer={setReleaseOdometer}
                  releaseFuelLevel={releaseFuelLevel}
                  setReleaseFuelLevel={setReleaseFuelLevel}
                  releaseConditionSummary={releaseConditionSummary}
                  setReleaseConditionSummary={setReleaseConditionSummary}
                  existingDamageNotes={existingDamageNotes}
                  setExistingDamageNotes={setExistingDamageNotes}
                  agreementAcknowledged={agreementAcknowledged}
                  setAgreementAcknowledged={setAgreementAcknowledged}
                  conditionAcknowledged={conditionAcknowledged}
                  setConditionAcknowledged={setConditionAcknowledged}
                  returnScheduleAcknowledged={returnScheduleAcknowledged}
                  setReturnScheduleAcknowledged={setReturnScheduleAcknowledged}
                  returnOdometer={returnOdometer}
                  setReturnOdometer={setReturnOdometer}
                  returnFuelLevel={returnFuelLevel}
                  setReturnFuelLevel={setReturnFuelLevel}
                  returnConditionSummary={returnConditionSummary}
                  setReturnConditionSummary={setReturnConditionSummary}
                  observedDamageNotes={observedDamageNotes}
                  setObservedDamageNotes={setObservedDamageNotes}
                  returnRemarks={returnRemarks}
                  setReturnRemarks={setReturnRemarks}
                  busyAction={busyAction}
                  onAction={postBookingAction}
                />
              </div>
            ) : null}
            {!ownerView ? <StaffReadOnlyCard /> : null}
          </section>
          <div className="admin-booking-detail-page__activity">
            <ActivityCard booking={booking} />
          </div>
        </div>
        <aside className="admin-booking-ledger__side">
          <BookingLedgerDetails booking={booking} />
          <CustomerCard booking={booking} staffView={!ownerView} />
        </aside>
      </div>
    </div>
  );
}

type RequirementReviewStatus =
  | "Pending Review"
  | "Needs Resubmission"
  | "Verified";

function BookingRequirementsReview({
  bookingId,
  requirements,
  onRefresh,
  embedded = false,
}: {
  bookingId: string;
  requirements: AdminRequirementsResponse;
  onRefresh: () => Promise<void>;
  embedded?: boolean;
}) {
  const requirementSet = requirements.requirementSet;
  const documents = requirements.requiredTypes
    .map((type) =>
      requirements.documents.find(
        (document) =>
          document.requirement_type === type && document.is_current !== false,
      ),
    )
    .filter((document): document is AdminRequirementDocument =>
      Boolean(document),
    );
  const review = requirements.reviews?.[0] ?? null;
  const hasBothDocuments = requirements.requiredTypes.every((type) =>
    documents.some((document) => document.requirement_type === type),
  );
  const canReview =
    requirementSet?.status === "Pending Review" && hasBothDocuments;
  const [governmentIdOutcome, setGovernmentIdOutcome] = useState("");
  const [governmentIdReason, setGovernmentIdReason] = useState("");
  const [driversLicenseOutcome, setDriversLicenseOutcome] = useState("");
  const [driversLicenseReason, setDriversLicenseReason] = useState("");
  const [identityConsistency, setIdentityConsistency] = useState("");
  const [ltoOutcome, setLtoOutcome] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewDocument, setPreviewDocument] =
    useState<AdminRequirementDocument | null>(null);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setGovernmentIdOutcome(review?.government_id_outcome ?? "");
    setGovernmentIdReason(review?.government_id_reason ?? "");
    setDriversLicenseOutcome(review?.drivers_license_outcome ?? "");
    setDriversLicenseReason(review?.drivers_license_reason ?? "");
    setIdentityConsistency(review?.identity_consistency ?? "");
    setLtoOutcome(review?.lto_outcome ?? "");
    setMessage(null);
  }, [review]);

  const gate = requirementReviewGate({
    governmentIdOutcome,
    driversLicenseOutcome,
    identityConsistency,
    ltoOutcome,
  });

  async function saveReview(resultingStatus: RequirementReviewStatus) {
    if (!requirementSet || !canReview) return;
    if (
      !governmentIdOutcome ||
      !driversLicenseOutcome ||
      !identityConsistency ||
      !ltoOutcome
    ) {
      setMessage({
        tone: "error",
        text: "Complete every review outcome before saving.",
      });
      return;
    }
    if (resultingStatus === "Verified" && !gate.canVerify) {
      setMessage({
        tone: "error",
        text: "Verification requires accepted documents, consistent identity, and an LTO Clear result.",
      });
      return;
    }
    if (
      resultingStatus === "Needs Resubmission" &&
      (!gate.canResubmit ||
        (!governmentIdReason.trim() && !driversLicenseReason.trim()))
    ) {
      setMessage({
        tone: "error",
        text: "A replacement decision needs a flagged document and customer-facing reason.",
      });
      return;
    }
    const governmentId = documents.find(
      (document) => document.requirement_type === "Valid Government ID",
    );
    const driversLicense = documents.find(
      (document) => document.requirement_type === "Driver's License",
    );
    if (!governmentId || !driversLicense) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/requirements", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          requirementSetId: requirementSet.id,
          governmentIdDocumentId: governmentId.id,
          governmentIdVersion: governmentId.version,
          governmentIdOutcome,
          governmentIdReason: governmentIdReason.trim(),
          driversLicenseDocumentId: driversLicense.id,
          driversLicenseVersion: driversLicense.version,
          driversLicenseOutcome,
          driversLicenseReason: driversLicenseReason.trim(),
          identityConsistency,
          ltoOutcome,
          resultingStatus,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok)
        throw new Error(
          body?.message ?? "Unable to save the requirements review.",
        );
      await onRefresh();
      setMessage({
        tone: "success",
        text:
          resultingStatus === "Verified"
            ? "Requirements verified. Payment is now available to the customer."
            : "Requirements returned for correction. The customer must replace the flagged document before this request returns to review.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save the requirements review.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={
        embedded
          ? "admin-booking-ledger__requirements"
          : "mb-5 rounded-xl border border-border bg-card"
      }
    >
      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`mx-5 mt-5 rounded-md border px-3 py-2 text-sm ${message.tone === "error" ? "border-[#edc9c5] bg-[#fff5f3] text-[#8d302f]" : "border-[#b9d9c8] bg-[#f1faf4] text-[#267a55]"}`}
        >
          {message.text}
        </p>
      ) : null}
      {!requirementSet ? (
        <EmptyState
          title="Requirements not submitted"
          description="The customer has saved trip details but has not submitted documents, so this request is not in the admin approval queue."
        />
      ) : (
        <div className="admin-booking-ledger__review">
          <div className="admin-booking-ledger__review-header">
            <div>
              <h4>Submitted documents</h4>
              <p>
                Review submitted documents and approve or request correction.
              </p>
            </div>
            {canReview && !reviewOpen ? (
              <Btn variant="primary" onClick={() => setReviewOpen(true)}>
                Review requirements
              </Btn>
            ) : null}
          </div>
          <div className="admin-booking-ledger__documents">
            {requirements.requiredTypes.map((type) => {
              const document = documents.find(
                (item) => item.requirement_type === type,
              );
              return (
                <div key={type} className="admin-booking-ledger__document">
                  <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <strong>{type}</strong>
                    <small>
                      {document
                        ? `${document.original_filename} · v${document.version}`
                        : "No current document"}
                    </small>
                  </div>
                  {document ? (
                    <>
                      <DomainStatus label="Submitted" tone="success" compact />
                      <time>{formatAdminDateTime(document.uploaded_at)}</time>
                      <button
                        type="button"
                        onClick={() => setPreviewDocument(document)}
                        className="touch-target"
                      >
                        Preview
                      </button>
                    </>
                  ) : (
                    <DomainStatus label="Missing" tone="locked" compact />
                  )}
                </div>
              );
            })}
          </div>
          {!canReview ? (
            <p className="admin-booking-ledger__review-note">
              {requirementSet.status === "Needs Resubmission"
                ? "The request is back with the customer for correction. It returns here after replacement documents are submitted."
                : "All submitted documents have been reviewed for this request."}
            </p>
          ) : null}
          {canReview && reviewOpen ? (
            <div className="admin-booking-ledger__review-form">
              <fieldset disabled={saving} className="grid gap-3">
                <RequirementOutcomeSelect
                  id="booking-government-id-outcome"
                  label="Government ID"
                  value={governmentIdOutcome}
                  onChange={setGovernmentIdOutcome}
                  options={["Accepted", "Needs Replacement"]}
                />
                {governmentIdOutcome === "Needs Replacement" ? (
                  <label className="text-sm font-medium">
                    Government ID reason
                    <TInput
                      value={governmentIdReason}
                      onChange={(event) =>
                        setGovernmentIdReason(event.target.value)
                      }
                      className="mt-2"
                      placeholder="Tell the customer what needs replacing"
                    />
                  </label>
                ) : null}
                <RequirementOutcomeSelect
                  id="booking-license-outcome"
                  label="Driver's License"
                  value={driversLicenseOutcome}
                  onChange={setDriversLicenseOutcome}
                  options={["Accepted", "Needs Replacement"]}
                />
                {driversLicenseOutcome === "Needs Replacement" ? (
                  <label className="text-sm font-medium">
                    Driver's License reason
                    <TInput
                      value={driversLicenseReason}
                      onChange={(event) =>
                        setDriversLicenseReason(event.target.value)
                      }
                      className="mt-2"
                      placeholder="Tell the customer what needs replacing"
                    />
                  </label>
                ) : null}
                <RequirementOutcomeSelect
                  id="booking-identity-outcome"
                  label="Identity consistency"
                  value={identityConsistency}
                  onChange={setIdentityConsistency}
                  options={["Consistent", "Concern"]}
                />
                <RequirementOutcomeSelect
                  id="booking-lto-outcome"
                  label="LTO outcome"
                  value={ltoOutcome}
                  onChange={setLtoOutcome}
                  options={["Not Checked", "Clear", "Concern", "Unavailable"]}
                />
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <Btn
                  variant={gate.canResubmit ? "danger" : "primary"}
                  disabled={saving || (!gate.canVerify && !gate.canResubmit)}
                  onClick={() =>
                    void saveReview(
                      gate.canResubmit ? "Needs Resubmission" : "Verified",
                    )
                  }
                >
                  {saving
                    ? "Saving…"
                    : gate.canResubmit
                      ? "Request replacement"
                      : "Verify requirements"}
                </Btn>
              </div>
            </div>
          ) : null}
        </div>
      )}
      {previewDocument ? (
        <AdminDocumentPreview
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      ) : null}
    </div>
  );
}

function AdminDocumentPreview({
  document,
  onClose,
}: {
  document: AdminRequirementDocument;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    void fetch(
      `/api/requirements?documentId=${encodeURIComponent(document.id)}`,
      { credentials: "same-origin" },
    )
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as {
          url?: string;
          message?: string;
        } | null;
        if (!response.ok || !body?.url)
          throw new Error(
            body?.message ??
              "This document is not available for secure preview.",
          );
        if (!cancelled) setUrl(body.url);
      })
      .catch((cause) => {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : "This document is not available for secure preview.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [document.id]);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-[#d8d5cc] px-6 py-5 pr-14">
          <DialogTitle>Document preview</DialogTitle>
          <DialogDescription>
            {document.original_filename} ·{" "}
            {(document.size_bytes / 1024).toFixed(0)} KB
          </DialogDescription>
        </DialogHeader>
        <div className="booking-document-preview-frame">
          {error ? (
            <p className="p-6 text-sm text-red-700">{error}</p>
          ) : !url ? (
            <p className="p-6 text-sm text-muted-foreground">
              Loading secure document preview…
            </p>
          ) : document.mime_type === "application/pdf" ? (
            <iframe
              className="h-[72vh] w-full"
              title={`Preview of ${document.original_filename}`}
              src={url}
            />
          ) : (
            <img
              className="booking-document-preview-image"
              src={url}
              alt={`Preview of ${document.original_filename}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LedgerStage({
  number,
  title,
  status,
  detail,
  active = false,
  expanded = false,
  onToggle,
  children,
}: {
  number: number;
  title: string;
  status: string;
  detail: string;
  active?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
}) {
  const canExpand = Boolean(children);
  return (
    <section
      className={`admin-booking-ledger__stage${active ? " is-active" : ""}${expanded ? " is-expanded" : ""}`}
    >
      <span className="admin-booking-ledger__number" aria-hidden="true">
        {number}
      </span>
      <button
        type="button"
        className="admin-booking-ledger__stage-copy"
        onClick={canExpand ? onToggle : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        disabled={!canExpand}
      >
        <div>
          <h3>{title}</h3>
          <p>{detail}</p>
        </div>
        <span className="admin-booking-ledger__stage-status">
          <DomainStatus label={status} tone={statusTone(status)} compact />
          {canExpand ? (
            <span aria-hidden="true">{expanded ? "−" : "+"}</span>
          ) : null}
        </span>
      </button>
      {children && expanded ? (
        <div className="admin-booking-ledger__stage-body">{children}</div>
      ) : null}
    </section>
  );
}

function currentLedgerStage({
  booking,
  requirementStatus,
  paymentStatus,
}: {
  booking: AdminBooking;
  requirementStatus: string;
  paymentStatus: string;
}) {
  if (booking.rental?.ended_at) return 5;
  if (booking.rental?.started_at || booking.booking_status === "Confirmed")
    return 4;
  if (
    paymentStatus === "Pending Verification" ||
    paymentStatus === "Needs Resubmission" ||
    requirementStatus === "Verified"
  )
    return 3;
  if (
    requirementStatus === "Pending Review" ||
    requirementStatus === "Needs Resubmission"
  )
    return 2;
  return 1;
}

function BookingLedgerDetails({ booking }: { booking: AdminBooking }) {
  const vehicle = booking.requested_vehicle;
  const isDelivery = booking.pickup_delivery_option === "delivery";
  const deliveryAddress = booking.pickup_location?.trim();
  const returnAddress = booking.dropoff_location?.trim();
  const returnsToDeliveryAddress =
    isDelivery &&
    Boolean(deliveryAddress) &&
    Boolean(returnAddress) &&
    deliveryAddress?.localeCompare(returnAddress ?? "", undefined, {
      sensitivity: "accent",
    }) === 0;
  return (
    <section
      className="admin-booking-ledger__details"
      aria-labelledby="booking-details-title"
    >
      <header>
        <h2 id="booking-details-title">Booking details</h2>
        <span>{bookingReferenceLabel(booking.id).replace("Booking ", "")}</span>
      </header>
      <div className="admin-booking-ledger__vehicle">
        <div className="admin-booking-ledger__vehicle-image">
          {vehicle?.image_url ? (
            <img src={vehicle.image_url} alt={vehicle.name} />
          ) : (
            <CarFront aria-label="Vehicle image unavailable" />
          )}
        </div>
        <div>
          <p>Requested vehicle</p>
          <h3>{vehicle?.name ?? "Vehicle unavailable"}</h3>
          <strong>{vehicle?.license_plate ?? "Plate unavailable"}</strong>
          <dl>
            <div>
              <CarFront aria-hidden="true" />
              <span>{vehicle?.category?.name ?? "Vehicle"}</span>
            </div>
            <div>
              <Gauge aria-hidden="true" />
              <span>
                {vehicle?.transmission ?? "Transmission not recorded"}
              </span>
            </div>
            <div>
              <UserRound aria-hidden="true" />
              <span>
                {vehicle?.seat_capacity
                  ? `${vehicle.seat_capacity} seats`
                  : booking.preferred_seat_count
                    ? `${booking.preferred_seat_count} seats`
                    : "Seats not recorded"}
              </span>
            </div>
          </dl>
        </div>
      </div>
      <dl className="admin-booking-ledger__facts">
        <DetailField
          icon={<CalendarDays />}
          label="Rental period"
          value={formatAdminDateRange(booking.pickup_at, booking.return_at)}
        />
        <DetailField
          icon={<Clock3 />}
          label="Pickup date & time"
          value={formatAdminDateTime(booking.pickup_at)}
        />
        <DetailField
          icon={<Clock3 />}
          label="Return date & time"
          value={formatAdminDateTime(booking.return_at)}
        />
        <DetailField
          label="Service"
          value={isDelivery ? "Delivery" : "Collection service"}
        />
        {isDelivery ? (
          <>
            <DetailField
              icon={<MapPin />}
              label="Dispatch branch"
              value={booking.pickup_branch?.name ?? "Location unavailable"}
            />
            <DetailField
              icon={<MapPin />}
              label="Delivery address"
              value={deliveryAddress || "Not recorded"}
            />
            <DetailField
              icon={<MapPin />}
              label="Return arrangement"
              value={
                returnsToDeliveryAddress
                  ? "Same as delivery address"
                  : "Custom return address"
              }
            />
            {!returnsToDeliveryAddress ? (
              <DetailField
                icon={<MapPin />}
                label="Return address"
                value={returnAddress || "Not recorded"}
              />
            ) : null}
          </>
        ) : (
          <>
            <DetailField
              icon={<MapPin />}
              label="Pickup branch"
              value={booking.pickup_branch?.name ?? "Location unavailable"}
            />
            <DetailField
              icon={<MapPin />}
              label="Return branch"
              value={booking.return_branch?.name ?? "Location unavailable"}
            />
          </>
        )}
        <DetailField
          label="Destination"
          value={booking.destination?.trim() || "Not recorded"}
        />
        <DetailField
          label="Purpose"
          value={booking.purpose_of_use ?? "Not recorded"}
        />
      </dl>
    </section>
  );
}

function RequirementOutcomeSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-sm font-medium" htmlFor={id}>
      <span>{label}</span>
      <TSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2"
      >
        <option value="">Select an outcome…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </TSelect>
    </label>
  );
}

function ActionPriority({
  ownerView,
  booking,
  requirementStatus,
  paymentStatus,
  payment,
  ambiguousPayments,
  requirements,
  canAssign,
  canConfirm,
  canRelease,
  canReturn,
}: {
  ownerView: boolean;
  booking: AdminBooking;
  requirementStatus: string;
  paymentStatus: string;
  payment: AdminPayment | null;
  ambiguousPayments: boolean;
  requirements: AdminRequirementsResponse | null;
  canAssign: boolean;
  canConfirm: boolean;
  canRelease: boolean;
  canReturn: boolean;
}) {
  const action = canReturn
    ? "Record the vehicle return"
    : canRelease
      ? "Release the confirmed rental"
      : canConfirm
        ? "Confirm this booking"
        : canAssign
          ? "Assign a vehicle"
          : booking.booking_status === "Submitted"
            ? "Review assignment and prerequisites"
            : booking.booking_status === "Confirmed" && !booking.rental
              ? "Awaiting rental release"
              : booking.rental && !booking.rental.ended_at
                ? "Rental is active"
                : "No lifecycle action is available";
  return (
    <Card className="mb-5 border-primary/25 bg-[#fbfffd]">
      <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7efec] text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {ownerView ? "Current action" : "Safe operational context"}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
              {ownerView ? action : "Read-only booking workspace"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {ownerView
                ? actionDescription(action, requirementStatus, paymentStatus)
                : "Operations Staff can inspect booking, trip, vehicle, requirement status, payment status, and rental state. Owner/Admin review and lifecycle mutation controls are not available here."}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <DomainStatus
            label={booking.booking_status}
            tone={statusTone(booking.booking_status)}
          />
        </div>
      </div>
      <div className="grid gap-3 border-t border-primary/10 px-5 py-4 text-sm sm:grid-cols-3">
        <CompactState label="Requirements" value={requirementStatus} />
        <CompactState label="Payment" value={paymentStatus} />
        <CompactState label="Rental" value={rentalState(booking)} />
      </div>
      {ownerView ? (
        <div className="border-t border-primary/10 px-5 py-3 text-xs text-muted-foreground">
          {requirements
            ? "Requirement review context loaded for this exact booking."
            : "Requirement review context is unavailable; no document action is offered from this surface."}
          {payment
            ? " Payment record loaded for this exact booking."
            : ambiguousPayments
              ? " Multiple payment records are present; no payment was selected implicitly."
              : " Payment record is unavailable or not submitted."}
        </div>
      ) : null}
    </Card>
  );
}

function BookingRequestCard({ booking }: { booking: AdminBooking }) {
  return (
    <Card>
      <CardHeader
        title="Request and trip"
        hint="Canonical booking fields for this exact request."
      />
      <div className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
        <DetailField
          icon={<CalendarDays />}
          label="Requested schedule"
          value={`${formatAdminDateTime(booking.pickup_at)} – ${formatAdminDateTime(booking.return_at)}`}
        />
        <DetailField
          icon={<MapPin />}
          label="Allocation / return location"
          value={`${booking.pickup_branch?.name ?? "Location unavailable"} → ${booking.return_branch?.name ?? "Location unavailable"}`}
        />
        <DetailField
          icon={<CarFront />}
          label="Requested vehicle"
          value={vehicleLabel(booking.requested_vehicle)}
        />
        <DetailField
          icon={<CarFront />}
          label="Assigned vehicle"
          value={vehicleLabel(booking.assigned_vehicle, "Not assigned")}
        />
        <DetailField
          label="Service"
          value={
            booking.pickup_delivery_option === "delivery"
              ? `Delivery${booking.pickup_location ? ` · ${booking.pickup_location}` : ""}${booking.dropoff_location && booking.dropoff_location !== booking.pickup_location ? ` · Return: ${booking.dropoff_location}` : ""}`
              : "Delivery / collection service"
          }
        />
        <DetailField
          label="Purpose"
          value={booking.purpose_of_use ?? "Not recorded"}
        />
        <DetailField
          label="Destination"
          value={booking.destination ?? "Not recorded"}
        />
      </div>
      {booking.finder_context ? (
        <FinderContextSummary context={booking.finder_context} />
      ) : null}
    </Card>
  );
}

function FinderContextSummary({
  context,
}: {
  context: NonNullable<AdminBooking["finder_context"]>;
}) {
  return (
    <div className="border-t border-border px-5 py-5">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-base font-semibold">Finder context</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Canonical selection context attached to this booking request.
      </p>
      <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        <DetailField
          label="Preferred category"
          value={context.preferred_category?.name ?? "Not recorded"}
        />
        <DetailField
          label="Passengers"
          value={
            context.passenger_count == null
              ? "Not recorded"
              : String(context.passenger_count)
          }
        />
        <DetailField
          label="Maximum budget"
          value={formatAdminMoney(context.maximum_budget) ?? "Not recorded"}
        />
        <DetailField
          label="Destination"
          value={context.destination ?? "Not recorded"}
        />
        <DetailField
          label="Selected vehicle"
          value={context.selected_vehicle?.name ?? "Not recorded"}
        />
      </dl>
    </div>
  );
}

function WorkflowCard({
  booking,
  requirementStatus,
  paymentStatus,
}: {
  booking: AdminBooking;
  requirementStatus: string;
  paymentStatus: string;
}) {
  const stages = [
    {
      label: "Request submitted",
      value: booking.booking_status,
      detail: formatAdminDateTime(booking.created_at),
    },
    {
      label: "Requirements",
      value: requirementStatus,
      detail: "Manual document review",
    },
    { label: "Payment", value: paymentStatus, detail: "Manual payment review" },
    {
      label: "Assignment",
      value: booking.assigned_vehicle ? "Assigned" : "Unassigned",
      detail: booking.assigned_at
        ? formatAdminDateTime(booking.assigned_at)
        : "No assignment recorded",
    },
    {
      label: "Confirmation",
      value: booking.confirmed_at
        ? "Confirmed"
        : booking.booking_status === "Confirmed"
          ? "Confirmed"
          : "Awaiting confirmation",
      detail: booking.confirmed_at
        ? formatAdminDateTime(booking.confirmed_at)
        : "No confirmation recorded",
    },
    {
      label: "Rental release / return",
      value: rentalState(booking),
      detail: booking.rental?.ended_at
        ? formatAdminDateTime(booking.rental.ended_at)
        : booking.rental?.started_at
          ? `Started ${formatAdminDateTime(booking.rental.started_at)}`
          : "No rental transaction started",
    },
  ];
  return (
    <Card>
      <CardHeader
        title="Operational flow"
        hint="Persisted states and safe derived milestones only."
      />
      <ol className="divide-y divide-border">
        {stages.map((stage, index) => (
          <li key={stage.label} className="flex gap-3 px-5 py-4">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold ${stage.value === "Verified" || stage.value === "Confirmed" || stage.value === "Returned" || stage.value === "Active rental" || stage.value === "Assigned" ? "border-[#b9d9c8] bg-[#f1faf4] text-[#267a55]" : "border-border bg-secondary text-muted-foreground"}`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-semibold">{stage.label}</p>
                <DomainStatus
                  label={stage.value}
                  tone={statusTone(stage.value)}
                  compact
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stage.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function ActivityCard({ booking }: { booking: AdminBooking }) {
  const entries = [
    {
      label: "Booking request submitted",
      detail: "Customer request was recorded.",
      value: booking.created_at,
    },
    {
      label: "Booking record updated",
      detail: "Booking details were updated.",
      value: booking.updated_at,
    },
    {
      label: "Vehicle handover scheduled",
      detail: "Pickup or delivery is scheduled.",
      value: booking.pickup_at,
    },
    {
      label: "Vehicle return scheduled",
      detail: "The agreed return is scheduled.",
      value: booking.return_at,
    },
    ...(booking.rental?.started_at
      ? [
          {
            label: "Rental started",
            detail: "Vehicle was released to the customer.",
            value: booking.rental.started_at,
          },
        ]
      : []),
    ...(booking.rental?.ended_at
      ? [
          {
            label: "Rental completed",
            detail: "Vehicle return was recorded.",
            value: booking.rental.ended_at,
          },
        ]
      : []),
  ];
  return (
    <Card className="admin-booking-activity-card">
      <CardHeader
        title="Activity and timing"
        hint="A chronological record of this booking's milestones."
      />
      <ol className="admin-booking-timeline">
        {entries.map((entry) => (
          <li key={entry.label}>
            <span className="admin-booking-timeline__dot" aria-hidden="true" />
            <time dateTime={entry.value}>
              {formatAdminDateTime(entry.value)}
            </time>
            <div>
              <strong>{entry.label}</strong>
              <p>{entry.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function OwnerActionArea({
  booking,
  canConfirm,
  canRelease,
  canReturn,
  releaseOdometer,
  setReleaseOdometer,
  releaseFuelLevel,
  setReleaseFuelLevel,
  releaseConditionSummary,
  setReleaseConditionSummary,
  existingDamageNotes,
  setExistingDamageNotes,
  agreementAcknowledged,
  setAgreementAcknowledged,
  conditionAcknowledged,
  setConditionAcknowledged,
  returnScheduleAcknowledged,
  setReturnScheduleAcknowledged,
  returnOdometer,
  setReturnOdometer,
  returnFuelLevel,
  setReturnFuelLevel,
  returnConditionSummary,
  setReturnConditionSummary,
  observedDamageNotes,
  setObservedDamageNotes,
  returnRemarks,
  setReturnRemarks,
  busyAction,
  onAction,
}: {
  booking: AdminBooking;
  canConfirm: boolean;
  canRelease: boolean;
  canReturn: boolean;
  releaseOdometer: string;
  setReleaseOdometer: (value: string) => void;
  releaseFuelLevel: string;
  setReleaseFuelLevel: (value: string) => void;
  releaseConditionSummary: string;
  setReleaseConditionSummary: (value: string) => void;
  existingDamageNotes: string;
  setExistingDamageNotes: (value: string) => void;
  agreementAcknowledged: boolean;
  setAgreementAcknowledged: (value: boolean) => void;
  conditionAcknowledged: boolean;
  setConditionAcknowledged: (value: boolean) => void;
  returnScheduleAcknowledged: boolean;
  setReturnScheduleAcknowledged: (value: boolean) => void;
  returnOdometer: string;
  setReturnOdometer: (value: string) => void;
  returnFuelLevel: string;
  setReturnFuelLevel: (value: string) => void;
  returnConditionSummary: string;
  setReturnConditionSummary: (value: string) => void;
  observedDamageNotes: string;
  setObservedDamageNotes: (value: string) => void;
  returnRemarks: string;
  setReturnRemarks: (value: string) => void;
  busyAction: string | null;
  onAction: (
    action: "assign" | "confirm" | "release" | "return",
    body: Record<string, unknown>,
    message: string,
  ) => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      {canRelease ||
      (booking.booking_status === "Confirmed" && !booking.rental) ? (
        <Card>
          <CardHeader
            title="Rental release"
            hint="Release starts the canonical rental transaction."
          />
          <div className="space-y-4 px-5 py-5">
            <label
              className="block text-sm font-medium"
              htmlFor="release-odometer"
            >
              <span>Release odometer</span>
              <TInput
                id="release-odometer"
                name="release-odometer"
                type="number"
                min="0"
                value={releaseOdometer}
                onChange={(event) => setReleaseOdometer(event.target.value)}
                className="mt-2"
              />
            </label>
            <label className="block text-sm font-medium" htmlFor="release-fuel">
              <span>Release fuel level</span>
              <TSelect
                id="release-fuel"
                name="release-fuel"
                value={releaseFuelLevel}
                onChange={(event) => setReleaseFuelLevel(event.target.value)}
                className="mt-2"
              >
                {FUEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </TSelect>
            </label>
            <label
              className="block text-sm font-medium"
              htmlFor="release-condition"
            >
              <span>Condition summary</span>
              <TInput
                id="release-condition"
                name="release-condition"
                value={releaseConditionSummary}
                onChange={(event) =>
                  setReleaseConditionSummary(event.target.value)
                }
                placeholder="Required by the release contract"
                className="mt-2"
              />
            </label>
            <label
              className="block text-sm font-medium"
              htmlFor="existing-damage"
            >
              <span>Existing damage notes</span>
              <TInput
                id="existing-damage"
                name="existing-damage"
                value={existingDamageNotes}
                onChange={(event) => setExistingDamageNotes(event.target.value)}
                placeholder="Optional"
                className="mt-2"
              />
            </label>
            <Acknowledgement
              id="agreement-ack"
              checked={agreementAcknowledged}
              onChange={setAgreementAcknowledged}
              label="Rental agreement has been acknowledged."
            />
            <Acknowledgement
              id="condition-ack"
              checked={conditionAcknowledged}
              onChange={setConditionAcknowledged}
              label="Release condition has been acknowledged."
            />
            <Acknowledgement
              id="return-schedule-ack"
              checked={returnScheduleAcknowledged}
              onChange={setReturnScheduleAcknowledged}
              label="Return schedule has been acknowledged."
            />
            <Btn
              variant="primary"
              disabled={
                !canRelease ||
                busyAction !== null ||
                !releaseConditionSummary.trim() ||
                !agreementAcknowledged ||
                !conditionAcknowledged ||
                !returnScheduleAcknowledged
              }
              onClick={() =>
                void onAction(
                  "release",
                  {
                    expectedAssignedVehicleId: booking.assigned_vehicle_id,
                    expectedConfirmedAt: booking.confirmed_at,
                    releaseOdometer: releaseOdometer || null,
                    releaseFuelLevel,
                    releaseConditionSummary,
                    existingDamageNotes,
                    agreementAcknowledged,
                    conditionAcknowledged,
                    returnScheduleAcknowledged,
                  },
                  "Rental released and started.",
                )
              }
            >
              {busyAction === "release"
                ? "Releasing…"
                : "Release / start rental"}
            </Btn>
          </div>
        </Card>
      ) : null}
      {canReturn || (booking.rental && !booking.rental.ended_at) ? (
        <Card>
          <CardHeader
            title="Return"
            hint="Record return against the exact active rental transaction."
          />
          <div className="space-y-4 px-5 py-5">
            <label
              className="block text-sm font-medium"
              htmlFor="return-odometer"
            >
              <span>Return odometer</span>
              <TInput
                id="return-odometer"
                name="return-odometer"
                type="number"
                min="0"
                value={returnOdometer}
                onChange={(event) => setReturnOdometer(event.target.value)}
                className="mt-2"
              />
            </label>
            <label className="block text-sm font-medium" htmlFor="return-fuel">
              <span>Return fuel level</span>
              <TSelect
                id="return-fuel"
                name="return-fuel"
                value={returnFuelLevel}
                onChange={(event) => setReturnFuelLevel(event.target.value)}
                className="mt-2"
              >
                {FUEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </TSelect>
            </label>
            <label
              className="block text-sm font-medium"
              htmlFor="return-condition"
            >
              <span>Return condition summary</span>
              <TInput
                id="return-condition"
                name="return-condition"
                value={returnConditionSummary}
                onChange={(event) =>
                  setReturnConditionSummary(event.target.value)
                }
                placeholder="Required by the return contract"
                className="mt-2"
              />
            </label>
            <label
              className="block text-sm font-medium"
              htmlFor="observed-damage"
            >
              <span>Observed damage notes</span>
              <TInput
                id="observed-damage"
                name="observed-damage"
                value={observedDamageNotes}
                onChange={(event) => setObservedDamageNotes(event.target.value)}
                placeholder="Optional"
                className="mt-2"
              />
            </label>
            <label
              className="block text-sm font-medium"
              htmlFor="return-remarks"
            >
              <span>Return remarks</span>
              <TInput
                id="return-remarks"
                name="return-remarks"
                value={returnRemarks}
                onChange={(event) => setReturnRemarks(event.target.value)}
                placeholder="Optional"
                className="mt-2"
              />
            </label>
            <Btn
              variant="primary"
              disabled={
                !canReturn ||
                busyAction !== null ||
                !returnConditionSummary.trim()
              }
              onClick={() =>
                void onAction(
                  "return",
                  {
                    rentalId: booking.rental?.id,
                    expectedBookingId: booking.id,
                    expectedVehicleId: booking.rental?.vehicle_id,
                    expectedStartedAt: booking.rental?.started_at,
                    returnOdometer: returnOdometer || null,
                    returnFuelLevel,
                    returnConditionSummary,
                    observedDamageNotes,
                    returnRemarks,
                  },
                  "Return recorded.",
                )
              }
            >
              {busyAction === "return" ? "Recording…" : "Record return"}
            </Btn>
          </div>
        </Card>
      ) : null}
      {!canConfirm && !canRelease && !canReturn ? (
        <Card>
          <EmptyState
            title="No action available"
            description="The current canonical booking state does not expose an Owner/Admin mutation from this workspace."
          />
        </Card>
      ) : null}
    </div>
  );
}

function StaffReadOnlyCard() {
  return (
    <Card>
      <CardHeader
        title="Operations Staff access"
        hint="This workspace follows the Staff read boundary."
      />
      <div className="space-y-3 px-5 py-5 text-sm leading-6 text-muted-foreground">
        <p>
          Lifecycle mutations, requirement proofs, payment proofs, and
          Owner/Admin review controls are not shown.
        </p>
        <p>
          Use the booking state, trip, vehicle, schedule, and safe status
          summaries above for operational coordination.
        </p>
      </div>
    </Card>
  );
}

function CustomerCard({
  booking,
  staffView,
}: {
  booking: AdminBooking;
  staffView: boolean;
}) {
  return (
    <Card className="rounded-none border-x-0 border-b-0 shadow-none">
      <CardHeader
        title="Customer"
        hint={staffView ? "Customer contact" : "Contact details"}
      />
      <div className="space-y-4 px-5 py-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7efec] text-primary">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              {booking.customer?.full_name ?? "Customer unavailable"}
            </p>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {booking.customer?.email ?? "Email unavailable"}
            </p>
          </div>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <DetailField
            label="Phone"
            value={
              booking.customer?.phone_number ??
              booking.customer_contact_number ??
              "Not recorded"
            }
          />
        </dl>
      </div>
    </Card>
  );
}

function DetailField({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      {icon ? (
        <span className="mt-0.5 text-primary" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1 text-sm leading-5">{value}</dd>
      </div>
    </div>
  );
}

function CompactState({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1">
        <DomainStatus label={value} tone={statusTone(value)} compact />
      </div>
    </div>
  );
}

function PrerequisiteRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2
        className={`h-4 w-4 ${ready ? "text-[#267a55]" : "text-muted-foreground"}`}
        aria-hidden="true"
      />
      <span className={ready ? "" : "text-muted-foreground"}>{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">
        {ready ? "Satisfied" : "Required"}
      </span>
    </div>
  );
}

function Acknowledgement({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}

function vehicleLabel(
  vehicle: AdminVehicle | null | undefined,
  fallback = "Vehicle unavailable",
) {
  if (!vehicle) return fallback;
  return `${vehicle.name}${vehicle.license_plate ? ` · ${vehicle.license_plate}` : ""}`;
}

function hasWindowConflict(
  vehicleId: string,
  booking: AdminBooking,
  bookings: AdminBooking[],
) {
  const start = Date.parse(booking.pickup_at);
  const end = Date.parse(booking.return_at);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return bookings.some((candidate) => {
    if (
      candidate.id === booking.id ||
      candidate.booking_status !== "Confirmed" ||
      candidate.assigned_vehicle_id !== vehicleId
    )
      return false;
    const candidateStart = Date.parse(candidate.pickup_at);
    const candidateEnd = Date.parse(candidate.return_at);
    return (
      Number.isFinite(candidateStart) &&
      Number.isFinite(candidateEnd) &&
      candidateStart < end &&
      start < candidateEnd
    );
  });
}

function actionDescription(
  action: string,
  requirementStatus: string,
  paymentStatus: string,
) {
  if (action === "Confirm this booking")
    return `Requirements are ${requirementStatus}; payment is ${paymentStatus}. The confirmation action stays disabled until both are Verified.`;
  if (action === "Review assignment and prerequisites")
    return "Choose an authorized active vehicle, then review the requirement and payment states before confirmation.";
  if (action === "Awaiting rental release")
    return "The booking is confirmed. Release starts the rental only when the canonical release fields and acknowledgements are complete.";
  if (action === "Rental is active")
    return "Record return against the active rental transaction when the vehicle is physically returned.";
  return "Use the role-safe action area below when the canonical state permits an operation.";
}

function bookingReferenceLabel(id: string) {
  return id
    ? `Booking ${id.slice(0, 8).toUpperCase()}`
    : "Booking reference unavailable";
}
