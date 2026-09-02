# External Context Provider Foundation

**Status:** Frozen for VS022
**Last updated:** 2026-09-02
**Authority:** Latest Proposal Paper external API selection/fallback strategy + manuscript alignment audit

VS022 establishes the provider-neutral external-context acquisition foundation promised by the manuscript. It does not yet convert provider outputs into final operational classifications or change Finder/allocation decisions.

## 1. Manuscript-Authoritative Provider Stack

### Weather
Primary:
`Open-Meteo Forecast API`

Fallback:
`OpenWeather One Call API 3.0`

### Destination Coordinates / Geocoding
Primary:
`TomTom Orbis Geocoding API`

Fallback:
`HERE Geocoding and Search API v7`

### Distance / Travel Time
Primary:
`TomTom Orbis Routing API`

Fallback:
`HERE Routing API v8`

### Route Feasibility / Accessibility / Road Condition Source
Primary:
`TomTom Orbis Routing API + TomTom Traffic Incidents API`

Fallback:
`HERE Routing API v8 + HERE Traffic API v7`

### Fuel Efficiency
Source:
internal vehicle reference fuel-efficiency data.

### Estimated Fuel Consumption
Source:
internal deterministic calculation from route distance and reference fuel efficiency.

No provider substitution is permitted without a documented Manuscript–Implementation Change Register entry and explicit manuscript review.

## 2. Fallback Semantics

Fallback exists for provider failure or insufficiency.

Fallback may be attempted when the primary:
- is unavailable;
- times out;
- returns an authentication/quota/service error;
- lacks usable coverage for the request;
- returns malformed/unusable data;
- cannot provide the required field due to a documented service limitation;
- returns stale data where freshness is required.

Fallback must NOT be invoked merely because the primary returns a valid adverse result.

Examples:

Valid primary result:
`road closed`
-> use the result.
-> do NOT ask fallback hoping for `open`.

Valid primary result:
`heavy rain`
-> use the result.
-> do NOT ask fallback hoping for `clear`.

Fallback is resilience, not provider-result shopping.

## 3. VS022 Scope Boundary

VS022 implements acquisition infrastructure only:

- provider interfaces;
- primary/fallback adapters;
- fallback orchestration;
- server-only credentials;
- bounded timeouts;
- normalized provider-neutral acquisition results;
- caching where appropriate;
- safe diagnostics;
- provider-backed validation.

VS022 does NOT yet implement final application classifications such as:
- `Normal / Caution / Severe`;
- `Feasible / Feasible with Caution / Not Feasible`;
- `Accessible / Limited / Closed or Restricted`;
- final road-condition severity;
- vehicle recommendation effects;
- allocation effects.

Those interpretation rules belong to a later approved slice.

## 4. Provider-Neutral Interfaces

Application/domain code must not depend directly on TomTom, HERE, Open-Meteo, or OpenWeather response shapes.

Conceptual interfaces:

`WeatherProvider.getWeather(request)`

`GeocodingProvider.geocode(request)`

`RoutingProvider.getRoute(request)`

`TrafficIncidentProvider.getIncidents(request)`

Primary/fallback orchestration sits above individual adapters.

## 5. Normalized Acquisition Results

Each provider family should normalize into a common result envelope.

Conceptual:

```text
ProviderResult<T> {
  status
  data?
  providerUsed?
  fallbackUsed
  fetchedAt?
  freshness?
  failureCategory?
}
```

Suitable statuses:
- `available`
- `unavailable`
- `not_configured`
- `unsupported`
- `timeout`
- `provider_error`

Do not use fake zero/empty values as successful provider data.

## 6. Weather Acquisition

VS022 acquires provider-neutral weather fields needed by later interpretation.

Normalize only defensible raw/advisory values such as:
- target time;
- weather code/condition code;
- temperature;
- precipitation/probability where supported;
- wind values where required by later manuscript interpretation;
- provider/fetched timestamp.

Do not classify `Severe` in VS022.

### Open-Meteo
Open-Meteo is the primary.

Use the appropriate forecast endpoint/fields supported by the manuscript requirement.

### OpenWeather
OpenWeather One Call 3.0 is fallback.

Do not call it after a valid Open-Meteo adverse-weather result.

## 7. Geocoding Acquisition

Input:
customer destination/travel-area text.

Primary:
TomTom Orbis Geocoding.

Fallback:
HERE Geocoding and Search v7.

Normalize:
- latitude;
- longitude;
- formatted/provider label;
- provider metadata.

The original customer-entered destination remains canonical business input.

Do not overwrite it with the provider label.

## 8. Branch Origin

The current canonical branch model has:
- ID;
- name;
- optional address;
- active state;

and no verified coordinates.

For VS022:
- use canonical pickup-branch address as the origin input;
- geocode it through the same primary/fallback geocoding boundary;
- cache successful stable geocodes;
- if branch address cannot be resolved, route acquisition is unavailable.

Do not hard-code branch coordinates.

## 9. Routing Acquisition

Primary:
TomTom Orbis Routing.

Fallback:
HERE Routing v8.

Normalize:
- route distance;
- travel duration;
- route geometry/summary only if actually required by later application use;
- provider/fetched timestamp.

Do not label provider duration as a guaranteed ETA.

Where live traffic semantics are included by the selected provider request, preserve enough metadata for later interpretation to distinguish baseline vs traffic-informed values.

Do not invent traffic-awareness if the response/request does not support it.

## 10. Traffic / Incident Acquisition

