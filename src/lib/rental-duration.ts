const DAY_IN_MILLISECONDS = 86_400_000;

/**
 * Provisional daily-reference estimate convention, shared with the Finder.
 * This is not an approved billing, 12-hour, promotional, or overtime rule.
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

/** Describe elapsed time without turning partial days into billable days. */
export function formatRentalDuration(start: Date, end: Date) {
  const elapsed = end.getTime() - start.getTime();
  if (!Number.isFinite(elapsed) || elapsed <= 0)
    throw new Error("invalid_rental_period");
  const minutes = Math.ceil(elapsed / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  return [
    days ? `${days} ${days === 1 ? "day" : "days"}` : null,
    hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : null,
    remainingMinutes
      ? `${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Calendar dates are local date-only values; the chosen times are Manila time. */
export function selectedRentalPeriod(
  from: Date | undefined,
  to: Date | undefined,
  pickupTime: string,
  returnTime: string,
) {
  if (
    !from ||
    !to ||
    !/^\d{2}:\d{2}$/.test(pickupTime) ||
    !/^\d{2}:\d{2}$/.test(returnTime)
  )
    return null;
  function instant(date: Date, time: string) {
    const [hour, minute] = time.split(":").map(Number);
    if (hour > 23 || minute > 59 || Number.isNaN(date.getTime())) return null;
    return new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour - 8,
        minute,
      ),
    );
  }
  const start = instant(from, pickupTime);
  const end = instant(to, returnTime);
  return start && end && end > start ? { start, end } : null;
}
