import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  formatRentalDuration,
  selectedRentalPeriod,
} from "@/lib/rental-duration";

type DateRangePickerProps = {
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  firstAvailableDate: Date;
  pickupTime: string;
  returnTime: string;
  onPickupTimeChange: (value: string) => void;
  onReturnTimeChange: (value: string) => void;
  timeOptions: readonly string[];
  formatTime: (value: string) => string;
  pickupTimeId: string;
  returnTimeId: string;
  onApply: () => void;
  returnLocked?: boolean;
  isStartUnavailable?: (day: Date) => boolean;
  availabilityMessage?: string;
  availabilityPending?: boolean;
  selectionUnavailable?: boolean;
};

export function DateRangePicker({
  selected,
  onSelect,
  firstAvailableDate,
  pickupTime,
  returnTime,
  onPickupTimeChange,
  onReturnTimeChange,
  timeOptions,
  formatTime,
  pickupTimeId,
  returnTimeId,
  onApply,
  returnLocked = false,
  isStartUnavailable,
  availabilityMessage,
  availabilityPending = false,
  selectionUnavailable = false,
}: DateRangePickerProps) {
  const hasPickupDate = Boolean(selected?.from);
  const hasReturnDate = Boolean(selected?.to);
  const period = selectedRentalPeriod(
    selected?.from,
    selected?.to,
    pickupTime,
    returnTime,
  );
  const canApply =
    period !== null && !availabilityPending && !selectionUnavailable;
  const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const pickupLabel = selected?.from
    ? dateFormatter.format(selected.from)
    : "Select a date";
  const returnLabel = selected?.to
    ? dateFormatter.format(selected.to)
    : "Select a date";
  const duration = period
    ? formatRentalDuration(period.start, period.end)
    : null;

  function clearDates() {
    onSelect(undefined);
    if (!returnLocked) {
      onPickupTimeChange("");
      onReturnTimeChange("");
    }
  }

  return (
    <div className="home-date-picker-layout">
      <section
        className="home-date-picker-calendar-panel"
        aria-label="Rental dates"
      >
        <div className="home-date-calendar-frame">
          {returnLocked ? (
            <Calendar
              className="home-date-calendar"
              mode="single"
              selected={selected?.from}
              onSelect={(day) => onSelect(day ? { from: day } : undefined)}
              defaultMonth={selected?.from ?? firstAvailableDate}
              numberOfMonths={2}
              disabled={[
                { before: firstAvailableDate },
                (day) =>
                  availabilityPending || Boolean(isStartUnavailable?.(day)),
              ]}
              modifiers={{
                unavailable: (day) =>
                  day >= firstAvailableDate &&
                  Boolean(isStartUnavailable?.(day)),
              }}
              modifiersClassNames={{
                unavailable: "reschedule-day-unavailable",
              }}
              classNames={{ today: "home-date-calendar-today" }}
            />
          ) : (
            <Calendar
              className="home-date-calendar"
              mode="range"
              selected={selected}
              onSelect={onSelect}
              numberOfMonths={2}
              min={0}
              disabled={{ before: firstAvailableDate }}
              classNames={{ today: "home-date-calendar-today" }}
            />
          )}
          <div className="home-date-calendar-actions">
            {hasPickupDate && (
              <button type="button" onClick={clearDates}>
                Clear dates
              </button>
            )}
          </div>
          {availabilityMessage && (
            <p className="reschedule-availability-guide" role="status">
              {availabilityMessage}
            </p>
          )}
        </div>
      </section>
      <aside className="home-date-times" aria-label="Rental times">
        <header className="home-date-times-header">
          <h2>{returnLocked ? "Handover time" : "Set your times"}</h2>
          <p>
            {returnLocked
              ? "Your return adjusts to keep the same rental duration."
              : "Choose the times that suit your schedule."}
          </p>
        </header>
        <div className="home-date-time-field">
          <label htmlFor={pickupTimeId}>Pickup time</label>
          <select
            id={pickupTimeId}
            value={pickupTime}
            onChange={(event) => onPickupTimeChange(event.target.value)}
            disabled={!hasPickupDate && !returnLocked}
          >
            <option value="">--:--</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {formatTime(time)}
              </option>
            ))}
          </select>
        </div>
        <div className="home-date-time-field">
          {returnLocked ? (
            <>
              <span className="home-date-fixed-return-label">
                Return · calculated automatically
              </span>
              <p className="home-date-fixed-return">
                {hasReturnDate
                  ? `${returnLabel} at ${formatTime(returnTime)}`
                  : "Choose a handover date"}
              </p>
            </>
          ) : (
            <>
              <label htmlFor={returnTimeId}>Return time</label>
              <select
                id={returnTimeId}
                value={returnTime}
                onChange={(event) => onReturnTimeChange(event.target.value)}
                disabled={!hasReturnDate}
              >
                <option value="">--:--</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <button
          className="customer-primary-button"
          type="button"
          onClick={onApply}
          disabled={!canApply}
        >
          Apply dates
        </button>
      </aside>
      <section className="home-date-selection-guide" aria-live="polite">
        <div className="home-date-selection-guide-stop">
          <span>Pickup</span>
          <strong>{pickupLabel}</strong>
          <small>{pickupTime ? formatTime(pickupTime) : "Choose a time"}</small>
        </div>
        <div className="home-date-selection-guide-journey">
          <span>
            {duration
              ? `${duration} rental`
              : hasReturnDate && pickupTime && returnTime
                ? "Return must be after pickup"
                : hasPickupDate
                  ? "Now choose a return date"
                  : "Choose your trip dates"}
          </span>
        </div>
        <div className="home-date-selection-guide-stop home-date-selection-guide-stop--return">
          <span>Return</span>
          <strong>{returnLabel}</strong>
          <small>{returnTime ? formatTime(returnTime) : "Choose a time"}</small>
        </div>
      </section>
    </div>
  );
}
