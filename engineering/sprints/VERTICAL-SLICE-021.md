# Vertical Slice 021 — Canonical Audit Trail

**Status:** Approved for implementation  
**Objective:** Introduce an append-only, Owner/Admin-readable canonical audit trail for meaningful human-triggered mutations across the core booking, requirements, payment, assignment, rental, and maintenance lifecycle, using semantic audit events with minimal safe metadata and atomic integration into trusted business-transition boundaries.

## Purpose

The system now contains many canonical business mutations.

VS021 adds historical accountability:

```text
Trusted business mutation
        ↓
Mutation succeeds
        +
Semantic audit event
        ↓
Atomic commit
        ↓
Owner/Admin Audit Trail
```

Audit answers:

```text
Who
did what
to which entity
and when?
```

Audit does not replace notifications, operational state, or reporting.

## Required Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `engineering/sprints/VERTICAL-SLICE-021.md`
- `codex-context/29-canonical-audit-trail.md`
- `codex-context/08-notifications-and-audit.md`
- `codex-context/25-canonical-subsystem-map.md`

Do not read other context files unless a concrete blocker requires them.

## Strict Initial Inspection

Locate only the exact canonical mutation boundaries for:

1. booking creation;
2. requirement submission/resubmission;
3. requirement review;
4. payment proof submission/resubmission;
5. payment review;
6. vehicle assignment;
7. booking confirmation;
8. booking rejection/cancellation only where already canonical;
9. rental release;
10. rental return;
11. maintenance creation;
12. maintenance completion/cancellation.

Known starting files include:

- `src/routes/api.bookings.ts`
- `src/routes/api.maintenance.ts`

Use targeted repository search only to locate the exact route/RPC responsible for one of the listed transitions.

Do not inspect:

- forecasting;
- projected supply;
- allocation;
- Finder;
- operational context;
- reports;
- reminder internals;
- notification internals beyond verifying they are not audited.

Do not read previous vertical-slice contracts.

## Scope

VS021 implements exactly:

1. canonical append-only audit persistence;
2. semantic audit action vocabulary;
3. trusted audit creation from first-wave lifecycle mutations;
4. safe metadata;
5. Owner/Admin-only audit read API;
6. Owner/Admin Audit Trail UI;
7. audit immutability/security;
8. atomicity with audited business transitions where approved.

## Out of Scope

Do not implement:

- audit for notifications;
- audit for notification read state;
- audit for scheduled reminders;
- forecasting audit;
- supply evaluation audit;
- allocation recommendation audit;
- audit export;
- audit analytics;
- retention/purge;
- Customer audit UI;
- Operations Staff audit UI;
- generic database-wide auditing.

## Canonical Persistence

Create an additive table equivalent to:

```text
audit_events

id
actor_type
actor_user_id
action
entity_type
entity_id
booking_id nullable
metadata jsonb
occurred_at
```

Recommended types:

```text
id             uuid
actor_type     text
actor_user_id  uuid nullable
action         text
entity_type    text
entity_id      uuid
booking_id     uuid nullable
metadata       jsonb
occurred_at    timestamptz
```

Use repository-consistent naming where appropriate.

## Actor Types

Supported baseline:

```text
User
System
```

For VS021 first-wave lifecycle events:

```text
actor_type = User
actor_user_id = authenticated canonical actor
```

Do not fabricate system-user UUIDs.

The schema may support `System`, but do not begin instrumenting automated processes in VS021.

## Actor Integrity

For a User event:

```text
actor_user_id IS NOT NULL
```

For a System event:

```text
actor_user_id IS NULL
```

Enforce this through a database constraint where practical.

## Semantic Action Vocabulary

Freeze the following machine-readable actions.

### Booking

```text
booking.created
booking.vehicle_assigned
booking.confirmed
```

Also:

```text
booking.rejected
booking.cancelled
```

only if those canonical transitions already exist.

### Requirements

