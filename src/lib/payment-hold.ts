export type PaymentHold = {
  booking_id: string;
  state:
    | "AwaitingPayment"
    | "Review"
    | "Correction"
    | "Verified"
    | "Expired"
    | "Completed"
    | "Released";
  opened_at: string;
  deadline_at: string;
  review_due_at: string | null;
  generation: number;
  correction_count: number;
};

export function paymentHoldExpired(
  hold: PaymentHold | null | undefined,
  now = Date.now(),
) {
  return Boolean(
    hold &&
    (hold.state === "Expired" ||
      (["AwaitingPayment", "Correction"].includes(hold.state) &&
        Date.parse(hold.deadline_at) <= now)),
  );
}

export function paymentHoldAllowsProof(
  hold: PaymentHold | null | undefined,
  now = Date.now(),
) {
  // Quotes issued before this policy have no retroactive payment deadline.
  return (
    !hold ||
    (["AwaitingPayment", "Correction"].includes(hold.state) &&
      !paymentHoldExpired(hold, now))
  );
}

export function formatPaymentDeadline(value: string) {
  return (
    new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value)) + " (Manila time)"
  );
}
