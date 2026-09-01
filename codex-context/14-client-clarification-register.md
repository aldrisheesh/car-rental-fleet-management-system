# Client Clarification Register

**Status:** Active Client Validation Register
**Last updated:** 2026-09-01

Existing CQ-001 through CQ-026 remain active.

## CQ-027 — Smart Vehicle Finder Operational Restrictions

**Process:** Customer Browse / Smart Vehicle Finder

**Known**

Briah's current process primarily allows customers to choose vehicles directly rather than using a formal recommendation procedure.

The Smart Vehicle Finder is a researcher-designed capstone enhancement.

The baseline recommends only vehicles that are active, maintenance-ready, available for the requested period, capacity-sufficient, and within the customer's maximum total base-rental budget.

Preferred category is a ranking preference. Destination/travel area is captured for later context enrichment and creates no invented restriction in VS017.

**Missing detail**

Briah may have operational restrictions absent from the current canonical fleet model, such as particular vehicle/trip restrictions, special operational reservations, or other vehicle-specific limitations. These examples do not imply such rules exist.

**Researcher-designed baseline**

The development team determines the transparent baseline criteria/ranking from the study design, measurable customer needs, canonical fleet constraints, and related literature. Briah is not being asked to invent the algorithm.

**Question for Briah's**

> Sa current process po ninyo, customer normally ang pumipili ng vehicle. Para sa proposed Smart Vehicle Finder namin, ire-recommend lang ng system ang active, available, maintenance-ready, kasya sa passenger count, at pasok sa stated rental budget. May actual operational restriction po ba kayo na puwedeng maging dahilan para hindi namin i-recommend ang isang vehicle kahit pasado siya sa mga conditions na iyon?

**Implementation impact**

A confirmed restriction may later become an explicit canonical hard-eligibility rule if safely/deterministically representable.

Do not implement hypothetical examples until confirmed.

**Status:** Open — Client Validation

## Presentation Rule

Explain that the Finder is a researcher-designed enhancement because the current process relies on customer self-selection. Ask Briah to validate overlooked operational constraints and usability, not to design the recommendation algorithm.
