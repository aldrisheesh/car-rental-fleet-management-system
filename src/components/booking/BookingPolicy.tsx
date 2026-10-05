import { CalendarDays, ShieldCheck } from "lucide-react";

export function BookingPolicy({ expanded = false }: { expanded?: boolean }) {
  return (
    <aside
      className="booking-policy"
      aria-label="Cancellation and date changes"
    >
      <h3>Cancellation & date changes</h3>
      <div className="booking-policy__row">
        <ShieldCheck size={18} aria-hidden="true" />
        <p>
          <strong>
            Your 50% down payment is non-refundable if you cancel.
          </strong>{" "}
          The security deposit collected at handover is separate and refundable.
        </p>
      </div>
      <div className="booking-policy__row">
        <CalendarDays size={18} aria-hidden="true" />
        <div>
          <p>
            Request new dates before handover, subject to availability and
            approval. Your original booking stays in place until approved.
          </p>
          {expanded ? (
            <p className="booking-policy__date-rules">
              Online requests keep the same vehicle, rental duration and saved
              price. Contact the team for a revised quote if you need a
              different duration, vehicle or delivery service.
            </p>
          ) : (
            <details>
              <summary>Date-change rules</summary>
              <p>
                Online requests keep the same vehicle, rental duration and saved
                price. Contact the team for a revised quote if you need a
                different duration, vehicle or delivery service.
              </p>
            </details>
          )}
        </div>
      </div>
    </aside>
  );
}
