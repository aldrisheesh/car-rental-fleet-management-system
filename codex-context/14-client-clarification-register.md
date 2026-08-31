# Client Clarification Register

**Status:** Active Client Validation Register  
**Last updated:** 2026-09-01

Temporary assumptions are not client-confirmed truth.

Existing client questions remain active as previously recorded (`CQ-001` through `CQ-016`).

## Assignment Clarifications

### CQ-007 — Requested Vehicle vs Actual Assigned Vehicle

**Process:** Booking / Vehicle Assignment  
**Status:** Open — Client Confirmation

**Question**

> Kapag may specific vehicle na ni-request ang customer pero hindi iyon ang pinaka-practical/available na unit, puwede po ba kayong mag-assign ng ibang unit? Same model/category lang po ba dapat, at kailangan po ba ng customer approval?

**Temporary assumption**

Owner/Admin may explicitly assign a different active vehicle. The mismatch is visible and requires acknowledgement/note. No automatic substitution or invented customer-approval workflow.

### CQ-017 — Cross-Branch Vehicle Assignment / Repositioning

**Process:** Booking / Fleet / Branch Operations  
**Status:** Open — Client Confirmation

**Known**

Vehicles have a canonical master branch and bookings have pickup branches.

**Missing detail**

Whether a vehicle currently based at another branch may be directly assigned/repositioned for the booking and whether a formal branch transfer is required first.

**Temporary assumption**

Cross-branch assignment is not automatically blocked. The mismatch is shown, acknowledgement/note is required, and vehicle master `branch_id` is not changed automatically.

**Question**

> Kapag ang available na unit ay nasa ibang branch kaysa sa pickup branch ng booking, puwede po ba ninyo itong i-assign agad at i-reposition bago pickup? Kailangan po ba muna ng formal branch transfer sa system, o temporary movement lang?

**Implementation impact**

May affect assignment eligibility, branch-transfer workflow, projected supply, and master branch updates.

### CQ-018 — Vehicle Preparation / Turnaround Buffer Between Bookings

**Process:** Booking Availability / Vehicle Preparation  
**Status:** Open — Client Confirmation

**Known**

The same vehicle must not be assigned to overlapping confirmed bookings.

**Missing detail**

Whether Briah's requires a minimum preparation/cleaning/inspection buffer between return and the next pickup.

**Temporary assumption**

Use half-open booking intervals `[pickup_at, return_at)` with no invented buffer.

**Question**

> May required preparation/cleaning/inspection allowance po ba kayo between return ng isang renter at pickup ng next renter? Halimbawa kailangan po ba ng 1–2 hours or mas mahaba bago ma-book ulit ang unit?

**Implementation impact**

May change conflict/availability calculations and assignment eligibility.

## Presentation Rule

Demonstrate the current system behavior, state the provisional assumption, then ask the client-specific question. After confirmation, update the authoritative specification and implementation.
