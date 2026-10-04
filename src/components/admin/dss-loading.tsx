import { Skeleton } from "@/components/ui/skeleton";

type Screen = "forecast" | "allocation" | "utilization";
function Heading() {
  return (
    <div className="dss-loading-heading">
      <Skeleton className="dss-loading-title" />
      <Skeleton className="dss-loading-copy" />
    </div>
  );
}
function Rows({
  count = 4,
  columns = 6,
}: {
  count?: number;
  columns?: number;
}) {
  return (
    <div className="dss-loading-rows">
      {Array.from({ length: count }, (_, row) => (
        <div
          className="dss-loading-row"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          key={row}
        >
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton className="dss-loading-cell" key={col} />
          ))}
        </div>
      ))}
    </div>
  );
}
function Evidence() {
  return (
    <div className="dss-loading-evidence">
      <Skeleton className="dss-loading-copy" />
      <Skeleton className="dss-loading-copy" />
      <Skeleton className="dss-loading-short" />
      <div className="dss-loading-factors">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <Skeleton className="dss-loading-short" />
            <Skeleton className="dss-loading-copy" />
          </div>
        ))}
      </div>
      <Skeleton className="dss-loading-notice" />
      <Skeleton className="dss-loading-copy" />
    </div>
  );
}
export function ExternalAdvisorySkeleton() {
  return (
    <div className="dss-loading-advisory" role="status">
      <span className="sr-only">
        Checking weather, roads and route evidence. Decisions are paused until
        the check finishes.
      </span>
      <div aria-hidden="true">
        <Skeleton className="dss-loading-notice" />
        <div className="dss-loading-factors">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <Skeleton className="dss-loading-short" />
              <Skeleton className="dss-loading-copy" />
            </div>
          ))}
        </div>
        <Skeleton className="dss-loading-copy" />
      </div>
    </div>
  );
}
export function DssScreenSkeleton({ screen }: { screen: Screen }) {
  const label = {
    forecast: "demand forecast",
    allocation: "fleet allocation",
    utilization: "vehicle utilization",
  }[screen];
  return (
    <div
      className={`dss-loading-shell dss-loading-${screen}`}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading {label}…</span>
      <div aria-hidden="true">
        <div className="dss-loading-toolbar">
          {Array.from({ length: screen === "utilization" ? 4 : 2 }, (_, i) => (
            <div className="dss-loading-field" key={i}>
              <Skeleton className="dss-loading-short" />
              <Skeleton className="dss-loading-control" />
            </div>
          ))}
          <div className="dss-loading-toolbar-actions">
            <Skeleton className="dss-loading-button" />
            {screen === "allocation" ? (
              <Skeleton className="dss-loading-button" />
            ) : null}
          </div>
          <Skeleton className="dss-loading-toolbar-note" />
        </div>
        {screen === "forecast" ? (
          <div className="dss-forecast-layout">
            <div className="dss-forecast-main">
              <div className="admin-decision-panel">
                <Heading />
                <div className="dss-loading-chart">
                  <Skeleton className="dss-loading-chart-plot" />
                </div>
              </div>
              <div className="admin-decision-panel">
                <Heading />
                <Rows count={3} />
              </div>
              <div className="admin-decision-panel">
                <Heading />
                <Rows count={3} columns={4} />
              </div>
            </div>
            <div className="admin-decision-panel dss-loading-accuracy">
              <Heading />
              <Skeleton className="dss-loading-metric" />
              <Evidence />
            </div>
          </div>
        ) : null}
        {screen === "allocation" ? (
          <>
            <div className="admin-decision-panel">
              <Heading />
              <Rows count={2} />
            </div>
            <div className="dss-allocation-layout">
              <div className="dss-allocation-register">
                <div className="admin-decision-panel">
                  <Heading />
                  {Array.from({ length: 2 }, (_, i) => (
                    <div className="dss-loading-list-item" key={i}>
                      <Skeleton className="dss-loading-copy" />
                      <Skeleton className="dss-loading-short" />
                      <Skeleton className="dss-loading-copy" />
                    </div>
                  ))}
                </div>
                <div className="admin-decision-panel">
                  <Heading />
                  <Evidence />
                </div>
              </div>
              <div className="admin-decision-panel">
                <Heading />
                <Evidence />
                <div className="dss-loading-list-item">
                  <Skeleton className="dss-loading-copy" />
                  <ExternalAdvisorySkeleton />
                </div>
              </div>
            </div>
          </>
        ) : null}
        {screen === "utilization" ? (
          <>
            <div className="admin-decision-panel">
              <Heading />
              <Rows count={6} columns={9} />
            </div>
            <div className="admin-decision-panel">
              <Heading />
              <div className="dss-loading-inspector">
                <Evidence />
                <Evidence />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
