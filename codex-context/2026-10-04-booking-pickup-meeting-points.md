# Booking-specific pickup and return arrangements

Implemented on Oct 4, 2026. Owners save an agreed pickup address, pickup instructions, return address and return instructions in the admin booking detail. These are distinct from fleet location/DSS map references. Staff can read details; only active Owner/Admin can save. Edits are allowed before release for Draft, Submitted and Confirmed pickup bookings.

The customer confirmed-booking page displays both addresses, instructions, schedules and encoded Google Maps search links. Existing unreleased confirmed pickup records without arrangements show a contact-team fallback; owners must complete these before release. Existing released rentals remain intact. Delivery booking address behavior is preserved. Confirmation-page copy no longer promises an email containing all details; the current email template directs customers back to the app.

## Persistence and workflow

Migration `20261004030753_booking_pickup_arrangements.sql` adds four nullable text columns, length checks, an owner-only service-role RPC with a booking row lock and updated_at concurrency check, and a canonical booking.edited audit event with non-address metadata. Material service, branch or date changes invalidate meeting details. No existing RLS policies or table access grants were expanded.

Both manual confirmation and payment-triggered auto-confirmation require complete pickup arrangements. If payment verification encounters missing arrangements, payment stays Verified, booking stays Submitted, and the confirmation exception tells the owner what to complete. New rental insertion also checks arrangements. Other assignment/readiness/conflict/acknowledgement gates remain intact. The live database previously had older confirmation/payment RPC definitions; the new migration incorporates the repository's canonical 20260928045805 implementations with the additional pickup check.

SQL changes were applied to the linked demo database and verified, then this migration alone was marked applied in migration history. Local db pull was attempted but the local database at port 54322 is unavailable; no broad migration reconciliation was performed. Existing unrelated migration-history drift remains.

## Validation

- TypeScript and production build passed.
- Four helper/service tests passed, including all-field readiness and safely encoded map URLs.
- Changed frontend/helper lint passed. API lint passes excluding its existing no-explicit-any debt (31 existing sites; no new any added by the pickup handler).
- Database tests ran in a transaction that rolled back: owner access, stale saves, manual confirmation before/after details, payment auto-confirm pause preserving Verified payment, release guard, schedule invalidation. Timestamp test parameters explicitly cast from text to avoid postgres-js Date serialization truncating microseconds.
- Verified new RPC cannot be executed by anon/authenticated and is granted only to service_role. Server API authenticates active owner before using it; customer reads retain ownership filtering.
- Supabase security advisors returned only existing unrelated warnings: record_vehicle_operational_state_event trigger function execute grants and disabled leaked-password protection. No findings concern the new functions.
- Impeccable detector on changed booking detail screens returned no findings.
- Browser checked actual admin save and customer confirmation using existing UAT accounts.

## Demonstration record

Only booking `dd01ddd2-cd79-4890-a28a-397a6b589b9f` (Jamie Cruz, Toyota Hiace, Nov 4–5) received persistent sample meeting details through the admin UI. The public De La Salle University main gate is illustrative UAT data, not a verified client meeting agreement. No rental was released and no payment was permanently changed by the verification tests.

Screenshots:
- output/bookings-concepts/admin-pickup-meeting-details.jpg
- output/bookings-concepts/customer-confirmed-pickup-meeting-details.jpg
