# Vertical Slice 018 — Smart Vehicle Finder → Booking Handoff

**Status:** Approved for implementation
**Objective:** Connect a valid VS017 Smart Vehicle Finder recommendation to the existing canonical customer Booking flow, server-revalidate the Finder provenance at submission, atomically preserve a minimal immutable Finder context with the resulting booking, and expose that context safely to Owner/Admin without altering the established booking lifecycle.

## Purpose

VS017 established:

```text
Customer requirements
        ↓
Canonical Finder eligibility
        ↓
Deterministic ranking
        ↓
Recommended vehicle
```

VS018 continues only:

```text
Recommended vehicle
        ↓
Existing Booking page
        ↓
Customer review/completion
        ↓
Canonical booking submission
        ↓
Trusted Finder revalidation
        ↓
Booking + Finder provenance
```

The Finder must not become a second booking system.

## Required Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `engineering/sprints/VERTICAL-SLICE-018.md`
- `codex-context/23-smart-vehicle-finder.md`
- `codex-context/24-client-interview-ground-truth.md`
- `codex-context/25-canonical-subsystem-map.md`
- `codex-context/26-finder-booking-handoff.md`

Do not read other `codex-context` files unless a concrete blocker requires them.

## Exact Initial Implementation Files

Start with only:

- `src/lib/business-time.ts`
- `src/lib/vehicle-finder.ts`
- `src/routes/api.vehicle-finder.ts`
- `src/routes/vehicles.tsx`
- `src/routes/booking.tsx`
- `src/routes/api.bookings.ts`

Inspect:

- `src/routes/admin.bookings.tsx`

only when implementing the approved Owner/Admin read-only Finder-context display.

Do not initially inspect:

- forecasting;
- supply;
- allocation;
- reports;
- notifications;
- raw maintenance implementation;
- prior sprint contracts.

The existing Finder already owns maintenance/availability integration.

## Existing Booking Flow Is Authoritative

Do not create:

- `/finder-booking`;
- separate Finder booking API;
- separate Finder reservation aggregate.

The existing:

`/booking`

and:

`/api/bookings`

remain authoritative.

## Finder Selection Action

A customer selecting a Finder recommendation should enter the existing Booking flow.

Carry the valid Finder handoff data required by the contract.

Do not create the booking directly from Browse.

## Handoff Data

Carry at minimum:

- selected recommended vehicle ID;
- Finder requested start;
- Finder requested end;
- passenger count;
- maximum total base-rental budget;
- preferred category ID nullable;
- destination/travel area nullable.

Client-side rank may be carried for display convenience but is never trusted as canonical.

## Handoff Transport

Use the smallest safe temporary client/navigation mechanism consistent with the existing application.

Suitable options may include:

- route search parameters;
- navigation state;
- another short-lived noncanonical mechanism.

Do not use:

- localStorage as canonical provenance;
- database persistence before booking submission;
- permanent Finder session records.

If URL parameters are used, remember that they are untrusted input.

## Booking Prefill

When arriving through Finder, prefill equivalent existing Booking fields:

- requested vehicle;
- pickup/start;
- return/end;
- passenger/seat requirement where equivalent;
- destination where equivalent.

Do not overwrite unrelated booking fields.

Customer must still complete normal required fields such as:

- branches;
- purpose;
- pickup/delivery option;
- any other existing canonical Booking requirements.

## Manila Timestamp Preservation

VS017 Finder timestamps are based on canonical Asia/Manila business-time semantics.

Do not accidentally reinterpret the Finder instants using browser/server local timezone.

Reuse:

`src/lib/business-time.ts`

where conversion back into Booking `datetime-local` display values is required.

The final booking timestamps must represent the same intended Manila instants.

## Finder Handoff Indicator

The Booking page should clearly but unobtrusively indicate:

**Selected with Smart Vehicle Finder**

or equivalent.

Show a compact summary such as:

- passenger requirement;
- maximum Finder budget;
- preferred category if present;
- destination if present.

Do not expose technical provenance identifiers.

## Customer Review

Finder handoff is not a locked form.

The customer may continue using the existing Booking flow.

However, Finder attribution must remain truthful.

