export type ExternalContextFailureCategory =
  | "timeout"
  | "not_configured"
  | "authentication"
  | "quota"
  | "coverage"
  | "unsupported"
  | "malformed_response"
  | "provider_error";

export type ProviderStatus =
  | "available"
  | "unavailable"
  | "not_configured"
  | "unsupported"
  | "timeout"
  | "provider_error";

export type ProviderName = "open_meteo" | "openweather" | "tomtom" | "here";

export type ProviderResult<T> = {
  status: ProviderStatus;
  data?: T;
  providerUsed?: ProviderName;
  fallbackUsed: boolean;
  fetchedAt: string;
  failureCategory?: ExternalContextFailureCategory;
  cacheHit?: boolean;
};

export type Coordinates = { latitude: number; longitude: number };

export type WeatherRequest = Coordinates & { targetTime: string };
export type NormalizedWeather = {
  targetTime: string;
  weatherCode: number | string;
  temperatureCelsius?: number;
  precipitationMillimeters?: number;
  precipitationProbabilityPercent?: number;
  windSpeedKph?: number;
  windDirectionDegrees?: number;
};

export type GeocodeRequest = { query: string };
export type NormalizedGeocode = Coordinates & { label: string };

export type RouteRequest = {
  origin: Coordinates;
  destination: Coordinates;
  trafficAware?: boolean;
};
export type NormalizedRoute = {
  distanceMeters: number;
  durationSeconds: number;
  trafficAware: boolean;
};

export type TrafficIncidentRequest = {
  center: Coordinates;
  radiusMeters?: number;
};
export type NormalizedTrafficIncident = {
  providerIncidentId?: string;
  category?: string;
  severity?: string | number;
  isRoadClosed?: boolean;
  startTime?: string;
  endTime?: string;
  location?: Coordinates;
};

export interface WeatherProvider {
  getWeather(
    request: WeatherRequest,
  ): Promise<ProviderResult<NormalizedWeather>>;
}
export interface GeocodingProvider {
  geocode(request: GeocodeRequest): Promise<ProviderResult<NormalizedGeocode>>;
}
export interface RoutingProvider {
  getRoute(request: RouteRequest): Promise<ProviderResult<NormalizedRoute>>;
}
export interface TrafficIncidentProvider {
  getIncidents(
    request: TrafficIncidentRequest,
  ): Promise<ProviderResult<NormalizedTrafficIncident[]>>;
}

export type ExternalContextEnv = {
  tomtomApiKey?: string;
  hereApiKey?: string;
  openWeatherApiKey?: string;
  timeoutMs?: number;
};

export type ExternalContextHttpClient = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const DEFAULT_TIMEOUT_MS = 7_500;
const now = () => new Date().toISOString();

