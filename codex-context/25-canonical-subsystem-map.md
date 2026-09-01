# Canonical Subsystem Map
**Status:** Active AI navigation aid
**Last updated:** 2026-09-01

Purpose: reduce Codex repository rediscovery. This is navigation, not business-rule authority.

## VS018 exact starting files

For Finder -> Booking integration, start with ONLY:

- `src/lib/business-time.ts`
- `src/lib/vehicle-finder.ts`
- `src/routes/api.vehicle-finder.ts`
- `src/routes/vehicles.tsx`
- `src/routes/booking.tsx`
- `src/routes/api.bookings.ts`

Only inspect:
- `src/routes/admin.bookings.tsx`
when implementing the approved read-only Admin Finder-context display.

Do not inspect forecasting, supply, allocation, maintenance raw tables, reports, notifications, or prior sprint files unless a concrete compile/runtime dependency requires it.

## Maintenance readiness
Canonical boundary:
- `src/lib/maintenance-readiness.server.ts`

Finder already consumes this through its server boundary. VS018 should reuse the Finder server evaluation rather than separately reading raw maintenance.

## Shared time / duration
- `src/lib/business-time.ts`
- `src/lib/rental-duration.ts`

## Booking lifecycle behavioral context
- `11-requirements-and-secure-storage.md`
- `12-requirement-review-and-verification.md`
- `13-payment-submission-and-verification.md`
- `15-vehicle-assignment-and-booking-confirmation.md`
- `16-rental-release-and-start.md`
- `17-rental-return-and-closure.md`
- `26-finder-booking-handoff.md`

## Token discipline
For VS018, broad repository search is specifically unnecessary. The current implementation already exposes the needed handoff and booking boundaries in the files above.
