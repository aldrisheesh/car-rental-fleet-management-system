# Vertical Slice 019 — Canonical In-App Notification Foundation

**Status:** Approved for implementation  
**Objective:** Introduce canonical recipient-specific in-app notifications for high-value event-driven booking, requirement, and payment transitions; connect the existing Notifications UI to real data; support unread/read state and deduplication; and preserve all existing lifecycle behavior without adding scheduled reminders, external email delivery, or audit logging.

## Purpose

The system already has canonical business transitions such as:

```text
Booking created
Requirements submitted
Requirements -> Needs Resubmission
Requirements -> Verified
Payment proof submitted
Payment -> Needs Resubmission
Payment -> Verified
Booking -> Confirmed
```

VS019 adds the awareness layer:

```text
Canonical transition succeeds
          ↓
Resolve recipient(s)
          ↓
Create canonical notification
          ↓
Unread
          ↓
Existing Notifications UI
          ↓
Read
```

Notifications never replace the underlying state transition.

## Required Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `engineering/sprints/VERTICAL-SLICE-019.md`
- `codex-context/08-notifications-and-audit.md`
- `codex-context/27-notification-foundation.md`
- `codex-context/25-canonical-subsystem-map.md`

Do not read other context files unless a concrete blocker requires them.

## Strict Initial Inspection

Start by locating only:

1. the existing Notifications route/page;
2. canonical booking creation transition:
   - `src/routes/api.bookings.ts`
3. exact requirement submit/resubmit API/server boundary;
4. exact requirement review API/server boundary;
5. exact payment proof submit/resubmit API/server boundary;
6. exact payment review API/server boundary;
7. exact booking confirmation/rejection/cancellation boundary where currently implemented;
8. auth helpers required for current-principal notification reads.

Do not inspect:

- Finder;
- forecasting;
- supply;
- allocation;
- maintenance;
- reports;
- external context;

unless a concrete compilation dependency requires one exact file.

Do not read previous vertical-slice contracts.

## Scope

VS019 introduces exactly:

1. canonical notification persistence;
2. trusted transition-generated notifications;
3. unread/read behavior;
4. unread count;
5. canonical Notifications API/read boundary;
6. existing Notifications UI backed by real data.

VS019 does **not** introduce:

- scheduled reminders;
- cron/scheduler;
- Brevo email;
- SMTP;
- SMS;
- browser push;
- audit logging;
- notification preferences.

## Notification Persistence

Create an additive canonical notification table.

Recommended shape:

```text
notifications

id
recipient_id
notification_type
title
message
related_entity_type
related_entity_id
event_key
created_at
read_at
```

Equivalent naming is acceptable if consistent with the repository.

## Recipient-Specific Records

Each recipient receives an independent row.

Example:

```text
New booking request
      ↓
Owner A -> notification row
Admin B -> notification row
```

Do not create:

```text
recipient_role = Owner/Admin
```

as the canonical model.

## Notification Types

Use stable machine-readable notification types.

Suggested values:

```text
requirements_needs_resubmission
requirements_verified
payment_needs_resubmission
payment_verified
booking_confirmed
booking_rejected
booking_cancelled
new_booking_request
requirements_submitted
payment_proof_submitted
```

Use equivalent naming if existing enum/style conventions justify it.

Do not derive business logic from title/message strings.

## Event Deduplication

Require:

```text
unique(recipient_id, event_key)
```

or equivalent trusted guarantee.

The event key must represent one logical notification-producing transition.

Retries and double-clicks must not produce duplicate notifications.

## Event-Key Semantics

Do not use only:

```text
booking_id + notification_type
```

for events that can legitimately repeat.

Requirement/payment resubmissions may happen more than once.

Use the smallest stable transition identity available, such as:

- persisted review ID;
- submission version;
- transition timestamp;
- payment submission ID;
- requirement set version;
- equivalent canonical event identity.

Do not invent unstable random event keys server-side for retryable transitions.

## Immutability

After creation, immutable fields include:

- notification type;
- title;
- message;
- recipient;
- related entity;
- event key;
- created timestamp.

Only read state may mutate in VS019.

## Read State

Baseline state:

```text
Unread
→ Read
```

Implement:

```text
read_at = trusted server timestamp
```

Recipient may mark only their own notification read.

Do not allow arbitrary modification.

No requirement to implement Read → Unread unless the existing UI already clearly depends on it.

## Authorization / RLS

Customer/Renter:

- read only own notifications;
- mark only own notifications read.

Owner/Admin:

- read only their own recipient-specific notifications;
- mark only their own notifications read.

Operations Staff:

- no VS019 event categories are invented for them;
- they may receive zero notifications.

No direct client API may create canonical notifications.

## Unread Count

Expose a trusted current-principal unread count.

Suitable response:

```text
unreadCount
```

Do not calculate from client-side mock arrays.

## Notification Reads

Return newest first.

Return only safe fields required by the UI.

Do not expose:

- private requirement document URLs;
- ID numbers;
- payment account identifiers;
- other-customer sensitive information;
- internal reviewer notes.

## Related Entity Navigation

Where straightforward, include enough safe linkage for the UI to navigate to an existing relevant surface.

Examples:

```text
booking
requirements
payment
```

Do not create new destination pages merely for notifications.

## Event Matrix — Customer

### NTF-001 — Requirements Need Resubmission

Trigger:

```text
Pending Review -> Needs Resubmission
```

after successful canonical review.

Recipient:

booking customer.

Create only after the transition succeeds.

Message must direct the customer to review requirement corrections.

Use only customer-facing reasons already permitted by the requirement workflow.

Do not include internal reviewer notes.

### NTF-002 — Requirements Verified

Trigger:

```text
Pending Review -> Verified
```

Recipient:

booking customer.

Message may tell the customer:

```text
Your requirements were verified.
You can proceed to the payment step.
```

Do not claim booking confirmation.

### NTF-003 — Payment Needs Resubmission

Trigger:

```text
Pending Verification -> Needs Resubmission
```

Recipient:

booking customer.

Direct them to payment proof/correction information.

### NTF-004 — Payment Verified

Trigger:

```text
Pending Verification -> Verified
```

Recipient:

booking customer.

Do not claim booking confirmation.

### NTF-005 — Booking Confirmed

Trigger:

successful canonical:

```text
booking_status -> Confirmed
```

Recipient:

booking customer.

Safe message may include vehicle/date information already customer-visible.

### NTF-006 — Booking Rejected / Cancelled

Only implement for states/transitions that already canonically exist.

Do not invent a rejection/cancellation transition solely to support a notification.

If a customer-facing canonical reason exists, it may be included.

Otherwise use neutral safe wording.

## Event Matrix — Owner/Admin

For every internal event below, recipients are:

```text
all profiles where
user_type = Owner/Admin
AND account_status = Active
```

Resolve recipients at transition time.

### NTF-101 — New Booking Request

Trigger:

successful creation of a customer booking.

This includes:

- normal manual booking;
- Finder-origin booking.

The booking idempotency boundary must ensure one logical booking creation does not create duplicate notifications.

### NTF-102 — Requirements Submitted / Resubmitted

Trigger:

customer successfully submits/resubmits a complete requirement set and it becomes:

```text
Pending Review
```

Create one notification per active Owner/Admin per submission/review cycle.

### NTF-103 — Payment Proof Submitted / Resubmitted

Trigger:

successful customer payment-proof submission where payment becomes:

```text
Pending Verification
```

Create one notification per active Owner/Admin per submission cycle.

## Active Owner/Admin Expansion

Inactive Owner/Admin users must not receive new notifications.

Do not delete old notifications if an account later becomes inactive.

## Transaction Integration

Where the business transition already happens inside a database RPC:

extend it using a **new additive migration** so:

```text
business state
+
notifications
```

commit atomically.

Where a transition currently uses a nontransactional server sequence, introduce the smallest trusted transaction needed if necessary.

Do not broadly rewrite lifecycle architecture.

## Booking Creation Integration

VS018 already created canonical idempotent booking creation.

Extend its current/latest trusted booking-create database function through a new additive migration if appropriate.

Do not rewrite:

```text
20260901101000_booking_creation_idempotency.sql
```

The new booking notification must occur once per canonical booking.

## Notification API

Create the smallest appropriate route/server API.

At minimum:

### GET

Current principal:

```text
notifications[]
unreadCount
```

Optional pagination is acceptable if already natural in the app, but do not over-engineer.

### Mark Read

Trusted operation receives:

```text
notificationId
```

Server ensures:

```text
notification.recipient_id = principal.userId
```

before updating `read_at`.

No arbitrary create/delete/edit API.

## Existing Notifications UI

Inspect and reuse the existing notification page/shell.

Remove mock/prototype notification arrays.

Support at minimum:

- real canonical notification list;
- newest-first;
- unread/read visual distinction;
- unread count;
- mark read;
- loading;
- error;
- empty state.

Do not create another Notifications route.

## Navigation Badge

If the existing app has an obvious notifications navigation item capable of a badge, integrate unread count there.

Keep it small.