Primary:
TomTom Traffic Incidents API.

Fallback:
HERE Traffic API v7.

Normalize provider-neutral incident facts required by later interpretation, such as:
- incident category/type;
- severity/criticality where supported;
- closure/restriction indication where supported;
- affected geometry/area where supported;
- start/end/validity where supported;
- provider/fetched timestamp.

Do not yet translate provider categories into the manuscript's final operational classifications.

Do not scrape Waze.

## 11. Fuel Efficiency / Estimated Fuel

No external fuel-efficiency provider.

Canonical vehicle data already contains reference fuel efficiency in km/L.

VS022 may define the provider-neutral/internal calculation boundary, but final operational interpretation may remain later.

Formula:

`Estimated Fuel Consumption (L) = Route Distance (km) / Reference Fuel Efficiency (km/L)`

Guardrails:
- reference efficiency must be positive;
- route distance must be available;
- unavailable input -> unavailable estimate;
- never divide by zero;
- label result as estimate/reference, not actual consumed fuel.

## 12. Credentials

Server-only environment variables should follow repository conventions.

Expected provider secrets/config may include:
- TomTom API key;
- HERE API key;
- OpenWeather API key.

Open-Meteo may not require a secret for the baseline public API, but its calls still belong behind the server provider boundary for architectural consistency/caching/fallback.

Never expose provider credentials to browser code.

## 13. Trusted Server Boundary

Browser code must not call paid/keyed providers directly.

Create a server-only external-context service.

Later customer/Admin APIs consume normalized safe results from that service.

VS022 may expose a narrow authenticated/internal validation endpoint only if needed for integration testing.

Do not yet wire external context into Finder ranking or allocation decisions.

## 14. Timeout Policy

Every external request uses a bounded timeout.

Use a centralized policy.

A hung primary should become a fallback-eligible timeout rather than hanging the application indefinitely.

## 15. Cache Strategy

Caching protects quotas and latency.

Baseline recommendations:

Geocoding:
- long-lived cache, approximately 30 days.

Routing:
- cache according to whether the requested route result is static/basic or traffic-sensitive.
- basic route summaries may use a longer TTL.
- traffic-informed route data must use a short TTL appropriate to freshness.

Traffic incidents:
- short TTL, e.g. minutes, not days.

Weather:
- short/medium TTL appropriate to forecast freshness.

Exact TTL constants are implementation defaults, not client business rules.

Cache keys must include:
- provider family/version;
- normalized inputs;
- relevant mode/time parameters.

## 16. Cache Is Not Canonical Business Truth

Provider cache entries are derived data.

Do not replace:
- booking destination;
- branch address;
- vehicle data;
- client business restrictions

with cache records.

A later slice may define immutable context snapshots for reproducibility if needed.

## 17. Failure Categories

Normalize provider failures into safe categories such as:
- timeout;
- not configured;
- quota/auth;
- unavailable;
- unsupported/coverage;
- malformed response;
- provider error.

Do not return raw provider stack traces or credential-bearing URLs to clients.

## 18. Partial Context Is Valid

Context families degrade independently where possible.

Examples:
- weather primary/fallback succeeds while traffic fails;
- geocoding succeeds but routing fails;
- route succeeds but incidents are unavailable.

Do not discard valid context solely because another provider family failed.

## 19. Observability

Safe server diagnostics may include:
- provider family;
- primary/fallback provider used;
- fallback reason category;
- cache hit/miss;
- elapsed time;
- safe HTTP status category.

Never log:
- API keys;
- authorization headers;
- sensitive full URLs containing keys.

## 20. Provider Validation

Use mocked adapter tests for deterministic validation.

Where real keys are configured, perform a small number of provider-backed requests.

Validate:
- primary success;
- primary failure -> fallback success;
- valid adverse primary result -> no fallback;
- both providers unavailable -> normalized unavailable;
- timeout -> fallback;
- cache hit;
- credential secrecy.

Do not commit provider responses if provider terms prohibit fixture redistribution.

Do not create provider-validation cleanup migrations.

## 21. No Business-Decision Changes

VS022 must not change:
- Smart Vehicle Finder eligibility;
- Smart Vehicle Finder ranking;
- booking price;
- payment;
- vehicle assignment;
- allocation recommendation;
- automatic transfer;
- restricted-area eligibility.

External context remains acquisition/advisory foundation only.

## 22. CQ-028

Client travel restrictions remain separate from provider data.

A provider saying a route exists does not mean Briah allows that trip.

A provider saying a route is unavailable does not define Briah's contractual policy.

Do not encode `Bicol = no sedans`.

## 23. Definition of Done

VS022 is complete when:
- provider-neutral interfaces exist;
- Open-Meteo primary weather acquisition exists;
- OpenWeather fallback exists;
- TomTom primary geocoding exists;
- HERE geocoding fallback exists;
- TomTom primary routing exists;
- HERE routing fallback exists;
- TomTom primary traffic/incident acquisition exists;
- HERE traffic fallback exists;
- fallback semantics are correct;
- timeouts/caching/failure normalization work;
- credentials remain server-only;
- internal fuel-estimate boundary is safe;
- no downstream recommendation/assignment/allocation behavior changes.

## 24. Stop Rule

Stop after external-context provider acquisition foundation.

Do not implement:
- final operational context classification;
- context-aware Finder;
- context-aware allocation;
- client restricted-area rules;
- automatic vehicle exclusion from provider weather/traffic;
- pricing changes;
- route-based payment/fuel charges.
