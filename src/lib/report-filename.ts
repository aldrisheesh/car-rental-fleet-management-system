import type { QueryReport } from "./report-query";

/** Keep the export dialog and saved PDF filename identical. */
export function reportFilename(report: QueryReport): string {
  const title = report.title
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `Briah-${title}-${report.query.start}-to-${report.query.end}.pdf`;
}
