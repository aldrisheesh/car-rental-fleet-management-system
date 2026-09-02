import assert from "node:assert/strict";
import test from "node:test";

import {
  interpretOperationalContext,
  type InterpretedOperationalContext,
} from "./operational-context.ts";
import type { ProviderResult, TripContext } from "./external-context.server.ts";

const fetchedAt = "2026-09-02T00:00:00.000Z";
const available = <T>(
  data: T,
  providerUsed?: ProviderResult<T>["providerUsed"],
): ProviderResult<T> => ({
  status: "available",
  data,
  providerUsed,
  fallbackUsed: false,
  fetchedAt,
});
const unavailable = <T>(): ProviderResult<T> => ({
  status: "unavailable",
  fallbackUsed: false,
  fetchedAt,
});

function context(overrides: Partial<TripContext> = {}): TripContext {
  return {
    destinationGeocode: available(
      { latitude: 14.6, longitude: 120.9, label: "Destination" },
      "tomtom",
    ),
    originGeocode: available(
      { latitude: 14.5, longitude: 121, label: "Origin" },
      "tomtom",
    ),
    route: available(
      { distanceMeters: 12_500, durationSeconds: 1_500, trafficAware: true },
      "tomtom",
    ),
    weather: available({ targetTime: fetchedAt, weatherCode: 0 }, "open_meteo"),
    trafficIncidents: available([], "tomtom"),
    fuelEstimate: { estimatedLiters: 5.5, label: "reference estimate" },
    ...overrides,
  };
}

function interpreted(
  overrides: Partial<TripContext> = {},
): InterpretedOperationalContext {
  return interpretOperationalContext(context(overrides));
}

test("maps representative WMO weather semantics deterministically", () => {
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 0 },
        "open_meteo",
      ),
    }).weather.classification,
    "Normal",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 3 },
        "open_meteo",
      ),
    }).weather.classification,
    "Normal",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 45 },
        "open_meteo",
      ),
    }).weather.classification,
    "Caution",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 51 },
        "open_meteo",
      ),
    }).weather.classification,
    "Caution",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 61 },
        "open_meteo",
      ),
    }).weather.classification,
    "Caution",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 95 },
        "open_meteo",
      ),
    }).weather.classification,
    "Caution",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 99 },
        "open_meteo",
      ),
    }).weather.classification,
    "Severe",
  );
});

test("maps representative OpenWeather weather semantics deterministically", () => {
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 800 },
        "openweather",
      ),
    }).weather.classification,
    "Normal",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 804 },
        "openweather",
      ),
    }).weather.classification,
    "Normal",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 741 },
        "openweather",
      ),
    }).weather.classification,
    "Caution",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 500 },
        "openweather",
      ),
    }).weather.classification,
    "Caution",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 300 },
        "openweather",
      ),
    }).weather.classification,
    "Caution",
  );
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 212 },
        "openweather",
      ),
    }).weather.classification,
    "Severe",
  );
});

test("treats unknown and unavailable weather conservatively", () => {
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 999 },
        "open_meteo",
      ),
    }).weather.classification,
    "Unavailable",
  );
  assert.equal(
    interpreted({ weather: unavailable() }).weather.classification,
    "Unavailable",
  );
});

test("classifies unavailable, empty, cautionary, and closed incident context with closure precedence", () => {
  assert.equal(
    interpreted({ trafficIncidents: unavailable() }).roadCondition
      .classification,
    "Unknown",
  );
  assert.equal(interpreted().roadCondition.classification, "Open");
  assert.equal(
    interpreted({
      trafficIncidents: available([{ category: "roadworks" }], "tomtom"),
    }).roadCondition.classification,
    "Caution",
  );
  assert.equal(
    interpreted({
      trafficIncidents: available([{ category: "accident" }], "tomtom"),
    }).roadCondition.classification,
    "Caution",
  );
  assert.equal(
    interpreted({
      trafficIncidents: available([{ isRoadClosed: true }], "tomtom"),
    }).roadCondition.classification,
    "Closed/Impassable",
  );
  assert.equal(
    interpreted({
      trafficIncidents: available(
        [{ category: "roadworks" }, { isRoadClosed: true }],
        "tomtom",
      ),
    }).roadCondition.classification,
    "Closed/Impassable",
  );
});

test("classifies route accessibility conservatively", () => {
  assert.equal(
    interpreted({ route: unavailable() }).routeAccessibility.classification,
    "Unknown",
  );
  assert.equal(
    interpreted({ trafficIncidents: unavailable() }).routeAccessibility
      .classification,
    "Unknown",
  );
  assert.equal(interpreted().routeAccessibility.classification, "Accessible");
  assert.equal(
    interpreted({
      trafficIncidents: available([{ category: "lane restriction" }], "tomtom"),
    }).routeAccessibility.classification,
    "Limited",
  );
  assert.equal(
    interpreted({
      trafficIncidents: available([{ isRoadClosed: true }], "tomtom"),
    }).routeAccessibility.classification,
    "Closed/Restricted",
  );
});

test("derives feasibility from route and interpreted context", () => {
  assert.equal(interpreted().routeFeasibility.classification, "Feasible");
  assert.equal(
    interpreted({
      weather: available(
        { targetTime: fetchedAt, weatherCode: 61 },
        "open_meteo",
      ),
    }).routeFeasibility.classification,
    "Feasible with Caution",
  );
  assert.equal(
    interpreted({
      trafficIncidents: available([{ category: "roadworks" }], "tomtom"),
    }).routeFeasibility.classification,
    "Feasible with Caution",
  );
  assert.equal(
    interpreted({
      trafficIncidents: available([{ isRoadClosed: true }], "tomtom"),
    }).routeFeasibility.classification,
    "Not Feasible",
  );
  assert.equal(
    interpreted({ route: unavailable() }).routeFeasibility.classification,
    "Unavailable",
  );
  assert.equal(
    interpreted({ trafficIncidents: unavailable() }).routeFeasibility
      .classification,
    "Unavailable",
  );
});

test("converts route units, propagates reference fuel, and exposes stable reasons", () => {
  const result = interpreted();
  assert.equal(result.distanceKm, 12.5);
  assert.equal(result.travelTimeMinutes, 25);
  assert.equal(result.estimatedFuelLiters, 5.5);
  assert.deepEqual(result.reasons, [
    "weather_clear",
    "road_open",
    "access_accessible",
    "route_available",
    "fuel_estimate_available",
  ]);
  assert.deepEqual(
    interpreted({
      trafficIncidents: available(
        [{ category: "unrecognized event" }],
        "tomtom",
      ),
    }).limitations,
    ["road_incident_unrecognized"],
  );
});

test("does not mutate normalized input", () => {
  const input = context({
    trafficIncidents: available([{ category: "roadworks" }], "tomtom"),
  });
  const before = structuredClone(input);
  interpretOperationalContext(input);
  assert.deepEqual(input, before);
});

test("is a pure interpretation and performs no fetch", () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (() => {
    fetchCalls++;
    throw new Error("interpretation must not fetch");
  }) as typeof fetch;
  try {
    interpretOperationalContext(context());
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(fetchCalls, 0);
});
