# Canonical Audit Trail

**Status:** Frozen for VS021
**Last updated:** 2026-09-02

VS021 introduces a canonical append-only audit trail for high-value human-triggered mutations in the core booking, requirement, payment, rental, assignment, and maintenance lifecycle.

Audit is historical evidence. It is not a notification system, not analytics, and not a duplicate copy of every entity.

## 1. Purpose

The audit trail answers:

- who performed the action;
- what semantic action occurred;
- what entity was affected;
- when it occurred;
- what small safe context is necessary to understand the event.

Examples:

`Admin verified a payment for Booking X at 10:42.`

`Customer resubmitted requirements for Booking Y.`

`Owner released Vehicle Z for Rental R.`

## 2. Scope

VS021 audits only meaningful canonical mutations.

VS021 does NOT audit:

- page views;
- GET/read requests;
- navigation;
- filter/sort changes;
- notification creation;
- notification read state;
- reminder generation;
- login/session refresh;
- every database UPDATE generically;
- forecast/supply/allocation events unless separately frozen later.

## 3. Canonical Audit Record

Recommended table:

`audit_events`

Minimum fields:

- `id uuid primary key`;
- `actor_type text not null`;
- `actor_user_id uuid null`;
- `action text not null`;
- `entity_type text not null`;
- `entity_id uuid not null`;
- `booking_id uuid null` where useful for cross-domain filtering;
- `metadata jsonb not null default '{}'`;
- `occurred_at timestamptz not null default now()`.

Equivalent repository-consistent naming is acceptable.

## 4. Actor Types

Baseline actor types:

- `User`
- `System`

For VS021 first-wave events, prefer human `User` actors.

`actor_user_id`:
- required for `User`;
- null for `System`.

Do not fabricate a pseudo-user UUID for automated/system actions.

## 5. Semantic Action Naming

Use stable machine-readable dotted actions.

Freeze these baseline actions:

### Booking
- `booking.created`
- `booking.vehicle_assigned`
- `booking.confirmed`
- `booking.rejected` only if canonical rejection exists
- `booking.cancelled` only if canonical cancellation exists

### Requirements
- `requirements.submitted`
- `requirements.resubmitted`
- `requirements.needs_resubmission`
- `requirements.verified`

### Payment
- `payment.submitted`
- `payment.resubmitted`
- `payment.needs_resubmission`
- `payment.verified`

### Rental
- `rental.released`
- `rental.returned`

### Maintenance
- `maintenance.created`
- `maintenance.completed`
- `maintenance.cancelled`

Do not invent events for states/transitions that do not actually exist canonically.

## 6. Entity Types

Baseline entity types:

- `booking`
- `requirements`
- `payment`
- `rental`
- `maintenance`

Use the entity that best represents the semantic action.

Examples:
- `booking.created` -> booking
- `payment.verified` -> payment
- `rental.returned` -> rental

## 7. Safe Metadata

Metadata must be minimal and intentionally selected.

Good examples:

```json
{
  "previous_status": "Pending Verification",
  "new_status": "Verified",
  "booking_id": "..."
}
```

```json
{
  "requested_vehicle_id": "...",
  "assigned_vehicle_id": "..."
}
```

Bad examples:

- full requirement document rows;
- government ID numbers;
- driver's-license values;
- payment account numbers;
- proof-of-payment private object paths/URLs;
- uploaded document URLs;
- full customer profile objects;
- raw internal reviewer notes;
- secrets/tokens;
- entire old/new database rows.

The audit trail is not a database snapshot.

## 8. Reviewer Reasons

Where an existing workflow has a customer-safe reason, the audit event does not need to duplicate the full reason text.

Prefer metadata such as:
- `reason_present: true`
- resulting status
- affected requirement type identifiers only if safe/useful

Do not persist sensitive free-text notes merely because they are available.

## 9. Append-Only

Audit events are immutable after creation.

Normal application roles must have no:

- UPDATE;
- DELETE;

authority on `audit_events`.

There is no normal "edit audit event" API.

Corrections to business data generate later business/audit events; they do not rewrite history.

## 10. Creation Authority

Audit events are created only by trusted canonical mutation boundaries.

Browser clients cannot insert arbitrary audit rows.

Prefer:

trusted business RPC / transaction
-> business mutation
+ semantic audit insert
-> atomic commit

