# Operational Context Interpretation

**Status:** Frozen for VS023
**Last updated:** 2026-09-02
**Authority:** Latest Proposal Paper context-classification rules + completed VS022 provider foundation

VS023 interprets normalized external-context acquisition from VS022 into the manuscript-defined operational classifications used for administrative decision support.

It does not yet change Smart Vehicle Finder ranking, automatically assign vehicles, automatically transfer vehicles, or encode unresolved Briah geographic restrictions.

## Manuscript-defined classifications

Weather:
- Normal
- Caution
- Severe
- Unavailable

Road Condition:
- Open
- Caution
- Closed/Impassable
- Unknown

Route Feasibility:
- Feasible
- Feasible with Caution
- Not Feasible
- Unavailable

Route Accessibility:
- Accessible
- Limited
- Closed/Restricted

When reliable accessibility information is unavailable, preserve a safe internal Unknown state rather than assuming Accessible.

## No invented numeric thresholds

Do not invent rules such as:
- rainfall >= X => Severe;
- wind >= X => Severe;
- distance >= X => Not Feasible;
- travel time >= X => Caution.

The manuscript defines semantic classifications, not arbitrary numeric cutoffs.

Use:
- normalized provider condition codes;
- explicit closure/restriction facts;
- documented severe-weather semantics;
- route availability;
- authorized manual context where applicable.

If evidence is insufficient, return Unavailable/Unknown.

## Weather

Normal:
generally clear/fair/cloudy/overcast/mist or another usable condition without a significant adverse-weather indication.

Caution:
rain, showers, drizzle, fog, non-severe thunderstorms, or another condition affecting visibility/traction/normal travel without independently indicating movement should not proceed.

Severe:
only when normalized context explicitly supports severe travel impact, such as severe thunderstorms, very heavy precipitation represented by provider semantics, tropical-cyclone-related severe weather, or an applicable official severe-weather warning/alert available in context.

Unavailable:
sufficiently current/usable weather cannot be obtained from API/fallback and no reliable authorized manual weather context is available.

Map VS022 Open-Meteo/WMO codes and OpenWeather condition IDs in one explicit provider-neutral interpretation table. Unknown codes must not default to Normal.

## Road Condition

Road condition in this project is an incident-based operational route state, not pavement roughness/pothole/IRI measurement.

Open:
relevant incident context is available and no relevant blocking/cautionary incident is identified.

Caution:
route remains traversable but relevant context identifies road works, lane closures, non-blocking flooding, accidents affecting movement, dangerous conditions, or another non-blocking disruption.

Closed/Impassable:
explicit closure, impassable flooding, blocking restriction, or another condition preventing movement.

Unknown:
reliable incident/road-condition information is unavailable.

Provider failure must never produce Open.

## Route Feasibility

Feasible:
valid driving route is available, no blocking condition exists, and no significant cautionary context requires attention.

Feasible with Caution:
valid route remains available but applicable weather/road/incident/restriction context requires Admin attention and no blocking condition is established.

Not Feasible:
available information confirms movement cannot presently proceed because of explicit closure, blocking restriction, impassable route, or equivalent confirmed blocker.

Unavailable:
routing is unavailable or insufficient contextual information exists to determine feasibility safely.

Do not infer Not Feasible from long distance, high fuel estimate, ordinary rain, traffic delay, or unresolved Briah restrictions.

## Route Accessibility

Accessible:
valid route is available and no applicable closure/restriction/access limitation is identified.

Limited:
movement remains possible but normalized context identifies a restriction, partial closure, lane limitation, cautionary access condition, or similar limitation.

Closed/Restricted:
explicit provider/manual context identifies a closure or restriction preventing/forbidding movement.

Unknown:
safe internal state when reliable accessibility information is unavailable. If retained in final implementation, add it to manuscript reconciliation rather than forcing missing data into Accessible.

## Precedence

Blocking dominates caution:
- Closed/Impassable > Caution > Open
- Not Feasible > Feasible with Caution > Feasible
- Closed/Restricted > Limited > Accessible
- Severe > Caution > Normal

Unavailable/Unknown represents insufficient evidence, not a favorable state.

## Combined interpretation

Create a pure/provider-neutral interpretation function over normalized VS022 data.

Conceptual output:

InterpretedOperationalContext {
  weather
  roadCondition
  routeFeasibility
  routeAccessibility
  distanceKm?
  travelTimeMinutes?
  estimatedFuelLiters?
  sourceSummary
  reasons[]
  limitations[]
}

Do not parse raw provider payloads in VS023.

## Distance / travel time / fuel

Convert route meters -> km and seconds -> minutes.

Use VS022 reference fuel estimate as advisory only.

Do not:
- calculate fuel charge;
- modify booking price;
- reject vehicle solely from fuel estimate.

## Manual context

The manuscript allows authorized manual context when providers cannot supply sufficiently usable information.

If implemented in VS023:
- Owner/Admin only;
- explicitly source as Manual;
- never masquerade as API data;
- preserve conflicts rather than silently replacing a valid adverse API result with a favorable manual value.

Simulated/predefined data used for testing must remain explicitly labeled.

## Advisory boundary

VS023 must not:
- automatically select a vehicle;
- automatically transfer a vehicle;
- create shortage/surplus;
- override availability;
- override maintenance readiness;
- modify booking/payment/rental state.

Do not modify Finder or allocation in VS023.

CQ-028 remains open.

## Tests

Use normalized VS022 fixtures, not raw provider payloads.

Weather:
- clear/fair -> Normal;
- rain/drizzle/fog -> Caution;
- non-severe thunderstorm -> Caution;
- explicit severe condition -> Severe;
- missing/unrecognized -> Unavailable.

Road:
- successful empty relevant incident set -> Open;
- non-blocking roadworks/accident -> Caution;
- explicit closure -> Closed/Impassable;
- acquisition unavailable -> Unknown;
- closure dominates caution.

Feasibility:
- route + normal/open -> Feasible;
- route + caution -> Feasible with Caution;
- route + explicit blocker -> Not Feasible;
- route unavailable/insufficient context -> Unavailable.

Accessibility:
- route + no restriction -> Accessible;
- partial/non-blocking restriction -> Limited;
- explicit closure/restriction -> Closed/Restricted;
- insufficient data -> Unknown.

Add short machine-readable reasons such as:
weather_rain, weather_severe_thunderstorm, road_closure, roadworks, route_unavailable, context_unavailable.

## Stop rule

Stop after interpretation. Do not implement Admin integration, context-aware Finder, client geographic restrictions, automatic assignment/transfer, or pricing/fuel charges.
