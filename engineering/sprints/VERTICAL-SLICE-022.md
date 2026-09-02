# Vertical Slice 022 — External Context Provider Foundation

**Status:** Approved for implementation  
**Objective:** Establish the manuscript-authoritative, provider-neutral external-context acquisition foundation for weather, geocoding, routing, traffic/road incidents, and reference fuel estimation using primary/fallback providers, bounded failure handling, caching, and server-only credentials without changing Smart Vehicle Finder ranking, branch-allocation recommendations, booking pricing, or client-defined travel restrictions.

## Purpose

The manuscript defines contextual information as supporting operational decision-making.

VS022 establishes only the acquisition foundation:

```text
External Providers
        ↓
Primary Provider
        ↓
valid result?
   ┌────┴────┐
  yes        no
   ↓          ↓
 use      eligible failure?
 result       ↓
          Fallback Provider
               ↓
        normalized result
               ↓
        context foundation
```

VS022 does not yet decide what a weather condition, route, or incident means for vehicle recommendation or allocation.

## Manuscript Traceability

### Supports

**Specific Objectives**

Supports the objective involving contextual decision-support information used together with fleet availability, maintenance readiness, forecasting, projected supply, assignment, and branch-allocation decisions.

It does not redefine the Customer Smart Vehicle Finder baseline.

**Requirements / Feature Matrix**

Supports requirements concerning:

- weather information;
- destination-coordinate resolution;
- distance and travel time;
- route feasibility/accessibility data;
- road and traffic incident information;
- reference fuel efficiency;
- estimated fuel consumption;
- external API primary/fallback behavior.

**Use Cases**

VS022 itself introduces infrastructure rather than a new independent end-user business action.

It supports later Admin contextual decision-support surfaces.

**Scope / Operational Logic**

Must implement the manuscript's **External API Selection and Fallback Strategy**.

**Development Tools / APIs**

Authoritative providers:

```text
Weather
Primary: Open-Meteo Forecast API
Fallback: OpenWeather One Call API 3.0

Geocoding
Primary: TomTom Orbis Geocoding API
Fallback: HERE Geocoding and Search API v7

Routing
Primary: TomTom Orbis Routing API
Fallback: HERE Routing API v8

Traffic / Road Incidents
Primary: TomTom Traffic Incidents API
Fallback: HERE Traffic API v7

Reference Fuel Efficiency
Internal canonical vehicle data

Estimated Fuel Consumption
Internal deterministic calculation
```

**Data Dictionary / ERD**

VS022 may add only derived provider-cache persistence where necessary.

Do not implement conceptual `Trip Context`, `Monitoring`, or similar manuscript tables solely because an older data dictionary contains them.

Any new persistent cache/context entity must be recorded for later manuscript reconciliation.

### Implementation Changes Requiring Manuscript Update

Expected:

**None**, provided the manuscript-authoritative provider stack and acquisition-only boundary are followed.

If implementation must materially deviate:

- stop;
- report the blocker;
- create a new MIC entry before substituting architecture.

### Must Not Contradict

- manuscript provider selection;
- manuscript fallback strategy;
- deterministic Customer Smart Vehicle Finder baseline;
- advisory/human-in-the-loop allocation;
- CQ-028 unresolved Briah travel restrictions;
- internal reference fuel-efficiency model;
- Scope and Limitations.

## Required Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `engineering/sprints/VERTICAL-SLICE-022.md`
- `codex-context/30-external-context-provider-foundation.md`
- `codex-context/31-manuscript-traceability-vs022.md`
- `codex-context/25-canonical-subsystem-map.md`
- `engineering/manuscript/MANUSCRIPT-IMPLEMENTATION-ALIGNMENT-MATRIX.md`

Do not read other manuscript/context files unless a concrete blocker requires them.

## Strict Initial Inspection

Inspect only:

1. canonical branch model and branch-address read boundary;
2. canonical vehicle reference-fuel-efficiency field/type;
3. current server environment-variable conventions;
4. current server-side HTTP/fetch conventions;
5. current Supabase server persistence conventions;
6. existing cache utility/pattern if one already exists;
7. smallest server-only location suitable for external-context providers.

Do not inspect:

- Finder ranking;
- allocation;
- forecasting;
- projected supply;
- notifications;
- reminders;
- audit implementation;
- requirements;
- payments;
- Maintenance UI;

unless one exact compilation dependency requires it.

Do not read previous vertical-slice contracts.

## Scope

VS022 implements:

