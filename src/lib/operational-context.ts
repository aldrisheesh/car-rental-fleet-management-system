import type {
  FuelEstimate,
  NormalizedTrafficIncident,
  ProviderName,
  ProviderResult,
  ProviderStatus,
  TripContext,
} from "./external-context.server.ts";

export type WeatherClassification =
  | "Normal"
  | "Caution"
  | "Severe"
  | "Unavailable";
export type RoadConditionClassification =
  | "Open"
  | "Caution"
  | "Closed/Impassable"
  | "Unknown";
export type RouteFeasibilityClassification =
  | "Feasible"
  | "Feasible with Caution"
  | "Not Feasible"
  | "Unavailable";
export type RouteAccessibilityClassification =
  | "Accessible"
  | "Limited"
  | "Closed/Restricted"
  | "Unknown";

export type InterpretedSourceStatus = {
  availability: "available" | "unavailable";
  status: ProviderStatus;
  providerUsed?: ProviderName;
  fallbackUsed: boolean;
};

export type InterpretedFactor<T> = {
  classification: T;
  reasons: string[];
  sourceStatus: InterpretedSourceStatus;
};

export type InterpretedOperationalContext = {
  weather: InterpretedFactor<WeatherClassification>;
  roadCondition: InterpretedFactor<RoadConditionClassification>;
  routeFeasibility: InterpretedFactor<RouteFeasibilityClassification>;
  routeAccessibility: InterpretedFactor<RouteAccessibilityClassification>;
  distanceKm?: number;
  travelTimeMinutes?: number;
  estimatedFuelLiters?: number;
  reasons: string[];
  limitations: string[];
};

type WeatherSemantic = Exclude<WeatherClassification, "Unavailable">;

// These tables intentionally map only documented normalized weather codes.
const WMO_WEATHER: Readonly<Record<number, [WeatherSemantic, string]>> = {
  0: ["Normal", "weather_clear"],
  1: ["Normal", "weather_clear"],
  2: ["Normal", "weather_cloudy"],
  3: ["Normal", "weather_cloudy"],
  45: ["Caution", "weather_fog"],
  48: ["Caution", "weather_fog"],
  51: ["Caution", "weather_drizzle"],
  53: ["Caution", "weather_drizzle"],
  55: ["Caution", "weather_drizzle"],
  56: ["Caution", "weather_freezing_precipitation"],
  57: ["Caution", "weather_freezing_precipitation"],
  61: ["Caution", "weather_rain"],
  63: ["Caution", "weather_rain"],
  65: ["Caution", "weather_rain"],
  66: ["Caution", "weather_freezing_precipitation"],
  67: ["Caution", "weather_freezing_precipitation"],
  71: ["Caution", "weather_snow"],
  73: ["Caution", "weather_snow"],
  75: ["Caution", "weather_snow"],
  77: ["Caution", "weather_snow"],
  80: ["Caution", "weather_rain"],
  81: ["Caution", "weather_rain"],
  82: ["Caution", "weather_rain"],
  85: ["Caution", "weather_snow"],
  86: ["Caution", "weather_snow"],
  95: ["Caution", "weather_thunderstorm"],
  96: ["Caution", "weather_thunderstorm"],
  99: ["Severe", "weather_severe_thunderstorm"],
};

const OPENWEATHER_WEATHER: Readonly<Record<number, [WeatherSemantic, string]>> =
  {
    200: ["Caution", "weather_thunderstorm"],
    201: ["Caution", "weather_thunderstorm"],
    202: ["Severe", "weather_severe_thunderstorm"],
    210: ["Caution", "weather_thunderstorm"],
    211: ["Caution", "weather_thunderstorm"],
    212: ["Severe", "weather_severe_thunderstorm"],
    221: ["Caution", "weather_thunderstorm"],
    230: ["Caution", "weather_thunderstorm"],
    231: ["Caution", "weather_thunderstorm"],
    232: ["Caution", "weather_thunderstorm"],
    300: ["Caution", "weather_drizzle"],
    301: ["Caution", "weather_drizzle"],
    302: ["Caution", "weather_drizzle"],
    310: ["Caution", "weather_drizzle"],
    311: ["Caution", "weather_drizzle"],
    312: ["Caution", "weather_drizzle"],
    313: ["Caution", "weather_drizzle"],
    314: ["Caution", "weather_drizzle"],
    321: ["Caution", "weather_drizzle"],
    500: ["Caution", "weather_rain"],
    501: ["Caution", "weather_rain"],
    502: ["Caution", "weather_rain"],
    503: ["Severe", "weather_severe_precipitation"],
    504: ["Severe", "weather_severe_precipitation"],
    511: ["Caution", "weather_freezing_precipitation"],
    520: ["Caution", "weather_rain"],
    521: ["Caution", "weather_rain"],
    522: ["Caution", "weather_rain"],
    531: ["Caution", "weather_rain"],
    600: ["Caution", "weather_snow"],
    601: ["Caution", "weather_snow"],
    602: ["Caution", "weather_snow"],
    611: ["Caution", "weather_freezing_precipitation"],
    612: ["Caution", "weather_freezing_precipitation"],
    613: ["Caution", "weather_freezing_precipitation"],
    615: ["Caution", "weather_freezing_precipitation"],
    616: ["Caution", "weather_freezing_precipitation"],
    620: ["Caution", "weather_snow"],
    621: ["Caution", "weather_snow"],
    622: ["Caution", "weather_snow"],
    701: ["Caution", "weather_fog"],
    711: ["Caution", "weather_atmosphere"],
    721: ["Caution", "weather_atmosphere"],
    731: ["Caution", "weather_atmosphere"],
    741: ["Caution", "weather_fog"],
    751: ["Caution", "weather_atmosphere"],
    761: ["Caution", "weather_atmosphere"],
    762: ["Caution", "weather_atmosphere"],
    771: ["Caution", "weather_atmosphere"],
    781: ["Severe", "weather_severe_atmosphere"],
    800: ["Normal", "weather_clear"],
    801: ["Normal", "weather_cloudy"],
    802: ["Normal", "weather_cloudy"],
    803: ["Normal", "weather_cloudy"],
    804: ["Normal", "weather_cloudy"],
  };

