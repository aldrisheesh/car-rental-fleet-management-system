import { getSupabaseServerClient } from "./supabase/server";
import { validateReportRange } from "./admin-reports";
import {
  buildQueryReport,
  REPORT_KINDS,
  type ReportKind,
  type ReportQuery,
  type ReportEvent,
} from "./report-query";
import { BOOKING_CATEGORIES } from "./booking-categories";
import { loadAdminReport } from "./admin-reports.server";

export async function loadQueryReport(
  params: URLSearchParams,
  role: "Owner/Admin" | "Operations Staff",
) {
  const metadataOnly = params.get("query") === "options";
  const kind = metadataOnly ? "requests" : (params.get("query") ?? "");
  if (!Object.hasOwn(REPORT_KINDS, kind))
    throw new Error("invalid_report_query");
  const range = validateReportRange(
    params.get("start") ?? "",
    params.get("end") ?? "",
  );
  const query: ReportQuery = {
    kind: kind as ReportKind,
    start: range.start,
    end: range.end,
    branch: params.get("branch") ?? "all",
    vehicle: params.get("vehicle") ?? "",
    category: params.get("category") ?? "",
    purpose: params.get("purpose") ?? "",
    destination: params.get("destination") ?? "",
  };
  for (const dimension of ["purpose", "destination"] as const) {
    if (
      query[dimension] &&
      !BOOKING_CATEGORIES[dimension].some(([code]) => code === query[dimension])
    )
      throw new Error("invalid_report_query");
  }
  const client = getSupabaseServerClient();
  const [vehicleRows, branches] = await Promise.all([
    readAll((start, end) =>
      client
        .from("vehicles")
        .select(
          "id,name,license_plate,category_id,category:vehicle_categories(name)",
        )
        .order("id")
        .range(start, end),
    ),
    readAll((start, end) =>
      client.from("branches").select("id,name").order("id").range(start, end),
    ),
  ]);
  const vehicles = vehicleRows.map((v) => ({
    id: v.id,
    name: v.license_plate ? `${v.name} (${v.license_plate})` : v.name,
    categoryId: v.category_id,
    categoryName: v.category?.name ?? "Not recorded",
  }));
  if (
    (query.branch !== "all" && !branches.some((b) => b.id === query.branch)) ||
    (query.vehicle && !vehicles.some((v) => v.id === query.vehicle)) ||
    (query.category && !vehicles.some((v) => v.categoryId === query.category))
  )
    throw new Error("invalid_report_query");
  if (metadataOnly)
    return buildQueryReport(
      query,
      [],
      vehicles,
      branches,
      new Date().toISOString(),
    );
  if (query.kind === "forecast") {
    if (query.vehicle || query.purpose || query.destination)
      throw new Error("invalid_report_query");
    const report = await loadAdminReport(role, range, query.branch);
    const rows = (report.decisionSupport?.horizonOne ?? [])
      .filter((r) => !query.category || r.categoryId === query.category)
      .map((r) => ({
        label: `${r.branchName} · ${r.targetWeekStart}`,
        category: r.categoryName,
        count: r.requiredUnits,
      }));
    return {
      title: REPORT_KINDS.forecast,
      query,
      generatedAt: new Date().toISOString(),
      rows,
      total: rows.reduce((n, r) => n + r.count, 0),
      vehicles,
      branches,
      note: "One-week-ahead whole vehicle planning counts from the latest forecast run generated in the reporting period. Counts across different planning weeks must not be treated as simultaneous fleet capacity.",
    };
  }
  const events: ReportEvent[] = [];
  // Page canonical events explicitly; report counts must not stop at the Data API row limit.
  for (let offset = 0; ; offset += 500) {
    if (query.kind === "rentals") {
      const result = await client
        .from("rental_transactions")
        .select(
          "id,vehicle_id,booking:booking_requests(pickup_branch_id,purpose_of_use,destination)",
        )
        .gte("started_at", range.startInstant)
        .lt("started_at", range.endExclusiveInstant)
        .order("id")
        .range(offset, offset + 499);
      if (result.error) throw new Error("report_source_failed");
      const rows = result.data ?? [];
      events.push(
        ...rows.map((r) => ({
          id: r.id,
          vehicleId: r.vehicle_id,
          branchId: r.booking?.pickup_branch_id ?? null,
          purpose: r.booking?.purpose_of_use ?? null,
          destination: r.booking?.destination ?? null,
        })),
      );
      if (rows.length < 500) break;
    } else {
      const result = await client
        .from("booking_requests")
        .select(
          "id,requested_vehicle_id,pickup_branch_id,purpose_of_use,destination",
        )
        .gte("created_at", range.startInstant)
        .lt("created_at", range.endExclusiveInstant)
        .order("id")
        .range(offset, offset + 499);
      if (result.error) throw new Error("report_source_failed");
      const rows = result.data ?? [];
      events.push(
        ...rows.map((r) => ({
          id: r.id,
          vehicleId: r.requested_vehicle_id,
          branchId: r.pickup_branch_id,
          purpose: r.purpose_of_use,
          destination: r.destination,
        })),
      );
      if (rows.length < 500) break;
    }
  }
  return buildQueryReport(
    query,
    events,
    vehicles,
    branches,
    new Date().toISOString(),
  );
}

async function readAll<T>(
  page: (
    start: number,
    end: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await page(offset, offset + 499);
    if (result.error) throw new Error("report_source_failed");
    const batch = result.data ?? [];
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}
