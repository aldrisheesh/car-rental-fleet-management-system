# Vertical Slice 016 — Internal Branch Allocation Recommendation

**Status:** Approved for implementation  
**Objective:** Generate deterministic advisory inter-branch allocation recommendations from immutable VS015 shortage/surplus evaluations, rank eligible source vehicles primarily by canonical idle duration, persist immutable recommendation/candidate snapshots, and support Owner/Admin approval/rejection without executing vehicle transfers.

## Purpose

VS015 established:

- canonical projected available supply;
- immutable supply evaluations;
- per-vehicle eligibility snapshots;
- shortage;
- surplus;
- balanced state.

VS016 consumes those outputs.

The slice must generate advisory recommendations only when:

```text id="cfupvu"
Destination shortage > 0
        +
Different source branch surplus > 0
        +
Same category
        +
Same target week
```

Then:

```text id="v6y9xj"
RecommendedTransferUnits =
min(DestinationShortage, SourceSurplus)
```

subject to:

- batch-level remaining shortage/surplus;
- actual revalidated candidate count.

VS016 must not execute branch movement.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/06-recommendation-specification.md`
- `codex-context/10-open-decisions.md`
- `codex-context/14-client-clarification-register.md`
- `codex-context/18-maintenance-monitoring-and-readiness.md`
- `codex-context/19-vehicle-utilization-and-idle-detection.md`
- `codex-context/21-projected-supply-and-demand-balance.md`
- `codex-context/22-branch-allocation-recommendation.md`
- this slice contract.

Inspect only repository areas directly required for:

- VS015 supply evaluation persistence;
- VS015 vehicle evaluation items;
- VS013 idle analytics;
- VS012 maintenance readiness;
- current vehicle branch/category/state;
- canonical booking/rental conflicts needed for revalidation;
- existing Owner/Admin forecast/supply UI;
- Operations Staff read-only reporting surface;
- auth/server helpers;
- Supabase migrations required for recommendation persistence.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

## Canonical Input Rule

VS016 must use persisted VS015 evaluations as its analytical basis.

Do not independently recalculate:

- WMA;
- required units;
- projected supply;
- shortage;
- surplus.

Use the selected VS015 evaluation snapshots exactly.

## Latest VS015 Evaluation Selection

VS015 may contain multiple immutable evaluations for one forecast.

For new recommendation generation:

- select the latest canonical evaluation for each relevant forecast record;
- use its persisted shortage/surplus;
- preserve the chosen evaluation ID.

Do not rewrite a previously generated recommendation when a later supply evaluation appears.

## Compatible Pairing

A source/destination pair is compatible only when:

- source branch != destination branch;
- same vehicle category;
- same target week start;
- same target week end;
- compatible forecast horizon/evaluated period.

Do not pair:

- different categories;
- different weeks;
- same branch.

## Destination Requirement

Destination evaluation must have:

```text id="r1tr6r"
shortage_units > 0
```

Otherwise it is not a destination candidate.

## Source Requirement

Source evaluation must have:

```text id="5xqipb"
surplus_units > 0
```

Otherwise it is not a source candidate.

## Batch-Level Remaining Balances

Recommendation generation may produce multiple source/destination pairs.

Maintain:

```text id="odqycj"
remainingDestinationShortage
remainingSourceSurplus
```

for the generation batch.

For each recommendation:

```text id="oulo59"
baseRecommendation =
min(
  remainingDestinationShortage,
  remainingSourceSurplus
)
```

After creating a recommendation:

```text id="trxc94"
remainingDestinationShortage -= recommendedUnits
remainingSourceSurplus -= recommendedUnits
```

Never recommend the same source surplus twice.

Never exceed a destination shortage across several sources.

## Deterministic Pairing Order

No route/distance/cost priority is client-confirmed yet.

Use a stable deterministic neutral order.

Suitable approach:

1. destination branch stable identifier/name ascending;
2. source branch stable identifier/name ascending.

Do not create:

- priority score;
- urgency score;
- distance score;
- confidence score.

Do not claim the neutral ordering is optimal.

## Source Candidate Origin

Candidate vehicles must come only from:

```text id="t7gnzs"
source VS015 supply_evaluation_vehicles
where eligible = true
```

Do not rebuild the source candidate list from all vehicles.

The source evaluation snapshot is the canonical analytical basis.

## Current Candidate Revalidation

Before persisting a new recommendation, revalidate every source candidate against current canonical minimum constraints.

Candidate must still:

1. exist;
2. belong to source branch;
3. belong to the required category;
4. be currently active;
5. have VS012 Maintenance Ready = true;
6. have no active canonical rental;
7. have no current known booking/rental commitment conflicting with the evaluated target week.

Do not mutate the underlying VS015 evaluation item when a candidate fails revalidation.

Exclude it only from the new recommendation.

## Target-Week Revalidation

Use the same canonical target-week semantics as VS015.

Do not introduce a different timezone or overlap implementation.

Reuse the VS015 Manila date-boundary / instant-overlap helpers where practical.

Do not duplicate date logic.

## Booking Conflict During Revalidation

Only canonical:

```text id="zcwvga"
booking_status = Confirmed
AND assigned_vehicle_id = candidateVehicle
```

may block that specific candidate.

Use canonical half-open target-week overlap.

Do not let:

- Submitted;
- Rejected;
- Cancelled;
- Confirmed but unassigned

block the candidate.

## Rental Conflict During Revalidation

If candidate currently has:

```text id="dqe5xh"
started_at IS NOT NULL
AND ended_at IS NULL
```

exclude it.

For an ended rental:

exclude only when its actual interval overlaps the target week according to canonical VS015 interval logic.

## Maintenance Revalidation

Reuse:

`calculateMaintenanceReadiness`

or the canonical VS012 service.

Do not copy maintenance rules into VS016.

If readiness cannot be determined:

exclude conservatively.

## Candidate Count Cap

After revalidation:

```text id="rtv89m"
actualEligibleCandidateCount
```

may be lower than the source evaluation's projected surplus.

Therefore:

```text id="ek64so"
RecommendedTransferUnits =
min(
  remainingDestinationShortage,
  remainingSourceSurplus,
  actualEligibleCandidateCount
)
```

If:

```text id="rh73ay"
actualEligibleCandidateCount = 0
```

do not create a positive recommendation for that pair.

## Candidate Idle Ranking

Reuse canonical VS013 idle data/calculation.

Do not create another independent idle algorithm.

Primary sort:

```text id="5f30e9"
known idle duration:
longest first
```

Then:

```text id="o1z0b0"
unknown idle duration
```

After that use a stable deterministic vehicle tie-breaker.

## Formal Idle Classification Is Not Required

A transfer candidate does not need:

```text id="h4i3ai"
Idle = true
```

under the formal 14-day monitoring threshold.

Example:

```text id="em7krn"
Vehicle A idle duration = 10 days
Vehicle B idle duration = 4 days

