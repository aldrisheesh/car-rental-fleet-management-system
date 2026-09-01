# Changelog

## 2026-09-01 — Smart Vehicle Finder Baseline

Prepared the Development Baseline for VS017.

- Added `23-smart-vehicle-finder.md`.
- Clarified researcher-designed enhancement vs Briah's current customer self-selection process.
- Frozen required inputs: rental period, passenger count, maximum total base-rental budget.
- Frozen optional preferred category and destination/travel area.
- Destination is non-blocking until context integration.
- Frozen hard eligibility: active, VS012 maintenance-ready, period-available, capacity-sufficient, within total base-rental budget.
- Frozen ranking: preferred category, closest sufficient capacity, lower base rental cost, stable tie-break.
- Prohibited arbitrary match scores.
- Frozen transparent explanations and honest no-match behavior.
- Frozen VS017 UI scope to customer Browse.
- Deferred Finder->Booking/Admin integration to VS018.
- Added CQ-027 for overlooked operational restrictions rather than asking Briah to invent recommendation parameters.
