import { useEffect, useRef, useState } from "react";
import { Btn, TSelect } from "./ui";
import { readFetch } from "@/lib/read-fetch";
import {
  REPORT_KINDS,
  type QueryReport,
  type ReportKind,
} from "@/lib/report-query";
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
    if (!result || !current) return;
    setExporting(true);
    setError("");
    try {
      const { downloadReportPdf } = await import("@/lib/report-pdf");
      await downloadReportPdf(result);
    } catch {
      setError("The PDF could not be created. Try downloading again.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <section
      className="admin-reports-supporting report-builder"
      aria-labelledby="report-builder-title"
    >
      <header>
        <h2 id="report-builder-title">Generate a report</h2>
        <p>
          Choose the question you want to answer. The dates and branch above
          apply to this report.
        </p>
      </header>
      <form
        className="report-builder__filters"
        onSubmit={(event) => {
          event.preventDefault();
          void generate();
        }}
      >
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
        <Btn type="submit" variant="primary" disabled={busy || filtersPending}>
          {busy ? "Generating…" : "Generate report"}
        </Btn>
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
      {result && (
        <div className="report-builder__result">
          <header>
            <div>
              <h3>{result.title}</h3>
              <p>
                {result.query.start} – {result.query.end}
              </p>
            </div>
            <Btn
              type="button"
              disabled={!current || busy || exporting || filtersPending}
              onClick={() => void download()}
            >
              {exporting ? "Preparing PDF…" : "Download PDF"}
            </Btn>
          </header>
          {!current && (
            <p role="status">
              Filters changed. Generate the report again before downloading.
            </p>
          )}
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
