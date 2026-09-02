# Vertical Slice 023 — Operational Context Interpretation

**Status:** Approved for implementation  
**Objective:** Interpret the provider-neutral external-context data established in VS022 into the manuscript-defined weather, road-condition, route-feasibility, and route-accessibility classifications using deterministic and explainable rules, while preserving source attribution, uncertainty, and the advisory-only boundary.

## Purpose

VS022 established external-context acquisition:

```text
Open-Meteo / OpenWeather
TomTom / HERE
        ↓
Provider adapters
        ↓
Normalized provider-neutral facts
```

VS023 introduces the next layer:

```text
Normalized provider-neutral facts
        ↓
Deterministic interpretation
        ↓
Weather
Road Condition
Route Feasibility
Route Accessibility
Distance / Duration / Fuel
        ↓
Explainable advisory context
```

VS023 must not change business lifecycle state or recommendation/allocation behavior.

## Manuscript Traceability

### Supports

**Specific Objectives**

Supports contextual decision-support information intended to supplement:

- vehicle availability;
- maintenance readiness;
- demand forecasting;
- projected supply;
- vehicle assignment;
- branch-allocation decisions.

It does not redefine the baseline Customer Smart Vehicle Finder.

**Requirements / Feature Matrix**

Supports manuscript requirements concerning:

- weather context;
- road-condition context;
- route feasibility;
- route accessibility;
- travel distance;
- travel duration;
- reference fuel efficiency;
- estimated fuel consumption;
- contextual normalization.

**Operational Logic**

The implementation must use the manuscript-defined classifications:

```text
Weather
Normal
Caution
Severe
Unavailable
```

```text
Road Condition
Open
Caution
Closed/Impassable
Unknown
```

```text
Route Feasibility
Feasible
Feasible with Caution
Not Feasible
Unavailable
```

```text
Route Accessibility
Accessible
Limited
Closed/Restricted
```

A safe internal:

```text
Unknown
```

state is permitted for Route Accessibility when reliable information is unavailable.

**External API Architecture**

VS023 consumes VS022 normalized data only.

It must not modify:

- Open-Meteo → OpenWeather;
- TomTom → HERE geocoding;
- TomTom → HERE routing;
- TomTom → HERE traffic/incidents.

### Implementation Changes Requiring Manuscript Update

Potential:

If `Unknown` becomes part of the final persisted/public Route Accessibility model, record a MIC entry and add the data-dictionary revision to the manuscript backlog.

No other manuscript change is expected if this contract is followed.

### Must Not Contradict

- VS022 provider architecture;
- manuscript classification vocabulary;
- advisory/human-in-the-loop decision-support boundary;
- deterministic Customer Smart Vehicle Finder;
- CQ-028 unresolved travel restrictions;
- Scope and Limitations.

## Required Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `engineering/sprints/VERTICAL-SLICE-023.md`
- `codex-context/32-operational-context-interpretation.md`
- `codex-context/33-manuscript-traceability-vs023.md`
- `codex-context/25-canonical-subsystem-map.md`

Inspect the normalized VS022 types in:

- `src/lib/external-context.server.ts`

Do not read other context/manuscript files unless a concrete blocker requires them.

## Strict Initial Inspection

Inspect only:

1. VS022 normalized types:
   - `ProviderResult`;
   - `NormalizedWeather`;
   - `NormalizedRoute`;
   - `NormalizedTrafficIncident`;
   - `TripContext`;
   - `FuelEstimate`;
2. existing VS022 tests where needed to understand normalized shapes;
3. the smallest appropriate location for a new pure interpretation module.

Do not inspect or modify:

- provider request construction;
- Finder;
- allocation;
- forecasting;
- projected supply;
- booking;
- requirements;
- payment;
- notifications;
- reminders;
- audit;
- maintenance.

Do not read previous vertical-slice contracts.

## Scope

VS023 implements:

1. operational-context interpretation types;
2. weather classification;
3. road-condition classification;
4. route-feasibility classification;
5. route-accessibility classification;
6. classification precedence;
7. distance/duration normalization;
8. reference-fuel estimate propagation;
9. machine-readable explanation reasons;
10. source/availability limitations;
11. pure deterministic tests.

VS023 does not integrate these classifications into business decisions.

## Pure Interpretation Boundary

Create a new pure module, preferably equivalent to:

```text
src/lib/operational-context.ts
```

or repository-consistent naming.

The interpretation layer must:

- receive normalized VS022 data;
- return interpreted context;
- perform no HTTP requests;
- access no provider credentials;
- perform no Supabase writes;
- mutate no business records.

Do not put interpretation rules back into:

