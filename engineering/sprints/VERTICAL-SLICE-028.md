# Vertical Slice 028 — Maintenance & Low-Availability Notifications

**Status:** Approved for implementation  
**Objective:** Extend the existing canonical in-app Notifications subsystem with recipient-specific, preference-aware, deduplicated operational notifications for maintenance attention and low fleet availability.

## Purpose

The Notifications architecture already exists and is canonical.

VS028 does not redesign notifications.

It adds two missing operational notification families:

```text
Maintenance attention
Low fleet availability
```

The target architecture is:

```text
Canonical maintenance readiness
        ↓
Maintenance condition evaluator
        ↓
Recipient + preference resolution
        ↓
Deduplicated notification
        ↓
Existing Notifications UI


Canonical current fleet availability
        ↓
Low-availability condition evaluator
        ↓
Recipient + preference resolution
        ↓
Deduplicated notification
        ↓
Existing Notifications UI
```

Do not generate notifications from client page loads.

---

## Manuscript Traceability

VS028 supports the manuscript's operational-awareness requirements around:

- maintenance/PMS attention;
- fleet readiness;
- low vehicle availability;
- administrator awareness;
- notification-based operational support.

VS028 is intended to close:

`MIC-019 — Maintenance and Low-Availability Notifications`

Do not mark MIC-019 complete until both new notification families are implemented, deduplicated, preference-aware, and validated.

---

# Required Context

Read first:

1. `engineering/AI-ENGINEERING-CONTEXT.md`
2. `engineering/sprints/VERTICAL-SLICE-028.md`
3. `codex-context/25-canonical-subsystem-map.md`
4. `codex-context/43-maintenance-low-availability-notifications.md`
5. `codex-context/44-manuscript-traceability-vs028.md`

Do not read previous vertical-slice contracts unless an exact implementation dependency genuinely requires it.

---

# Initial Inspection

Inspect only the exact relevant surfaces:

1. canonical notification schema/migrations;
2. `src/lib/notifications.ts`;
3. `/api/notifications`;
4. existing notification-generation helpers/services;
5. notification-preferences implementation;
6. reminder/scheduled-processing implementation;
7. `NotificationsPanel`;
8. canonical maintenance readiness;
9. VS026 canonical current-availability helpers;
10. role/recipient resolution;
11. any existing deduplication/idempotency conventions for notifications.

Do not inspect unrelated subsystems.

---

# Existing Notification System Is Authoritative

Preserve existing:

```text
notifications
recipient_id
notification_type
title
message
related_entity_type
related_entity_id
created_at
read_at
```

Preserve existing:

- recipient-specific reads;
- read/unread behavior;
- realtime integration if already present;
- preference behavior;
- reminder processing;
- booking notifications;
- requirement notifications;
- payment notifications;
- pickup/return reminders;
- rental-overdue notifications.

Do not rewrite those systems.

---

# New Notification Types

Add only the smallest required canonical types.

Recommended:

```text
maintenance_attention
low_availability
```

Exact names may follow existing repository naming conventions.

Do not overload an unrelated existing notification type.

---

# Entity Types

Extend `NotificationEntityType` only as necessary.

## Maintenance

Maintenance attention should preferably relate to:

```text
vehicle
```

using the canonical vehicle ID.

Do not fake a:

```text
booking
```

relationship merely because existing UI navigation supports bookings.

## Low Availability

Prefer a meaningful canonical scope such as:

```text
branch
```

when the low-availability condition is branch-specific.

If the condition is fleet-wide and the current notification schema cannot express a fleet entity cleanly, add the smallest canonical entity-type support necessary.

Do not invent a fake entity ID.

---

# Recipient Scope

These are operational/management notifications.

Do not send them to:

```text
Customer/Renter
```

Inspect the current canonical role model and preferences before freezing recipient behavior.

Expected candidates:

```text
Owner/Admin
Operations Staff
```

If the current manuscript/context explicitly reserves a condition for Owner/Admin, preserve that boundary.

Do not assume every Admin UI user must receive every alert.

---

# Notification Preferences

Reuse the existing notification-preferences subsystem.

Do not bypass an explicit recipient opt-out.

If current preferences are category-based and need an additive category:

extend them narrowly.

Possible preference categories:

