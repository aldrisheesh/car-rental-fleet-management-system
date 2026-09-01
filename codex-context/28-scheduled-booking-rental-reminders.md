# Scheduled Booking and Rental Reminders
**Status:** Frozen for VS020
**Last updated:** 2026-09-02

VS020 extends VS019 in-app notifications with provider-neutral scheduled awareness for pickups, returns, and overdue rentals.

## Scope
Implement only:
- one upcoming-pickup reminder;
- one upcoming-return reminder;
- daily overdue reminders;
- trusted deterministic reminder processing;
- insertion into the existing VS019 notifications aggregate.

Exclude maintenance, low-availability, Brevo/email/SMS/push, late-fee calculation, audit, preferences, and Operations Staff reminder categories.

## Researcher-designed timing
PROVISIONAL, not client-confirmed:
- pickup: 24 hours before scheduled pickup;
- return: 24 hours before scheduled return;
- overdue: first eligible run after scheduled return, then at most once per Asia/Manila calendar day while physically unreturned.

## Business time / due semantics
Use canonical Asia/Manila operational time. Do not depend on server/browser timezone or exact cron minute.

A reminder is eligible when `due_at <= trusted_now` and its logical recipient event does not already exist.

Late scheduler execution must not lose an otherwise still-valid reminder.

## Upcoming pickup
Eligible when the booking is canonically confirmed/pre-release, pickup is still future, `pickup_at - 24h <= now`, rental has not started, and booking is not terminal/non-proceeding.

Recipients: booking customer + all ACTIVE Owner/Admin users.

One logical reminder per recipient:
`pickup-reminder:<booking-id>:24h`

If first run occurs inside the 24h window, create it. If pickup has already passed, do not create a stale upcoming reminder.

## Upcoming return
Eligible when rental has started, `ended_at IS NULL`, scheduled return is future, and `scheduled_return_at - 24h <= now`.

Recipients: customer + all ACTIVE Owner/Admin.

One logical reminder:
`return-reminder:<rental-id>:24h`

Early physical return prevents reminder creation.

## Overdue
Eligible when rental has started, `ended_at IS NULL`, and trusted now is later than `scheduled_return_at`.

Recipients: customer + all ACTIVE Owner/Admin.

At most one per recipient per Manila calendar date:
`overdue-rental:<rental-id>:<YYYY-MM-DD-Manila>`

Same-day reruns deduplicate; next Manila date may create another if still overdue. Once `ended_at` exists, stop.

## Fee boundary
Never calculate/assert a late fee. Safe meaning: `Your rental is overdue. Please contact Briah's regarding the vehicle return.` CQ-029 remains open.

## Persistence / concurrency
Reuse VS019 `notifications`; no separate reminders table is required. Correctness relies on deterministic event keys plus canonical `(recipient_id,event_key)` uniqueness. Concurrent processor runs must not duplicate reminders.

## Reminder processor
Create a trusted provider-neutral processor:
scheduled/manual invocation -> query due canonical records -> derive events -> expand recipients -> insert missing notifications -> safe summary.

Make trusted `now` injectable for deterministic tests/provider validation.

Keep hosting scheduler invocation as a thin wrapper. If production scheduler configuration is unavailable, report deployment scheduling BLOCKED without compromising processor correctness.

## Authorization
Normal Customer, Owner/Admin, and Operations Staff browser sessions cannot invoke arbitrary processing. Keep the processor server-only/trusted.

## Existing UI
Reminders appear through the existing VS019 Notifications UI. No new reminder page.

Stable types may be `upcoming_pickup`, `upcoming_return`, `rental_overdue`.

## Testing
Test pickup outside/inside 24h, repeated run, passed pickup, already-started rental, terminal booking, active/inactive Admin expansion.

Test return outside/inside 24h, repeat, early return, open-rental eligibility.

Test overdue before due, first after due, same Manila day dedupe, next Manila day recurrence, physical return stop, Manila date boundary.

Also test privacy, concurrency/retry dedupe, no lifecycle mutation, no fees, no Brevo, no maintenance/Staff reminders, no audit.

## Provider validation
Use disposable development data. Cleanup through validation tooling/session cleanup or explicit development cleanup commands; never production migrations.

## Client validation
Ask: `For pickup and return reminders, the current researcher-designed baseline is one day before the scheduled time. Is that enough for your operation, or would you prefer another lead time?`

## Definition of Done
Provider-neutral processor exists; 24h pickup/return and daily overdue work; Manila timing is deterministic; missed exact cron minute is safe; retries deduplicate; Customer + active Owner/Admin recipients are correct; existing Notifications UI displays reminders; no fee/lifecycle mutation/external delivery/maintenance/supply reminder exists.

## Stop Rule
Stop after VS020. Do not implement VS021, maintenance/availability alerts, Brevo, late fees, audit, preferences, or Operations Staff reminders.
