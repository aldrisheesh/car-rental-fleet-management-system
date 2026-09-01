# Open Decisions
**Status:** Active
**Last updated:** 2026-09-02

## Notifications / reminders
VS019 event-driven notifications are frozen. VS020 scheduled booking/rental semantics are frozen in `28-scheduled-booking-rental-reminders.md`.

PROVISIONAL: pickup lead=24h; return lead=24h; overdue recurrence=once per Asia/Manila calendar day. Client validation may adjust these without redesigning the architecture.

Deferred: maintenance awareness, low-availability alerts, Brevo/email/SMS/push, preferences, escalation/retention.

## Audit
System-wide audit remains separate/pending.

## Finder/context
VS017/VS018 frozen. CQ-028 exact restricted-area rules remain open.

## Late return
PHP 3,000 for <6h is only partially confirmed. CQ-029 remains open; VS020 must not calculate/assert it.

## Tie-up / allocation
CQ-030 tie-up and CQ-017/CQ-026 transfer boundaries remain open.
