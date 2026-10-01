import { useCallback, useEffect, useRef, useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { calculateRentalQuote } from "@/lib/rental-quote";

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

type RateCard = {
  id: string;
  package_code: string;
  package_label: string;
  duration_hours: number;
  base_rate: number | string;
  effective_from: string;
  effective_until?: string | null;
};

type BookingRateQuote = {
  id: string;
  rate_card_id: string;
  package_label: string;
  duration_hours: number;
  base_rental_amount: number | string;
  delivery_fee: number | string;
  approved_discount: number | string;
  approved_subtotal: number | string;
  required_down_payment: number | string;
  quote_version: number;
};

type RateQuoteData = {
  quote: BookingRateQuote | null;
  rateCards: RateCard[];
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
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
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
  const confirmationException = booking.confirmation_exception_message?.trim();
  const paymentStageDetail = confirmationException
    ? `Payment approved. ${confirmationException}`
    : payment?.status === "Not Submitted"
      ? "Waiting for the customer to submit the payment proof."
      : paymentStatus === "Not Submitted"
        ? "Set the delivery fee and issue the customer’s payment request."
        : paymentStatus === "Needs Resubmission"
          ? "Review the customer’s resubmitted payment proof."
          : "Review the customer’s submitted payment proof.";
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
  const canCancel = actions.cancel;

  async function postBookingAction(
    action: "assign" | "confirm" | "cancel" | "release" | "return",
    body: Record<string, unknown>,
    successMessage: string,
  ): Promise<boolean> {
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
      return true;
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update this booking.",
      });
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="admin-booking-detail-page">
      <header className="admin-booking-detail-page__header">
        <div>
          <Link to="/admin/bookings" reloadDocument className="touch-target">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Bookings
          </Link>
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
              {ownerView &&
              (booking.booking_status === "Draft" ||
                booking.booking_status === "Submitted") &&
              !booking.rental ? (
                <RejectUnconfirmedBooking
                  bookingId={bookingId}
                  busy={busyAction !== null}
                  onResolved={load}
                />
              ) : (
                <p className="admin-booking-ledger__empty">
                  The customer selected this vehicle. The request appears here
                  immediately while documents are still being prepared.
                </p>
              )}
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
              detail={paymentStageDetail}
              active={currentStage === 3}
              expanded={
                expandedStage === null
                  ? currentStage === 3
                  : expandedStage === 3
              }
              onToggle={() => setExpandedStage(expandedStage === 3 ? null : 3)}
            >
              <div className="admin-booking-ledger__action">
                {ownerView ? (
                  <PaymentQuotePanel
                    booking={booking}
                    requirementsVerified={requirementStatus === "Verified"}
                    payment={payment}
                    onRefresh={load}
                  />
                ) : (
                  <p className="admin-booking-ledger__empty">
                    Payment is available after the customer requirements are
                    verified.
                  </p>
                )}
                {payment ? (
                  <Link
                    to="/admin/payments"
                    search={{ payment: payment.id } as never}
                    className="touch-target admin-booking-ledger__payment-link"
                  >
                    Review {payment.booking?.customer?.full_name ?? "customer"}
                    's payment
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
                {confirmationException ? (
                  <div
                    className="admin-booking-ledger__confirmation-exception"
                    role="status"
                  >
                    <strong>Automatic confirmation paused</strong>
                    <span>{confirmationException}</span>
                  </div>
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
                      : confirmationException
                        ? "Try confirmation again"
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
              canCancel ||
              canReturn ||
              (booking.booking_status === "Confirmed" && !booking.rental) ||
              Boolean(booking.rental && !booking.rental.ended_at)) ? (
              <div className="admin-booking-ledger__operational">
                <OwnerActionArea
                  booking={booking}
                  canConfirm={canConfirm}
                  canCancel={canCancel}
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
                  cancellationReason={cancellationReason}
                  setCancellationReason={setCancellationReason}
                  cancelDialogOpen={cancelDialogOpen}
                  setCancelDialogOpen={setCancelDialogOpen}
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

function RateQuotePanel({
  bookingId,
  vehicleId,
  requirementsVerified,
  paymentStatus,
  data,
  onRefresh,
}: {
  bookingId: string;
  vehicleId: string;
  requirementsVerified: boolean;
  paymentStatus: string;
  data: RateQuoteData;
  onRefresh: () => Promise<void>;
}) {
  const [rateCardId, setRateCardId] = useState(data.quote?.rate_card_id ?? "");
  const [deliveryFee, setDeliveryFee] = useState(
    String(data.quote?.delivery_fee ?? 0),
  );
  const [discount, setDiscount] = useState(
    String(data.quote?.approved_discount ?? 0),
  );
  const [showRateCardForm, setShowRateCardForm] = useState(false);
  const [packageCode, setPackageCode] = useState("");
  const [packageLabel, setPackageLabel] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [baseRate, setBaseRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const quoteLocked = ["Pending Verification", "Verified"].includes(
    paymentStatus,
  );

  useEffect(() => {
    setRateCardId(data.quote?.rate_card_id ?? "");
    setDeliveryFee(String(data.quote?.delivery_fee ?? 0));
    setDiscount(String(data.quote?.approved_discount ?? 0));
  }, [data.quote]);

  async function request(body: Record<string, unknown>) {
    const response = await fetch("/api/rate-quotes", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (!response.ok)
      throw new Error(payload?.message ?? "Unable to save the rate quote.");
  }

  async function createRateCard() {
    setSaving(true);
    setMessage(null);
    try {
      await request({
        action: "create-rate-card",
        vehicleId,
        packageCode,
        packageLabel,
        durationHours: Number(durationHours),
        baseRate: Number(baseRate),
        effectiveFrom,
      });
      setShowRateCardForm(false);
      setPackageCode("");
      setPackageLabel("");
      setBaseRate("");
      await onRefresh();
      setMessage({
        tone: "success",
        text: "Researcher-designed rate-card entry saved. Select it to approve the booking quote.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save the rate-card entry.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function approveQuote() {
    setSaving(true);
    setMessage(null);
    try {
      await request({
        action: "approve-quote",
        bookingId,
        rateCardId,
        deliveryFee: Number(deliveryFee),
        approvedDiscount: Number(discount),
      });
      await onRefresh();
      setMessage({
        tone: "success",
        text: "Researcher-designed quote approved. The customer can now submit the required minimum down payment.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to approve the rate quote.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#d6e3ed] bg-[#f8fbfd] p-4">
      <h4 className="text-sm font-semibold">Researcher-designed rate quote</h4>
      <p className="mt-1 text-sm text-muted-foreground">
        This controlled prototype baseline establishes a payment threshold. It
        is not a final quotation, deposit, refund, or penalty calculation.
      </p>
      {message ? (
        <p
          className={`mt-3 rounded-md border px-3 py-2 text-sm ${message.tone === "error" ? "border-[#edc9c5] bg-[#fff5f3] text-[#8d302f]" : "border-[#b9d9c8] bg-[#f1faf4] text-[#267a55]"}`}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      ) : null}
      {!requirementsVerified ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Verify requirements before approving a rate quote.
        </p>
      ) : null}
      {data.quote ? (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Package</dt>
            <dd>
              {data.quote.package_label} ({data.quote.duration_hours} hours)
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Approved subtotal</dt>
            <dd>
              {formatAdminMoney(data.quote.approved_subtotal) ?? "Not recorded"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Minimum down payment</dt>
            <dd>
              {formatAdminMoney(data.quote.required_down_payment) ??
                "Not recorded"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Quote version</dt>
            <dd>v{data.quote.quote_version}</dd>
          </div>
        </dl>
      ) : null}
      {!quoteLocked ? (
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-medium">
            Rate-card entry
            <TSelect
              className="mt-1"
              value={rateCardId}
              onChange={(event) => setRateCardId(event.target.value)}
              disabled={!requirementsVerified || saving}
            >
              <option value="">Select a researcher-designed rate…</option>
              {data.rateCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.package_label} · {card.duration_hours}h ·{" "}
                  {formatAdminMoney(card.base_rate)}
                </option>
              ))}
            </TSelect>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Agreed delivery fee
              <TInput
                className="mt-1"
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={(event) => setDeliveryFee(event.target.value)}
                disabled={!requirementsVerified || saving}
              />
            </label>
            <label className="text-sm font-medium">
              Approved discount
              <TInput
                className="mt-1"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                disabled={!requirementsVerified || saving}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn
              variant="primary"
              disabled={!requirementsVerified || !rateCardId || saving}
              onClick={() => void approveQuote()}
            >
              {saving
                ? "Saving…"
                : data.quote
                  ? "Update approved quote"
                  : "Approve rate quote"}
            </Btn>
            <Btn
              variant="ghost"
              disabled={saving || !vehicleId}
              onClick={() => setShowRateCardForm((value) => !value)}
            >
              {showRateCardForm
                ? "Close rate-card form"
                : "Add researcher rate"}
            </Btn>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          The approved quote is locked while payment is pending or verified.
        </p>
      )}
      {showRateCardForm && !quoteLocked ? (
        <div className="mt-4 grid gap-3 border-t border-[#d6e3ed] pt-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Package code
            <TInput
              className="mt-1"
              value={packageCode}
              onChange={(event) => setPackageCode(event.target.value)}
              placeholder="e.g. DEMO-24H"
            />
          </label>
          <label className="text-sm font-medium">
            Package label
            <TInput
              className="mt-1"
              value={packageLabel}
              onChange={(event) => setPackageLabel(event.target.value)}
              placeholder="e.g. Controlled 24-hour test rate"
            />
          </label>
          <label className="text-sm font-medium">
            Duration in hours
            <TInput
              className="mt-1"
              type="number"
              min="1"
              step="1"
              value={durationHours}
              onChange={(event) => setDurationHours(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Base rate
            <TInput
              className="mt-1"
              type="number"
              min="0.01"
              step="0.01"
              value={baseRate}
              onChange={(event) => setBaseRate(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Effective from
            <TInput
              className="mt-1"
              type="date"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
            />
          </label>
          <div className="flex items-end">
            <Btn
              variant="ghost"
              disabled={
                saving ||
                !packageCode.trim() ||
                !packageLabel.trim() ||
                !Number(durationHours) ||
                !Number(baseRate) ||
                !effectiveFrom
              }
              onClick={() => void createRateCard()}
            >
              {saving ? "Saving…" : "Save rate-card entry"}
            </Btn>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PaymentQuotePanel({
  booking,
  requirementsVerified,
  payment,
  onRefresh,
}: {
  booking: AdminBooking;
  requirementsVerified: boolean;
  payment: AdminPayment | null;
  onRefresh: () => Promise<void>;
}) {
  const [deliveryFee, setDeliveryFee] = useState("");
  const [issuedQuote, setIssuedQuote] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Feedback | null>(null);
  const dailyRate = Number(booking.requested_vehicle?.daily_rate);
  const fee = Number(deliveryFee);
  const hasDailyRate = Number.isFinite(dailyRate) && dailyRate > 0;
  const quote =
    hasDailyRate && Number.isFinite(fee) && fee >= 0
      ? calculateRentalQuote(
          dailyRate,
          new Date(booking.pickup_at),
          new Date(booking.return_at),
          fee,
        )
      : null;
  const locked = Boolean(payment && payment.status !== "Not Submitted");

  useEffect(() => {
    setConfirmed(false);
    void fetch(
      `/api/payment-quote?bookingId=${encodeURIComponent(booking.id)}`,
      { credentials: "same-origin" },
    )
      .then((response) => response.json())
      .then((body) => {
        if (body?.quote) {
          setIssuedQuote(body.quote);
          setDeliveryFee(
            body.quote.delivery_fee ? String(body.quote.delivery_fee) : "",
          );
        }
      })
      .catch(() => undefined);
  }, [booking.id]);

  async function issue() {
    if (!quote || !confirmed) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/payment-quote", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, deliveryFee: fee }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
        quote?: Record<string, unknown>;
      } | null;
      if (!response.ok)
        throw new Error(body?.message ?? "Unable to send the quote.");
      setIssuedQuote(body?.quote ?? null);
      setConfirmed(false);
      await onRefresh();
      setMessage({
        tone: "success",
        message:
          "Quote sent. The customer can now submit the required down payment.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to send the quote.",
      });
    } finally {
      setSaving(false);
    }
  }

  const customerName = booking.customer?.full_name?.trim() || "the customer";
  const customerFirstName =
    customerName === "the customer" ? "customer" : customerName.split(/\s+/)[0];
  const quoteIssued = Boolean(issuedQuote);
  const canEditQuote = !locked && requirementsVerified;
  const vehicleName = booking.requested_vehicle?.name || "Requested vehicle";
  const bookingWindow = formatAdminDateRange(
    booking.pickup_at,
    booking.return_at,
  );

  return (
    <section className="admin-booking-payment-terms admin-booking-payment-quote-panel">
      {!hasDailyRate ? (
        <p className="admin-booking-payment-terms__notice" role="alert">
          Add a daily rate to the requested vehicle before creating a quote.
        </p>
      ) : null}

      {quote ? (
        <>
          <header className="admin-booking-payment-quote-panel__header">
            <h4>Review customer quote</h4>
            <p>
              {quoteIssued
                ? `Quote sent to ${customerFirstName}. You can revise it until payment proof is submitted.`
                : `${vehicleName} · ${bookingWindow}`}
            </p>
          </header>

          <dl className="admin-booking-payment-quote-panel__review-list">
            <div>
              <dt>Daily rental rate</dt>
              <dd>{formatAdminMoney(dailyRate)}</dd>
            </div>
            <div>
              <dt>Billable rental</dt>
              <dd>
                {quote.billableDays} day{quote.billableDays === 1 ? "" : "s"}
              </dd>
            </div>
            <div>
              <dt>Rental charge</dt>
              <dd>{formatAdminMoney(quote.rentalSubtotal)}</dd>
            </div>
            {canEditQuote ? (
              <div className="admin-booking-payment-quote-panel__delivery-row">
                <dt>Delivery fee</dt>
                <dd>
                  <label>
                    <span className="sr-only">Delivery fee</span>
                    <span aria-hidden="true">₱</span>
                    <TInput
                      name="deliveryFee"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={deliveryFee}
                      onChange={(event) => {
                        setDeliveryFee(event.target.value);
                        setConfirmed(false);
                      }}
                      disabled={saving}
                    />
                  </label>
                </dd>
              </div>
            ) : (
              <div>
                <dt>Delivery fee</dt>
                <dd>{formatAdminMoney(fee)}</dd>
              </div>
            )}
            <div className="admin-booking-payment-quote-panel__final-row">
              <dt>Final rental price</dt>
              <dd>{formatAdminMoney(quote.totalAmount)}</dd>
            </div>
          </dl>

          <section
            className="admin-booking-payment-quote-panel__request-summary"
            aria-labelledby="payment-request-heading"
          >
            <div>
              <h5 id="payment-request-heading">Payment request</h5>
              <p>
                50% down payment.{" "}
                {formatAdminMoney(quote.securityDepositAmount)} refundable
                security deposit collected before release.
              </p>
            </div>
            <strong>
              {formatAdminMoney(quote.downPaymentAmount)} due today
            </strong>
          </section>

          <div className="admin-booking-payment-quote-panel__footer">
            {quoteIssued && locked ? (
              <p
                className="admin-booking-payment-quote-panel__waiting"
                role="status"
              >
                Payment proof has been submitted. This quote is now locked for
                review.
              </p>
            ) : canEditQuote ? (
              <label className="admin-booking-payment-quote-panel__confirmation">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  disabled={saving}
                />
                <span>
                  I confirm this quote matches the booking details
                </span>
              </label>
            ) : null}
            {canEditQuote ? (
              <Btn
                variant="primary"
                disabled={saving || !confirmed}
                onClick={() => void issue()}
              >
                {saving
                  ? "Saving…"
                  : quoteIssued
                    ? `Update quote for ${customerFirstName}`
                    : `Send quote to ${customerFirstName}`}
              </Btn>
            ) : null}
          </div>
        </>
      ) : null}

      {!requirementsVerified ? (
        <p className="admin-booking-payment-terms__notice">
          Verify the customer’s requirements before sending a payment request.
        </p>
      ) : null}
      {locked ? (
        <p className="admin-booking-payment-terms__notice">
          This payment request is locked because payment proof is already under
          review or verified.
        </p>
      ) : null}

      {message ? (
        <p
          className={`admin-booking-payment-terms__message is-${message.tone}`}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.message}
        </p>
      ) : null}
    </section>
  );
}

function PaymentRequirementPanel({
  bookingId,
  requirementsVerified,
  payment,
  onRefresh,
}: {
  bookingId: string;
  requirementsVerified: boolean;
  payment: AdminPayment | null;
  onRefresh: () => Promise<void>;
}) {
  const [amount, setAmount] = useState(
    payment?.required_amount == null ? "" : String(payment.required_amount),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Feedback | null>(null);
  const locked = Boolean(
    payment &&
    payment.status !== "Not Submitted" &&
    !(
      payment.status === "Needs Resubmission" && payment.required_amount == null
    ),
  );

  useEffect(() => {
    setAmount(
      payment?.required_amount == null ? "" : String(payment.required_amount),
    );
    setMessage(null);
  }, [payment?.id, payment?.required_amount]);

  async function save() {
    const requiredAmount = Number(amount);
    if (!Number.isFinite(requiredAmount) || requiredAmount <= 0) {
      setMessage({
        tone: "error",
        message: "Enter a valid required payment amount.",
      });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/payment-terms", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId, requiredAmount }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok)
        throw new Error(
          body?.message ?? "Unable to record the payment amount.",
        );
      await onRefresh();
      setMessage({
        tone: "success",
        message: "Required payment amount recorded for the customer.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to record the payment amount.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-booking-payment-terms">
      <div>
        <h4>Required payment amount</h4>
        <p>
          Record the amount the customer must pay. It is shown on this booking
          only and does not change when catalog prices are edited.
        </p>
      </div>
      {!requirementsVerified ? (
        <p className="admin-booking-payment-terms__notice">
          Verify requirements before recording the payment amount.
        </p>
      ) : locked ? (
        <p className="admin-booking-payment-terms__notice">
          {formatAdminMoney(payment?.required_amount) ?? "The required amount"}{" "}
          is locked because a payment proof is under review or verified.
        </p>
      ) : (
        <div className="admin-booking-payment-terms__form">
          <label>
            <span>Amount in PHP</span>
            <TInput
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={saving}
              placeholder="e.g. 5000"
            />
          </label>
          <Btn
            variant="primary"
            disabled={!requirementsVerified || saving || !amount.trim()}
            onClick={() => void save()}
          >
            {saving
              ? "Recording…"
              : payment?.required_amount != null
                ? "Update amount"
                : "Record amount"}
          </Btn>
        </div>
      )}
      {message ? (
        <p
          className={`admin-booking-payment-terms__message is-${message.tone}`}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.message}
        </p>
      ) : null}
    </section>
  );
}

function RejectUnconfirmedBooking({
  bookingId,
  busy,
  onResolved,
}: {
  bookingId: string;
  busy: boolean;
  onResolved: () => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function reject() {
    if (!reason.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          bookingId,
          resolutionReason: reason.trim(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok)
        throw new Error(payload?.message ?? "Unable to reject this request.");
      await onResolved();
      setOpen(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reject this request.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-booking-resolution">
      <div>
        <h4>Resolve unfinished request</h4>
        <p>
          Reject only when this request cannot proceed. The customer receives
          the recorded reason.
        </p>
      </div>
      <label>
        <span>Reason for rejection</span>
        <TInput
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Required for the customer and audit trail"
          disabled={busy || saving}
          maxLength={500}
        />
      </label>
      {message ? (
        <p className="admin-booking-resolution__message" role="alert">
          {message}
        </p>
      ) : null}
      <Btn
        variant="danger"
        disabled={busy || saving || !reason.trim()}
        onClick={() => setOpen(true)}
      >
        Reject request
      </Btn>
      <AlertDialog
        open={open}
        onOpenChange={(next) => !saving && setOpen(next)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this unfinished request?</AlertDialogTitle>
            <AlertDialogDescription>
              The request will become inactive. The customer will see the reason
              you entered, while the booking history remains available for
              review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>
              Keep request
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void reject();
              }}
              className="border border-[#b43b3b] bg-white px-4 text-sm font-semibold text-[#b43b3b] shadow-none hover:bg-[#fff2f1]"
            >
              {saving ? "Rejecting…" : "Reject request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

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
  const hasAllDocuments = requirements.requiredTypes.every((type) =>
    documents.some((document) => document.requirement_type === type),
  );
  const canReview =
    requirementSet?.status === "Pending Review" && hasAllDocuments;
  const reviewDraftKey = `admin-requirements-review:${requirementSet?.id ?? bookingId}`;
  const [governmentIdOutcome, setGovernmentIdOutcome] = useState("");
  const [governmentIdReason, setGovernmentIdReason] = useState("");
  const [driversLicenseOutcome, setDriversLicenseOutcome] = useState("");
  const [driversLicenseReason, setDriversLicenseReason] = useState("");
  const [proofOfBillingOutcome, setProofOfBillingOutcome] = useState("");
  const [proofOfBillingReason, setProofOfBillingReason] = useState("");
  const [selfieWithIdOutcome, setSelfieWithIdOutcome] = useState("");
  const [selfieWithIdReason, setSelfieWithIdReason] = useState("");
  const [identityConsistency, setIdentityConsistency] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewDocument, setPreviewDocument] =
    useState<AdminRequirementDocument | null>(null);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    let draft: Record<string, string> | null = null;
    if (requirementSet?.status === "Pending Review") {
      try {
        const saved = window.localStorage.getItem(reviewDraftKey);
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, unknown>;
          draft = Object.fromEntries(
            Object.entries(parsed).filter(
              ([, value]) => typeof value === "string",
            ),
          ) as Record<string, string>;
        }
      } catch {
        window.localStorage.removeItem(reviewDraftKey);
      }
    }
    setGovernmentIdOutcome(
      draft?.governmentIdOutcome ?? review?.government_id_outcome ?? "",
    );
    setGovernmentIdReason(
      draft?.governmentIdReason ?? review?.government_id_reason ?? "",
    );
    setDriversLicenseOutcome(
      draft?.driversLicenseOutcome ?? review?.drivers_license_outcome ?? "",
    );
    setDriversLicenseReason(
      draft?.driversLicenseReason ?? review?.drivers_license_reason ?? "",
    );
    setProofOfBillingOutcome(
      draft?.proofOfBillingOutcome ?? review?.proof_of_billing_outcome ?? "",
    );
    setProofOfBillingReason(
      draft?.proofOfBillingReason ?? review?.proof_of_billing_reason ?? "",
    );
    setSelfieWithIdOutcome(
      draft?.selfieWithIdOutcome ?? review?.selfie_with_id_outcome ?? "",
    );
    setSelfieWithIdReason(
      draft?.selfieWithIdReason ?? review?.selfie_with_id_reason ?? "",
    );
    setIdentityConsistency(
      draft?.identityConsistency ?? review?.identity_consistency ?? "",
    );
    setMessage(null);
    setDraftReady(true);
  }, [review, requirementSet?.status, reviewDraftKey]);

  useEffect(() => {
    if (!draftReady) return;
    if (!canReview) {
      window.localStorage.removeItem(reviewDraftKey);
      return;
    }
    window.localStorage.setItem(
      reviewDraftKey,
      JSON.stringify({
        governmentIdOutcome,
        governmentIdReason,
        driversLicenseOutcome,
        driversLicenseReason,
        proofOfBillingOutcome,
        proofOfBillingReason,
        selfieWithIdOutcome,
        selfieWithIdReason,
        identityConsistency,
      }),
    );
  }, [
    canReview,
    draftReady,
    driversLicenseOutcome,
    driversLicenseReason,
    governmentIdOutcome,
    governmentIdReason,
    identityConsistency,
    proofOfBillingOutcome,
    proofOfBillingReason,
    reviewDraftKey,
    selfieWithIdOutcome,
    selfieWithIdReason,
  ]);

  const gate = requirementReviewGate({
    governmentIdOutcome,
    driversLicenseOutcome,
    proofOfBillingOutcome,
    selfieWithIdOutcome,
    identityConsistency,
  });
  const allOutcomesSelected = Boolean(
    governmentIdOutcome &&
    driversLicenseOutcome &&
    proofOfBillingOutcome &&
    selfieWithIdOutcome &&
    identityConsistency,
  );
  const hasReplacementRequest = [
    governmentIdOutcome,
    driversLicenseOutcome,
    proofOfBillingOutcome,
    selfieWithIdOutcome,
  ].some((outcome) => outcome === "Needs Replacement");

  async function saveReview(resultingStatus: RequirementReviewStatus) {
    if (!requirementSet || !canReview) return;
    if (!allOutcomesSelected) {
      setMessage({
        tone: "error",
        text: "Choose an outcome for every document and confirm identity consistency before saving.",
      });
      return;
    }
    if (resultingStatus === "Verified" && !gate.canVerify) {
      setMessage({
        tone: "error",
        text: "Verification requires all four documents accepted and a consistent identity.",
      });
      return;
    }
    const replacementReasons = [
      [governmentIdOutcome, governmentIdReason],
      [driversLicenseOutcome, driversLicenseReason],
      [proofOfBillingOutcome, proofOfBillingReason],
      [selfieWithIdOutcome, selfieWithIdReason],
    ];
    if (
      resultingStatus === "Needs Resubmission" &&
      (!gate.canResubmit ||
        replacementReasons.some(
          ([outcome, reason]) =>
            outcome === "Needs Replacement" && !reason.trim(),
        ))
    ) {
      setMessage({
        tone: "error",
        text: "Add a customer-facing reason for every document that needs reuploading.",
      });
      return;
    }
    const governmentId = documents.find(
      (document) => document.requirement_type === "Valid Government ID",
    );
    const driversLicense = documents.find(
      (document) => document.requirement_type === "Driver's License",
    );
    const proofOfBilling = documents.find(
      (document) => document.requirement_type === "Proof of Billing",
    );
    const selfieWithId = documents.find(
      (document) => document.requirement_type === "Selfie with ID",
    );
    if (!governmentId || !driversLicense || !proofOfBilling || !selfieWithId)
      return;

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
          proofOfBillingDocumentId: proofOfBilling.id,
          proofOfBillingVersion: proofOfBilling.version,
          proofOfBillingOutcome,
          proofOfBillingReason: proofOfBillingReason.trim(),
          selfieWithIdDocumentId: selfieWithId.id,
          selfieWithIdVersion: selfieWithId.version,
          selfieWithIdOutcome,
          selfieWithIdReason: selfieWithIdReason.trim(),
          identityConsistency,
          resultingStatus,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          body?.message ?? "Unable to save the requirements review.",
        );
      }
      window.localStorage.removeItem(reviewDraftKey);
      setDraftReady(false);
      await onRefresh();
      setMessage({
        tone: "success",
        text:
          resultingStatus === "Verified"
            ? "Requirements verified. Payment is now available to the customer."
            : "Reupload requested. The customer can replace only the flagged documents before submitting again.",
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

  const documentControls = [
    {
      type: "Valid Government ID",
      id: "booking-government-id",
      outcome: governmentIdOutcome,
      setOutcome: setGovernmentIdOutcome,
      reason: governmentIdReason,
      setReason: setGovernmentIdReason,
    },
    {
      type: "Driver's License",
      id: "booking-drivers-license",
      outcome: driversLicenseOutcome,
      setOutcome: setDriversLicenseOutcome,
      reason: driversLicenseReason,
      setReason: setDriversLicenseReason,
    },
    {
      type: "Proof of Billing",
      id: "booking-proof-of-billing",
      outcome: proofOfBillingOutcome,
      setOutcome: setProofOfBillingOutcome,
      reason: proofOfBillingReason,
      setReason: setProofOfBillingReason,
    },
    {
      type: "Selfie with ID",
      id: "booking-selfie-with-id",
      outcome: selfieWithIdOutcome,
      setOutcome: setSelfieWithIdOutcome,
      reason: selfieWithIdReason,
      setReason: setSelfieWithIdReason,
    },
  ];

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
          <fieldset
            disabled={!canReview || saving}
            className="admin-booking-ledger__documents"
          >
            <legend className="sr-only">Document review decisions</legend>
            {documentControls.map((control) => (
              <BookingDocumentReviewRow
                key={control.type}
                {...control}
                document={documents.find(
                  (item) => item.requirement_type === control.type,
                )}
                onPreview={setPreviewDocument}
              />
            ))}
          </fieldset>
          {canReview ? (
            <div className="admin-booking-ledger__cross-check">
              <div className="admin-booking-ledger__cross-check-copy">
                <strong>Identity consistency</strong>
                <p>
                  Confirm that the name and likeness match across the submitted
                  documents.
                </p>
              </div>
              <RequirementOutcomeSelect
                id="booking-identity-outcome"
                label="Identity consistency outcome"
                value={identityConsistency}
                onChange={setIdentityConsistency}
                options={["Consistent", "Concern"]}
                hidePlaceholder
                compact
              />
            </div>
          ) : (
            <p className="admin-booking-ledger__review-note">
              {requirementSet.status === "Needs Resubmission"
                ? "The request is back with the customer for correction. It returns here after replacement documents are submitted."
                : "All submitted documents have been reviewed for this request."}
            </p>
          )}
          {canReview ? (
            <div className="admin-booking-ledger__review-actions flex flex-wrap justify-end gap-2">
              {hasReplacementRequest ? (
                <Btn
                  variant="danger"
                  disabled={saving || !gate.canResubmit}
                  onClick={() => void saveReview("Needs Resubmission")}
                >
                  {saving ? "Saving…" : "Send reupload request"}
                </Btn>
              ) : (
                <Btn
                  variant="primary"
                  disabled={saving || !gate.canVerify}
                  onClick={() => void saveReview("Verified")}
                >
                  {saving ? "Saving…" : "Verify requirements"}
                </Btn>
              )}
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

function BookingDocumentReviewRow({
  type,
  id,
  document,
  outcome,
  setOutcome,
  reason,
  setReason,
  onPreview,
}: {
  type: string;
  id: string;
  document?: AdminRequirementDocument;
  outcome: string;
  setOutcome: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  onPreview: (document: AdminRequirementDocument) => void;
}) {
  return (
    <div className="admin-booking-ledger__document-review">
      <div className="admin-booking-ledger__document">
        {document ? (
          <div className="admin-booking-ledger__document-copy">
            <button
              type="button"
              className="admin-booking-ledger__document-thumbnail-button"
              onClick={() => onPreview(document)}
              aria-label={`Preview ${type}: ${document.original_filename}`}
            >
              <AdminDocumentThumbnail document={document} />
            </button>
            <span>
              <strong>{type}</strong>
              <small>
                {`${document.original_filename} · v${document.version} · ${formatAdminDateTime(document.uploaded_at)}`}
              </small>
            </span>
          </div>
        ) : (
          <div className="admin-booking-ledger__document-missing">
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            <span>
              <strong>{type}</strong>
              <small>No current document</small>
            </span>
          </div>
        )}
        <RequirementOutcomeSelect
          id={`${id}-outcome`}
          label={`${type} outcome`}
          value={outcome}
          onChange={setOutcome}
          options={[
            { value: "Accepted", label: "Accepted" },
            { value: "Needs Replacement", label: "Needs reupload" },
          ]}
          hidePlaceholder
          compact
        />
      </div>
      {outcome === "Needs Replacement" ? (
        <label
          className="admin-booking-ledger__replacement-reason"
          htmlFor={`${id}-reason`}
        >
          <span>Reason for reupload</span>
          <TInput
            id={`${id}-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Tell the customer exactly what needs replacing"
          />
        </label>
      ) : null}
    </div>
  );
}

function AdminDocumentThumbnail({
  document,
}: {
  document: AdminRequirementDocument;
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch(
      `/api/requirements?documentId=${encodeURIComponent(document.id)}`,
      { credentials: "same-origin" },
    )
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as {
          url?: string;
        } | null;
        if (!response.ok || !body?.url) throw new Error("Preview unavailable");
        if (!cancelled) setUrl(body.url);
      })
      .catch(() => {
        if (!cancelled) setUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [document.id]);

  return (
    <span
      className="admin-booking-ledger__document-thumbnail"
      aria-hidden="true"
    >
      {url ? (
        document.mime_type === "application/pdf" ? (
          <AdminPdfThumbnail source={url} />
        ) : (
          <img src={url} alt="" />
        )
      ) : (
        <FileCheck2 className="h-4 w-4" />
      )}
    </span>
  );
}

function AdminPdfThumbnail({ source }: { source: string }) {
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
        const viewport = page.getViewport({ scale: 0.26 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) return;
        await page.render({ canvasContext: context, viewport }).promise;
        if (!cancelled) setThumbnail(canvas.toDataURL("image/png"));
        pdf.cleanup?.();
      } catch {
        // The complete preview remains available even if a small PDF image cannot render.
      }
    }

    void renderThumbnail();
    return () => {
      cancelled = true;
      void Promise.resolve(loadingTask?.destroy?.()).catch(() => undefined);
    };
  }, [source]);

  return thumbnail ? (
    <img src={thumbnail} alt="" />
  ) : (
    <FileCheck2 className="h-4 w-4" />
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
      <DialogContent
        className="max-h-[92vh] max-w-5xl overflow-hidden p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
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
            <AdminPdfDocumentPreview
              src={url}
              filename={document.original_filename}
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

function AdminPdfDocumentPreview({
  src,
  filename,
}: {
  src: string;
  filename: string;
}) {
  const [pages, setPages] = useState<string[]>([]);
  const [renderError, setRenderError] = useState("");
  const [zoom, setZoom] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * 0.0015);
      setZoom((current) => Math.min(3, Math.max(0.65, current * factor)));
    };
    preview.addEventListener("wheel", handleWheel, { passive: false });
    return () => preview.removeEventListener("wheel", handleWheel);
  }, [pages.length]);

  useEffect(() => {
    setZoom(1);
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
            fetch(src, { credentials: "omit" }),
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
        pdf.cleanup?.();
      } catch (cause) {
        if (!cancelled) {
          setRenderError(
            cause instanceof Error
              ? cause.message
              : "This PDF could not be rendered for preview.",
          );
        }
      }
    }

    void renderPdf();
    return () => {
      cancelled = true;
      void Promise.resolve(loadingTask?.destroy?.()).catch(() => undefined);
    };
  }, [src]);

  if (renderError)
    return <p className="p-6 text-sm text-red-700">{renderError}</p>;
  if (pages.length === 0) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Rendering secure PDF preview…
      </p>
    );
  }
  return (
    <div
      ref={previewRef}
      className="booking-document-preview-pages"
      aria-label="Document pages. Pinch with two fingers to zoom."
    >
      {pages.map((page, index) => (
        <img
          alt={`${filename}, page ${index + 1}`}
          className="booking-document-preview-image"
          key={page}
          src={page}
          style={{ zoom }}
        />
      ))}
    </div>
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
  includePlaceholder = true,
  hidePlaceholder = false,
  compact = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
  includePlaceholder?: boolean;
  hidePlaceholder?: boolean;
  compact?: boolean;
}) {
  return (
    <label
      className={
        compact ? "admin-booking-ledger__outcome" : "text-sm font-medium"
      }
      htmlFor={id}
    >
      <span className={compact ? "sr-only" : undefined}>{label}</span>
      <TSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={compact ? undefined : "mt-2"}
      >
        {includePlaceholder ? (
          <option value="" disabled={hidePlaceholder} hidden={hidePlaceholder}>
            Select an outcome…
          </option>
        ) : null}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
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
  canCancel,
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
  cancellationReason,
  setCancellationReason,
  cancelDialogOpen,
  setCancelDialogOpen,
  busyAction,
  onAction,
}: {
  booking: AdminBooking;
  canConfirm: boolean;
  canCancel: boolean;
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
  cancellationReason: string;
  setCancellationReason: (value: string) => void;
  cancelDialogOpen: boolean;
  setCancelDialogOpen: (open: boolean) => void;
  busyAction: string | null;
  onAction: (
    action: "assign" | "confirm" | "cancel" | "release" | "return",
    body: Record<string, unknown>,
    message: string,
  ) => Promise<boolean>;
}) {
  return (
    <div className="space-y-5">
      {canCancel ? (
        <Card>
          <CardHeader
            title="Cancel reservation"
            hint="Cancellation is available only before the rental is released. The payment and requirement history will be retained."
          />
          <div className="space-y-4 px-5 py-5">
            <label
              className="block text-sm font-medium"
              htmlFor="cancellation-reason"
            >
              <span>Cancellation reason</span>
              <TInput
                id="cancellation-reason"
                name="cancellation-reason"
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Required for the audit trail"
                className="mt-2"
              />
            </label>
            <Btn
              variant="danger"
              disabled={busyAction !== null || !cancellationReason.trim()}
              onClick={() => setCancelDialogOpen(true)}
            >
              Cancel confirmed reservation
            </Btn>
          </div>
          <AlertDialog
            open={cancelDialogOpen}
            onOpenChange={(open) => {
              if (!busyAction) setCancelDialogOpen(open);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Cancel this confirmed reservation?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel {bookingReferenceLabel(booking.id)} and
                  release its vehicle allocation. Requirement and payment
                  records will stay in the audit history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busyAction !== null}>
                  Keep reservation
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={busyAction !== null}
                  onClick={(event) => {
                    event.preventDefault();
                    void onAction(
                      "cancel",
                      {
                        expectedConfirmedAt: booking.confirmed_at,
                        cancellationReason,
                      },
                      "Confirmed reservation cancelled and vehicle allocation released.",
                    ).then((cancelled) => {
                      if (cancelled) setCancelDialogOpen(false);
                    });
                  }}
                  className="border border-[#b43b3b] bg-white px-4 text-sm font-semibold text-[#b43b3b] shadow-none hover:bg-[#fff2f1]"
                >
                  {busyAction === "cancel"
                    ? "Cancelling…"
                    : "Cancel reservation"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      ) : null}
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
