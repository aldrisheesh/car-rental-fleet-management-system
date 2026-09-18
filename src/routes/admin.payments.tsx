import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Minus,
  Plus,
  Search,
} from "lucide-react";
import {
  DomainStatus,
  EmptyState,
  ErrorState,
  TInput,
} from "@/components/admin/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  bookingReference,
  currentPaymentProof,
  exactAdminEntity,
  formatAdminDateTime,
  paymentAmountPresentation,
  statusTone,
  type AdminBooking,
  type AdminPayment,
} from "@/lib/admin-presentations";
import { parseAdminBookingResponse } from "@/lib/booking-retrieval";

export const Route = createFileRoute("/admin/payments")({
  beforeLoad: () => {
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: PaymentsRouteComponent,
});

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; payments: AdminPayment[] };

type PaymentChecklist = {
  referenceMatches: boolean;
  proofIsClear: boolean;
  paymentReceived: boolean;
};

const paymentChecklistStoragePrefix = "briah-payment-review-checklist:";

function paymentChecklistStorageKey(
  payment: AdminPayment,
  proof: ReturnType<typeof currentPaymentProof>,
) {
  return `${paymentChecklistStoragePrefix}${payment.id}:${proof?.id ?? "none"}:${proof?.version ?? 0}`;
}

function readPaymentChecklist(key: string): PaymentChecklist {
  const empty = {
    referenceMatches: false,
    proofIsClear: false,
    paymentReceived: false,
  };
  if (typeof window === "undefined") return empty;
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? "null") as
      | Partial<PaymentChecklist>
      | null;
    return {
      referenceMatches: stored?.referenceMatches === true,
      proofIsClear: stored?.proofIsClear === true,
      paymentReceived: stored?.paymentReceived === true,
    };
  } catch {
    return empty;
  }
}

function resubmissionRemark(checklist: PaymentChecklist) {
  const reasons = [
    !checklist.referenceMatches && "The payment reference does not match the booking.",
    !checklist.proofIsClear && "The payment proof is unclear or unreadable.",
    !checklist.paymentReceived && "We could not confirm that the payment was received.",
  ].filter(Boolean);
  return reasons.length
    ? reasons.join(" ")
    : "Please submit a corrected payment proof for review.";
}

function formatPaymentRentalWindow(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
}

function PaymentsRouteComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  return pathname === "/admin/payments" || pathname === "/admin/payments/" ? (
    <PaymentsQueuePage />
  ) : (
    <Outlet />
  );
}

