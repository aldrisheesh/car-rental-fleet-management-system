# Changelog

## 2026-09-02 — VS022 manuscript-aligned external context planning

- Froze manuscript-authoritative Open-Meteo -> OpenWeather weather fallback.
- Froze TomTom -> HERE geocoding fallback.
- Froze TomTom -> HERE routing fallback.
- Froze TomTom Traffic Incidents -> HERE Traffic fallback.
- Preserved internal reference fuel efficiency and route-distance fuel estimate.
- Defined fallback as provider resilience, not result shopping.
- Separated provider acquisition from later operational interpretation.
- Required provider-neutral adapters, server-only credentials, bounded timeouts, caching, safe diagnostics, and normalized failure categories.
- Preserved CQ-028 separately from external provider route data.
- Recorded that Geoapify/WeatherAPI planning was rejected before commit/implementation.
- Added mandatory manuscript-alignment/provider-change discipline.

## 2026-09-02 — VS021 audit
VS021 established the canonical semantic append-only Audit Trail.
