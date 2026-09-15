import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileWarning,
  RefreshCw,
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
} from "@/components/admin/ui";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  currentPaymentProof,
  exactAdminEntity,
  formatAdminDateTime,
  formatAdminMoney,
  paymentAmountPresentation,
  statusTone,
  type AdminBooking,
  type AdminPayment,
  type AdminPaymentProof,
} from "@/lib/admin-presentations";
import { parseAdminBookingResponse } from "@/lib/booking-retrieval";

export const Route = createFileRoute("/admin/payments/$paymentId")({
  beforeLoad: () => {
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: PaymentReviewPage,
});

type DetailData = {
  payment: AdminPayment;
  booking: AdminBooking | null;
  contextError: string | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not-found" }
  | { status: "ready"; data: DetailData };

type MutationState = { tone: "error" | "success"; message: string };

function PaymentReviewPage() {
  const { paymentId } = Route.useParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [mutation, setMutation] = useState<MutationState | null>(null);
  const [openingProof, setOpeningProof] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setMutation(null);
    try {
      const [paymentsResponse, bookingsResponse] = await Promise.all([
        fetch("/api/payments", { credentials: "same-origin" }),
        fetch("/api/bookings", { credentials: "same-origin" }),
      ]);
      const paymentsBody = (await paymentsResponse
        .json()
        .catch(() => null)) as {
        payments?: AdminPayment[];
        message?: string;
      } | null;
      if (
        !paymentsResponse.ok ||
        !paymentsBody ||
        !Array.isArray(paymentsBody.payments)
      ) {
        throw new Error(
          paymentsBody?.message ?? "Unable to load the payment record.",
        );
      }
      const payment = exactAdminEntity(paymentsBody.payments, paymentId);
      if (!payment) {
        setState({ status: "not-found" });
        return;
      }

      let booking: AdminBooking | null = null;
      let contextError: string | null = null;
      try {
        const bookings = await parseAdminBookingResponse(bookingsResponse, {
          allowStaffResponse: false,
        });
        booking = exactAdminEntity(
          bookings.bookings as AdminBooking[],
          payment.booking_id,
        );
        if (!booking)
          contextError =
            "The exact booking context is unavailable in the authorized booking response.";
      } catch (error) {
        contextError =
          error instanceof Error
            ? error.message
            : "Booking context is unavailable.";
      }
      setState({ status: "ready", data: { payment, booking, contextError } });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load the payment record.",
      });
    }
  }, [paymentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <div>
        <PageHeader
          title="Payment review"
          subtitle="Loading exact payment context…"
        />
        <Card>
          <LoadingRows count={5} />
        </Card>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div>
        <PageHeader
          title="Payment review"
          subtitle="The payment review workspace could not be loaded."
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
          title="Payment review"
          subtitle="The requested payment record is not available."
        />
        <Card>
          <EmptyState
            title="Payment not found"
            description="No proof or review action was opened because the exact payment identity is not present in the authorized payment response."
            action={
              <Link
                to="/admin/payments"
                className="touch-target inline-flex items-center font-semibold text-primary underline underline-offset-4"
              >
                Back to payment queue
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const { payment, booking, contextError } = state.data;
  const proof = currentPaymentProof(payment);
  const method =
    payment.payment_methods?.label ??
    payment.payment_method_label ??
    "Method not recorded";

  async function openProof() {
    if (!proof) return;
    setOpeningProof(true);
    setMutation(null);
    try {
      const response = await fetch(
        `/api/payments?proofId=${encodeURIComponent(proof.id)}`,
        { credentials: "same-origin" },
      );
      const body = (await response.json().catch(() => null)) as {
        url?: string;
        message?: string;
      } | null;
      if (!response.ok || !body?.url)
        throw new Error(
          body?.message ?? "This proof is unavailable for secure preview.",
        );
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMutation({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "This proof is unavailable for secure preview.",
      });
    } finally {
      setOpeningProof(false);
    }
  }

  async function reviewPayment(action: "verify" | "resubmit" | "pending") {
    if (payment.status !== "Pending Verification") return;
    if (!proof || proof.version == null) {
      setMutation({
        tone: "error",
        message:
          "A current payment proof is unavailable. The review cannot be submitted safely.",
      });
      return;
    }
    if (action === "resubmit" && !reason.trim()) {
      setMutation({
        tone: "error",
        message: "A customer-facing reason is required for resubmission.",
      });
      return;
    }
    setSaving(true);
    setMutation(null);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          action,
          reason: reason.trim(),
          proofVersion: proof.version,
          submittedAmount: payment.submitted_amount,
          transactionReference: payment.transaction_reference,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? (body?.message ??
                "Payment details changed; reload before reviewing.")
            : (body?.message ?? "Unable to save the payment review."),
        );
      }
      setReason("");
      await load();
      setMutation({
        tone: "success",
        message:
          action === "verify"
            ? "Payment marked as verified."
            : action === "resubmit"
              ? "Resubmission requested."
              : "Payment left pending.",
      });
    } catch (error) {
      setMutation({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the payment review.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Owner/Admin review workspace"
        title={
          booking?.customer?.full_name ??
          payment.booking?.customer?.full_name ??
          "Payment review"
        }
        subtitle={`${bookingReferenceLabel(payment.booking_id)} · ${method}`}
        actions={
          <Link
            to="/admin/payments"
            className="touch-target inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Payment queue
          </Link>
        }
      />

      {contextError ? (
        <div
          className="mb-5 rounded-lg border border-[#d6e3ed] bg-[#f2f8fc] px-4 py-3 text-sm text-[#2e647b]"
          role="status"
        >
          {contextError} The payment record remains bound to{" "}
          {payment.booking_id}; no other booking was substituted.
        </div>
      ) : null}
      {mutation ? (
        <div
          className={`mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${mutation.tone === "error" ? "border-[#edc9c5] bg-[#fff5f3] text-[#8d302f]" : "border-[#b9d9c8] bg-[#f1faf4] text-[#267a55]"}`}
          role={mutation.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {mutation.tone === "error" ? (
            <FileWarning
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
          )}
          <span>{mutation.message}</span>
          {mutation.tone === "error" &&
          mutation.message.toLowerCase().includes("reload") ? (
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

      <div className="mb-5 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <ContextItem
          label="Customer"
          value={
            booking?.customer?.full_name ??
            payment.booking?.customer?.full_name ??
            "Customer unavailable"
          }
        />
        <ContextItem label="Booking" value={payment.booking_id} mono />
        <ContextItem
          label="Vehicle"
          value={
            booking?.assigned_vehicle?.name ??
            booking?.requested_vehicle?.name ??
            "Vehicle unavailable"
          }
        />
        <ContextItem label="Payment state" value={payment.status} status />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <Card>
          <CardHeader
            title="Payment submission"
            hint="Review the submitted record exactly as returned by the payment API."
          />
          <div className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
            <DetailField label="Method" value={method} />
            <DetailField
              label="Submitted amount"
              value={
                paymentAmountPresentation(payment.submitted_amount) ??
                "Amount not recorded"
              }
            />
            <DetailField
              label="Transaction reference"
              value={payment.transaction_reference ?? "Not recorded"}
              mono
            />
            <DetailField
              label="Submitted at"
              value={formatAdminDateTime(payment.submitted_at)}
            />
            <DetailField
              label="Updated at"
              value={formatAdminDateTime(payment.updated_at)}
            />
            <DetailField
              label="Canonical required amount"
              value={
                formatAdminMoney(payment.required_amount) ??
                "Unavailable in this record"
              }
            />
          </div>
          {payment.required_amount == null ? (
            <p className="border-t border-border bg-secondary/45 px-5 py-4 text-sm leading-6 text-muted-foreground">
              Required amount is unavailable in the current record. Review the
              submitted amount and proof without calculating a total here.
            </p>
          ) : null}
        </Card>

        <Card as="aside">
          <CardHeader
            title="Current proof"
            hint="Proof access uses the exact payment proof identity and a short-lived signed URL."
          />
          <div className="px-5 py-5">
            {proof ? (
              <>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      File
                    </dt>
                    <dd className="mt-1">
                      {proof.original_filename ?? "Filename unavailable"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      Version / submitted
                    </dt>
                    <dd className="mt-1">
                      {proof.version == null
                        ? "Version unavailable"
                        : `v${proof.version}`}{" "}
                      · {formatAdminDateTime(proof.uploaded_at)}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="touch-target mt-5 inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4"
                  onClick={() => void openProof()}
                  disabled={openingProof}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {openingProof ? "Opening…" : "Open secure proof"}
                </button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                <CreditCard
                  className="mb-3 h-6 w-6 text-primary"
                  aria-hidden="true"
                />
                <p>
                  Proof unavailable. No unbound or non-current proof is opened.
                </p>
              </div>
            )}
          </div>
        </Card>

        <ReviewActionPanel
          payment={payment}
          proof={proof}
          reason={reason}
          setReason={setReason}
          saving={saving}
          onReview={reviewPayment}
        />

        <Card>
          <CardHeader
            title="Booking context"
            hint="This context is joined using the exact payment.booking_id."
          />
          {booking ? (
            <div className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
              <DetailField
                label="Requested schedule"
                value={`${formatAdminDateTime(booking.pickup_at)} – ${formatAdminDateTime(booking.return_at)}`}
              />
              <DetailField
                label="Pickup / return"
                value={`${booking.pickup_branch?.name ?? "Branch unavailable"} → ${booking.return_branch?.name ?? "Branch unavailable"}`}
              />
              <DetailField
                label="Requested vehicle"
                value={booking.requested_vehicle?.name ?? "Vehicle unavailable"}
              />
              <DetailField
                label="Assigned vehicle"
                value={booking.assigned_vehicle?.name ?? "Not assigned"}
              />
              <DetailField
                label="Booking state"
                value={booking.booking_status}
              />
            </div>
          ) : (
            <EmptyState
              title="Booking context unavailable"
              description="The payment remains bound to its exact booking ID; review the payment record only until that authorized booking read is restored."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function ReviewActionPanel({
  payment,
  proof,
  reason,
  setReason,
  saving,
  onReview,
}: {
  payment: AdminPayment;
  proof: AdminPaymentProof | null;
  reason: string;
  setReason: (value: string) => void;
  saving: boolean;
  onReview: (action: "verify" | "resubmit" | "pending") => Promise<void>;
}) {
  const reviewable = payment.status === "Pending Verification";
  return (
    <Card as="aside">
      <CardHeader
        title="Review action"
        hint={
          reviewable
            ? "Owner/Admin actions are sent to the canonical payment review endpoint."
            : "This payment is no longer in a server-reviewable state."
        }
      />
      <div className="space-y-4 px-5 py-5">
        <DomainStatus
          label={payment.status}
          tone={statusTone(payment.status)}
        />
        {!reviewable ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No review controls are enabled for this state. The record remains
            available for context.
          </p>
        ) : null}
        {payment.status === "Needs Resubmission" &&
        payment.resubmission_reason ? (
          <p className="rounded-md border border-[#edc9c5] bg-[#fff5f3] px-3 py-2 text-sm text-[#8d302f]">
            <strong>Resubmission reason:</strong> {payment.resubmission_reason}
          </p>
        ) : null}
        <label
          className="block text-sm font-medium"
          htmlFor="payment-review-reason"
        >
          <span>Customer-facing reason for resubmission</span>
          <TInput
            id="payment-review-reason"
            name="payment-review-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={!reviewable || saving}
            placeholder="Required for resubmission"
            className="mt-2"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Btn
            variant="primary"
            disabled={!reviewable || !proof || proof.version == null || saving}
            onClick={() => void onReview("verify")}
          >
            {saving ? "Saving…" : "Verify payment"}
          </Btn>
          <Btn
            variant="danger"
            disabled={!reviewable || !proof || proof.version == null || saving}
            onClick={() => void onReview("resubmit")}
          >
            Request resubmission
          </Btn>
          <Btn
            variant="ghost"
            disabled={!reviewable || !proof || proof.version == null || saving}
            onClick={() => void onReview("pending")}
          >
            Leave pending
          </Btn>
        </div>
      </div>
    </Card>
  );
}

function ContextItem({
  label,
  value,
  mono = false,
  status = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  status?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-1 truncate ${mono ? "font-mono text-xs" : "font-medium"}`}
      >
        {status ? (
          <DomainStatus label={value} tone={statusTone(value)} compact />
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className={`mt-1 text-sm ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function bookingReferenceLabel(id: string) {
  return id
    ? `Booking ${id.slice(0, 8).toUpperCase()}`
    : "Booking reference unavailable";
}
