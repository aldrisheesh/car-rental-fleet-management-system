export type DssSearch = {
  branch?: string;
  category?: string;
  week?: string;
  recommendation?: string;
  start?: string;
  end?: string;
  vehicle?: string;
  utilBranch?: string;
  utilCategory?: string;
};

export function parseDssSearch(raw: Record<string, unknown>): DssSearch {
  const search: DssSearch = {};
  for (const key of [
    "branch",
    "category",
    "week",
    "recommendation",
    "start",
    "end",
    "vehicle",
    "utilBranch",
    "utilCategory",
  ] as const) {
    if (
      typeof raw[key] === "string" &&
      raw[key].length <= 100 &&
      raw[key].trim()
    ) {
      search[key] = raw[key];
    }
  }
  if (search.week && !/^\d{4}-\d{2}-\d{2}$/.test(search.week))
    delete search.week;
  return search;
}

export function dssView(pathname: string, hash: string) {
  if (pathname.endsWith("/allocation")) return "allocation";
  if (pathname.endsWith("/utilization")) return "utilization";
  // Keep links from the dashboard and previous defense walkthrough usable.
  const legacyEvidenceAnchors = [
    "branch-balance",
    "vehicle-attention",
    "supply-analysis",
    "transfer-review",
    "selected-transfer-review",
    "decision-trace-heading",
    "decision-demand-heading",
    "forecast-calculation-heading",
  ];
  if (
    pathname === "/admin/decisions" &&
    legacyEvidenceAnchors.includes(hash.replace(/^#/, ""))
  )
    return "overview";
  return "forecast";
}
