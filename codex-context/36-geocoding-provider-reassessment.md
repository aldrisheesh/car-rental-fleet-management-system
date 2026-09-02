# Geocoding Provider Reassessment

**Status:** Approved correction to VS022 geocoding provider selection
**Last updated:** 2026-09-02
**Authority:** Live Philippine provider bake-off + MIC-025

## Decision

Replace:
- TomTom Orbis Geocoding primary
- HERE Geocoding and Search v7 fallback

with:
- **Geoapify Geocoding primary**
- **LocationIQ Geocoding fallback**

This change applies only to geocoding.

Keep unchanged:
- Routing: TomTom Orbis primary -> HERE Routing v8 fallback
- Traffic/incidents: TomTom Traffic Incidents primary -> HERE Traffic v7 fallback
- Weather: Open-Meteo primary -> OpenWeather One Call 3.0 fallback
- Fuel estimate: internal route-distance / reference-km-per-liter calculation

## Evidence

The same six Philippine destination inputs were tested across TomTom, Geoapify, and LocationIQ.

TomTom:
- 2 plausible successes
- 4 false positives

Geoapify:
- 5 plausible/intended results
- 0 false positives
- 1 safe no-result/generalized result

LocationIQ:
- usable result for all six
- 0 false positives
- some generalized/nearby results

False positives are more serious than safe no-results because wrong coordinates silently corrupt route, traffic, weather-location, distance, duration, and fuel context.

## Fallback semantics

LocationIQ is used when Geoapify:
- times out;
- has provider/service/auth/quota failure;
- returns malformed/unusable data;
- returns no usable result;
- fails the provider-neutral semantic quality guard.

Fallback is resilience/coverage recovery, not result shopping.

## Quality guard

HTTP 200 is not automatically a usable geocode.

Prefer:
- intended POI/entity match;
- locality/city consistency;
- Philippines country scope;
- plausible label-to-query relationship.

Avoid brittle destination-specific hard-coding.

A clearly mismatched same-city result must not be accepted merely because the municipality matches.

When quality cannot be established confidently:
- return normalized coverage/unavailable;
- allow fallback;
- preserve original customer destination text.

## Canonical destination

Customer-entered destination/travel-area text remains canonical.

Provider labels/coordinates remain derived.

## Branch geocoding

The same corrected geocoding orchestration applies to canonical branch addresses.

## Credentials

Server-only:
- `GEOAPIFY_API_KEY`
- `LOCATIONIQ_API_KEY`

TomTom credentials remain required for routing/traffic.

Do not prefix Geoapify or LocationIQ keys with `VITE_`.

## Manuscript impact

MIC-025 supersedes the original geocoding-provider row.

Final manuscript table should show:

Destination Coordinates / Geocoding:
- Primary: Geoapify Geocoding API
- Fallback: LocationIQ Geocoding API

Routing/Traffic/Weather rows remain unchanged.
