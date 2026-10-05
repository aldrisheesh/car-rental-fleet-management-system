import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingPolicy } from "./BookingPolicy";

export function PaymentPolicyConfirmation({
  open,
  onOpenChange,
  onConfirm,
  submitting,
  error,
  amount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  submitting: boolean;
  error: string;
  amount: string;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  function changeOpen(next: boolean) {
    if (submitting) return;
    setAcknowledged(false);
    onOpenChange(next);
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        className="booking-policy-confirmation"
        data-submitting={submitting}
      >
        <DialogHeader>
          <DialogTitle>Before you pay</DialogTitle>
          <DialogDescription>
            Review these policies before paying your {amount} down payment.
          </DialogDescription>
        </DialogHeader>
        <BookingPolicy expanded />
        <label className="booking-policy-confirmation__acknowledgement">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            disabled={submitting}
          />
          <span>
            I have read and understand the cancellation and date-change
            policies.
          </span>
        </label>
        {error && (
          <p className="booking-policy-confirmation__error" role="alert">
            {error}
          </p>
        )}
        <div className="booking-policy-confirmation__actions">
          <button
            type="button"
            className="customer-secondary-button"
            onClick={() => changeOpen(false)}
            disabled={submitting}
          >
            Review later
          </button>
          <button
            type="button"
            className="customer-primary-button"
            disabled={!acknowledged || submitting}
            onClick={() => {
              if (acknowledged && !submitting) onConfirm();
            }}
          >
            {submitting ? "Saving…" : "Continue"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
