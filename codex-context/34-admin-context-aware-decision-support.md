# Administrative Context-Aware Decision Support

**Status:** Frozen for VS024
**Last updated:** 2026-09-02
**Authority:** Latest manuscript R11/use-case intent + completed VS022/VS023 + current canonical Admin workflows

VS024 integrates the interpreted operational context from VS023 into the two Owner/Admin workflows where the manuscript actually places it: booking vehicle-assignment review and branch-allocation recommendation review.

The manuscript has gaps in exact UI placement and timing semantics. Where those gaps exist, VS024 uses narrow researcher-designed presentation rules without changing the underlying business algorithms.

## 1. Why both Admin surfaces

The latest manuscript explicitly states that operational/external context supports both:
- administrative vehicle-assignment decisions; and
- branch-allocation decisions.

R11 identifies weather, road condition, route feasibility, route accessibility, travel distance, reference fuel efficiency, and estimated fuel consumption as supporting information for Owner/Admin decisions.

The allocation use case also says the Owner/Admin reviews contextual factors before reviewing/finalizing the allocation recommendation.

Therefore VS024 integrates context into both:
1. Booking -> Assignment & Confirmation;
2. Decision Support -> Allocation Recommendation review.

Do not create a third standalone Context module merely to satisfy the manuscript.

## 2. Current UI reality

The current canonical booking-assignment workflow lives in:
`src/routes/admin.bookings.tsx`

The current canonical branch-allocation workflow lives through:
- `src/routes/admin.decisions.tsx`
- `/api/allocation-recommendations`

The Decision Support page still contains an older prototype Administrator "Vehicle recommendation" card. This predates the Customer Smart Vehicle Finder move and should not remain presented as an authoritative Admin vehicle-recommendation engine.

VS024 should replace/remove only that obsolete prototype card where necessary to make room for canonical context-aware decision support.

Do not broadly redesign or canonicalize the entire Decision Support page in VS024. Remaining prototype forecast/utilization/report presentation belongs to later canonicalization work.

## 3. Booking Assignment Context

For a submitted booking under Owner/Admin assignment review:

Origin:
- canonical pickup branch.

Destination:
- canonical booking/customer destination when available.

Target weather time:
- booking `pickup_at`.

Vehicle for fuel estimate:
- currently selected candidate vehicle in the assignment control.

Context meaning:
`How suitable/affected is the customer's planned trip operationally, based on currently available external context?`

Display:
- Weather classification;
- Road Condition;
- Route Feasibility;
- Route Accessibility;
- route distance;
- travel duration;
- reference fuel efficiency where appropriate;
- estimated fuel consumption;
- source/fallback/unavailable indicators;
- short explanation/reason codes translated to readable copy.

## 4. Assignment remains human-controlled

Context must not:
- disable a candidate vehicle;
- change candidate ordering;
- change maintenance-readiness eligibility;
- create availability conflicts;
- assign the vehicle automatically;
- confirm the booking automatically.

Existing canonical assignment safeguards remain authoritative.

If context is Severe/Caution/Closed/Unavailable, show it as decision-support information/warning only.

CQ-028 remains separate: do not interpret a destination as contractually prohibited by Briah.

## 5. Missing Booking Destination

Some bookings may not contain destination/travel-area text.

If no destination is available:
- Context panel shows `Context unavailable — no destination recorded`;
- assignment workflow remains usable;
- no provider call is attempted.

Do not invent a destination from branch/customer address.

## 6. Candidate-Specific Fuel Context

Route/weather/road context is trip-level.

Reference fuel efficiency and estimated fuel are vehicle-specific.

When Owner/Admin selects a candidate:
- reuse the same trip route context where possible;
- obtain/use candidate canonical reference fuel efficiency;
- show estimated fuel for that candidate.

Do not treat lower estimated fuel as an automatic ranking rule in VS024.

## 7. Allocation Context

For a branch-allocation recommendation:

Origin:
- recommendation source branch.

Destination:
- recommendation destination branch.

