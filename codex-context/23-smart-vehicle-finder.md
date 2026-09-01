# Smart Vehicle Finder Specification

**Status:** Frozen through VS018 handoff
**Last updated:** 2026-09-01

VS017 established the baseline Finder:
- required rental period, passenger count, total base-rental budget;
- optional preferred category and destination;
- active + maintenance-ready + period-available + capacity-sufficient + within-budget eligibility;
- deterministic ranking by preferred category, closest sufficient capacity, lower base-rental cost, stable tie-break;
- no arbitrary score;
- destination non-blocking.

VS018 adds only the canonical handoff into Booking.

For handoff/persistence authority, see:
`26-finder-booking-handoff.md`

Important:
- Finder result is not a reservation lock;
- the booking server revalidates Finder provenance;
- only actually submitted Finder-origin bookings persist context;
- normal Browse/manual Booking remains valid;
- Admin sees Finder context only as read-only booking provenance;
- no external context/restricted-area rule is added yet.
