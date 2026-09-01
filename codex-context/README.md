# Briah's Car Rental — Codex Context
**Status:** Development Baseline active
**Last updated:** 2026-09-01

Completed through VS017 Smart Vehicle Finder baseline.

## VS018 next boundary
`26-finder-booking-handoff.md` freezes a narrow Finder -> existing Booking integration:

- carry Finder selection/requirements into Booking;
- prefill equivalent booking fields;
- server-revalidate Finder provenance;
- atomically persist a small immutable Finder context only with a submitted Finder-origin booking;
- show safe read-only context to Owner/Admin;
- preserve normal manual booking.

No payment, requirements, restricted-area, external-context, notification, or reservation-hold work belongs to VS018.

Use `25-canonical-subsystem-map.md` to avoid broad repository rediscovery.
