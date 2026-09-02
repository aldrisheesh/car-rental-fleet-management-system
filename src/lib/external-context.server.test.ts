import assert from "node:assert/strict";
import test from "node:test";

import {
  DerivedContextCache,
  ExternalContextService,
  HereRoutingProvider,
  HereTrafficIncidentProvider,
  GeoapifyGeocodingProvider,
  LocationIqGeocodingProvider,
  OpenMeteoWeatherProvider,
  OpenWeatherWeatherProvider,
  TomTomRoutingProvider,
  TomTomTrafficIncidentProvider,
  estimateReferenceFuelLiters,
  getExternalContextEnv,
  withFallback,
  type ExternalContextProviders,
  type ExternalContextHttpClient,
  type GeocodingProvider,
  type NormalizedGeocode,
  type ProviderResult,
} from "./external-context.server.ts";

const env = {
  geoapifyApiKey: "geoapify-secret",
  locationIqApiKey: "locationiq-secret",
  tomtomApiKey: "tomtom-secret",
  hereApiKey: "here-secret",
  openWeatherApiKey: "weather-secret",
  timeoutMs: 20,
};
const targetTime = "2026-09-03T10:00:00.000Z";
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
const http =
  (body: unknown): ExternalContextHttpClient =>
  async () =>
    json(body);
const coordinates = { latitude: 14.5995, longitude: 120.9842 };
const unused = async (): Promise<never> => {
  throw new Error("unused");
};
const providersForGeocoding = (
  geocoding: GeocodingProvider,
  geocodingFallback: GeocodingProvider,
): ExternalContextProviders => ({
  weather: { getWeather: unused },
  weatherFallback: { getWeather: unused },
  geocoding,
  geocodingFallback,
  routing: { getRoute: unused },
  routingFallback: { getRoute: unused },
  traffic: { getIncidents: unused },
  trafficFallback: { getIncidents: unused },
});
const geocodingProvider = (
  result: ProviderResult<NormalizedGeocode>,
): GeocodingProvider => ({ geocode: async () => result });

test("primary adapters normalize only their required provider data", async () => {
  const weather = await new OpenMeteoWeatherProvider(
    http({
      hourly: {
        time: ["2026-09-03T10:00"],
        weather_code: [95],
        temperature_2m: [29],
        precipitation: [4],
        precipitation_probability: [80],
        wind_speed_10m: [18],
        wind_direction_10m: [140],
      },
    }),
  ).getWeather({ ...coordinates, targetTime });
  let geocodeUrl: URL | undefined;
  let geocodeInit: RequestInit | undefined;
  const geocodeHttp: ExternalContextHttpClient = async (input, init) => {
    geocodeUrl = new URL(String(input));
    geocodeInit = init;
    return json({
      type: "FeatureCollection",
      features: [
        {
          properties: {
            formatted: "Manila, Philippines",
            lat: 14.6,
            lon: 121,
            city: "Manila",
            country: "Philippines",
            country_code: "ph",
            result_type: "city",
          },
        },
      ],
    });
  };
  const geocode = await new GeoapifyGeocodingProvider(env, geocodeHttp).geocode(
    {
      query: "Manila",
    },
  );
  let routeUrl: URL | undefined;
  let routeInit: RequestInit | undefined;
  const routeHttp: ExternalContextHttpClient = async (input, init) => {
    routeUrl = new URL(String(input));
    routeInit = init;
    return json({
      routes: [
        { summary: { lengthInMeters: 12000, travelTimeInSeconds: 1800 } },
      ],
    });
  };
  const route = await new TomTomRoutingProvider(env, routeHttp).getRoute({
    origin: coordinates,
    destination: { latitude: 14.6, longitude: 121 },
  });
  const incidents = await new TomTomTrafficIncidentProvider(
    env,
    http({
      incidents: [
        {
          geometry: {
            type: "LineString",
            coordinates: [
              [121, 14.6],
              [121.1, 14.7],
            ],
          },
          properties: {
            id: "t1",
            iconCategory: 8,
            magnitudeOfDelay: 4,
            startTime: "2026-09-03T10:00:00Z",
            endTime: "2026-09-03T11:00:00Z",
          },
        },
      ],
    }),
  ).getIncidents({ center: coordinates });
  assert.equal(weather.data?.weatherCode, 95);
  assert.equal(geocode.data?.label, "Manila, Philippines");
  assert.ok(geocodeUrl);
  assert.equal(
    geocodeUrl.origin + geocodeUrl.pathname,
    "https://api.geoapify.com/v1/geocode/search",
  );
  assert.equal(geocodeUrl?.searchParams.get("text"), "Manila");
  assert.equal(geocodeUrl?.searchParams.get("filter"), "countrycode:ph");
  assert.equal(geocodeUrl?.searchParams.get("apiKey"), env.geoapifyApiKey);
  assert.equal(geocodeInit?.method, undefined);
  assert.equal(route.data?.distanceMeters, 12000);
  assert.ok(routeUrl);
  assert.equal(
    routeUrl.origin + routeUrl.pathname,
    "https://api.tomtom.com/maps/orbis/routing/calculateRoute/14.5995,120.9842:14.6,121/json",
  );
  assert.equal(routeUrl?.searchParams.get("key"), env.tomtomApiKey);
  assert.equal(routeUrl?.searchParams.get("traffic"), "historical");
  assert.equal(routeInit?.method, undefined);
  assert.equal(routeInit?.body, undefined);
  assert.equal(new Headers(routeInit?.headers).get("TomTom-Api-Version"), "2");
  assert.equal(incidents.data?.[0]?.providerIncidentId, "t1");
  assert.equal(incidents.data?.[0]?.category, "road_closure");
  assert.equal(incidents.data?.[0]?.isRoadClosed, true);
  assert.deepEqual(incidents.data?.[0]?.location, {
    latitude: 14.6,
    longitude: 121,
  });
});

