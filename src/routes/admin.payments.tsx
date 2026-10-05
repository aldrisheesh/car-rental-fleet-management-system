import { PaymentPdfPreview } from "@/components/booking/PaymentPdfPreview";
import { CategorizedField } from "@/components/booking/CategorizedField";
import { validCategory } from "@/lib/booking-categories";
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
  ImagePlus,
  Minus,
  Plus,
  Search,
} from "lucide-react";
import {
  Btn,
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
    // The principal view cookie is client-only; AdminShell gates rendering after hydration.
    if (typeof window === "undefined") return;
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
  amountMatches: boolean;
  referenceMatches: boolean;
  proofIsClear: boolean;
  paymentReceived: boolean;
};

type PaymentReviewConfirmation = {
  status: "confirmed" | "review-needed";
  message: string;
};

type AdminPaymentMethod = {
  id: string;
  code: string;
  label: string;
  recipient_name?: string | null;
  account_number?: string | null;
  qr_image_path?: string | null;
  qr_image_url?: string | null;
  is_active: boolean;
};
type PaymentMethodDraft = {
  id?: string;
  label: string;
  recipientName: string;
  accountNumber: string;
  isActive: boolean;
  qrImage: File | null;
  existingQrImageUrl: string | null;
};

const paymentQueuePageSize = 10;

const paymentChecklistStoragePrefix = "briah-payment-review-checklist:";

function paymentChecklistStorageKey(
  payment: AdminPayment,
  proof: ReturnType<typeof currentPaymentProof>,
) {
  return `${paymentChecklistStoragePrefix}${payment.id}:${proof?.id ?? "none"}:${proof?.version ?? 0}`;
}