function PaymentsQueuePage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    () =>
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("payment"),
  );

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/payments", {
        credentials: "same-origin",
      });
      const body = (await response.json().catch(() => null)) as {
        payments?: AdminPayment[];
        message?: string;
      } | null;
      if (!response.ok || !body || !Array.isArray(body.payments)) {
        throw new Error(body?.message ?? "Unable to load payments for review.");
      }
      setState({ status: "ready", payments: body.payments });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load payments for review.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const payments = useMemo(
    () => (state.status === "ready" ? state.payments : []),
    [state],
  );
  const statusOptions = useMemo(
    () => [...new Set(payments.map((payment) => payment.status))].sort(),
    [payments],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return payments.filter((payment) => {
      if (status && payment.status !== status) return false;
      if (!normalized) return true;
      return [
        payment.id,
        payment.booking_id,
        payment.booking?.customer?.full_name,
        payment.booking?.customer?.email,
        payment.transaction_reference,
        payment.payment_methods?.label,
        payment.payment_method_label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [payments, query, status]);

  const clearFilters = () => {
    setQuery("");
    setStatus("");
  };

  const reviewPayment = useCallback(
    async (
      payment: AdminPayment,
      action: "verify" | "resubmit",
      reason = "",
    ) => {
      const proof = currentPaymentProof(payment);
      if (!proof || proof.version == null)
        throw new Error("A current payment proof is required before review.");
      const response = await fetch("/api/payments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          action,
          reason,
          proofVersion: proof.version,
          submittedAmount: payment.submitted_amount,
          transactionReference: payment.transaction_reference ?? "",
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok)
        throw new Error(body?.message ?? "Unable to save the payment review.");
      await load();
    },
    [load],
  );

  const selectedPayment =
    filtered.find((payment) => payment.id === selectedPaymentId) ??
    filtered.find((payment) => payment.status === "Pending Verification") ??
    filtered[0] ??
    null;
  return (
    <div
      className="admin-payments-workspace"
      aria-busy={state.status === "loading" || undefined}
    >
      <header className="admin-payments-heading">
        <div>
          <span>Operations</span>
          <h1>Payment review</h1>
          <p>
            Check the submitted proof, then verify or return it for correction.
          </p>
        </div>
        <p className="admin-payments-heading__context">
          Payment follows an approved rental request.
        </p>
      </header>

      {state.status === "loading" ? (
        <PaymentWorkspaceLoading />
      ) : state.status === "error" ? (
        <section className="admin-payments-message">
          <ErrorState message={state.message} onRetry={() => void load()} />
        </section>
      ) : filtered.length === 0 ? (
        <section className="admin-payments-message">
          <EmptyState
            title={
              payments.length === 0
                ? "No payment records"
                : "No payments match these filters"
            }
            description={
              payments.length === 0
                ? "No canonical payment records are available for this Owner/Admin workspace."
                : "Clear the filters to review the current payment collection."
            }
            action={
              payments.length > 0 && (query || status) ? (
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
        </section>
      ) : (
        <>
          {selectedPayment ? (
            <div className="admin-payments-layout">
              <PaymentQueue
                rows={filtered}
                allRows={payments}
                selectedId={selectedPayment.id}
                onSelect={setSelectedPaymentId}
                query={query}
                setQuery={setQuery}
                status={status}
                setStatus={setStatus}
                statusOptions={statusOptions}
              />
              <PaymentReviewPreview
                key={selectedPayment.id}
                payment={selectedPayment}
                onReview={reviewPayment}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function PaymentQueue({
  rows,
  allRows,
  selectedId,
  onSelect,
  query,
  setQuery,
  status,
  setStatus,
  statusOptions,
}: {
  rows: AdminPayment[];
  allRows: AdminPayment[];
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  setQuery: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  statusOptions: string[];
}) {
  return (
    <section
      className="admin-payments-queue"
      aria-labelledby="payment-queue-heading"
    >
      <header className="admin-payments-queue__header">
        <h2 id="payment-queue-heading">
          Payment queue <span>({rows.length})</span>
        </h2>
        <label className="relative block">
          <span className="sr-only">Search payment queue</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <TInput
            name="payment-search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, booking reference or amount…"
            className="pl-9"
          />
        </label>
        <div
          className="admin-payments-queue__chips"
          aria-label="Filter payment queue"
        >
          <button
            type="button"
            className={status === "" ? "is-active" : ""}
            onClick={() => setStatus("")}
          >
            All <span>{allRows.length}</span>
          </button>
          {statusOptions.map((value) => (
            <button
              key={value}
              type="button"
              className={status === value ? "is-active" : ""}
              onClick={() => setStatus(value)}
            >
              {shortPaymentStatus(value)}{" "}
              <span>
                {allRows.filter((payment) => payment.status === value).length}
              </span>
            </button>
          ))}
        </div>
      </header>
      <div
        className="admin-payments-queue__list"
        role="list"
        aria-label="Payment review queue"
      >
        {rows.map((payment) => (
          <PaymentRow
            key={payment.id}
            payment={payment}
            selected={payment.id === selectedId}
            onSelect={() => onSelect(payment.id)}
          />
        ))}
      </div>
    </section>
  );
}

function PaymentRow({
  payment,
  selected,
  onSelect,
}: {
  payment: AdminPayment;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="listitem"
      className={`admin-payments-row ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="admin-payments-row__identity">
        <strong>
          {payment.booking?.customer?.full_name ?? "Customer unavailable"}
        </strong>
        <span>{bookingReference(payment.booking_id)}</span>
        <small>
          {payment.payment_methods?.label ??
            payment.payment_method_label ??
            "Method not recorded"}
        </small>
      </span>
      <span className="admin-payments-row__value">
        <strong>
          {paymentAmountPresentation(payment.submitted_amount) ??
            "Amount not recorded"}
        </strong>
        <DomainStatus
          label={payment.status}
          tone={statusTone(payment.status)}
          compact
        />
        <small>{formatAdminDateTime(payment.submitted_at)}</small>
      </span>
      <ChevronRight
        className="admin-payments-row__arrow h-4 w-4"
        aria-hidden="true"
      />
    </button>
  );
}

function PaymentReviewPreview({
  payment,
  onReview,
}: {
  payment: AdminPayment;
  onReview: (
    payment: AdminPayment,
    action: "verify" | "resubmit",
    reason?: string,
  ) => Promise<void>;
}) {
  const proof = currentPaymentProof(payment);
  const method =
    payment.payment_methods?.label ??
    payment.payment_method_label ??
    "Method not recorded";
  const reviewContext = usePaymentReviewContext(payment, proof);
  const checklistKey = paymentChecklistStorageKey(payment, proof);
  const [checklist, setChecklist] = useState<PaymentChecklist>(() =>
    readPaymentChecklist(checklistKey),
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [resubmissionOpen, setResubmissionOpen] = useState(false);
  const [resubmissionNote, setResubmissionNote] = useState("");
  const reviewable =
    payment.status === "Pending Verification" && proof?.version != null;
  const canVerify =
    reviewable &&
    checklist.referenceMatches &&
    checklist.proofIsClear &&
    checklist.paymentReceived &&
    !saving;
  const generatedResubmissionRemark = resubmissionRemark(checklist);

  useEffect(() => {
    setChecklist(readPaymentChecklist(checklistKey));
    setFeedback("");
    setSaving(false);
    setResubmissionOpen(false);
    setResubmissionNote("");
  }, [checklistKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(checklistKey, JSON.stringify(checklist));
    } catch {
      // The checklist remains usable even when browser storage is unavailable.
    }
  }, [checklist, checklistKey]);

  async function verify() {
    if (!canVerify) return;
    setSaving(true);
    setFeedback("");
    try {
      await onReview(payment, "verify");
      if (typeof window !== "undefined")
        window.localStorage.removeItem(checklistKey);
      setFeedback("Payment verified. The queue has been refreshed.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to verify this payment.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function requestResubmission() {
    const remark = resubmissionNote.trim();
    if (!reviewable || !remark) return;
    setSaving(true);
    setFeedback("");
    try {
      await onReview(payment, "resubmit", remark);
      setResubmissionOpen(false);
      if (typeof window !== "undefined")
        window.localStorage.removeItem(checklistKey);
      setFeedback("Resubmission requested. The customer can now send a corrected proof.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to request a resubmission.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openResubmission() {
    setResubmissionNote(generatedResubmissionRemark);
    setResubmissionOpen(true);
  }

  return (
    <aside
      className="admin-payments-preview"
      aria-labelledby="payment-preview-heading"
    >
      <header className="admin-payments-preview__heading">
        <div>
          <h2 id="payment-preview-heading">Review payment proof</h2>
          <span>{bookingReference(payment.booking_id)}</span>
        </div>
        <span className="admin-payments-preview__sequence">
          <ChevronLeft aria-hidden="true" />
          <span className="admin-payments-preview__sequence-label">1 of 1</span>
          <ChevronRight aria-hidden="true" />
        </span>
      </header>
      {reviewContext.status === "loading" ? (
        <PaymentReviewSelectionLoading />
      ) : (
        <div className="admin-payments-preview__body">
          <PaymentProofViewer proof={proof} source={reviewContext.proof} />
          <div className="admin-payments-preview__details">
          <section>
            <div className="admin-payments-preview__title">
              <div>
                <p>Booking reference</p>
                <h3>{bookingReference(payment.booking_id)}</h3>
              </div>
              <DomainStatus
                label={payment.status}
                tone={statusTone(payment.status)}
                compact
              />
            </div>
          </section>
          <section>
            <h4>Customer details</h4>
            <p>
              {payment.booking?.customer?.full_name ?? "Customer unavailable"}
            </p>
            <p>{payment.booking?.customer?.email ?? "Email unavailable"}</p>
          </section>
          <BookingDetails
            booking={reviewContext.booking}
            message={reviewContext.bookingMessage}
          />
          <section>
            <h4>Payment details</h4>
            <dl>
              <div>
                <dt>Submitted amount</dt>
                <dd>
                  {paymentAmountPresentation(payment.submitted_amount) ??
                    "Amount not recorded"}
                </dd>
              </div>
              <div>
                <dt>Date & time</dt>
                <dd>{formatAdminDateTime(payment.submitted_at)}</dd>
              </div>
              <div>
                <dt>Reference no.</dt>
                <dd className="font-mono">
                  {payment.transaction_reference ?? "Not recorded"}
                </dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{method}</dd>
              </div>
            </dl>
          </section>
          <section className="admin-payments-preview__check">
            <h4>Verification checklist</h4>
            <label>
              <input
                type="checkbox"
                checked={checklist.referenceMatches}
                disabled={!reviewable || saving}
                onChange={(event) =>
                  setChecklist((current) => ({
                    ...current,
                    referenceMatches: event.target.checked,
                  }))
                }
              />
              <span>Reference matches the booking.</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={checklist.proofIsClear}
                disabled={!reviewable || saving}
                onChange={(event) =>
                  setChecklist((current) => ({
                    ...current,
                    proofIsClear: event.target.checked,
                  }))
                }
              />
              <span>Proof is clear and readable.</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={checklist.paymentReceived}
                disabled={!reviewable || saving}
                onChange={(event) =>
                  setChecklist((current) => ({
                    ...current,
                    paymentReceived: event.target.checked,
                  }))
                }
              />
              <span>Payment received.</span>
            </label>
            {!reviewable ? (
              <p className="admin-payments-preview__check-note">
                This payment is not currently eligible for verification.
              </p>
            ) : null}
          </section>
          </div>
        </div>
      )}
      <footer className="admin-payments-preview__footer">
        <p>
          Use resubmission only if the proof is unclear, cropped, or does not
          match the approved booking.
        </p>
        <button
          type="button"
          className="admin-payments-preview__resubmit"
          disabled={!reviewable || saving || reviewContext.status === "loading"}
          onClick={openResubmission}
        >
          Request resubmission
        </button>
        <button
          type="button"
          className="admin-payments-preview__verify"
          disabled={!canVerify}
          onClick={() => void verify()}
        >
          <CreditCard className="h-4 w-4" aria-hidden="true" /> {saving ? "Verifying…" : "Verify payment"}
        </button>
        {feedback ? (
          <p className="admin-payments-preview__feedback" role="status">
            {feedback}
          </p>
        ) : null}
      </footer>
      <Dialog open={resubmissionOpen} onOpenChange={setResubmissionOpen}>
        <DialogContent className="admin-payment-resubmission-dialog">
          <DialogHeader>
            <DialogTitle className="admin-payment-resubmission-dialog__title">
              Request a corrected payment proof
            </DialogTitle>
            <DialogDescription className="admin-payment-resubmission-dialog__description">
              The customer will receive this remark with their payment request.
            </DialogDescription>
          </DialogHeader>
          <div className="admin-payment-resubmission-dialog__field">
            <label htmlFor="payment-resubmission-remark">Customer remark</label>
            <Textarea
              id="payment-resubmission-remark"
              className="admin-payment-resubmission-dialog__remark"
              value={resubmissionNote}
              onChange={(event) => setResubmissionNote(event.target.value)}
              maxLength={500}
              rows={3}
              disabled={saving}
              aria-describedby="payment-resubmission-remark-help"
            />
            <p id="payment-resubmission-remark-help">
              Suggested from the unchecked review items. You can adjust it before sending.
            </p>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="admin-payment-resubmission-dialog__cancel"
              onClick={() => setResubmissionOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-payment-resubmission-dialog__submit"
              onClick={() => void requestResubmission()}
              disabled={saving || !resubmissionNote.trim()}
            >
              {saving ? "Sending…" : "Confirm request"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function PaymentReviewSelectionLoading() {
  return (
    <div
      className="admin-payments-preview__selection-loading"
      aria-live="polite"
      aria-label="Loading payment review record"
    >
      <span className="sr-only">Loading payment review record</span>
      <div className="admin-payments-preview__selection-proof" />
      <div className="admin-payments-preview__selection-details">
        {Array.from({ length: 5 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </div>
  );
}

function PaymentWorkspaceLoading() {
  return (
    <div
      className="admin-payments-loading"
      role="status"
      aria-label="Loading payment review workspace"
    >
      <div className="admin-payments-loading__layout">
        <section className="admin-payments-loading__queue">
          <div>
            <i className="is-title" />
            <i className="is-search" />
            <span>
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div className="admin-payments-loading__queue-row" key={index}>
              <i />
              <i />
              <i />
            </div>
          ))}
        </section>
        <section className="admin-payments-loading__review">
          <header>
            <i className="is-title" />
            <i className="is-short" />
          </header>
          <div>
            <aside>
              <i />
            </aside>
            <section>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index}>
                  <i />
                  <i />
                  <i />
                </div>
              ))}
            </section>
          </div>
          <footer>
            <i />
            <i />
            <i />
          </footer>
        </section>
      </div>
    </div>
  );
}

function PaymentProofViewer({
  proof,
  source,
}: {
  proof: ReturnType<typeof currentPaymentProof>;
  source: PaymentProofSource;
}) {
  const [zoom, setZoom] = useState(1);
  const increaseZoom = () => setZoom((current) => Math.min(2, current + 0.25));
  const decreaseZoom = () => setZoom((current) => Math.max(0.75, current - 0.25));
  useEffect(() => {
    setZoom(1);
  }, [proof?.id]);
  if (source.status === "empty" || source.status === "error")
    return (
      <div className="admin-payments-proof-viewer is-empty">
        <FileText />
        <strong>
          {source.status === "error"
            ? "Preview unavailable"
            : "No current payment proof"}
        </strong>
        <span>
          {source.message ?? "No preview can be shown for this payment."}
        </span>
      </div>
    );
  return (
    <div
      className={`admin-payments-proof-viewer ${proof?.mime_type === "application/pdf" ? "is-pdf" : "is-image"}`}
    >
      <div className="admin-payments-proof-viewer__zoom" aria-label="Proof zoom controls">
        <button type="button" onClick={decreaseZoom} disabled={zoom <= 0.75} aria-label="Zoom out">
          <Minus aria-hidden="true" />
        </button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button type="button" onClick={increaseZoom} disabled={zoom >= 2} aria-label="Zoom in">
          <Plus aria-hidden="true" />
        </button>
      </div>
      {proof?.mime_type === "application/pdf" ? (
        <iframe
          title={`Preview of ${proof.original_filename ?? "payment proof"}`}
          src={source.url}
          style={{ width: `${zoom * 100}%`, height: `${31 * zoom}rem` }}
        />
      ) : (
        <img
          src={source.url}
          alt={`Preview of ${proof?.original_filename ?? "payment proof"}`}
          style={{ width: `${zoom * 100}%`, maxWidth: "none", maxHeight: "none" }}
        />
      )}
    </div>
  );
}

function shortPaymentStatus(status: string) {
  return status === "Pending Verification"
    ? "Pending"
    : status === "Needs Resubmission"
      ? "Returned"
      : status;
}

type PaymentProofSource = {
  status: "ready" | "empty" | "error";
  url?: string;
  message?: string;
};

type PaymentReviewContext =
  | { status: "loading" }
  | {
      status: "ready";
      booking: AdminBooking | null;
      bookingMessage?: string;
      proof: PaymentProofSource;
    };

function usePaymentReviewContext(
  payment: AdminPayment,
  proof: ReturnType<typeof currentPaymentProof>,
) {
  const [state, setState] = useState<PaymentReviewContext>({
    status: "loading",
  });
  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    const bookingRequest = fetch("/api/bookings", {
      credentials: "same-origin",
    })
      .then(async (response) => {
        const body = await parseAdminBookingResponse(response, {
          allowStaffResponse: false,
        });
        const booking = exactAdminEntity(
          body.bookings as AdminBooking[],
          payment.booking_id,
        );
        return {
          booking,
          message: booking
            ? undefined
            : "Exact booking details are unavailable.",
        };
      })
      .catch((error) => ({
        booking: null,
        message:
          error instanceof Error
            ? error.message
            : "Exact booking details are unavailable.",
      }));
    const proofRequest: Promise<PaymentProofSource> = !proof
      ? Promise.resolve({ status: "empty" })
      : fetch(`/api/payments?proofId=${encodeURIComponent(proof.id)}`, {
          credentials: "same-origin",
        })
          .then(async (response) => {
            const body = (await response.json().catch(() => null)) as {
              url?: string;
              message?: string;
            } | null;
            if (!response.ok || !body?.url)
              throw new Error(
                body?.message ?? "This proof is unavailable for preview.",
              );
            return { status: "ready", url: body.url } as const;
          })
          .catch((error) => ({
            status: "error" as const,
            message:
              error instanceof Error
                ? error.message
                : "This proof is unavailable for preview.",
          }));

    void Promise.all([bookingRequest, proofRequest]).then(([booking, preview]) => {
      if (!active) return;
      setState({
        status: "ready",
        booking: booking.booking,
        bookingMessage: booking.message,
        proof: preview,
      });
    });
    return () => {
      active = false;
    };
  }, [payment.booking_id, payment.id, proof?.id]);
  return state;
}

function BookingDetails({
  booking,
  message,
}: {
  booking: AdminBooking | null;
  message?: string;
}) {
  return (
    <section className="admin-payments-preview__booking">
      <h4>Booking details</h4>
      {booking ? (
        <dl>
          <div>
            <dt>Vehicle</dt>
            <dd>
              {booking.assigned_vehicle?.name ??
                booking.requested_vehicle?.name ??
                "Vehicle unavailable"}
            </dd>
          </div>
          <div className="admin-payments-preview__rental-dates">
            <dt>Rental dates</dt>
            <dd>
              {formatPaymentRentalWindow(booking.pickup_at, booking.return_at)}
            </dd>
          </div>
          <div>
            <dt>Pickup</dt>
            <dd>
              {booking.pickup_delivery_option ??
                "Pickup option unavailable"}
            </dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>
              {booking.pickup_branch?.name ??
                booking.pickup_location ??
                "Location unavailable"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="admin-payments-preview__loading">
          {message ?? "Exact booking details are unavailable."}
        </p>
      )}
    </section>
  );
}
