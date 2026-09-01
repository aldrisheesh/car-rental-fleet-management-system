# Recommendation Specification

**Status:** Frozen through VS017 customer baseline and VS016 internal allocation recommendation
**Last updated:** 2026-09-01

There are two separate deterministic recommendation functions. Do not merge them.

## A. Customer-Side Smart Vehicle Finder

Canonical baseline rules: `23-smart-vehicle-finder.md`.

Briah's current process primarily lets customers select vehicles themselves. The Finder is a researcher-designed capstone enhancement.

Required inputs:
- rental start/end;
- passenger count;
- maximum total base-rental budget.

Optional:
- preferred vehicle category;
- destination/travel area.

Hard eligibility:
- active;
- maintenance-ready;
- period-available;
- capacity-sufficient;
- within total base-rental budget.

Ranking:
1. preferred category;
2. closest sufficient capacity;
3. lower total base rental cost;
4. stable deterministic tie-break.

No arbitrary match score. Destination is non-blocking until later context integration.

VS017 adds the guided Finder to customer Browse and stops before booking-context persistence/Admin visibility.

## B. Admin-Side Branch Allocation Recommendation

Canonical rules remain in `22-branch-allocation-recommendation.md`.

Use immutable VS015 evaluations, compatible shortage/surplus pairing, remaining-balance accounting, revalidated candidates, canonical idle ranking, and advisory Owner/Admin decision.

Do not auto-transfer vehicles.
