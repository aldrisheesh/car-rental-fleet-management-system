# Vertical Slice 024 — Administrative Context-Aware Decision Support

**Status:** Approved for implementation  
**Objective:** Integrate the interpreted operational context from VS023 into the canonical Owner/Admin booking-assignment and branch-allocation review workflows as transparent advisory information, without altering Finder behavior, candidate eligibility/ranking, allocation scoring/quantities, or business lifecycle state.

## Purpose

VS022 established external-context acquisition.

VS023 established deterministic interpretation.

VS024 makes that context useful at the two Admin decision points required by the manuscript:

```text
Booking Assignment Review
        ↓
Trip operational context
        ↓
Owner/Admin decides

Branch Allocation Review
        ↓
Current transfer-route context
        ↓
Owner/Admin decides
```

The context remains advisory.

## Manuscript Traceability

### Supports

**R11 — Context-Aware Decision Support**

Supports Owner/Admin review of:

- weather;
- road condition;
- route feasibility;
- route accessibility;
- travel distance;
- travel duration;
- reference fuel efficiency;
- estimated fuel consumption.

These contextual factors support:

- vehicle-assignment review;
- branch-allocation review.

They do not independently determine final action.

### Allocation Use Case

Supports the manuscript step where the Owner/Admin reviews contextual factors before deciding on the recommendation.

### R8 — Branch Allocation

Preserves the human-in-the-loop boundary.

VS024 must not automatically:

- transfer vehicles;
- approve recommendations;
- reject recommendations;
- modify recommended quantities.

### Customer Smart Vehicle Finder

The Customer Finder remains unchanged.

VS024 must not reintroduce an Admin-side vehicle recommendation algorithm.

### Data Dictionary / ERD

No new canonical context snapshot entity is required for VS024.

If implementation requires persistence beyond existing canonical data:

- stop;
- report the blocker;
- add a MIC/change-register entry before proceeding.

### Implementation Changes Requiring Manuscript Update

Tracked:

- `MIC-023` — Route Accessibility safe `Unknown` state.
- `MIC-024` — allocation context uses current review-time conditions because the recommendation has no exact transfer timestamp.

### Must Not Contradict

- VS022 provider architecture;
- VS023 interpretation vocabulary;
- customer-side Smart Vehicle Finder;
- advisory allocation behavior;
- CQ-028 unresolved Briah travel restrictions;
- current assignment/confirmation safeguards.

## Required Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `engineering/sprints/VERTICAL-SLICE-024.md`
- `codex-context/34-admin-context-aware-decision-support.md`
- `codex-context/35-manuscript-traceability-vs024.md`
- `codex-context/25-canonical-subsystem-map.md`

Then inspect only the exact implementation surfaces listed below.

Do not read previous vertical-slice contracts.

## Strict Initial Inspection

Inspect:

1. `src/routes/admin.bookings.tsx`
   - selected booking;
   - assignment/confirmation area;
   - candidate vehicle state.

2. canonical booking API/read shape required to resolve:
   - booking destination;
   - pickup branch;
   - pickup time;
   - selected candidate vehicle.

3. `src/routes/admin.decisions.tsx`
   - canonical allocation recommendation section;
   - obsolete hard-coded Admin vehicle-recommendation card.

4. `/api/allocation-recommendations`
   - recommendation ID;
   - source branch;
   - destination branch;
   - candidates.

5. VS022 trusted acquisition:
   - `getTrustedTripContext`
   - normalized types.

6. VS023:
   - `interpretOperationalContext`

7. smallest suitable Owner/Admin-only server route for context retrieval.

Do not inspect or modify:

- Smart Vehicle Finder;
- allocation generation/scoring;
- WMA forecasting;
- projected supply;
- notifications/reminders;
- audit;
- maintenance;
- requirements/payment internals except exact booking fields required for compilation.

## Scope

VS024 implements:

1. Owner/Admin-only operational-context API;
2. canonical booking-assignment context resolution;
3. booking-assignment context panel;
4. selected-candidate fuel estimate display;
5. canonical allocation-review context resolution;
6. allocation context panel;
7. candidate reference fuel/estimate display where practical;
8. safe loading/partial/unavailable states;
9. readable context explanations;
10. removal/replacement of obsolete prototype Admin vehicle recommendation card;
11. focused authorization/integration tests.

## Trusted Context API

Create the smallest route consistent with repository architecture.

Conceptually:

```text
/api/operational-context
```

Equivalent naming is acceptable.

The endpoint is:

```text
Owner/Admin only
```

Customer/Renter:

```text
DENY
```

Operations Staff:

```text
DENY
```

Do not expand Staff authorization merely because they can currently read some allocation information.

## Request Modes

Use narrow semantic request modes.

Conceptually:

```text
booking_assignment
allocation_review
allocation_candidate
```

Equivalent naming is acceptable.

Do not build a generic browser-controlled provider proxy.

