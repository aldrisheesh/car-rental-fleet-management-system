# MIC-025 — Geocoding Provider Reassessment Due to Philippine Coverage

**Date:** 2026-09-02
**Classification:** IMPLEMENTATION FEASIBILITY / PROVIDER CHANGE
**Implementation status:** Approved for correction; implementation pending

## Original manuscript state

Destination coordinates / geocoding:
- Primary: TomTom Orbis Geocoding API
- Fallback: HERE Geocoding and Search API v7

## Trigger

Real-provider validation showed TomTom geocoding was materially unreliable for realistic Philippine customer destinations.

## Controlled comparison

Same six queries were tested against TomTom, Geoapify, and LocationIQ.

TomTom:
- 2 plausible successes
- 4 false positives

Geoapify:
- 5 plausible/intended results
- 0 false positives
- 1 safe no-result/generalized result

LocationIQ:
- usable results for all six
- 0 false positives
- some generalized/nearby results

## Risk

Wrong coordinates can silently invalidate route distance, travel time, traffic relevance, weather location, route feasibility/accessibility, and estimated fuel consumption.

## Decision

Replace geocoding architecture with:
- Primary: Geoapify Geocoding API
- Fallback: LocationIQ Geocoding API

Remove TomTom from active geocoding orchestration.

Do not change TomTom Routing, TomTom Traffic, HERE Routing/Traffic fallback, Open-Meteo/OpenWeather, or fuel calculation.

## Manuscript sections affected

- External API Selection and Fallback Strategy
- Development Tools/API description
- System Architecture where providers are named
- contextual-data source table
- diagrams naming TomTom/HERE specifically for destination coordinates

## Required manuscript action

Replace only the geocoding-provider row:

OLD:
TomTom Orbis Geocoding -> HERE Geocoding/Search v7

NEW:
Geoapify Geocoding -> LocationIQ Geocoding

Document the controlled Philippine provider comparison as implementation feasibility evidence.

## Status

READY FOR IMPLEMENTATION CORRECTION.
