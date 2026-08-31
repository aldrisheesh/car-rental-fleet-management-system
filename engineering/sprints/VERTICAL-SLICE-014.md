# Vertical Slice 014 — Weekly Demand Forecasting with WMA and MAPE

**Status:** Approved for implementation  
**Objective:** Implement canonical weekly qualifying-demand extraction and three-period Weighted Moving Average forecasting by branch and requested vehicle category, preserve immutable forecast runs and calculation inputs, and provide historical one-week-ahead APE/MAPE evaluation without fabricating unavailable demand history.

## Purpose

VS012–VS013 established:

- canonical maintenance readiness;
- canonical rental intervals;
- vehicle utilization;
- idle-vehicle detection.

VS014 implements the demand side of fleet decision support.

The system must transform canonical booking history into:

```text
Confirmed booking demand
        ↓
weekly branch/category actuals
        ↓
three complete trustworthy weeks
        ↓
WMA
        ↓
Week +1
Week +2
Week +3
        ↓
required vehicle units
        ↓
historical APE / MAPE when actuals mature
```

Forecasting is advisory.

It does not allocate or transfer vehicles.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/05-forecasting-specification.md`
- `codex-context/10-open-decisions.md`
- `codex-context/14-client-clarification-register.md`
- `codex-context/20-demand-extraction-and-forecasting-boundary.md`
- this slice contract.

Inspect only repository areas directly required for:

- canonical bookings;
- canonical requested vehicle;
- vehicle category;
- pickup branch;
- booking status;
- existing admin report/dashboard forecasting prototype;
- Operations Staff report presentation where relevant;
- auth/server helpers;
- Supabase migrations required for forecast persistence.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

## Business Timezone

Use:

`Asia/Manila`

for weekly demand aggregation.

Do not use browser/device timezone.

## Calendar Week

Week begins:

**Monday 00:00 Asia/Manila**

Week interval:

```text
[Monday 00:00, next Monday 00:00)
```

The booking's canonical scheduled rental-start timestamp determines the week.

The current incomplete week must never be used as an actual historical WMA input.

## Canonical Qualifying Demand

A booking contributes one unit of qualifying demand only when:

```text
booking.status = Confirmed
```

and the required canonical aggregation information exists.

Do not count:

- Submitted;
- Rejected;
- Cancelled;
- mock bookings;
- duplicate UI rows;
- rental days;
- utilization records;
- payment records.

One Confirmed booking contributes:

**1 demand observation**

regardless of rental duration.

## Demand Branch

Use the booking's canonical:

`pickup_branch_id`

or equivalent requested pickup branch field.

Demand represents where service was requested.

Do not use:

- assigned vehicle's current branch;
- return branch;
- later vehicle transfer.

## Demand Vehicle Category

Historical demand must represent the customer's requested vehicle/category intent.

Where the booking stores:

`requested_vehicle_id`

resolve that requested vehicle's canonical category.

Do not derive historical demand category from:

`assigned_vehicle_id`

because Owner/Admin substitution must not rewrite customer demand.

Example:

```text
Customer requests SUV
        ↓
Owner substitutes Sedan
        ↓

Demand category = SUV
```

not Sedan.

## Missing Category Mapping

If a Confirmed booking cannot be mapped to a trustworthy requested category:

- do not silently assign another category;
- do not count it in an incorrect category;
- expose a controlled data-quality diagnostic where practical.

Forecast generation for an affected branch/category must not fabricate the missing mapping.

## Historical Coverage Boundary

Do not assume the system has trustworthy booking history before canonical booking records actually exist.

Establish the smallest explicit forecasting-history coverage boundary.

A suitable implementation may derive or persist:

`booking_demand_coverage_start`

or an equivalent trusted system-history marker.

The boundary must represent when canonical booking demand becomes trustworthy enough that completed weeks can legitimately be interpreted as:

```text
actual demand = 0
```

when no qualifying bookings occurred.

Do not simply use:

- January 1;
- vehicle creation date;
- earliest arbitrary record;
- an invented semester/start date.

## Existing Canonical History

If existing canonical booking records clearly establish a trustworthy earlier coverage boundary, use the smallest defensible rule and document it.

Otherwise begin trustworthy prospective demand coverage at VS014 tracking activation.

Do not backfill unknown periods with zero.

## Complete Weekly Observation

A week may become a WMA actual observation only when:

1. the week is complete;
2. the week lies within trustworthy booking-demand coverage;
3. booking records required for that period are considered complete.

For each branch/category:

```text
WeeklyActual =
count(qualifying Confirmed bookings
      whose scheduled rental start
      belongs to that week)
