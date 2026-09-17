import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";

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
}: DateRangePickerProps) {
  const hasPickupDate = Boolean(selected?.from);
  const hasReturnDate = Boolean(selected?.to);
  const canApply = Boolean(
    selected?.from && selected.to && pickupTime && returnTime,
  );
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
  const rentalDays =
    selected?.from && selected.to
      ? Math.max(
          1,
          Math.round(
            (selected.to.getTime() - selected.from.getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        )
      : null;

  function clearDates() {
    onSelect(undefined);
    onPickupTimeChange("");
    onReturnTimeChange("");
  }

  return (
    <div className="home-date-picker-layout">
      <section
        className="home-date-picker-calendar-panel"
        aria-label="Rental dates"
      >
        <div className="home-date-calendar-frame">
          <Calendar
            className="home-date-calendar"
            mode="range"
            selected={selected}
            onSelect={onSelect}
            numberOfMonths={2}
            min={1}
            disabled={{ before: firstAvailableDate }}
            classNames={{ today: "home-date-calendar-today" }}
          />
          <div className="home-date-calendar-actions">
            {hasPickupDate && (
              <button type="button" onClick={clearDates}>
                Clear dates
              </button>
            )}
          </div>
        </div>
      </section>
      <aside className="home-date-times" aria-label="Rental times">
        <header className="home-date-times-header">
          <h2>Set your times</h2>
          <p>Choose the times that suit your schedule.</p>
        </header>
        <div className="home-date-time-field">
          <label htmlFor={pickupTimeId}>Pickup time</label>
          <select
            id={pickupTimeId}
            value={pickupTime}
            onChange={(event) => onPickupTimeChange(event.target.value)}
            disabled={!hasPickupDate}
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
            {rentalDays
              ? `${rentalDays}-day rental`
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
