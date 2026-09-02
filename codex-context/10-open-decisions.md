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

## CQ-032 — Canonical Operational Origin Locations

**Status:** OPEN — CLIENT CLARIFICATION REQUIRED

For route, distance, traffic, weather, and estimated-fuel calculations, the system needs a client-approved operational origin/reference location for:

- Manila / Taft fleet;
- Antipolo fleet.

The current canonical branch records do not contain verified addresses.

Because Briah operates from home-based/private locations, do not infer or fabricate an exact address from the branch display names.

Acceptable client answer:
1. actual pickup/operational address; or
2. a nearby public/reference pickup location Briah is comfortable storing and using for routing.

Until resolved:
- branch-origin composed external context remains unavailable;
- no coordinates should be hard-coded;
- unrelated vertical-slice development may continue.

When resolved:
- update the canonical branch address values through the normal trusted data path;
- rerun composed VS022 -> VS023 -> VS024 real-provider validation.

## Unchanged providers

- TomTom -> HERE routing
- TomTom -> HERE traffic
- Open-Meteo -> OpenWeather weather

## Other open items

CQ-028, CQ-029, CQ-030, CQ-031, notification configuration, maintenance UI canonicalization, reports/dashboard, backup/recovery.