1. normalized provider result primitives;
2. provider-neutral weather interface;
3. Open-Meteo primary weather adapter;
4. OpenWeather fallback weather adapter;
5. provider-neutral geocoding interface;
6. TomTom primary geocoding adapter;
7. HERE fallback geocoding adapter;
8. provider-neutral routing interface;
9. TomTom primary routing adapter;
10. HERE fallback routing adapter;
11. provider-neutral traffic/incident interface;
12. TomTom primary traffic/incident adapter;
13. HERE fallback traffic adapter;
14. primary/fallback orchestration;
15. bounded timeouts;
16. derived-data caching;
17. safe diagnostics;
18. internal reference-fuel-estimate calculation boundary;
19. focused mocked/provider-backed validation.

VS022 does not implement final operational classifications or recommendation consequences.

## Provider Result Envelope

Create a common provider-neutral result model.

Conceptually:

```text
ProviderResult<T>

status
data?
providerUsed?
fallbackUsed
fetchedAt?
failureCategory?
```

Suitable statuses may include:

```text
available
unavailable
not_configured
unsupported
timeout
provider_error
```

Equivalent typed naming is acceptable.

Do not use:

```text
distance = 0
temperature = 0
incidents = []
```

to disguise provider failure.

An empty incident list is valid only when the provider successfully reports no matching incidents.

## Failure Categories

Normalize failures into a small stable vocabulary.

Examples:

```text
timeout
not_configured
authentication
quota
coverage
unsupported
malformed_response
provider_error
```

Do not leak provider-specific raw error payloads to application consumers.

## Primary/Fallback Orchestration

Each provider family has:

```text
Primary
   ↓
successful usable result?
   ├── yes → return primary
   └── no
        ↓
fallback-eligible failure?
   ├── yes → invoke fallback
   └── no  → return normalized failure
```

## Critical Fallback Rule

Fallback is **resilience**, not result shopping.

### Correct

```text
TomTom request times out
        ↓
HERE fallback
```

```text
Open-Meteo cannot provide usable requested data
        ↓
OpenWeather fallback
```

### Incorrect

```text
TomTom says:
road closed

        ↓

ask HERE hoping
it says road open
```

A valid adverse result is still a successful provider result.

## Weather Provider

### Primary

`Open-Meteo Forecast API`

### Fallback

`OpenWeather One Call API 3.0`

Normalize only provider-neutral acquisition data required by later interpretation.

Potential fields:

- target timestamp;
- provider weather code;
- temperature;
- precipitation;
- precipitation probability where available;
- wind speed/direction where required;
- fetched timestamp.

Do not create:

```text
Normal
Caution
Severe
```

in VS022.

Those are application interpretation labels for a later slice.

## Weather Time Semantics

Use requested operational target time where supported.

Do not silently substitute current weather when the requested context is unavailable for the target time.

Return explicit unsupported/unavailable state where appropriate.

Provider limitation may be fallback-eligible if the fallback supports the requested requirement.

## Geocoding Provider

### Primary

`TomTom Orbis Geocoding API`

### Fallback

`HERE Geocoding and Search API v7`

Input:

```text
destination/travel-area text
```

Normalize:

- latitude;
- longitude;
- formatted/provider label;
- fetched timestamp;
- provider metadata required for attribution/debugging.

The original customer destination remains canonical.

Do not overwrite:

```text
Tagaytay
```

with a provider-generated address as the customer's submitted value.

## Branch-Origin Geocoding

Canonical branch currently contains an address but no verified coordinates.

For route acquisition:

```text
pickup_branch_id
       ↓
canonical branch.address
       ↓
TomTom geocoding
       ↓ failure
HERE geocoding
       ↓
origin coordinates
```

Cache successful branch geocoding.

Do not hard-code Manila/Antipolo coordinates in application source.

## Routing Provider

### Primary

`TomTom Orbis Routing API`

### Fallback

`HERE Routing API v8`

Input:

- origin coordinates;
- destination coordinates;
- appropriate driving mode/options.

Normalize:

- distance meters;
- duration seconds;
- provider;
- fetched timestamp;
- traffic-awareness metadata where actually supported by the request/result.

Do not call a duration:

```text
live traffic ETA
```

unless the selected provider request actually supplies traffic-aware duration.

## Route Geometry

Do not persist or return full route geometry unless required for the manuscript-supported context use case or existing UI.

Prefer the smallest required route summary for VS022:

```text
distance
duration
provider metadata
```

Avoid unnecessary provider payload retention.

## Traffic / Road Incident Provider

### Primary

`TomTom Traffic Incidents API`

### Fallback

`HERE Traffic API v7`

Normalize factual provider incident information.

Possible normalized fields:

