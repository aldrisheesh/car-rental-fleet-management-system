# Client Clarification Register

**Status:** Active Client Validation Register  
**Last updated:** 2026-08-31

This document records operational details that cannot be reliably determined from the current manuscript, validated interviews, frozen Codex context, or implemented system.

These items are intended for direct confirmation with Briah's Car Rental during client review/system presentation.

## Purpose

Development should not stop for every client-specific operational detail that is still unknown.

When a detail is not fully documented but a conservative, configurable temporary behavior can be implemented without damaging the architecture:

1. record the gap in this register;
2. document what is already known;
3. define the temporary implementation assumption;
4. keep that assumption configurable or isolated where practical;
5. continue development;
6. ask Briah's the exact question during client validation;
7. revise the implementation/context after confirmation.

A temporary assumption is **not** client-confirmed business truth.

If the missing answer would materially determine security, authorization, irreversible data modeling, or a core state machine and no safe provisional design exists, treat it as a blocking open decision instead.

## Status Values

- `Open — Client Confirmation`
- `Provisional — Implemented Assumption`
- `Confirmed`
- `Revised After Client Validation`
- `No Longer Applicable`

---

## CQ-001 — Components Included in the 50% Down-Payment Basis

**Process:** Payment / Booking

**Known**

The existing client interview establishes a required down payment of 50% of the total bill for securing the booking.

**Missing detail**

The exact composition of the "total bill" used as the basis for the 50% calculation is not fully documented.

It is unclear whether the calculation includes only the rental charge or may also include items such as:

- delivery/pick-up fees;
- driver fees;
- security deposit;
- other booking-specific charges.

**Temporary implementation assumption**

Keep the 50% rule separate from the definition of the charge base.

Do not permanently hard-code an undocumented composition of the total bill.

Where development needs an amount before client confirmation, use a clearly isolated/configurable calculation based on the currently known rental charge and label the business rule provisional.

**Question for Briah's**

> Kapag kino-compute po ninyo ang required 50% down payment, ano-ano po mismo ang kasama sa "total bill"? Rental rate × rental duration lang po ba, o kasama rin ang delivery/pick-up fee, driver fee, security deposit, at iba pang charges?

**Implementation impact**

May change payment amount calculation and booking/payment snapshots, but should not require changing the payment verification workflow.

**Status:** Open — Client Confirmation

---

## CQ-002 — Security Deposit Rule

**Process:** Payment / Rental Release / Settlement

**Known**

The existing client information mentions collection of a security deposit.

**Missing detail**

Not yet confirmed:

- standard amount or formula;
- whether it varies by vehicle/category;
- when it is collected;
- whether it is separate from the 50% down payment;
- return/refund timing;
- deductions and forfeiture conditions.

**Temporary implementation assumption**

Model security deposit separately from down payment if a foundation field is required.

Do not invent a fixed amount or automatic refund rule.

**Question for Briah's**

> Paano po ninyo kino-compute ang security deposit? Fixed amount po ba, depende sa sasakyan, o may formula? Kailan po ito binabayaran at kailan/sa anong conditions ito ibinabalik o binabawasan?

**Implementation impact**

Affects rental-release payment checks and final settlement/refund behavior.

**Status:** Open — Client Confirmation

---

## CQ-003 — Remaining Balance Timing

**Process:** Payment / Vehicle Release

**Known**

The known workflow indicates that the remaining balance is settled around vehicle turnover/release.

**Missing detail**

The exact mandatory timing is unclear.

**Temporary implementation assumption**

Treat the remaining balance as a separate later settlement/release concern.

Do not make payment-proof verification of the initial down payment automatically mean the entire booking is fully paid.

**Question for Briah's**

> Kailan po exactly kailangang fully paid ang remaining balance—before vehicle release, during turnover, or may cases po ba na puwedeng after release?

**Implementation impact**

Affects the future vehicle-release gate and rental-start transition.

