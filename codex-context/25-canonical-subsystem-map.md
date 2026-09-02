# Canonical Subsystem Map

**Status:** Active AI navigation aid
**Last updated:** 2026-09-02

## Geocoding correction starting points

Read:
- `codex-context/36-geocoding-provider-reassessment.md`
- `codex-context/30-external-context-provider-foundation.md`
- `codex-context/31-manuscript-traceability-vs022.md`

Inspect only:
1. existing geocoding provider-neutral types/orchestration in `src/lib/external-context.server.ts`;
2. external-context tests;
3. `.env.example`;
4. the shared geocoding path used for customer destinations and branch addresses.

Do not modify:
- TomTom routing;
- TomTom traffic;
- HERE routing/traffic fallback;
- Open-Meteo/OpenWeather weather;
- VS023 interpretation except compile-only imports;
- Finder;
- allocation scoring;
- booking lifecycle.

## Current geocoding authority

Geoapify primary -> LocationIQ fallback.

## Quality

HTTP success does not equal semantic geocode success.

Reject obvious false positives and permit fallback.

Do not hard-code special cases for the six validation queries.
