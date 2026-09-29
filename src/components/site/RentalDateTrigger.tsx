import { forwardRef } from "react";
import { CalendarDays } from "lucide-react";

type RentalDateTriggerProps = {
  id: string;
  pickupValue: string;
  returnValue: string;
  onClick?: () => void;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

export const RentalDateTrigger = forwardRef<
  HTMLButtonElement,
  RentalDateTriggerProps
>(function RentalDateTrigger(
  {
    id,
    pickupValue,
    returnValue,
    onClick,
    invalid = false,
    describedBy,
    className,
  },
  ref,
) {
  return (
    <button
      ref={ref}
      id={id}
      className={["rental-date-trigger", className].filter(Boolean).join(" ")}
      type="button"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onClick={onClick}
    >
      <span className="rental-date-part">
        <CalendarDays size={20} aria-hidden="true" />
        <span>
          <small>Pick-up date</small>
          <strong>{pickupValue}</strong>
        </span>
      </span>
      <span className="rental-date-part rental-date-part--return">
        <CalendarDays size={20} aria-hidden="true" />
        <span>
          <small>Drop-off date</small>
          <strong>{returnValue}</strong>
        </span>
      </span>
    </button>
  );
});