```

A completed covered week with no qualifying bookings:

```text
WeeklyActual = 0
```

is valid.

## Consecutive Weekly History

Forecasting requires the three most recent **consecutive complete weekly observations**.

Example:

```text
Week 1 = 3
Week 2 = 0
Week 3 = 5
```

is valid.

Do not skip Week 2 to find another nonzero week.

If a week in the required sequence has unknown/incomplete coverage:

return:

`Insufficient historical data`

rather than jumping over the gap.

## Minimum History

Require:

**3 complete actual weekly observations**

for each branch/category pair.

If fewer exist:

do not calculate WMA.

Return a controlled state such as:

`Insufficient historical data`

with available observation count where useful.

## WMA Weights

Fixed:

```text
Most recent       0.50
Second most recent 0.30
Third most recent  0.20
```

Do not make weights configurable.

Do not permit Owner/Admin to edit computed forecast values.

## Week +1 Forecast

Given:

```text
D0 = most recent actual
D1 = second-most recent actual
D2 = third-most recent actual
```

calculate:

```text
F1 =
0.50 × D0
+
0.30 × D1
+
0.20 × D2
```

## Week +2 Forecast

Calculate recursively:

```text
F2 =
0.50 × F1
+
0.30 × D0
+
0.20 × D1
```

Do not replace F1 with an actual value.

## Week +3 Forecast

Calculate:

```text
F3 =
0.50 × F2
+
0.30 × F1
+
0.20 × D0
```

## Precision

Preserve sufficient decimal precision internally.

Do not round WMA to integer before storing/reporting the analytical forecast.

Presentation may round decimal display reasonably.

## Required Vehicle Units

For each horizon:

```text
RequiredVehicleUnits =
ceil(ForecastedDemand)
```

Examples:

```text
4.00 → 4
4.01 → 5
4.80 → 5
0.00 → 0
```

Do not round positive fractions down.

## Canonical Forecast Persistence

Create additive canonical forecast persistence.

Use repository naming conventions.

Recommended structure:

### Forecast Run

At minimum:

- run ID;
- generated at;
- generated by;
- method = `WMA`;
- coverage/data mode where useful;
- request/idempotency identifier where appropriate.

### Forecast Record

At minimum:

- record ID;
- run ID;
- branch ID;
- vehicle category ID;
- horizon number;
- target week start;
- target week end;
- decimal forecast demand;
- required vehicle units;
- actual demand nullable;
- APE nullable;
- created timestamp.

### Forecast Input Detail

At minimum:

- input detail ID;
- forecast record ID;
- source type:
  - `Actual`
  - `Forecast`
- source week/period;
- source value;
- input order/recency;
- weight;
- weighted contribution.

Use equivalent normalized structures if more consistent with the repository.

## Immutable Historical Runs

Do not overwrite an old forecast because a later run targets the same week.

Example:

```text
Run A:
Sep 14 = Horizon 3

later