function configured(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function getExternalContextEnv(
  values: Record<string, unknown> = typeof process === "undefined"
    ? {}
    : process.env,
): ExternalContextEnv {
  const read = (key: string) =>
    typeof values[key] === "string"
      ? configured(values[key] as string)
      : undefined;
  const rawTimeout = Number(read("EXTERNAL_CONTEXT_TIMEOUT_MS"));
  return {
    tomtomApiKey: read("TOMTOM_API_KEY"),
    hereApiKey: read("HERE_API_KEY"),
    openWeatherApiKey: read("OPENWEATHER_API_KEY"),
    timeoutMs:
      Number.isFinite(rawTimeout) && rawTimeout >= 250 && rawTimeout <= 30_000
        ? rawTimeout
        : DEFAULT_TIMEOUT_MS,
  };
}

function available<T>(providerUsed: ProviderName, data: T): ProviderResult<T> {
  return {
    status: "available",
    data,
    providerUsed,
    fallbackUsed: false,
    fetchedAt: now(),
  };
}

function failure<T>(
  category: ExternalContextFailureCategory,
  providerUsed?: ProviderName,
): ProviderResult<T> {
  const status: ProviderStatus =
    category === "timeout"
      ? "timeout"
      : category === "not_configured"
        ? "not_configured"
        : category === "unsupported"
          ? "unsupported"
          : category === "provider_error" || category === "malformed_response"
            ? "provider_error"
            : "unavailable";
  return {
    status,
    providerUsed,
    fallbackUsed: false,
    fetchedAt: now(),
    failureCategory: category,
  };
}

function usable<T>(
  result: ProviderResult<T>,
): result is ProviderResult<T> & { data: T } {
  return result.status === "available" && result.data !== undefined;
}

function fallbackEligible(result: ProviderResult<unknown>): boolean {
  return !usable(result) && result.failureCategory !== undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

async function requestJson(
  http: ExternalContextHttpClient,
  url: URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<
  | { ok: true; body: unknown }
  | { ok: false; category: ExternalContextFailureCategory }
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await http(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const category =
        response.status === 401 || response.status === 403
          ? "authentication"
          : response.status === 429
            ? "quota"
            : response.status === 404
              ? "coverage"
              : response.status === 400 ||
                  response.status === 405 ||
                  response.status === 501
                ? "unsupported"
                : "provider_error";
      return { ok: false, category };
    }
    try {
      return { ok: true, body: await response.json() };
    } catch {
      return { ok: false, category: "malformed_response" };
    }
  } catch (error) {
    return {
      ok: false,
      category:
        controller.signal.aborted ||
        (error instanceof Error && error.name === "AbortError")
          ? "timeout"
          : "provider_error",
    };
  } finally {
    clearTimeout(timer);
  }
}

function hourAtOrAfter(times: unknown, targetTime: string): number | undefined {
  if (!Array.isArray(times)) return undefined;
  const target = Date.parse(targetTime);
  if (!Number.isFinite(target)) return undefined;
  const parseTime = (time: unknown) => {
    const value = String(time);
    return Date.parse(/[zZ]$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
  };
  const exact = times.findIndex((time) => parseTime(time) === target);
  if (exact >= 0) return exact;
  return times.findIndex((time) => parseTime(time) >= target);
}

export class OpenMeteoWeatherProvider implements WeatherProvider {
  private readonly http: ExternalContextHttpClient;
  private readonly timeoutMs: number;
  constructor(
    http: ExternalContextHttpClient = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {
    this.http = http;
    this.timeoutMs = timeoutMs;
  }

  async getWeather(
    request: WeatherRequest,
  ): Promise<ProviderResult<NormalizedWeather>> {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(request.latitude),
      longitude: String(request.longitude),
      timezone: "UTC",
      hourly:
        "temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m",
    }).toString();
    const response = await requestJson(this.http, url, {}, this.timeoutMs);
    if (!response.ok) return failure(response.category, "open_meteo");
    const body = objectValue(response.body);
    const hourly = objectValue(body?.hourly);
    const index = hourAtOrAfter(hourly?.time, request.targetTime);
    if (index === undefined || index < 0)
      return failure("unsupported", "open_meteo");
    const code = Array.isArray(hourly?.weather_code)
      ? hourly?.weather_code[index]
      : undefined;
    if (typeof code !== "number")
      return failure("malformed_response", "open_meteo");
    return available("open_meteo", {
      targetTime: String((hourly?.time as unknown[])[index]),
      weatherCode: code,
      temperatureCelsius: Array.isArray(hourly?.temperature_2m)
        ? numberValue(hourly.temperature_2m[index])
        : undefined,
      precipitationMillimeters: Array.isArray(hourly?.precipitation)
        ? numberValue(hourly.precipitation[index])
        : undefined,
      precipitationProbabilityPercent: Array.isArray(
        hourly?.precipitation_probability,
      )
        ? numberValue(hourly.precipitation_probability[index])
        : undefined,
      windSpeedKph: Array.isArray(hourly?.wind_speed_10m)
        ? numberValue(hourly.wind_speed_10m[index])
        : undefined,
      windDirectionDegrees: Array.isArray(hourly?.wind_direction_10m)
        ? numberValue(hourly.wind_direction_10m[index])
        : undefined,
    });
  }
}

export class OpenWeatherWeatherProvider implements WeatherProvider {
  private readonly env: ExternalContextEnv;
  private readonly http: ExternalContextHttpClient;
  constructor(
    env: ExternalContextEnv,
    http: ExternalContextHttpClient = fetch,
  ) {
    this.env = env;
    this.http = http;
  }

  async getWeather(
    request: WeatherRequest,
  ): Promise<ProviderResult<NormalizedWeather>> {
    if (!configured(this.env.openWeatherApiKey))
      return failure("not_configured", "openweather");
    const url = new URL("https://api.openweathermap.org/data/3.0/onecall");
    url.search = new URLSearchParams({
      lat: String(request.latitude),
      lon: String(request.longitude),
      units: "metric",
      appid: this.env.openWeatherApiKey!,
    }).toString();
    const response = await requestJson(
      this.http,
      url,
      {},
      this.env.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    if (!response.ok) return failure(response.category, "openweather");
    const hourly = objectValue(response.body)?.hourly;
    const entries = Array.isArray(hourly) ? hourly.map(objectValue) : [];
    const target = Date.parse(request.targetTime);
    const entry = entries.find(
      (item) =>
        numberValue(item?.dt) !== undefined &&
        Number(item!.dt) * 1000 >= target,
    );
    const weather = Array.isArray(entry?.weather)
      ? objectValue(entry.weather[0])
      : undefined;
    const code = numberValue(weather?.id);
    if (!entry || code === undefined)
      return failure("unsupported", "openweather");
    return available("openweather", {
      targetTime: new Date(Number(entry.dt) * 1000).toISOString(),
      weatherCode: code,
      temperatureCelsius: numberValue(entry.temp),
      precipitationMillimeters:
        numberValue(entry.rain) ?? numberValue(entry.snow),
      precipitationProbabilityPercent:
        numberValue(entry.pop) === undefined
          ? undefined
          : Number(entry.pop) * 100,
      windSpeedKph:
        numberValue(entry.wind_speed) === undefined
          ? undefined
          : Number(entry.wind_speed) * 3.6,
      windDirectionDegrees: numberValue(entry.wind_deg),
    });
  }
}

export class TomTomGeocodingProvider implements GeocodingProvider {
  private readonly env: ExternalContextEnv;
  private readonly http: ExternalContextHttpClient;
  constructor(
    env: ExternalContextEnv,
    http: ExternalContextHttpClient = fetch,
  ) {
    this.env = env;
    this.http = http;
  }
  async geocode(
    request: GeocodeRequest,
  ): Promise<ProviderResult<NormalizedGeocode>> {
    if (!configured(this.env.tomtomApiKey))
      return failure("not_configured", "tomtom");
    const url = new URL("https://api.tomtom.com/maps/orbis/places/geocode");
    url.searchParams.set("query", request.query);
    const response = await requestJson(
      this.http,
      url,
      {
        headers: {
          "TomTom-Api-Version": "2",
          "TomTom-Api-Key": this.env.tomtomApiKey!,
        },
      },
      this.env.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    if (!response.ok) return failure(response.category, "tomtom");
    const body = objectValue(response.body);
    const results = Array.isArray(body?.results) ? body.results : [];
    const first = objectValue(results[0]);
    const position = objectValue(first?.position);
    const address = objectValue(first?.address);
    const latitude = numberValue(position?.lat);
    const longitude = numberValue(position?.lon);
    const label =
      typeof address?.freeformAddress === "string"
        ? address.freeformAddress
        : typeof first?.name === "string"
          ? first.name
          : undefined;
    return latitude === undefined || longitude === undefined || !label
      ? failure("coverage", "tomtom")
      : available("tomtom", { latitude, longitude, label });
  }
}

export class HereGeocodingProvider implements GeocodingProvider {
  private readonly env: ExternalContextEnv;
  private readonly http: ExternalContextHttpClient;
  constructor(
    env: ExternalContextEnv,
    http: ExternalContextHttpClient = fetch,
  ) {
    this.env = env;
    this.http = http;
  }
  async geocode(
    request: GeocodeRequest,
  ): Promise<ProviderResult<NormalizedGeocode>> {
    if (!configured(this.env.hereApiKey))
      return failure("not_configured", "here");
    const url = new URL("https://geocode.search.hereapi.com/v1/geocode");
    url.search = new URLSearchParams({
      q: request.query,
      apiKey: this.env.hereApiKey!,
    }).toString();
    const response = await requestJson(
      this.http,
      url,
      {},
      this.env.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    if (!response.ok) return failure(response.category, "here");
    const body = objectValue(response.body);
    const items = Array.isArray(body?.items) ? body.items : [];
    const first = objectValue(items[0]);
    const position = objectValue(first?.position);
    const address = objectValue(first?.address);
    const latitude = numberValue(position?.lat);
    const longitude = numberValue(position?.lng);
    const label =
      typeof address?.label === "string" ? address.label : undefined;
    return latitude === undefined || longitude === undefined || !label
      ? failure("coverage", "here")
      : available("here", { latitude, longitude, label });
  }
}

export class TomTomRoutingProvider implements RoutingProvider {
  private readonly env: ExternalContextEnv;
  private readonly http: ExternalContextHttpClient;
  constructor(
    env: ExternalContextEnv,
    http: ExternalContextHttpClient = fetch,
  ) {
    this.env = env;
    this.http = http;
  }
  async getRoute(
    request: RouteRequest,
  ): Promise<ProviderResult<NormalizedRoute>> {
    if (!configured(this.env.tomtomApiKey))
      return failure("not_configured", "tomtom");
    const url = new URL(
      "https://api.tomtom.com/maps/orbis/routing/calculateRoute/" +
        `${request.origin.latitude},${request.origin.longitude}:${request.destination.latitude},${request.destination.longitude}/json`,
    );
    url.searchParams.set("apiVersion", "2");
    url.searchParams.set("traffic", request.trafficAware ? "true" : "false");
    const response = await requestJson(
      this.http,
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TomTom-Api-Version": "2",
          "TomTom-Api-Key": this.env.tomtomApiKey!,
        },
        body: "{}",
      },
      this.env.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    if (!response.ok) return failure(response.category, "tomtom");
    const body = objectValue(response.body);
    const routes = Array.isArray(body?.routes) ? body.routes : [];
    const first = objectValue(routes[0]);
    const summary = objectValue(first?.summary);
    const distanceMeters = numberValue(summary?.lengthInMeters);
    const durationSeconds = numberValue(summary?.travelTimeInSeconds);
    return distanceMeters === undefined || durationSeconds === undefined
      ? failure("coverage", "tomtom")
      : available("tomtom", {
          distanceMeters,
          durationSeconds,
          trafficAware: request.trafficAware === true,
        });
  }
}

export class HereRoutingProvider implements RoutingProvider {
  private readonly env: ExternalContextEnv;
  private readonly http: ExternalContextHttpClient;
  constructor(
    env: ExternalContextEnv,
    http: ExternalContextHttpClient = fetch,
  ) {
    this.env = env;
    this.http = http;
  }
  async getRoute(
    request: RouteRequest,
  ): Promise<ProviderResult<NormalizedRoute>> {
    if (!configured(this.env.hereApiKey))
      return failure("not_configured", "here");
    const url = new URL("https://router.hereapi.com/v8/routes");
    url.search = new URLSearchParams({
      origin: `${request.origin.latitude},${request.origin.longitude}`,
      destination: `${request.destination.latitude},${request.destination.longitude}`,
      transportMode: "car",
      return: "summary",
      apiKey: this.env.hereApiKey!,
      ...(request.trafficAware ? {} : { departureTime: "any" }),
    }).toString();
    const response = await requestJson(
      this.http,
      url,
      {},
      this.env.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    if (!response.ok) return failure(response.category, "here");
    const body = objectValue(response.body);
    const routes = Array.isArray(body?.routes) ? body.routes : [];
    const route = objectValue(routes[0]);
    const sections = Array.isArray(route?.sections)
      ? route.sections.map(objectValue)
      : [];
    const summaries = sections.map((section) => objectValue(section?.summary));
    const distanceMeters = summaries.reduce<number | undefined>(
      (sum, item) =>
        sum === undefined || numberValue(item?.length) === undefined
          ? undefined
          : sum + Number(item!.length),
      0,
    );
    const durationSeconds = summaries.reduce<number | undefined>(
      (sum, item) =>
        sum === undefined || numberValue(item?.duration) === undefined
          ? undefined
          : sum + Number(item!.duration),
      0,
    );
    return distanceMeters === undefined ||
      durationSeconds === undefined ||
      sections.length === 0
      ? failure("coverage", "here")
      : available("here", {
          distanceMeters,
          durationSeconds,
          trafficAware: request.trafficAware === true,
        });
  }
}

function trafficIncidentFromTomTom(
  value: unknown,
): NormalizedTrafficIncident | undefined {
  const incident = objectValue(value);
  const properties = objectValue(incident?.properties);
  const geometry = objectValue(incident?.geometry);
  const point = Array.isArray(geometry?.coordinates)
    ? geometry.coordinates
    : undefined;
  const longitude = Array.isArray(point) ? numberValue(point[0]) : undefined;
  const latitude = Array.isArray(point) ? numberValue(point[1]) : undefined;
  if (!properties) return undefined;
  const category =
    typeof properties.iconCategory === "string"
      ? properties.iconCategory
      : undefined;
  return {
    providerIncidentId:
      typeof properties.id === "string" ? properties.id : undefined,
    category,
    isRoadClosed: category?.toLocaleLowerCase() === "roadclosed",
    severity:
      typeof properties.magnitudeOfDelay === "number"
        ? properties.magnitudeOfDelay
        : undefined,
    startTime:
      typeof properties.startTime === "string"
        ? properties.startTime
        : undefined,
    endTime:
      typeof properties.endTime === "string" ? properties.endTime : undefined,
    location:
      latitude === undefined || longitude === undefined
        ? undefined
        : { latitude, longitude },
  };
}

export class TomTomTrafficIncidentProvider implements TrafficIncidentProvider {
  private readonly env: ExternalContextEnv;
  private readonly http: ExternalContextHttpClient;
  constructor(
    env: ExternalContextEnv,
    http: ExternalContextHttpClient = fetch,
  ) {
    this.env = env;
    this.http = http;
  }
  async getIncidents(
    request: TrafficIncidentRequest,
  ): Promise<ProviderResult<NormalizedTrafficIncident[]>> {
    if (!configured(this.env.tomtomApiKey))
      return failure("not_configured", "tomtom");
    const radius = Math.min(
      Math.max(request.radiusMeters ?? 5_000, 100),
      50_000,
    );
    const delta = radius / 111_000;
    const url = new URL(
      "https://api.tomtom.com/traffic/services/5/incidentDetails",
    );
    url.search = new URLSearchParams({
      key: this.env.tomtomApiKey!,
      bbox: `${request.center.longitude - delta},${request.center.latitude - delta},${request.center.longitude + delta},${request.center.latitude + delta}`,
      fields:
        "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,startTime,endTime}}}",
      timeValidityFilter: "present",
    }).toString();
    const response = await requestJson(
      this.http,
      url,
      {},
      this.env.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    if (!response.ok) return failure(response.category, "tomtom");
    const incidents = objectValue(response.body)?.incidents;
    if (!Array.isArray(incidents))
      return failure("malformed_response", "tomtom");
    return available(
      "tomtom",
      incidents
        .map(trafficIncidentFromTomTom)
        .filter((item): item is NormalizedTrafficIncident => Boolean(item)),
    );
  }
}

export class HereTrafficIncidentProvider implements TrafficIncidentProvider {
  private readonly env: ExternalContextEnv;
  private readonly http: ExternalContextHttpClient;
  constructor(
    env: ExternalContextEnv,
    http: ExternalContextHttpClient = fetch,
  ) {
    this.env = env;
    this.http = http;
  }
  async getIncidents(
    request: TrafficIncidentRequest,
  ): Promise<ProviderResult<NormalizedTrafficIncident[]>> {
    if (!configured(this.env.hereApiKey))
      return failure("not_configured", "here");
    const radius = Math.min(
      Math.max(request.radiusMeters ?? 5_000, 100),
      50_000,
    );
    const url = new URL("https://data.traffic.hereapi.com/v7/incidents");
    url.search = new URLSearchParams({
      in: `circle:${request.center.latitude},${request.center.longitude};r=${radius}`,
      locationReferencing: "none",
      apiKey: this.env.hereApiKey!,
    }).toString();
    const response = await requestJson(
      this.http,
      url,
      {},
      this.env.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    if (!response.ok) return failure(response.category, "here");
    const results = objectValue(response.body)?.results;
    if (!Array.isArray(results)) return failure("malformed_response", "here");
    return available(
      "here",
      results.map((item) => {
        const incident = objectValue(item);
        const details = objectValue(incident?.details);
        const location = objectValue(incident?.location);
        const latitude = numberValue(location?.lat);
        const longitude = numberValue(location?.lng);
        return {
          providerIncidentId:
            typeof incident?.id === "string" ? incident.id : undefined,
          category:
            typeof details?.type === "string" ? details.type : undefined,
          severity:
            typeof details?.criticality === "string"
              ? details.criticality
              : undefined,
          isRoadClosed: details?.roadClosed === true,
          startTime:
            typeof details?.startTime === "string"
              ? details.startTime
              : undefined,
          endTime:
            typeof details?.endTime === "string" ? details.endTime : undefined,
          location:
            latitude === undefined || longitude === undefined
              ? undefined
              : { latitude, longitude },
        };
      }),
    );
  }
}

export async function withFallback<T>(
  primary: () => Promise<ProviderResult<T>>,
  fallback: () => Promise<ProviderResult<T>>,
): Promise<ProviderResult<T>> {
  const primaryResult = await primary();
  if (usable(primaryResult) || !fallbackEligible(primaryResult))
    return primaryResult;
  const fallbackResult = await fallback();
  return { ...fallbackResult, fallbackUsed: true };
}

export class DerivedContextCache {
  private readonly entries = new Map<
    string,
    { expiresAt: number; value: ProviderResult<unknown> }
  >();
  async getOrLoad<T>(
    key: string,
    ttlMs: number,
    load: () => Promise<ProviderResult<T>>,
  ): Promise<ProviderResult<T>> {
    const entry = this.entries.get(key);
    if (entry && entry.expiresAt > Date.now())
      return { ...(entry.value as ProviderResult<T>), cacheHit: true };
    this.entries.delete(key);
    const value = await load();
    if (usable(value))
      this.entries.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  }
  clear(): void {
    this.entries.clear();
  }
}

const sharedCache = new DerivedContextCache();
const TTL = {
  weather: 10 * 60_000,
  geocode: 30 * 24 * 60 * 60_000,
  route: 24 * 60 * 60_000,
  trafficRoute: 5 * 60_000,
  incidents: 3 * 60_000,
};
const stable = (value: unknown) => JSON.stringify(value);

export type ExternalContextProviders = {
  weather: WeatherProvider;
  weatherFallback: WeatherProvider;
  geocoding: GeocodingProvider;
  geocodingFallback: GeocodingProvider;
  routing: RoutingProvider;
  routingFallback: RoutingProvider;
  traffic: TrafficIncidentProvider;
  trafficFallback: TrafficIncidentProvider;
};

export function createExternalContextProviders(
  env = getExternalContextEnv(),
  http: ExternalContextHttpClient = fetch,
): ExternalContextProviders {
  const timeout = env.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return {
    weather: new OpenMeteoWeatherProvider(http, timeout),
    weatherFallback: new OpenWeatherWeatherProvider(env, http),
    geocoding: new TomTomGeocodingProvider(env, http),
    geocodingFallback: new HereGeocodingProvider(env, http),
    routing: new TomTomRoutingProvider(env, http),
    routingFallback: new HereRoutingProvider(env, http),
    traffic: new TomTomTrafficIncidentProvider(env, http),
    trafficFallback: new HereTrafficIncidentProvider(env, http),
  };
}

export class ExternalContextService {
  private readonly providers: ExternalContextProviders;
  private readonly cache: DerivedContextCache;
  constructor(
    providers = createExternalContextProviders(),
    cache = sharedCache,
  ) {
    this.providers = providers;
    this.cache = cache;
  }
  weather(request: WeatherRequest) {
    return this.cache.getOrLoad(
      `weather:v1:${stable(request)}`,
      TTL.weather,
      () =>
        withFallback(
          () => this.providers.weather.getWeather(request),
          () => this.providers.weatherFallback.getWeather(request),
        ),
    );
  }
  geocode(request: GeocodeRequest) {
    return this.cache.getOrLoad(
      `geocode:v1:${request.query.trim().toLocaleLowerCase()}`,
      TTL.geocode,
      () =>
        withFallback(
          () => this.providers.geocoding.geocode(request),
          () => this.providers.geocodingFallback.geocode(request),
        ),
    );
  }
  route(request: RouteRequest) {
    const ttl = request.trafficAware ? TTL.trafficRoute : TTL.route;
    return this.cache.getOrLoad(`route:v1:${stable(request)}`, ttl, () =>
      withFallback(
        () => this.providers.routing.getRoute(request),
        () => this.providers.routingFallback.getRoute(request),
      ),
    );
  }
  incidents(request: TrafficIncidentRequest) {
    return this.cache.getOrLoad(
      `traffic:v1:${stable(request)}`,
      TTL.incidents,
      () =>
        withFallback(
          () => this.providers.traffic.getIncidents(request),
          () => this.providers.trafficFallback.getIncidents(request),
        ),
    );
  }
}

export type FuelEstimate = {
  estimatedLiters: number;
  label: "reference estimate";
};
export function estimateReferenceFuelLiters(
  routeDistanceKm: unknown,
  referenceEfficiencyKmPerLiter: unknown,
): FuelEstimate | undefined {
  const distance = numberValue(routeDistanceKm);
  const efficiency = numberValue(referenceEfficiencyKmPerLiter);
  if (
    distance === undefined ||
    distance < 0 ||
    efficiency === undefined ||
    efficiency <= 0
  )
    return undefined;
  return {
    estimatedLiters: distance / efficiency,
    label: "reference estimate",
  };
}

export type TripContextRequest = {
  destination: string;
  pickupBranchId: string;
  targetTime: string;
  vehicleId?: string;
  trafficAwareRoute?: boolean;
};
export type TripContext = {
  destinationGeocode: ProviderResult<NormalizedGeocode>;
  originGeocode: ProviderResult<NormalizedGeocode>;
  route: ProviderResult<NormalizedRoute>;
  weather: ProviderResult<NormalizedWeather>;
  trafficIncidents: ProviderResult<NormalizedTrafficIncident[]>;
  fuelEstimate?: FuelEstimate;
};

function unavailable<T>(
  category: ExternalContextFailureCategory = "unsupported",
): ProviderResult<T> {
  return failure(category);
}

export async function getTrustedTripContext(
  request: TripContextRequest,
  service = new ExternalContextService(),
): Promise<TripContext> {
  const destinationGeocode = await service.geocode({
    query: request.destination,
  });
  const { getSupabaseServerClient } = await import("./supabase/server.ts");
  let client: ReturnType<typeof getSupabaseServerClient> | undefined;
  let originGeocode: ProviderResult<NormalizedGeocode> =
    unavailable("coverage");
  try {
    client = getSupabaseServerClient();
    const branch = await client
      .from("branches")
      .select("address")
      .eq("id", request.pickupBranchId)
      .eq("is_active", true)
      .maybeSingle();
    if (!branch.error && branch.data?.address) {
      originGeocode = await service.geocode({ query: branch.data.address });
    }
  } catch {
    // A canonical-origin read failure must not discard independent context.
  }
  const destination = usable(destinationGeocode)
    ? destinationGeocode.data
    : undefined;
  const origin = usable(originGeocode) ? originGeocode.data : undefined;
  const [route, weather, trafficIncidents] = await Promise.all([
    origin && destination
      ? service.route({
          origin,
          destination,
          trafficAware: request.trafficAwareRoute === true,
        })
      : Promise.resolve(unavailable<NormalizedRoute>()),
    destination
      ? service.weather({ ...destination, targetTime: request.targetTime })
      : Promise.resolve(unavailable<NormalizedWeather>()),
    destination
      ? service.incidents({ center: destination })
      : Promise.resolve(unavailable<NormalizedTrafficIncident[]>()),
  ]);
  let fuelEstimate: FuelEstimate | undefined;
  if (request.vehicleId && usable(route) && client) {
    try {
      const vehicle = await client
        .from("vehicles")
        .select("reference_fuel_efficiency_km_per_liter")
        .eq("id", request.vehicleId)
        .maybeSingle();
      fuelEstimate = estimateReferenceFuelLiters(
        route.data.distanceMeters / 1000,
        vehicle.data?.reference_fuel_efficiency_km_per_liter,
      );
    } catch {
      // Fuel is optional reference context; route context remains valid.
    }
  }
  return {
    destinationGeocode,
    originGeocode,
    route,
    weather,
    trafficIncidents,
    fuelEstimate,
  };
}
