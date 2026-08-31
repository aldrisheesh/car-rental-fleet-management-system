# Client Clarification Register

**Status:** Active Client Validation Register  
**Last updated:** 2026-09-01

Existing CQ-001 through CQ-024 remain active as previously defined.

## CQ-025 — Additional Future-Supply Reserve / Availability Rules

**Process:** Fleet Forecasting / Projected Supply

**Known**

For the proposed decision-support logic, projected supply counts active, maintenance-ready vehicles without conflicting booking/rental commitments in the evaluated branch/category/week.

The study's shortage/surplus formulas already preserve each branch's own forecasted required units before any surplus is declared.

`CQ-018` separately tracks the exact turnaround/preparation buffer between bookings.

**Missing detail**

It is not confirmed whether Briah applies additional operational reserve rules when deciding whether a vehicle should be treated as safely available for a future week, for example:

- always keeping one spare unit at a branch;
- excluding vehicles with known non-maintenance operational concerns;
- reserving particular units for special clients/use;
- other branch-specific practices.

**Temporary implementation assumption**

VS015 uses only the frozen known eligibility rules:

- current branch/category;
- active;
- maintenance eligible;
- no overlapping Confirmed assigned booking;
- no canonical rental conflict;
- no invented reserve threshold.

Do not subtract an arbitrary spare-vehicle reserve.

**Question for Briah's**

> Kapag tinitingnan po ninyo kung ilang sasakyan ang talagang available for a future week, may extra reserve rule po ba kayo bukod sa confirmed bookings, active rentals, at maintenance? Halimbawa, kailangan laging may isang spare unit sa branch, may units na hindi puwedeng ilipat, or may ibang operational reservation?

**Implementation impact**

May later reduce projected transferable surplus or add explicit operational-exclusion rules.

**Status:** Open — Client Confirmation

## Presentation Rule

Show the baseline supply calculation transparently and explain that no hidden reserve has been invented.

If Briah confirms additional rules, add them explicitly rather than silently changing the calculation.
