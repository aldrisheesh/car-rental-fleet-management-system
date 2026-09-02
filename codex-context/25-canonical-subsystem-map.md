# Canonical Subsystem Map

**Status:** Active AI navigation aid
**Last updated:** 2026-09-02

## VS022 External Context starting points

Read:
- `codex-context/30-external-context-provider-foundation.md`
- `engineering/manuscript/MANUSCRIPT-IMPLEMENTATION-ALIGNMENT-MATRIX.md`
- current VS022 manuscript traceability section when created.

Inspect only:
1. canonical branch model/address read boundary;
2. canonical vehicle reference fuel-efficiency field/type;
3. existing server environment/fetch conventions;
4. existing Supabase/server cache patterns if persistence is used;
5. smallest server-only location for provider adapters/orchestration.

Do not inspect:
- Finder ranking;
- allocation;
- forecasting/supply;
- notifications/reminders;
- audit internals;
- maintenance workflows;
- payment/requirements

unless one exact compilation dependency requires it.

## Manuscript-authoritative provider rule

VS022 providers:
- Open-Meteo -> OpenWeather;
- TomTom geocoding -> HERE geocoding;
- TomTom routing -> HERE routing;
- TomTom traffic/incidents -> HERE traffic.

Do not substitute providers without a MIC entry and manuscript review.

## Fallback rule

Fallback is for provider failure/insufficiency.

A valid adverse primary result is still a successful primary result.

## Domain boundary

Provider adapters return normalized acquisition data.

They do not modify Finder/allocation/business rules in VS022.

## Migration discipline

Use additive migrations only if a derived provider cache requires persistence.

Provider-validation cleanup never belongs in production migrations.

## Correction sessions

Use a fresh exact-file Codex session.