**Status:** Open — Client Confirmation

---

## CQ-004 — Current Accepted Payment Methods and Business Account Details

**Process:** Payment

**Known**

Payments are manually checked against the business's external bank/e-wallet records.

The existing frontend payment account numbers and QR codes are prototype placeholders and are not authoritative.

**Missing detail**

The actual methods Briah's wants the system to present at deployment/client demo have not been finalized in the system context.

**Temporary implementation assumption**

Use configurable payment-method reference records.

Do not treat placeholder GCash/BPI/BDO account details or fake QR codes as real business payment information.

**Question for Briah's**

> Ano po ang current payment methods na gusto ninyong ipakita sa system? Maaari po ba naming kunin ang final account name, account/reference details, at QR images na authorized ninyong gamitin?

**Implementation impact**

Primarily configuration/reference-data changes if implemented cleanly.

**Status:** Open — Client Confirmation

---

## CQ-005 — Additional Requirements When Red Flags Exist

**Process:** Customer Requirements

**Known**

Baseline self-drive requirements are currently frozen as:

- Valid Government ID
- Driver's License

Existing client information indicates that additional documents may sometimes be requested when concerns/red flags appear.

**Missing detail**

The commonly requested additional documents and exact triggering situations are not documented.

**Temporary implementation assumption**

Keep the baseline two-document workflow.

Do not make additional documents universally mandatory.

Design future extension so Owner/Admin can request additional supporting requirements without restructuring the baseline model.

**Question for Briah's**

> Kapag may red flag po sa renter, ano po ang usual additional requirements na hinihingi ninyo, at kailan po ninyo hinihingi ang bawat isa?

**Implementation impact**

May extend the requirement-type model and resubmission UI.

**Status:** Open — Client Confirmation

---

## CQ-006 — Renter and Driver Are Different People

**Process:** Customer Requirements / Rental

**Known**

Current baseline implementation assumes the Customer/Renter is also the self-drive driver.

**Missing detail**

Requirements and verification rules when:

- renter/account holder is not the driver;
- multiple authorized drivers exist;
- a foreign/international-license driver is involved.

**Temporary implementation assumption**

Support the baseline same-renter/same-driver scenario only.

Do not invent alternate requirement matrices.

**Question for Briah's**

> Paano po ang requirements kapag ibang tao ang renter/account holder at ibang tao ang actual driver? May additional requirements po ba para sa additional/foreign driver?

**Implementation impact**

May introduce driver entities/relationships and scenario-specific requirements.

**Status:** Open — Client Confirmation

---

## CQ-007 — Requested Vehicle vs Actual Assigned Vehicle

**Process:** Booking / Vehicle Assignment

**Known**

Customer selection/recommendation and final Owner/Admin assignment are separate.

Owner/Admin makes the final assignment.

**Missing detail**

Operational substitution rules are not confirmed.

**Temporary implementation assumption**

Keep `requested_vehicle_id` and `assigned_vehicle_id` separate.

Allow later Owner/Admin assignment without assuming that the exact requested unit must always be used.

**Question for Briah's**

> Kapag may specific vehicle na ni-request ang customer pero hindi iyon ang pinaka-practical/available na unit, puwede po ba kayong mag-assign ng ibang unit? Same model/category lang po ba dapat, or puwedeng ibang category with customer approval?

**Implementation impact**

Affects assignment UI, customer confirmation messaging, and availability/conflict rules.

**Status:** Open — Client Confirmation

---

## CQ-008 — Vehicle Release / Turnover Checklist and Rental Start Event

**Process:** Vehicle Release / Rental Lifecycle

**Known**

The business checks the vehicle and customer-related conditions before turnover.

**Missing detail**

The exact checklist and the event that officially means the rental has started are not frozen.

**Temporary implementation assumption**

Do not start the canonical rental lifecycle merely because a booking is confirmed.

Keep a separate future vehicle-release/turnover action.