## Provenance Invalidation

Finder provenance is valid only while the submitted booking still matches the material Finder basis.

At minimum compare:

- requested vehicle;
- requested start;
- requested end;
- passenger count;
- destination where the Finder supplied one.

If a material field changes:

clear/deactivate Finder provenance on the client and submit the booking as an ordinary manual booking.

Provide a small customer-visible indication such as:

> Finder details changed. This booking will be submitted as a normal vehicle selection.

Do not silently preserve stale Finder provenance.

Do not force the customer back to Finder unless technically necessary.

## Preferred Category and Budget

These are Finder criteria, not canonical ordinary booking constraints.

Changing ordinary Booking fields that have no effect on these Finder criteria does not automatically invalidate provenance.

Do not convert:

`maximum Finder budget`

into a payment obligation or settlement field.

## Booking Submission

Normal manual booking payload continues to work.

When valid Finder provenance is present, submit an additional structured Finder-context payload.

Treat all Finder payload values as untrusted.

## Trusted Server Revalidation

Before persisting Finder provenance, server must reuse the canonical VS017 Finder behavior.

Do not trust:

- client recommendation rank;
- client explanation strings;
- client claim that the vehicle qualified;
- client-calculated price.

Re-evaluate the Finder request using current canonical data.

Confirm:

1. Finder inputs are valid;
2. selected booking vehicle appears in the current Finder recommendation results;
3. the submitted booking vehicle matches the Finder-selected vehicle;
4. booking pickup/return timestamps match the Finder requested interval;
5. booking passenger requirement matches;
6. destination matches where applicable.

Derive current canonical recommendation rank server-side.

## Availability Race

A Finder recommendation does not reserve the vehicle.

If the selected vehicle no longer qualifies between Browse and booking submission:

do not persist Finder provenance.

Prefer returning a controlled conflict such as:

> This vehicle no longer matches the Finder requirements. Please refresh your recommendations.

Do not silently claim Finder provenance.

Do not implement temporary holds.

## Booking Eligibility

VS018 must not weaken existing booking validation.

The normal canonical booking creation rules still apply.

Finder qualification does not:

- confirm the booking;
- assign the final vehicle;
- verify requirements;
- verify payment.

The selected Finder vehicle remains the customer's:

`requested_vehicle`

only.

## Finder Provenance Persistence

Create additive persistence.

Recommended entity:

`booking_finder_context`

or repository-consistent equivalent.

One Finder context at most per booking.

At minimum:

- booking ID;
- selected/requested vehicle ID snapshot;
- requested start snapshot;
- requested end snapshot;
- passenger count snapshot;
- maximum budget snapshot;
- preferred category ID snapshot nullable;
- destination snapshot nullable;
- server-derived recommendation rank;
- Finder baseline/version identifier where useful;
- created timestamp.

## Provenance Immutability

Finder context is a historical snapshot of why the customer selected the requested vehicle at booking creation.

Do not update it when:

- vehicle is later assigned/substituted;
- booking status changes;
- requirements change;
- payment changes;
- rental begins;
- vehicle is returned.

It remains evidence of the original customer selection.

## No General Finder History

Only a successfully created Finder-origin booking receives provenance.

Do not persist:

- abandoned Finder searches;
- recommendation impressions;
- rejected candidates;
- ordinary Browse activity.

## Atomic Creation

When valid Finder provenance is submitted:

```text
booking
+
booking_finder_context
```

must persist atomically.

If provenance insert fails:

booking creation must fail/rollback.

Do not create a booking that claims Finder origin in the response while its context failed to persist.

Manual booking creation must remain supported.

## Transaction Boundary

If the existing direct booking insert cannot provide atomic Finder-context persistence, introduce the smallest trusted database RPC/equivalent transaction.

Use an additive migration.

Do not rewrite previous migrations.

## Booking Creation Authority

Only authenticated:

`Customer/Renter`

may create their own booking.

Server derives:

`customer_id`

from the authenticated principal.

Finder provenance cannot alter ownership.

## Finder Context Read Boundary

Customer/Renter may read Finder context only for their own booking where customer booking surfaces expose it.

