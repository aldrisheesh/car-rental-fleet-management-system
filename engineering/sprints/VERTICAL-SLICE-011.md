# Vertical Slice 011 — Vehicle Return and Rental Closure

**Status:** Approved for implementation  
**Objective:** Implement the canonical physical vehicle-return event for an active rental, persist a return snapshot, transactionally end the rental, and establish canonical completed-rental intervals for later utilization/idle/reporting capabilities without implementing financial settlement or a broad rental lifecycle state machine.

## Purpose

VS010 established:

- canonical rental transactions;
- explicit Owner/Admin vehicle release;
- database-controlled `started_at`;
- active-rental exclusivity;
- release odometer/fuel/condition snapshots;
- Customer/Renter active-rental visibility.

VS011 completes the physical rental interval.

The slice must establish:

- Owner/Admin-controlled physical return;
- canonical `ended_at`;
- return odometer/fuel/condition snapshot;
- release-versus-return inspection context;
- informational late-return detection;
- duplicate/concurrent return protection;
- customer visibility of returned rental state;
- canonical ended rental intervals usable by later analytics.

This slice does **not** implement final financial settlement.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/03-workflows-and-status-rules.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/14-client-clarification-register.md`
- `codex-context/16-rental-release-and-start.md`
- `codex-context/17-rental-return-and-closure.md`
- this slice contract.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

Inspect the existing VS010 rental implementation only as necessary to extend the canonical rental transaction safely.

## Core Boundary

VS011 implements:

```text
Active Rental
started_at != null
ended_at = null
        ↓
Owner/Admin records physical return
        ↓
return snapshot persisted
        ↓
ended_at = database-controlled actual return time
        ↓