```text
external-context.server.ts
```

unless a tiny shared type export is required.

## Input

The primary input is the normalized VS022:

```text
TripContext
```

or a deliberately smaller provider-neutral interpretation input derived from it.

Do not consume raw:

- Open-Meteo JSON;
- OpenWeather JSON;
- TomTom JSON;
- HERE JSON.

## Output

Create a provider-neutral interpreted structure equivalent to:

```text
InterpretedOperationalContext {
  weather: InterpretedFactor<WeatherClassification>
  roadCondition: InterpretedFactor<RoadConditionClassification>
  routeFeasibility: InterpretedFactor<RouteFeasibilityClassification>
  routeAccessibility: InterpretedFactor<RouteAccessibilityClassification>

  distanceKm?: number
  travelTimeMinutes?: number
  estimatedFuelLiters?: number

  reasons: string[]
  limitations: string[]
}
```

Equivalent type composition is acceptable.

## Interpreted Factor

A factor should preserve enough information to explain itself.

Conceptually:

```text
InterpretedFactor<T> {
  classification: T
  reasons: string[]
  sourceStatus
}
```

Do not duplicate full provider payloads.

## Machine-Readable Reasons

Use stable reason codes.

Examples:

```text
weather_clear
weather_cloudy
weather_fog
weather_rain
weather_thunderstorm
weather_severe_thunderstorm
weather_unavailable

road_open
roadworks
traffic_accident
road_flooding
road_closure
road_context_unavailable

route_available
route_unavailable
route_caution
route_blocked

access_accessible
access_limited
access_closed
access_unknown

fuel_estimate_available
fuel_estimate_unavailable
```

Equivalent concise naming is acceptable.

Do not rely exclusively on UI text to explain classifications.

## No Arbitrary Numeric Thresholds

Do not invent thresholds such as:

```text
rain >= 10 mm
→ Severe
```

```text
wind >= 40 km/h
→ Severe
```

```text
distance >= 150 km
→ Not Feasible
```

```text
duration >= 3 hours
→ Feasible with Caution
```

unless an exact manuscript rule already provides that threshold.

It currently does not.

## Weather Classification

Supported:

```text
Normal
Caution
Severe
Unavailable
```

### Normal

Classify as `Normal` when recognized provider-neutral weather semantics indicate ordinary conditions without meaningful adverse travel implications.

Examples:

- clear;
- mainly clear;
- partly cloudy;
- cloudy;
- overcast;
- other recognized ordinary non-adverse conditions.

Do not classify an unknown code as Normal.

### Caution

Classify as `Caution` when recognized semantics indicate travel-affecting but not explicitly severe conditions.

Examples:

- drizzle;
- rain;
- rain showers;
- fog;
- freezing fog where the available provider semantics do not independently establish Severe under the manuscript;
- non-severe thunderstorm.

### Severe

Classify as `Severe` only when the normalized provider condition has a defensible explicit severe meaning under the manuscript.

Examples may include:

- severe thunderstorm;
- explicitly severe/heavy weather condition represented by the normalized provider semantics;
- severe-weather alert where such normalized information is actually available.

Do not derive Severe from arbitrary numeric precipitation/wind thresholds.

### Unavailable

Use when:

- weather provider result is unavailable;
- weather status is unsupported;
- target weather cannot be obtained;
- normalized weather code is unknown/unrecognized and no other reliable semantic evidence supports classification.

Unknown provider codes must not default to Normal.

## Provider Weather Code Mapping

VS022 currently normalizes:

- Open-Meteo/WMO weather codes;
- OpenWeather condition IDs.

Create explicit deterministic mappings.

### WMO/Open-Meteo

At minimum cover representative:

- clear;
- cloud;
- fog;
- drizzle;
- rain;
- freezing precipitation;
- snow;
- rain showers;
- snow showers;
- thunderstorm.

Do not create a fake severity threshold from precipitation amount.

### OpenWeather

Map recognized condition-ID groups/IDs semantically.

At minimum cover:

- thunderstorm;
- drizzle;
- rain;
- snow;
- atmosphere/fog/mist;
- clear;
- clouds.

Where an OpenWeather ID explicitly communicates materially severe conditions, map accordingly only if defensible from provider semantics/manuscript.

Otherwise prefer Caution over inventing Severe.

## Cross-Provider Semantic Consistency

Equivalent conditions from Open-Meteo and OpenWeather should produce the same manuscript classification where possible.

Example:

```text
Open-Meteo rain
→ Caution

OpenWeather rain
→ Caution
```

Provider choice must not arbitrarily change our operational interpretation.

## Road Condition Classification

Supported:

```text
Open
Caution
Closed/Impassable
Unknown
```

Road condition here means **incident-based operational road state**.

It does not mean:

- pothole quality;
- pavement roughness;
- physical road inspection;
- International Roughness Index.

## Road — Unknown

If traffic/incident acquisition is not:

```text
available
```

classify:

```text
Unknown
```

Do not infer Open from:

- timeout;
- provider error;
- missing key;
- unsupported request;
- unavailable context.

## Road — Open

A successful incident-provider result with:

```text
[]
```

may classify as:

```text
Open
```

because the provider successfully returned no relevant incidents for the queried scope.

Likewise, a non-empty set containing no recognized cautionary/blocking incident may remain Open, but preserve an interpretation limitation if incident semantics are unrecognized.

## Road — Caution

Recognized non-blocking incidents may produce:

```text
Caution
```

Examples:

- roadworks;
- lane restriction;
- accident;
- non-blocking flooding;
- dangerous condition;
- other recognized disruption where movement remains possible.

Do not invent incident categories that VS022 does not provide.

## Road — Closed/Impassable

Explicit:

```text
isRoadClosed = true
```

must produce:

```text
Closed/Impassable
```

Recognized blocking/closure categories may also produce it where provider-neutral semantics clearly support that conclusion.

Closure dominates all lesser road incidents.

## Incident Precedence

Given:

```text
roadworks
+
accident
+
road closure
```

result:

```text
Closed/Impassable
```

not merely Caution.

## Route Feasibility

Supported:

```text
Feasible
Feasible with Caution
Not Feasible
Unavailable
```

## Route — Unavailable

If normalized route result is not available:

```text
Route Feasibility = Unavailable
```

Do not infer feasibility from geocoding alone.

## Route — Not Feasible

Use when the available operational context establishes a blocking condition.

At minimum:

```text
Road Condition = Closed/Impassable
→ Not Feasible
```

or:

```text
Route Accessibility = Closed/Restricted
→ Not Feasible
```

where the restriction is based on reliable interpreted context.

Do not use:

- long distance;
- long duration;
- high estimated fuel;
- ordinary traffic;
- ordinary rain

as automatic Not Feasible rules.

## Route — Feasible with Caution

When route exists and:

```text
Weather = Caution
```

or:

```text
Road Condition = Caution
```

or:

```text
Route Accessibility = Limited
```

then:

```text
Feasible with Caution
```

provided no blocking condition exists.

## Route — Feasible

Use only when:

- route is available;
- required context is sufficiently available;
- no blocking condition exists;
- no cautionary interpreted condition exists.

If a required factor is unavailable such that safe feasibility cannot be determined:

prefer:

```text
Unavailable
```

over optimistic `Feasible`.

## Route Accessibility

Supported public manuscript labels:

```text
Accessible
Limited
Closed/Restricted
```

Also allow internal:

```text
Unknown
```

when reliable information is insufficient.

## Accessibility — Unknown

Use when route/incident information cannot reliably establish accessibility.

Do not default missing context to Accessible.

## Accessibility — Accessible

Use when:

- route is available;
- relevant incident context is available;
- no recognized access limitation/closure exists.

## Accessibility — Limited

Use for recognized partial/non-blocking access limitations.

Examples:

- lane limitation;
- partial restriction;
- roadworks affecting access;
- another incident where passage remains possible but constrained.

Do not classify ordinary rain alone as Limited unless it is accompanied by an access-related incident/restriction.

## Accessibility — Closed/Restricted

Use when explicit normalized context establishes:

- road closure;
- blocking access restriction;
- impassable condition.

Do not use unresolved Briah contractual restrictions here.

## CQ-028 Boundary

This interpretation is about **external operational context**.

It does not answer:

```text
Does Briah permit this destination?
```

Therefore do not encode:

```text
Bicol
→ Closed/Restricted
```

or:

```text
Bicol
→ Not Feasible
```

CQ-028 remains separate.

## Combined Classification Order

A safe order is:

1. interpret weather;
2. interpret road condition;
3. interpret route accessibility;
4. interpret route feasibility using the prior factors.

This ensures feasibility is derived from normalized interpreted factors rather than duplicating provider-specific logic.

## Distance

If route available:

```text
distanceKm =
distanceMeters / 1000
```

Return a finite non-negative value.

Do not round destructively inside core interpretation.

UI may format later.

## Travel Time

If route available:

```text
travelTimeMinutes =
durationSeconds / 60
```

Do not classify duration as good/bad.

## Fuel Estimate

If VS022 provides:

```text
fuelEstimate.estimatedLiters
```

propagate it as:

```text
estimatedFuelLiters
```

