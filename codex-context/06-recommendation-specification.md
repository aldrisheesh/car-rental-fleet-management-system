# Recommendation Specification

**Status:** Frozen for Development Baseline v1, except item-level transfer approval persistence  
**Last updated:** 2026-08-29

There are two separate deterministic rule-based recommendation functions. Do not merge them.

---

## A. Customer-Side Vehicle Recommendation

### Purpose

Assist a customer in identifying suitable available vehicles before submitting a booking request.

It is vehicle-selection guidance only. It does not approve a booking and does not guarantee final vehicle assignment.

### Customer Inputs

- passenger capacity
- destination or travel area
- total rental budget
- rental duration
- vehicle preference
- requested rental period

Destination/travel area is collected as trip/request information. External weather/road/route context is not a hard customer-recommendation criterion in the current baseline.

### Hard Eligibility Rules

A vehicle is eligible only when all of the following are satisfied:

1. vehicle is active
2. vehicle is available for the requested rental period with no conflicting reservation/rental commitment
3. vehicle is maintenance-ready
4. vehicle passenger capacity is greater than or equal to requested passenger capacity
5. estimated base rental cost is less than or equal to the customer's total base rental budget

Base rental cost:

`EstimatedBaseRentalCost = DailyRate * RentalDurationDays`

Do not include conditional penalties, damages, fuel charges, late charges, or other not-yet-incurred charges in this base-budget eligibility test.

Vehicles that fail a hard eligibility rule are excluded, not merely ranked lower.

### Deterministic Ranking

Rank remaining eligible vehicles in this order:

1. preferred vehicle category/type match
2. closest adequate passenger capacity (avoid unnecessary excess capacity)
3. lower estimated base rental cost
4. stable deterministic tie-breaker such as vehicle identifier/name only when the preceding criteria are equal

Do not create arbitrary 0–100 match scores, confidence scores, or hidden weighting formulas.

### Output

Return suitable vehicles with reason-oriented explanations such as:

- matches preferred category
- meets passenger capacity
- within stated base rental budget
- available for requested dates
- maintenance-ready

If no vehicle satisfies all hard rules, return a clear no-match result rather than relaxing mandatory constraints silently.

### Context Separation

External weather, road condition, route feasibility, and route accessibility belong to the administrative context-aware decision-support layer in the current development baseline.

The customer recommendation must continue to work without external context APIs.

---

## B. Admin-Side Branch Allocation Recommendation

### Purpose

Assist Owner/Admin in reviewing possible redistribution of eligible vehicles between branches for an evaluated vehicle category and weekly forecast period.

### Inputs

- forecasted demand for the evaluated branch/category/horizon
- rounded-up required vehicle units
- projected available supply
- vehicle availability
- maintenance readiness
- idle-vehicle information
- applicable contextual information after internal analysis

### Required Vehicles

For branch `b`, category `c`, horizon `h`:

`R[b,c,h] = ceil(F[b,c,h])`

### Projected Supply

`S[b,c,h]` includes vehicles assigned to branch `b` / category `c` that are:

- active
- maintenance-ready
- not committed to conflicting reservations/rentals during the evaluated weekly period

### Shortage

`Shortage[b,c,h] = max(0, R[b,c,h] - S[b,c,h])`

### Surplus

`Surplus[b,c,h] = max(0, S[b,c,h] - R[b,c,h])`

If `R == S`, the branch has neither shortage nor surplus.

There is no separate arbitrary shortage threshold. A positive shortage/surplus comes directly from the formulas above.

There is no additional hidden reserve threshold in the current baseline; the source branch's own rounded-up forecast requirement is already preserved before surplus is declared.

### Transfer Eligibility

A transfer recommendation may exist when:

- destination branch has `Shortage > 0`
- a different source branch has `Surplus > 0`
- source and destination are evaluated for the same vehicle category and weekly period
- one or more source vehicles are eligible transfer candidates

### Recommended Transfer Quantity

`RecommendedTransferUnits = min(DestinationShortageUnits, SourceSurplusUnits)`

The system must never recommend transferring more units than either the destination shortage or the source surplus allows.

### Candidate Vehicle Eligibility

A source vehicle is an eligible transfer candidate only when it is:

- in the required vehicle category
- assigned to the source branch
- active
- maintenance-ready
- schedule-available for the evaluated period
- not committed to a conflicting booking/rental

### Candidate Prioritization

Eligible candidates are ordered primarily by **longest idle duration first**.

Use deterministic tie-breaking when idle days are equal.

Do not add an arbitrary candidate score.

### Context Application

Context is evaluated **after** internal shortage/surplus/supply/candidate analysis.

Context may include:

- weather
- road condition
- route feasibility
- route accessibility
- travel distance/time
- reference fuel efficiency
- estimated fuel consumption

Context does not create a shortage or surplus.

If context is cautionary, retain the underlying recommendation and attach the corresponding warning/review state.

If the route is `Not Feasible`, or road/accessibility conditions prevent movement, retain the underlying shortage/surplus/recommendation record but indicate that the proposed movement is **not presently feasible**.

If context is unavailable, keep the internal recommendation logic and clearly mark the unavailable/unknown factors. Never assume favorable context.

See `07-external-context-and-api-rules.md`.

### Human Review

The recommendation is advisory.

Owner/Admin may:

- approve
- reject
- approve a lower transfer quantity than the system originally recommended

Preserve both values:

- `recommended_transfer_units` = original system output
- `approved_transfer_units` = final approved quantity, nullable until approved

Do not overwrite the original recommendation when the human decision differs.

If approved quantity is zero, treat the recommendation as rejected rather than silently storing an approved zero-unit transfer.

The final branch reassignment/transfer action must not happen automatically merely because a recommendation exists.

### Recommendation Traceability

A recommendation should preserve both the destination and source forecast records used for its shortage/surplus calculation where the schema supports it.

The recommendation explanation should identify:

- source branch
- destination branch
- category
- evaluated week/horizon
- destination requirement/supply/shortage
- source requirement/supply/surplus
- recommended transfer quantity
- candidate vehicles/reasons
- applicable context/warnings

### Open Item-Level Persistence Detail

When the system recommends multiple candidate vehicles but Owner/Admin approves fewer units, the exact item-level schema for identifying which candidate vehicles were approved remains open.

Codex must not invent this field/status silently. See `10-open-decisions.md`.

## Codex Guardrails

Codex must not:

- merge customer recommendation and admin allocation
- invent percentage-match/confidence/urgency scores
- relax customer hard filters silently
- let external context independently create shortage/surplus
- auto-transfer vehicles
- overwrite original system recommendation quantities with human-approved values
