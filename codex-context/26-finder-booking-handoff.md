# Smart Vehicle Finder -> Booking Handoff Specification

**Status:** Frozen for VS018
**Last updated:** 2026-09-01

VS018 connects the completed VS017 Smart Vehicle Finder to the existing canonical booking request without turning the Finder into a separate booking system.

## 1. Purpose

When a customer chooses a vehicle from Smart Vehicle Finder results:

1. carry the selected vehicle and Finder requirements into the existing Booking page;
2. prefill equivalent booking fields where they already exist;
3. submit through the existing canonical booking endpoint;
4. preserve a small immutable Finder provenance snapshot with the created booking;
5. allow Customer and Owner/Admin to understand that the booking originated from the Finder and what requirements produced the recommendation.

The existing booking lifecycle remains authoritative.

## 2. Handoff Is Not Booking Creation

Clicking/selecting a Finder result does NOT create a booking.

It navigates into the existing `/booking` flow.

Customer must still:
- sign in before submission;
- complete all normal booking fields;
- accept the existing terms;
- submit the canonical booking request.

## 3. Fields Carried From Finder to Booking

Carry at minimum:

- selected recommended vehicle ID;
- Finder requested rental start;
- Finder requested rental end;
- passenger count;
- maximum total base-rental budget;
- preferred category nullable;
- destination/travel area nullable;
- recommendation rank at the time the Finder result was displayed.

Prefill equivalent booking UI fields where applicable:

- vehicle;
- pickup date/time;
- return date/time;
- destination;
- passenger/seat requirement where the current booking form has an equivalent field.

Do not invent new meanings for unrelated booking fields.

## 4. Customer May Still Review

The Booking page remains the final customer review form.

If the customer manually changes a field that materially invalidates the Finder basis, the system must not continue presenting stale Finder provenance as though it were still verified.

At minimum, Finder provenance is valid only when the submitted booking still matches:

- Finder-selected vehicle;
- Finder requested start;
- Finder requested end;
- Finder passenger requirement;
- Finder destination when destination was part of the handoff.

If these no longer match, either:
- clear Finder provenance and treat the booking as manual selection; or
- require the customer to return/re-run Finder.

Choose the smallest clear UX consistent with the existing Booking page.

Do not silently persist contradictory Finder context.

## 5. Budget and Preferred Category

Budget and preferred category are Finder-specific requirements and need not become ordinary booking business fields.

They may be preserved only inside the Finder provenance snapshot.

Do not make Owner/Admin enforce the stated Finder budget as a later payment/settlement rule.

The budget means only:
`maximum total base-rental budget used by the Finder at recommendation time`.

## 6. Canonical Provenance Snapshot

Persist Finder provenance only when a booking is actually created from a still-valid Finder handoff.

Recommended separate 1:1 child record:

`booking_finder_context`

or repository-consistent equivalent.

Do not overload booking status or payment fields.

At minimum preserve:

- booking ID;
- selected/requested vehicle ID;
- requested start snapshot;
- requested end snapshot;
- passenger count snapshot;
- maximum budget snapshot;
- preferred category snapshot nullable;
- destination snapshot nullable;
- recommendation rank snapshot;
- Finder version/baseline identifier where useful;
- created timestamp.

The record is immutable evidence of the customer-facing recommendation context at booking creation.

## 7. Do Not Persist Recommendation History

VS018 does NOT create generalized Finder history.

Only bookings actually submitted from a valid Finder handoff receive Finder context.

Normal browsing/manual bookings have no Finder child row.

## 8. Trusted Revalidation Before Persisting Finder Provenance

Client-supplied `finderRank`, reasons, or provenance claims are not canonical by themselves.

At booking creation, the trusted server must validate the Finder context against canonical Finder behavior before persisting it.

Preferred baseline:

- reuse/extract the canonical VS017 server-side Finder candidate evaluation;
- evaluate the supplied Finder requirements against current canonical data;
- confirm that the submitted requested vehicle is present in the current recommendation result;
- derive the canonical current rank server-side;
- persist server-derived rank/context rather than trusting a client rank.

If the vehicle no longer qualifies because fleet state changed after the customer saw the Finder:
- do not falsely persist "recommended by Finder" provenance;
- return a controlled message asking the customer to refresh/re-run recommendations, or otherwise safely treat it as manual only if the ordinary booking workflow explicitly permits that choice.

Do not duplicate the Finder algorithm.

