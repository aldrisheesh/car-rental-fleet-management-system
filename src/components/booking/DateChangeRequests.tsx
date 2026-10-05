import { HANDOVER_TIMES } from "@/lib/handover-times";
import { useCallback, useEffect, useState } from "react";
import { CategorizedField } from "./CategorizedField";
import { splitCategory, validCategory } from "@/lib/booking-categories";
import {
  hasRescheduleConflict,
  type RescheduleBlock,
} from "@/lib/reschedule-availability";
import { DateRangePicker } from "@/components/site/DateRangePicker";
import { RentalDateTrigger } from "@/components/site/RentalDateTrigger";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  instantToManilaDateTimeLocal,
  manilaDateTimeLocalToInstant,
} from "@/lib/business-time";
type DateChange = {
  id: string;
  requested_pickup_at: string;
  requested_return_at: string;
  reason: string;
  status: string;
  review_reason: string | null;
};
const time = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
const timeOptions = HANDOVER_TIMES;
const formatTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
};
function calendarDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}
function calendarValue(day: Date, clock: string) {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}T${clock}`;
}
export function DateChangeRequests({
  booking,
  admin = false,
  onChanged,
}: {
  booking: {
    id: string;
    booking_status: string;
    pickup_at: string;
    return_at: string;
    rental?: unknown;
  };
  admin?: boolean;
  onChanged: () => Promise<void>;
}) {
  const [rows, setRows] = useState<DateChange[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pickup, setPickup] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftDay, setDraftDay] = useState<Date>();
  const [draftTime, setDraftTime] = useState("");
  const [availability, setAvailability] = useState<RescheduleBlock[] | null>(
    null,
  );
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const [reason, setReason] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [handoverChecked, setHandoverChecked] = useState(false);
  const eligible =
    ["Submitted", "Confirmed"].includes(booking.booking_status) &&
    !booking.rental &&
    new Date(booking.pickup_at).getTime() > Date.now();
  const load = useCallback(async () => {
    setLoaded(false);
    try {
      const r = await fetch(
        `/api/booking-date-changes?bookingId=${encodeURIComponent(booking.id)}`,
      );
      const b = await r.json();
      if (!r.ok) throw Error(b.message);
      setRows(b.requests);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load date changes.");
    } finally {
      setLoaded(true);
    }
  }, [booking.id]);
  useEffect(() => {
    void load();
  }, [load]);
  const pending = rows.find((r) => r.status === "Pending");
  const next = manilaDateTimeLocalToInstant(pickup);
  const nextReturn = next
    ? new Date(
        next.getTime() +
          new Date(booking.return_at).getTime() -
          new Date(booking.pickup_at).getTime(),
      )
    : null;
  const duration =
    new Date(booking.return_at).getTime() -
    new Date(booking.pickup_at).getTime();
  const draftValue =
    draftDay && draftTime ? calendarValue(draftDay, draftTime) : "";
  const draftInstant = manilaDateTimeLocalToInstant(draftValue);
  const draftReturn = draftInstant
    ? instantToManilaDateTimeLocal(new Date(draftInstant.getTime() + duration))
    : "";
  const firstAvailableDate = calendarDate(
    instantToManilaDateTimeLocal(new Date(Date.now() + 86400000)),
  );
  const pickerTimes = timeOptions;
  useEffect(() => {
    if (!datePickerOpen) return;
    const controller = new AbortController();
    setAvailabilityLoading(true);
    setAvailability(null);
    setAvailabilityError("");
    void fetch(
      `/api/booking-date-changes?bookingId=${encodeURIComponent(booking.id)}&availability=true`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw Error("availability_unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setAvailability(data.blocks);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setAvailabilityError(
            "Availability could not be checked. Please try again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });
    return () => controller.abort();
  }, [datePickerOpen, booking.id, availabilityRetry]);
  const isStartUnavailable = (day: Date) =>
    availability !== null &&
    hasRescheduleConflict(
      manilaDateTimeLocalToInstant(calendarValue(day, draftTime)),
      duration,
      availability,
    );
  const draftUnavailable =
    !timeOptions.includes(draftTime) ||
    availability === null ||
    hasRescheduleConflict(draftInstant, duration, availability);
  async function save(action: string, requestId?: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/booking-date-changes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          action,
          requestId,
          pickupAt: pickup,
          reason: action === "request" ? reason : reviewReason,
          handoverChecked,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.message);
      await load();
      await onChanged();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save date change.");
    } finally {
      setBusy(false);
    }
  }
  if ((!eligible || admin) && !rows.length && !error) return null;
  return (
    <section
      className={`booking-date-changes${admin ? " booking-date-changes--admin" : ""}`}
      aria-label="Date-change requests"
    >
      <details
        open={Boolean(pending) || open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
      >
        <summary>
          {admin ? "Date-change requests" : "Need different dates?"}
          {pending ? " · Awaiting review" : ""}
        </summary>
        <div className="booking-date-changes__body">
          <p className="booking-date-changes__intro">
            {admin ? (
              "Review the customer’s requested dates and confirm the handover arrangements. The current schedule stays in place until approval."
            ) : (
              <>
                Your original booking stays in place until a date change is
                approved. Online requests keep the same vehicle, rental duration
                and saved price. Contact the team for a different duration,
                vehicle or delivery service.
              </>
            )}
          </p>
          {!loaded ? <p role="status">Loading date changes…</p> : null}
          {rows.map((row) => (
            <div className="booking-date-changes__record" key={row.id}>
              {admin ? (
                <div className="booking-date-changes__record-heading">
                  <h3>
                    {row.status === "Pending"
                      ? "Requested date change"
                      : "Date-change history"}
                  </h3>
                  <span
                    className={`booking-date-changes__status${row.status === "Pending" ? " is-pending" : ""}`}
                  >
                    {row.status === "Pending" ? "Awaiting review" : row.status}
                  </span>
                </div>
              ) : (
                <strong>
                  {row.status === "Pending" ? "Awaiting review" : row.status}
                </strong>
              )}
              {admin ? (
                <dl className="booking-date-changes__schedule">
                  {row.status === "Pending" ? (
                    <div>
                      <dt>Current schedule</dt>
                      <dd>
                        <span>{time(booking.pickup_at)}</span>
                        <span>to {time(booking.return_at)}</span>
                      </dd>
                    </div>
                  ) : null}
                  <div className="is-requested">
                    <dt>Requested schedule</dt>
                    <dd>
                      <span>{time(row.requested_pickup_at)}</span>
                      <span>to {time(row.requested_return_at)}</span>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p>
                  {time(row.requested_pickup_at)} –{" "}
                  {time(row.requested_return_at)}
                </p>
              )}
              {admin ? (
                <div className="booking-date-changes__reason">
                  <h4>Customer’s reason</h4>
                  <p>
                    {splitCategory("rescheduling", row.reason).label ||
                      row.reason}
                  </p>
                  {splitCategory("rescheduling", row.reason).details ? (
                    <p className="booking-date-changes__reason-details">
                      {splitCategory("rescheduling", row.reason).details}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p>{row.reason}</p>
              )}
              {row.review_reason ? (
                <p>
                  <strong>{admin ? "Review outcome: " : ""}</strong>
                  {row.review_reason}
                </p>
              ) : null}
              {admin && row.status === "Pending" ? (
                <div className="booking-date-changes__actions">
                  <div className="booking-date-changes__approval">
                    <h4>Approve the new schedule</h4>
                    <p>
                      Availability and vehicle readiness are checked on
                      approval. The vehicle, duration, saved price and payment
                      stay unchanged.
                    </p>
                    <label className="booking-date-changes__acknowledgement">
                      <input
                        type="checkbox"
                        checked={handoverChecked}
                        onChange={(event) =>
                          setHandoverChecked(event.target.checked)
                        }
                        disabled={busy}
                      />{" "}
                      I agreed the new dates with the customer and checked the
                      handover instructions.
                    </label>
                    <button
                      className="customer-primary-button"
                      type="button"
                      disabled={busy || !handoverChecked}
                      onClick={() => void save("approve", row.id)}
                    >
                      {busy ? "Saving…" : "Approve date change"}
                    </button>
                  </div>
                  <details className="booking-date-changes__decline">
                    <summary>Unable to accommodate these dates?</summary>
                    <div>
                      <CategorizedField
                        id={`date-change-rejection-${row.id}`}
                        label="Reason for declining"
                        domain="reschedule_decline"
                        value={reviewReason}
                        onChange={setReviewReason}
                        disabled={busy}
                      />
                      <button
                        className="customer-secondary-button"
                        type="button"
                        disabled={
                          busy ||
                          !validCategory("reschedule_decline", reviewReason)
                        }
                        onClick={() => void save("reject", row.id)}
                      >
                        Decline date change
                      </button>
                    </div>
                  </details>
                </div>
              ) : null}
            </div>
          ))}
          {!admin && eligible && !pending && loaded ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save("request");
              }}
            >
              <label className="customer-label" htmlFor="date-change-pickup">
                Requested dates & time
              </label>
              <Popover
                open={datePickerOpen}
                onOpenChange={(isOpen) => {
                  if (busy) return;
                  if (isOpen) {
                    setDraftDay(pickup ? calendarDate(pickup) : undefined);
                    const currentTime = (
                      pickup ||
                      instantToManilaDateTimeLocal(new Date(booking.pickup_at))
                    ).slice(11, 16);
                    setDraftTime(
                      timeOptions.includes(currentTime) ? currentTime : "10:00",
                    );
                  }
                  setDatePickerOpen(isOpen);
                }}
              >
                <PopoverTrigger asChild>
                  <RentalDateTrigger
                    id="date-change-pickup"
                    className="request-rental-date-trigger booking-date-changes__date-trigger"
                    pickupValue={
                      next ? time(next.toISOString()) : "Choose a date"
                    }
                    returnValue={
                      nextReturn
                        ? time(nextReturn.toISOString())
                        : "Calculated automatically"
                    }
                    describedBy="date-change-guide"
                  />
                </PopoverTrigger>
                <PopoverContent
                  className="home-date-picker-popover booking-date-picker-popover"
                  align="start"
                  sideOffset={12}
                >
                  <DateRangePicker
                    selected={
                      draftDay
                        ? {
                            from: draftDay,
                            to: draftReturn
                              ? calendarDate(draftReturn)
                              : undefined,
                          }
                        : undefined
                    }
                    onSelect={(range) => setDraftDay(range?.from)}
                    firstAvailableDate={firstAvailableDate}
                    pickupTime={draftTime}
                    returnTime={draftReturn.slice(11, 16)}
                    onPickupTimeChange={setDraftTime}
                    onReturnTimeChange={() => {}}
                    timeOptions={pickerTimes}
                    formatTime={formatTime}
                    pickupTimeId="date-change-handover-time"
                    returnTimeId="date-change-return-time"
                    returnLocked
                    isStartUnavailable={isStartUnavailable}
                    availabilityPending={
                      availabilityLoading || availability === null
                    }
                    selectionUnavailable={draftUnavailable}
                    availabilityMessage={
                      availabilityError ||
                      (availabilityLoading
                        ? "Checking available dates…"
                        : draftInstant && draftUnavailable
                          ? "This start time conflicts with another reservation during your rental. Choose another date or time."
                          : "Crossed-out dates cannot fit your full rental at the selected handover time.")
                    }
                    onApply={() => {
                      if (draftUnavailable || availabilityLoading) return;
                      setPickup(draftValue);
                      setDatePickerOpen(false);
                    }}
                  />
                  {availabilityError && (
                    <button
                      type="button"
                      className="customer-secondary-button"
                      onClick={() => setAvailabilityRetry((value) => value + 1)}
                    >
                      Retry availability check
                    </button>
                  )}
                </PopoverContent>
              </Popover>
              <p id="date-change-guide">
                Choose a handover date from tomorrow onward. Contact the team
                for a same-day change.
              </p>
              <CategorizedField
                id="date-change-reason"
                label="Reason for date change"
                domain="rescheduling"
                customer
                value={reason}
                onChange={setReason}
                disabled={busy}
              />
              <button
                className="customer-primary-button"
                type="submit"
                disabled={
                  busy || !next || !validCategory("rescheduling", reason)
                }
              >
                {busy ? "Sending request…" : "Request date change"}
              </button>
            </form>
          ) : null}
          {error ? (
            <p role="alert">
              {error}{" "}
              <button type="button" onClick={() => void load()}>
                Reload requests
              </button>
            </p>
          ) : null}
        </div>
      </details>
    </section>
  );
}
