# Forecasting Specification — WMA and MAPE

**Status:** Frozen for Development Baseline v1  
**Last updated:** 2026-09-01

## 1. Forecast Purpose and Granularity

The system uses **Weighted Moving Average (WMA)** to generate short-term weekly vehicle-demand forecasts for each:

- branch
- vehicle category

Forecasting is advisory decision support and is not AI/ML.

Canonical extraction and repository binding are defined in:

`20-demand-extraction-and-forecasting-boundary.md`

## 2. Forecast Target Variable

For branch `b`, category `c`, and completed calendar week `t`:

`D[b,c,t] = count of qualifying bookings with scheduled rental start date in week t`

Qualifying demand uses canonical Confirmed booking demand under the VS014 boundary.

Rental duration and vehicle utilization are not WMA demand-count inputs.

## 3. Aggregation Period

Calendar week in `Asia/Manila`:

Monday 00:00 through next Monday 00:00, half-open.

The current incomplete week is not an actual observation.

## 4. WMA Window and Weights

Three-period WMA:

- most recent actual/input: `0.50`
- second-most recent: `0.30`
- third-most recent: `0.20`

Weights are fixed study parameters.

## 5. Forecast Horizon

Week +1:

`F[t+1] = 0.50*D[t] + 0.30*D[t-1] + 0.20*D[t-2]`

Week +2:

`F[t+2] = 0.50*F[t+1] + 0.30*D[t] + 0.20*D[t-1]`

Week +3:

`F[t+3] = 0.50*F[t+2] + 0.30*F[t+1] + 0.20*D[t]`

Week +2/+3 are recursive planning projections.

## 6. Minimum Historical Data

At least three complete trustworthy consecutive weekly actual observations are required for a branch/category pair.

A known complete zero-demand week is a valid zero.

Unknown/incomplete historical weeks must not be converted to zero.

## 7. Forecast Storage and Runs

Preserve immutable historical forecast fidelity through run/group identifiers.

Each target-week forecast preserves at minimum:

- branch;
- vehicle category;
- forecast run/group;
- horizon 1/2/3;
- target week start/end;
- method = WMA;
- decimal forecast demand;
- `ceil()` required vehicle units;
- actual demand when finalized;
- APE when valid;
- generation time.

Do not overwrite older runs.

## 8. Forecast Inputs

Store/associate each calculation input:

- Actual or Forecast;
- period;
- value;
- recency/order;
- weight;
- weighted contribution.

## 9. Required Vehicle Units

`RequiredVehicleUnits = ceil(ForecastedDemand)`

Keep decimal forecast independently.

## 10. Recalculation

After a new calendar week becomes complete, a later forecast run uses the newest completed actual observation and produces a new 3-week horizon.

Older runs remain.

## 11. Visualization

Completed history may display actual demand and the historical one-week-ahead forecast used for evaluation.

Latest projection may display horizons 1–3.

## 12. APE

When actual demand `A > 0`:

`APE = abs((A - F) / A) * 100`

When `A = 0`, APE is undefined/null.

## 13. MAPE

Primary study MAPE uses only horizon-1 forecasts with finalized `A > 0`.

`MAPE = (100 / n) * sum(abs((A_i - F_i) / A_i))`

Zero actuals are excluded from the divisor but remain valid actual observations.

Horizon 2/3 are not mixed into primary MAPE.

Do not assign qualitative accuracy labels.

## 14. Sample / Simulated Data

Clearly labeled sample/simulated data may test forecasting when real history is insufficient.

Do not present demo outputs as real predictive performance.

## 15. Guardrails

Do not:

- change fixed WMA weights;
- reduce horizon to one week;
- substitute another forecasting method;
- treat recursive forecasts as actuals;
- destroy historical runs;
- use zero actuals in MAPE;
- add unsupported accuracy labels;
- permit manual editing of computed WMA values.
