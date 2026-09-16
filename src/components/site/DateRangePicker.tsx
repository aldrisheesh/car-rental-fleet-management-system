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
  const canApply = Boolean(
    selected?.from && selected.to && pickupTime && returnTime,
  );

  return (
    <div className="home-date-picker-layout">
      <section
        className="home-date-picker-calendar-panel"
        aria-label="Rental dates"
      >
        <header className="home-date-picker-header">
          <h2>Choose your dates</h2>
        </header>
        <Calendar
          className="home-date-calendar"
          mode="range"
          selected={selected}
          onSelect={onSelect}
          numberOfMonths={2}
          disabled={{ before: firstAvailableDate }}
        />
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
          >
            <option value="">Choose a time</option>
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
          >
            <option value="">Choose a time</option>
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
    </div>
  );
}