Ended Rental
started_at != null
ended_at != null
```

Do not change booking status from:

`Confirmed`

merely because the rental ended.

Do not introduce a canonical rental status enum.

## Authority

### Owner/Admin

May:

- list/read active rentals;
- inspect release information;
- record physical return;
- inspect ended rental information.

### Customer/Renter

May:

- view their own active/ended rental state;
- view actual start and return timestamps;
- view scheduled return information.

May not:

- close the rental;
- set `ended_at`;
- modify return information;
- record administrative inspection data.

### Operations Staff

Must not perform final rental return/closure in VS011.

`CQ-016` remains unresolved.

Do not broaden Staff permissions.

## Canonical Rental Extension

Extend `rental_transactions` additively.

Add only the return fields required by VS011.

At minimum support:

- `ended_at`;
- `returned_by`;
- `return_odometer`;
- `return_fuel_level`;
- `return_condition_summary`;
- `observed_damage_notes`;
- `return_remarks`;
- updated timestamp.

Preserve all release snapshot fields unchanged.

Do not add:

- damage amount;
- fuel charge;
- late penalty;
- security-deposit deduction;
- remaining balance;
- settlement status;

merely for convenience.

Those belong to later approved capabilities.

## Active and Ended Semantics

Canonical active rental:

```text
started_at IS NOT NULL
AND ended_at IS NULL
```

Canonical ended rental:

```text
started_at IS NOT NULL
AND ended_at IS NOT NULL
```

The UI may display derived labels such as:

- Active
- Returned

but do not persist these as a new rental-status enum.

## Return Eligibility

Physical return may succeed only when:

1. authenticated principal is active Owner/Admin;
2. canonical rental exists;
3. `started_at IS NOT NULL`;
4. `ended_at IS NULL`;
5. associated booking exists;
6. associated booking remains `Confirmed`;
7. rental vehicle exists;
8. Owner/Admin explicitly performs the return action.

Do not automatically end a rental because:

```text
current time >= scheduled_return_at
```

Scheduled return is not actual return.

## Canonical Return Time

`ended_at` must be generated at the trusted database/server boundary when the return transaction succeeds.

Do not accept arbitrary browser-supplied:

`ended_at`

as canonical truth.

This timestamp represents actual recorded physical return under the current provisional workflow.

## Stale Rental Context

The return action must operate on the rental state Owner/Admin actually reviewed.

Require stable expected context.

At minimum use:

- expected rental ID;
- expected vehicle ID;
- expected `started_at`.

If any differs from canonical state:

reject the return as stale and require reload.

Do not permit a return request to choose another vehicle.

## Transactional Return

Prefer a focused PostgreSQL function/RPC.

Within one transaction:

1. authorize active Owner/Admin;
2. lock the rental row;
3. require rental is active;
4. re-read/validate associated booking;
5. require booking remains `Confirmed`;
6. validate expected rental/vehicle/start context;
7. validate return inputs;
8. set database-controlled `ended_at`;
9. persist return snapshot;
10. record `returned_by`;
11. return canonical ended rental.

Two concurrent return attempts must not both succeed.

One should succeed.

The other should receive a controlled:

- already returned;
- stale rental;

or equivalent domain error.

## Vehicle Locking

Use the smallest reliable concurrency mechanism.

Where appropriate, acquire the same vehicle-keyed advisory transaction lock pattern established by VS009/VS010 before closing the rental.

The return transaction should coordinate safely with any concurrent rental-start operation involving the same vehicle.

Do not build a new generalized locking framework.

## Return Odometer

Return odometer is optional while `CQ-020` remains unresolved.

When supplied:

- numeric;
- finite;
- non-negative.

When `release_odometer` exists:

```text
return_odometer >= release_odometer
```

must hold.

Reject a lower return reading.

When both exist, the system may derive:

```text
driven_km =
return_odometer - release_odometer
```

Do not persist a fabricated mileage value when either reading is absent.

## Vehicle Master Odometer

If an authoritative canonical vehicle mileage/odometer field already exists and its semantics are clear:

- a valid return odometer may advance it;
- never reduce it.

If no safe canonical master mileage field exists:

- preserve only the rental return snapshot;
- do not invent one in VS011.

## Return Fuel Snapshot

Use exactly the provisional VS010 fuel values:

- `Empty`
- `1/4`
- `1/2`
- `3/4`
- `Full`
- `Other/Unknown`

Do not introduce additional fuel vocabulary in this slice.

Do not calculate:

- fuel shortage;
- fuel replacement cost;
- service fee.

`CQ-013` remains unresolved.

## Return Condition

Require a concise return condition summary.

Allow optional:

- observed/new damage or condition notes;
- general return remarks.

The Owner/Admin UI should make the original release snapshot available alongside the return inputs where practical.

This assists human comparison.

Do not automatically classify a difference as renter-caused damage.

## Damage Boundary

Do not implement:

- damage liability;
- damage pricing;
- penalty matrix;
- security-deposit deductions.

`CQ-012` remains unresolved.

Observed damage is evidence/inspection information only.

## Late Return

After canonical `ended_at` exists, derive:

```text
late_return =
ended_at > scheduled_return_at
```

Where useful, derive lateness duration.

This is informational only.

Do not automatically create:

```text
₱3,000 penalty
```

or any monetary charge.

`CQ-011` remains unresolved.

## Settlement Boundary

VS011 records **physical vehicle return**.

It does not perform final financial settlement.

Do not require or fabricate:

- remaining balance settlement;
- security-deposit refund/deduction;
- damage payment;
- fuel payment;
- late payment;
- final financial closure.

Under the provisional `CQ-022` assumption:

```text
physical return
        ↓
ended_at recorded
        ↓
rental interval ended
        ↓
