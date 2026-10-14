export type ReportPeriod =
  "this-month" | "last-month" | "this-quarter" | "last-quarter";
export function reportPeriod(period: ReportPeriod, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const year = value("year"),
    month = value("month") - 1,
    day = value("day");
  const quarter = Math.floor(month / 3) * 3;
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  if (period === "this-month")
    return {
      start: iso(new Date(Date.UTC(year, month, 1))),
      end: iso(new Date(Date.UTC(year, month, day))),
    };
  if (period === "this-quarter")
    return {
      start: iso(new Date(Date.UTC(year, quarter, 1))),
      end: iso(new Date(Date.UTC(year, month, day))),
    };
  const startMonth = period === "last-month" ? month - 1 : quarter - 3;
  const endMonth = period === "last-month" ? month : quarter;
  return {
    start: iso(new Date(Date.UTC(year, startMonth, 1))),
    end: iso(new Date(Date.UTC(year, endMonth, 0))),
  };
}
