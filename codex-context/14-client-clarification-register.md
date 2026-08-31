# Client Clarification Register

**Status:** Active Client Validation Register  
**Last updated:** 2026-09-01

This register tracks Briah-specific operational details that are not fully captured in the manuscript/interviews but can be validated during the client system presentation.

Temporary assumptions are not client-confirmed truth.

## CQ-001 — Components Included in the 50% Down-Payment Basis
**Process:** Payment  
**Status:** Open — Client Confirmation

## CQ-002 — Security Deposit Rule
**Process:** Payment / Release / Settlement  
**Status:** Open — Client Confirmation

## CQ-003 — Remaining Balance Timing
**Process:** Payment / Vehicle Release  
**Status:** Open — Client Confirmation

## CQ-004 — Production Payment Methods / Accounts
**Process:** Payment  
**Status:** Open — Client Confirmation

## CQ-005 — Additional Requirements for Red Flags
**Process:** Requirements  
**Status:** Open — Client Confirmation

## CQ-006 — Renter and Driver Are Different People
**Process:** Requirements / Rental  
**Status:** Open — Client Confirmation

## CQ-007 — Requested Vehicle vs Actual Assigned Vehicle
**Process:** Booking / Assignment  
**Status:** Open — Client Confirmation

## CQ-008 — Vehicle Release / Turnover Checklist and Official Rental Start Event

**Process:** Vehicle Release / Rental Start

**Known**

The manuscript states that before turnover the selected vehicle is prepared and checked, including availability, physical condition, existing damages, fuel status, rental agreement coordination, penalties, return schedule, and important reminders.

The defended use case states that Owner/Admin confirms vehicle turnover.

**Missing detail**

The exact checklist Briah's actually follows and the precise operational event they consider the official start of a rental are not fully documented.

**Temporary implementation assumption**

Keep booking `Confirmed` separate from rental start.

Create the active rental only when Owner/Admin explicitly records vehicle release/turnover.

Record a conservative turnover snapshot without claiming that the provisional checklist is complete.

**Question for Briah's**

> Bago po i-release ang vehicle, ano po ang exact checklist na sinusunod ninyo? At ano po ang exact event na considered officially nagsimula na ang rental—pag-turnover ng susi/unit, pag-sign ng agreement, pag-alis ng vehicle, o ibang step?

**Implementation impact**

May change required release fields, role permissions, and the exact rental-start gate.

**Status:** Open — Client Confirmation

## CQ-009 — Actual Vehicle Operational Status Vocabulary
**Process:** Fleet  
**Status:** Open — Client Confirmation

## CQ-010 — Rental Extension Rules
**Process:** Active Rental  
**Status:** Open — Client Confirmation

## CQ-011 — Late Return Penalty Calculation
**Process:** Return / Charges  
**Status:** Open — Client Confirmation

## CQ-012 — Damage Charge / Penalty Matrix
**Process:** Return / Settlement  
**Status:** Open — Client Confirmation

## CQ-013 — Fuel Return Policy
**Process:** Return / Settlement  
**Status:** Open — Client Confirmation

## CQ-014 — Rental Completion / Final Settlement Gate
**Process:** Return / Settlement  
**Status:** Open — Client Confirmation

## CQ-015 — Maintenance Workflow / Return-to-Service Authority
**Process:** Maintenance  
**Status:** Open — Client Confirmation

## CQ-016 — Operations Staff Reservation / Turnover Scope
**Process:** Roles  
**Status:** Open — Client Confirmation

## CQ-017 — Cross-Branch Vehicle Assignment / Repositioning
**Process:** Booking / Fleet  
**Status:** Open — Client Confirmation

## CQ-018 — Vehicle Preparation / Turnaround Buffer Between Bookings
**Process:** Booking Availability  
**Status:** Open — Client Confirmation

## CQ-019 — Financial Prerequisites Before Vehicle Release

**Process:** Payment / Vehicle Release

**Known**

A verified down payment is required before booking confirmation.

The existing materials also mention a remaining balance and security deposit around the broader rental/turnover process.

**Missing detail**

It is not fully documented whether vehicle release is strictly blocked until:

- the remaining 50% balance is fully settled;
- the security deposit is paid;
- both are completed;
- or Briah's sometimes permits exceptions.

**Temporary implementation assumption**

Do not invent a hard remaining-balance/security-deposit release gate.

A Confirmed booking may proceed through the provisional release workflow while these client-specific financial rules remain pending validation.

**Question for Briah's**

> Bago po actual na i-release ang sasakyan, required po bang fully settled muna ang remaining balance at security deposit? May exceptions po ba, at alin ang mandatory bago ibigay ang unit/key?

**Implementation impact**

May add pre-release financial gates and additional payment types before rental start.

**Status:** Open — Client Confirmation

## CQ-020 — Odometer and Fuel Recording Convention at Turnover

**Process:** Vehicle Release / Fleet Records

**Known**

Vehicle condition and fuel are checked around turnover, and the proposed system includes mileage/odometer tracking as part of fleet/maintenance records.

**Missing detail**

It is not confirmed:

- whether Briah's always records odometer at release;
- how fuel level is represented (gauge fractions, percentage, bars, text, photo);
- whether photos are required;
- whether these values are mandatory before release.

**Temporary implementation assumption**

Allow optional release odometer.

Record fuel through a simple provisional descriptive level when the VS010 UI requires it.

Do not create a fuel-charge formula from the release value.

**Question for Briah's**

> Sa actual turnover po, lagi po ba kayong nagre-record ng odometer? Paano po ninyo nire-record ang fuel level—percentage, 1/4/1/2/3/4/full, dashboard bars, photo, o ibang format? Required po ba ang pictures?

**Implementation impact**

May change release field requirements, UI controls, photo/storage needs, and later return comparison.

**Status:** Open — Client Confirmation

## Presentation Rule

Show the relevant working system flow first, explain the temporary assumption, then ask the specific client question.

After validation, revise the authoritative specification and implementation rather than silently changing behavior.
