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
  LoadingRows,
  PageHeader,
  TInput,
  TSelect,
} from "@/components/admin/ui";
import { getAdminSession } from "@/lib/admin-auth";
import { bookingActionAvailability } from "@/lib/admin-slice-1";
import {
  exactAdminEntity,
  formatAdminDateTime,
  formatAdminDateRange,
  formatAdminMoney,
  rentalState,
  statusTone,
  type AdminBooking,
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

function BookingDetailPage() {
  const { bookingId } = Route.useParams();
  const ownerView = getAdminSession()?.role === "Owner/Admin";
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");
  const [substitutionAcknowledged, setSubstitutionAcknowledged] =
    useState(false);
  const [crossBranchAcknowledged, setCrossBranchAcknowledged] = useState(false);
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

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setFeedback(null);
    try {
      const response = await fetch("/api/bookings", {
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

  useEffect(() => {
    if (state.status !== "ready") return;
    setSelectedVehicleId(state.data.booking.assigned_vehicle_id ?? "");
  }, [state]);

  if (state.status === "loading") {
    return (
      <div>
        <PageHeader
          title="Booking detail"
          subtitle="Loading exact booking context…"
        />
        <Card>
          <LoadingRows count={7} />
        </Card>
      </div>
    );
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

  const { booking, candidates, bookings, requirements, payments, failures } =
    state.data;
  const payment = payments?.length === 1 ? payments[0] : null;
  const ambiguousPayments = (payments?.length ?? 0) > 1;
  const selectedVehicle =
    candidates.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;
  const assignmentNeedsSubstitution = Boolean(
    selectedVehicle && selectedVehicle.id !== booking.requested_vehicle_id,
  );
  const assignmentNeedsCrossBranch = Boolean(
    selectedVehicle &&
    selectedVehicle.branch_id &&
    selectedVehicle.branch_id !== booking.pickup_branch_id,
  );
  const vehicleConflict = selectedVehicle
    ? hasWindowConflict(selectedVehicle.id, booking, bookings)
    : false;
  const requirementStatus = booking.requirement_status ?? "Unavailable";
  const paymentStatus = booking.payment_status ?? "Unavailable";
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
    selectedVehicle: Boolean(selectedVehicleId),
    selectedVehicleConflict: vehicleConflict,
  });
  const canAssign = actions.assign;
  const canConfirm = actions.confirm;
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
    <div>
      <PageHeader
        eyebrow={
          ownerView ? "Owner/Admin operations" : "Operations Staff · read-only"
        }
        title={booking.customer?.full_name ?? "Booking detail"}
        subtitle={`${bookingReferenceLabel(booking.id)} · ${formatAdminDateRange(booking.pickup_at, booking.return_at)}`}
        actions={
          <Link
            to="/admin/bookings"
            className="touch-target inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Bookings
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-border py-4 text-sm">
        <DomainStatus
          label={booking.booking_status}
          tone={statusTone(booking.booking_status)}
        />
        <span className="text-muted-foreground">
          {booking.requested_vehicle?.name ?? "Vehicle unavailable"}
          {booking.assigned_vehicle
            ? ` · assigned ${booking.assigned_vehicle.name}`
            : " · not assigned"}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {booking.id}
        </span>
      </div>

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

      <ActionPriority
        ownerView={ownerView}
        booking={booking}
        requirementStatus={requirementStatus}
        paymentStatus={paymentStatus}
        payment={payment}
        ambiguousPayments={ambiguousPayments}
        requirements={requirements}
        canAssign={canAssign}
        canConfirm={canConfirm}
        canRelease={canRelease}
        canReturn={canReturn}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.9fr)_minmax(260px,0.72fr)]">
        <div className="space-y-5">
          <BookingRequestCard booking={booking} />
          <WorkflowCard
            booking={booking}
            requirementStatus={requirementStatus}
            paymentStatus={paymentStatus}
          />
        </div>
        <div className="space-y-5">
          {ownerView ? (
            <OwnerActionArea
              booking={booking}
              candidates={candidates}
              selectedVehicle={selectedVehicle}
              selectedVehicleId={selectedVehicleId}
              setSelectedVehicleId={setSelectedVehicleId}
              assignmentNote={assignmentNote}
              setAssignmentNote={setAssignmentNote}
              substitutionAcknowledged={substitutionAcknowledged}
              setSubstitutionAcknowledged={setSubstitutionAcknowledged}
              crossBranchAcknowledged={crossBranchAcknowledged}
              setCrossBranchAcknowledged={setCrossBranchAcknowledged}
              assignmentNeedsSubstitution={assignmentNeedsSubstitution}
              assignmentNeedsCrossBranch={assignmentNeedsCrossBranch}
              vehicleConflict={vehicleConflict}
              canAssign={canAssign}
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
          ) : (
            <StaffReadOnlyCard />
          )}
        </div>
        <div className="space-y-5">
          <ActivityCard booking={booking} />
          <CustomerCard booking={booking} staffView={!ownerView} />
        </div>
      </div>
    </div>
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
          label="Pickup / return"
          value={`${booking.pickup_branch?.name ?? "Branch unavailable"} → ${booking.return_branch?.name ?? "Branch unavailable"}`}
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
              ? `Delivery${booking.pickup_location ? ` · ${booking.pickup_location}` : ""}`
              : "Pickup at branch"
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
        <DetailField
          label="Preferred seats"
          value={
            booking.preferred_seat_count == null
              ? "Not recorded"
              : String(booking.preferred_seat_count)
          }
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
    { label: "Request created", value: booking.created_at },
    { label: "Booking record updated", value: booking.updated_at },
    { label: "Pickup scheduled", value: booking.pickup_at },
    { label: "Return scheduled", value: booking.return_at },
    ...(booking.rental?.started_at
      ? [{ label: "Rental started", value: booking.rental.started_at }]
      : []),
    ...(booking.rental?.ended_at
      ? [{ label: "Rental ended", value: booking.rental.ended_at }]
      : []),
  ];
  return (
    <Card>
      <CardHeader
        title="Activity and timing"
        hint="Record timestamps; this is not an audit trail."
      />
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <div
            key={entry.label}
            className="flex items-start gap-3 px-5 py-3 text-sm"
          >
            <Clock3
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="flex-1">{entry.label}</span>
            <time className="text-right text-xs text-muted-foreground">
              {formatAdminDateTime(entry.value)}
            </time>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OwnerActionArea({
  booking,
  candidates,
  selectedVehicle,
  selectedVehicleId,
  setSelectedVehicleId,
  assignmentNote,
  setAssignmentNote,
  substitutionAcknowledged,
  setSubstitutionAcknowledged,
  crossBranchAcknowledged,
  setCrossBranchAcknowledged,
  assignmentNeedsSubstitution,
  assignmentNeedsCrossBranch,
  vehicleConflict,
  canAssign,
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
  candidates: AdminVehicle[];
  selectedVehicle: AdminVehicle | null;
  selectedVehicleId: string;
  setSelectedVehicleId: (value: string) => void;
  assignmentNote: string;
  setAssignmentNote: (value: string) => void;
  substitutionAcknowledged: boolean;
  setSubstitutionAcknowledged: (value: boolean) => void;
  crossBranchAcknowledged: boolean;
  setCrossBranchAcknowledged: (value: boolean) => void;
  assignmentNeedsSubstitution: boolean;
  assignmentNeedsCrossBranch: boolean;
  vehicleConflict: boolean;
  canAssign: boolean;
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
      {booking.booking_status === "Submitted" ? (
        <Card>
          <CardHeader
            title="Assignment"
            hint="Assign only an active candidate from the authorized vehicle response."
          />
          <div className="space-y-4 px-5 py-5">
            <label
              className="block text-sm font-medium"
              htmlFor="assignment-vehicle"
            >
              <span>Vehicle</span>
              <TSelect
                id="assignment-vehicle"
                name="assignment-vehicle"
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                className="mt-2"
              >
                <option value="">Select a vehicle…</option>
                {candidates.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                    {vehicle.license_plate ? ` · ${vehicle.license_plate}` : ""}
                    {vehicle.branch?.name ? ` · ${vehicle.branch.name}` : ""}
                  </option>
                ))}
              </TSelect>
            </label>
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Vehicle candidates are unavailable for this role or source
                response. No assignment control is enabled.
              </p>
            ) : null}
            {selectedVehicle ? (
              <div className="rounded-md border border-border bg-secondary/45 px-3 py-3 text-sm">
                <p className="font-semibold">{selectedVehicle.name}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedVehicle.branch?.name ?? "Branch unavailable"}
                  {selectedVehicle.license_plate
                    ? ` · ${selectedVehicle.license_plate}`
                    : ""}
                </p>
              </div>
            ) : null}
            {vehicleConflict ? (
              <p className="text-sm text-[#8d302f]" role="alert">
                This vehicle appears in another confirmed request for the same
                schedule. Choose another canonical candidate.
              </p>
            ) : null}
            <label
              className="block text-sm font-medium"
              htmlFor="assignment-note"
            >
              <span>Assignment note</span>
              <TInput
                id="assignment-note"
                name="assignment-note"
                value={assignmentNote}
                onChange={(event) => setAssignmentNote(event.target.value)}
                placeholder="Required for substitution or cross-branch assignment"
                className="mt-2"
              />
            </label>
            {assignmentNeedsSubstitution ? (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={substitutionAcknowledged}
                  onChange={(event) =>
                    setSubstitutionAcknowledged(event.target.checked)
                  }
                  className="mt-1 h-4 w-4"
                />
                <span>
                  Record that this assignment substitutes the requested vehicle.
                </span>
              </label>
            ) : null}
            {assignmentNeedsCrossBranch ? (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={crossBranchAcknowledged}
                  onChange={(event) =>
                    setCrossBranchAcknowledged(event.target.checked)
                  }
                  className="mt-1 h-4 w-4"
                />
                <span>
                  Record that this assignment crosses the pickup branch.
                </span>
              </label>
            ) : null}
            <Btn
              variant="primary"
              disabled={
                !canAssign ||
                busyAction !== null ||
                (assignmentNeedsSubstitution &&
                  (!substitutionAcknowledged || !assignmentNote.trim())) ||
                (assignmentNeedsCrossBranch &&
                  (!crossBranchAcknowledged || !assignmentNote.trim()))
              }
              onClick={() =>
                void onAction(
                  "assign",
                  {
                    vehicleId: selectedVehicleId,
                    assignmentNote: assignmentNote.trim() || null,
                    substitutionAcknowledged,
                    crossBranchAcknowledged,
                  },
                  "Vehicle assignment saved.",
                )
              }
            >
              {busyAction === "assign" ? "Assigning…" : "Assign vehicle"}
            </Btn>
          </div>
        </Card>
      ) : null}
      {booking.booking_status === "Submitted" ? (
        <Card>
          <CardHeader
            title="Confirmation"
            hint="The server requires assignment, verified requirements, and verified payment."
          />
          <div className="space-y-4 px-5 py-5">
            <PrerequisiteRow
              label="Assigned vehicle"
              ready={Boolean(
                booking.assigned_vehicle_id && booking.assigned_at,
              )}
            />
            <PrerequisiteRow
              label="Requirements verified"
              ready={booking.requirement_status === "Verified"}
            />
            <PrerequisiteRow
              label="Payment verified"
              ready={booking.payment_status === "Verified"}
            />
            <Btn
              variant="primary"
              disabled={!canConfirm || busyAction !== null}
              onClick={() =>
                void onAction(
                  "confirm",
                  {
                    expectedAssignedVehicleId: booking.assigned_vehicle_id,
                    expectedAssignedAt: booking.assigned_at,
                  },
                  "Booking confirmed.",
                )
              }
            >
              {busyAction === "confirm" ? "Confirming…" : "Confirm booking"}
            </Btn>
          </div>
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
      {!canAssign && !canConfirm && !canRelease && !canReturn ? (
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
    <Card>
      <CardHeader
        title="Customer"
        hint={
          staffView
            ? "Customer context available to Operations Staff."
            : "Customer context from the canonical booking record."
        }
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
          <DetailField
            label="Seat preference"
            value={
              booking.preferred_seat_count == null
                ? "Not recorded"
                : `${booking.preferred_seat_count} seats`
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
