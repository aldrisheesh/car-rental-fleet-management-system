# Changelog

## 2026-09-01 — VS018 Finder -> Booking handoff baseline
- Added `26-finder-booking-handoff.md`.
- Frozen handoff into the existing Booking page instead of creating a second booking flow.
- Frozen prefill of equivalent Finder fields.
- Frozen separate immutable booking Finder provenance.
- Frozen trusted server revalidation instead of trusting client rank/provenance.
- Frozen atomic booking + Finder-context persistence.
- Frozen Admin read-only Finder-context display.
- Preserved normal manual booking.
- Explicitly deferred restricted areas, external context, payment/requirements changes, Finder history/analytics, and temporary vehicle holds.
- Tightened `25-canonical-subsystem-map.md` with exact VS018 starting files.