```text
maintenance alerts
fleet availability alerts
```

Do not redesign the preference model.

If the existing preference schema cannot represent these independently without disproportionate migration work, map them to the closest canonical awareness category only if semantically defensible and document that choice.

---

# Maintenance Notification Condition

Use canonical maintenance readiness.

Do not implement a second PMS/readiness algorithm.

Potential canonical causes may include:

```text
active blocking maintenance
preventive maintenance due by date
preventive maintenance due by odometer
vehicle condition blocks rental use
current odometer missing for a configured PMS target
```

The exact condition must come from the current shared readiness result.

Do not notify merely because:

```text
status = Open
```

A non-blocking Open record alone is not necessarily an alert condition.

---

# Maintenance Notification Granularity

Prefer one active condition identity per:

```text
vehicle + material readiness reason set
```

or another deterministic equivalent.

Avoid generating several redundant notifications for the same vehicle on the same evaluation run.

If multiple readiness reasons exist, a single concise notification may summarize them.

Example:

```text
Toyota Innova needs maintenance attention

Preventive maintenance is due by odometer and the vehicle currently has
blocking maintenance.
```

Do not expose sensitive internal metadata.

---

# Maintenance Resolution

A maintenance-alert condition is considered resolved when canonical readiness no longer contains the material condition.

Resolution itself does not necessarily require deleting the existing notification.

Existing notification history remains historical.

The dedupe system must, however, allow a future new notification if:

```text
condition resolves
        ↓
later recurs
```

---

# Low Availability Condition

Use the canonical current availability semantics established by VS026.

Do not use prototype:

```text
vehicle.status = Available
```

A vehicle should only count toward available/rentable supply when it satisfies the existing current canonical rules, such as:

- active;
- maintenance-ready;
- no active physical rental;
- any additional already-canonical current availability restrictions.

Do not create another availability algorithm.

---

# Low Availability Scope

Prefer branch-level evaluation if branch assignment is canonical and useful.

Conceptually:

```text
canonical branch
        ↓
eligible/rentable vehicles now
        ↓
available count
        ↓
compare against configured threshold
```

Fleet-wide evaluation may also exist if there is a defensible use case.

Do not hard-code:

```text
Taft
Antipolo
```

Use canonical branches.

---

# Low Availability Threshold

This is not currently a confirmed Briah business rule.

Do not write:

```text
Briah considers fewer than 3 vehicles low availability.
```

unless an authoritative existing source says so.

Preferred implementation:

```text
LOW_AVAILABILITY_THRESHOLD
```

or another repository-consistent server-side configuration.

If a default is necessary:

- choose a conservative implementation default;
- keep it configurable;
- document it as provisional;
- do not call it client-confirmed.

If branch-specific thresholds would significantly widen scope, use one configurable global threshold for VS028 and record branch-specific policy as future work.

---

# Threshold Configuration

Do not expose threshold configuration to Customer.

An Admin configuration UI is not required in VS028 unless the existing Settings architecture already makes this trivial.

A server-side environment/config value is acceptable for the initial canonical implementation.

Example concept:

```text
LOW_AVAILABILITY_THRESHOLD=2
```

Do not put secrets in this variable; it is normal configuration.

If absent:

use the documented provisional default.

---

# Condition Identity / Deduplication

This is mandatory.

Repeated evaluations of an unchanged condition must not create repeated notifications.

## Incorrect

```text
16:00 low availability → notification
16:05 low availability → notification
16:10 low availability → notification
```

## Correct

```text
Condition becomes active
→ create one notification

Condition remains active
→ create none

Condition resolves
→ mark condition lifecycle inactive

Condition later becomes active again
→ create a new notification
```

---

# Deduplication Storage

Prefer a durable server-side condition-state or notification-condition key.

Possible approaches:

1. dedicated operational-notification-state table;
2. additive dedupe/condition key on notifications if repository architecture supports it;
3. existing idempotency mechanism if one already exists.

Do not rely only on:

```text
"Did we send one in the last hour?"
```

because that still produces spam for long-running conditions.

The chosen design must survive:

- server restart;
- scheduler rerun;
- page refresh;
- multiple users.

---

# Maintenance Condition Key

A deterministic identity may conceptually include:

```text
maintenance
vehicle_id
condition signature
```

