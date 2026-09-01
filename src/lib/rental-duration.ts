const DAY_IN_MILLISECONDS = 86_400_000;

/**
 * Canonical customer base-rental duration convention, shared with Booking.
 * Any started 24-hour period is charged as one rental day.
 */
export function calculateRentalDays(start: Date, end: Date) {
  const elapsed = end.getTime() - start.getTime();
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    elapsed <= 0
  )
    throw new Error("invalid_rental_period");
  return Math.max(1, Math.ceil(elapsed / DAY_IN_MILLISECONDS));
}
