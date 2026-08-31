const TZ = "Asia/Manila";

export const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const localDate = (key: string) => new Date(`${key}T00:00:00+08:00`);

export const addDays = (key: string, n: number) => {
  const date = localDate(key);
  date.setUTCDate(date.getUTCDate() + n);
  return dayKey(date);
};

export const datesBetween = (from: string, to: string) => {
  const result: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) result.push(date);
  return result;
};

export function overlapsLocalDay(
  intervalStart: Date,
  intervalEnd: Date,
  day: string,
) {
  const dayStart = localDate(day);
  const dayEnd = localDate(addDays(day, 1));
  return intervalStart < dayEnd && intervalEnd > dayStart;
}

export function countIntervalLocalDays(
  intervalStart: Date,
  intervalEnd: Date,
  rangeStart: string,
  rangeEnd: string,
) {
  return datesBetween(rangeStart, rangeEnd).filter((day) =>
    overlapsLocalDay(intervalStart, intervalEnd, day),
  ).length;
}
