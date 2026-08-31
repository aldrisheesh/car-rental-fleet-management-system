# Demand Extraction and Forecasting Boundary

**Status:** Frozen for VS014 Demand Forecasting Implementation  
**Last updated:** 2026-09-01

This document binds the existing WMA/MAPE specification to the canonical booking data implemented in the repository.

## 1. Purpose

VS014 must forecast short-term weekly vehicle demand per:

- branch;
- vehicle category.

It must use qualifying booking demand from canonical booking records and must not substitute rental utilization, rental days, or mock demand arrays.

## 2. Business Timezone and Week Boundary

Use:

`Asia/Manila`

for demand aggregation.

Calendar week:

- starts Monday 00:00 Asia/Manila;
- ends at the next Monday 00:00 Asia/Manila;
- represented as a half-open interval `[week_start, next_week_start)`.

The scheduled rental start timestamp/date determines which demand week receives the booking.

Do not group weeks using browser timezone.

## 3. Canonical Demand Source

Use canonical booking requests / booking records.

A qualifying weekly observation counts bookings that proceeded into the accepted/confirmed booking flow.

For the current baseline, a booking qualifies when:

`booking_status = Confirmed`

and it has the canonical branch/category inputs required for aggregation.

Do not count:

- Submitted-only booking requests;
- Rejected bookings;
- Cancelled bookings;
- duplicate/sample UI rows;
- rental days;
- payment rows;
- vehicle utilization rows.

A Confirmed booking is counted once in the week of its scheduled rental start.

## 4. Branch Attribution

Use the booking's canonical requested pickup branch for demand attribution.

Demand represents where the customer requested service.

Do not attribute historical demand to a vehicle's later/current branch if that differs.

## 5. Vehicle Category Attribution

Use the canonical requested vehicle/category intent preserved by the booking.

Where the booking has `requested_vehicle_id`, resolve that vehicle's canonical vehicle category as the demand category.

Do not use `assigned_vehicle_id` as the demand category because substitution may occur after customer demand was expressed.

If a booking cannot be mapped to a trustworthy requested vehicle category, do not silently force it into another category.

Treat the observation as incomplete for branch/category forecasting data integrity and surface it in data-quality diagnostics where practical.

## 6. Complete Weekly Observations

Forecast inputs must be complete calendar weeks.

The current partial week must never be used as an actual weekly observation.

For a given branch/category, a completed week with zero qualifying bookings is a valid `0` observation only when:

- the canonical booking data source is considered available/complete for that week under the system's historical coverage;
- the week is not merely outside trustworthy system/client history.

Do not manufacture historical zero-demand weeks before trustworthy booking coverage begins.

## 7. Historical Demand Coverage

The system must distinguish:

- a known complete week with zero demand;
- a week for which historical booking data are unavailable/incomplete.

For repository-generated prospective data, trustworthy booking coverage begins no earlier than the system's canonical booking-history availability.

If older client history is later imported, it may extend coverage through an explicit, validated import process.

Until then, insufficient coverage must lead to:

`Insufficient historical data`

rather than invented zeros.

## 8. Three Most Recent Actual Observations

For each branch/category forecast run:

- identify the three most recent complete weekly actual observations within trustworthy coverage;
- retain zero-demand completed weeks between/among them;
- observations must represent consecutive completed calendar weeks when coverage is continuous.

Do not skip a complete zero-demand week merely to find three nonzero weeks.

If three complete trustworthy weekly observations do not exist:

do not generate WMA forecast values.

## 9. Fixed WMA

Weights remain:

- newest input = 0.50
- second newest = 0.30
- third newest = 0.20

Week +1:

`F1 = 0.50*D0 + 0.30*D1 + 0.20*D2`

Week +2:

`F2 = 0.50*F1 + 0.30*D0 + 0.20*D1`

Week +3:

`F3 = 0.50*F2 + 0.30*F1 + 0.20*D0`

Do not change the weights or substitute another method.

## 10. Forecast Target Weeks

The forecast run anchor is the most recently completed demand week.

The forecast targets are the next three calendar weeks:

- horizon 1;
- horizon 2;
- horizon 3.

Use explicit week start/end values.

## 11. Decimal Forecast and Required Units

Store/return WMA decimal forecast without prematurely rounding it.

For fleet-planning requirement:

`RequiredVehicleUnits = ceil(ForecastedDemand)`

Do not round positive fractional demand down.

## 12. Forecast Run Persistence

Forecasts require historical fidelity.

Persist an immutable run/group with generated timestamp.

A run must preserve per branch/category:

- run ID;
- branch;
- vehicle category;
- horizon;
- target week;
- decimal forecast;
- required units;
- generation timestamp.

Do not overwrite historical runs when later forecast runs target the same calendar week.

## 13. Forecast Input Detail

Persist or otherwise canonically associate the three WMA input details for each forecast record.

Each detail must preserve:

- source type: `Actual` or `Forecast`;
- source week/period;
- source value;
- recency/order;
- assigned weight;
- weighted contribution.

Recursive horizons must correctly mark forecast-derived inputs.

## 14. Actual Demand Finalization

When a forecast target week later becomes complete:

- derive actual demand from the same canonical qualifying-demand extractor;
- associate actual demand with applicable historical forecast records;
- calculate APE only when actual demand > 0.

Do not overwrite the forecasted decimal value.

## 15. APE

For actual `A > 0` and forecast `F`:

`APE = abs((A - F) / A) * 100`

When `A = 0`:

- actual remains valid;
- APE remains null/undefined.

## 16. Primary MAPE

Primary MAPE uses only historical:

`horizon = 1`

forecast records with:

- finalized actual demand;
- actual > 0.

Do not mix horizon 2/3 into primary MAPE.

Do not include zero-actual observations in the MAPE divisor.

Do not attach unsupported qualitative accuracy labels.

## 17. Forecast Generation Authority

Forecast values are computed system decision-support outputs.

Owner/Admin may run/view forecasts but may not manually edit computed WMA values.

Operations Staff may receive safe read-only forecast information where useful.

Customer/Renter does not receive internal branch/category demand forecasting.

## 18. Idempotency / Duplicate Runs

An explicit forecast-generation request must not accidentally create duplicate records because of browser retries or double-clicks.

Use a suitable request/run identifier or server-side duplicate protection for the same explicit generation action.

Do not collapse legitimately separate forecast runs generated at different times.

## 19. Data Quality Result

Where forecasting cannot proceed, return controlled diagnostics such as:

- Insufficient historical data
- Historical booking coverage incomplete
- Booking category mapping unavailable

Do not substitute synthetic actuals unless explicitly operating in clearly labeled demo/test mode.

## 20. Demo / Simulated Data

Demo demand history may be used for validation when client history is insufficient.

It must be explicitly labeled sample/simulated and isolated from real operational forecast evidence.

Do not silently seed fake historical bookings into production-like canonical records solely to make WMA produce a number.

## 21. Out of Scope

VS014 does not implement:

- projected available supply;
- shortage/surplus computation;
- branch allocation;
- external contextual APIs;
- automatic vehicle transfers;
- customer Smart Vehicle Finder;
- qualitative MAPE interpretations.

## 22. Warning to Codex

Do not:

- forecast from rental days or utilization;
- count Submitted bookings as qualifying demand;
- attribute demand to assigned substituted vehicle/category;
- use the current partial week as actual history;
- fabricate zero-demand history outside trustworthy coverage;
- skip zero-demand complete weeks;
- change WMA weights;
- round WMA before analytical storage;
- overwrite historical forecast runs;
- mix horizons in primary MAPE;
- invent accuracy labels.
