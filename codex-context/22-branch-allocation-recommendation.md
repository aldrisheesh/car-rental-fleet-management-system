# Branch Allocation Recommendation Specification

**Status:** Frozen for VS016 Internal Branch Allocation Recommendation  
**Last updated:** 2026-09-01

This document defines the authoritative baseline for generating deterministic inter-branch allocation recommendations from canonical VS015 supply/balance evaluations.

VS016 is advisory decision support. It does not move vehicles or mutate vehicle branch assignments.

## 1. Purpose

For one vehicle category and target week:

- identify destination branches with canonical shortage;
- identify different source branches with canonical surplus;
- pair compatible shortage/surplus evaluations;
- compute a recommended transfer quantity;
- identify eligible source vehicles from the immutable source supply evaluation;
- order candidates primarily by longest idle duration;
- persist an immutable recommendation and candidate snapshot;
- allow Owner/Admin to record a recommendation decision without executing a transfer.

## 2. Canonical Inputs

Use persisted canonical VS015 supply-evaluation snapshots.

Do not recompute WMA demand, required units, projected supply, shortage, or surplus inside VS016.

A recommendation must preserve the exact source and destination supply-evaluation IDs used.

## 3. Compatible Evaluation Grain

Source and destination evaluations may be paired only when all of the following match:

- same vehicle category;
- same target week start;
- same target week end;
- same forecast horizon semantics / evaluated forecast period;
- source branch differs from destination branch.

Do not pair evaluations for different weeks or categories.

## 4. Latest Evaluation Selection

Fleet state can change and VS015 permits multiple immutable evaluations for one forecast.

For automatic recommendation generation, use the latest canonical supply evaluation for each applicable forecast record at generation time.

Persist the chosen evaluation IDs.

Do not silently switch a historical recommendation to newer evaluations after it has been created.

## 5. Destination Eligibility

A destination branch may receive an allocation recommendation only when:

`shortage_units > 0`

## 6. Source Eligibility

A source branch may provide units only when:

`surplus_units > 0`

Do not subtract an additional hidden reserve.

`CQ-025` remains unresolved.

## 7. Recommended Transfer Quantity

For a compatible source/destination pair:

`RecommendedTransferUnits = min(DestinationShortageUnits, SourceSurplusUnits)`

The result must be a positive integer.

Never recommend more than destination shortage or source surplus.

## 8. Multi-Source / Multi-Destination Allocation

VS016 must avoid independently recommending the same surplus units multiple times within one generated recommendation batch.

Use a deterministic remaining-balance allocation pass:

1. establish eligible destination shortages;
2. establish eligible source surpluses;
3. process destination/source pairing deterministically;
4. decrement remaining destination shortage and source surplus as recommendations are created.

Do not produce recommendations whose combined quantities exceed the chosen source evaluation's surplus or destination evaluation's shortage.

## 9. Pairing Order

No client-confirmed distance/cost priority exists yet.

Before external context is integrated, use a deterministic neutral ordering such as stable destination branch ID/name then stable source branch ID/name.

Do not claim this ordering is operationally optimal.

## 10. Candidate Vehicle Source

Candidate vehicles come only from the immutable source VS015 vehicle-evaluation snapshot.

A vehicle may be a candidate only when the source evaluation item has:

`eligible = true`

Do not re-add vehicles that VS015 excluded.

## 11. Candidate Revalidation

Before persisting a new VS016 recommendation, revalidate each proposed candidate against current canonical minimum safety constraints:

- still in source branch;
- same required category;
- currently active;
- VS012 maintenance readiness = Ready;
- no active rental;
- no current known booking/rental commitment that conflicts with the evaluated target week.

If revalidation fails, exclude the candidate from the new recommendation.

Do not mutate the source VS015 snapshot.

## 12. Candidate Count

If fewer revalidated candidates exist than the formula quantity:

`RecommendedTransferUnits`

must be capped to the number of eligible candidates actually available for recommendation.

If zero candidates remain, do not create a positive recommendation for that pair.

## 13. Idle-Duration Priority

Eligible source candidates are ranked primarily by longest canonical idle duration first.

Reuse the canonical VS013 idle-detection boundary/data.

Do not invent a separate idle calculation.

## 14. Candidate With Unknown Idle Duration

A vehicle with unknown idle duration is not automatically excluded.

Ranking:

1. known idle duration first, longest first;
2. unknown idle duration after known;
3. stable vehicle identifier/name tie-breaker.

Do not fabricate idle days.

## 15. Idle Classification vs Ranking

The source vehicle does not have to be formally classified `Idle = true` to be an eligible transfer candidate.

