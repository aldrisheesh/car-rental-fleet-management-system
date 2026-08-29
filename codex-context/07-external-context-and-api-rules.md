# External Context and API Rules

**Status:** Development Baseline v1 — Provider/classification strategy Frozen; refresh/caching details still open  
**Last updated:** 2026-08-29

## 1. Context Categories

Administrative context-aware decision support may use:

- weather condition
- road condition
- route feasibility
- route accessibility
- travel distance
- estimated travel time
- reference fuel efficiency
- estimated fuel consumption

`traffic_condition` is **not** a separate finalized system classification in the current baseline. Routing/traffic services may use traffic internally or expose traffic information, but do not add a separate traffic-condition business field unless the specification changes.

## 2. Architectural Ground Rule

External context is supporting information only.

It is evaluated after primary internal operational analysis such as:

- forecast requirement
- projected available supply
- shortage/surplus
- vehicle availability
- maintenance readiness
- candidate eligibility

External context must not independently create a branch shortage/surplus, automatically select a vehicle, automatically transfer a vehicle, or override mandatory availability/maintenance rules.

## 3. Primary and Fallback Providers

### Weather

Primary:

- **Open-Meteo Forecast API**

Fallback:

- **OpenWeather One Call API 3.0**

Open-Meteo is the normal first provider. OpenWeather is used only when the primary weather request is unusable according to the fallback rules below.

### Geocoding / Destination Coordinates

Primary:

- **TomTom Orbis Geocoding API**

Fallback:

- **HERE Geocoding and Search API v7**

### Routing / Travel Distance / Travel Time

Primary:

- **TomTom Orbis Routing API**

Fallback:

- **HERE Routing API v8**

### Road Incidents / Road Context

Primary:

- **TomTom Traffic Incidents API**

Fallback:

- **HERE Traffic API v7**

Route feasibility and route accessibility are derived application classifications based on usable routing, restriction, and incident information. They are not assumed to be provider-returned labels.

## 4. Provider Capability Notes

At the time this baseline was frozen:

- Open-Meteo supports coordinate-based forecast retrieval and up to 16 forecast days
- OpenWeather One Call API 3.0 provides current/forecast weather and serves as the weather fallback
- TomTom Orbis routing documentation includes Philippines route calculation and real-time traffic coverage
- TomTom Traffic Incidents exposes incident categories including road closures, lane closures, road works, dangerous conditions, flooding, accidents, and related disruptions
- HERE provides equivalent geocoding, routing, and traffic-incident APIs and documents Philippines traffic coverage

Before coding against an endpoint, Codex should consult the current official provider documentation for the exact URL/version/request schema. Do not change the provider role merely because a newer endpoint version exists; adapt the integration while preserving primary/fallback semantics unless a project decision changes the provider.

## 5. Fallback Trigger

A fallback provider may be requested only when the designated primary provider:

- cannot be reached
- times out
- returns an HTTP/service error
- exceeds an applicable rate/quota/service limit
- lacks applicable coverage for the requested location
- returns malformed or unusable data
- does not provide sufficiently current information for the evaluated period

A **valid adverse result is not a provider failure**.

Examples:

- primary reports road closure -> use that result; do not call fallback merely to seek a different answer
- primary reports thunderstorm/severe weather -> use that result; do not call fallback merely because the condition is unfavorable

The fallback provider is not a voting/averaging source and is not routinely queried after a successful primary response.

## 6. Manual / Unavailable Fallback

Source hierarchy:

`Primary API -> Fallback API -> Authorized Manual Input -> Unavailable/Unknown`

Authorized manual context may be recorded when reliable external information cannot be obtained.

Manual input must be identified as manual rather than API-derived and should preserve who recorded it and when, where the schema/workflow supports that metadata.

If neither API nor reliable authorized manual information is available:

- weather -> `Unavailable`
- road condition -> `Unknown`
- route feasibility -> `Unavailable`
- route accessibility -> `Unknown`

Never silently assume `Normal`, `Open`, `Feasible`, or `Accessible`.

## 7. Weather Classification

Normalize provider/manual weather into:

- `Normal`
- `Caution`
- `Severe`
- `Unavailable`

### Normal

Generally clear, fair, cloudy, overcast, mist, or other available conditions without a significant adverse-weather indication affecting normal travel.

### Caution

Rain, showers, drizzle, fog, thunderstorms without an identified severe condition, or another reported condition that may affect visibility, traction, or normal road travel but does not independently indicate that movement should not proceed.

### Severe

