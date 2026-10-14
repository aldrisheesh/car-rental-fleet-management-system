import { BOOKING_CATEGORIES, splitCategory } from "./booking-categories.ts";

export const REPORT_KINDS = {
  requests: "Most requested vehicles",
  rentals: "Most rented vehicles",
  purposes: "Rental purposes",
  destinations: "Destination areas",
  forecast: "Weekly vehicle planning",
} as const;
export type ReportKind = keyof typeof REPORT_KINDS;
export type ReportQuery = {
  kind: ReportKind;
  start: string;
  end: string;
  branch: string;
  vehicle: string;
  category: string;
  purpose: string;
  destination: string;
};
export type ReportVehicle = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
};
export type ReportEvent = {
  id: string;
  vehicleId: string | null;
  branchId: string | null;
  purpose: string | null;
  destination: string | null;
};
export type QueryReport = {
  title: string;
  query: ReportQuery;
  generatedAt: string;
  total: number;
  rows: Array<{ label: string; category: string; count: number }>;
  vehicles: ReportVehicle[];
  branches: Array<{ id: string; name: string }>;
  note: string;
};

export function buildQueryReport(
  query: ReportQuery,
  events: ReportEvent[],
  vehicles: ReportVehicle[],
  branches: QueryReport["branches"],
  generatedAt: string,
): QueryReport {
  const byId = new Map(vehicles.map((v) => [v.id, v]));
  const selected = events.filter((e) => {
    const vehicle = e.vehicleId ? byId.get(e.vehicleId) : undefined;
    return (
      (query.branch === "all" || e.branchId === query.branch) &&
      (!query.vehicle || e.vehicleId === query.vehicle) &&
      (!query.category || vehicle?.categoryId === query.category) &&
      (!query.purpose ||
        splitCategory("purpose", e.purpose ?? "").code === query.purpose) &&
      (!query.destination ||
        splitCategory("destination", e.destination ?? "").code ===
          query.destination)
    );
  });
  const counts = new Map<
    string,
    { label: string; category: string; count: number }
  >();
  for (const event of selected) {
    const dimension =
      query.kind === "purposes"
        ? "purpose"
        : query.kind === "destinations"
          ? "destination"
          : null;
    const vehicle = event.vehicleId ? byId.get(event.vehicleId) : undefined;
    const value = dimension ? event[dimension] : event.vehicleId;
    const code = dimension ? splitCategory(dimension, value ?? "").code : value;
    const key =
      code || (dimension && value?.trim() ? "uncategorized" : "unrecorded");
    const label = dimension
      ? (BOOKING_CATEGORIES[dimension].find(([id]) => id === code)?.[1] ??
        (value ? "Not categorized" : "Not provided"))
      : (vehicle?.name ?? "Vehicle not recorded");
    const row = counts.get(key) ?? {
      label,
      category: dimension ? "" : (vehicle?.categoryName ?? "Not recorded"),
      count: 0,
    };
    row.count++;
    counts.set(key, row);
  }
  return {
    title: REPORT_KINDS[query.kind],
    query,
    generatedAt,
    total: selected.length,
    rows: [...counts.values()].sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    ),
    vehicles,
    branches,
    note:
      query.kind === "rentals"
        ? "Counts actual rental starts within the selected Manila calendar dates. A booking request alone is not a rental."
        : "Counts requests created within the selected Manila calendar dates, including later cancelled or rejected requests. Destinations are stated travel plans.",
  };
}