## 11. Atomicity

For audited mutations, the business state transition and its audit event should commit atomically.

If the audit insert fails:
- the audited business mutation should roll back where the transition has been brought under the approved transactional boundary.

If a transition cannot be made atomic without broad unrelated refactoring, report that exact event as BLOCKED/deviation rather than silently using unreliable client-side logging.

## 12. Idempotency / Deduplication

Audit must reflect one canonical successful mutation, not one HTTP attempt.

If a business operation is already idempotent:
- reuse its canonical transaction boundary;
- do not create duplicate audit rows on retries.

Do not add an arbitrary global deduplication key unless needed.

A unique audit event identity tied to the successful business transition/RPC result is acceptable.

For recurring legitimate actions (e.g. requirement resubmission), each successful cycle receives its own audit event.

## 13. Customer Booking Creation

`booking.created` records the authenticated Customer/Renter actor.

It must work for:
- manual bookings;
- Finder-origin bookings.

A retry that returns an already-created idempotent booking must not create a second `booking.created` audit event.

Finder provenance itself is not duplicated into audit metadata.

## 14. Requirement Submission

On first successful complete submission:
`requirements.submitted`

On a later successful correction/resubmission after `Needs Resubmission`:
`requirements.resubmitted`

Actor:
booking customer.

Do not audit individual file-selection clicks.

## 15. Requirement Review

Owner/Admin successful review transitions:

- `requirements.needs_resubmission`
- `requirements.verified`

Actor:
reviewing Owner/Admin.

Metadata may contain:
- previous status;
- new status;
- booking ID.

Do not copy private document contents or internal reviewer notes.

## 16. Payment Submission

First successful proof submission:
`payment.submitted`

Later accepted resubmission cycle:
`payment.resubmitted`

Actor:
booking customer.

Do not store proof object URL, account number, or reference number in audit metadata unless a later approved rule explicitly requires a masked form.

## 17. Payment Review

Owner/Admin successful transitions:

- `payment.needs_resubmission`
- `payment.verified`

Audit metadata:
- previous/new status;
- booking ID;
- payment ID.

Do not duplicate proof data.

## 18. Vehicle Assignment

Successful canonical vehicle assignment/substitution:
`booking.vehicle_assigned`

Actor:
Owner/Admin.

Safe metadata may include:
- previous assigned vehicle ID nullable;
- new assigned vehicle ID;
- requested vehicle ID where useful.

Do not store customer private data.

## 19. Booking Confirmation

Successful:
`booking.confirmed`

Actor:
Owner/Admin.

Do not create confirmation audit event merely because payment becomes verified.

Use only the canonical booking confirmation transition.

## 20. Booking Rejection / Cancellation

Audit only transitions that currently exist canonically.

Do not implement new rejection/cancellation business behavior in VS021.

## 21. Rental Release

Successful canonical release/start:
`rental.released`

Actor:
Owner/Admin who performs release.

Safe metadata may include:
- booking ID;
- vehicle ID;
- scheduled return timestamp;
- release odometer if already non-sensitive operational data and useful.

Do not copy release condition free text wholesale unless explicitly necessary.

## 22. Rental Return

Successful canonical physical return/closure:
`rental.returned`

Actor:
Owner/Admin.

Safe metadata may include:
- booking ID;
- vehicle ID;
- return odometer;
- returned timestamp.

Do not implement settlement/late-fee logic.

## 23. Maintenance

Successful:
- `maintenance.created`
- `maintenance.completed`
- `maintenance.cancelled`

Actor:
Owner/Admin.

Safe metadata may include:
- vehicle ID;
- maintenance type;
- status transition.

Avoid copying remarks or sensitive free text wholesale.

## 24. Notifications Boundary

Do not create audit events for:
- VS019 notification insertion;
- notification mark-read;
- VS020 reminder processor execution.

Audit and notifications remain separate.

## 25. System / Automation Events

VS021 schema supports `System`, but first-wave instrumentation is human mutation focused.

Do not instrument forecasting, reminders, notifications, or schedulers merely because `System` actor type exists.

## 26. Read Authorization

Audit Trail UI/API is Owner/Admin-only in VS021.

Customer/Renter:
- no audit access.

Operations Staff:
- no audit access in VS021.

Owner/Admin:
- read-only access.