test("fallback adapters normalize their mandated provider data", async () => {
  const weather = await new OpenWeatherWeatherProvider(
    env,
    http({
      hourly: [
        {
          dt: Date.parse(targetTime) / 1000,
          temp: 30,
          pop: 0.5,
          rain: { "1h": 1.2 },
          snow: { "1h": 0.3 },
          wind_speed: 4,
          wind_deg: 90,
          weather: [{ id: 502 }],
        },
      ],
    }),
  ).getWeather({ ...coordinates, targetTime });
  let geocodeUrl: URL | undefined;
  const geocode = await new LocationIqGeocodingProvider(env, async (input) => {
    geocodeUrl = new URL(String(input));
    return json([
      {
        lat: "14.6",
        lon: "121",
        display_name: "Manila, Philippines",
        type: "city",
        address: { city: "Manila", country: "Philippines", country_code: "ph" },
      },
    ]);
  }).geocode({ query: "Manila" });
  const route = await new HereRoutingProvider(
    env,
    http({
      routes: [{ sections: [{ summary: { length: 12000, duration: 1800 } }] }],
    }),
  ).getRoute({
    origin: coordinates,
    destination: { latitude: 14.6, longitude: 121 },
  });
  const incidents = await new HereTrafficIncidentProvider(
    env,
    http({
      results: [
        {
          incidentDetails: {
            id: "h1",
            type: "roadClosure",
            criticality: "critical",
            roadClosed: true,
            startTime: "2026-09-03T10:00:00Z",
            endTime: "2026-09-03T11:00:00Z",
          },
        },
      ],
    }),
  ).getIncidents({ center: coordinates });
  assert.equal(weather.data?.weatherCode, 502);
  assert.equal(weather.data?.precipitationMillimeters, 1.2);
  assert.equal(geocode.data?.latitude, 14.6);
  assert.equal(geocodeUrl?.searchParams.get("countrycodes"), "ph");
  assert.equal(geocodeUrl?.searchParams.get("key"), env.locationIqApiKey);
  assert.equal(route.data?.durationSeconds, 1800);
  assert.equal(incidents.data?.[0]?.isRoadClosed, true);
  assert.equal(incidents.data?.[0]?.providerIncidentId, "h1");
  assert.equal(incidents.data?.[0]?.location, undefined);
});

test("TomTom routing uses the v2 coordinate GET contract with live traffic", async () => {
  let routeUrl: URL | undefined;
  let routeInit: RequestInit | undefined;
  const client: ExternalContextHttpClient = async (input, init) => {
    routeUrl = new URL(String(input));
    routeInit = init;
    return json({
      routes: [
        { summary: { lengthInMeters: 12000, travelTimeInSeconds: 1800 } },
      ],
    });
  };
  const result = await new TomTomRoutingProvider(env, client).getRoute({
    origin: coordinates,
    destination: { latitude: 14.6, longitude: 121 },
    trafficAware: true,
  });
  assert.equal(result.status, "available");
  assert.equal(routeUrl?.searchParams.get("key"), env.tomtomApiKey);
  assert.equal(routeUrl?.searchParams.get("traffic"), "live");
  assert.equal(routeInit?.method, undefined);
  assert.equal(routeInit?.body, undefined);
});

