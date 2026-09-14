import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CreditCard, Search } from "lucide-react";
import {
  Card,
  DomainStatus,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  TInput,
  TSelect,
  Toolbar,
} from "@/components/admin/ui";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  formatAdminDateTime,
  formatAdminMoney,
  paymentAmountPresentation,
  statusTone,
  type AdminPayment,
} from "@/lib/admin-presentations";

export const Route = createFileRoute("/admin/payments")({
  beforeLoad: () => {
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: PaymentsQueuePage,
});

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; payments: AdminPayment[] };

function PaymentsQueuePage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

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

  return (
    <div>
      <PageHeader
        title="Payment review"
        subtitle="Review submitted payment records and proofs without calculating an amount the backend did not provide."
      />

      <Toolbar>
        <label className="min-w-0 flex-1 md:min-w-[320px]">
          <span className="sr-only">Search payment queue</span>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <TInput
              name="payment-search"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, booking, or reference…"
              className="pl-10"
            />
          </span>
        </label>
        <label className="min-w-[180px]">
          <span className="sr-only">Filter by payment status</span>
          <TSelect
            name="payment-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All payment states</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </TSelect>
        </label>
        <span className="inline-flex min-h-11 items-center text-sm text-muted-foreground">
          {state.status === "ready"
            ? `${filtered.length} of ${payments.length}`
            : "Loading payments…"}
        </span>
      </Toolbar>

      {state.status === "loading" ? (
        <Card>
          <LoadingRows count={5} />
        </Card>
      ) : state.status === "error" ? (
        <Card>
          <ErrorState message={state.message} onRetry={() => void load()} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
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
        </Card>
      ) : (
        <PaymentQueue rows={filtered} />
      )}
    </div>
  );
}

function PaymentQueue({ rows }: { rows: AdminPayment[] }) {
  return (
    <>
      <div className="hidden xl:block">
        <Card>
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Payment review queue"
            tabIndex={0}
          >
            <table className="w-full min-w-[930px] text-left text-sm">
              <caption className="sr-only">
                Canonical payment records awaiting or having a recorded review
              </caption>
              <thead className="border-b border-border bg-secondary/45 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-4">
                    Customer / booking
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Method
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Submitted amount
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Reference
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Submitted
                  </th>
                  <th scope="col" className="px-4 py-4">
                    State
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div className="space-y-3 xl:hidden">
        <p className="text-xs text-muted-foreground">
          Select a payment record to review its exact booking and proof context.
        </p>
        {rows.map((payment) => (
          <PaymentDisclosure key={payment.id} payment={payment} />
        ))}
      </div>
    </>
  );
}

function PaymentRow({ payment }: { payment: AdminPayment }) {
  return (
    <tr className="align-top hover:bg-secondary/35">
      <td className="px-4 py-4">
        <div className="font-semibold">
          {payment.booking?.customer?.full_name ?? "Customer unavailable"}
        </div>
        <div className="mt-1 font-mono text-xs text-muted-foreground">
          {payment.booking_id}
        </div>
      </td>
      <td className="px-4 py-4">
        {payment.payment_methods?.label ??
          payment.payment_method_label ??
          "Method not recorded"}
      </td>
      <td className="px-4 py-4 tabular-nums">
        {paymentAmountPresentation(payment.submitted_amount) ??
          "Amount not recorded"}
      </td>
      <td className="max-w-48 truncate px-4 py-4 font-mono text-xs">
        {payment.transaction_reference ?? "Not recorded"}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
        {formatAdminDateTime(payment.submitted_at)}
      </td>
      <td className="px-4 py-4">
        <DomainStatus
          label={payment.status}
          tone={statusTone(payment.status)}
        />
      </td>
      <td className="px-4 py-4">
        <PaymentLink paymentId={payment.id} />
      </td>
    </tr>
  );
}

function PaymentDisclosure({ payment }: { payment: AdminPayment }) {
  return (
    <details className="rounded-lg border border-border bg-card">
      <summary className="cursor-pointer list-none px-4 py-4 focus-visible:outline-none">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {payment.booking?.customer?.full_name ?? "Customer unavailable"}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {payment.payment_methods?.label ??
                payment.payment_method_label ??
                "Method not recorded"}{" "}
              ·{" "}
              {paymentAmountPresentation(payment.submitted_amount) ??
                "Amount not recorded"}
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {payment.booking_id}
            </p>
          </div>
          <DomainStatus
            label={payment.status}
            tone={statusTone(payment.status)}
            compact
          />
        </div>
      </summary>
      <div className="border-t border-border px-4 pb-4 pt-3">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              Reference
            </dt>
            <dd className="mt-1 font-mono text-xs">
              {payment.transaction_reference ?? "Not recorded"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              Submitted
            </dt>
            <dd className="mt-1 text-sm">
              {formatAdminDateTime(payment.submitted_at)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              Canonical required amount
            </dt>
            <dd className="mt-1 text-sm">
              {formatAdminMoney(payment.required_amount) ??
                "Unavailable in this record"}
            </dd>
          </div>
        </dl>
        <PaymentLink paymentId={payment.id} />
      </div>
    </details>
  );
}

function PaymentLink({ paymentId }: { paymentId: string }) {
  return (
    <Link
      to={`/admin/payments/${encodeURIComponent(paymentId)}` as never}
      className="touch-target inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:text-[#0d322e]"
    >
      <CreditCard className="h-4 w-4" aria-hidden="true" />
      Review payment
    </Link>
  );
}