Severe thunderstorms, very heavy precipitation, tropical-cyclone-related severe weather, an applicable official severe-weather warning/alert, or another reported condition that may materially affect safe travel.

### Unavailable

Sufficiently current and usable weather information cannot be obtained from either provider and no reliable authorized manual information exists.

The exact provider-code mapping table belongs in implementation/tests. Preserve these semantic categories even if provider code enums change.

## 8. Road-Condition Classification

Road condition means **incident-based operational road condition**, not pavement roughness/pothole sensing.

Normalize into:

- `Open`
- `Caution`
- `Closed/Impassable`
- `Unknown`

### Open

A usable route exists and no relevant blocking or cautionary road incident has been identified.

### Caution

Route remains traversable, but applicable information identifies a non-blocking concern such as:

- road works
- lane closure
- non-blocking flooding
- accident affecting movement
- dangerous condition
- other relevant non-blocking disruption

### Closed/Impassable

Applicable information identifies an explicit road closure, impassable flooding, blocking restriction, or another condition preventing the relevant movement.

### Unknown

Sufficiently reliable incident/road information cannot be obtained.

## 9. Route-Feasibility Classification

Normalize into:

- `Feasible`
- `Feasible with Caution`
- `Not Feasible`
- `Unavailable`

### Feasible

A valid applicable driving route is available and no blocking or significant cautionary condition has been identified.

### Feasible with Caution

A valid route remains available, but applicable weather, road, restriction, or incident information requires administrative attention.

### Not Feasible

Available information confirms that the proposed movement cannot presently proceed because of an applicable closure, restriction, or impassable route.

### Unavailable

Sufficient routing/context information cannot be obtained to determine feasibility.

Do not classify a provider outage as `Not Feasible`.

## 10. Route-Accessibility Classification

Normalize into:

- `Accessible`
- `Limited`
- `Closed/Restricted`
- `Unknown`

### Accessible

Applicable route is available without a material restriction affecting normal vehicle movement.

### Limited

Route remains available, but one or more applicable restrictions/incidents may limit normal movement.

### Closed/Restricted

Applicable route or relevant segment is closed, blocked, or otherwise restricted against the proposed movement.

### Unknown

Sufficient accessibility information cannot be obtained.

## 11. Presentation Summary State

The UI may summarize normalized context using non-numerical states:

- `No Context Warning`
- `Review Recommended`
- `Movement Not Presently Feasible`
- `Context Unavailable`

These are presentation/decision-support states only. They are not confidence scores, urgency scores, prediction probabilities, or suitability percentages.

Suggested mapping:

- all applicable conditions normal/open/feasible/accessible -> `No Context Warning`
- caution/severe/limited/feasible-with-caution -> `Review Recommended`
- not-feasible or blocking closed/restricted condition -> `Movement Not Presently Feasible`
- required context cannot be evaluated -> `Context Unavailable`

## 12. Three-Week Forecast vs Weather Horizon

The WMA demand horizon is three weeks, but external weather providers may not provide reliable forecasts for the entire 21-day horizon.

Do not fabricate or extrapolate weather merely to fill Week +3.

If the evaluated future week is outside sufficiently current provider data:

- mark weather `Unavailable`
- continue internal demand/supply analysis
- reevaluate context later when the target period becomes closer

## 13. Fuel Efficiency and Estimated Fuel Consumption

Reference fuel efficiency is not API-dependent.

It may be based on manufacturer specification or Owner/Admin-provided reference information and is stored in km/L.

When route distance and a valid positive km/L value exist:

`EstimatedFuelLiters = TravelDistanceKm / ReferenceFuelEfficiencyKmPerLiter`

Do not claim this is measured actual fuel consumption.

Do not calculate estimated fuel cost unless a separate fuel-price methodology is formally approved.

## 14. Context Provenance

Where supported by the schema, preserve:

- general context source mode (`API`, `Manual Input`, `Predefined Data`, `Simulated Data`)
- weather provider
- routing provider
- road-context provider
- warning/remarks
- created/updated timestamps

Simulated data is for functional testing/demo only and must not be represented as live operational API data.

## 15. Still Open

The following implementation details are not yet frozen:

- exact refresh timing for each provider/context category
- caching duration/invalidation rules
- exact provider request limits/credential-management settings for the deployed account
- exact authorized manual road/context verification UI/workflow
- final source priority/update workflow when multiple reference fuel-efficiency values exist

Codex may build provider interfaces/adapters and normalized types now, but must not invent these unresolved policies as business rules.