**Question for Briah's**

> Bago po i-release ang sasakyan, ano po ang exact checklist ninyo? Ano po ang final action/event na masasabi nating officially "released" na ang vehicle at nagsimula na ang rental?

**Implementation impact**

Determines rental-start transition, release records, and possibly odometer/fuel/damage snapshots.

**Status:** Open — Client Confirmation

---

## CQ-009 — Actual Vehicle Operational Status Vocabulary

**Process:** Fleet

**Known**

The system needs to represent operational eligibility and separate maintenance readiness from booking/rental state.

**Missing detail**

Briah's actual terminology and desired operational statuses are not fully documented.

**Temporary implementation assumption**

Do not freeze prototype values such as `Available`, `Reserved`, `Preparing`, `Rented`, or `Maintenance` as the final state machine.

Use derived/isolated presentation states until the lifecycle is confirmed.

**Question for Briah's**

> Ano po ang actual statuses na ginagamit ninyo para sa sasakyan from available hanggang ma-rent, maibalik, at ma-maintenance? Halimbawa, kailangan po ba ng statuses gaya ng Available, Reserved, Preparing, Released/Rented, Maintenance, at Inactive?

**Implementation impact**

Determines the canonical vehicle operational state machine.

**Status:** Open — Client Confirmation

---

## CQ-010 — Rental Extension Rules

**Process:** Active Rental

**Known**

The existing client information indicates that late/last-minute extension is discouraged and may incur penalties.

**Missing detail**

Not fully documented:

- how far in advance an extension must be requested;
- who approves it;
- conflict handling with the next booking;
- whether extension rate differs;
- how many times it may be extended.

**Temporary implementation assumption**

Do not implement automatic extension approval.

Treat extension as a later Owner/Admin-controlled workflow.

**Question for Briah's**

> Ilang oras/araw before the original return time dapat mag-request ng extension? Sino po ang nag-aapprove, at ano ang rule kapag may next booking na ang sasakyan?

**Implementation impact**

Affects active-rental mutation, booking-conflict logic, pricing, and notifications.

**Status:** Open — Client Confirmation

---

## CQ-011 — Late Return Penalty Calculation

**Process:** Rental Return / Charges

**Known**

Existing client information mentions a ₱3,000 late-return/extension-related penalty.

**Missing detail**

The exact calculation/trigger is not fully frozen:

- flat per incident;
- threshold-based;
- recurring after a number of hours;
- separate from extra rental-day charges.

**Temporary implementation assumption**

Do not automatically calculate a penalty from the ₱3,000 figure until the trigger is confirmed.

If demonstration needs the value, label it as a configurable policy/reference amount.

**Question for Briah's**

> Yung ₱3,000 late-return penalty po ba ay flat per incident? Kailan po exactly ito nag-aapply, at may additional per-hour/per-day charge pa po ba kapag lumampas pa?

**Implementation impact**

Affects settlement calculation and late-return automation.

**Status:** Open — Client Confirmation

---

## CQ-012 — Damage Charge / Penalty Matrix

**Process:** Vehicle Return / Settlement

**Known**

The business has detailed damage/penalty considerations for vehicle parts/interior/condition.

**Missing detail**

The authoritative charge matrix and whether values are fixed or assessed case-by-case are not available in the system specification.

**Temporary implementation assumption**

Future return processing may record damage findings and manually entered/approved charges.

Do not invent a complete automatic damage-pricing table.

**Question for Briah's**

> Maaari po ba naming makuha ang current damage/penalty list ninyo? Fixed po ba ang charge per damaged part/condition, o ina-assess ninyo case-by-case?

**Implementation impact**

Determines whether settlement charges are rule-based, configured reference values, or manually approved amounts.

**Status:** Open — Client Confirmation

---

## CQ-013 — Fuel Return Policy

**Process:** Vehicle Return / Settlement

**Known**

