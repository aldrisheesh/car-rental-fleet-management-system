# Vertical Slice 020 — Scheduled Booking and Rental Reminders

**Status:** Approved for implementation
**Objective:** Extend the canonical VS019 in-app notification system with deterministic scheduled reminders for upcoming pickups, upcoming returns, and overdue active rentals using Asia/Manila timing, provider-neutral processing, and existing notification deduplication.

## Purpose

VS019 established event-driven awareness:

```text
Business transition
→ canonical notification
→ recipient
→ unread/read
```

VS020 adds time-driven awareness:

```text
Canonical booking / rental
→ trusted current Manila time
→ reminder becomes due
→ deterministic reminder processor
→ canonical VS019 notification
→ recipient
```

VS020 must not alter booking or rental lifecycle state.

## Required Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `engineering/sprints/VERTICAL-SLICE-020.md`
- `codex-context/08-notifications-and-audit.md`
- `codex-context/28-scheduled-booking-rental-reminders.md`
- `codex-context/25-canonical-subsystem-map.md`

Do not read other context files unless a concrete blocker requires them.

## Strict Initial Inspection

Inspect only:

1. canonical VS019 notification persistence / helper / API;
2. latest migration affecting the `notifications` table and notification types;
3. canonical booking fields needed for:
   - booking status;
   - scheduled pickup;
   - customer;
4. canonical rental fields needed for:
   - `started_at`;
   - `scheduled_return_at`;
   - `ended_at`;
   - booking/customer linkage;
5. `src/lib/business-time.ts`;
6. the smallest server-only route/function suitable for a trusted reminder processor.

Do not inspect:

- requirements;
- payments;
- Finder;
- forecasting;
- supply;
- allocation;
- maintenance;
- reports;
- external context;

unless one exact compile/runtime dependency requires it.

Do not read previous vertical-slice contracts.

## Scope

VS020 implements exactly:

1. one upcoming pickup reminder;
2. one upcoming return reminder;
3. recurring daily overdue reminder;
4. trusted reminder processor;
5. canonical reminder notification types;
6. deterministic recipient/event-key generation;
7. optional thin scheduler invocation wrapper if the deployment architecture supports it naturally.

VS020 does not implement:

- maintenance reminders;
- low-availability / shortage alerts;
- Operations Staff reminders;
- Brevo;
- email;
- SMS;
- push;
- notification preferences;
- late-fee calculation;
- audit logs.

## Researcher-Designed Timing

These timings are **PROVISIONAL / RESEARCHER-DESIGNED**:

- pickup reminder: 24 hours before scheduled pickup;
- return reminder: 24 hours before scheduled return;
- overdue reminder:
  - first eligible processor execution after scheduled return passes;
  - then at most one notification per Asia/Manila calendar day while the rental remains physically open.

Do not represent these timings as Briah-confirmed.

## Canonical Business Time

All reminder eligibility must be deterministic with respect to Asia/Manila operational time.

Use canonical timestamp instants.

Reuse:

`src/lib/business-time.ts`

where Manila calendar conversion is required.

Do not depend on:

- browser timezone;
- deployment server timezone;
- `process.env.TZ`;
- exact scheduler execution minute.

## Trusted Now

Core reminder calculation must accept/inject a trusted `now` instant for deterministic tests.

Production invocation may supply actual server current time.

Do not read current time independently throughout multiple functions when one processing snapshot can be used.

## Due Semantics

A reminder becomes eligible when:

```text
due_at <= now
```

and all canonical lifecycle conditions still hold.

Do not require:

```text
now == due_at
```

A reminder must still be generated when the processor runs late, provided the intended event is still meaningful.

## Notification Aggregate

Reuse the canonical VS019:

`notifications`

table.

Do not create a generic `reminders` table in VS020 merely to remember that a notification was sent.

Existing:

```text
unique(recipient_id, event_key)
```

is the baseline exactly-once guarantee per logical reminder.

## Notification Types

Extend canonical notification type constraints through a **NEW additive migration** where necessary.

Add stable types equivalent to:

- `upcoming_pickup`
- `upcoming_return`
- `rental_overdue`

Do not rewrite the VS019 notification migration.

## REM-001 / REM-002 — Upcoming Pickup

### Eligibility

A booking qualifies only when:

- it is in the canonical confirmed/pre-release state in which a pickup is still expected;
- scheduled pickup is still in the future;
- `pickup_at - 24 hours <= now`;
- rental has not already started;
- booking has not moved into a terminal/non-proceeding state.