Do not expose another role's audit data through generic APIs.

## 27. Audit Read API

Provide the smallest Owner/Admin read endpoint consistent with the application.

Support:
- newest-first;
- bounded pagination/limit;
- optional domain/entity filter;
- optional actor filter;
- optional date range.

Do not build advanced analytics.

Always validate filter inputs server-side.

## 28. Audit UI

Add or reuse one Owner/Admin-only surface named appropriately:

`Activity`
or
`Audit Trail`

Baseline table/list:

- Time
- Actor
- Action
- Entity
- Summary

Useful filters:
- domain/entity type;
- actor;
- date range.

Do not expose raw JSON metadata as the default primary UI.

A details expansion may show safe metadata if straightforward.

## 29. Actor Display

Resolve human-readable actor identity safely from existing profile data.

Prefer:
- display name;
- role;
- email only if already appropriate for Owner/Admin admin surfaces.

Do not duplicate mutable actor profile fields into every audit event unless an immutable historical snapshot is explicitly needed later.

If actor account is later disabled/deleted, audit event remains.

## 30. Retention

VS021 defines no automatic purge policy.

Do not delete historical audit records automatically.

## 31. RLS / Grants

`audit_events` should be insertable only through trusted service/RPC boundaries.

Owner/Admin read is permitted through the approved server/API boundary and/or strict RLS.

Normal client roles receive no create/update/delete authority.

## 32. Migration Discipline

Use additive migrations only.

Do not rewrite previous booking/requirement/payment/rental/maintenance migrations.

Where an existing RPC must be extended to add an audit insert:
- replace/redefine the function in a NEW additive migration;
- preserve its existing business semantics.

## 33. No Generic "Audit Every Table" Trigger

Do not create a blanket trigger over arbitrary database tables.

Semantic audit should come from explicit canonical mutation boundaries.

Selective database triggers are acceptable only where actor identity and semantic action are unambiguous and the design remains narrow.

## 34. Testing

Test at minimum:

### Persistence / security
- audit rows immutable;
- Owner/Admin can read;
- Customer cannot read;
- Operations Staff cannot read;
- browser cannot create arbitrary audit event;
- metadata excludes known sensitive fields.

### Booking
- manual booking -> exactly one `booking.created`;
- Finder booking -> exactly one `booking.created`;
- idempotent retry -> no duplicate `booking.created`.

### Requirements
- first submission -> `requirements.submitted`;
- later resubmission -> `requirements.resubmitted`;
- Needs Resubmission review -> one corresponding audit;
- Verified review -> one corresponding audit.

### Payment
- first proof -> `payment.submitted`;
- later proof -> `payment.resubmitted`;
- Needs Resubmission review -> audit;
- Verified review -> audit.

### Assignment / confirmation
- successful assignment -> `booking.vehicle_assigned`;
- successful confirmation -> `booking.confirmed`;
- failed transition -> no audit.

### Rental
- successful release -> `rental.released`;
- successful return -> `rental.returned`;
- failed release/return -> no audit.

### Maintenance
- create -> `maintenance.created`;
- complete -> `maintenance.completed`;
- cancel -> `maintenance.cancelled`.

### Scope
- notification creation does not create audit event;
- mark-read does not create audit event;
- reminder processing does not create audit event;
- no forecasting/supply/allocation audit added.

## 35. Provider-Backed Validation

Use disposable development data only where necessary.

Validate representative mutations and audit rows.

Cleanup must happen through validation tooling/session cleanup or explicit development cleanup commands.

Never commit provider/test-fixture cleanup as a production migration.

## 36. Definition of Done

VS021 is complete when:
- canonical append-only audit persistence exists;
- semantic first-wave core lifecycle events are recorded;
- audited transitions are atomic with business mutations where approved;
- idempotent retries do not duplicate audit history;
- metadata is safe/minimal;
- Owner/Admin read-only Audit Trail works;
- Customer/Operations Staff cannot access it;
- notifications/reminders are not audited;
- no forecasting/supply/allocation audit work is added.

## 37. Stop Rule

Stop after the core canonical audit trail.

Do not implement:
- VS022;
- context APIs;
- forecasting/supply/allocation audit;
- notification/reminder audit;
- settlement;
- generic database-wide auditing;
- audit export/reporting analytics.
