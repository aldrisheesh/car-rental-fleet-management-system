import { Badge, Card } from "@/components/admin/ui";

type Source = {
  status: string;
  provider: string;
  fallbackUsed: boolean;
  checkedAt: string;
};

export type OperationalContextView = {
  status: "available" | "partial" | "unavailable" | "not_applicable";
  reason?: string;
  origin: { name: string; address: string | null };
  destination: { name: string; address?: string | null };
  targetTime: string;
  evaluatedAt: string;
  timeSemantics: "booking_pickup" | "current_review";
  context: {
    weather: { classification: string };
    roadCondition: { classification: string };
    routeFeasibility: { classification: string };
    routeAccessibility: { classification: string };
    distanceKm?: number;
    travelTimeMinutes?: number;
  } | null;
  referenceEfficiencyKmPerLiter: number | null;
  estimatedFuelLiters: number | null;
  sources: Record<string, Source>;
  explanations: string[];
  limitations: string[];
};

function metric(value: string | number | null | undefined) {
  return value === null || value === undefined || value === ""
    ? "Unavailable"
    : value;
}

function duration(minutes?: number) {
  if (minutes === undefined) return "Unavailable";
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function ContextMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-secondary/20 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

export function OperationalContextPanel({
  title = "Operational Context",
  context,
  loading,
  error,
  advisoryNote,
  embedded = false,
}: {
  title?: string;
  context: OperationalContextView | null;
  loading: boolean;
  error?: string;
  advisoryNote?: string;
  embedded?: boolean;
}) {
  const body = (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          {advisoryNote ? (
            <p className="mt-1 text-xs text-muted-foreground">{advisoryNote}</p>
          ) : null}
        </div>
        {context ? (
          <Badge>
            {context.status === "not_applicable"
              ? "Not applicable"
              : context.status}
          </Badge>
        ) : null}
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading context…</p>
      ) : null}
      {!loading && error ? (
        <div className="rounded-md border border-border p-3 text-sm">
          <p>Context unavailable.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error} Decisions remain available.
          </p>
        </div>
      ) : null}
      {!loading && context ? (
        <>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {context.origin.name}
            </span>
            {context.origin.address ? ` (${context.origin.address})` : ""} →{" "}
            <span className="font-medium text-foreground">
              {context.destination.name || "No destination recorded"}
            </span>
            {context.destination.address
              ? ` (${context.destination.address})`
              : ""}
          </div>
          {context.timeSemantics === "current_review" ? (
            <p className="text-xs text-muted-foreground">
              Evaluated {new Date(context.evaluatedAt).toLocaleString()}. This
              is current review-time context, not a prediction for the target
              week.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Checked {new Date(context.evaluatedAt).toLocaleString()} for
              pickup {new Date(context.targetTime).toLocaleString()}.
            </p>
          )}
          {context.context ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <ContextMetric
                label="Weather"
                value={context.context.weather.classification}
              />
              <ContextMetric
                label="Road Condition"
                value={context.context.roadCondition.classification}
              />
              <ContextMetric
                label="Route Feasibility"
                value={context.context.routeFeasibility.classification}
              />
              <ContextMetric
                label="Route Accessibility"
                value={context.context.routeAccessibility.classification}
              />
              <ContextMetric
                label="Distance"
                value={
                  context.context.distanceKm === undefined
                    ? "Unavailable"
                    : `${context.context.distanceKm.toFixed(1)} km`
                }
              />
              <ContextMetric
                label="Travel time"
                value={duration(context.context.travelTimeMinutes)}
              />
              <ContextMetric
                label="Reference efficiency"
                value={
                  context.referenceEfficiencyKmPerLiter === null
                    ? "Unavailable"
                    : `${context.referenceEfficiencyKmPerLiter.toFixed(1)} km/L`
                }
              />
              <ContextMetric
                label="Estimated fuel"
                value={
                  context.estimatedFuelLiters === null
                    ? "Unavailable"
                    : `${context.estimatedFuelLiters.toFixed(1)} L`
                }
              />
            </div>
          ) : null}
          {context.explanations.length ? (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {context.explanations.map((explanation) => (
                <li key={explanation}>• {explanation}</li>
              ))}
            </ul>
          ) : null}
          {context.limitations.length ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
              <div className="font-medium">Limitations</div>
              {context.limitations.map((limitation) => (
                <p key={limitation} className="mt-1 text-muted-foreground">
                  {limitation}
                </p>
              ))}
            </div>
          ) : null}
          {Object.keys(context.sources).length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2 text-[11px] text-muted-foreground">
              {Object.entries(context.sources).map(([name, source]) => (
                <span key={name}>
                  {name[0].toUpperCase() + name.slice(1)}: {source.provider}
                  {source.fallbackUsed ? " fallback" : ""} ·{" "}
                  {source.status.replaceAll("_", " ")} · checked{" "}
                  {new Date(source.checkedAt).toLocaleString()}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
  return embedded ? (
    <div className="rounded-md border border-border">{body}</div>
  ) : (
    <Card>{body}</Card>
  );
}