function sourceStatus<T>(result: ProviderResult<T>): InterpretedSourceStatus {
  return {
    availability:
      result.status === "available" && result.data !== undefined
        ? "available"
        : "unavailable",
    status: result.status,
    providerUsed: result.providerUsed,
    fallbackUsed: result.fallbackUsed,
  };
}

function factor<T>(
  classification: T,
  reasons: string[],
  result: ProviderResult<unknown>,
): InterpretedFactor<T> {
  return { classification, reasons, sourceStatus: sourceStatus(result) };
}

function numericCode(value: number | string): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

export function interpretWeather(
  weather: TripContext["weather"],
): InterpretedFactor<WeatherClassification> {
  if (weather.status !== "available" || !weather.data) {
    return factor("Unavailable", ["weather_unavailable"], weather);
  }

  const code = numericCode(weather.data.weatherCode);
  const mapping =
    code === undefined
      ? undefined
      : weather.providerUsed === "open_meteo"
        ? WMO_WEATHER[code]
        : weather.providerUsed === "openweather"
          ? OPENWEATHER_WEATHER[code]
          : undefined;
  return mapping
    ? factor(mapping[0], [mapping[1]], weather)
    : factor("Unavailable", ["weather_unavailable"], weather);
}

const closureTerms = ["closure", "closed", "impassable", "blocked", "blocking"];
const cautionTerms = [
  "roadwork",
  "construction",
  "accident",
  "collision",
  "crash",
  "lane closure",
  "lane restriction",
  "flood",
  "dangerous",
  "restriction",
];

