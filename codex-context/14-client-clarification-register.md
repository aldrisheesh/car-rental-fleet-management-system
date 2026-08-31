# Client Clarification Register

**Status:** Active Client Validation Register  
**Last updated:** 2026-09-01

Existing CQ-001 through CQ-023 remain active as previously defined.

## CQ-024 — Historical Booking Demand Data Availability

**Process:** Demand Forecasting / Historical Data

**Known**

The study requires weekly demand forecasting by branch and vehicle category using qualifying booking demand.

The system can generate trustworthy booking demand prospectively from canonical Confirmed bookings.

WMA requires at least three complete weekly observations before forecasting can begin.

**Missing detail**

It is not yet confirmed whether Briah's can provide historical booking/reservation records from before the system that contain enough information to reconstruct:

- scheduled rental start date;
- pickup/requested branch;
- requested vehicle or vehicle category;
- whether the booking proceeded/was accepted versus rejected/cancelled.

**Temporary implementation assumption**

VS014 uses canonical system booking history prospectively.

Do not fabricate pre-system zero-demand weeks or fake confirmed bookings merely to satisfy the three-week WMA requirement.

If insufficient real history exists:

- production/real mode returns `Insufficient historical data`;
- clearly labeled demo/test history may validate forecasting functionality separately.

**Question for Briah's**

> May historical booking/reservation records po ba kayo na puwedeng gamitin para sa forecasting? Kailangan po sana namin ang rental start date, requested/pickup branch, requested vehicle or category, at kung natuloy/accepted, rejected, o cancelled ang booking. Kahit spreadsheet, logbook, chat records, or existing digital records po, available ba ito?

**Implementation impact**

May allow historical demand import and immediate real-data WMA/MAPE evaluation instead of waiting for prospective system history.

**Status:** Open — Client Confirmation

## Presentation Rule

Demonstrate real-data behavior honestly. If real history is insufficient, show the controlled insufficient-data state and separately demonstrate WMA using explicitly labeled sample/test data.

Do not describe sample forecasts as measured Briah operational performance.