Owner/Admin may read safe Finder context for booking review.

Operations Staff may receive only safe read-only context if the existing booking read boundary already permits the booking.

No role receives Finder internal maintenance/availability diagnostics.

## Existing Booking API Read

Extend the existing booking read projection rather than creating a second Finder-context API unless there is a compelling repository-specific reason.

For Owner/Admin booking reads, include safe Finder context when present.

For Customer/Renter, include only their own safe context.

## Admin Booking UI

Modify only the existing:

`src/routes/admin.bookings.tsx`

where necessary.

When Finder context exists, show a compact read-only section:

**Customer selection**

- Smart Vehicle Finder;
- recommended rank;
- passenger requirement;
- maximum Finder budget;
- preferred category if supplied;
- destination if supplied.

Do not create:

- Admin Finder form;
- rerun recommendation button;
- Admin match score;
- edit Finder context controls.

## Manual Booking Admin Display

Manual booking should continue to look normal.

Do not display an empty Finder panel for every booking.

## Requirements and Payment

Client-confirmed sequence remains:

```text
Booking
↓
Requirements
↓
Verification
↓
Down payment
```

VS018 must not modify that lifecycle.

Do not implement payment changes merely because 50% is now client-confirmed.

## Assignment

The Finder vehicle is the requested vehicle.

Existing Owner/Admin assignment rules remain authoritative.

If Admin later assigns a substitute vehicle, Finder provenance remains unchanged as historical customer-selection context.

## Restricted Areas

Do not implement:

- Bicol restrictions;
- geographic restrictions;
- route rules.

`CQ-028` remains open.

## External Context

Do not call:

- geocoding;
- routing;
- weather;
- road/incident APIs.

Destination remains plain booking/Finder context.

## Security

Do not expose:

- maintenance details;
- conflicting renter identities;
- booking conflict records;
- raw internal Finder diagnostics;
- privileged Supabase credentials.

## Testing

Add focused tests for at least:

- Finder result enters existing Booking route;
- selected vehicle prefills;
- Finder dates preserve Manila instants;
- passenger requirement prefills;
- destination prefills;
- Finder summary appears;
- manual Booking still works;
- material vehicle change invalidates Finder provenance;
- material date change invalidates provenance;
- passenger change invalidates provenance;
- destination change invalidates provenance when originally supplied;
- unrelated Booking field change does not invalidate provenance;
- valid Finder booking revalidates server-side;
- client rank ignored;
- server derives canonical rank;
- vehicle no longer qualifying produces controlled failure;
- manual booking persists no Finder context;
- valid Finder booking persists exactly one context;
- booking + context atomic;
- context tied to booking/customer;
- Admin read returns safe Finder context;
- Customer cannot read another customer's context;
- later assignment/substitution does not mutate Finder snapshot;
- requirements/payment flow unchanged.

## Provider-Backed Validation

Where configured, validate with disposable development data:

1. generate Finder recommendation;
2. select recommended vehicle;
3. enter Booking with correct prefill;
4. submit booking;
5. verify canonical booking;
6. verify one Finder context row;
7. verify server-derived rank;
8. verify context snapshots;
9. verify Admin booking read/UI;
10. verify manual booking still creates without context;
11. mutate fleet state between Finder and submit and verify stale recommendation is rejected;
12. verify no requirement/payment bypass;
13. clean up disposable records where practical.

## Definition of Done

VS018 is complete when:

- Finder result naturally enters existing Booking;
- equivalent fields are prefilled;
- Manila time is preserved;
- stale/changed Finder provenance is not falsely persisted;
- trusted server revalidates Finder qualification;
- client rank is not trusted;
- valid Finder-origin booking stores immutable context;
- booking + context persistence is atomic;
- normal manual Booking still works;
- Owner/Admin can see safe Finder provenance;
- no external context/restricted-area/payment/requirements behavior is added.

## Stop Rule

Stop after Smart Vehicle Finder → Booking Handoff is complete.

Do not implement:

- VS019;
- restricted-area rules;
- operational context APIs;
- notifications;
- payment changes;
- requirements workflow changes;
- recommendation history/analytics;
- temporary vehicle holds;
- transfer execution.