The 14-day idle threshold is not a hard transfer-eligibility rule.

## 16. Candidate Ranking Snapshot

Persist candidate ranking at recommendation-generation time.

At minimum preserve:

- recommendation ID;
- vehicle ID;
- rank/order;
- idle duration/days nullable;
- idle reference nullable where safe;
- eligibility/revalidation state;
- explanation/reason codes.

Do not recompute and overwrite historical ordering later.

## 17. Recommendation Persistence

Persist immutable recommendation records.

At minimum:

- recommendation ID;
- generation batch/run ID where useful;
- source supply-evaluation ID;
- destination supply-evaluation ID;
- source branch;
- destination branch;
- category;
- target week;
- source required units snapshot;
- source projected supply snapshot;
- source surplus snapshot;
- destination required units snapshot;
- destination projected supply snapshot;
- destination shortage snapshot;
- recommended transfer units;
- generated at;
- generated by;
- decision state;
- approved transfer units nullable;
- decision timestamp/by nullable.

## 18. Recommendation State

Use only:

- `Pending`
- `Approved`
- `Rejected`

These are advisory decision states, not transfer-execution states.

## 19. Human Decision

Owner/Admin may:

- approve the recommendation quantity;
- approve a lower positive quantity;
- reject.

Rules:

- approved_transfer_units <= recommended_transfer_units;
- approved quantity must be positive when Approved;
- approved quantity 0 is represented as Rejected;
- Rejected has approved quantity null or equivalent.

Do not overwrite original recommended quantity.

## 20. Item-Level Approval Boundary

The exact vehicle-by-vehicle approval/execution workflow remains unresolved.

VS016 preserves ranked candidates and approved quantity, but does not claim approval of N units automatically selects or transfers the first N ranked vehicles.

`CQ-026` tracks this decision.

## 21. Recommendation Immutability

Analytical inputs and original system output are immutable.

Decision mutation may update only dedicated human-review fields.

## 22. Decision Concurrency

Only `Pending` may transition to:

- `Approved`
- `Rejected`

Do not reopen terminal decisions in VS016.

## 23. Generation Idempotency

Protect one explicit recommendation-generation request from browser retry/double-click.

An idempotency key must be bound to the same generation request/batch context.

## 24. Atomic Generation Persistence

Persist recommendation batch, recommendations, and candidate rankings atomically where generated together.

## 25. No Automatic Transfer

Approval does not execute movement.

VS016 must not update:

`vehicles.branch_id`

## 26. Cross-Branch Process

`CQ-017` remains open.

Do not invent dispatch/receipt/signoff behavior.

## 27. Turnaround / Reserve

Preserve:

- `CQ-018`
- `CQ-025`

Do not add either.

## 28. External Context

Do not integrate weather, traffic, road, route feasibility, distance, or fuel context in VS016.

## 29. Explanation

Show at minimum:

- destination shortage;
- source surplus;
- category/week;
- recommended units;
- ranked candidates;
- candidate idle duration where known;
- source/destination evaluation timestamps.

No confidence/urgency scores.

## 30. Operations Staff

Operations Staff may view safe read-only recommendation details.

Operations Staff may not generate, approve/reject, change quantity, or execute transfers.

## 31. Customer/Renter

Customer/Renter must not access internal allocation recommendations.

## 32. Testing Requirements

Test:

- shortage destination required;
- surplus source required;
- same category/week required;
- same branch cannot pair with itself;
- recommended units = min(shortage, surplus);
- batch does not oversubscribe source surplus or destination shortage;
- candidates only from eligible VS015 snapshot items;
- failed revalidation excludes candidate;
- candidate count caps recommended units;
- zero candidates means no positive recommendation;
- known idle duration longest first;
- unknown idle after known;
- deterministic tie-breaker;
- 14-day Idle threshold not used as hard candidate rule;
- immutable analytical fields;
- Pending -> Approved;
- Pending -> Rejected;
- lower positive approved quantity allowed;
- approval above recommended rejected;
- terminal decision cannot reopen;
- generation idempotency;
- atomic generation persistence;
- approval does not mutate branch;
- Staff read-only;
- Customer denied.

## 33. Client Clarification Preservation

Preserve:

- `CQ-016`
- `CQ-017`
- `CQ-018`
- `CQ-025`
- `CQ-026`

## 34. Warning to Codex

Do not recompute WMA/supply, pair different weeks/categories, oversubscribe shortage/surplus, invent distance/cost scoring, require 14 idle days as a hidden transfer rule, auto-select or execute vehicles, change branch assignments, add transfer lifecycle states, or integrate external context.
