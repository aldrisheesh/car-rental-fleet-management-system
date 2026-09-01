# Briah's Car Rental — Codex Context

**Status:** Development Baseline v1 active
**Last updated:** 2026-09-01

## Progression

1. Maintenance/readiness — VS012
2. Utilization/idle — VS013
3. Demand forecasting — VS014
4. Projected supply/demand balance — VS015
5. Internal branch allocation recommendation — VS016
6. Customer Smart Vehicle Finder baseline — VS017
7. Finder -> booking context integration
8. External context foundation/enrichment
9. Notifications / audit / reporting / UX consolidation

## VS017 Boundary

VS017 adds the customer-facing baseline Smart Vehicle Finder to Browse:
- guided trip-needs form;
- canonical hard eligibility;
- deterministic ranking;
- Why this fits explanations;
- honest no-match guidance.

It excludes external context APIs, Finder-to-booking persistence, Admin Finder context, recommendation history, and match scores.

See `06-recommendation-specification.md`, `23-smart-vehicle-finder.md`, and CQ-027.

## Research Boundary

Briah's current process primarily relies on customer self-selection. The Finder is a researcher-designed capstone enhancement. Client validation focuses on usability and overlooked operational restrictions.