Do not redesign the global navigation system.

## Customer UI

Customer sees only their notifications.

Examples:

```text
Requirements need an update
Payment verified
Booking confirmed
```

Do not show internal Admin operational notifications.

## Owner/Admin UI

Owner/Admin sees only their own recipient rows.

Examples:

```text
New booking request
Requirements ready for review
Payment proof ready for verification
```

Do not expose another Admin user's read state.

## Operations Staff

Do not invent Operations Staff notifications in VS019.

If the existing Notifications page is accessible to them, an empty canonical state is acceptable unless current authorization requires otherwise.

## No External Delivery

Even though Brevo is now the planned future provider:

VS019 must not:

- call Brevo;
- create Brevo API clients;
- send email;
- configure SMTP;
- create React Email templates.

## No Scheduled Reminders

Do not implement:

- upcoming pickup;
- upcoming return;
- overdue rental;
- maintenance due;
- low availability;
- shortage notification.

Those belong to VS020.

## No Audit Logging

Do not use notifications as:

```text
audit_log
```

System-wide audit remains a later slice.

## Client Ground Truth

VS019 improves awareness around the centralized workflow Briah requested.

It must preserve:

```text
Booking
↓
Requirements
↓
Verification
↓
Payment
↓
Assignment / Confirmation
```

Notifications must not advance the lifecycle.

## Testing

Add focused tests for at least:

### Persistence / authorization

- customer reads only own notifications;
- Admin reads only own notifications;
- cannot mark another user's notification read;
- read timestamp server-controlled;
- unread count correct;
- newest-first ordering;
- content immutable.

### Customer event generation

- Needs Resubmission -> NTF-001 exactly once;
- Requirements Verified -> NTF-002 exactly once;
- Payment Needs Resubmission -> NTF-003 exactly once;
- Payment Verified -> NTF-004 exactly once;
- Booking Confirmed -> NTF-005 exactly once;
- rejection/cancellation notification only where canonical transition exists.

### Admin event generation

- new manual booking -> one NTF-101 per active Owner/Admin;
- new Finder booking -> one NTF-101 per active Owner/Admin;
- idempotent booking retry -> no duplicate NTF-101;
- inactive Owner/Admin excluded;
- requirement submission -> NTF-102;
- requirement resubmission -> a later distinct NTF-102;
- payment proof submission -> NTF-103;
- payment proof resubmission -> a later distinct NTF-103.

### Atomicity

Where transition + notification are integrated transactionally:

- failed transition leaves no notification;
- notification insert failure rolls back transition where required by the approved transaction boundary.

### Scope

- no Brevo/external delivery;
- no scheduled reminder jobs;
- no audit-log implementation;
- existing lifecycle behavior unchanged.

## Provider-Backed Validation

Where configured, use disposable development records to validate:

1. create booking;
2. active Owner/Admin receive NTF-101;
3. customer submits requirements;
4. Admin receives NTF-102;
5. Admin marks Needs Resubmission;
6. customer receives NTF-001;
7. customer resubmits;
8. Admin receives a second distinct NTF-102;
9. Admin verifies requirements;
10. customer receives NTF-002;
11. customer submits payment proof;
12. Admin receives NTF-103;
13. payment resubmission can produce a later distinct NTF-103;
14. Admin verifies payment;
15. customer receives NTF-004;
16. Admin confirms booking;
17. customer receives NTF-005;
18. mark one notification read;
19. verify unread count decrements;
20. cross-user read/update denied;
21. retry booking creation does not duplicate Admin notification.

Clean up disposable data where practical.

### Historical cleanup migration note

`20260902007000_vs019_provider_validation_cleanup.sql` is historical, already-applied development migration history. Preserve it unchanged, but do not copy it as a pattern: provider/test-fixture cleanup belongs in validation tooling/session cleanup or explicit development cleanup commands, never in a normal production Supabase migration.

## Definition of Done

VS019 is complete when:

- canonical recipient-specific notifications exist;
- RLS/privacy is enforced;
- event-driven customer notifications work;
- event-driven Owner/Admin notifications work;
- legitimate resubmission cycles create distinct notifications;
- retries do not duplicate a logical notification;
- read state/unread count works;
- existing Notifications UI uses canonical data;
- lifecycle states are unchanged;
- no external delivery exists;
- no scheduler exists;
- no audit implementation exists.

## Stop Rule

Stop after the canonical in-app notification foundation is complete.

Do not implement:

- VS020;
- scheduled reminders;
- Brevo;
- email/SMS/push;
- notification preferences;
- audit logs;
- operational context;
- dashboard/report redesign.
