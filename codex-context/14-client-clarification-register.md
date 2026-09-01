# Client Clarification Register

**Status:** Active Client Validation Register  
**Last updated:** 2026-09-01

Existing CQ-001 through CQ-025 remain active.

## CQ-026 — Allocation Approval and Actual Vehicle Selection

**Process:** Branch Allocation Recommendation / Transfer Review

**Known**

The system can rank eligible source vehicles for a recommended transfer quantity.

Owner/Admin may approve the recommended quantity or a lower quantity.

The actual cross-branch transfer remains human-controlled.

**Missing detail**

It is not yet known whether Briah's:

- approves quantity first and chooses exact vehicles later;
- approves specific vehicle units at the same time;
- allows replacing a recommended candidate with another eligible unit;
- requires separate dispatcher/receiver confirmation.

**Temporary implementation assumption**

VS016 preserves:

- immutable ranked candidate list;
- recommended quantity;
- approved quantity;
- Approved/Rejected decision.

It does not claim approval of N units automatically selects or transfers the first N ranked vehicles.

No `vehicles.branch_id` mutation occurs.

**Question for Briah's**

> Kapag may recommendation po na maglipat halimbawa ng 2 SUVs from Branch A to Branch B, sa approval po ba ninyo pipiliin na agad kung aling exact 2 vehicles ang ililipat, o quantity muna ang ina-approve tapos saka pipiliin ang actual units? Puwede rin po bang palitan ang recommended vehicle ng ibang eligible unit?

**Implementation impact**

Determines item-level approval persistence and later transfer execution.

**Status:** Open — Client Confirmation
