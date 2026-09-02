# Open Decisions

**Status:** Active
**Last updated:** 2026-09-02

## Geocoding

Resolved by MIC-025:

Primary:
- Geoapify Geocoding

Fallback:
- LocationIQ Geocoding

TomTom geocoding is no longer part of active geocoding orchestration due to weak Philippine semantic quality and false positives in controlled live validation.

Still open:
- whether final UI should add explicit destination confirmation/autocomplete;
- whether context snapshots should be persisted.

## Unchanged providers

- TomTom -> HERE routing
- TomTom -> HERE traffic
- Open-Meteo -> OpenWeather weather

## Other open items

CQ-028, CQ-029, CQ-030, CQ-031, notification configuration, maintenance UI canonicalization, reports/dashboard, backup/recovery.