Destination text/address:
- canonical destination-branch address, not merely branch display name when an address is available.

Context assessment time:
- **current review time** for road incidents/current operational assessment.

Reason:
The canonical allocation recommendation provides a target week but does not provide an exact vehicle-transfer date/time. Using a target-week date as though it were the actual transfer time would create false precision, especially for weather/traffic.

Therefore VS024 labels allocation context explicitly as:
`Current route context for transfer review`

This is a RESEARCHER-DESIGNED presentation rule caused by a manuscript/workflow gap.

Do not imply the current incident/weather assessment predicts conditions on the future transfer date.

## 8. Allocation Stable vs Time-Sensitive Context

Stable/advisory:
- source -> destination route distance;
- baseline/current travel duration;
- candidate reference fuel efficiency;
- estimated fuel for a candidate.

Time-sensitive:
- weather;
- road incidents;
- road condition;
- route accessibility/feasibility derived from current context.

UI must show a fetched/evaluated time for time-sensitive context.

## 9. Allocation Candidate Fuel Estimates

An allocation recommendation may include multiple candidate vehicles.

Do not mutate canonical candidate ranking based on fuel/context.

Preferred narrow behavior:
- show transfer route context once at recommendation level;
- for candidate rows, show reference km/L and estimated liters when available.

If candidate fuel data is unavailable:
- show Unavailable;
- preserve recommendation.

Do not create a new recommendation score.

## 10. Allocation Recommendation Persistence

VS024 does NOT rewrite VS016 allocation-generation logic.

Operational context is displayed at review time and is not automatically persisted into the canonical recommendation snapshot in VS024.

Reason:
- context is time-sensitive;
- current recommendation schema was intentionally frozen around demand/supply/candidate facts;
- persisting context would require snapshot/version semantics beyond this UI integration slice.

Clearly label:
`Current operational context — not part of the original allocation score/snapshot.`

A future audit/reproducibility slice may decide whether context snapshots should be persisted.

## 11. Approval / Rejection

Existing allocation approve/reject/quantity rules remain unchanged.

Context does not:
- auto-approve;
- auto-reject;
- alter recommended transfer units;
- change source/destination;
- change candidate rank;
- physically transfer vehicles.

Owner/Admin retains final control.

## 12. Operations Staff

R11 assigns context-aware decision support to Owner/Admin.

VS024 context acquisition/display for assignment/allocation decision support is Owner/Admin-only.

Do not expand Operations Staff permissions.

If Operations Staff can currently view base allocation recommendations, keep that existing behavior but do not expose the new context endpoint/panel unless later role validation explicitly approves it.

## 13. Trusted API Boundary

Do not call external providers directly from Admin React components.

Create/reuse a server-only context endpoint/service that:
- requires Owner/Admin;
- validates a narrow context-request kind;
- resolves canonical booking/recommendation/branch/vehicle inputs server-side;
- calls VS022 trusted acquisition;
- calls VS023 pure interpretation;
- returns normalized safe interpreted context.

Browser input must not authoritatively provide:
- branch addresses;
- vehicle fuel efficiency;
- booking destination if a booking ID is supplied;
- candidate details.

Resolve canonical values server-side.

## 14. Suggested API Request Modes

Conceptual:

Booking assignment:
`GET/POST /api/operational-context`
with `{ kind: "booking_assignment", bookingId, vehicleId? }`

Allocation review:
`{ kind: "allocation_review", recommendationId }`

Optional candidate fuel:
`{ kind: "allocation_candidate", recommendationId, vehicleId }`

Exact route/API naming may follow repository conventions.

Avoid a generic arbitrary-proxy endpoint that accepts raw coordinates/provider options from the browser.

## 15. Authorization / Privacy

Owner/Admin only.

The context API may return:
- destination label necessary for the Admin decision;
- classifications;
- route facts;
- fuel estimate;
- source/availability;
- fetched timestamp;
- explanation copy.

Do not return:
- provider keys;
- raw provider responses;
- unnecessary customer identity/document/payment data.

## 16. Loading / Failure UX

External context is optional enrichment.

