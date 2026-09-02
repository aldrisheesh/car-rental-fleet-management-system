# Open Decisions

**Status:** Active
**Last updated:** 2026-09-02

## External Context

VS022 provider acquisition stack is frozen according to the manuscript:

Weather:
- Open-Meteo primary;
- OpenWeather One Call 3.0 fallback.

Geocoding:
- TomTom Orbis primary;
- HERE Geocoding and Search v7 fallback.

Routing:
- TomTom Orbis primary;
- HERE Routing v8 fallback.

Traffic/incidents:
- TomTom primary;
- HERE Traffic API v7 fallback.

Fuel:
- internal reference efficiency and route-distance calculation.

Fallback is used for provider failure/insufficiency, not to override valid adverse primary results.

Still open:
- final normalized operational classification rules;
- context snapshot persistence;
- context influence on Finder;
- context influence on assignment/allocation;
- CQ-028 client restricted-area rules.

## Manuscript Alignment

Any future provider substitution requires:
1. explicit technical justification;
2. a MIC entry;
3. manuscript review before implementation.

The rejected Geoapify/WeatherAPI planning was never committed or implemented and is not part of system history.

## Other Open Items

CQ-029 late-return schedule;
CQ-030 tie-up fleet;
CQ-031 reminder timing;
CQ-017/CQ-026 transfer execution;
maintenance UI/alerts;
reports/dashboard;
backup/recovery;
notification configuration/external delivery.
