# Briah's Car Rental — Codex Context

**Status:** Development Baseline active
**Last updated:** 2026-09-02

Completed through VS024, with a live-provider correction pending for VS022 geocoding.

## Active geocoding correction

Controlled Philippine validation superseded the original TomTom -> HERE geocoding pair.

Current authoritative geocoding:
- Geoapify primary
- LocationIQ fallback

Unchanged:
- TomTom -> HERE routing
- TomTom -> HERE traffic
- Open-Meteo -> OpenWeather weather
- internal fuel estimate

See:
- `36-geocoding-provider-reassessment.md`
- MIC-025

Do not proceed to the next feature slice until corrected geocoding is implemented and real-provider validated.