```text
requirements.submitted
requirements.resubmitted
requirements.needs_resubmission
requirements.verified
```

### Payment

```text
payment.submitted
payment.resubmitted
payment.needs_resubmission
payment.verified
```

### Rental

```text
rental.released
rental.returned
```

### Maintenance

```text
maintenance.created
maintenance.completed
maintenance.cancelled
```

Do not invent actions for transitions that do not exist.

## Entity Types

Baseline:

```text
booking
requirements
payment
rental
maintenance
```

Use the semantic entity associated with the action.

Examples:

```text
booking.created
→ entity_type = booking
→ entity_id = booking ID

payment.verified
→ entity_type = payment
→ entity_id = payment ID
```

## Booking Linkage

Where an audited entity belongs to a booking, populate:

```text
booking_id
```

This allows useful Owner/Admin filtering without copying booking details into metadata.

For:

```text
booking.created
```

`booking_id` may equal `entity_id`.

## Safe Metadata

Metadata must be deliberately constructed.

Allowed examples:

```json
{
  "previous_status": "Pending Verification",
  "new_status": "Verified"
}
```

or:

```json
{
  "previous_assigned_vehicle_id": null,
  "assigned_vehicle_id": "..."
}
```

Do not serialize arbitrary request bodies or database rows.

## Sensitive Metadata Prohibition

Audit metadata must never contain:

- government ID numbers;
- driver's-license numbers;
- ID/document image paths;
- requirement private storage paths;
- proof-of-payment paths;
- bank account details;
- GCash account details;
- payment reference numbers;
- authentication tokens;
- service-role credentials;
- full customer profiles;
- full entity snapshots;
- internal free-text reviewer notes.

Do not use:

```ts
metadata: body
```

or:

```ts
metadata: existingRow
```

## Free-Text Boundary

Avoid copying arbitrary free text into immutable audit metadata.

Where a reason exists, prefer recording:

```text
reason_present = true
```

or the resulting semantic state.

The business record remains authoritative for the actual reason.

## Append-Only

After creation, audit event contents are immutable.

No normal application role may:

- UPDATE audit event;
- DELETE audit event.

Do not create an audit edit/delete API.

Historical corrections are represented by later events, not history mutation.

## Creation Authority

Browser clients cannot create canonical audit events.

Audit events originate only from trusted business mutation boundaries.

Do not accept client fields such as:

```text
auditAction
auditActor
auditMetadata
```

as authoritative.

## Preferred Transaction Pattern

Prefer:

```text
trusted canonical RPC
      ↓
validate business mutation
      ↓
apply business mutation
      +
insert semantic audit event
      ↓
commit
```

Audit insertion failure should roll back the audited mutation when the transition is brought under the approved transactional boundary.

## Existing RPCs

Where an existing canonical transition already uses a PostgreSQL RPC:

- redefine/extend it through a NEW additive migration;
- preserve existing behavior;
- add the audit insert within that transaction.

Do not rewrite applied migrations.

## Existing Server Sequences

Where a transition does not currently use a transactional RPC:

inspect whether it can be moved into the smallest safe transactional boundary.

Do not broadly refactor unrelated lifecycle behavior merely for audit.

If atomic integration for a specific event is genuinely blocked without major unrelated changes:

- report that exact event as BLOCKED;
- do not silently add unreliable browser-side logging.

## Idempotency

Audit represents successful business events, not HTTP attempts.

If a business operation is already idempotent, its audit behavior must be idempotent too.

Example:

```text
booking create request
→ booking created
→ booking.created audit

same idempotency key retried
→ existing booking returned
→ NO second booking.created audit
```

Do not solve this with a fragile client-side flag.

## Recurring Legitimate Events

Legitimate later cycles receive separate events.

Example:

```text
requirements.submitted
        ↓
Needs Resubmission
        ↓
requirements.resubmitted
```

Both submission events are valid historical events.

## Booking Created

