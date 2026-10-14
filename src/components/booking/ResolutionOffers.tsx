import { useCallback, useEffect, useRef, useState } from "react";
import { readFetch } from "@/lib/read-fetch";
import { instantToManilaDateTimeLocal } from "@/lib/business-time";
import type { Database } from "@/lib/supabase/database.types";
type Offer = Database["public"]["Tables"]["booking_resolution_offers"]["Row"];
const date = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export function ResolutionOffers({
  booking,
  admin = false,
  onChanged,
}: {
  booking: { id: string; pickup_at: string };
  admin?: boolean;
  onChanged: () => Promise<void>;
}) {
  const [rows, setRows] = useState<Offer[]>([]),
    [vehicles, setVehicles] = useState<{ id: string; name: string }[]>([]),
    [eligible, setEligible] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [vehicle, setVehicle] = useState(""),
    [pickup, setPickup] = useState(() =>
      instantToManilaDateTimeLocal(new Date(booking.pickup_at)),
    ),
    [note, setNote] = useState(""),
    [ack, setAck] = useState(false);
  const version = useRef(0);
  const invalidateLoads = useCallback(() => {
    version.current += 1;
  }, []);
  const load = useCallback(async () => {
    const current = ++version.current;
    try {
      const response = await readFetch(
        `/api/booking-resolution-offers?bookingId=${encodeURIComponent(booking.id)}`,
        { credentials: "same-origin" },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      if (current !== version.current) return;
      setRows(body.offers);
      setVehicles(body.vehicles);
      setEligible(body.eligible);
      setLoaded(true);
      setError("");
    } catch (cause) {
      if (current === version.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load alternative offers.",
        );
    }
  }, [booking.id]);
  useEffect(() => {
    setLoaded(false);
    setRows([]);
    setAck(false);
    setVehicle("");
    setNote("");
    setPickup(instantToManilaDateTimeLocal(new Date(booking.pickup_at)));
    void load();
    return invalidateLoads;
  }, [load, booking.pickup_at, invalidateLoads]);
  async function send(
    action: "create" | "accept" | "decline" | "withdraw",
    offerId?: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/booking-resolution-offers", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          action,
          offerId,
          vehicleId: vehicle,
          pickupAt: pickup,
          note,
          preservePrice: ack,
          acknowledged: ack,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      setAck(false);
      setNote("");
      await load();
      await onChanged();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The response could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  const pending = rows.find((row) => row.status === "Pending");
  if (loaded && !eligible && !rows.length) return null;
  return (
    <section
      className="booking-cancellation-requests"
      aria-labelledby={`resolution-title-${booking.id}`}
    >
      <h3 id={`resolution-title-${booking.id}`}>
        Alternative vehicle or dates
      </h3>
      {error && (
        <p role="alert">
          {error}{" "}
          <button type="button" disabled={busy} onClick={() => void load()}>
            Retry
          </button>
        </p>
      )}
      {!loaded && !error && <p role="status">Loading alternative offers…</p>}
      {rows.map((row) => {
        const quote = row.quote_snapshot as Record<string, unknown>;
        const total = Number(quote.total_amount);
        return (
          <article key={row.id}>
            <strong>
              {row.status === "Pending"
                ? eligible
                  ? "Awaiting customer response"
                  : "This offer can no longer be accepted"
                : `Offer ${row.status.toLowerCase()}`}
            </strong>
            <p>
              {vehicles.find((v) => v.id === row.proposed_vehicle_id)?.name ??
                "Vehicle reference unavailable"}
            </p>
            <p>
              {date(row.proposed_pickup_at)} – {date(row.proposed_return_at)}{" "}
              (Manila time)
            </p>
            <p>{row.note}</p>
            <p>
              {Number.isFinite(total)
                ? `Saved rental price: ${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(total)}. `
                : ""}
              The rental duration, saved charges and payment records are
              preserved.
            </p>
            {row.status === "Pending" && (
              <>
                <p>
                  This proposal does not reserve the alternative yet.
                  Availability is checked again when you accept.
                </p>
                {admin ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void send("withdraw", row.id)}
                  >
                    Withdraw offer
                  </button>
                ) : (
                  <>
                    <label className="booking-cancellation-requests__ack">
                      <input
                        type="checkbox"
                        checked={ack}
                        onChange={(event) => setAck(event.target.checked)}
                      />
                      I agree to this vehicle and these dates at the saved
                      price.
                    </label>
                    <div className="booking-cancellation-requests__actions">
                      <button
                        type="button"
                        disabled={busy || !ack || !eligible}
                        onClick={() => void send("accept", row.id)}
                      >
                        {busy ? "Saving…" : "Accept alternative"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void send("decline", row.id)}
                      >
                        Decline offer
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </article>
        );
      })}
      {admin && loaded && eligible && !pending && (
        <details>
          <summary>Propose an alternative</summary>
          <p>
            Offer a vehicle at the same pickup branch, in the same category and
            with enough seats. The rental duration and saved price stay the
            same. Resolve pending date-change or cancellation requests first.
          </p>
          <label>
            Alternative vehicle
            <select
              value={vehicle}
              onChange={(event) => setVehicle(event.target.value)}
            >
              <option value="">Choose a vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Handover date and time (Manila)
            <input
              type="datetime-local"
              step={3600}
              value={pickup}
              onChange={(event) => setPickup(event.target.value)}
            />
          </label>
          <p>
            Changed dates must start tomorrow or later, with handover and return
            between 8 AM and 6 PM, on the hour.
          </p>
          <label>
            Explain this option to the customer
            <textarea
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <label className="booking-cancellation-requests__ack">
            <input
              type="checkbox"
              checked={ack}
              onChange={(event) => setAck(event.target.checked)}
            />
            I will honor the saved rental price and charges for this
            alternative.
          </label>
          <button
            type="button"
            disabled={busy || !vehicle || !pickup || !note.trim() || !ack}
            onClick={() => void send("create")}
          >
            {busy ? "Sending…" : "Send alternative offer"}
          </button>
        </details>
      )}
    </section>
  );
}
