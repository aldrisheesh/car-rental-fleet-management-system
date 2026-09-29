const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const RENTAL_GRACE_HOURS = 1;
export const SECURITY_DEPOSIT_AMOUNT = 3_000;

export function billableRentalDays(start: Date, end: Date) {
  const elapsed = end.getTime() - start.getTime();
  if (!Number.isFinite(elapsed) || elapsed <= 0) {
    throw new Error("invalid_rental_period");
  }
  return Math.max(1, Math.ceil((elapsed - RENTAL_GRACE_HOURS * HOUR) / DAY));
}

export function calculateRentalQuote(
  dailyRate: number,
  start: Date,
  end: Date,
  deliveryFee = 0,
) {
  if (!Number.isFinite(dailyRate) || dailyRate <= 0 || !Number.isFinite(deliveryFee) || deliveryFee < 0) {
    throw new Error("invalid_quote_amount");
  }
  const billableDays = billableRentalDays(start, end);
  const rentalSubtotal = dailyRate * billableDays;
  const totalAmount = rentalSubtotal + deliveryFee;
  return {
    billableDays,
    rentalSubtotal,
    deliveryFee,
    totalAmount,
    downPaymentAmount: Math.round(totalAmount * 50) / 100,
    balanceAmount: Math.round(totalAmount * 50) / 100,
    securityDepositAmount: SECURITY_DEPOSIT_AMOUNT,
  };
}
