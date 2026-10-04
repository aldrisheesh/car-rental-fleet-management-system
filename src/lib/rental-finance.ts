export type RentalFinancialRecord = {
  balance_collected: number | string;
  deposit_collected: number | string;
  collection_method: string;
  collection_reference: string | null;
  collected_at: string;
  deposit_deduction: number | string | null;
  deduction_reason: string | null;
  deposit_refunded: number | string | null;
  refund_method: string | null;
  refund_reference: string | null;
  settled_at: string | null;
};

export type HandoverQuote = {
  total_amount: number | string;
  remaining_balance_amount: number | string;
  security_deposit_amount: number | string;
};

export function releaseDayReached(pickupAt: string, now = new Date()) {
  const day = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const pickup = new Date(pickupAt);
  return Number.isFinite(pickup.getTime()) && day(now) >= day(pickup);
}

export function depositRefund(deposit: number, deduction: string) {
  if (!deduction.trim()) return null;
  const amount = Number(deduction);
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > deposit ||
    Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001
  )
    return null;
  return Math.round((deposit - amount) * 100) / 100;
}
