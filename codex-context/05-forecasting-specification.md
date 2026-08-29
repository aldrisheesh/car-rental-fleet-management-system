# Forecasting Specification — WMA and MAPE

**Status:** Frozen for Development Baseline v1  
**Last updated:** 2026-08-29

## 1. Forecast Purpose and Granularity

The system uses **Weighted Moving Average (WMA)** to generate short-term weekly vehicle-demand forecasts for each:

- branch
- vehicle category

Forecasting is advisory decision support and is not AI/ML.

## 2. Forecast Target Variable

The target is the weekly count of **qualifying booking demand**.

For branch `b`, category `c`, and completed calendar week `t`:

`D[b,c,t] = count of qualifying bookings with scheduled rental start date in week t`

Qualifying-demand inclusion/exclusion rules are defined in `04-data-and-business-rules.md`.

Rental duration and vehicle utilization are not direct WMA demand-count inputs.

## 3. Aggregation Period

Aggregation period: **calendar week**.

Demand is grouped by:

- calendar week
- branch
- vehicle category

## 4. WMA Window and Weights

The study uses a **three-period WMA** with fixed descending weights:

- most recent input: `0.50`
- second-most recent input: `0.30`
- third-most recent input: `0.20`

Weights are fixed study-adopted parameters. Owner/Admin does not manually change computed WMA values or weights in normal operation.

## 5. Forecast Horizon

Each forecast run generates up to **three succeeding weekly periods**: Week +1, Week +2, and Week +3.

### Week +1

`F[t+1] = 0.50*D[t] + 0.30*D[t-1] + 0.20*D[t-2]`

### Week +2

`F[t+2] = 0.50*F[t+1] + 0.30*D[t] + 0.20*D[t-1]`

### Week +3

`F[t+3] = 0.50*F[t+2] + 0.30*F[t+1] + 0.20*D[t]`

Week +2 and Week +3 are recursive projections. Their increasing reliance on prior forecasts means they are longer-horizon planning estimates and must not be presented as guaranteed demand.

## 6. Minimum Historical Data

At least **three complete actual weekly observations** are required before an initial forecast run is generated for a branch/category pair.

If fewer than three complete actual observations are available, return/display **Insufficient historical data** rather than substituting invented values.

A known complete week with zero qualifying bookings is a valid zero-demand observation.

## 7. Forecast Storage and Runs

A forecast run should preserve historical forecast fidelity.

Use a run/group identifier so Week +1, Week +2, and Week +3 records generated together remain associated.

Each target-week record should preserve at minimum:

- branch
- vehicle category
- forecast run/group
- forecast horizon number: 1, 2, or 3
- target week start/end
- method = WMA
- decimal forecasted demand
- rounded-up required vehicle units
- actual demand once the target week is complete
- per-record percentage error when valid
- generation time

Do not overwrite an older forecast solely because the same target week later appears at a shorter horizon in a newer run.

## 8. Forecast Detail Inputs

Each forecast stores the three inputs used in its WMA calculation.

Because recursive forecasts may use prior forecasts, each input detail must distinguish:

- `Actual`
- `Forecast`

Store the input value, input period, relative recency/order, assigned weight, and weighted contribution.

Do not assume all Week +2/+3 inputs are historical actual observations.

## 9. Required Vehicle Units

Keep the WMA result as a decimal for analytical reporting and visualization.

For allocation planning:

`RequiredVehicleUnits = ceil(ForecastedDemand)`

Examples:

- `4.00 -> 4`
- `4.01 -> 5`
- `4.80 -> 5`

Never round down a positive fractional vehicle requirement.

## 10. Recalculation Behavior

When a new calendar week becomes completed and its actual qualifying demand is available, the next forecast run uses the newest completed actual observation and regenerates a fresh Week +1/+2/+3 horizon.

Historical prior forecast runs remain available for evaluation/audit/visualization.

## 11. Actual vs Forecast Visualization

Historical completed weeks may display:

- Actual Demand
- the corresponding historical one-week-ahead forecast used for evaluation

The current/latest forecast series may extend through Week +1, Week +2, and Week +3, while the Actual Demand line stops where actual completed-week data end.

## 12. Per-Forecast Absolute Percentage Error

For a valid forecast record with actual demand `A > 0`:

`APE = abs((A - F) / A) * 100`

A single forecast record stores **percentage error / APE**, not MAPE.

When `A = 0`, percentage error is undefined and must remain null/not computed.

## 13. MAPE

Primary study evaluation uses historical **one-week-ahead (horizon = 1)** forecasts so all observations are compared at a consistent forecast horizon.

`MAPE = (100 / n) * sum(abs((A_i - F_i) / A_i))`

Include only observations where:

- the forecast was originally generated as Week +1 for that target period
- corresponding actual qualifying demand is available
- `A_i > 0`

Periods with zero actual demand:

- remain valid demand observations
- are reported separately where useful
- are excluded from the MAPE divisor because percentage error is undefined

Week +2 and Week +3 forecasts are planning projections and are not mixed into the primary MAPE unless the project later adds a separate horizon-specific evaluation.

Lower MAPE means smaller observed forecasting error.

Do not assign qualitative labels such as `Highly Accurate`, `Good`, or `Accurate` unless a separate verified interpretation basis is formally adopted.

## 14. Sample / Simulated Data

Sample or simulated data may be used to test forecasting behavior when sufficient client history is unavailable.

Such outputs must be clearly identified as demonstration/functional-test results and must not be presented as evidence of long-term real-world predictive effectiveness.

## 15. Codex Guardrails

Codex must not:

- change the fixed WMA weights for convenience
- reduce the horizon to one week
- substitute another forecasting method
- treat Week +2/+3 as actual observations
- overwrite historical forecast runs in a way that destroys evaluation fidelity
- use zero-actual periods in MAPE
- add unsupported qualitative MAPE classifications
- allow manual editing of computed WMA results as if they were raw data