Fuel status is checked during vehicle return/turnover processes.

**Missing detail**

Not documented:

- required return fuel level;
- measurement method;
- charge formula for shortage;
- whether refueling/service fees apply.

**Temporary implementation assumption**

Record fuel level/status as return information when that slice is implemented.

Do not invent an automatic fuel-shortage charge formula.

**Question for Briah's**

> Ano po ang fuel policy ninyo sa return? Dapat po bang ibalik sa same fuel level? Kapag kulang, paano po ninyo kino-compute ang charge?

**Implementation impact**

Affects return checklist and settlement calculation.

**Status:** Open — Client Confirmation

---

## CQ-014 — Rental Completion / Final Settlement Gate

**Process:** Vehicle Return / Settlement

**Known**

Return processing includes vehicle condition, fuel, late return, remaining balance, and applicable charges.

**Missing detail**

The exact sequence and final condition for marking the rental completed are not frozen.

**Temporary implementation assumption**

Keep return inspection and final financial settlement as separate checks before a future explicit completion action.

**Question for Briah's**

> Pag naibalik na po ang vehicle, ano po ang exact steps ninyo bago ninyo ituring na fully completed/closed ang rental? Kailangan po bang settled muna lahat ng balance, penalties, damage, fuel, at deposit?

**Implementation impact**

Determines final rental transition and reporting eligibility.

**Status:** Open — Client Confirmation

---

## CQ-015 — Maintenance Workflow and Return-to-Service Authority

**Process:** Maintenance / Fleet

**Known**

The system must track maintenance records, PMS/service criteria, condition, and maintenance readiness.

**Missing detail**

The actual operational lifecycle is not documented, including:

- who opens a maintenance record;
- statuses used;
- who marks work complete;
- whether inspection is required before return to rental availability;
- who has final authority to return the vehicle to service.

**Temporary implementation assumption**

Keep the deterministic maintenance-readiness gate separate from the future maintenance lifecycle.

Do not infer a full maintenance state machine from prototype statuses.

**Question for Briah's**

> Ano po ang actual maintenance process ninyo from pag-report ng issue/PMS hanggang maging available ulit ang sasakyan? Sino po ang nag-uupdate at sino ang final na nag-aapprove na rental-ready na ulit?

**Implementation impact**

Determines maintenance status transitions and vehicle operational availability.

**Status:** Open — Client Confirmation

---

## CQ-016 — Operations Staff Reservation Editing Scope

**Process:** Roles / Booking Coordination

**Known**

Operations Staff may coordinate permitted reservation details but must not have payment-verification, requirement-verification, final booking-confirmation, or final vehicle-assignment authority.

**Missing detail**

The exact booking fields Staff may edit are not enumerated.

**Temporary implementation assumption**

Use least privilege.

Until confirmed, Staff remains primarily read/coordination-oriented and is not given broad booking mutations.

**Question for Briah's**

> Sa staff account po, alin exactly sa reservation details ang gusto ninyong puwedeng i-edit nila? Halimbawa dates, pick-up/delivery details, destination, contact information, notes, etc.?

**Implementation impact**

Determines Operations Staff write permissions and RLS/server authorization.

**Status:** Open — Client Confirmation

---

## Presentation Use

During the client system presentation:

1. demonstrate the relevant screen/process first;
2. explain the behavior currently implemented;
3. state the information already confirmed from prior interviews;
4. ask the specific clarification question;
5. record the client's answer verbatim or as accurately as possible;
6. mark the item `Confirmed` or `Revised After Client Validation`;
7. update the appropriate Codex-context specification and implementation afterward.

Do not ask the client to re-answer already confirmed facts unless clarification is necessary because an earlier answer is ambiguous.

## Adding New Items

New client-specific gaps should be added as:

`CQ-###`

Each entry must include:

- Process
- Known
- Missing detail
- Temporary implementation assumption
- Question for Briah's
- Implementation impact
- Status
