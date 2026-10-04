import type { VehicleAnalyticsRow } from "./vehicle-analytics.server";
export type { VehicleAnalyticsRow } from "./vehicle-analytics.server";

export function reportingRangeError(start: string, end: string, today: string) {
  const valid = (day: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    !Number.isNaN(Date.parse(day)) &&
    new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day;
  if (!valid(start) || !valid(end)) return "Choose valid start and end dates.";
  if (start > end) return "The start date must be on or before the end date.";
  if (end > today)
    return "Choose an end date on or before today. Future rental activity cannot be measured.";
  if ((Date.parse(end) - Date.parse(start)) / 86400000 + 1 > 366)
    return "Choose a reporting period of 366 days or fewer.";
  return "";
}

export function filterUtilizationRows(
  rows: VehicleAnalyticsRow[],
  filters: { branch: string; category: string; status: string; query: string },
) {
  const query = filters.query.trim().toLowerCase();
  return rows
    .filter(
      (row) =>
        (!filters.branch ||
          filters.branch === "all" ||
          row.branchId === filters.branch) &&
        (!filters.category ||
          filters.category === "all" ||
          row.categoryId === filters.category) &&
        (filters.status === "All" ||
          row.idleClassification === filters.status) &&
        (!query ||
          [row.name, row.licensePlate, row.branch, row.category]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)),
    )
    .sort((a, b) => {
      const priority = (row: VehicleAnalyticsRow) =>
        row.idleClassification === "Idle"
          ? 0
          : row.idleClassification === "Unable to Determine"
            ? 1
            : 2;
      return (
        priority(a) - priority(b) ||
        (a.utilizationPercent ?? Infinity) -
          (b.utilizationPercent ?? Infinity) ||
        a.name.localeCompare(b.name)
      );
    });
}
export function utilizationUnavailableReason(row: VehicleAnalyticsRow) {
  if (row.coverage !== "Complete")
    return "Historical active-state coverage is incomplete. The full-period utilization rate is unavailable; known rental days are still shown.";
  if (row.eligibleOperationalDays === 0)
    return "No eligible operational days were recorded in this period. A utilization percentage cannot be calculated.";
  if (row.eligibleOperationalDays == null || row.utilizationPercent == null)
    return "A utilization percentage is unavailable for this period.";
  return "";
}
export function idleExplanation(row: VehicleAnalyticsRow) {
  if (!row.isActive)
    return "This vehicle is inactive and is not eligible for an idle flag.";
  if (row.activeRental)
    return "An active rental exists. This vehicle is not classified as idle.";
  if (!row.maintenanceReady)
    return "Maintenance or a recorded condition prevents rental readiness. This vehicle is not eligible for an idle flag.";
  if (!row.idleReference || row.idleDays == null)
    return "A trustworthy last-return or current activation baseline is missing. Idle duration cannot be determined.";
  if (!row.idleEligible)
    return "This vehicle is not currently eligible for an idle flag. Review its readiness in Fleet.";
  return row.idleClassification === "Idle"
    ? "At least 14 consecutive days have elapsed since the applicable baseline, and current idle eligibility checks passed."
    : "The 14-day idle threshold has not been reached.";
}

export function idleDaysForDisplay(
  row: VehicleAnalyticsRow,
): number | null | "Not applicable" {
  return row.idleEligible ? row.idleDays : "Not applicable";
}