both otherwise eligible
```

Vehicle A ranks ahead of B.

Do not exclude either merely because neither reached 14 days.

## Unknown Idle Duration

Unknown idle duration does not automatically disqualify a candidate.

Sort unknown durations after known-duration candidates.

Do not fabricate:

`0 idle days`

for unknown.

## Candidate Snapshot

Persist the candidate list as it existed at recommendation-generation time.

At minimum:

- candidate ID;
- recommendation ID;
- vehicle ID;
- rank;
- idle duration/days nullable;
- idle reference nullable;
- revalidation state;
- safe reason/explanation data;
- created timestamp.

Preserve candidates beyond the recommended quantity where useful for human review, as long as all persisted candidates were eligible at generation time.

Do not mutate historical ranking later.

## Canonical Recommendation Persistence

Create additive persistence.

Recommended parent/batch model:

### Allocation Recommendation Batch

At minimum:

- batch ID;
- generated by;
- generated at;
- idempotency key.

### Allocation Recommendation

At minimum:

- recommendation ID;
- batch ID;
- source supply evaluation ID;
- destination supply evaluation ID;
- source branch ID;
- destination branch ID;
- vehicle category ID;
- target week start;
- target week end;
- source required units snapshot;
- source projected supply snapshot;
- source surplus snapshot;
- destination required units snapshot;
- destination projected supply snapshot;
- destination shortage snapshot;
- recommended transfer units;
- decision state;
- approved transfer units nullable;
- decided by nullable;
- decided at nullable;
- created timestamp.

Use equivalent naming if more consistent with the existing schema.

## Recommendation State

Use only:

```text id="31zhig"
Pending
Approved
Rejected
```

These are recommendation-review states only.

Do not use these to represent actual transfer execution.

## Recommendation Immutability

After creation, immutable analytical fields include:

- source/destination evaluations;
- source/destination branch/category/week;
- snapshots;
- recommended quantity;
- candidate list/ranking.

Do not allow generic update APIs to alter those fields.

Only dedicated decision fields may change.

## Owner/Admin Decision

Owner/Admin may submit:

### Approve full quantity

```text id="z75hr7"
state = Approved
approved_transfer_units = recommended_transfer_units
```

### Approve lower quantity

Example:

```text id="a4j8y6"
recommended = 3
approved = 2
```

Allowed.

### Reject

```text id="hk3tcc"
state = Rejected
approved_transfer_units = null
```

## Approved Quantity Validation

For Approved:

```text id="q1tcc0"
approved_transfer_units > 0
AND
approved_transfer_units <= recommended_transfer_units
```

Do not allow:

```text id="zz199g"
approved_transfer_units = 0
```

as Approved.

Interpret a zero-unit decision as Reject or require explicit Reject.

## Terminal Decision State

Only:

```text id="9ui5i3"
Pending -> Approved
Pending -> Rejected
```

are allowed.

Do not permit reopening or switching terminal states in VS016.

## Decision Concurrency

Decision must execute through a trusted transactional boundary.

Lock/re-read the recommendation.

Require:

```text id="tf9clh"
state = Pending
```

before transition.

Two concurrent decision requests must not both win.

## Decision Authority

Only active Owner/Admin may:

- generate recommendations;
- approve;
- reject;
- lower approved quantity.

Operations Staff is read-only.

Customer/Renter denied.

## Approved Quantity Does Not Select Vehicles

VS016 does not define:

```text id="pgqm52"
approved_vehicle_ids
```

as canonical truth.

Do not infer:

```text id="90x2v0"
approved quantity = N
therefore first N ranked vehicles selected
```

That remains unresolved under `CQ-026`.

## No Branch Mutation

Neither recommendation generation nor recommendation approval may update:

```text id="8jig9e"
vehicles.branch_id
```

This is a hard stop rule.

## No Transfer Lifecycle

Do not create:

- Dispatched;
- In Transit;
- Received;
- Transfer Completed.

Actual transfer execution belongs to a later client-confirmed slice.

## Generation Idempotency

Protect an explicit recommendation-generation request.

Same idempotency key + same generation context:

return existing batch.

Same key + incompatible context:

reject controlled idempotency mismatch.

Do not silently return unrelated recommendations.

## Atomic Batch Persistence

A generated allocation batch may contain several recommendations.

Persist atomically:

```text id="dgk0x5"
batch
+
all recommendations
+
all candidate rows
```

If any insert fails:

nothing from that batch should persist.

## Recommendation Generation Input

Prefer a minimal explicit generation request.

A suitable baseline request may identify:

- evaluated target week;
- category;
- idempotency key;

or request generation across all latest compatible VS015 evaluations.

Whichever approach best fits the current UI, do not accept client-calculated:

- shortage;
- surplus;
- recommended quantity;
- candidate ranking.

Server must derive all from canonical records.

## Owner/Admin API

Provide trusted endpoints/equivalent for:

- reading recommendation batches/recommendations;
- generating recommendations;
- approving/rejecting a Pending recommendation.

Do not combine unrelated generic mutation behavior.

## Operations Staff API

Read-only safe access may include:

- source branch;
- destination branch;
- category;
- week;
- recommended quantity;
- decision state;
- approved quantity when decided;
- candidate vehicle operational identity if appropriate.

No generation or decision mutation.

## Customer API

Reject internal allocation recommendation access.

## Sensitive Data Boundary

Do not expose through recommendations:

- renter name;
- government IDs;
- payment details;
- requirement documents;
- booking notes.

Candidate explanations need only operational eligibility/idle information.

## Owner/Admin UI

Extend the existing forecast/supply decision-support surface.

At minimum show:

- target week;
- category;
- destination branch;
- shortage;
- source branch;
- surplus;
- recommended units;
- ranked candidate vehicles;
- candidate idle duration where known;
- recommendation state;
- approved quantity if decided.

Provide explicit:

- Generate Allocation Recommendations;
- Approve;
- Approve Lower Quantity;
- Reject.

Do not add transfer-execution controls.

## Operations Staff UI

Read-only display only.

No approval controls.

## Customer UI

No internal allocation UI.

## Explanation / Transparency

For each recommendation, clearly show:

```text id="ubq0ya"
Destination:
Required R
Supply S
Shortage

