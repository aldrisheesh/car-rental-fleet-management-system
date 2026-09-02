# VS022 Manuscript Traceability

**Status:** Updated after MIC-025
**Last updated:** 2026-09-02

## Original manuscript provider design

The proposal originally defined:
- TomTom Orbis Geocoding primary
- HERE Geocoding/Search v7 fallback

## Superseding implementation evidence

Live Philippine geocoding validation showed materially unsafe false-positive destination resolution from TomTom.

MIC-025 supersedes only the geocoding provider row.

## Current authoritative geocoding architecture

- Geoapify Geocoding primary
- LocationIQ Geocoding fallback

## Unchanged provider architecture

Weather:
- Open-Meteo -> OpenWeather One Call 3.0

Routing:
- TomTom Orbis -> HERE Routing v8

Traffic/incidents:
- TomTom -> HERE Traffic v7

Fuel:
- internal calculation

## Manuscript action

Update the final External API Selection and Fallback Strategy to show Geoapify -> LocationIQ for destination coordinates/geocoding.

## Must not contradict

- customer destination remains canonical text;
- provider coordinates are derived;
- fallback is resilience/coverage recovery;
- Finder unchanged;
- allocation scoring unchanged;
- CQ-028 unchanged.