Successful canonical customer booking creation:

```text
booking.created
```

Actor:

```text
Customer/Renter
```

Support both:

- manual booking;
- Finder-origin booking.

Do not duplicate Finder provenance in audit metadata.

Use existing booking idempotency.

## Requirements Submitted

First successful complete submission:

```text
requirements.submitted
```

Actor:

booking customer.

## Requirements Resubmitted

Successful later correction after canonical `Needs Resubmission`:

```text
requirements.resubmitted
```

Actor:

booking customer.

Do not audit every uploaded file independently.

## Requirements Review

Owner/Admin transitions:

```text
requirements.needs_resubmission
requirements.verified
```

Safe metadata:

```text
previous_status
new_status
```

Do not duplicate reviewer notes or private requirement information.

## Payment Submitted

First successful payment-proof submission:

```text
payment.submitted
```

Actor:

booking customer.

Do not store proof URL/path/reference number in audit metadata.

## Payment Resubmitted

Successful later payment-proof resubmission:

```text
payment.resubmitted
```

Actor:

booking customer.

## Payment Review

Owner/Admin transitions:

```text
payment.needs_resubmission
payment.verified
```

Safe metadata:

```text
previous_status
new_status
```

Do not store payment proof/account details.

## Vehicle Assignment

Successful canonical assignment or substitution:

```text
booking.vehicle_assigned
```

Actor:

Owner/Admin.

Safe metadata may contain:

```text
previous_assigned_vehicle_id
assigned_vehicle_id
requested_vehicle_id
```

Do not audit a failed assignment.

## Booking Confirmation

Successful canonical confirmation:

```text
booking.confirmed
```

Actor:

Owner/Admin.

Do not infer confirmation from:

```text
payment.verified
```

The booking confirmation transition itself must succeed.

## Booking Rejection / Cancellation

Only instrument these if an existing canonical transition exists.

Do not create business functionality merely to create an audit event.

## Rental Release

Successful canonical release/start:

```text
rental.released
```

Actor:

Owner/Admin.

Safe metadata may contain:

```text
booking_id
vehicle_id
scheduled_return_at
release_odometer
```

Do not copy release-condition free text.

## Rental Return

Successful physical return/closure:

```text
rental.returned
```

Actor:

Owner/Admin.

Safe metadata may contain:

```text
booking_id
vehicle_id
return_odometer
returned_at
```

Do not calculate settlement or late fees.

## Maintenance Created

Successful canonical maintenance record creation:

```text
maintenance.created
```

Actor:

Owner/Admin.

Safe metadata:

```text
vehicle_id
maintenance_type
status
```

Do not copy remarks/description wholesale unless a minimal non-sensitive value is specifically necessary.

## Maintenance Completed

Successful:

```text
Open → Completed
```

Audit:

```text
maintenance.completed
```

## Maintenance Cancelled

Successful:

```text
Open → Cancelled
```

Audit:

```text
maintenance.cancelled
```

## Notifications Exclusion

Do not audit:

```text
notification.created
notification.read
```

Do not modify VS019 notification triggers merely for audit.

## Reminder Exclusion

Do not audit:

```text
reminder.processed
upcoming_pickup.created
rental_overdue.created
```

Do not modify VS020 reminder processing merely for audit.

## Intelligence Exclusion

Do not instrument:

- utilization;
- WMA;
- MAPE;
- supply evaluation;
- shortage/surplus;
- allocation recommendation;
- allocation approval/rejection.

Those remain later decisions.

## Audit Read Authorization

Audit Trail is:

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

No role may modify existing audit records.

## Audit Read API

Create the smallest Owner/Admin-only read endpoint.

Return newest first.

Support bounded pagination or bounded limit.

Reasonable filters:

- entity/domain type;
- actor;
- date-from;
- date-to.

Do not over-engineer search.

Validate all filters server-side.

## Actor Resolution

For audit display, resolve actor profile information safely.