Use existing canonical states.

Do not invent new booking statuses.

### Recipients

- booking Customer/Renter;
- all ACTIVE Owner/Admin users at processing time.

Do not notify Operations Staff in VS020.

### Event Key

One logical reminder per recipient:

```text
pickup-reminder:<booking-id>:24h
```

Equivalent stable naming is acceptable.

Because recipient is independently covered by notification uniqueness, do not unnecessarily include recipient ID in the logical base key unless repository conventions favor it.

### Late Processor Behavior

Example:

```text
Pickup:
Sep 5 10:00

Reminder due:
Sep 4 10:00

Processor first runs:
Sep 4 15:00
```

The reminder must still be created.

### Stale Reminder Prevention

If processor first sees the record after pickup time:

do not create an “upcoming pickup” notification.

If rental already began early:

do not create pickup reminder.

## REM-003 / REM-004 — Upcoming Return

### Eligibility

Rental qualifies only when:

- rental has started;
- `ended_at IS NULL`;
- scheduled return is still in the future;
- `scheduled_return_at - 24 hours <= now`.

### Recipients

- rental/booking Customer/Renter;
- all ACTIVE Owner/Admin.

### Event Key

```text
return-reminder:<rental-id>:24h
```

### Physical Return Boundary

If `ended_at` exists before reminder processing:

do not create an upcoming-return reminder.

Do not infer return merely because scheduled return time has passed.

## REM-005 / REM-006 — Overdue Rental

### Eligibility

Rental qualifies when:

- rental has started;
- `ended_at IS NULL`;
- `now > scheduled_return_at`.

### Daily Recurrence

Create at most one overdue notification per recipient for each Asia/Manila calendar date while the rental remains overdue.

Derive:

```text
manila_date(now)
```

and use:

```text
overdue-rental:<rental-id>:<YYYY-MM-DD>
```

Example:

```text
Sep 5 Manila:
one overdue reminder.

Repeated processing Sep 5:
no duplicate.

Sep 6 Manila and still open:
one new reminder.
```

### Stop Condition

Once:

```text
ended_at IS NOT NULL
```

no future overdue reminders.

## Overdue Copy / Fee Boundary

Do not calculate or state a penalty.

Suitable customer wording:

> Your rental is overdue. Please contact Briah's regarding the vehicle return.

Suitable Owner/Admin wording:

> A rental is overdue and has not yet been recorded as returned.

Do not state:

> PHP 3,000 is due.

because CQ-029 remains unresolved.

## Active Owner/Admin Expansion

At processing time, resolve all profiles where:

- `user_type = Owner/Admin`;
- `account_status = Active`.

Create one recipient-specific row each.

Inactive Owner/Admin receive no new reminder.

Historical notifications remain untouched if an account later becomes inactive.

## Operations Staff Boundary

Do not add Operations Staff recipients.

Their operational notification needs remain subject to later role/UX validation.

Do not modify Operations Staff permissions.

## Reminder Processor Architecture

Create a provider-neutral core/server boundary.

Recommended conceptual layers:

1. pure reminder eligibility/event derivation;
2. canonical data loader/server integration;
3. notification insertion;
4. thin trusted invocation route/function.

Do not put all reminder logic inside a Vercel-specific handler.

## Processor Result

Return a small safe internal processing summary, for example:

- processed candidate count;
- created count;
- deduplicated/already-existing count where useful;
- failure count where useful.

Do not expose customer-sensitive detail in a public response.

## Invocation Security

Reminder processing is an internal trusted operation.

Normal browser-authenticated:

- Customer/Renter;
- Owner/Admin;
- Operations Staff

must not be able to arbitrarily invoke it simply because they are logged in.

Use an existing appropriate internal/server secret boundary.

Do not expose:

- Supabase service role key;
- scheduler secret;
- deployment secret

to the browser.

## Scheduler Boundary

If the repository/deployment architecture already provides an obvious cron/scheduled invocation mechanism, add only the smallest thin wrapper/configuration necessary.

The canonical reminder processor must remain independently testable.

If production scheduling cannot be configured safely in the current environment:

- implement and validate the processor;
- mark actual production scheduler wiring `BLOCKED`;
- do not fake success.

Do not add multiple scheduler providers.

## Concurrency

Assume two reminder processor executions may overlap.

Do not rely only on:

```text
SELECT
→ if not exists
→ INSERT
```

without canonical uniqueness protection.

Use deterministic event keys plus the existing notification uniqueness constraint and conflict-safe insertion.

