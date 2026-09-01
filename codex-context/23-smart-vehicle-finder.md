# Smart Vehicle Finder Specification

**Status:** Frozen for VS017 Baseline Customer Recommendation
**Last updated:** 2026-09-01

Briah's current process primarily allows customers to choose vehicles themselves. The Smart Vehicle Finder is therefore a researcher-designed capstone decision-support enhancement, not a digitization of an existing Briah recommendation procedure.

## Purpose

Place a guided recommendation experience on customer Browse Vehicles before booking submission.

Flow:

Customer requirements -> hard fleet eligibility -> deterministic ranking -> transparent recommendations -> customer may inspect/select a vehicle.

VS017 stops before recommendation-to-booking persistence.

## Baseline Customer Inputs

Required:
- requested rental start/end;
- passenger count;
- maximum total base-rental budget.

Optional:
- preferred vehicle category;
- destination/travel area.

Do not ask the customer to enter travel distance. Later context integration may derive it.

## Destination

Capture destination/travel area for later context enrichment.

In VS017 it is non-blocking and must not create invented rules such as "Baguio requires SUV" or "provincial trip requires diesel."

## Hard Eligibility

Recommend only vehicles that:
1. exist canonically;
2. are active;
3. are VS012 Maintenance Ready;
4. have no conflicting canonical booking/rental commitment for the requested period;
5. have known passenger capacity >= requested passengers;
6. have safely computable total base rental cost;
7. have total base rental cost <= maximum budget.

Reuse canonical availability, pricing-duration, and maintenance logic where it exists. Do not infer capacity from category/name.

## Budget

Budget means maximum TOTAL BASE RENTAL budget for the requested period, not daily budget.

Do not include unconfirmed fuel, damage, deposit, late, or settlement charges.

## Preferred Category

Optional ranking preference, not hard eligibility. Nonmatching categories may remain recommended alternatives.

## Ranking

After eligibility:
1. preferred category match first, when supplied;
2. smallest sufficient capacity excess;
3. lower estimated total base rental cost;
4. stable canonical vehicle identifier/name tie-break.

No match percentage, AI score, confidence score, or arbitrary weighted score.

## Explanations

Return safe human-readable reasons such as:
- Available for your selected dates
- Seats your group of 5
- Within your maximum base-rental budget
- Matches your SUV preference
- Maintenance-ready
- Suitable alternative despite a different preferred category

Do not expose raw maintenance/internal booking information.

## No Match

Never relax hard constraints merely to return a result.

Provide honest guidance such as capacity/budget/availability limitations where safely determinable and allow input adjustment or return to ordinary Browse.

## Browse UI

Preserve normal Browse/manual filters.

Add a prominent guided entry point such as:

`Find the Right Vehicle`

with supporting copy such as:

`Tell us about your trip and we'll suggest suitable vehicles.`

A compact expandable/card experience is preferred over an unnecessary separate wizard when compatible with the existing UI.

## Result UI

Keep results within or naturally connected to Browse.

Show at minimum:
- existing vehicle identity/image;
- category;
- passenger capacity;
- estimated total base rental cost;
- recommendation order;
- Why this fits;
- existing View Vehicle/selection affordance where available.

Clearly distinguish Finder results from ordinary filtered Browse results.

## Authorization / Data Safety

Return only customer-safe vehicle information.

Never expose maintenance records/cost/remarks, other renter information, administrative notes, forecasts, supply, or allocation analytics.

## Admin / Persistence Boundary

VS017 adds no Admin recommendation UI.

VS017 does not persist Finder sessions/results canonically.

Finder-to-booking context and Admin visibility belong to VS018.

## External Context Boundary

No weather/geocoding/routing/road API calls in VS017.

The baseline Finder must work without external providers.

## Research / Client Boundary

The baseline criteria are researcher-designed from study objectives, measurable customer needs, canonical fleet constraints, available system data, and related literature.

Briah validates practical usability and identifies overlooked operational restrictions; Briah is not expected to invent the recommendation algorithm.

## Testing

Test at minimum:
- inactive excluded;
- maintenance-not-ready excluded;
- conflicting vehicle excluded;
- insufficient/unknown capacity excluded;
- over-budget excluded;
- exact-budget eligible;
- preferred category ranks first;
- nonmatching category can remain eligible;
- closest sufficient capacity ranking;
- lower total base rental cost tie-break;
- deterministic final tie-break;
- destination does not create hard eligibility;
- no arbitrary score;
- customer-safe response only;
- honest no-match behavior;
- normal Browse remains available.

## Client Validation

Track operational restrictions under CQ-027.

## Warning to Codex

Do not turn Finder into ordinary filtering only, invent destination rules, add external APIs, merge it with Admin allocation, expose maintenance internals, create match percentages, relax hard constraints, persist recommendation history, modify Admin booking UI, implement booking integration, or begin VS018.