function incidentTerms(incident: NormalizedTrafficIncident): string {
  return [incident.category, incident.severity]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

function incidentReason(terms: string): string {
  if (terms.includes("roadwork") || terms.includes("construction"))
    return "roadworks";
  if (
    terms.includes("accident") ||
    terms.includes("collision") ||
    terms.includes("crash")
  ) {
    return "traffic_accident";
  }
  if (terms.includes("flood")) return "road_flooding";
  return "road_disruption";
}

type IncidentInterpretation = {
  closed: boolean;
  caution: boolean;
  unrecognized: boolean;
  reasons: string[];
};

function interpretIncidents(
  incidents: readonly NormalizedTrafficIncident[],
): IncidentInterpretation {
  let closed = false;
  let caution = false;
  let unrecognized = false;
  const reasons: string[] = [];
  for (const incident of incidents) {
    const terms = incidentTerms(incident);
    if (
      incident.isRoadClosed === true ||
      closureTerms.some((term) => terms.includes(term))
    ) {
      closed = true;
      reasons.push("road_closure");
    } else if (cautionTerms.some((term) => terms.includes(term))) {
      caution = true;
      reasons.push(incidentReason(terms));
    } else {
      unrecognized = true;
    }
  }
  return { closed, caution, unrecognized, reasons: unique(reasons) };
}

export function interpretRoadCondition(
  trafficIncidents: TripContext["trafficIncidents"],
): InterpretedFactor<RoadConditionClassification> & {
  unrecognizedIncidents: boolean;
} {
  if (trafficIncidents.status !== "available" || !trafficIncidents.data) {
    return {
      ...factor("Unknown", ["road_context_unavailable"], trafficIncidents),
      unrecognizedIncidents: false,
    };
  }
  const incidents = interpretIncidents(trafficIncidents.data);
  if (incidents.closed) {
    return {
      ...factor("Closed/Impassable", ["road_closure"], trafficIncidents),
      unrecognizedIncidents: incidents.unrecognized,
    };
  }
  if (incidents.caution) {
    return {
      ...factor("Caution", incidents.reasons, trafficIncidents),
      unrecognizedIncidents: incidents.unrecognized,
    };
  }
  return {
    ...factor("Open", ["road_open"], trafficIncidents),
    unrecognizedIncidents: incidents.unrecognized,
  };
}

export function interpretRouteAccessibility(
  route: TripContext["route"],
  trafficIncidents: TripContext["trafficIncidents"],
): InterpretedFactor<RouteAccessibilityClassification> {
  if (
    route.status !== "available" ||
    !route.data ||
    trafficIncidents.status !== "available" ||
    !trafficIncidents.data
  ) {
    return factor("Unknown", ["access_unknown"], trafficIncidents);
  }
  const incidents = interpretIncidents(trafficIncidents.data);
  if (incidents.closed)
    return factor("Closed/Restricted", ["access_closed"], trafficIncidents);
  if (incidents.caution)
    return factor("Limited", ["access_limited"], trafficIncidents);
  return factor("Accessible", ["access_accessible"], trafficIncidents);
}

export function interpretRouteFeasibility(
  route: TripContext["route"],
  weather: InterpretedFactor<WeatherClassification>,
  roadCondition: InterpretedFactor<RoadConditionClassification>,
  routeAccessibility: InterpretedFactor<RouteAccessibilityClassification>,
): InterpretedFactor<RouteFeasibilityClassification> {
  if (route.status !== "available" || !route.data) {
    return factor("Unavailable", ["route_unavailable"], route);
  }
  if (
    roadCondition.classification === "Closed/Impassable" ||
    routeAccessibility.classification === "Closed/Restricted"
  ) {
    return factor("Not Feasible", ["route_blocked"], route);
  }
  if (
    weather.classification === "Unavailable" ||
    roadCondition.classification === "Unknown" ||
    routeAccessibility.classification === "Unknown"
  ) {
    return factor("Unavailable", ["context_unavailable"], route);
  }
  if (
    weather.classification === "Caution" ||
    weather.classification === "Severe" ||
    roadCondition.classification === "Caution" ||
    routeAccessibility.classification === "Limited"
  ) {
    return factor("Feasible with Caution", ["route_caution"], route);
  }
  return factor("Feasible", ["route_available"], route);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function usableNonNegative(value: number): number | undefined {
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function fuelLiters(
  fuelEstimate: FuelEstimate | undefined,
): number | undefined {
  const liters = fuelEstimate?.estimatedLiters;
  return liters !== undefined && Number.isFinite(liters) && liters >= 0
    ? liters
    : undefined;
}

export function interpretOperationalContext(
  context: TripContext,
): InterpretedOperationalContext {
  const weather = interpretWeather(context.weather);
  const roadCondition = interpretRoadCondition(context.trafficIncidents);
  const routeAccessibility = interpretRouteAccessibility(
    context.route,
    context.trafficIncidents,
  );
  const routeFeasibility = interpretRouteFeasibility(
    context.route,
    weather,
    roadCondition,
    routeAccessibility,
  );
  const route =
    context.route.status === "available" ? context.route.data : undefined;
  const distanceMeters = route
    ? usableNonNegative(route.distanceMeters)
    : undefined;
  const durationSeconds = route
    ? usableNonNegative(route.durationSeconds)
    : undefined;
  const estimatedFuelLiters = fuelLiters(context.fuelEstimate);
  const reasons = unique([
    ...weather.reasons,
    ...roadCondition.reasons,
    ...routeAccessibility.reasons,
    ...routeFeasibility.reasons,
    estimatedFuelLiters === undefined
      ? "fuel_estimate_unavailable"
      : "fuel_estimate_available",
  ]);
  const limitations = unique([
    ...(weather.classification === "Unavailable"
      ? ["weather_context_unavailable"]
      : []),
    ...(roadCondition.classification === "Unknown"
      ? ["road_context_unavailable"]
      : []),
    ...(routeAccessibility.classification === "Unknown"
      ? ["access_context_unavailable"]
      : []),
    ...(routeFeasibility.classification === "Unavailable"
      ? ["route_or_context_unavailable"]
      : []),
    ...(roadCondition.unrecognizedIncidents
      ? ["road_incident_unrecognized"]
      : []),
  ]);
  return {
    weather,
    roadCondition,
    routeFeasibility,
    routeAccessibility,
    ...(distanceMeters === undefined
      ? {}
      : { distanceKm: distanceMeters / 1000 }),
    ...(durationSeconds === undefined
      ? {}
      : { travelTimeMinutes: durationSeconds / 60 }),
    ...(estimatedFuelLiters === undefined ? {} : { estimatedFuelLiters }),
    reasons,
    limitations,
  };
}
