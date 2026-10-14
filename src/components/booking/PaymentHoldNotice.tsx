import { useEffect, useState } from "react";
import {
  formatPaymentDeadline,
  paymentHoldExpired,
  type PaymentHold,
} from "@/lib/payment-hold";

export function PaymentHoldNotice({ hold }: { hold?: PaymentHold | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!hold || ["Completed", "Released"].includes(hold.state)) return null;
  const expired = paymentHoldExpired(hold, now);
  return (
    <aside
      className="booking-payment-resubmission-note"
      aria-label="Vehicle payment hold"
      role="status"
    >
      <strong>
        {expired
          ? "Payment window ended"
          : hold.state === "Review"
            ? "Your vehicle is held during payment review"
            : hold.state === "Verified"
              ? "Payment verified; vehicle remains held"
              : hold.state === "Correction"
                ? "Payment proof correction deadline"
                : "Your payment deadline"}
      </strong>
      <p>
        {expired
          ? "Your request and payment history remain saved. Contact the team to recheck vehicle availability before paying or submitting proof."
          : ["Review", "Verified"].includes(hold.state)
            ? "No payment reminder or automatic release applies while the team reviews your timely submission and completes confirmation."
            : `Submit your payment proof by ${formatPaymentDeadline(hold.deadline_at)}. The vehicle will remain held while timely proof is reviewed. After the deadline, availability must be checked again.`}
      </p>
    </aside>
  );
}

export function OwnerPaymentHold({ bookingId }: { bookingId: string }) {
  const [hold, setHold] = useState<PaymentHold | null>(null);
  const [deadline, setDeadline] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let current = true;
    fetch(`/api/payment-quote?bookingId=${encodeURIComponent(bookingId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw Error(body.message);
        return body;
      })
      .then((body) => {
        if (current) {
          setHold(body.hold);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (current)
          setMessage(
            "Unable to load the payment hold. Refresh before taking action.",
          );
      });
    return () => {
      current = false;
    };
  }, [bookingId]);
  async function extend(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/payment-quote", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bookingId,
          deadline: new Date(deadline + "+08:00").toISOString(),
          reason,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.message);
      setHold(body.hold);
      setDeadline("");
      setReason("");
      setMessage(
        "Deadline updated. Availability was checked and the customer was notified.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the deadline.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!loaded) return message ? <p role="alert">{message}</p> : null;
  if (!hold) return null;
  return (
    <section className="admin-booking-payment-terms">
      <PaymentHoldNotice hold={hold} />
      {hold.state === "Review" && hold.review_due_at ? (
        <p>
          Review due: {formatPaymentDeadline(hold.review_due_at)}. Overdue
          reviews are escalated without releasing the vehicle.
        </p>
      ) : null}
      {["AwaitingPayment", "Correction", "Expired"].includes(hold.state) ? (
        <form onSubmit={extend} className="grid gap-3">
          <label>
            New deadline (Manila time)
            <input
              className="customer-input"
              type="datetime-local"
              value={deadline}
              required
              disabled={busy}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </label>
          <label>
            Reason for extension
            <input
              className="customer-input"
              value={reason}
              maxLength={500}
              required
              disabled={busy}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <p>
            Renewing an expired hold requires an availability check. The saved
            price and payment records stay unchanged.
          </p>
          <button
            type="submit"
            className="customer-secondary-button"
            disabled={busy}
          >
            {busy ? "Checking availability…" : "Extend payment deadline"}
          </button>
        </form>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
