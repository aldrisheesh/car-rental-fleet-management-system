# External Context Provider Foundation

**Status:** Frozen with MIC-025 geocoding correction
**Last updated:** 2026-09-02

## Provider Stack

Weather:
- Open-Meteo Forecast API
- fallback OpenWeather One Call API 3.0

Geocoding:
- **Geoapify Geocoding API**
- fallback **LocationIQ Geocoding API**

Routing:
- TomTom Orbis Routing API
- fallback HERE Routing API v8

Traffic/incidents:
- TomTom Traffic Incidents API
- fallback HERE Traffic API v7

Fuel:
- internal canonical vehicle reference fuel efficiency
- route distance / km-per-liter estimate

The geocoding pair supersedes the manuscript's original TomTom -> HERE geocoding row because controlled live Philippine validation found material false-positive geocoding from TomTom. See `36-geocoding-provider-reassessment.md` and MIC-025.

## Fallback Semantics

Fallback is for provider failure, unusable response, lack of usable coverage, or failure of the provider-neutral semantic quality guard.

Fallback must not be used merely because a valid provider result is adverse.

## Geocoding Quality Rule

A successful HTTP response is not sufficient.

A geocode result must be semantically plausible for the requested destination.

Reject clear false positives and allow fallback.

The original destination text remains canonical.

## Security

Server-only credentials may include:
- GEOAPIFY_API_KEY
- LOCATIONIQ_API_KEY
- TOMTOM_API_KEY
- HERE_API_KEY
- OPENWEATHER_API_KEY

Open-Meteo remains keyless.

Never expose provider secrets to the browser.

## Business boundaries

The provider foundation remains advisory only.

It does not change Finder ranking/eligibility, allocation scoring, pricing, assignment, or CQ-028 restrictions.