Concurrent runs must result in one logical reminder per recipient/event.

## Failure Isolation

One stale or invalid candidate should not mutate lifecycle state.

The reminder engine:

- reads canonical state;
- derives reminders;
- inserts notifications.

It must not:

- confirm bookings;
- start rentals;
- end rentals;
- modify scheduled return;
- impose charges.

## Related Entity Linkage

Upcoming pickup:

- relate to booking.

Upcoming return/overdue:

- relate to rental or booking, whichever integrates cleanly with existing canonical notification navigation.

Do not expose private renter information in message text.

## Notifications UI

No new UI page is needed.

VS019 canonical Notifications UI should display the new reminder types automatically or with a small type/icon/navigation extension.

Do not redesign the page.

Do not add a separate “Reminders” page.

## Navigation

Where the existing notification component maps entity/type to an existing safe route, extend only what is necessary for:

- pickup;
- return;
- overdue.

Do not create unrelated new routes.

## No External Delivery

Do not call or configure:

- Brevo;
- SMTP;
- React Email;
- SMS;
- push.

VS020 remains in-app-only.

## No Maintenance Awareness

Do not implement:

- PMS reminders;
- odometer reminders;
- maintenance-due notification.

That belongs to a later slice.

## No Low-Availability Alert

Do not implement a generic scheduled vehicle-count warning.

Future shortage awareness should be designed around canonical VS015 supply evaluation behavior.

## No Audit

Reminder notifications are not audit records.

Do not implement audit logging in VS020.

## Testing

Add focused tests.

### Pickup

- more than 24h before pickup → not due;
- exactly/inside 24h → due;
- processor late but pickup still future → due;
- repeated processing → no duplicate;
- pickup already passed → no upcoming reminder;
- rental already started → no reminder;
- terminal/non-proceeding booking → no reminder;
- active Owner/Admin receives;
- inactive Owner/Admin excluded.

### Return

- more than 24h before return → not due;
- inside 24h → due;
- late processor while return still future → due;
- repeat → no duplicate;
- early physical return → no reminder;
- rental not started → no reminder.

### Overdue

- before scheduled return → not overdue;
- after scheduled return → due;
- same Manila date repeated processing → no duplicate;
- next Manila calendar date → another reminder;
- Manila date boundary correct;
- ended rental → no later reminder.

### Authorization / Safety

- customer reminder belongs only to booking/rental customer;
- active Owner/Admin recipient expansion;
- browser user cannot invoke trusted processor;
- processor does not mutate lifecycle;
- overdue message contains no fee;
- no Brevo/external delivery;
- no Operations Staff reminder;
- no maintenance/shortage reminder.

### Concurrency

Prove repeated/concurrent logical processing cannot create duplicate recipient/event rows.

## Provider-Backed Validation

Where configured, use disposable development data.

Validate:

1. confirmed booking >24h away → no pickup reminder;
2. injected now inside pickup window → reminders created;
3. rerun → deduplicated;
4. active rental >24h from return → no return reminder;
5. injected now inside return window → reminder;
6. overdue rental → reminder;
7. same Manila day rerun → no duplicate;
8. next Manila day → second overdue reminder;
9. set physical return → future overdue stops;
10. inactive Owner/Admin excluded;
11. reminder appears through canonical notification read API/UI;
12. no lifecycle mutation.

Provider validation cleanup must occur through validation tooling/session cleanup or explicit development cleanup commands.

Never create a provider/test cleanup production migration.

## CQ Preservation

Preserve:

- CQ-029 complete late-return charge schedule;
- CQ-031 reminder timing/client validation.

Do not implement hypothetical client timing changes.

## Definition of Done

VS020 is complete when:

- trusted provider-neutral reminder processor exists;
- 24h pickup reminder works;
- 24h return reminder works;
- daily Manila overdue recurrence works;
- timestamp/timezone handling is deterministic;
- late scheduler execution does not lose reminders;
- repeated/concurrent processing deduplicates correctly;
- Customer and active Owner/Admin recipients are correct;
- existing Notifications UI shows reminders;
- no lifecycle mutation or fee calculation occurs;
- no external delivery exists;
- no maintenance/availability/Staff reminder exists.

## Stop Rule

Stop after VS020.

Do not implement:

- VS021;
- maintenance awareness;
- shortage alerts;
- Brevo/email/SMS/push;
- late-fee logic;
- notification preferences;
- audit logging;
- Operations Staff reminders.
