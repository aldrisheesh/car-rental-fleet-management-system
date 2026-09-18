import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Search,
} from "lucide-react";
import {
  DomainStatus,
  EmptyState,
  ErrorState,
  TInput,
} from "@/components/admin/ui";
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
    null,
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
              <PaymentReviewPreview payment={selectedPayment} />
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

function PaymentReviewPreview({ payment }: { payment: AdminPayment }) {
  const proof = currentPaymentProof(payment);
  const method =
    payment.payment_methods?.label ??
    payment.payment_method_label ??
    "Method not recorded";
  const booking = useBookingContext(payment.booking_id);
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
      <div className="admin-payments-preview__body">
        <PaymentProofViewer proof={proof} />
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
          <BookingDetails booking={booking} />
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
            <p>✓ Reference matches the booking.</p>
            <p>✓ Proof is clear and readable.</p>
          </section>
        </div>
      </div>
      <footer className="admin-payments-preview__footer">
        <p>
          Use resubmission only if the proof is unclear, cropped, or does not
          match the approved booking.
        </p>
        <Link
          to={`/admin/payments/${encodeURIComponent(payment.id)}` as never}
          className="admin-payments-preview__resubmit"
        >
          Request resubmission
        </Link>
        <Link
          to={`/admin/payments/${encodeURIComponent(payment.id)}` as never}
          className="admin-payments-preview__verify"
        >
          <CreditCard className="h-4 w-4" aria-hidden="true" /> Verify payment
        </Link>
      </footer>
    </aside>
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
}: {
  proof: ReturnType<typeof currentPaymentProof>;
}) {
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error" | "empty";
    url?: string;
    message?: string;
  }>({ status: proof ? "loading" : "empty" });
  useEffect(() => {
    let active = true;
    if (!proof) {
      setState({ status: "empty" });
      return;
    }
    setState({ status: "loading" });
    void fetch(`/api/payments?proofId=${encodeURIComponent(proof.id)}`, {
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
        if (active) setState({ status: "ready", url: body.url });
      })
      .catch((error) => {
        if (active)
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "This proof is unavailable for preview.",
          });
      });
    return () => {
      active = false;
    };
  }, [proof?.id]);
  if (state.status === "loading")
    return (
      <div className="admin-payments-proof-viewer is-loading">
        <FileText />
        <span>Loading secure proof…</span>
      </div>
    );
  if (state.status === "empty" || state.status === "error")
    return (
      <div className="admin-payments-proof-viewer is-empty">
        <FileText />
        <strong>
          {state.status === "error"
            ? "Preview unavailable"
            : "No current payment proof"}
        </strong>
        <span>
          {state.message ?? "No preview can be shown for this payment."}
        </span>
      </div>
    );
  return (
    <div
      className={`admin-payments-proof-viewer ${proof?.mime_type === "application/pdf" ? "is-pdf" : "is-image"}`}
    >
      {proof?.mime_type === "application/pdf" ? (
        <iframe
          title={`Preview of ${proof.original_filename ?? "payment proof"}`}
          src={state.url}
        />
      ) : (
        <img
          src={state.url}
          alt={`Preview of ${proof?.original_filename ?? "payment proof"}`}
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

function useBookingContext(bookingId: string) {
  const [state, setState] = useState<{
    status: "loading" | "ready" | "unavailable";
    booking: AdminBooking | null;
  }>({ status: "loading", booking: null });
  useEffect(() => {
    let active = true;
    setState({ status: "loading", booking: null });
    void fetch("/api/bookings", { credentials: "same-origin" })
      .then(async (response) => {
        const body = await parseAdminBookingResponse(response, {
          allowStaffResponse: false,
        });
        const booking = exactAdminEntity(
          body.bookings as AdminBooking[],
          bookingId,
        );
        if (active)
          setState({ status: booking ? "ready" : "unavailable", booking });
      })
      .catch(() => {
        if (active) setState({ status: "unavailable", booking: null });
      });
    return () => {
      active = false;
    };
  }, [bookingId]);
  return state;
}

function BookingDetails({
  booking,
}: {
  booking: ReturnType<typeof useBookingContext>;
}) {
  return (
    <section className="admin-payments-preview__booking">
      <h4>Booking details</h4>
      {booking.status === "loading" ? (
        <p className="admin-payments-preview__loading">
          Loading exact booking details…
        </p>
      ) : booking.booking ? (
        <dl>
          <div>
            <dt>Vehicle</dt>
            <dd>
              {booking.booking.assigned_vehicle?.name ??
                booking.booking.requested_vehicle?.name ??
                "Vehicle unavailable"}
            </dd>
          </div>
          <div>
            <dt>Rental dates</dt>
            <dd>
              {formatAdminDateTime(booking.booking.pickup_at)} –{" "}
              {formatAdminDateTime(booking.booking.return_at)}
            </dd>
          </div>
          <div>
            <dt>Pickup</dt>
            <dd>
              {booking.booking.pickup_delivery_option ??
                "Pickup option unavailable"}
            </dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>
              {booking.booking.pickup_branch?.name ??
                booking.booking.pickup_location ??
                "Location unavailable"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="admin-payments-preview__loading">
          Exact booking details are unavailable.
        </p>
      )}
    </section>
  );
}