- provider incident ID where safe/useful;
- incident category;
- provider severity/criticality;
- closure/restriction indicator;
- start/end/validity time;
- affected coordinates/bounds where needed;
- provider;
- fetched timestamp.

Do not yet classify:

```text
Road Condition = Severe
Route Accessibility = Limited
Route Feasibility = Not Feasible
```

VS022 acquires facts.

A later slice interprets them.

## Incident Query Scope

Use the route/destination context necessary to obtain relevant incidents.

Do not request an unbounded national incident dataset merely to find events for one trip.

Keep requests geographically bounded where provider APIs support it.

## Reference Fuel Efficiency

Use canonical:

```text
vehicle.reference_fuel_efficiency_km_per_liter
```

or the repository's exact current equivalent.

No external fuel-efficiency API.

## Estimated Fuel Consumption

Provide a pure deterministic calculation boundary:

```text
estimatedLiters =
routeDistanceKm /
referenceFuelEfficiencyKmPerLiter
```

Only calculate when:

```text
routeDistanceKm >= 0
referenceFuelEfficiencyKmPerLiter > 0
```

Unavailable input:

```text
estimate unavailable
```

Do not divide by zero.

Do not label this value:

```text
actual fuel consumed
```

It is an estimate.

## Server-Only Credentials

Use repository-consistent environment handling.

Expected keyed providers include:

```text
TOMTOM_API_KEY
HERE_API_KEY
OPENWEATHER_API_KEY
```

or equivalent validated names.

Open-Meteo may not require a key for the selected baseline endpoint.

Even so, Open-Meteo access belongs behind the provider service for:

- caching;
- normalization;
- timeout behavior;
- fallback;
- consistent architecture.

Never expose provider secrets in browser code.

## HTTP Client Boundary

Centralize common external-request behavior where useful:

- timeout;
- safe JSON parsing;
- status normalization;
- abort handling;
- diagnostics.

Do not build four unrelated unbounded `fetch()` implementations.

Avoid overengineering a generic SDK framework.

## Timeout

All provider calls must have bounded timeout behavior.

Use one implementation constant/configurable policy unless a provider genuinely requires a documented exception.

Timeout is fallback-eligible.

## Caching

Cache derived provider results where appropriate.

### Geocoding

Recommended baseline:

```text
~30 days
```

Addresses/coordinates are relatively stable.

### Basic Route

If the result is not traffic-sensitive:

```text
hours / approximately 24h
```

is acceptable.

If route response contains traffic-sensitive timing:

use a substantially shorter TTL.

### Traffic Incidents

Use short TTL measured in minutes.

Do not cache live incident information for days.

### Weather

Use a forecast-appropriate TTL, generally minutes rather than days.

Exact TTLs are implementation constants, not Briah business rules.

## Cache Key

Include all material request dimensions.

Examples:

Geocode:

```text
provider-family
normalized query
locale/country bounds where used
version
```

Route:

```text
origin
destination
travel mode
traffic option
provider-family/version
```

Weather:

```text
coordinates
target-time bucket
provider-family/version
```

Traffic:

```text
geographic/route bounds
time/freshness dimensions
provider-family/version
```

## Cache Persistence

Prefer the smallest repository-consistent server cache.

If persistent Supabase cache is introduced:

- use a NEW additive migration;
- clearly mark it as derived provider cache;
- protect it from arbitrary client writes;
- add the new entity to the manuscript alignment backlog.

Do not create conceptual manuscript `Trip Context` or `Monitoring` tables merely because they exist in an older data dictionary.

## Cache Content

Do not cache:

- API keys;
- authorization headers;
- raw credential-bearing URLs.

Prefer normalized payloads rather than complete provider responses.

## Safe Diagnostics

Server diagnostics may include:

- provider family;
- provider used;
- fallback used;
- fallback reason;
- HTTP status category;
- elapsed milliseconds;
- cache hit/miss.

Never log:

- API key;
- Authorization header;
- secret query parameter.

## Partial Context

Provider families degrade independently.

Example:

```text
Geocoding       available
Routing         available
Traffic         unavailable
Weather         available
```

This is a valid partial result.

Do not throw away valid route/weather context solely because incidents failed.

## Trusted Context Service

Create a provider-neutral server service capable of composing acquisition results.

Conceptual input:

```text
destination
pickupBranchId
targetTime
vehicleId?  // only where fuel estimate is requested
```

Conceptual output:

```text
destinationGeocode
originGeocode
route
weather
trafficIncidents
fuelEstimate?
```

This service remains advisory.

## Browser/API Boundary