## Canonical Input Resolution

The browser may identify:

- booking ID;
- recommendation ID;
- candidate vehicle ID.

But the server must resolve authoritative context inputs itself.

Do not trust browser-provided:

- branch addresses;
- destination override;
- vehicle km/L;
- route coordinates;
- provider choice;
- weather time.

## Booking Assignment Context

For:

```text
kind = booking_assignment
```

resolve canonical:

```text
booking
├── destination
├── pickup_at
├── pickup_branch_id
└── selected candidate vehicle when provided
```

Trip:

```text
Origin
= canonical pickup branch

Destination
= canonical booking destination

Weather target
= booking pickup_at
```

Then:

```text
getTrustedTripContext(...)
        ↓
interpretOperationalContext(...)
```

Return only normalized safe interpreted context.

## Booking Destination

Use the canonical booking/Finder destination field that currently exists.

Do not derive destination from:

- customer's home address;
- branch name;
- vehicle branch;
- arbitrary Admin browser text.

If destination is missing:

```text
status = not_applicable
reason = missing_destination
```

or equivalent.

Do not call providers unnecessarily.

Assignment must remain usable.

## Selected Candidate Vehicle

The candidate vehicle ID must be validated against the actual assignment context.

At minimum ensure:

- vehicle exists;
- vehicle is part of the current assignment candidate set / valid candidate boundary already used by the booking workflow.

Do not allow arbitrary vehicle IDs merely to query their fuel efficiency.

## Booking Fuel Estimate

Trip-level values:

- weather;
- road condition;
- route feasibility;
- route accessibility;
- distance;
- travel duration.

Vehicle-specific:

- reference km/L;
- estimated fuel liters.

When Owner/Admin changes the selected candidate:

```text
candidate changes
        ↓
trip route stays logically same
        ↓
fuel estimate updates
```

Do not reorder candidate options based on estimated fuel.

## Booking UI Placement

Add the context section inside or adjacent to:

```text
Assignment & confirmation
```

for the selected submitted booking.

Suggested structure:

```text
Operational Context

Weather
Caution

Road Condition
Open

Route Feasibility
Feasible with Caution

Route Accessibility
Accessible

Distance
58.4 km

Travel Time
1h 26m

Selected Vehicle
11.2 km/L

Estimated Fuel
5.2 L
```

Exact styling should use existing Admin components.

## Assignment Context Warnings

Context labels may visually emphasize:

- Severe;
- Caution;
- Closed/Impassable;
- Not Feasible;
- Limited;
- Closed/Restricted;
- Unavailable/Unknown.

But they must remain informational.

Do not disable:

```text
Assign / Change
```

or:

```text
Confirm booking
```

solely because of VS024 context.

Existing canonical business checks remain authoritative.

## Context Source / Freshness

Show compact source/freshness information.

Examples:

```text
Checked 10:31 AM
Weather: Open-Meteo
Traffic: TomTom
```

or a concise equivalent.

If fallback was used:

```text
Weather: OpenWeather fallback
```

Do not display API keys or raw provider URLs.

## Explanations

Map VS023 machine reasons to concise readable text.

Examples:

```text
weather_rain
→ Rain may affect travel conditions.

roadworks
→ Road works may affect the route.

road_closure
→ A relevant road closure was reported.

context_unavailable
→ Some operational context could not be verified.
```

Preserve machine reason codes internally where useful.

## Partial Context

Do not reduce the entire panel to failure if only one factor is unavailable.

Example:

```text
Weather            Unavailable
Road Condition     Open
Route Feasibility  Unavailable
Distance           58.4 km
Travel Time         1h 26m
```

is valid.

## Allocation Review Context

For:

```text
kind = allocation_review
```

resolve canonical recommendation:

```text
recommendation
├── source_branch_id
├── destination_branch_id
├── candidate vehicles
├── target week
└── current recommendation state
```

Resolve source/destination branch addresses server-side.

## Allocation Route

Context route:

```text
Source branch
        ↓
Destination branch
```

Do not use an arbitrary customer destination for allocation.

## Allocation Time Semantics

The canonical recommendation has a target forecast week but no exact transfer time.

Therefore use:

```text
current review time
```

for time-sensitive operational context.

UI must label this explicitly:

```text
Current route context for transfer review
```

or equivalent.

Do not imply:

```text
This is the weather on the future transfer date.
```

## Allocation Context Freshness

Show:

```text
Evaluated/checked at
```

for weather/traffic-sensitive context.

This is important because allocation recommendations can remain stored while external context changes.

## Allocation Stable Context

Display:

- source branch;
- destination branch;
- route distance;
- route duration;
- weather;
- road condition;
- route feasibility;
- route accessibility;
- source/provider status;
- limitations.

## Allocation Candidate Fuel

Where candidate vehicle IDs are available:

show per candidate:

```text
Reference efficiency
Estimated fuel for transfer route
```