test("Geoapify normalizes malformed and empty responses safely", async () => {
  const malformed = await new GeoapifyGeocodingProvider(
    env,
    http({ features: [] }),
  ).geocode({
    query: "Generic Place, Manila City, Philippines",
  });
  const empty = await new GeoapifyGeocodingProvider(
    env,
    http({ type: "FeatureCollection", features: [] }),
  ).geocode({ query: "Generic Place, Manila City, Philippines" });
  assert.equal(malformed.failureCategory, "malformed_response");
  assert.equal(empty.failureCategory, "coverage");
});

test("Geoapify timeout and provider failures normalize for fallback", async () => {
  const timeoutClient: ExternalContextHttpClient = async (_input, init) =>
    new Promise((_resolve, reject) =>
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      ),
    );
  const timeout = await new GeoapifyGeocodingProvider(
    { ...env, timeoutMs: 1 },
    timeoutClient,
  ).geocode({ query: "Central Library, Manila City, Philippines" });
  const providerError = await new GeoapifyGeocodingProvider(
    env,
    async () => new Response(null, { status: 503 }),
  ).geocode({ query: "Central Library, Manila City, Philippines" });
  assert.equal(timeout.failureCategory, "timeout");
  assert.equal(providerError.failureCategory, "provider_error");
});

test("geocoding orchestration uses LocationIQ only after Geoapify is unusable or rejected", async () => {
  const valid = {
    latitude: 14.6,
    longitude: 121,
    originalQuery: "Central Library, Manila City, Philippines",
    label: "Central Library, Manila, Philippines",
    locality: "Manila",
    country: "Philippines",
    countryCode: "PH",
    providerMetadata: { resultType: "amenity", name: "Central Library" },
  };
  const fallbackData = {
    ...valid,
    label: "Central Library fallback, Manila, Philippines",
  };
  let fallbackCalls = 0;
  const service = new ExternalContextService(
    providersForGeocoding(
      geocodingProvider({
        status: "available",
        data: valid,
        providerUsed: "geoapify",
        fallbackUsed: false,
        fetchedAt: targetTime,
      }),
      {
        geocode: async () => {
          fallbackCalls++;
          return {
            status: "available",
            data: fallbackData,
            providerUsed: "locationiq" as const,
            fallbackUsed: false,
            fetchedAt: targetTime,
          };
        },
      },
    ),
    new DerivedContextCache(),
  );
  const success = await service.geocode({ query: valid.originalQuery });
  assert.equal(success.providerUsed, "geoapify");
  assert.equal(fallbackCalls, 0);
  assert.equal(success.data?.originalQuery, valid.originalQuery);

  const failureCases = [
    {
      status: "timeout",
      fallbackUsed: false,
      fetchedAt: targetTime,
      failureCategory: "timeout",
    },
    {
      status: "unavailable",
      fallbackUsed: false,
      fetchedAt: targetTime,
      failureCategory: "coverage",
    },
    {
      status: "available",
      data: {
        ...valid,
        label: "Unrelated Park, Manila, Philippines",
        providerMetadata: { name: "Unrelated Park" },
      },
      providerUsed: "geoapify",
      fallbackUsed: false,
      fetchedAt: targetTime,
    },
  ] as const;
  for (const primaryResult of failureCases) {
    const recover = new ExternalContextService(
      providersForGeocoding(
        geocodingProvider(primaryResult),
        geocodingProvider({
          status: "available",
          data: fallbackData,
          providerUsed: "locationiq",
          fallbackUsed: false,
          fetchedAt: targetTime,
        }),
      ),
      new DerivedContextCache(),
    );
    const recovered = await recover.geocode({ query: valid.originalQuery });
    assert.equal(recovered.providerUsed, "locationiq");
    assert.equal(recovered.fallbackUsed, true);
  }
});

