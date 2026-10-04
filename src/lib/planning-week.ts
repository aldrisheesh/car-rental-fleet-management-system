import { addDays } from "./vehicle-analytics-intervals.ts";

/** Stored week ends are exclusive Manila calendar dates. */
export function weekEndFromStart(start: string) {
  return addDays(start, 7);
}

/** Display the inclusive calendar range without slicing a Manila instant in UTC. */
export function formatWeekRange(
  start: string,
  exclusiveEnd: string,
  locale?: string,
) {
  const format = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const display = (day: string) =>
    format.format(new Date(`${day}T00:00:00+08:00`));
  return `${display(start)} – ${display(addDays(exclusiveEnd, -1))}`;
}
