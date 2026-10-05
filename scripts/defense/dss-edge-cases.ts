/** Isolated synthetic examples. Never overwrite live provider results or demand coverage. */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { calculateWma } from "../../src/lib/forecasting.server.ts";
import { interpretOperationalContext } from "../../src/lib/operational-context.ts";
import type {
  TripContext,
  ProviderResult,
} from "../../src/lib/external-context.server.ts";
const time = "2026-10-05T00:00:00.000Z";
const available = <T>(data: T): ProviderResult<T> => ({
  status: "available",
  data,
  fallbackUsed: false,
  fetchedAt: time,
});
const missing = <T>(): ProviderResult<T> => ({
  status: "unavailable",
  fallbackUsed: false,
  fetchedAt: time,
});
const trip: TripContext = {
  originGeocode: available({
    originalQuery: "Synthetic origin",
    providerMetadata: {},
    latitude: 14.5,
    longitude: 121,
    label: "Synthetic origin",
  }),
  destinationGeocode: available({
    originalQuery: "Synthetic destination",
    providerMetadata: {},
    latitude: 14.6,
    longitude: 121.1,
    label: "Synthetic destination",
  }),
  route: available({
    distanceMeters: 32000,
    durationSeconds: 3600,
    trafficAware: true,
  }),
  weather: {
    ...available({ targetTime: time, weatherCode: 99 }),
    providerUsed: "open_meteo",
  },
  trafficIncidents: available([]),
  fuelEstimate: { estimatedLiters: 2, label: "SYNTHETIC REFERENCE ESTIMATE" },
};
const severe = interpretOperationalContext(trip);
const unavailable = interpretOperationalContext({
  ...trip,
  weather: missing(),
  route: missing(),
  trafficIncidents: missing(),
  fuelEstimate: undefined,
});
assert.equal(severe.weather.classification, "Severe");
assert.equal(severe.routeFeasibility.classification, "Feasible with Caution");
assert.equal(unavailable.weather.classification, "Unavailable");
assert.equal(unavailable.routeFeasibility.classification, "Unavailable");
const weeks = ["2026-09-14", "2026-09-21", "2026-09-28"].map(
  (weekStart, i) => ({
    weekStart,
    weekEnd: ["2026-09-21", "2026-09-28", "2026-10-05"][i],
    demand: [1, 2, 1][i],
  }),
);
const normal = calculateWma(weeks);
const zero = calculateWma(weeks.map((w) => ({ ...w, demand: 0 })));
const insufficient = calculateWma(weeks.slice(0, 2));
assert.equal(normal?.forecasts[0], 1.3);
assert.equal(zero?.forecasts[0], 0);
assert.equal(insufficient, null);
const directory = "output/defense-baseline-2026-10-05";
mkdirSync(directory, { recursive: true });
writeFileSync(
  `${directory}/isolated-edge-cases.json`,
  JSON.stringify(
    {
      provenance:
        "SYNTHETIC OFFLINE TEST EXAMPLES. Not live weather, client demand, provider responses, or predictive-accuracy evidence. These do not change the application database.",
      forecasting: {
        example: normal,
        zeroDemand: zero,
        insufficientHistory: {
          observations: 2,
          result: insufficient,
          expected: "No forecast because three complete weeks are required",
        },
      },
      externalContext: {
        severeWeather: severe,
        providersUnavailable: unavailable,
      },
      passed: 5,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "PASS: five isolated forecasting/context cases; fixture JSON saved, database and providers unchanged.",
);