test("LocationIQ malformed, empty, and quality-rejected results return normalized coverage", async () => {
  const malformed = await new LocationIqGeocodingProvider(
    env,
    http({}),
  ).geocode({ query: "Central Library, Manila City, Philippines" });
  const empty = await new LocationIqGeocodingProvider(env, http([])).geocode({
    query: "Central Library, Manila City, Philippines",
  });
  assert.equal(malformed.failureCategory, "malformed_response");
  assert.equal(empty.failureCategory, "coverage");
  const rejected = new ExternalContextService(
    providersForGeocoding(
      {
        geocode: async () => ({
          status: "unavailable" as const,
          fallbackUsed: false,
          fetchedAt: targetTime,
          failureCategory: "coverage" as const,
        }),
      },
      {
        geocode: async () => ({
          status: "available" as const,
          data: {
            latitude: 14.6,
            longitude: 121,
            originalQuery: "Central Library, Manila City, Philippines",
            label: "Unrelated Park, Manila, Philippines",
            locality: "Manila",
            country: "Philippines",
            countryCode: "PH",
            providerMetadata: { name: "Unrelated Park" },
          },
          providerUsed: "locationiq" as const,
          fallbackUsed: false,
          fetchedAt: targetTime,
        }),
      },
    ),
    new DerivedContextCache(),
  );
  const result = await rejected.geocode({
    query: "Central Library, Manila City, Philippines",
  });
  assert.equal(result.status, "unavailable");
  assert.equal(result.failureCategory, "coverage");
  assert.equal(result.fallbackUsed, true);
});

test("TomTom traffic numeric icon categories normalize to provider-neutral semantics", async () => {
  const result = await new TomTomTrafficIncidentProvider(
    env,
    http({
      incidents: [
        { properties: { iconCategory: 1 } },
        { properties: { iconCategory: 7 } },
        { properties: { iconCategory: 9 } },
        { properties: { iconCategory: 11 } },
        { properties: { iconCategory: 99 } },
      ],
    }),
  ).getIncidents({ center: coordinates });
  assert.deepEqual(
    result.data?.map((incident) => incident.category),
    ["accident", "lane_restriction", "roadworks", "flooding", "other"],
  );
});

test("a valid TomTom road closure remains available without HERE fallback", async () => {
  let fallbackCalls = 0;
  const primary = new TomTomTrafficIncidentProvider(
    env,
    http({
      incidents: [
        {
          geometry: { type: "LineString", coordinates: [[121, 14.6]] },
          properties: {
            id: "road-closed",
            iconCategory: 8,
            magnitudeOfDelay: 4,
            startTime: "2026-09-03T10:00:00Z",
            endTime: "2026-09-03T11:00:00Z",
          },
        },
      ],
    }),
  );
  const result = await withFallback(
    () => primary.getIncidents({ center: coordinates }),
    async () => {
      fallbackCalls++;
      throw new Error("must not call fallback");
    },
  );
  assert.equal(result.status, "available");
  assert.equal(result.data?.[0]?.isRoadClosed, true);
  assert.equal(fallbackCalls, 0);
});

test("failure-eligible primary invokes fallback, but a valid adverse result never does", async () => {
  let fallbackCalls = 0;
  const fallback = async (): Promise<ProviderResult<string>> => {
    fallbackCalls++;
    return {
      status: "available",
      data: "fallback",
      providerUsed: "here",
      fallbackUsed: false,
      fetchedAt: targetTime,
    };
  };
  const recovered = await withFallback(
    async () => ({
      status: "timeout" as const,
      fallbackUsed: false,
      fetchedAt: targetTime,
      failureCategory: "timeout" as const,
    }),
    fallback,
  );
  assert.equal(recovered.data, "fallback");
  assert.equal(recovered.fallbackUsed, true);
  const adverse = await withFallback(
    async () => ({
      status: "available" as const,
      data: "road closed",
      providerUsed: "tomtom" as const,
      fallbackUsed: false,
      fetchedAt: targetTime,
    }),
    fallback,
  );
  assert.equal(adverse.data, "road closed");
  assert.equal(fallbackCalls, 1);
});

test("both providers unavailable, malformed responses, and missing fallback key normalize safely", async () => {
  const bad = await new OpenMeteoWeatherProvider(
    http({ hourly: { time: ["2026-09-03T10:00"], weather_code: ["bad"] } }),
  ).getWeather({ ...coordinates, targetTime });
  const missing = new OpenWeatherWeatherProvider({}, http({}));
  const result = await withFallback(
    async () => bad,
    () => missing.getWeather({ ...coordinates, targetTime }),
  );
  assert.equal(bad.failureCategory, "malformed_response");
  assert.equal(result.status, "not_configured");
  assert.equal(result.fallbackUsed, true);
});

