# VS024 Manuscript Traceability

**Status:** Frozen
**Last updated:** 2026-09-02

## Direct Manuscript Support

### R11
The system shall provide context-aware decision support for Owner/Admin using weather, road condition, route feasibility, route accessibility, travel distance, reference fuel efficiency, and estimated fuel consumption. These inputs support administrative vehicle-assignment and branch-allocation decisions and do not independently determine final action.

### R8
Branch allocation remains advisory and does not automatically transfer/reassign vehicles.

### Allocation Use Case
The Owner/Admin:
1. opens allocation recommendation;
2. selects/reviews criteria;
3. reviews availability;
4. reviews contextual factors;
5. reviews recommended allocation;
6. decides final action.

VS024 implements the missing contextual-factor review without changing the canonical recommendation algorithm.

## Current-System Placement

Booking assignment:
`src/routes/admin.bookings.tsx`

Allocation review:
`src/routes/admin.decisions.tsx` + canonical allocation recommendation API.

Do not create a standalone context business module/page.

## Researcher-Designed Gap Resolution

The manuscript does not define an exact transfer timestamp for allocation recommendations.

VS024 therefore displays **current route context for transfer review** rather than pretending the target forecast week is an exact transfer time.

This should be documented as an implementation detail/MIC if retained.

## Obsolete Prototype Reconciliation

The current Decision Support UI still contains a hard-coded Admin vehicle-recommendation card from before recommendation moved customer-side.

VS024 may remove/replace this prototype with canonical context-aware decision support.

This aligns the UI with the later R10/R11 separation.

## Must Not Contradict

- Customer Smart Vehicle Finder remains customer-side and deterministic;
- context does not rank/assign vehicles automatically;
- allocation quantities/ranks remain unchanged;
- Owner/Admin decides final action;
- CQ-028 remains unresolved;
- no live GPS tracking.