Do not expose direct keyed-provider calls from the browser.

If VS022 needs an application API for validation/integration, expose normalized safe data only.

Do not expose raw provider JSON unless a very specific documented need exists.

## No Finder Integration

Do not modify:

- `src/lib/vehicle-finder.ts`;
- Finder ranking;
- Finder eligibility;
- Finder explanation strings

unless a compile-only type import is absolutely necessary.

VS022 must not make:

```text
heavy rain → SUV
```

or:

```text
long route → reject sedan
```

decisions.

## No Allocation Integration

Do not modify allocation recommendation behavior.

Context integration belongs to a later slice.

## No Restricted-Area Rules

CQ-028 remains unresolved.

Do not implement:

```text
Bicol → sedan prohibited
```

or equivalent geographic policy.

Provider route availability does not equal Briah policy.

## No Pricing Effects

Do not:

- change rental base price;
- charge estimated fuel;
- add traffic fee;
- add weather fee;
- alter down payment.

## Provider Adapter Tests

Use mocked HTTP/provider responses.

Test each primary adapter independently.

Test each fallback adapter independently.

Test orchestration separately.

## Weather Tests

At minimum:

- Open-Meteo success;
- Open-Meteo timeout → OpenWeather success;
- Open-Meteo malformed/unusable → fallback;
- valid adverse Open-Meteo result → no fallback;
- both unavailable;
- missing OpenWeather key when fallback required;
- target-time limitation behavior.

## Geocoding Tests

- TomTom success;
- TomTom timeout → HERE success;
- TomTom no usable coverage → HERE;
- valid TomTom result → no HERE call;
- both fail;
- original destination preserved.

## Routing Tests

- TomTom route success;
- timeout → HERE;
- valid route with adverse/long duration → no fallback merely because result is undesirable;
- no route/unsupported response handled according to documented fallback eligibility;
- both fail.

## Traffic Tests

- TomTom incident success;
- TomTom valid closure incident → no HERE result shopping;
- timeout/provider failure → HERE;
- no incidents from successful provider is a valid empty result;
- both fail.

## Fuel Tests

- valid distance + efficiency;
- missing distance;
- missing efficiency;
- zero efficiency;
- negative invalid input;
- output labeled estimate.

## Security Tests

Verify:

- provider keys not present in client bundle/API output;
- raw provider credential URLs not logged;
- arbitrary browser clients cannot mutate provider cache;
- provider error response is normalized.

## Cache Tests

Verify:

- hit avoids provider call;
- expired entry refreshes;
- primary/fallback cache keys do not collide incorrectly;
- traffic/weather freshness is respected.

## Provider-Backed Validation

When keys/connectivity are configured, perform a small number of real requests.

Validate at minimum:

1. Open-Meteo weather;
2. TomTom geocode;
3. TomTom route;
4. TomTom incident request;
5. intentionally exercise fallback where safely possible/configurable;
6. HERE fallback provider connectivity;
7. OpenWeather fallback provider connectivity.

Do not consume excessive provider quota merely to prove fallback.

If a provider account/key is not yet configured:

report that provider-backed check as:

```text
BLOCKED / NOT CONFIGURED
```

Do not fabricate success.

## Provider Validation Cleanup

Do not create production migrations to clean provider test data.

Use:

- rollback-based validation;
- test fixtures;
- explicit development cleanup.

## Definition of Done

VS022 is complete when:

- manuscript-authoritative providers are used;
- provider-neutral interfaces exist;
- all primary adapters exist;
- all manuscript fallbacks exist;
- fallback semantics are correct;
- valid adverse primary results do not trigger result shopping;
- bounded timeout handling exists;
- caching/freshness behavior exists;
- normalized failure behavior exists;
- credentials remain server-only;
- route/fuel calculation boundary exists;
- mocked tests cover provider/fallback behavior;
- configured provider-backed checks are reported honestly;
- Finder behavior is unchanged;
- allocation behavior is unchanged;
- no client restriction is invented.

## Post-Implementation Manuscript Review

After implementation review:

- compare actual providers against `31-manuscript-traceability-vs022.md`;
- record any persistent cache entity in the Alignment Matrix;
- create a MIC entry for any material provider/architecture deviation;
- do not modify the manuscript if implementation remained within the frozen design.

## Stop Rule

Stop after VS022 External Context Provider Foundation.

Do not implement:

- VS023;
- operational weather severity classification;
- route feasibility classification;
- route accessibility classification;
- road-condition classification;
- context-aware Finder;
- context-aware allocation;
- restricted travel-area policy;
- pricing/fuel charges.