financial settlement may still be pending
```

Do not describe this as final Briah accounting policy.

## Active-Vehicle Uniqueness After Return

VS010 established a unique partial invariant for active rentals.

When `ended_at` becomes non-null, the rental no longer occupies the active-rental uniqueness condition.

That means another rental can later use the vehicle from the active-rental exclusivity perspective.

This does **not** mean the system has determined:

- vehicle is clean;
- vehicle is damage-free;
- vehicle is maintenance-ready;
- vehicle is operationally `Available`.

Do not create such a transition.

## Vehicle Branch

Do not mutate:

`vehicles.branch_id`

during return.

Physical return is not automatically a canonical branch-transfer action.

## Booking Status

Booking remains:

`Confirmed`

after physical return in the current baseline.

Do not create:

- `Completed`
- `Returned`
- `Closed`

booking statuses.

A future client-confirmed workflow may revise broader lifecycle presentation without rewriting the canonical rental interval.

## Owner/Admin Read Model

Owner/Admin should be able to identify active rentals and inspect at minimum:

- rental;
- booking/customer context;
- vehicle;
- started_at;
- scheduled return;
- release odometer;
- release fuel;
- release condition;
- existing damage notes;
- return state.

After closure, show:

- ended_at;
- return snapshot;
- derived late-return state;
- driven distance when derivable.

## Customer Read Model

Customer/Renter should receive a deliberately safe projection.

At minimum:

- rental ID;
- booking ID;
- assigned vehicle context;
- scheduled pickup/return;
- started_at;
- ended_at;
- derived active/returned state.

Do not expose:

- `released_by`;
- `returned_by`;
- internal release notes;
- observed damage notes;
- administrative return remarks;
- administrative acknowledgement flags.

## Operations Staff Read Model

Do not add final return mutations.

If the existing permitted booking/rental coordination view needs a safe active/returned indicator, it may receive only non-sensitive operational state.

Do not expose payment-sensitive or protected customer data.

## Owner/Admin UI Integration

Extend the current release/rental presentation rather than creating a broad redesign.

For an active rental, provide a minimal return panel with:

- customer/booking;
- vehicle;
- actual start;
- scheduled return;
- release odometer/fuel/condition;
- existing damage baseline;
- return odometer;
- return fuel;
- return condition summary;
- observed damage/condition notes;
- return remarks;
- explicit `Record Vehicle Return` action.

After successful return:

- show actual return timestamp;
- show returned/ended state;
- show late indicator if applicable;
- show driven km when derivable;
- stop.

Do not continue automatically into settlement.

## Customer UI Integration

For the customer's own rental:

Before return:

`Active rental`

After return:

`Vehicle returned`

Show actual return time.

Do not display prototype financial settlement behavior.

## Error Handling

Handle at minimum:

- unauthenticated request;
- wrong role;
- rental not found;
- rental not active;
- booking no longer valid for closure;
- stale rental/vehicle/start context;
- invalid return odometer;
- return odometer below release odometer;
- invalid fuel value;
- missing condition summary;
- duplicate/concurrent return;
- provider/database failure.

Use controlled domain messages.

Do not expose raw SQL/internal stack traces.

## Testing

Add focused tests where practical for:

- Owner/Admin-only return;
- Customer cannot return;
- Operations Staff cannot return;
- active rental required;
- ended rental cannot be ended twice;
- scheduled return passing does not automatically end rental;
- stale rental context rejected;
- invalid negative odometer rejected;
- return odometer below release reading rejected;
- valid equal/higher return odometer accepted;
- allowed fuel values;
- return condition required;
- server-controlled ended_at;
- booking remains Confirmed;
- active rental becomes ended;
- active-vehicle uniqueness no longer blocks after ended_at;
- vehicle branch unchanged;
- no rental status enum introduced;
- no monetary charges created;
- customer projection excludes administrative return fields.

## Provider-Backed Validation

Where configured, verify:

1. Owner/Admin can return an active rental;
2. canonical `ended_at` is persisted;
3. `returned_by` is persisted internally;
4. release snapshot remains unchanged;
5. return snapshot persists;
6. second return fails;
7. Customer cannot perform return;
8. Operations Staff cannot perform return;
9. Customer sees returned state after reload;
10. booking remains Confirmed;
11. vehicle branch remains unchanged;
12. another later rental is no longer blocked by the ended rental's active uniqueness condition;
13. no damage/fuel/late monetary charge is automatically created.

Use disposable development data where practical.

## Client Clarification Preservation

Do not resolve or remove:

- `CQ-002`;
- `CQ-003`;
- `CQ-009`;
- `CQ-011`;
- `CQ-012`;
- `CQ-013`;
- `CQ-014`;
- `CQ-016`;
- `CQ-020`;
- `CQ-021`;
- `CQ-022`.

VS011's physical-return-before-financial-settlement behavior remains provisional until client validation.

## Definition of Done

VS011 is complete when:

- Owner/Admin can explicitly return an active rental;
- canonical `ended_at` records actual physical return;
- release snapshot is preserved;
- return snapshot is persisted separately;
- return odometer rules are enforced;
- late return can be derived informationally;
- concurrent/duplicate return is prevented;
- Customer sees safe returned state;
- booking remains Confirmed;
- vehicle branch/status is not prematurely mutated;
- no financial settlement/charges are invented;
- canonical start/end rental intervals are available for later analytics.

## Stop Rule

Stop after Vehicle Return and Rental Closure foundation is complete.

Do not implement:

- final financial settlement;
- security-deposit deduction/refund;
- remaining-balance workflow;
- damage/fuel/late charges;
- rental extensions;
- maintenance lifecycle;
- final vehicle operational-status workflow;
- notifications;
- forecasting/utilization UI;
- VS012.