Keep it explicitly advisory/reference.

Do not recompute a second inconsistent fuel formula.

## Source / Availability Preservation

The interpreted output must preserve enough normalized source state to distinguish:

```text
Primary API result
Fallback API result
Unavailable
```

Do not expose API keys or raw URLs.

## Manual Context

Do not build a large manual-context management UI in VS023.

If a small type/model is necessary to preserve the manuscript's manual-context concept, define it separately from API context.

Authorized manual context must identify:

```text
source = manual
```

and actor/source metadata where appropriate.

Do not persist manual context unless explicitly necessary for VS023.

## Manual/API Conflict

Do not silently do:

```text
API = Closed
Manual = Open
→ Open
```

If conflict support is implemented:

- preserve both;
- expose a conflict reason/limitation;
- leave final operational decision to Owner/Admin.

Do not invent precedence policy.

## Simulated Context

Tests may use simulated/predefined context.

Production code must not present test/simulated values as live provider context.

## Advisory-Only Boundary

VS023 interpretation is informational.

It must not write to:

- bookings;
- vehicles;
- rentals;
- maintenance;
- forecasts;
- supply evaluations;
- allocations;
- payments.

## No Finder Changes

Do not modify:

```text
src/lib/vehicle-finder.ts
```

or equivalent Finder ranking/eligibility behavior.

## No Allocation Changes

Do not modify canonical allocation scoring/recommendation.

VS024 will decide how interpreted context appears in administrative decision support.

## No Provider Changes

Do not modify:

- Open-Meteo adapter;
- OpenWeather adapter;
- TomTom adapters;
- HERE adapters;
- fallback semantics;
- provider credentials.

Only import normalized types.

## Testing

Create focused pure unit tests.

### Weather

Test representative WMO/Open-Meteo:

- clear → Normal;
- clouds → Normal;
- fog → Caution;
- drizzle → Caution;
- rain → Caution;
- thunderstorm → Caution unless explicitly severe semantics justify Severe;
- unsupported/unrecognized code → Unavailable.

Test representative OpenWeather:

- clear → Normal;
- clouds → Normal;
- mist/fog → Caution;
- drizzle → Caution;
- rain → Caution;
- thunderstorm → Caution/Severe according to explicit semantic mapping;
- unknown ID → Unavailable.

### Road

- incident acquisition unavailable → Unknown;
- available empty incident list → Open;
- roadworks → Caution;
- accident → Caution;
- closure → Closed/Impassable;
- closure + caution → Closed/Impassable;
- unrecognized available incident → preserve limitation.

### Accessibility

- route unavailable → Unknown;
- incident unavailable → Unknown;
- route + available empty incidents → Accessible;
- non-blocking access restriction → Limited;
- closure → Closed/Restricted.

### Feasibility

- route unavailable → Unavailable;
- route + normal/open/accessible → Feasible;
- weather Caution → Feasible with Caution;
- road Caution → Feasible with Caution;
- accessibility Limited → Feasible with Caution;
- closure → Not Feasible;
- inaccessible/insufficient required context → Unavailable where appropriate.

### Units

- meters → kilometers;
- seconds → minutes;
- fuel estimate propagated exactly.

### Purity

Assert interpretation:

- performs no fetch;
- requires no environment keys;
- performs no Supabase access;
- mutates no input.

## Provider-Backed Validation

No additional real provider calls are required for VS023.

VS022 already validates provider acquisition.

VS023 should be validated deterministically from normalized fixtures.

Do not waste API quota testing interpretation logic.

## Definition of Done

VS023 is complete when:

- pure interpretation module exists;
- manuscript weather classifications work;
- manuscript road classifications work;
- manuscript route-feasibility classifications work;
- route-accessibility classifications work with conservative Unknown handling;
- provider code mappings are explicit;
- no arbitrary numeric thresholds exist;
- precedence is deterministic;
- reasons/limitations are explainable;
- distance/duration/fuel are normalized;
- no external provider code changes;
- Finder unchanged;
- allocation unchanged;
- no lifecycle mutation exists.

## Post-Implementation Manuscript Review

Verify:

- labels still match latest manuscript;
- no threshold was invented;
- provider stack unchanged;
- CQ-028 unchanged;
- Finder/allocation unchanged.

If public/persistent Route Accessibility includes `Unknown`:

create/update a MIC entry for the manuscript data-dictionary correction.

## Stop Rule

Stop after VS023 Operational Context Interpretation.

Do not implement:

- VS024;
- Admin assignment/allocation context UI;
- context-aware Finder;
- client geographic restrictions;
- automatic assignment;
- automatic transfer;
- fuel/pricing charges.