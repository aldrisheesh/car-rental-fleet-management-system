import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, FileText, SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Btn, TSelect } from "./ui";
import { readFetch } from "@/lib/read-fetch";
import {
  REPORT_KINDS,
  type QueryReport,
  type ReportKind,
} from "@/lib/report-query";
import { reportFilename } from "@/lib/report-filename";
import { BOOKING_CATEGORIES } from "@/lib/booking-categories";

export function ReportBuilder({
  start,
  end,
  branch,
  allowForecast = false,
  filtersPending = false,
}: {
  start: string;
  end: string;
  branch: string;
  allowForecast?: boolean;
  filtersPending?: boolean;
}) {
  const [kind, setKind] = useState<ReportKind>("requests");
  const [vehicle, setVehicle] = useState("");
  const [category, setCategory] = useState("");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState<QueryReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<QueryReport | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportError, setExportError] = useState("");
  const [downloadStarted, setDownloadStarted] = useState(false);
  const requestVersion = useRef(0);
  const query = {
    kind,
    start,
    end,
    branch,
    vehicle,
    category,
    purpose,
    destination,
  };
  const current =
    result && JSON.stringify(result.query) === JSON.stringify(query);
  const categories = [
    ...new Map(
      (options?.vehicles ?? []).map((v) => [v.categoryId, v.categoryName]),
    ).entries(),
  ];
  const branchName =
    branch === "all"
      ? "All branches"
      : (options?.branches.find((item) => item.id === branch)?.name ??
        "Selected branch");
  const refinements = [
    categories.find(([id]) => id === category)?.[1],
    kind !== "forecast" &&
      options?.vehicles.find((item) => item.id === vehicle)?.name,
    kind !== "forecast" &&
      BOOKING_CATEGORIES.purpose.find(([code]) => code === purpose)?.[1],
    kind !== "forecast" &&
      BOOKING_CATEGORIES.destination.find(
        ([code]) => code === destination,
      )?.[1],
  ].filter(Boolean);
  const descriptions: Record<ReportKind, string> = {
    requests: "See which vehicles customers request most often.",
    rentals: "Compare vehicles by rentals that actually started.",
    purposes: "Understand the reasons customers rent a car.",
    destinations: "See the destination areas customers request most often.",
    forecast: "Review saved weekly vehicle needs by branch and category.",
  };
  useEffect(() => {
    const controller = new AbortController();
    readFetch(
      `/api/admin-reports?${new URLSearchParams({ query: "options", start, end, branch })}`,
      { credentials: "same-origin", signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load report filters.");
        return response.json() as Promise<QueryReport>;
      })
      .then((body) => {
        if (!controller.signal.aborted) setOptions(body);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Report filters could not be loaded. Generate a report to retry.",
          );
      });
    return () => controller.abort();
  }, [start, end, branch]);
  async function generate() {
    const version = ++requestVersion.current;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ ...query, query: kind });
      params.delete("kind");
      const response = await readFetch(`/api/admin-reports?${params}`, {
        credentials: "same-origin",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message ?? "Unable to generate this report.");
      if (requestVersion.current === version) {
        setResult(body);
        setOptions(body);
      }
    } catch (cause) {
      if (requestVersion.current === version) {
        setResult(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to generate this report.",
        );
      }
    } finally {
      if (requestVersion.current === version) setBusy(false);
    }
  }
  async function download() {
    if (!result || !current || filtersPending || exporting) return;
    setExporting(true);
    setExportError("");
    setDownloadStarted(false);
    try {
      const { downloadReportPdf } = await import("@/lib/report-pdf");
      await downloadReportPdf(result);
      setDownloadStarted(true);
    } catch {
      setExportError(
        "The PDF could not be created. Your preview is still available. Try downloading again.",
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <section
      className="admin-reports-supporting report-builder"
      aria-labelledby="report-builder-title"
    >
      <header className="report-builder__heading">
        <div>
          <h2 id="report-builder-title">Create an operational report</h2>
          <p>Choose a report, review the results, then export a copy.</p>
        </div>
        <div
          className="report-builder__scope"
          role="group"
          aria-label="Applied report scope"
        >
          <strong>{formatReportDates(start, end)}</strong>
          <span>{branchName} · Manila time</span>
        </div>
      </header>
      <form
        className="report-builder__configuration"
        onSubmit={(event) => {
          event.preventDefault();
          void generate();
        }}
      >
        <div className="report-builder__primary">
          <label>
            Report type
            <TSelect
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as ReportKind);
                setVehicle("");
                setPurpose("");
                setDestination("");
              }}
            >
              {Object.entries(REPORT_KINDS)
                .filter(([key]) => allowForecast || key !== "forecast")
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </TSelect>
          </label>
          <p className="report-builder__description">{descriptions[kind]}</p>
        </div>
        <details className="report-builder__refinements">
          <summary>
            <SlidersHorizontal size={16} aria-hidden="true" />
            More filters
            <span>
              {refinements.length
                ? `${refinements.length} applied`
                : "Optional"}
            </span>
          </summary>
          <div className="report-builder__filters">
            <label>
              Vehicle category
              <TSelect
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setVehicle("");
                }}
              >
                <option value="">All categories</option>
                {categories.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </TSelect>
            </label>
            {kind !== "forecast" && (
              <>
                <label>
                  Vehicle
                  <TSelect
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                  >
                    <option value="">All vehicles</option>
                    {(options?.vehicles ?? [])
                      .filter((v) => !category || v.categoryId === category)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                  </TSelect>
                </label>
                <label>
                  Rental purpose
                  <TSelect
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <option value="">All purposes</option>
                    {BOOKING_CATEGORIES.purpose.map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </TSelect>
                </label>
                <label>
                  Destination area
                  <TSelect
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    <option value="">All destinations</option>
                    {BOOKING_CATEGORIES.destination.map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </TSelect>
                </label>
              </>
            )}
          </div>
          {refinements.length > 0 && (
            <button
              type="button"
              className="report-builder__reset"
              onClick={() => {
                setCategory("");
                setVehicle("");
                setPurpose("");
                setDestination("");
              }}
            >
              Clear additional filters
            </button>
          )}
        </details>
        <div className="report-builder__actions">
          <p>
            {refinements.length
              ? refinements.join(" · ")
              : "All available records in the applied scope."}
          </p>
          <Btn
            type="submit"
            variant="primary"
            disabled={busy || filtersPending}
          >
            <FileText size={16} aria-hidden="true" />
            {busy ? "Generating preview…" : "Generate preview"}
          </Btn>
        </div>
      </form>
      {filtersPending && (
        <p role="status">
          Apply the dates and branch above before generating or downloading this
          report.
        </p>
      )}
      {error && (
        <p role="alert" className="admin-reports-alert">
          {error}
        </p>
      )}
      {!result && !error && (
        <div className="report-builder__empty" role="status">
          <FileText size={24} aria-hidden="true" />
          <h3>
            {busy
              ? "Preparing your report"
              : "Your report preview will appear here"}
          </h3>
          <p>
            {busy
              ? "Gathering the matching records…"
              : "Generate a preview to check the results before downloading."}
          </p>
        </div>
      )}
      {result && (
        <div className="report-builder__result" aria-busy={busy}>
          <header>
            <div>
              <h3>{result.title}</h3>
              <p>
                {formatReportDates(result.query.start, result.query.end)} ·{" "}
                {result.query.branch === "all"
                  ? "All branches"
                  : (result.branches.find(
                      (item) => item.id === result.query.branch,
                    )?.name ?? "Selected branch")}
              </p>
              <p className="report-builder__timestamp">
                Generated {formatReportTime(result.generatedAt)} ·{" "}
                {result.rows.length}{" "}
                {result.rows.length === 1 ? "result" : "results"}
              </p>
            </div>
            <Dialog
              open={exportOpen}
              onOpenChange={(open) => {
                setExportOpen(open);
                if (open) {
                  setExportError("");
                  setDownloadStarted(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Btn disabled={!current || busy || filtersPending}>
                  <ArrowDownToLine size={16} aria-hidden="true" />
                  Export report
                </Btn>
              </DialogTrigger>
              <DialogContent className="report-export-dialog">
                <DialogHeader>
                  <DialogTitle>Export report</DialogTitle>
                  <DialogDescription>
                    Download the generated preview with its applied filters.
                  </DialogDescription>
                </DialogHeader>
                <dl className="report-export-dialog__summary">
                  <div>
                    <dt>Report</dt>
                    <dd>{result.title}</dd>
                  </div>
                  <div>
                    <dt>Period</dt>
                    <dd>
                      {formatReportDates(result.query.start, result.query.end)}
                    </dd>
                  </div>
                  <div>
                    <dt>Branch</dt>
                    <dd>
                      {result.query.branch === "all"
                        ? "All branches"
                        : (result.branches.find(
                            (item) => item.id === result.query.branch,
                          )?.name ?? "Selected branch")}
                    </dd>
                  </div>
                  {current && refinements.length > 0 && (
                    <div>
                      <dt>Filters</dt>
                      <dd>{refinements.join(" · ")}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Format</dt>
                    <dd>PDF · Portrait · Short bond (8.5 × 11 in)</dd>
                  </div>
                  <div>
                    <dt>Filename</dt>
                    <dd className="report-export-dialog__filename">
                      {reportFilename(result)}
                    </dd>
                  </div>
                </dl>
                {(!current || filtersPending) && (
                  <p role="status" className="report-builder__notice">
                    Settings changed. Close this dialog and regenerate the
                    preview before exporting.
                  </p>
                )}
                {exportError && (
                  <p role="alert" className="admin-reports-alert">
                    {exportError}
                  </p>
                )}
                <p
                  role="status"
                  aria-live="polite"
                  className="report-export-dialog__status"
                >
                  {exporting
                    ? "Preparing your PDF…"
                    : downloadStarted
                      ? "Download started. Check your browser’s downloads for the file."
                      : "The PDF includes the report scope, results and generation time."}
                </p>
                <DialogFooter>
                  <Btn onClick={() => setExportOpen(false)}>
                    {downloadStarted ? "Close" : "Cancel"}
                  </Btn>
                  <Btn
                    variant="primary"
                    disabled={!current || filtersPending || busy || exporting}
                    onClick={() => void download()}
                  >
                    <ArrowDownToLine size={16} aria-hidden="true" />
                    {exporting
                      ? "Preparing PDF…"
                      : downloadStarted
                        ? "Download again"
                        : "Download PDF"}
                  </Btn>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </header>
          {(!current || filtersPending) && (
            <p role="status" className="report-builder__notice">
              Settings changed. Generate a new preview before exporting.
            </p>
          )}
          {busy && <p role="status">Updating the report preview…</p>}
          <p>{result.note}</p>
          <div
            className="admin-scroll-region"
            tabIndex={0}
            role="region"
            aria-label="Generated report results"
          >
            <table className="admin-decision-data-table">
              <thead>
                <tr>
                  <th>
                    {result.query.kind === "forecast"
                      ? "Branch / planning week"
                      : "Result"}
                  </th>
                  {!["purposes", "destinations"].includes(
                    result.query.kind,
                  ) && <th>Vehicle category</th>}
                  <th>
                    {result.query.kind === "forecast"
                      ? "Vehicles to plan for"
                      : result.query.kind === "rentals"
                        ? "Rental starts"
                        : "Requests"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.label}</td>
                    {!["purposes", "destinations"].includes(
                      result.query.kind,
                    ) && <td>{row.category || "—"}</td>}
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!result.rows.length && <p>No matching records in this period.</p>}
        </div>
      )}
    </section>
  );
}

function formatReportDates(start: string, end: string) {
  const format = (date: string) =>
    new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    }).format(new Date(`${date}T00:00:00+08:00`));
  return `${format(start)} – ${format(end)}`;
}
function formatReportTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
