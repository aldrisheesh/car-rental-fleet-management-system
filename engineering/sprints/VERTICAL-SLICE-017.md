# Vertical Slice 017 — Customer Smart Vehicle Finder Baseline

**Status:** Approved for implementation
**Objective:** Add a customer-facing guided Smart Vehicle Finder to the existing Browse Vehicles experience that evaluates canonical fleet data using transparent hard eligibility and deterministic ranking, without external context APIs, recommendation persistence, booking integration, or Admin-side Finder changes.

## Purpose

Briah's existing process primarily allows customers to select vehicles themselves.

The Smart Vehicle Finder is a researcher-designed capstone enhancement intended to help customers who are unsure which available vehicle best fits their rental needs.

VS017 implements only:

```text
Customer trip needs
        ↓
Canonical fleet eligibility
        ↓
Deterministic ranking
        ↓
Transparent recommendations
        ↓
Customer Browse result
```

VS017 stops before booking integration.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/06-recommendation-specification.md`
- `codex-context/10-open-decisions.md`
- `codex-context/14-client-clarification-register.md`
- `codex-context/18-maintenance-monitoring-and-readiness.md`
- `codex-context/23-smart-vehicle-finder.md`
- this slice contract.

Inspect only repository areas directly required for:

- existing customer Browse Vehicles route/components;
- canonical customer-safe vehicle data;
- vehicle category/capacity/base rental rate;
- existing canonical pricing-duration helper if one exists;
- canonical booking/rental availability helpers;
- canonical VS012 maintenance-readiness service;
- existing vehicle detail/selection affordances;
- auth/server helpers needed for safe customer access.

Do not inspect:

- forecasting;
- supply evaluation;
- allocation recommendation;
- Admin Decisions;
- external-context provider implementation;

unless a concrete compilation dependency requires it.

Do not read previous vertical-slice contracts unless blocked.

## Scope Boundary

VS017 contains exactly three principal pieces:

1. canonical Finder calculation;
2. safe Finder endpoint/server boundary;
3. customer Browse UI integration.

Do not turn VS017 into Finder → Booking integration.

## Customer Inputs

Required:

- requested rental start;
- requested rental end;
- passenger count;
- maximum total base-rental budget.

Optional:

- preferred vehicle category;
- destination/travel area.

## Rental Period Validation

Validate:

```text
requested_start < requested_end
```

Use the canonical application's rental timestamp/date conventions.

Do not accept malformed or impossible intervals.

Do not create a second incompatible timezone model.

## Passenger Validation

Passenger count must be:

- integer;
- positive;
- reasonably bounded.

Do not infer missing passenger count.

## Budget Validation

Maximum budget must be:

- numeric;
- finite;
- positive.

Interpret it as:

**maximum total base-rental budget for the requested rental period**

not daily budget.

## Preferred Category

Optional.

If supplied:

- category must resolve to a canonical supported category;
- it influences ranking only.

It must not become mandatory eligibility.

## Destination

Destination/travel area may be captured as a customer input.

VS017 must not:

- geocode it;
- call routing;
- call weather;
- call road APIs;
- derive vehicle restrictions from the text.

Do not create rules such as:

```text
Baguio -> SUV
```

Destination has no hard/ranking effect in VS017.

## Candidate Fleet

Evaluate canonical vehicles that are safe to expose through the existing customer vehicle-browse boundary.

Do not use:

- mock vehicle arrays;
- prototype status strings;
- Admin-only fleet objects.

## Hard Eligibility

A vehicle is recommended only when every condition passes.

### Active

```text
vehicle.is_active = true
```

### Maintenance

Canonical VS012:

```text
Maintenance Ready = true
```

Reuse the trusted readiness boundary.

Do not duplicate maintenance logic.

### Requested-Period Availability

Vehicle must have no canonical conflicting booking/rental commitment during the requested rental period.

Reuse an existing trusted availability/interval boundary where practical.

At minimum, conflicting canonical commitments must not allow recommendation.

Do not rely solely on a generic current:

`Available`

label.

### Passenger Capacity

Canonical capacity must exist and satisfy:

```text
vehicle_capacity >= requested_passengers
```

Unknown capacity:

exclude conservatively.

### Total Base Rental Cost

Calculate the estimated base rental amount for the requested period using the application's canonical base rate and duration convention.

Do not invent a second rental-day formula if a trusted pricing helper already exists.

Require:

```text
estimated_total_base_rental_cost <= maximum_budget
```

If cost cannot safely be determined:

exclude.

## Cost Boundary

VS017 cost is **base rental estimate only**.

Do not add:

- fuel;
- security deposit;
- late fees;
- damage fees;
- delivery fees;
- settlement;
- unconfirmed charges.

Customer-facing copy must not imply the estimate is the final settlement amount.

Use wording such as:

`Estimated base rental`

where appropriate.

## Deterministic Ranking

After hard eligibility:

### Criterion 1 — Preferred category

When a preference exists:

matching category first.

When no preference exists:

all candidates tie on criterion 1.

### Criterion 2 — Capacity closeness

Calculate:

```text
capacity_excess =
vehicle_capacity - requested_passengers
```

Lower non-negative value ranks first.

### Criterion 3 — Lower estimated total base rental

Lower cost ranks first.

### Criterion 4 — Stable tie-break

Use a stable canonical identifier/name.

Do not depend on database return order.

## No Numerical Match Score

Do not create:

- match percentage;
- compatibility percentage;
- confidence;
- weighted recommendation score;
- AI score.

The ranking should be directly explainable from its ordered rules.

## Recommendation Result Model

Return only safe fields required by customer Browse.

At minimum:

- vehicle ID;
- existing customer-safe vehicle identity;
- category;
- passenger capacity;
- base rental rate where already customer-visible;
- estimated total base rental cost;
- preferred-category-match boolean where useful;
- recommendation rank;
- safe explanation reasons.

Do not expose raw canonical objects unnecessarily.

## Recommendation Explanations

Build explanations from deterministic facts.

Examples:

```text
Available for your selected dates
Seats your group of 5
Within your ₱12,000 maximum base-rental budget
Matches your SUV preference
Maintenance-ready
```

For an alternative category:

```text
Meets your required capacity and budget
Available for your dates
Different from your preferred category
```

Do not expose internal maintenance reason codes.

## No-Match Diagnostics

If no candidate passes:

return:

- empty recommendation array;
- safe structured no-match information.

Where safely determinable, diagnostics may distinguish:

- insufficient capacity;
- budget too restrictive;
- period availability;
- no vehicle satisfies all mandatory requirements.

Do not expose counts/details that reveal internal sensitive operational records.

Do not return a hard-ineligible vehicle as a fallback.

## Finder Endpoint

Create the smallest appropriate server/API boundary consistent with the repository.

The endpoint must:

1. validate input;
2. query canonical customer-safe candidate data;
3. evaluate availability/readiness server-side;
4. calculate canonical base rental estimate;
5. apply eligibility;
6. rank;
7. return safe results.

Do not trust client-calculated:

- estimated cost;
- availability;
- maintenance readiness;
- ranking;
- recommendation reasons.

## Persistence

Do not create:

- finder_sessions;
- recommendation_history;
- recommendation_results;
- analytics events

in VS017.

The Finder is derived from current canonical data.

## Browse Vehicles UI

Modify the existing customer Browse Vehicles page rather than creating an unrelated standalone module unless the repository's routing architecture makes an embedded child route materially cleaner.

Preserve ordinary browsing/filtering.

Add a prominent guided entry point:

**Find the Right Vehicle**

Suggested supporting text:

> Tell us about your trip and we'll suggest suitable vehicles.

Match the existing application visual language.

Do not broadly redesign Browse.

## Finder Form UI

Provide:

- requested start/end;
- passenger count;
- maximum rental budget;
- preferred category optional;
- destination/travel area optional;
- explicit recommendation action.

Use clear customer wording.

Budget should communicate that it refers to the requested rental period.

## Finder UI State

Support at minimum:

- initial normal Browse;
- Finder form;
- loading;
- validation error;
- recommendation results;
- no-match;
- server failure;
- edit requirements / reset to normal Browse.

Do not destroy ordinary filters when Finder is reset.

## Recommendation Results UI

Clearly label the results:

**Recommended for your trip**

Summarize the important request criteria.

For each recommendation show:

- rank;
- existing vehicle card information;
- estimated base rental total;
- Why this fits;
- existing View Vehicle / Select affordance where available.

Do not create a fake booking action.

If the existing Browse selection button leads naturally to the current vehicle/booking flow, preserve that existing behavior without adding Finder persistence.

## Normal Browse Preservation

A customer who does not want the Finder must still be able to browse vehicles normally.

The Finder is additive.

Do not require customers to complete it.

## No-Match UX

Show a helpful state such as:

**No vehicles currently meet all of your requirements.**

Where supported, explain limiting factors without recommending ineligible units.

Provide actions such as:

- Edit requirements;
- Browse all vehicles.

Do not automatically increase budget or reduce passenger count.

## Customer Data Safety

The response/UI must not expose:

- maintenance history;
- maintenance cost;
- maintenance remarks;
- other customer bookings;
- renter identities;
- payment information;
- forecasting;
- utilization;
- projected supply;
- allocation recommendation data.

## Admin Boundary

Do not modify:

- Admin Bookings;
- Admin Dashboard;
- Admin Decisions;
- Admin Reports;

for Finder context in VS017.

That belongs to VS018.

## Booking Boundary

Do not add canonical fields such as:

- selected_via_finder;
- finder_inputs;
- recommendation_rank;

to booking persistence in VS017.

VS018 will handle that integration explicitly.

## External Context Boundary

Do not use:

- Open-Meteo;
- OpenWeather;
- TomTom;
- HERE;
- road incidents;
- routing;
- geocoding.

Destination is captured only.

## Testing

Add focused tests for:

- valid input;
- invalid period;
- invalid passenger count;
- invalid budget;
- invalid preferred category;
- inactive vehicle excluded;
- maintenance-not-ready excluded;
- booking conflict excluded;
- rental conflict excluded;
- unknown capacity excluded;
- insufficient capacity excluded;
- exact capacity eligible;
- over-budget excluded;
- exact-budget eligible;
- category preference ranks matching first;
- nonmatching category remains eligible;
- capacity closeness;
- lower total base-rental cost;
- deterministic final tie-break;
- destination has no ranking/eligibility effect;
- no match score;
- safe customer response;
- no-match result;
- normal Browse remains available.

## Provider-Backed Validation

Where configured, validate with disposable development data:

1. eligible vehicle appears;
2. inactive vehicle excluded;
3. maintenance-blocked vehicle excluded;
4. conflicting vehicle excluded;
5. capacity failure excluded;
6. budget failure excluded;
7. preferred category affects order but not eligibility;
8. capacity closeness affects order;
9. lower total base-rental cost affects order;
10. destination does not alter result;
11. no-match returns controlled response;
12. no Admin/internal data leaks;
13. ordinary Browse still functions.

## Client Clarification Preservation

Preserve:

`CQ-027`

Do not implement hypothetical Briah operational restrictions.

## Definition of Done

VS017 is complete when:

- customer Browse contains a usable guided Finder;
- normal Browse still works;
- Finder uses canonical vehicle data;
- active state is enforced;
- VS012 maintenance readiness is reused;
- requested-period availability is enforced;
- passenger capacity is enforced;
- total base-rental budget is enforced;
- preferred category is a soft ranking criterion;
- capacity closeness and cost provide deterministic ranking;
- destination creates no invented rule;
- results explain why vehicles fit;
- no-match state is honest;
- customer-safe data boundary is preserved;
- no recommendation persistence exists;
- no booking/Admin integration exists;
- no external context APIs are used.

## Stop Rule

Stop after the customer Smart Vehicle Finder baseline is complete.

Do not implement:

- Finder-to-booking context;
- Admin Finder visibility;
- recommendation history;
- external context;
- weather/routing/geocoding;
- notification behavior;
- reports/dashboard changes;
- VS018.