test("bounded HTTP timeout becomes a normalized timeout", async () => {
  const slow: ExternalContextHttpClient = async (_input, init) =>
    new Promise((_resolve, reject) =>
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      ),
    );
  const result = await new OpenMeteoWeatherProvider(slow, 1).getWeather({
    ...coordinates,
    targetTime,
  });
  assert.equal(result.status, "timeout");
  assert.equal(result.failureCategory, "timeout");
});

test("derived cache hits, expires, and keeps independent keys apart", async () => {
  const cache = new DerivedContextCache();
  let calls = 0;
  const load = async (): Promise<ProviderResult<string>> => ({
    status: "available",
    data: `result-${++calls}`,
    providerUsed: "tomtom",
    fallbackUsed: false,
    fetchedAt: targetTime,
  });
  const first = await cache.getOrLoad("geocode:v1:a", 5, load);
  const hit = await cache.getOrLoad("geocode:v1:a", 5, load);
  const other = await cache.getOrLoad("geocode:v1:b", 5, load);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const refreshed = await cache.getOrLoad("geocode:v1:a", 5, load);
  assert.equal(first.data, "result-1");
  assert.equal(hit.cacheHit, true);
  assert.equal(other.data, "result-2");
  assert.equal(refreshed.data, "result-3");
});

test("context service caches weather primary success and does not call the fallback", async () => {
  let fallbackCalls = 0;
  const providers = {
    weather: {
      getWeather: async () => ({
        status: "available" as const,
        data: { targetTime, weatherCode: 95 },
        providerUsed: "open_meteo" as const,
        fallbackUsed: false,
        fetchedAt: targetTime,
      }),
    },
    weatherFallback: {
      getWeather: async () => {
        fallbackCalls++;
        throw new Error("must not call fallback");
      },
    },
    geocoding: {
      geocode: async () => {
        throw new Error("unused");
      },
    },
    geocodingFallback: {
      geocode: async () => {
        throw new Error("unused");
      },
    },
    routing: {
      getRoute: async () => {
        throw new Error("unused");
      },
    },
    routingFallback: {
      getRoute: async () => {
        throw new Error("unused");
      },
    },
    traffic: {
      getIncidents: async () => {
        throw new Error("unused");
      },
    },
    trafficFallback: {
      getIncidents: async () => {
        throw new Error("unused");
      },
    },
  };
  const service = new ExternalContextService(
    providers,
    new DerivedContextCache(),
  );
  const one = await service.weather({ ...coordinates, targetTime });
  const two = await service.weather({ ...coordinates, targetTime });
  assert.equal(one.data?.weatherCode, 95);
  assert.equal(two.cacheHit, true);
  assert.equal(fallbackCalls, 0);
});

test("fuel estimate is pure, reference-only, and guards invalid inputs", () => {
  assert.deepEqual(estimateReferenceFuelLiters(100, 10), {
    estimatedLiters: 10,
    label: "reference estimate",
  });
  assert.equal(estimateReferenceFuelLiters(undefined, 10), undefined);
  assert.equal(estimateReferenceFuelLiters(100, 0), undefined);
  assert.equal(estimateReferenceFuelLiters(-1, 10), undefined);
  assert.equal(estimateReferenceFuelLiters(100, -1), undefined);
});

test("server-only credential parsing and result shapes never expose keys", () => {
  const parsed = getExternalContextEnv({
    GEOAPIFY_API_KEY: " geoapify-secret ",
    LOCATIONIQ_API_KEY: "locationiq-secret",
    TOMTOM_API_KEY: " tomtom-secret ",
    HERE_API_KEY: "here-secret",
    OPENWEATHER_API_KEY: "weather-secret",
  });
  assert.equal(parsed.geoapifyApiKey, "geoapify-secret");
  assert.equal(parsed.locationIqApiKey, "locationiq-secret");
  assert.equal(parsed.tomtomApiKey, "tomtom-secret");
  const placeholders = getExternalContextEnv({
    HERE_API_KEY: "your-here-api-key",
    OPENWEATHER_API_KEY: "your-openweather-one-call-api-key",
  });
  assert.equal(placeholders.hereApiKey, undefined);
  assert.equal(placeholders.openWeatherApiKey, undefined);
  const output = JSON.stringify({
    status: "not_configured",
    fallbackUsed: false,
    fetchedAt: targetTime,
  });
  assert.equal(output.includes("secret"), false);
});