UI states:
- Loading context...
- Context available
- Partially available
- Unavailable
- Not applicable / missing destination

Provider/context failure must never block:
- assignment;
- confirmation;
- allocation review;
- allocation approval/rejection.

Show limitations clearly.

## 17. Attribution

When provider-derived context is visibly shown, preserve/display provider/source attribution required by the active provider terms.

Keep attribution compact and adjacent to the context panel.

Do not expose provider secrets.

## 18. Explanation UX

Translate machine reason codes into concise Admin-facing phrases.

Examples:
- `weather_rain` -> `Rain may affect travel conditions.`
- `road_closure` -> `A relevant road closure was reported.`
- `roadworks` -> `Road works may affect the route.`
- `context_unavailable` -> `Some operational context could not be verified.`

Do not display unexplained raw reason codes as the primary UI.

## 19. Color / Severity

UI may use existing badge/status styling, but text labels must carry the meaning.

Do not rely on color alone.

## 20. No Customer Finder Context Integration

VS024 does not change the Customer Smart Vehicle Finder.

The manuscript may contain older language saying context can support "vehicle recommendation"; the latest R10/R11 separation and implemented architecture place the customer recommendation baseline on customer requirements/availability/readiness and the contextual decision support on Owner/Admin.

Any future Customer context enrichment requires a separate traced decision.

## 21. Existing Prototype Admin Vehicle Recommendation

The old Admin Decision Support page contains a hard-coded prototype vehicle-recommendation radar/card.

Because vehicle recommendation was moved to the Customer Smart Vehicle Finder, this prototype card is no longer authoritative.

VS024 may remove/replace that card with a canonical `Operational Context` / `Context-Aware Decision Support` section.

Record this as manuscript/UI reconciliation, not a new recommendation algorithm.

## 22. Tests

Server/API:
- Owner/Admin access allowed;
- Customer denied;
- Operations Staff denied for new context endpoint;
- booking request resolves canonical destination/branch;
- missing destination avoids provider work and returns not-applicable/unavailable safely;
- allocation request resolves source/destination branch canonically;
- invalid recommendation/vehicle rejected;
- candidate vehicle must belong to the relevant candidate/context scope where applicable;
- provider failure returns partial/unavailable context without failing workflow.

Booking UI:
- context panel appears only when relevant booking selected;
- selected candidate updates fuel estimate;
- context cannot disable/change assignment ordering;
- assignment remains possible when context unavailable.

Allocation UI:
- context panel shown during recommendation review;
- current-review timestamp is visible;
- canonical recommended units/rank unchanged;
- candidate fuel estimates do not reorder candidates;
- context unavailable still permits decision.

Scope:
- no Finder changes;
- no allocation-generation/scoring changes;
- no booking-state mutation from context endpoint;
- no persistent context snapshot unless explicitly blocked otherwise.

## 23. Manuscript Alignment

Supports R11 directly.

Supports allocation use-case step:
`Owner/Admin reviews contextual factors.`

Because the manuscript does not define exact allocation-context timing, VS024's `current route context for transfer review` is a researcher-designed implementation detail and should be recorded in the Change Register if retained in final UI/manuscript.

## 24. Definition of Done

VS024 is complete when:
- booking assignment review can display interpreted trip context;
- candidate fuel estimate updates without affecting ranking/eligibility;
- allocation review can display current source->destination interpreted context;
- candidate fuel information may be displayed without changing candidate rank;
- context endpoint is Owner/Admin-only and resolves canonical inputs server-side;
- provider failures degrade safely;
- old prototype Admin vehicle-recommendation card is removed/replaced where applicable;
- Finder unchanged;
- allocation generation unchanged;
- final decisions remain human-controlled.

## 25. Stop Rule

Stop after Admin context-aware display/integration.

Do not implement:
- Customer Finder context scoring;
- new assignment ranking;
- allocation scoring changes;
- automatic transfer;
- CQ-028 restrictions;
- persisted context snapshots;
- notification changes;
- reports/dashboard canonicalization.
