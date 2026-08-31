# Client Clarification Register

**Status:** Active Client Validation Register  
**Last updated:** 2026-09-01

Existing CQ-001 through CQ-020 remain active as previously defined.

## CQ-021 — Exact Vehicle Return Inspection Checklist

**Process:** Vehicle Return

**Known**

The manuscript indicates that upon return the vehicle is inspected for condition, fuel, late return, balances, penalties, and other settlement concerns.

**Missing detail**

The exact Briah checklist is not documented, including whether they systematically record:

- odometer;
- fuel;
- exterior condition;
- interior condition;
- tires/glass/accessories;
- photos;
- missing items;
- cleanliness;
- signatures/acknowledgements.

**Temporary implementation assumption**

VS011 records a conservative return snapshot:

- optional odometer;
- provisional fuel level;
- return condition summary;
- observed damage/condition notes;
- optional remarks.

Do not make a larger speculative checklist mandatory.

**Question for Briah's**

> Pagbalik po ng vehicle, ano po ang exact inspection checklist ninyo? Ano po ang required na i-record—odometer, fuel, exterior/interior condition, pictures, missing accessories, cleanliness, signatures, etc.?

**Implementation impact**

May add mandatory return fields, photos/storage, or structured inspection items.

**Status:** Open — Client Confirmation

---

## CQ-022 — Physical Return vs Financial Closure

**Process:** Vehicle Return / Settlement

**Known**

The system needs both a physical vehicle-return event and later settlement of applicable balances/penalties.

**Missing detail**

It is unclear whether Briah's considers the rental operationally ended as soon as the vehicle is physically returned, or only after all financial obligations are settled.

**Temporary implementation assumption**

VS011 ends the physical rental when Owner/Admin records actual vehicle return.

Financial settlement remains a separate later capability.

Do not claim this is Briah's permanent accounting/closure policy.

**Question for Briah's**

> Kapag physically naibalik na po ang vehicle pero may remaining balance, damage, fuel, late fee, o deposit concern pa, considered ended na po ba ang rental at settlement na lang ang pending? O saka lang po ninyo kino-close ang rental kapag fully settled na lahat?

**Implementation impact**

May alter lifecycle naming, reporting, and the final completion gate.

**Status:** Open — Client Confirmation

## Presentation Rule

Demonstrate the implemented provisional flow first, explain the temporary assumption, then ask the client-specific question.

After confirmation, update the authoritative specification and implementation.
