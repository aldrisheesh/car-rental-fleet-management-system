const MANILA_OFFSET_MILLISECONDS = 8 * 60 * 60 * 1000;

/** Convert an HTML datetime-local value from Asia/Manila business time. */
export function manilaDateTimeLocalToInstant(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
      value,
    );
  if (!match) return null;
  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    millisecondText,
  ] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? 0);
  const millisecond = Number((millisecondText ?? "0").padEnd(3, "0"));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (
    year < 1000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  )
    return null;

  const instant = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) -
      MANILA_OFFSET_MILLISECONDS,
  );
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/** Format an instant for an HTML datetime-local input in Manila business time. */
export function instantToManilaDateTimeLocal(instant: Date) {
  if (Number.isNaN(instant.getTime())) throw new Error("invalid_instant");
  return new Date(instant.getTime() + MANILA_OFFSET_MILLISECONDS)
    .toISOString()
    .slice(0, 16);
}

/** Return the Asia/Manila calendar date containing an instant. */
export function instantToManilaCalendarDate(instant: Date) {
  if (Number.isNaN(instant.getTime())) throw new Error("invalid_instant");
  return new Date(instant.getTime() + MANILA_OFFSET_MILLISECONDS)
    .toISOString()
    .slice(0, 10);
}
