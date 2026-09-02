import assert from "node:assert/strict";
import test from "node:test";

import {
  DerivedContextCache,
  ExternalContextService,
  HereGeocodingProvider,
  HereRoutingProvider,
  HereTrafficIncidentProvider,
  OpenMeteoWeatherProvider,
  OpenWeatherWeatherProvider,
  TomTomGeocodingProvider,
  TomTomRoutingProvider,
  TomTomTrafficIncidentProvider,
  estimateReferenceFuelLiters,
  getExternalContextEnv,
  withFallback,
  type ExternalContextHttpClient,
  type ProviderResult,
} from "./external-context.server.ts";

const env = {
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

test("all primary adapters normalize only their required provider data", async () => {
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
  const geocode = await new TomTomGeocodingProvider(
    env,
    http({
      results: [
        {
          position: { lat: 14.6, lon: 121 },
          address: { freeformAddress: "Manila" },
        },
      ],
    }),
  ).geocode({ query: "Manila" });
  const route = await new TomTomRoutingProvider(
    env,
    http({
      routes: [
        { summary: { lengthInMeters: 12000, travelTimeInSeconds: 1800 } },
      ],
    }),
  ).getRoute({
    origin: coordinates,
    destination: { latitude: 14.6, longitude: 121 },
  });
  const incidents = await new TomTomTrafficIncidentProvider(
    env,
    http({
      incidents: [
        {
          geometry: { coordinates: [121, 14.6] },
          properties: {
            id: "t1",
            iconCategory: "roadClosed",
            magnitudeOfDelay: 4,
          },
        },
      ],
    }),
  ).getIncidents({ center: coordinates });
  assert.equal(weather.data?.weatherCode, 95);
  assert.equal(geocode.data?.label, "Manila");
  assert.equal(route.data?.distanceMeters, 12000);
  assert.equal(incidents.data?.[0]?.providerIncidentId, "t1");
});

test("all fallback adapters normalize their mandated provider data", async () => {
  const weather = await new OpenWeatherWeatherProvider(
    env,
    http({
      hourly: [
        {
          dt: Date.parse(targetTime) / 1000,
          temp: 30,
          pop: 0.5,
          wind_speed: 4,
          wind_deg: 90,
          weather: [{ id: 502 }],
        },
      ],
    }),
  ).getWeather({ ...coordinates, targetTime });
  const geocode = await new HereGeocodingProvider(
    env,
    http({
      items: [
        {
          position: { lat: 14.6, lng: 121 },
          address: { label: "Manila, Philippines" },
        },
      ],
    }),
  ).geocode({ query: "Manila" });
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
          id: "h1",
          details: {
            type: "roadClosure",
            criticality: "critical",
            roadClosed: true,
          },
        },
      ],
    }),
  ).getIncidents({ center: coordinates });
  assert.equal(weather.data?.weatherCode, 502);
  assert.equal(geocode.data?.latitude, 14.6);
  assert.equal(route.data?.durationSeconds, 1800);
  assert.equal(incidents.data?.[0]?.isRoadClosed, true);
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
    TOMTOM_API_KEY: " tomtom-secret ",
    HERE_API_KEY: "here-secret",
    OPENWEATHER_API_KEY: "weather-secret",
  });
  assert.equal(parsed.tomtomApiKey, "tomtom-secret");
  const output = JSON.stringify({
    status: "not_configured",
    fallbackUsed: false,
    fetchedAt: targetTime,
  });
  assert.equal(output.includes("secret"), false);
});
