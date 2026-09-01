# Canonical Subsystem Map
**Status:** Active AI navigation aid
**Last updated:** 2026-09-01

Purpose: reduce Codex repository rediscovery. This is a navigation aid, not a new business-rule authority.

## Usage
Inspect only the smallest listed canonical files required by the current slice. Do not read every item automatically.

## Shared time / duration
- `src/lib/business-time.ts` — canonical Asia/Manila datetime-local conversion.
- `src/lib/rental-duration.ts` — shared base rental-day convention.

## Smart Vehicle Finder — VS017
- `src/lib/vehicle-finder.ts`
- `src/lib/vehicle-finder.test.ts`
- `src/routes/api.vehicle-finder.ts`
- `src/routes/vehicles.tsx`

## Maintenance readiness — VS012
- `src/lib/maintenance-readiness.server.ts`

Reuse it; do not recreate readiness from raw records.

## Allocation recommendation — VS016
- `src/lib/allocation-recommendation.core.ts`
- `src/lib/allocation-recommendation.server.ts`
- `src/lib/allocation-recommendation.test.ts`

## Behavioral context for established subsystems
- `19-vehicle-utilization-and-idle-detection.md`
- `20-demand-extraction-and-forecasting-boundary.md`
- `21-projected-supply-and-demand-balance.md`
- `22-branch-allocation-recommendation.md`
- `23-smart-vehicle-finder.md`

## Booking lifecycle context
- `11-requirements-and-secure-storage.md`
- `12-requirement-review-and-verification.md`
- `13-payment-submission-and-verification.md`
- `15-vehicle-assignment-and-booking-confirmation.md`
- `16-rental-release-and-start.md`
- `17-rental-return-and-closure.md`

For integration work, inspect only the route/API/service directly responsible for the transition.

## Authentication
Start with `src/lib/auth.server.ts`, `src/lib/admin-auth.ts`, and the existing authorization helper used by the target route.

## Migrations
Inspect only the latest migration affecting the exact table/function. Applied migrations are history; add a new migration instead of rewriting them.

## Token discipline
Future Codex prompts should name this map plus the current slice and ideally only 2–6 exact implementation files. Avoid broad instructions such as "inspect the booking system."