function readPaymentChecklist(key: string): PaymentChecklist {
  const empty = {
    amountMatches: false,
    referenceMatches: false,
    proofIsClear: false,
    paymentReceived: false,
  };
  if (typeof window === "undefined") return empty;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(key) ?? "null",
    ) as Partial<PaymentChecklist> | null;
    return {
      amountMatches: stored?.amountMatches === true,
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
    !checklist.amountMatches &&
      "The amount shown does not match the amount due.",
    !checklist.referenceMatches &&
      "The payment reference does not match the booking.",
    !checklist.proofIsClear && "The payment proof is unclear or unreadable.",
    !checklist.paymentReceived &&
      "We could not confirm that the payment was received.",
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
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const searchStr = useRouterState({
    select: (state) => state.location.searchStr,
  });
  const search = new URLSearchParams(searchStr);
  const focusedPaymentId = search.get("payment");
  const isFocusedReview = Boolean(focusedPaymentId);
  const returnToLedger = search.get("returnTo") === "ledger";
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null,
  );
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);

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
        bookingReference(payment.booking_id),
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

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / paymentQueuePageSize),
  );
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (currentPage - 1) * paymentQueuePageSize,
    currentPage * paymentQueuePageSize,
  );

  const clearFilters = () => {
    setPage(1);
    setQuery("");
    setStatus("");
  };

  const reviewPayment = useCallback(
    async (
      payment: AdminPayment,
      action: "verify" | "resubmit",
      reason = "",
    ): Promise<PaymentReviewConfirmation | undefined> => {
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
        confirmation?: PaymentReviewConfirmation;
      } | null;
      if (!response.ok)
        throw new Error(body?.message ?? "Unable to save the payment review.");
      await load();
      return body?.confirmation;
    },
    [load],
  );

  const selectedPayment = isFocusedReview
    ? (payments.find((payment) => payment.id === focusedPaymentId) ?? null)
    : (pageRows.find((payment) => payment.id === selectedPaymentId) ??
      pageRows.find((payment) => payment.status === "Pending Verification") ??
      pageRows[0] ??
      null);
  return (
    <div
      className={`admin-payments-workspace${isFocusedReview ? " admin-payments-workspace--focused" : ""}`}
      aria-busy={state.status === "loading" || undefined}
    >
      {!isFocusedReview ? (
        <header className="admin-payments-heading">
          <div>
            <span>Operations</span>
            <h1>Payment review</h1>
            <p>
              Check the submitted proof, then verify or return it for
              correction.
            </p>
          </div>
          <div className="admin-payments-heading__actions">
            <p className="admin-payments-heading__context">
              Payment follows an approved rental request.
            </p>
            <Btn
              variant="ghost"
              className="border border-[#cbd8d4]"
              onClick={() => setPaymentMethodsOpen(true)}
            >
              Manage payment methods
            </Btn>
          </div>
        </header>
      ) : null}
      {!isFocusedReview ? (
        <PaymentMethodManager
          open={paymentMethodsOpen}
          onOpenChange={setPaymentMethodsOpen}
        />
      ) : null}

      {state.status === "loading" ? (
        <PaymentWorkspaceLoading />
      ) : state.status === "error" ? (
        <section className="admin-payments-message">
          <ErrorState message={state.message} onRetry={() => void load()} />
        </section>
      ) : isFocusedReview && !selectedPayment ? (
        <section className="admin-payments-message">
          <EmptyState
            title="Payment record unavailable"
            description="This payment may have been removed or is no longer available for review."
            action={
              <Link
                to="/admin/payments"
                className="touch-target text-sm font-semibold text-primary underline underline-offset-4"
              >
                Back to payment queue
              </Link>
            }
          />
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
          {selectedPayment && isFocusedReview ? (
            <PaymentReviewPreview
              key={selectedPayment.id}
              payment={selectedPayment}
              onReview={reviewPayment}
              focused
              returnToLedger={returnToLedger}
            />
          ) : selectedPayment ? (
            <div className="admin-payments-layout">
              <PaymentQueue
                rows={pageRows}
                total={filtered.length}
                page={currentPage}
                pageCount={pageCount}
                onPageChange={(next) => {
                  setPage(next);
                  setSelectedPaymentId(null);
                }}
                allRows={payments}
                selectedId={selectedPayment.id}
                onSelect={setSelectedPaymentId}
                query={query}
                setQuery={(value) => {
                  setQuery(value);
                  setPage(1);
                  setSelectedPaymentId(null);
                }}
                status={status}
                setStatus={(value) => {
                  setStatus(value);
                  setPage(1);
                  setSelectedPaymentId(null);
                }}
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

const emptyPaymentMethodDraft = (): PaymentMethodDraft => ({
  label: "",
  recipientName: "",
  accountNumber: "",
  isActive: true,
  qrImage: null,
  existingQrImageUrl: null,
});

function PaymentMethodManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [methods, setMethods] = useState<AdminPaymentMethod[]>([]);
  const [draft, setDraft] = useState<PaymentMethodDraft>(
    emptyPaymentMethodDraft,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [localQrPreview, setLocalQrPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/payment-methods", {
        credentials: "same-origin",
      });
      const body = (await response.json().catch(() => null)) as {
        paymentMethods?: AdminPaymentMethod[];
        message?: string;
      } | null;
      if (!response.ok || !body || !Array.isArray(body.paymentMethods)) {
        throw new Error(body?.message ?? "Unable to load payment methods.");
      }
      setMethods(body.paymentMethods);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load payment methods.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [load, open]);

  useEffect(() => {
    if (!draft.qrImage) {
      setLocalQrPreview(null);
      return;
    }
    const nextUrl = URL.createObjectURL(draft.qrImage);
    setLocalQrPreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [draft.qrImage]);

  const qrPreview = localQrPreview ?? draft.existingQrImageUrl;

  function edit(method: AdminPaymentMethod) {
    setMessage("");
    setDraft({
      id: method.id,
      label: method.label,
      recipientName: method.recipient_name ?? "",
      accountNumber: method.account_number ?? "",
      isActive: method.is_active,
      qrImage: null,
      existingQrImageUrl: method.qr_image_url ?? null,
    });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("action", draft.id ? "update" : "create");
      if (draft.id) form.set("id", draft.id);
      form.set("label", draft.label);
      form.set("recipientName", draft.recipientName);
      form.set("accountNumber", draft.accountNumber);
      form.set("isActive", String(draft.isActive));
      if (draft.qrImage) form.set("qrImage", draft.qrImage);
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.message ?? "Unable to save payment method.");
      }
      await load();
      setDraft(emptyPaymentMethodDraft());
      setMessage(
        "Payment method saved. Active methods appear in the customer payment form.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save payment method.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-payment-methods-dialog max-h-[90vh] max-w-5xl overflow-y-auto p-0">
        <DialogHeader className="admin-payment-methods-dialog__header">
          <DialogTitle>Payment methods</DialogTitle>
          <DialogDescription>
            Add payment options and upload the QR image customers scan when they
            pay.
          </DialogDescription>
        </DialogHeader>

        <div className="admin-payment-methods-dialog__body">
          <section
            className="admin-payment-methods-dialog__list"
            aria-labelledby="payment-method-list-title"
          >
            <header>
              <h3 id="payment-method-list-title">Available methods</h3>
              <button
                type="button"
                onClick={() => {
                  setDraft(emptyPaymentMethodDraft());
                  setMessage("");
                }}
              >
                Add method
              </button>
            </header>
            <div className="admin-payment-methods-dialog__list-items">
              {loading ? <p>Loading methods…</p> : null}
              {!loading && methods.length === 0 ? (
                <p>No payment methods have been configured.</p>
              ) : null}
              {methods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => edit(item)}
                  aria-pressed={draft.id === item.id}
                  className={draft.id === item.id ? "is-selected" : ""}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small>
                      {item.qr_image_path
                        ? "QR image ready"
                        : "QR image needed"}
                    </small>
                  </span>
                  <span className="admin-payment-methods-dialog__method-state">
                    {item.is_active ? "Active" : "Hidden"}
                    <ChevronRight size={16} aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <form
            id="payment-method-editor"
            className="admin-payment-methods-dialog__editor"
            onSubmit={save}
          >
            <div className="admin-payment-methods-dialog__editor-heading">
              <h3>{draft.id ? "Edit payment method" : "Add payment method"}</h3>
              <p>
                {draft.id
                  ? "Update the label, QR image, or customer availability."
                  : "Provide the customer-facing details for this payment method."}
              </p>
            </div>

            <label className="admin-payment-methods-dialog__field">
              <span>Payment method label</span>
              <TInput
                name="payment-method-label"
                autoComplete="off"
                value={draft.label}
                disabled={saving}
                required
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                placeholder="e.g. GCash"
              />
              <small>
                This is the name customers see when they choose how to pay.
              </small>
            </label>

            <section
              className="admin-payment-methods-dialog__recipient"
              aria-labelledby="payment-method-recipient-title"
            >
              <div>
                <h4 id="payment-method-recipient-title">
                  Recipient details <span>Optional</span>
                </h4>
                <p>
                  Shown beneath the QR code to help customers confirm the
                  receiving account.
                </p>
              </div>
              <div className="admin-payment-methods-dialog__recipient-fields">
                <label className="admin-payment-methods-dialog__field">
                  <span>Recipient name</span>
                  <TInput
                    name="recipient-name"
                    autoComplete="off"
                    value={draft.recipientName}
                    disabled={saving}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        recipientName: event.target.value,
                      }))
                    }
                    placeholder="e.g. Briah's Car Rental"
                  />
                </label>
                <label className="admin-payment-methods-dialog__field">
                  <span>Account number</span>
                  <TInput
                    name="account-number"
                    autoComplete="off"
                    spellCheck={false}
                    value={draft.accountNumber}
                    disabled={saving}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        accountNumber: event.target.value,
                      }))
                    }
                    placeholder="e.g. 0917 123 4567"
                  />
                </label>
              </div>
            </section>

            <section
              className="admin-payment-methods-dialog__qr"
              aria-labelledby="payment-method-qr-title"
            >
              <div>
                <h4 id="payment-method-qr-title">Payment QR image</h4>
                <p>Use the official QR image for this method.</p>
              </div>
              <div
                className={
                  qrPreview
                    ? "admin-payment-methods-dialog__qr-grid has-preview"
                    : "admin-payment-methods-dialog__qr-grid"
                }
              >
                <label
                  className="admin-payment-methods-dialog__upload"
                  htmlFor="payment-method-qr-image"
                >
                  <ImagePlus size={22} strokeWidth={1.7} aria-hidden="true" />
                  <span>
                    <strong>
                      {draft.qrImage ? "Replace image" : "Choose image"}
                    </strong>
                    <small>JPEG, PNG, or WebP · Up to 5 MiB</small>
                  </span>
                  <input
                    id="payment-method-qr-image"
                    name="qrImage"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={saving}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        qrImage: event.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </label>
                {qrPreview ? (
                  <figure className="admin-payment-methods-dialog__qr-preview">
                    <img
                      src={qrPreview}
                      alt="Current payment QR"
                      width={196}
                      height={196}
                    />
                    <figcaption>
                      {draft.qrImage?.name ?? "Current QR image"}
                    </figcaption>
                  </figure>
                ) : (
                  <div
                    className="admin-payment-methods-dialog__qr-placeholder"
                    aria-hidden="true"
                  >
                    <ImagePlus size={30} strokeWidth={1.4} />
                    <span>Image preview</span>
                  </div>
                )}
              </div>
            </section>

            <label className="admin-payment-methods-dialog__availability">
              <input
                type="checkbox"
                checked={draft.isActive}
                disabled={saving}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              <span>
                <strong>Show this method to customers</strong>
                <small>
                  You can hide it later without changing earlier payment
                  records.
                </small>
              </span>
            </label>

            {message ? (
              <p
                className="admin-payment-methods-dialog__message"
                role="status"
              >
                {message}
              </p>
            ) : null}
          </form>
        </div>

        <DialogFooter className="admin-payment-methods-dialog__footer">
          {draft.id ? (
            <Btn
              type="button"
              onClick={() => setDraft(emptyPaymentMethodDraft())}
            >
              Cancel edit
            </Btn>
          ) : null}
          <Btn
            type="submit"
            form="payment-method-editor"
            variant="primary"
            disabled={
              saving ||
              !draft.label.trim() ||
              (!draft.qrImage && !draft.existingQrImageUrl)
            }
          >
            {saving ? "Saving…" : "Save payment method"}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentQueue({
  rows,
  total,
  page,
  pageCount,
  onPageChange,
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
  total: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
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
          Payment queue <span>({total})</span>
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
      <nav
        className="admin-payments-pagination"
        aria-label="Payment queue pagination"
      >
        <p aria-live="polite">
          {(page - 1) * paymentQueuePageSize + 1}–
          {Math.min(page * paymentQueuePageSize, total)} of {total}
        </p>
        <div>
          <button
            type="button"
            aria-label="Previous payment queue page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span>
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            aria-label="Next payment queue page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </nav>
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
  focused = false,
  returnToLedger = false,
}: {
  payment: AdminPayment;
  onReview: (
    payment: AdminPayment,
    action: "verify" | "resubmit",
    reason?: string,
  ) => Promise<PaymentReviewConfirmation | undefined>;
  focused?: boolean;
  returnToLedger?: boolean;
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
    checklist.amountMatches &&
    checklist.referenceMatches &&
    checklist.proofIsClear &&
    checklist.paymentReceived &&
    !saving;

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
      const confirmation = await onReview(payment, "verify");
      if (typeof window !== "undefined")
        window.localStorage.removeItem(checklistKey);
      setFeedback(
        confirmation?.message ??
          "Payment verified. The queue has been refreshed.",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to verify this payment.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function requestResubmission() {
    const remark = resubmissionNote.trim();
    if (!reviewable || !validCategory("payment_review", remark)) return;
    setSaving(true);
    setFeedback("");
    try {
      await onReview(payment, "resubmit", remark);
      setResubmissionOpen(false);
      if (typeof window !== "undefined")
        window.localStorage.removeItem(checklistKey);
      setFeedback(
        "Resubmission requested. The customer can now send a corrected proof.",
      );
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
    setResubmissionNote("");
    setResubmissionOpen(true);
  }

  return (
    <aside
      className={`admin-payments-preview${focused ? " admin-payments-preview--focused" : ""}`}
      aria-labelledby="payment-preview-heading"
    >
      {focused ? (
        <header className="admin-payments-preview__focused-heading">
          {returnToLedger ? (
            <Link
              to="/admin/bookings/$bookingId"
              params={{ bookingId: payment.booking_id }}
              className="admin-payments-preview__back-link"
            >
              <ChevronLeft aria-hidden="true" /> Back to approval ledger
            </Link>
          ) : (
            <Link
              to="/admin/payments"
              search={{} as never}
              className="admin-payments-preview__back-link"
            >
              <ChevronLeft aria-hidden="true" /> Back to payment queue
            </Link>
          )}
          <div className="admin-payments-preview__focused-title">
            <div>
              <h1 id="payment-preview-heading">Review payment proof</h1>
              <p>Check the submitted proof against this rental record.</p>
            </div>
            <div className="admin-payments-preview__focused-meta">
              <div>
                <span>Booking reference</span>
                <strong>{bookingReference(payment.booking_id)}</strong>
              </div>
              <div>
                <span>Submitted</span>
                <strong>{formatAdminDateTime(payment.submitted_at)}</strong>
              </div>
              <DomainStatus
                label={payment.status}
                tone={statusTone(payment.status)}
                compact
              />
            </div>
          </div>
        </header>
      ) : (
        <header className="admin-payments-preview__heading">
          <div>
            <h2 id="payment-preview-heading">Review payment proof</h2>
            <span>{bookingReference(payment.booking_id)}</span>
          </div>
          <span className="admin-payments-preview__sequence">
            <ChevronLeft aria-hidden="true" />
            <span className="admin-payments-preview__sequence-label">
              1 of 1
            </span>
            <ChevronRight aria-hidden="true" />
          </span>
        </header>
      )}
      {reviewContext.status === "loading" ? (
        <PaymentReviewSelectionLoading />
      ) : (
        <div className="admin-payments-preview__body">
          <PaymentProofViewer proof={proof} source={reviewContext.proof} />
          <div className="admin-payments-preview__details">
            {!focused ? (
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
            ) : null}
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
            {focused ? <QuoteComputation payment={payment} /> : null}
            <section className="admin-payments-preview__check">
              <h4>Verification checklist</h4>
              <label>
                <input
                  type="checkbox"
                  checked={checklist.amountMatches}
                  disabled={!reviewable || saving}
                  onChange={(event) =>
                    setChecklist((current) => ({
                      ...current,
                      amountMatches: event.target.checked,
                    }))
                  }
                />
                <span>Amount shown matches the amount due.</span>
              </label>
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
          <CreditCard className="h-4 w-4" aria-hidden="true" />{" "}
          {saving
            ? resubmissionOpen
              ? "Requesting correction…"
              : "Verifying…"
            : "Verify payment"}
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
            <CategorizedField
              id="payment-resubmission-remark"
              label="Reason for correction"
              domain="payment_review"
              value={resubmissionNote}
              onChange={setResubmissionNote}
              disabled={saving}
            />
            <p id="payment-resubmission-remark-help">
              Choose the main reason, then add any instructions the customer
              needs.
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
              disabled={
                saving || !validCategory("payment_review", resubmissionNote)
              }
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
  const decreaseZoom = () =>
    setZoom((current) => Math.max(0.75, current - 0.25));
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
      <div
        className="admin-payments-proof-viewer__zoom"
        aria-label="Proof zoom controls"
      >
        <button
          type="button"
          onClick={decreaseZoom}
          disabled={zoom <= 0.75}
          aria-label="Zoom out"
        >
          <Minus aria-hidden="true" />
        </button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button
          type="button"
          onClick={increaseZoom}
          disabled={zoom >= 2}
          aria-label="Zoom in"
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
      {proof?.mime_type === "application/pdf" ? (
        <PaymentPdfPreview
          source={source.url ?? ""}
          filename={proof.original_filename ?? "Payment proof"}
          zoom={zoom}
        />
      ) : (
        <img
          src={source.url}
          alt={`Preview of ${proof?.original_filename ?? "payment proof"}`}
          style={{
            width: "auto",
            height: `${30 * zoom}rem`,
            maxWidth: `${zoom * 100}%`,
            maxHeight: "none",
          }}
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

    void Promise.all([bookingRequest, proofRequest]).then(
      ([booking, preview]) => {
        if (!active) return;
        setState({
          status: "ready",
          booking: booking.booking,
          bookingMessage: booking.message,
          proof: preview,
        });
      },
    );
    return () => {
      active = false;
    };
  }, [payment.booking_id, payment.id, proof]);
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
            <dt>Service</dt>
            <dd>
              {booking.pickup_delivery_option === "delivery"
                ? "Delivery"
                : "Pickup"}
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

function QuoteComputation({ payment }: { payment: AdminPayment }) {
  const quote = payment.payment_quote;
  const amountDue =
    quote?.down_payment_amount ?? payment.required_amount ?? null;
  const amountSubmitted = payment.submitted_amount ?? null;

  return (
    <section className="admin-payments-preview__quote">
      <h4>Quote computation</h4>
      {quote ? (
        <dl>
          <div>
            <dt>
              Rental charge
              {quote.billable_days ? ` (${quote.billable_days} days)` : ""}
            </dt>
            <dd>{paymentAmountPresentation(quote.rental_subtotal)}</dd>
          </div>
          <div>
            <dt>Delivery fee</dt>
            <dd>{paymentAmountPresentation(quote.delivery_fee)}</dd>
          </div>
          <div className="admin-payments-preview__quote-total">
            <dt>Total rental price</dt>
            <dd>{paymentAmountPresentation(quote.total_amount)}</dd>
          </div>
          <div>
            <dt>Down payment due</dt>
            <dd>{paymentAmountPresentation(amountDue)}</dd>
          </div>
        </dl>
      ) : (
        <p className="admin-payments-preview__loading">
          The saved quote is unavailable. Review the submitted amount against
          the recorded amount due.
        </p>
      )}
      <div className="admin-payments-preview__submitted-amount">
        <span>Amount submitted</span>
        <strong>{paymentAmountPresentation(amountSubmitted)}</strong>
      </div>
    </section>
  );
}