Do not include volatile timestamps that would defeat deduplication.

If a vehicle's materially different readiness reason appears while an existing condition is active:

create a new notification only if the semantic change is significant enough to justify it.

Avoid notification churn for reason ordering or formatting differences.

---

# Low Availability Condition Key

Conceptually:

```text
low_availability
branch_id
threshold configuration identity
```

The active condition remains the same while the count stays below threshold.

Do not emit a new notification merely because:

```text
available count 1 → 0
```

unless the implementation explicitly treats severity changes as meaningful and tests that behavior.

Simpler VS028 rule:

```text
crossing from >= threshold
to < threshold
→ notify
```

and notify again only after recovery then another crossing.

---

# Recovery

Low availability resolves when:

```text
available count >= threshold
```

Maintenance attention resolves when the relevant canonical readiness condition resolves.

Recovery does not need a separate "resolved" notification in VS028.

Do not add recovery notices unless already required by manuscript/context.

---

# Trigger Architecture

Generation must be server-side.

Do not generate notifications inside:

```text
NotificationsPanel
Admin Dashboard
Maintenance page
Fleet page
```

simply because those pages are opened.

Preferred trigger:

reuse an existing scheduled/reminder-processing path.

If the existing reminder engine has a safe recurring processing function:

extend it with operational-condition evaluation.

If not:

add the smallest dedicated server-side processing endpoint/job compatible with the current architecture.

---

# Frequency

Do not create a high-frequency polling requirement.

Operational conditions should be evaluated at a reasonable existing scheduler cadence.

If the reminder engine already runs on a defined cadence, reuse it unless doing so creates unacceptable delay.

Do not invent sub-minute infrastructure.

---

# Manual Development Trigger

A development/test-only processing route or command may exist if needed for validation.

It must still execute the same canonical evaluator used by scheduled processing.

Do not create a separate fake test algorithm.

---

# Notification Titles / Messages

Keep concise and operational.

Examples:

## Maintenance

```text
Vehicle needs maintenance attention
```

Message:

```text
Toyota Innova requires maintenance attention before rental use.
```

Where useful, include safe reason summary.

## Low Availability

```text
Low vehicle availability
```

Message:

```text
Only 1 rentable vehicle is currently available at Antipolo.
```

Do not include internal database/debug details.

---

# Notification Routing

Update `NotificationsPanel`.

## Maintenance

Route:

```text
/admin/maintenance
```

## Low Availability

Preferred:

```text
/admin
```

or:

```text
/admin/fleet
```

Choose the destination most useful with the existing canonical UI.

Do not route these notifications to:

```text
/admin/bookings
```

---

# Icons / Grouping

Extend UI grouping only as needed.

Current categories may become something like:

```text
Bookings
Requirements
Payments
Rentals
Maintenance
Fleet
```

or another concise design.

Do not redesign the entire Notifications page.

---

# Customer Notification UI

Customer Notifications must remain unaffected.

Management-only types should never be returned to a customer because customers are not recipients.

Still ensure shared rendering does not break if a type is encountered unexpectedly.

---

# Existing Notification Types

Do not alter semantics for:

```text
requirements_needs_resubmission
requirements_verified
payment_needs_resubmission
payment_verified
booking_confirmed
new_booking_request
requirements_submitted
payment_proof_submitted
upcoming_pickup
upcoming_return
rental_overdue
```

except type-union compatibility required by the new types.

---

# Realtime

If existing Notifications realtime automatically reacts to inserted rows, reuse it.

Do not create another realtime channel.

---

# Read/Unread

New notifications use the same canonical:

```text
read_at
```

behavior.

Do not add a second acknowledgment state.

---

# Audit

Do not change audit architecture unless notification-condition processing already participates through an existing generic mechanism.

Notification generation does not need to produce duplicate audit rows solely for VS028.

---

# External Email Boundary

Do not implement:

```text
Brevo
email delivery
React Email
SMTP
external notification provider
```

VS028 is in-app only.

External delivery remains VS029.

---

# Dashboard Boundary

The VS026 Dashboard may already derive operational attention from canonical current state.

Do not change Dashboard cards just to display new notifications unless a tiny integration is already generic.

The new notification rows themselves are sufficient for VS028.