Source:
Required R
Supply S
Surplus

Recommended:
min(remaining shortage,
    remaining surplus,
    available candidates)
```

No opaque score.

## Testing

Add focused tests for at least:

- same category/week pairing;
- different category rejected;
- different week rejected;
- same branch rejected;
- shortage-only destination;
- surplus-only source;
- transfer quantity min formula;
- source surplus not oversubscribed across batch;
- destination shortage not oversubscribed across batch;
- candidates sourced only from eligible VS015 snapshot rows;
- candidate no longer in source branch excluded;
- wrong category excluded;
- inactive candidate excluded;
- maintenance-not-ready candidate excluded;
- active-rental candidate excluded;
- target-week booking conflict excluded;
- candidate count caps recommendation;
- zero candidate pair skipped;
- known idle duration longest first;
- unknown idle after known;
- deterministic tie-breaker;
- <14 idle days still eligible;
- batch/recommendations/candidates atomic;
- idempotent generation;
- idempotency mismatch rejected;
- Pending -> Approved;
- Pending -> Rejected;
- lower positive approved quantity;
- approval over recommendation rejected;
- zero approved quantity not Approved;
- terminal decision cannot reopen;
- concurrent decisions protected;
- decision does not mutate analytical fields;
- recommendation/approval does not mutate vehicle branch;
- Staff cannot generate/decide;
- Customer denied.

## Provider-Backed Validation

Where configured, validate at minimum:

1. create controlled shortage and surplus evaluations;
2. generate recommendation;
3. verify same category/week pairing;
4. verify quantity min formula;
5. verify no oversubscription across multiple pairs;
6. verify candidate ranking from canonical idle duration;
7. verify changed/unavailable candidate is excluded;
8. verify candidate-count cap;
9. verify immutable recommendation/candidates;
10. approve full quantity;
11. approve lower quantity on another recommendation;
12. reject another recommendation;
13. terminal transition rejected;
14. Operations Staff read-only;
15. Customer denied;
16. no `vehicles.branch_id` changes occur.

Use disposable development data where practical.

## Client Clarification Preservation

Preserve:

- `CQ-016`;
- `CQ-017`;
- `CQ-018`;
- `CQ-025`;
- `CQ-026`.

## Definition of Done

VS016 is complete when:

- recommendations consume immutable VS015 evaluations;
- only compatible shortage/surplus branch pairs are used;
- remaining shortage/surplus prevents oversubscription;
- recommended quantity respects candidate availability;
- source candidates originate from VS015 eligibility snapshots;
- current candidate revalidation exists;
- canonical idle duration determines deterministic ranking;
- 14-day Idle status is not a hidden eligibility rule;
- immutable recommendation and candidate snapshots exist;
- Owner/Admin can Approve/Reject/lower quantity;
- decision state is transactionally protected;
- original recommendation remains preserved;
- Operations Staff is read-only;
- Customer is denied;
- approval does not select exact transfer units;
- no branch mutation or transfer execution occurs.

## Stop Rule

Stop after Internal Branch Allocation Recommendation is complete.

Do not implement:

- exact approved vehicle selection;
- physical vehicle transfer;
- vehicle branch reassignment;
- dispatch/receipt workflow;
- route/distance/weather/traffic context;
- Smart Vehicle Finder changes;
- notifications;
- VS017.