Do not recompute route once per candidate unnecessarily.

Use one route context and vehicle-specific efficiency.

## Candidate Ranking

Do not alter:

```text
candidate_rank
```

because of:

- route;
- weather;
- fuel;
- incidents.

VS016 ranking remains canonical.

## Recommended Transfer Quantity

Do not alter:

```text
recommended_transfer_units
```

because of operational context.

If the route is closed:

```text
Recommendation: 2 units
Current context: Not Feasible
```

may both be shown.

Owner/Admin makes the decision.

## Allocation Decision

Existing:

```text
Approve
Reject
Approved transfer units
```

behavior remains unchanged.

Do not create:

```text
Auto Reject because route closed
```

## Context Snapshot Boundary

Do not add context columns to:

```text
allocation_recommendations
```

in VS024.

Do not persist weather/road interpretation into the recommendation snapshot.

Display-time context is current advisory information.

## Existing Admin Vehicle Recommendation Card

The current Decision Support page contains a hard-coded prototype:

```text
Vehicle recommendation
Top match
Toyota Innova
Radar score
```

This is obsolete because canonical vehicle recommendation is now customer-side.

Remove/replace this card with canonical Operational Context / Context-Aware Decision Support content.

Do not preserve the prototype radar merely as decoration if it implies an active Admin recommendation algorithm.

## Decision Support Page Boundary

Do not broadly fix:

- mock forecast chart;
- mock utilization table;
- mock idle-vehicle section;
- other Reports/Dashboard prototype data

in VS024.

Those belong to later canonicalization.

Only touch the area needed for:

- canonical allocation context;
- obsolete Admin recommendation removal.

## Loading Behavior

Use clear states:

```text
Loading context...
```

```text
Context unavailable
```

```text
Partial context
```

Do not spin indefinitely.

The VS022 provider layer already has timeouts.

## Error Behavior

Context endpoint failure should produce a safe UI message.

It must not crash the booking/allocation page.

Do not expose raw provider exceptions.

## Attribution

Where context is visibly derived from providers, show provider/source attribution consistent with provider terms.

Keep it compact.

## Authorization Tests

Verify:

- Owner/Admin allowed;
- Customer denied;
- Operations Staff denied;
- unauthenticated denied.

## Booking Context Tests

Verify:

- booking resolves canonical destination;
- booking resolves canonical pickup branch;
- pickup time is used as target time;
- missing destination avoids provider context safely;
- invalid booking denied/not found;
- arbitrary candidate vehicle rejected;
- candidate fuel estimate uses canonical reference efficiency.

## Allocation Context Tests

Verify:

- recommendation resolves canonical source branch;
- recommendation resolves canonical destination branch;
- current trusted time is used for time-sensitive context;
- invalid recommendation denied/not found;
- candidate vehicle scope validated;
- context does not alter recommendation state/rank/units.

## UI Tests

Booking:

- context visible on selected submitted booking;
- candidate change updates fuel display;
- unavailable context does not block assignment.

Allocation:

- context panel appears for recommendation review;
- current-review wording visible;
- context failure does not block Approve/Reject;
- candidate order unchanged.

## Strict Scope Tests

Verify no code changes to:

- vehicle Finder;
- allocation scoring/generation library;
- forecasting;
- projected supply;
- pricing/payment.

## Provider-Backed Validation

VS024 may reuse live providers through the actual context API if credentials are configured.

Validate sparingly:

1. one booking with destination;
2. one allocation route between real configured branch addresses.

If provider credentials are absent:

```text
NOT CONFIGURED
```

is acceptable.

Do not fabricate success.

## Manuscript Post-Implementation Review

Verify:

- R11 assignment + allocation contextual support exists;
- context remains advisory;
- allocation target week was not misrepresented as exact transfer time;
- obsolete Admin recommendation card is removed;
- Finder unchanged;
- MIC-024 reflects actual implementation.

If implementation chooses a materially different time/context approach:

update MIC-024 before manuscript revision.

## Definition of Done

VS024 is complete when:

- Owner/Admin context endpoint exists;
- booking assignment context uses canonical booking/branch data;
- selected vehicle fuel estimate works;
- allocation review context uses canonical source/destination branches;
- allocation context clearly reflects current review-time conditions;
- provider/fallback/source/limitations can be understood;
- context does not change assignment candidate order/eligibility;
- context does not change allocation ranks/quantities;
- allocation decisions remain human-controlled;
- obsolete Admin recommendation prototype is removed/replaced;
- Customer/Operations Staff cannot access the new context endpoint;
- no Finder behavior changes.

## Stop Rule

Stop after VS024.

Do not implement:

- VS025;
- Customer Finder contextual ranking;
- new vehicle-assignment scoring;
- allocation scoring changes;
- automatic transfer;
- CQ-028 rules;
- context persistence/snapshots;
- report/dashboard full canonicalization;
- notification changes.