## 9. Availability Race

Finder is advisory discovery. Fleet state may change before booking submission.

VS018 must not treat the earlier Browse result as a reservation lock.

Revalidate through canonical current Finder/booking boundaries at submission.

Do not introduce temporary vehicle holds in VS018.

## 10. Existing Booking Request Remains Canonical

The booking record continues to own canonical booking facts such as:

- customer;
- requested vehicle;
- pickup/return branch;
- pickup/return timestamp;
- destination;
- purpose;
- pickup/delivery option;
- customer contact;
- booking lifecycle state.

Finder context is provenance, not a competing booking aggregate.

## 11. Customer Display

After handoff, the Booking page should clearly indicate that the selected vehicle came from:

`Smart Vehicle Finder`

or customer-friendly equivalent.

Show a concise summary of Finder requirements so the customer understands what was carried over.

Do not clutter the booking form with internal rank/debug data.

## 12. Admin Display

Owner/Admin booking review may show a compact read-only Finder context section when it exists:

- selection source: Smart Vehicle Finder;
- passenger requirement;
- maximum Finder budget;
- preferred category if supplied;
- destination if supplied;
- recommendation rank at booking creation;
- selected vehicle.

Do not show:
- hidden maintenance internals;
- other customer conflicts;
- raw Finder server diagnostics.

Admin does not rerun or operate the Finder in VS018.

## 13. Customer Booking Display

Where practical, the customer's own booking detail may show:

`Selected with Smart Vehicle Finder`

and a compact snapshot.

Do not make this mandatory if it requires unrelated customer-dashboard redesign; Admin review and booking handoff are the primary VS018 UI surfaces.

## 14. Security

Only the booking owner may create Finder provenance for their booking through canonical booking creation.

Owner/Admin may read Finder context.

Operations Staff may receive only the same safe booking-context fields allowed by the booking read boundary.

Customer cannot set arbitrary booking ownership, Finder verification state, or server-derived rank.

## 15. Atomicity

Booking creation and Finder provenance persistence must be atomic when Finder provenance is present.

Do not create:
- booking without its validated Finder context after claiming Finder provenance;
- Finder context without a booking.

Use a trusted transactional database boundary if necessary.

Normal manual booking creation must continue to work.

## 16. Idempotency / Duplicate Submit

Preserve existing booking duplicate-submit behavior.

If VS018 introduces a new transactional booking-creation RPC, do not create duplicate bookings/context because of one browser retry/double click.

Do not broaden scope into a generalized reservation lock unless required.

## 17. Manila Time

Finder handoff values originate from VS017 canonical Asia/Manila conversion.

Booking must not reinterpret already-resolved timestamp instants through browser/server local timezone.

Reuse:
- `src/lib/business-time.ts`
- existing booking timestamp conventions.

## 18. Client Ground Truth

Requirements verification before payment remains unchanged.

VS018 does not:
- take payment;
- skip requirements;
- confirm booking;
- assign a final vehicle;
- change the 50% payment rule.

Finder chooses the customer's requested vehicle only.

Owner/Admin assignment may later substitute according to the existing canonical assignment workflow.

## 19. Restricted Areas

Do NOT implement transcript-derived geographic restrictions in VS018.

CQ-028 remains open.

Destination remains preserved context only until an approved contextual/restriction slice freezes exact rules.

## 20. Testing

Test at minimum:

- Finder result navigates to existing Booking flow;
- vehicle/start/end/destination/passenger values prefill correctly;
- normal manual Booking still works;
- valid Finder-origin booking persists exactly one Finder context;
- manual booking persists no Finder context;
- server does not trust client-supplied rank;
- server rejects/clears stale Finder provenance when selected vehicle no longer qualifies;
- changed vehicle invalidates Finder provenance;
- changed requested period invalidates Finder provenance;
- Finder context is tied to the created booking/customer;
- booking + Finder context persistence is atomic;
- Admin read shows safe Finder snapshot;
- Customer cannot access another customer's Finder context;
- no payment/requirements lifecycle is bypassed;
- no external context APIs are called.

## 21. Stop Rule

Stop after Finder -> Booking provenance/handoff is complete.

Do not implement:
- restricted-area rules;
- weather/routing/geocoding;
- payment changes;
- requirements changes;
- notifications;
- recommendation analytics/history;
- temporary vehicle holds;
- Admin-side Finder operation;
- VS019.