---

# Maintenance UI Boundary

Do not redesign Maintenance.

Its canonical readiness and lifecycle remain authoritative.

---

# Fleet Boundary

Do not redesign Fleet or vehicle availability.

Only reuse its canonical data/helpers.

---

# Tests

Add focused tests.

## Notification Types

Test:

```text
maintenance_attention
low_availability
```

project/render correctly.

---

## Maintenance Evaluation

Test at minimum:

```text
maintenance-ready vehicle
→ no notification

blocking maintenance
→ notification

PMS due by date
→ notification

PMS due by odometer
→ notification

condition-blocked vehicle
→ notification
```

Where canonical readiness considers missing odometer:

test that according to actual readiness semantics.

Do not mock a second rule set inconsistent with the canonical helper.

---

# Maintenance Deduplication

Test:

```text
condition first appears
→ 1 notification

same condition next run
→ still 1

condition resolves
→ lifecycle cleared

same condition recurs
→ second historical notification allowed
```

---

# Low Availability Evaluation

Test:

```text
available count >= threshold
→ no notification

cross below threshold
→ notification

remain below threshold
→ no duplicate

recover >= threshold
→ condition resolved

cross below again
→ new notification
```

---

# Availability Semantics

Test excluded vehicles:

```text
inactive
active physical rental
maintenance-not-ready
```

according to the exact existing VS026 availability helper.

Do not duplicate calculation in test fixtures if a shared pure helper exists.

---

# Branch Scope

If branch-level:

test:

- one branch below threshold;
- another healthy;
- only affected branch gets condition;
- no hard-coded two-branch behavior.

---

# Preferences

Test:

```text
recipient enabled
→ notification created

recipient opted out
→ no notification
```

Use the actual current preference semantics.

---

# Recipient Roles

Test:

```text
authorized management/operations recipient
→ eligible

Customer/Renter
→ never recipient
```

Test exact final role rules chosen after inspection.

---

# API / UI

Test:

- `/api/notifications` returns new types to intended recipient;
- unread count includes them;
- mark-read still works;
- Maintenance notification routes correctly;
- Low Availability notification routes correctly;
- existing notification routes remain unchanged.

---

# Failure Handling

If condition evaluation partially fails:

do not generate a misleading "healthy" or resolved state.

Prefer:

```text
evaluation failed
→ preserve prior condition state
→ report/log processing failure safely
```

Do not resolve a condition simply because a database query failed.

---

# Concurrency

Where practical, protect against two processing runs generating duplicate notifications simultaneously.

Prefer:

- unique condition-state constraint;
- transaction/RPC;
- idempotent upsert;

over a pure:

```text
SELECT then INSERT
```

race.

---

# Security

Do not expose:

- service role keys;
- provider secrets;
- private notification preferences of other users.

Condition processing must be server-held.

---

# Validation

Run at minimum:

```text
notification-focused tests
notification preference tests
maintenance readiness tests
dashboard/availability helper tests if changed
reminder-processing regression tests
npm run build
focused lint
git diff --check
```

Repository-wide unrelated lint debt is not a blocker.

---

# Manuscript Post-Implementation Review

After implementation report:

1. exact new notification types;
2. exact recipients;
3. preference mapping;
4. maintenance condition definition;
5. low-availability definition;
6. low-availability threshold and whether provisional;
7. dedupe/recovery semantics;
8. processing cadence/trigger;
9. MIC-019 closure status;
10. manuscript wording needing revision.

Do not edit the Proposal Paper during the implementation session.

---

# Definition of Done

VS028 is complete when:

- maintenance-attention notifications exist;
- low-availability notifications exist;
- both use canonical condition logic;
- both are server-generated;
- both are recipient-specific;
- customer recipients are excluded;
- preferences are respected;
- unchanged conditions do not spam;
- resolved then recurring conditions can alert again;
- Notifications UI renders/routes them correctly;
- existing notification types remain intact;
- no Brevo/email work is introduced.

---

# Stop Rule

Stop after VS028.

Do not implement:

- VS029;
- Brevo delivery;
- email templates;
- report export;
- backup/recovery;
- financial settlement/refund subsystem;
- CQ-028;
- CQ-029;
- CQ-030;
- CQ-031;
- CQ-032.