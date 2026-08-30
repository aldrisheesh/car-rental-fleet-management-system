# Vertical Slice 005 — Booking Request Foundation

**Status:** Approved for implementation  
**Objective:** Replace the current simulated booking submission with canonical Supabase-backed booking-request creation and reading, while stopping before requirement review, payment verification, vehicle assignment, confirmation, cancellation, or rental processing.

## Purpose

VS001–VS004 established:

- Supabase persistence;
- authentication and canonical roles;
- branch/vehicle master data;
- canonical Customer/Renter profiles.

The current booking page still simulates successful submission without creating a persistent transaction.

VS005 establishes the first canonical transactional record: a booking request.

A newly submitted booking is a **request only**. It must not imply approval, payment verification, vehicle assignment, or rental readiness.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/03-workflows-and-status-rules.md`
- `codex-context/04-data-and-business-rules.md`
- this slice contract.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

## Canonical Booking Status for This Slice

VS005 creates bookings only with:

`Submitted`

Do not implement mutations to:

- `Confirmed`
- `Rejected`
- `Cancelled`

Those canonical statuses exist in the workflow specification but their transition actions belong to later approved slices.

Do not introduce prototype statuses such as:

- `Pending`
- `Approved`
- `Ongoing`
- `Completed`

as canonical persisted booking statuses.

## Canonical Booking Record

Create an additive migration for a canonical booking/reservation table.

Use naming consistent with the repository and existing data model.

At minimum, persist:

- canonical booking ID;
- `customer_id`;
- `requested_vehicle_id`;
- `pickup_branch_id`;
- `return_branch_id`;
- pickup date/time;
- return date/time;
- destination;
- purpose of use;
- pickup/delivery option;
- pickup location where applicable;
- drop-off/return location where applicable;
- preferred seat count where applicable;
- customer contact number snapshot where appropriate;
- `booking_status`;
- `created_at`;
- `updated_at`.

Use foreign keys to canonical profile, vehicle, and branch records where appropriate.

`assigned_vehicle_id` may be represented as nullable foundation data only if useful for the frozen schema, but VS005 must never populate it during customer submission.

Do not add requirement, payment, rental, maintenance, or operational vehicle-state columns merely for convenience.

## Requested Vehicle Semantics

`requested_vehicle_id` represents the customer's selected/preferred vehicle.

It does not mean that vehicle has been assigned or reserved for release.

Submission must not mutate the vehicle's master record or create a final vehicle assignment.

The Owner/Admin assignment decision belongs to a later slice.

## Customer Ownership

Customer/Renter booking submission must derive:

`customer_id`

from the authenticated principal.

Never accept arbitrary customer ownership from a client-supplied user ID.

A Customer/Renter may:

- create their own booking request;
- read their own booking requests.

A Customer/Renter must not:

- create a booking on behalf of another customer;
- read another customer's booking;
- assign a vehicle;
- confirm/reject a booking;
- change protected workflow state in VS005.

## Internal Read Access

Owner/Admin may read booking requests required by the existing booking-management interface.

Operations Staff may read the permitted **non-payment reservation information** required by their defended reservation role.

VS005 does not authorize Staff booking mutation.

Do not expose payment proof/status data because payment persistence does not yet exist.

## Booking Form Integration

Preserve the existing defended `/booking` presentation where practical.

Replace the simulated timer-only submission with a real authenticated server-backed booking request.

The current form should be aligned with the stable booking inputs already required by the project where they are not yet represented.

Where applicable, support:

- requested vehicle;
- pickup branch;
- return branch;
- pickup date/time;
- return date/time;
- destination;
- purpose of use;
- pickup or delivery option;
- pickup location;
- drop-off/return location;
- preferred seat count;
- customer contact number;
- terms acknowledgement already represented by the UI.

Do not redesign the page broadly.

If a field is conditional, show/require it only when applicable.

## Canonical Master Data

Booking vehicle and branch selections must use canonical persisted master data established by VS003.

Do not continue using hard-coded/mock vehicle or branch arrays as the authoritative submission source.

The server must validate referenced:

- requested vehicle;
- pickup branch;
- return branch;

against canonical database records.

Inactive/nonexistent reference records must not be silently accepted.

## Customer Profile Data

Use the authenticated canonical profile established by VS004 for identity/contact information where appropriate.

Do not trust editable client-supplied:

- customer ID;
- customer role;
- account status;
- authenticated email identity.

A contact-number snapshot may be persisted with the booking if needed so the transaction retains the contact information used at submission time.

Do not duplicate the complete customer profile into the booking record.

## Date and Input Validation

At minimum validate:

- authenticated active Customer/Renter;
- pickup date/time is valid;
- return date/time is valid;
- return occurs after pickup;
- referenced vehicle exists and is active;
- referenced pickup branch exists and is active;
- referenced return branch exists and is active;
- required conditional location fields are supplied;
- preferred seat count, if supplied, is positive;
- required stable booking fields are present.

Do not invent booking lead-time rules, maximum duration rules, or availability rules that are not frozen.

## Availability Boundary

VS005 does **not** determine authoritative booking availability.

Creating a `Submitted` request must not imply:

- requested vehicle is available;
- requested vehicle has been reserved;
- booking conflict checks have passed;
- maintenance readiness has passed;
- vehicle has been assigned.

Do not reject a request solely because future availability/assignment logic has not yet been implemented.

The booking remains a request pending later review.

## Rental Duration

Prefer deriving/displaying rental duration from pickup and return date/time rather than persisting an independently editable duration that can diverge.

Do not create competing sources of truth unless technically required.

## Initial Workflow State

Every newly created booking request must be database/server controlled as:

`booking_status = 'Submitted'`

The client must not choose the initial booking status.

If foundation columns for later requirement/payment state are introduced at all, their defaults must follow `03-workflows-and-status-rules.md`, but prefer leaving those concerns to their dedicated tables/slices rather than embedding them prematurely.

## Server Boundary

Create or extend a focused authenticated booking server/API boundary.

At minimum support:

- Customer/Renter create own booking request;
- Customer/Renter read own booking requests;
- Owner/Admin read booking requests;
- Operations Staff read permitted non-payment booking information.

Authorization must use the trusted VS002 principal.

Do not trust the client-readable presentation cookie as authorization authority.

## Database Security

Use additive migrations only.

Enable RLS on the booking table.

Establish least-privilege policies/grants appropriate to the architecture.

Customer ownership isolation must exist at the database layer where applicable.

Do not grant arbitrary authenticated users the ability to:

- update booking status;
- change ownership;
- assign vehicles;
- mutate other customers' bookings.

If privileged server/service-role reads are used for internal views, perform trusted role authorization before querying.

## Customer Booking Read Integration

Integrate canonical own-booking data into the existing customer area where a suitable defended booking/reservation/history surface already exists.

If no suitable dedicated surface exists, add only the minimum presentation necessary to prove that the authenticated customer can see their submitted booking request.

Do not build rental history in this slice.

Do not label a submitted booking as confirmed.

## Admin / Staff Booking Read Integration

Replace the existing mock booking rows in `/admin/bookings` with canonical booking-request reads where practical.

Preserve the existing table design.

Do not retain the prototype status filter as authoritative if it contains invalid statuses.

For VS005, persisted records may all display:

`Submitted`

until later slices implement additional transitions.

Owner/Admin and Operations Staff must see only the booking information authorized for their role.

## Submission Result

After successful submission:

- use the canonical persisted booking returned by the server;
- show a clear request-submitted success state;
- do not say or imply that the booking has been confirmed;
- subsequent reload/navigation must still show the persisted request.

Do not generate a fake client-only booking identifier as canonical truth.

## Explicitly Out of Scope

Do not implement:

- requirement/document uploads;
- requirement verification;
- Supabase Storage;
- payment proof;
- payment verification;
- vehicle assignment;
- booking confirmation;
- booking rejection;
- booking cancellation;
- booking reopening;
- booking conflict/availability engine;
- maintenance-readiness booking gate;
- rental lifecycle;
- vehicle release;
- return/settlement;
- forecasting;
- Smart Vehicle Finder logic;
- branch allocation;
- notifications;
- audit logging.

## Testing

Add focused tests where practical for:

- booking input validation;
- Customer/Renter-only submission;
- ownership derived from authenticated principal;
- initial status forced to `Submitted`;
- invalid/inactive vehicle rejection;
- invalid/inactive branch rejection;
- return-before-pickup rejection;
- unauthorized submission;
- customer ownership isolation;
- Operations Staff cannot gain booking mutation authority;
- canonical record mapping.

Provider-backed validation should verify where configured:

1. authenticated Customer/Renter can submit a development booking request;
2. persisted booking belongs to that authenticated customer;
3. persisted status is `Submitted`;
4. requested vehicle is stored separately from any assignment;
5. assigned vehicle remains unset;
6. customer can read the request after reload/new request;
7. another customer cannot read the request;
8. Owner/Admin can read the request;
9. Operations Staff can read permitted non-payment booking information;
10. unauthorized workflow mutations are unavailable/rejected.

Use disposable development records and clean them up where practical.

## Definition of Done

VS005 is complete when:

- booking submission creates a canonical Supabase booking request;
- ownership comes from authenticated identity;
- initial booking status is server/database-controlled as `Submitted`;
- requested vehicle is not treated as assigned vehicle;
- canonical vehicle/branch references are used;
- customer can read their own persisted requests;
- Owner/Admin can read persisted booking requests;
- Operations Staff can read permitted non-payment reservation information;
- existing simulated submission is no longer transaction truth;
- no requirement/payment/assignment/confirmation/rental workflow has been prematurely implemented.

## Stop Rule

Stop after Booking Request Foundation is complete.

Do not implement requirement uploads/review, payment, vehicle assignment, booking confirmation, cancellation, rental processing, or VS006.