Display may use:

- name;
- role;
- appropriate admin-visible email if already consistent with existing admin UI.

Do not persist full profile snapshots into every audit event.

## Audit Trail UI

Add one Owner/Admin-only surface.

Preferred customer-facing/admin wording:

**Activity**

or:

**Audit Trail**

Baseline columns:

```text
Time
Actor
Action
Entity
Summary
```

Provide lightweight filters:

```text
Domain
Actor
Date range
```

No charts required.

No export required.

## Metadata UI

Do not render raw JSON as the main audit experience.

Translate known safe metadata into readable summaries where useful.

Example:

```text
Payment verification changed:
Pending Verification → Verified
```

instead of:

```json
{"previous_status":"Pending Verification","new_status":"Verified"}
```

## Pagination

Do not load an unbounded audit history.

Use a reasonable bounded page/limit consistent with the repository.

## RLS / Grants

Enforce restrictive access.

Normal client roles must not receive arbitrary insert/update/delete grants.

Owner/Admin audit read should occur through:

- strict RLS; or
- trusted server route after role validation;

consistent with the repository's security architecture.

## Testing

Add focused tests.

### Security

- audit events immutable;
- arbitrary browser insert denied;
- arbitrary update denied;
- arbitrary delete denied;
- Owner/Admin read allowed;
- Customer read denied;
- Operations Staff read denied.

### Booking

- manual booking → exactly one `booking.created`;
- Finder booking → exactly one `booking.created`;
- same idempotency retry → no duplicate.

### Requirements

- initial complete submission → `requirements.submitted`;
- later correction submission → `requirements.resubmitted`;
- Needs Resubmission review → audit;
- Verified review → audit;
- failed review → no audit.

### Payment

- first proof → `payment.submitted`;
- later proof → `payment.resubmitted`;
- Needs Resubmission → audit;
- Verified → audit;
- failed review → no audit.

### Assignment

- successful assignment → audit;
- substitution records previous/new assigned IDs;
- failed assignment → no audit.

### Confirmation

- successful confirmation → audit;
- failed confirmation → no audit.

### Rental

- successful release → `rental.released`;
- failed release → no audit;
- successful return → `rental.returned`;
- failed return → no audit.

### Maintenance

- create → `maintenance.created`;
- complete → `maintenance.completed`;
- cancel → `maintenance.cancelled`;
- failed transition → no audit.

### Metadata Safety

Assert generated audit metadata does not contain known sensitive keys such as:

```text
proof_path
storage_path
license_number
id_number
reference_number
account_number
reviewer_notes
```

or equivalent current schema names.

### Scope

Assert no audit instrumentation was added to:

- notification mark-read;
- notification creation;
- reminder processor;
- forecasting;
- supply;
- allocation.

## Provider-Backed Validation

Where configured, use disposable development records.

Perform representative successful mutations and confirm:

- correct action;
- correct actor;
- correct entity;
- correct booking linkage;
- safe metadata;
- no duplicate on retry;
- Owner/Admin read works;
- Customer/Operations Staff access denied.

Cleanup through validation tooling/session cleanup or explicit development cleanup commands.

Never commit test cleanup as a production migration.

## Definition of Done

VS021 is complete when:

- canonical append-only audit persistence exists;
- semantic core lifecycle audit events work;
- actor identity is trustworthy;
- safe metadata is enforced by implementation discipline;
- audited mutations and events are atomic where approved;
- idempotent retries do not duplicate history;
- Owner/Admin can inspect a canonical Audit Trail;
- Customer and Operations Staff cannot access it;
- audit rows cannot normally be edited/deleted;
- notifications/reminders are not audited;
- intelligence modules are not audited.

## Stop Rule

Stop after VS021.

Do not implement:

- VS022;
- operational context;
- audit export;
- audit analytics;
- notification/reminder audit;
- forecasting/supply/allocation audit;
- settlement;
- generic database-wide auditing.