Run B:
Sep 14 = Horizon 1
```

Both records remain.

This is required for forecast evaluation fidelity.

## Forecast Run Generation

Owner/Admin explicitly requests forecast generation.

The trusted server must:

1. authenticate Owner/Admin;
2. determine latest completed Manila week;
3. extract trustworthy weekly actual demand;
4. validate minimum history;
5. calculate F1/F2/F3;
6. calculate required units;
7. persist one run;
8. persist horizon records;
9. persist exact WMA inputs;
10. return canonical run.

Do not calculate/persist partial forecast runs.

## Multi-Branch / Multi-Category Generation

A forecast run may evaluate all supported canonical branch/category pairs.

For each pair independently:

- generate forecast when history is sufficient;
- otherwise return Insufficient historical data.

One insufficient pair must not require inventing values.

Choose the smallest implementation consistent with existing report UI.

## Idempotency

Protect explicit generation from accidental duplicate creation caused by:

- double-click;
- browser retry;
- repeated identical request submission.

Use a request/run idempotency key or equivalent server-side mechanism.

Do not prohibit legitimate later forecast runs.

## Forecast Input Fidelity

For F1:

```text
0.50 D0 Actual
0.30 D1 Actual
0.20 D2 Actual
```

For F2:

```text
0.50 F1 Forecast
0.30 D0 Actual
0.20 D1 Actual
```

For F3:

```text
0.50 F2 Forecast
0.30 F1 Forecast
0.20 D0 Actual
```

Persist these distinctions correctly.

## Actual Demand Finalization

When a target week becomes complete, historical forecast records for that target may receive:

`actual_demand`

derived from the **same canonical demand extractor**.

Do not accept manually supplied actual demand as truth.

Do not overwrite:

`forecasted_demand`

during finalization.

## APE

When:

```text
Actual > 0
```

calculate:

```text
APE =
abs((Actual - Forecast) / Actual) × 100
```

When:

```text
Actual = 0
```

store:

```text
APE = null
```

Do not treat undefined percentage error as zero.

## MAPE

Primary MAPE uses only:

```text
horizon = 1
```

historical forecast records where:

```text
actual_demand IS NOT NULL
AND actual_demand > 0
```

Formula:

```text
MAPE =
sum(APE) / valid observation count
```

Do not include:

- Horizon 2;
- Horizon 3;
- actual = 0;
- forecasts without finalized actual.

## Duplicate Forecasts for Same Target Week

Because immutable runs are preserved, multiple Horizon-1 forecasts could theoretically exist for the same target week if Owner/Admin explicitly generated multiple runs before that week.

For primary evaluation, do not double-count the same target week arbitrarily.

Use the latest valid Horizon-1 forecast generated **before the target week begins** as the canonical evaluation forecast for that target week, unless the existing frozen forecasting design already establishes a more specific rule.

Document/test this deterministic selection.

Do not average multiple forecasts for one target week.

## Forecasts Generated After Target Week Starts

A forecast generated after its target week has begun must not be used as the canonical one-week-ahead MAPE observation for that target.

It may remain preserved as a historical run if legitimately generated, but it is not valid one-week-ahead evaluation evidence.

## Forecast Visualization

Owner/Admin should be able to inspect:

- branch;
- vehicle category;
- recent weekly actual demand;
- Week +1 forecast;
- Week +2 forecast;
- Week +3 forecast;
- required vehicle units;
- data sufficiency state;
- historical Actual vs Forecast where available;
- MAPE when valid observations exist.

Do not broadly redesign reports.

## Forecast Calculation Detail

Where practical, allow Owner/Admin to inspect the WMA inputs for transparency:

```text
Input       Value    Weight    Contribution
D0 Actual     5       .50         2.50
D1 Actual     3       .30         0.90
D2 Actual     4       .20         0.80
```

This helps demonstrate that the system uses the manuscript-defined WMA rather than opaque AI/ML.

## Operations Staff

Operations Staff may receive safe read-only forecast outputs where useful for operational coordination.

Do not allow Staff to:

- generate/overwrite forecasts;
- edit weights;
- edit WMA results;
- alter actual demand.

## Customer/Renter

Customer/Renter must not receive internal branch/category demand forecasts.

## Demo / Sample Forecasting

If real history is insufficient, the real operational endpoint/UI must say:

`Insufficient historical data`

Do not silently fall back to fake data.

If the repository already has a separate demonstration mode or test harness, explicitly labeled sample data may demonstrate:

- WMA;
- recursive horizons;
- required units;
- APE/MAPE.

Keep demo evidence separate from canonical operational forecasts.

## Error Handling

Handle at minimum:

- unauthenticated;
- wrong role;
- malformed generation request;
- duplicate idempotency key;
- missing branch/category mapping;
- insufficient history;
- historical coverage gap;
- database/provider failure.

Use controlled messages.

Do not expose raw SQL.

## Testing

Add focused tests for at least:

- Manila Monday week boundaries;
- Sunday/Monday timestamp boundary;
- current partial week excluded;
- Confirmed booking counts once;
- Submitted booking excluded;
- Cancelled booking excluded;
- requested category used instead of assigned substitution category;
- completed covered zero-demand week retained as 0;
- unknown historical week not fabricated as 0;
- three consecutive actual observations required;
- WMA F1 formula;
- recursive F2 formula;
- recursive F3 formula;
- required units use ceil();
- decimal forecast preserved;
- F1 input details all Actual;
- F2/F3 recursive inputs correctly marked Forecast;
- immutable historical runs;
- idempotent duplicate request does not create duplicate run;
- actual finalization uses canonical extractor;
- APE with actual > 0;
- APE null when actual = 0;
- MAPE horizon-1 only;
- zero actual excluded from MAPE divisor;
- multiple H1 forecasts for one target use deterministic valid pre-week selection;
- post-target-start forecast excluded from primary MAPE;
- Customer cannot access forecasts;
- Operations Staff cannot generate forecasts.

## Provider-Backed Validation

Where configured, validate at minimum:

1. real insufficient-history state does not fabricate forecast;
2. three complete demo/test actual weeks produce correct F1;
3. recursive F2/F3 values match expected calculations;
4. required units use ceiling;
5. persisted run contains three horizon records;
6. input details correctly identify Actual/Forecast sources;
7. rerunning with a new legitimate run preserves older run;
8. duplicate idempotency request does not duplicate;
9. finalized target actual does not overwrite forecast;
10. actual zero leaves APE null;
11. horizon-1 MAPE excludes zero actual;
12. Customer cannot access internal forecasting;
13. Operations Staff remains read-only.

Use disposable, explicitly labeled demo/test data where necessary.

## Client Clarification Preservation

Do not resolve or remove:

`CQ-024`

Do not fabricate historical Briah booking records.

## Definition of Done

VS014 is complete when:

- canonical Confirmed bookings produce weekly qualifying demand;
- Manila Monday calendar weeks are correct;
- requested branch/category intent is preserved;
- unknown historical periods are not converted to zero;
- three complete consecutive weekly observations are required;
- WMA F1/F2/F3 exactly follow frozen formulas;
- decimal forecasts and ceil required units are both preserved;
- immutable forecast runs exist;
- recursive forecast input details are auditable;
- actual demand can be finalized canonically;
- APE and primary Horizon-1 MAPE are correctly computed;
- insufficient real history is represented honestly;
- forecasts remain advisory/read-only outputs;
- Customer cannot access internal demand forecasts.

## Stop Rule

Stop after Weekly Demand Forecasting with WMA and MAPE is complete.

Do not implement:

- projected available supply;
- shortage/surplus;
- branch allocation;
- contextual APIs;
- automatic transfers;
- Smart Vehicle Finder integration;
- qualitative MAPE labels;
- VS015.