import { useCallback, useEffect, useRef, useState } from "react";
import { CategorizedField } from "./CategorizedField";
import { validCategory } from "@/lib/booking-categories";
import { readFetch } from "@/lib/read-fetch";
import type { Database } from "@/lib/supabase/database.types";
import { customerCancellationAction } from "@/lib/customer-cancellation";
type Cancellation =
  Database["public"]["Tables"]["booking_cancellation_requests"]["Row"];
export function CancellationRequests({
  booking,
  admin = false,
  paymentUnavailable = false,
  onChanged,
}: {
  booking: {
    id: string;
    booking_status: string;
    payment_status?: string | null;
    rental?: unknown;
  };
  admin?: boolean;
  paymentUnavailable?: boolean;
  onChanged: () => Promise<void>;
}) {
  const [rows, setRows] = useState<Cancellation[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [reason, setReason] = useState(""),
    [ack, setAck] = useState(false),
    [reviewReason, setReviewReason] = useState("");
  const version = useRef(0);
  const invalidateLoads = useCallback(() => {
    version.current += 1;
  }, []);
  const load = useCallback(async () => {
    const current = ++version.current;
    try {
      const response = await readFetch(
        `/api/booking-cancellations?bookingId=${encodeURIComponent(booking.id)}`,
        { credentials: "same-origin" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (current !== version.current) return;
      setRows(data.requests);
      setLoaded(true);
      setError("");
    } catch (cause) {
      if (current !== version.current) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load cancellation requests.",
      );
    }
  }, [booking.id]);
  useEffect(() => {
    setRows([]);
    setLoaded(false);
    void load();
    return invalidateLoads;
  }, [load, invalidateLoads]);
  const pending = rows.find((r) => r.status === "Pending");
  const eligible =
    customerCancellationAction(
      booking,
      booking.payment_status,
      paymentUnavailable,
    ) === "request";
  async function send(action: "request" | "approve" | "reject") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/booking-cancellations", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          requestId: pending?.id,
          action,
          reason: action === "request" ? reason : reviewReason,
          acknowledged: ack,
          paymentChecked: ack,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      setAck(false);
      setReason("");
      setReviewReason("");
      await load();
      await onChanged();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save this request.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (loaded && !rows.length && (admin || !eligible)) return null;
  return (
    <section
      className="booking-cancellation-requests"
      aria-labelledby={`cancellation-title-${booking.id}`}
    >
      <h3 id={`cancellation-title-${booking.id}`}>Cancellation requests</h3>
      {error && (
        <p role="alert">
          {error}{" "}
          <button type="button" onClick={() => void load()}>
            Retry
          </button>
        </p>
      )}
      {!loaded && !error && <p role="status">Loading cancellation requests…</p>}
      {rows.map((row) => (
        <article key={row.id}>
          <strong>
            {row.status === "Rejected"
              ? "Declined"
              : row.status === "Approved"
                ? "Cancellation approved"
                : "Awaiting cancellation review"}
          </strong>
          <p>{row.reason}</p>
          {row.review_reason && <p>{row.review_reason}</p>}
        </article>
      ))}
      {loaded && pending && admin && (
        <div>
          <label>
            Decision explanation
            <textarea
              maxLength={500}
              value={reviewReason}
              onChange={(event) => setReviewReason(event.target.value)}
            />
          </label>
          <label className="booking-cancellation-requests__ack">
            <input
              type="checkbox"
              checked={ack}
              onChange={(event) => setAck(event.target.checked)}
            />
            I checked the payment record and the accepted cancellation terms.
          </label>
          <p>
            Approval cancels the reservation and releases its dates. Payment
            records are retained; this does not issue a refund.
          </p>
          <div className="booking-cancellation-requests__actions">
            <button
              type="button"
              disabled={busy || !eligible || !ack || !reviewReason.trim()}
              onClick={() => void send("approve")}
            >
              Approve cancellation
            </button>
            <button
              type="button"
              disabled={busy || !reviewReason.trim()}
              onClick={() => void send("reject")}
            >
              Decline request
            </button>
          </div>
        </div>
      )}
      {loaded && !admin && eligible && !pending && (
        <details>
          <summary>Request cancellation</summary>
          <p>
            The reservation stays in place while the owner reviews your request.
            Your accepted cancellation terms still apply.
          </p>
          <CategorizedField
            id={`cancellation-reason-${booking.id}`}
            label="Reason for cancellation"
            domain="cancellation"
            value={reason}
            onChange={setReason}
          />
          <label className="booking-cancellation-requests__ack">
            <input
              type="checkbox"
              checked={ack}
              onChange={(event) => setAck(event.target.checked)}
            />
            I understand this request needs admin review and does not cancel my
            reservation yet.
          </label>
          <button
            type="button"
            disabled={busy || !ack || !validCategory("cancellation", reason)}
            onClick={() => void send("request")}
          >
            {busy ? "Sending…" : "Send cancellation request"}
          </button>
        </details>
      )}
      {!admin && pending && (
        <p>
          Your reservation remains in place until the owner approves
          cancellation. Check this booking and Notifications for the decision.
        </p>
      )}
    </section>
  );
}
